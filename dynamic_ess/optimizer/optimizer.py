import logging
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

import pyomo.environ as pyo
from pyomo.opt import SolverFactory

from dynamic_ess.db import Database

logger = logging.getLogger(__name__)


@dataclass
class BatteryConfig:
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
    return (
        2.43326342680815e-2 * p
        + 1.41038332692784e-2 * p**2
        + 4.16335950406618e-3 * p**3
    )


def inverter_loss_kw(grid_power_kw: float) -> float:
    """Calculate inverter loss in kW given grid output power in kW.

    The inverter loss is the additional power drawn from battery beyond what goes to grid.
    battery_power = grid_power + inverter_loss
    """
    p = abs(grid_power_kw)
    return 1.992198656282844e-2 * p**2 + 8.142966987508347e-4 * p**3


def charging_efficiency(battery_power_kw: float) -> float:
    """Calculate charging efficiency: battery_power / grid_power."""
    if battery_power_kw <= 0:
        return 0.0
    loss = charger_loss_kw(battery_power_kw)
    grid_power = battery_power_kw + loss
    return battery_power_kw / grid_power


def discharging_efficiency(battery_power_kw: float) -> float:
    """Calculate discharging efficiency: grid_power / battery_power.

    Note: We need to solve for grid_power given battery_power.
    battery_power = grid_power + inverter_loss(grid_power)
    """
    if battery_power_kw <= 0:
        return 1.0
    # Iteratively solve for grid_power (Newton-like iteration)
    grid_power = battery_power_kw * 0.95  # Initial guess
    for _ in range(10):
        loss = inverter_loss_kw(grid_power)
        grid_power = battery_power_kw - loss
        if grid_power <= 0:
            return 0.0
    return grid_power / battery_power_kw


def buy_price(market_price: float) -> float:
    return (market_price + 0.01653 + 0.1088) * 1.21


def sell_price(market_price: float) -> float:
    return (market_price + 0.01653 + 0.1088) * 1.21


def cost_at_t(model, t):
    power_into_battery = model.charge_power[t] + charger_loss_kw(model.charge_power[t]) - model.discharge_power[t]
    return power_into_battery * buy_price(model.price[t])


class Optimizer:
    """Optimizes charge/discharge schedule based on prices and constraints using Pyomo."""

    def __init__(self, db: Database, area: str, battery: BatteryConfig):
        self.db = db
        self.area = area
        self.battery = battery

    def optimize(self) -> list[tuple[datetime, datetime, int, int]]:
        """Generate optimal charge schedule using linear programming.

        The optimization minimizes electricity cost while respecting battery constraints.
        The value of energy remaining in the battery is accounted for using the
        average price from the last 7 days.

        Returns:
            List of (start_time, end_time, power_w, expected_soc) tuples.
            power_w > 0 means charging, < 0 means discharging.
        """

        def soc_update_rule(model, t):
            if t == model.T.at(-1):
                # Skip this for the last time step
                return pyo.Constraint.Skip

            multiplus_base_power = 0.020

            return (
                    model.battery_charge[t + 1] == model.battery_charge[t]
                    + model.charge_power[t]
                    - (model.discharge_power[t] + inverter_loss_kw(model.discharge_power[t]))
                    - multiplus_base_power
            )

        now = datetime.now(timezone.utc)

        # Get current SOC
        current_soc = self.db.get_current_soc()
        if current_soc is None:
            logger.warning("No SOC data available, assuming 50%")
            current_soc = 50

        # Get average price from last 7 days as the "value" of stored energy
        week_ago = now - timedelta(days=7)
        avg_price = self.db.get_average_price(self.area, week_ago, now)
        if avg_price is None:
            logger.warning("No historical price data, cannot optimize")
            return []

        # Convert to EUR/kWh
        avg_price_kwh = avg_price / 1000.0
        logger.info(f"Average price (last 7 days): {avg_price_kwh:.4f} EUR/kWh")

        # Get hourly prices for the planning horizon
        start_hour = now.replace(minute=0, second=0, microsecond=0)
        end_hour = start_hour + timedelta(hours=36)
        hourly_prices = self.db.get_hourly_prices(self.area, start_hour, end_hour)

        if not hourly_prices:
            logger.warning("No future price data available")
            return []

        # Filter out past hours
        hourly_prices = [(t, p) for t, p in hourly_prices if t + timedelta(hours=1) > now]

        if not hourly_prices:
            logger.warning("No future hours to optimize")
            return []

        n_hours = len(hourly_prices)
        times = [t for t, _ in hourly_prices]
        prices = {t: p for t, (_, p) in enumerate(hourly_prices)}  # EUR/kWh

        logger.info(f"Optimizing for {n_hours} hours starting at {times[0]}")

        # Calculate efficiencies at max power (linearized)
        charge_eff = charging_efficiency(self.battery.max_charge_power_kw)
        discharge_eff = discharging_efficiency(self.battery.max_discharge_power_kw)

        logger.info(f"Charging efficiency: {charge_eff:.1%}, Discharging efficiency: {discharge_eff:.1%}")

        # Build Pyomo model
        model = pyo.ConcreteModel()

        # Create input parameters
        model.T = pyo.RangeSet(0, n_hours - 1)
        model.price = pyo.Param(model.T, initialize=prices, mutable=False)

        # Create variables to optimize for the model
        model.charge_power = pyo.Var(model.T, bounds=(0, self.battery.max_charge_power_kw))
        model.discharge_power = pyo.Var(model.T, bounds=(0, self.battery.max_discharge_power_kw))
        model.battery_charge = pyo.Var(model.T, bounds=(
            self.battery.capacity_kwh * self.battery.min_soc / 100,
            self.battery.capacity_kwh * self.battery.max_soc / 100
        ))

        # Make sure the battery SoC at the end is the same as the current SoC. Otherwise,
        # the battery will be drained to optimize costs which is not what we want.
        battery_capacity_remaining = self.battery.capacity_kwh * current_soc / 100
        model.battery_charge[0].fix(battery_capacity_remaining)
        model.battery_charge[n_hours - 1].fix(battery_capacity_remaining)

        model.soc_update = pyo.Constraint(model.T, rule=soc_update_rule)

        model.cost = pyo.Objective(rule=lambda m: sum(cost_at_t(model, t) for t in m.T), sense=pyo.minimize)

        solver = SolverFactory("ipopt")
        solver.options["linear_solver"] = "mumps"
        result = solver.solve(model)

        if result.solver.termination_condition != pyo.TerminationCondition.optimal:
            logger.error(f"Optimization failed: {result.solver.termination_condition}")
            return []

        total_cost = pyo.value(model.cost)
        logger.info(f"Optimization solved: cost = {total_cost:.4f} EUR")

        # Extract schedule
        schedule = []
        for t in model.T:
            hour_start = times[t]
            hour_end = hour_start + timedelta(hours=1)

            charge_power = pyo.value(model.charge_power[t])
            if charge_power < 1:
                charge_power = 0
            else:
                charge_power += charger_loss_kw(charge_power)
            discharge_power = pyo.value(model.discharge_power[t])
            discharge_power = discharge_power if discharge_power >= 0.001 else 0

            soc_val = pyo.value(model.battery_charge[t]) / self.battery.capacity_kwh * 100,

            # Determine action (use small threshold to avoid noise)
            if charge_power > 0.01:
                power_kw = charge_power  # Positive = charging
                action = "charge"
            elif discharge_power > 0.01:
                power_kw = -discharge_power  # Negative = discharging
                action = "discharge"
            else:
                continue  # No action this hour

            power_w = int(power_kw * 1000)
            expected_soc = int(soc_val[0])

            schedule.append((hour_start, hour_end, power_w, expected_soc))
            logger.debug(
                f"{hour_start.strftime('%H:%M')} {action:10} "
                f"{abs(power_kw):.2f}kW @ {pyo.value(model.price[t]):.4f} EUR/kWh -> SOC={expected_soc}%"
            )

        logger.info(f"Generated schedule with {len(schedule)} entries")
        return schedule
