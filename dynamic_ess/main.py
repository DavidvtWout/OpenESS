import argparse
import logging
import signal
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

from dynamic_ess.config import Config
from dynamic_ess.db import Database
from dynamic_ess.entsoe_api import EntsoeClient
from dynamic_ess.victron_modbus import VictronClient
from dynamic_ess.victron_modbus.registers import System, VEBus

logger = logging.getLogger(__name__)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)


def fetch_missing_prices(db: Database, entsoe: EntsoeClient, area: str):
    now = datetime.now(timezone.utc)
    end_of_tomorrow = (now + timedelta(days=2)).replace(hour=0, minute=0, second=0, microsecond=0)

    latest = db.get_latest_price_time(area)
    if latest is None:
        fetch_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        fetch_start -= timedelta(days=14)
    elif latest >= end_of_tomorrow:
        return
    else:
        fetch_start = latest

    logger.info(f"Fetching prices for {area} from {fetch_start} to {end_of_tomorrow}")
    prices = entsoe.fetch_day_ahead_prices(fetch_start, end_of_tomorrow)
    if prices:
        db.insert_prices(area, prices)


def collect_and_store_measurements(victron: VictronClient, db: Database, timestamp: datetime) -> None:
    """Collect all measurements from Victron and store in database."""
    config = victron.config

    # Determine active phases from first VEBus device (or default to 3)
    if config.vebus_ids:
        active_phases = victron.get_active_phases(config.vebus_ids[0])
    else:
        active_phases = [1, 2, 3]

    # Read System registers
    system_regs = [
        # Per-phase
        System.AC_CONSUMPTION_L1,
        System.AC_CONSUMPTION_L2,
        System.AC_CONSUMPTION_L3,
        System.GRID_L1,
        System.GRID_L2,
        System.GRID_L3,
        System.GRID_TO_MULTIPLUS_POWER_L1,
        System.GRID_TO_MULTIPLUS_POWER_L2,
        System.GRID_TO_MULTIPLUS_POWER_L3,
        System.MULTIPLUS_OUTPUT_POWER_L1,
        System.MULTIPLUS_OUTPUT_POWER_L2,
        System.MULTIPLUS_OUTPUT_POWER_L3,
        # Non-phase (battery/system)
        System.BATTERY_POWER,
        System.BATTERY_SOC,
        System.CHARGER_POWER,
        System.DC_SYSTEM_POWER,
        System.INVERTER_CHARGER_POWER,
    ]
    system_values = victron.read_many(config.system_id, system_regs)

    # Build per-phase system measurements
    phase_data = {
        1: {
            "ac_consumption": _to_int(system_values.get(System.AC_CONSUMPTION_L1)),
            "grid_power": _to_int(system_values.get(System.GRID_L1)),
            "grid_to_multiplus": _to_int(system_values.get(System.GRID_TO_MULTIPLUS_POWER_L1)),
            "multiplus_output": _to_int(system_values.get(System.MULTIPLUS_OUTPUT_POWER_L1)),
        },
        2: {
            "ac_consumption": _to_int(system_values.get(System.AC_CONSUMPTION_L2)),
            "grid_power": _to_int(system_values.get(System.GRID_L2)),
            "grid_to_multiplus": _to_int(system_values.get(System.GRID_TO_MULTIPLUS_POWER_L2)),
            "multiplus_output": _to_int(system_values.get(System.MULTIPLUS_OUTPUT_POWER_L2)),
        },
        3: {
            "ac_consumption": _to_int(system_values.get(System.AC_CONSUMPTION_L3)),
            "grid_power": _to_int(system_values.get(System.GRID_L3)),
            "grid_to_multiplus": _to_int(system_values.get(System.GRID_TO_MULTIPLUS_POWER_L3)),
            "multiplus_output": _to_int(system_values.get(System.MULTIPLUS_OUTPUT_POWER_L3)),
        },
    }
    filtered_phases = {p: phase_data[p] for p in active_phases}
    db.insert_system_measurements(timestamp, filtered_phases)

    # Battery measurements
    battery_data = {
        "battery_power": _to_int(system_values.get(System.BATTERY_POWER)),
        "battery_soc": _to_int(system_values.get(System.BATTERY_SOC)),
        "charger_power": _to_int(system_values.get(System.CHARGER_POWER)),
        "dc_system_power": _to_int(system_values.get(System.DC_SYSTEM_POWER)),
        "inverter_charger_power": _to_int(system_values.get(System.INVERTER_CHARGER_POWER)),
    }
    db.insert_battery_measurement(timestamp, battery_data)

    # VEBus registers for each device
    vebus_regs = [
        VEBus.AC_INPUT_POWER_L1,
        VEBus.AC_INPUT_POWER_L2,
        VEBus.AC_INPUT_POWER_L3,
        VEBus.AC_OUTPUT_POWER_L1,
        VEBus.AC_OUTPUT_POWER_L2,
        VEBus.AC_OUTPUT_POWER_L3,
        # Energy counters
        VEBus.ENERGY_AC_IN1_TO_AC_OUT,
        VEBus.ENERGY_AC_IN1_TO_INVERTER,
        VEBus.ENERGY_AC_IN2_TO_AC_OUT,
        VEBus.ENERGY_AC_IN2_TO_INVERTER,
        VEBus.ENERGY_AC_OUT_TO_AC_IN1,
        VEBus.ENERGY_AC_OUT_TO_AC_IN2,
        VEBus.ENERGY_INVERTER_TO_AC_IN1,
        VEBus.ENERGY_INVERTER_TO_AC_IN2,
        VEBus.ENERGY_INVERTER_TO_AC_OUT,
        VEBus.ENERGY_AC_OUT_TO_INVERTER,
    ]

    for vebus_id in config.vebus_ids:
        vebus_values = victron.read_many(vebus_id, vebus_regs)
        device_phases = victron.get_active_phases(vebus_id)

        # Per-phase power measurements
        vebus_phase_data = {
            1: {
                "ac_input_power": vebus_values.get(VEBus.AC_INPUT_POWER_L1),
                "ac_output_power": vebus_values.get(VEBus.AC_OUTPUT_POWER_L1),
            },
            2: {
                "ac_input_power": vebus_values.get(VEBus.AC_INPUT_POWER_L2),
                "ac_output_power": vebus_values.get(VEBus.AC_OUTPUT_POWER_L2),
            },
            3: {
                "ac_input_power": vebus_values.get(VEBus.AC_INPUT_POWER_L3),
                "ac_output_power": vebus_values.get(VEBus.AC_OUTPUT_POWER_L3),
            },
        }
        filtered_vebus = {p: vebus_phase_data[p] for p in device_phases}
        db.insert_vebus_measurements(timestamp, vebus_id, filtered_vebus)

        # Energy counters
        energy_data = {
            "energy_ac_in1_to_ac_out": vebus_values.get(VEBus.ENERGY_AC_IN1_TO_AC_OUT),
            "energy_ac_in1_to_battery": vebus_values.get(VEBus.ENERGY_AC_IN1_TO_INVERTER),
            "energy_ac_in2_to_ac_out": vebus_values.get(VEBus.ENERGY_AC_IN2_TO_AC_OUT),
            "energy_ac_in2_to_battery": vebus_values.get(VEBus.ENERGY_AC_IN2_TO_INVERTER),
            "energy_ac_out_to_ac_in1": vebus_values.get(VEBus.ENERGY_AC_OUT_TO_AC_IN1),
            "energy_ac_out_to_ac_in2": vebus_values.get(VEBus.ENERGY_AC_OUT_TO_AC_IN2),
            "energy_battery_to_ac_in1": vebus_values.get(VEBus.ENERGY_INVERTER_TO_AC_IN1),
            "energy_battery_to_ac_in2": vebus_values.get(VEBus.ENERGY_INVERTER_TO_AC_IN2),
            "energy_battery_to_ac_out": vebus_values.get(VEBus.ENERGY_INVERTER_TO_AC_OUT),
            "energy_ac_out_to_battery": vebus_values.get(VEBus.ENERGY_AC_OUT_TO_INVERTER),
        }
        db.insert_vebus_energy(timestamp, vebus_id, energy_data)

    logger.info(f"Stored measurements at {timestamp.isoformat()}")


def _to_int(value: float | None) -> int | None:
    """Convert float to int, preserving None."""
    return int(value) if value is not None else None


def main():
    parser = argparse.ArgumentParser(
        description="Victron dynamic ESS controller - optimize charging based on day-ahead prices"
    )
    parser.add_argument(
        "--config",
        type=Path,
        required=True,
        help="Path to config file (YAML)",
    )
    args = parser.parse_args()

    config = Config.from_file(args.config)

    db = Database(config.db_path)
    entsoe = EntsoeClient(config.entsoe)
    victron = VictronClient(config.victron_gx)

    if not victron.initialize():
        logger.error(f"Could not connect to Victron GX at {victron.host}:{victron.port}")
        sys.exit(1)
    logger.info(f"Connected to Victron GX at {victron.host}:{victron.port}")

    running = True

    def shutdown(signum, frame):
        nonlocal running
        logger.info("Shutting down...")
        running = False

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    try:
        fetch_missing_prices(db, entsoe, config.entsoe.area)
    except Exception as e:
        logger.exception(f"Could not fetch prices: {e}")

    # Main polling loop
    poll_interval = config.victron_gx.poll_interval
    last_poll = 0.0

    while running:
        now = time.monotonic()

        if now - last_poll >= poll_interval:
            try:
                timestamp = datetime.now(timezone.utc)
                collect_and_store_measurements(victron, db, timestamp)
                last_poll = now
            except Exception as e:
                logger.exception(f"Error collecting measurements: {e}")

        time.sleep(0.1)

    victron.close()
    db.close()


if __name__ == "__main__":
    main()
