import logging
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from dynamic_ess.db import Database

logger = logging.getLogger(__name__)


@dataclass
class BatteryConfig:
    """Battery configuration for the optimizer."""

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
        return 1.0
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
        # battery_power = grid_power + loss, so grid_power = battery_power - loss
        grid_power = battery_power_kw - loss
        if grid_power <= 0:
            return 0.0
    return grid_power / battery_power_kw


class Optimizer:
    """Optimizes charge/discharge schedule based on prices and constraints."""

    def __init__(self, db: Database, area: str, battery: BatteryConfig):
        self.db = db
        self.area = area
        self.battery = battery

    def optimize(self) -> list[tuple[datetime, datetime, int, int]]:
        """Generate optimal charge schedule.

        Returns:
            List of (start_time, end_time, power_w, expected_soc) tuples.
            power_w > 0 means charging, < 0 means discharging.
        """
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

        # Convert to EUR/kWh for easier calculations
        avg_price_kwh = avg_price / 1000.0
        logger.info(f"Average price (last 7 days): {avg_price_kwh:.4f} EUR/kWh")

        # Get hourly prices for the next 36 hours
        start_hour = now.replace(minute=0, second=0, microsecond=0)
        end_hour = start_hour + timedelta(hours=36)
        hourly_prices = self.db.get_hourly_prices(self.area, start_hour, end_hour)

        if not hourly_prices:
            logger.warning("No future price data available")
            return []

        logger.info(f"Planning for {len(hourly_prices)} hours starting at {start_hour}")

        # Calculate efficiencies at typical power levels
        charge_eff = charging_efficiency(self.battery.max_charge_power_kw)
        discharge_eff = discharging_efficiency(self.battery.max_discharge_power_kw)

        logger.info(f"Charging efficiency at {self.battery.max_charge_power_kw:.1f}kW: {charge_eff:.1%}")
        logger.info(f"Discharging efficiency at {self.battery.max_discharge_power_kw:.1f}kW: {discharge_eff:.1%}")

        # Round-trip efficiency
        round_trip_eff = charge_eff * discharge_eff
        logger.info(f"Round-trip efficiency: {round_trip_eff:.1%}")

        # Build schedule
        schedule = []
        simulated_soc = current_soc

        for hour_start, price in hourly_prices:
            hour_end = hour_start + timedelta(hours=1)

            # Skip hours in the past
            if hour_end <= now:
                continue

            # Effective prices accounting for losses
            # When charging: we pay price, but only charge_eff of that goes to battery
            # So effective cost per kWh stored = price / charge_eff
            effective_charge_price = price / charge_eff

            # When discharging: we get price, but need to discharge (1/discharge_eff) from battery
            # So effective revenue per kWh discharged = price * discharge_eff
            effective_discharge_price = price * discharge_eff

            # Decision thresholds
            # Charge if effective_charge_price < avg_price (we're buying cheap)
            # Discharge if effective_discharge_price > avg_price (we're selling dear)

            power_kw = 0.0
            action = "hold"

            if effective_charge_price < avg_price_kwh * 0.95:  # 5% margin
                # Charging is profitable
                if simulated_soc < self.battery.max_soc:
                    power_kw = self.battery.max_charge_power_kw
                    action = "charge"
                    # Energy added to battery in this hour (kWh)
                    energy_added_kwh = power_kw * charge_eff
                    soc_increase = (energy_added_kwh / self.battery.capacity_kwh) * 100
                    simulated_soc = min(self.battery.max_soc, simulated_soc + soc_increase)

            elif effective_discharge_price > avg_price_kwh * 1.05:  # 5% margin
                # Discharging is profitable
                if simulated_soc > self.battery.min_soc:
                    power_kw = -self.battery.max_discharge_power_kw
                    action = "discharge"
                    # Energy removed from battery in this hour (kWh)
                    energy_removed_kwh = self.battery.max_discharge_power_kw
                    soc_decrease = (energy_removed_kwh / self.battery.capacity_kwh) * 100
                    simulated_soc = max(self.battery.min_soc, simulated_soc - soc_decrease)

            if power_kw != 0:
                # Convert to W for schedule storage
                power_w = int(power_kw * 1000)
                schedule.append((hour_start, hour_end, power_w, int(simulated_soc)))
                logger.debug(
                    f"{hour_start.strftime('%H:%M')} {action:10} "
                    f"price={price:.4f} eff_price={effective_charge_price if power_kw > 0 else effective_discharge_price:.4f} "
                    f"avg={avg_price_kwh:.4f} -> SOC={simulated_soc:.0f}%"
                )

        logger.info(f"Generated schedule with {len(schedule)} entries")
        return schedule
