import logging
from datetime import datetime, timedelta, timezone

import pyomo.environ as pyo
from pydantic import BaseModel
from pyomo.opt import SolverFactory

from dynamic_ess.db import Database
from dynamic_ess.pricing import PriceConfig

logger = logging.getLogger(__name__)


def predict_next_week(
    prices: list[tuple[datetime, float]],
    smoothing_hours: int = 4,
) -> list[tuple[datetime, float]]:
    """Predict future prices based on historical weekly patterns. The previous weeks are
    normalized to have the same average price as the last week. Then, the average week is
    calculated and the existing data is extended with this new average week.

    Args:
        prices:
        smoothing_hours: Number of hours to blend predicted prices with last known price

    Returns:
        List of (hour_start, predicted_price_eur_per_kwh) tuples
    """
    first_time, _ = prices[0]
    last_time, last_value = prices[-1]
    delta = last_time - first_time
    start_of_week = last_time - timedelta(weeks=delta.days // 7)

    weeks = []
    week = []
    for t, p in prices:
        if t > start_of_week:
            start_of_week += timedelta(weeks=1)
            if len(week) == 168:
                weeks.append(week)
            week = []
        week.append((t, p))
    weeks.append(week)

    # Normalize weeks and "predict" next week
    last_week_avg = sum(p for _, p in weeks[-1]) / len(weeks[-1])
    next_week = [(t + timedelta(weeks=1), 0.0) for t, _ in weeks[-1]]
    for week in weeks:
        week_avg = sum(p for _, p in week) / len(week)
        factor = last_week_avg / week_avg
        for i, (t, p) in enumerate(week):
            next_week[i] = (next_week[i][0], next_week[i][1] + p * factor)
    for i, (t, p) in enumerate(next_week):
        next_week[i] = (t, p / len(weeks))

    # Smoothing
    for i in range(smoothing_hours):
        smoothing_factor = (i + 1) / smoothing_hours
        t, p = next_week[i]
        next_week[i] = (t, last_value * smoothing_factor + p * (1 - smoothing_factor))

    return next_week


class BatteryConfig(BaseModel):
    capacity_kwh: float  # Total battery capacity in kWh
    max_charge_power_kw: float  # Maximum charge power in kW
    max_discharge_power_kw: float  # Maximum discharge power in kW
    min_soc: int = 10  # Minimum SOC in %
    max_soc: int = 100  # Maximum SOC in %


def charger_loss_kw(battery_power_kw: float) -> float:
    """Calculate charger loss in kW given battery charging power in kW.

    The charger loss is the additional power drawn from grid beyond what goes into the battery.
    grid_power = battery_power + charger_loss
    """
    p = abs(battery_power_kw)
    return 2.433263426e-2 * p + 1.410383326e-2 * p**2 + 4.163359504e-3 * p**3


def inverter_loss_kw(grid_power_kw: float) -> float:
    """Calculate inverter loss in kW given grid output power in kW.

    The inverter loss is the additional power drawn from battery beyond what goes to grid.
    battery_power = grid_power + inverter_loss
    """
    p = abs(grid_power_kw)
    return 1.99219865628e-2 * p**2 + 8.1429669875e-4 * p**3


class Optimizer:
    """Optimizes charge/discharge schedule based on prices and constraints using Pyomo."""

    def __init__(self, db: Database, prices: PriceConfig, battery: BatteryConfig):
        self.db = db
        self.prices = prices
        self._battery_config = battery

    def optimize(self) -> list[tuple[datetime, datetime, int, int]]:
        """Generate optimal charge schedule using linear programming.

        The optimization minimizes electricity cost while respecting battery constraints.
        The value of energy remaining in the battery is accounted for using the
        average price from the last 7 days.

        Returns:
            List of (start_time, end_time, power_w, expected_soc) tuples.
            power_w > 0 means charging, < 0 means discharging.
        """
        # Capture price functions for use in nested function
        buy_price_fn = self.prices.buy_price
        sell_price_fn = self.prices.sell_price

        def cost_at_t(model, t):
            charge_from_grid = model.charge_power[t] + charger_loss_kw(model.charge_power[t])
            discharge_to_grid = model.discharge_power[t] + inverter_loss_kw(model.discharge_power[t])
            return charge_from_grid * buy_price_fn(model.market_price[t]) - discharge_to_grid * sell_price_fn(
                model.market_price[t]
            )

        def soc_start_update_rule(model, t):
            if t == model.T.at(-1):
                # Skip this for the last time step
                return pyo.Constraint.Skip
            return model.soc_start[t + 1] == model.soc_end[t]

        def soc_end_update_rule(model, t):
            multiplus_base_power = 0.020
            total_power = model.charge_power[t] - model.discharge_power[t] - multiplus_base_power
            soc_change = 100 * total_power / self._battery_config.capacity_kwh

            return model.soc_end[t] == model.soc_start[t] + soc_change

        # Get hourly prices for the planning horizon
        now = datetime.now(timezone.utc)
        start_hour = now.replace(minute=0, second=0, microsecond=0)
        hourly_prices = self.db.get_hourly_prices(self.prices.area, start_hour - timedelta(weeks=6))
        last_entoe_hour = hourly_prices[-1][0]
        next_week = predict_next_week(hourly_prices)
        hourly_prices.extend(next_week)

        # Filter out past hours
        hourly_prices = [(t, p) for t, p in hourly_prices if t >= start_hour]
        n_hours = len(hourly_prices)

        if not hourly_prices:
            logger.warning("No future hours to optimize")
            return []

        # Build Pyomo model
        model = pyo.ConcreteModel()

        # Create input parameters
        model.T = pyo.RangeSet(0, n_hours - 1)
        model.market_price = pyo.Param(model.T, initialize=[p for _, p in hourly_prices], mutable=False)

        # Create variables to optimize for the model
        model.charge_power = pyo.Var(model.T, bounds=(0, self._battery_config.max_charge_power_kw))
        model.discharge_power = pyo.Var(model.T, bounds=(0, self._battery_config.max_discharge_power_kw))
        model.soc_start = pyo.Var(model.T, bounds=(self._battery_config.min_soc, self._battery_config.max_soc))
        model.soc_end = pyo.Var(model.T, bounds=(self._battery_config.min_soc, self._battery_config.max_soc))

        # Make sure the battery SoC at the end is the same as the current SoC. Otherwise,
        # the battery will be drained to optimize costs which is not what we want.
        soc_at_start = self.db.get_soc_at(start_hour)
        if soc_at_start is None:
            logger.error("No SoC data available")
            return []
        model.soc_start[0].fix(soc_at_start)
        model.soc_end[n_hours - 1].fix(soc_at_start)

        model.soc_start_update = pyo.Constraint(model.T, rule=soc_start_update_rule)
        model.soc_end_update = pyo.Constraint(model.T, rule=soc_end_update_rule)

        model.cost = pyo.Objective(rule=lambda m: sum(cost_at_t(model, t) for t in m.T), sense=pyo.minimize)

        solver = SolverFactory("ipopt")
        solver.options["linear_solver"] = "mumps"
        result = solver.solve(model)

        if result.solver.termination_condition != pyo.TerminationCondition.optimal:
            logger.error(f"Optimization failed: {result.solver.termination_condition}")
            return []

        total_cost = 0

        # Extract schedule
        schedule = []
        for t in model.T:
            hour_start = hourly_prices[t][0]
            if hour_start > last_entoe_hour:
                break

            total_cost += pyo.value(cost_at_t(model, t))
            hour_end = hour_start + timedelta(hours=1)

            charge_power = pyo.value(model.charge_power[t])
            charge_power = charge_power + charger_loss_kw(charge_power) if charge_power > 0 else 0
            discharge_power = pyo.value(model.discharge_power[t])
            discharge_power = discharge_power + inverter_loss_kw(discharge_power) if discharge_power > 0 else 0

            power_w = int((charge_power - discharge_power) * 1000)
            expected_soc = int(pyo.value(model.soc_end[t]))

            schedule.append((hour_start, hour_end, power_w, expected_soc))
            logger.debug(
                f"{hour_start.strftime('%H:%M')} "
                f"C:{charge_power:.2f}kW  D:{discharge_power:.2f}kW  {pyo.value(model.market_price[t]):.4f} EUR/kWh -> SOC={pyo.value(model.soc_start[t]):.2f}-{pyo.value(model.soc_end[t]):.2f}%"
            )

        logger.info(f"Optimization solved: cost = {total_cost:.2f} EUR")

        logger.info(f"Generated schedule with {len(schedule)} entries")
        return schedule
