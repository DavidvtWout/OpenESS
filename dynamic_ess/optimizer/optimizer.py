import logging
import os
from datetime import datetime, timedelta, timezone

import pyomo.environ as pyo
from pydantic import BaseModel
from pyomo.opt import SolverFactory

from dynamic_ess.db import Database
from dynamic_ess.pricing import PriceConfig
from collections.abc import Callable

logger = logging.getLogger(__name__)

# Idle power consumption when ESS is active (kW)
IDLE_POWER_KW = 0.050


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


def charger_loss(power_kw: float) -> float:
    """Calculate charger conversion loss in kW (excluding idle power)."""
    p = abs(power_kw)
    return 4.033442157e-2 * p + 5.460366578e-3 * p**2 + 3.267407245e-3 * p**3


def inverter_loss(power_kw: float) -> float:
    """Calculate inverter conversion loss in kW (excluding idle power)."""
    p = abs(power_kw)
    return 2.83094350e-2 * p + 9.31715095e-4 * p**2 + 3.82457032e-3 * p**3


def build_piecewise_loss_points(
    max_power_kw: float,
    loss_fn: Callable[[float], float],
    n_segments: int = 30,
) -> tuple[list[float], list[float]]:
    """Build piecewise linear breakpoints for a loss function.

    The first segment (0 to 0.1 kW) captures the idle power cost with a steep slope.
    Subsequent segments approximate the conversion loss curve.

    Returns:
        (breakpoints_kw, loss_values_kw) - lists for piecewise linear approximation
    """
    # First breakpoint at 0 (no power = no loss)
    breakpoints = [0.0]
    loss_values = [0.0]

    # Second breakpoint at 0.1 kW with idle power (steep first segment)
    breakpoints.append(0.1)
    loss_values.append(IDLE_POWER_KW)

    # Remaining breakpoints follow the loss curve + idle power
    step = (max_power_kw - 0.1) / (n_segments - 1)
    for i in range(1, n_segments):
        p = 0.1 + i * step
        breakpoints.append(p)
        loss_values.append(IDLE_POWER_KW + loss_fn(p))

    return breakpoints, loss_values


class Optimizer:
    """Optimizes charge/discharge schedule based on prices and constraints using Pyomo.

    Uses piecewise linear approximation for loss functions to keep the model linear (MILP).
    The steep first segment of the loss curve embeds the idle power cost, eliminating
    the need for a separate binary variable.
    """

    def __init__(self, db: Database, price_config: PriceConfig, battery_config: BatteryConfig):
        self.db = db
        self._price_config = price_config
        self._battery_config = battery_config

    def optimize(self) -> list[tuple[datetime, datetime, int, float]]:
        """Generate optimal charge schedule using mixed-integer linear programming.

        The optimization minimizes electricity cost while respecting battery constraints.
        Loss functions are approximated with piecewise linear functions.

        Returns:
            List of (start_time, end_time, power_w, expected_soc) tuples.
            power_w > 0 means charging, < 0 means discharging.
        """
        # Get hourly prices for the planning horizon
        now = datetime.now(timezone.utc)
        start_hour = now.replace(minute=0, second=0, microsecond=0)
        hourly_prices = self.db.get_hourly_prices(self._price_config.area, start_hour - timedelta(weeks=6))

        if not hourly_prices:
            logger.warning("No price data available")
            return []

        last_entsoe_hour = hourly_prices[-1][0]
        next_week = predict_next_week(hourly_prices)
        hourly_prices.extend(next_week)

        # Filter out past hours
        hourly_prices = [(t, p) for t, p in hourly_prices if t >= start_hour]
        n_hours = len(hourly_prices)

        if not hourly_prices:
            logger.warning("No future hours to optimize")
            return []

        # Get current SOC
        soc_at_start = self.db.get_soc_at(start_hour)
        if soc_at_start is None:
            logger.error("No SoC data available")
            return []
        soc_at_start = max(soc_at_start, self._battery_config.min_soc)

        # Build piecewise linear breakpoints for loss functions
        charger_bp, charger_loss_vals = build_piecewise_loss_points(
            self._battery_config.max_charge_power_kw, charger_loss
        )
        inverter_bp, inverter_loss_vals = build_piecewise_loss_points(
            self._battery_config.max_discharge_power_kw, inverter_loss
        )

        # Capture price functions
        buy_price_fn = self._price_config.buy_price
        sell_price_fn = self._price_config.sell_price

        # Build model
        model = pyo.ConcreteModel()

        # Sets and parameters
        model.T = pyo.RangeSet(0, n_hours - 1)
        # TODO: add duration var. Or maybe simply use timestamps and calculate the timedelta in the rules?
        price_dict = {t: hourly_prices[t][1] for t in range(n_hours)}
        model.market_price = pyo.Param(model.T, initialize=price_dict)

        # Decision variables
        model.charge_power = pyo.Var(model.T, bounds=(0, self._battery_config.max_charge_power_kw))
        model.discharge_power = pyo.Var(model.T, bounds=(0, self._battery_config.max_discharge_power_kw))
        model.soc = pyo.Var(model.T, bounds=(self._battery_config.min_soc, self._battery_config.max_soc))

        # Auxiliary variables for piecewise linear losses
        max_charger_loss = charger_loss_vals[-1]
        max_inverter_loss = inverter_loss_vals[-1]
        model.charger_loss = pyo.Var(model.T, bounds=(0, max_charger_loss))
        model.inverter_loss = pyo.Var(model.T, bounds=(0, max_inverter_loss))

        # Piecewise linear constraints for losses
        model.charger_loss_pw = pyo.Piecewise(
            model.T,
            model.charger_loss,
            model.charge_power,
            pw_pts=charger_bp,
            pw_constr_type="EQ",
            f_rule=charger_loss_vals,
            pw_repn="SOS2",
        )
        model.inverter_loss_pw = pyo.Piecewise(
            model.T,
            model.inverter_loss,
            model.discharge_power,
            pw_pts=inverter_bp,
            pw_constr_type="EQ",
            f_rule=inverter_loss_vals,
            pw_repn="SOS2",
        )

        # SOC dynamics constraint
        def soc_balance_rule(model, t):
            if t == 0:
                prev_soc = soc_at_start
            else:
                prev_soc = model.soc[t - 1]

            # Energy into battery = charge_power - charger_loss
            # Energy out of battery = discharge_power + inverter_loss
            net_power = (model.charge_power[t] - model.charger_loss[t]) - (
                model.discharge_power[t] + model.inverter_loss[t]
            )
            soc_change = 100 * net_power / self._battery_config.capacity_kwh
            return model.soc[t] == prev_soc + soc_change

        model.soc_balance = pyo.Constraint(model.T, rule=soc_balance_rule)

        # Final SOC should equal starting SOC (energy neutral over horizon)
        model.final_soc = pyo.Constraint(expr=model.soc[n_hours - 1] == soc_at_start)

        # Objective: minimize cost (buy cost - sell revenue)
        def objective_rule(model):
            total = 0
            for t in model.T:
                price = model.market_price[t]
                # Cost to charge (grid power = charge + charger_loss)
                grid_charge = model.charge_power[t] + model.charger_loss[t]
                buy_cost = grid_charge * buy_price_fn(price)
                # Revenue from discharge (grid power = discharge - inverter_loss...
                # but inverter_loss is drawn from battery, so grid gets discharge_power)
                sell_revenue = model.discharge_power[t] * sell_price_fn(price)
                total += buy_cost - sell_revenue
            return total

        model.cost = pyo.Objective(rule=objective_rule, sense=pyo.minimize)

        # Solve
        logger.info("Starting MILP solver")
        cbc_executable = os.environ.get("CBC_EXECUTABLE", "cbc")
        solver = SolverFactory("cbc", executable=cbc_executable)
        result = solver.solve(model, tee=False)
        logger.info("Solver finished")

        if result.solver.termination_condition != pyo.TerminationCondition.optimal:
            logger.error(f"Optimization failed: {result.solver.termination_condition}")
            return []

        # Extract schedule
        schedule = []
        total_cost = 0.0

        for t in model.T:
            hour_start = hourly_prices[t][0]
            if hour_start > last_entsoe_hour:
                break

            hour_end = hour_start + timedelta(hours=1)
            charge_power = pyo.value(model.charge_power[t])
            discharge_power = pyo.value(model.discharge_power[t])
            power_w = int((charge_power - discharge_power) * 1000)
            expected_soc = round(pyo.value(model.soc[t]), 1)

            # Calculate cost for this hour
            price = pyo.value(model.market_price[t])
            grid_charge = charge_power + pyo.value(model.charger_loss[t])
            hour_cost = grid_charge * buy_price_fn(price) - discharge_power * sell_price_fn(price)
            total_cost += hour_cost

            schedule.append((hour_start, hour_end, power_w, expected_soc))
            logger.debug(
                f"{hour_start.strftime('%H:%M')} "
                f"C:{charge_power:.2f}kW D:{discharge_power:.2f}kW "
                f"price:{price:.4f} EUR/kWh -> SOC={expected_soc}%"
            )

        logger.info(f"Optimization solved: cost = {total_cost:.2f} EUR")
        return schedule
