import logging
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import TypedDict

from .runner import get_migrations, run_migration

logger = logging.getLogger(__name__)


def dt_to_ms(dt: datetime) -> int:
    """Convert datetime to Unix milliseconds."""
    return int(dt.timestamp() * 1000)


def ms_to_dt(ms: int) -> datetime:
    """Convert Unix milliseconds to UTC datetime."""
    return datetime.fromtimestamp(ms / 1000, tz=timezone.utc)


class SystemMeasurement(TypedDict, total=False):
    ac_consumption: int | None
    grid_power: int | None
    grid_to_multiplus: int | None
    multiplus_output: int | None


class BatteryMeasurement(TypedDict, total=False):
    battery_power: int | None
    battery_soc: int | None
    charger_power: int | None
    dc_system_power: int | None
    inverter_charger_power: int | None


class VEBusMeasurement(TypedDict, total=False):
    ac_input_power: float | None
    ac_output_power: float | None


class VEBusEnergy(TypedDict, total=False):
    energy_ac_in1_to_ac_out: float | None
    energy_ac_in1_to_battery: float | None
    energy_ac_in2_to_ac_out: float | None
    energy_ac_in2_to_battery: float | None
    energy_ac_out_to_ac_in1: float | None
    energy_ac_out_to_ac_in2: float | None
    energy_battery_to_ac_in1: float | None
    energy_battery_to_ac_in2: float | None
    energy_battery_to_ac_out: float | None
    energy_ac_out_to_battery: float | None


class Database:
    def __init__(self, db_path: Path, run_migrations: bool = True):
        db_path.parent.mkdir(parents=True, exist_ok=True)
        self._db_path = db_path
        self._conn = sqlite3.connect(db_path)
        self._conn.row_factory = sqlite3.Row
        if run_migrations:
            self._run_migrations()

    def new_connection(self) -> "Database":
        """Create a new Database instance with its own connection (for use in other threads)."""
        return Database(self._db_path, run_migrations=False)

    def _run_migrations(self):
        """Run all pending migrations."""
        self._conn.execute("""
            CREATE TABLE IF NOT EXISTS schema_version (
                version INTEGER PRIMARY KEY,
                applied_at TEXT NOT NULL
            )
        """)
        self._conn.commit()

        cursor = self._conn.execute("SELECT MAX(version) as version FROM schema_version")
        row = cursor.fetchone()
        current_version = row["version"] or 0

        for version, module_name in get_migrations():
            if version > current_version:
                logger.info(f"Running migration {version}: {module_name}")
                run_migration(version, module_name, self._conn)
                self._conn.execute(
                    "INSERT INTO schema_version (version, applied_at) VALUES (?, ?)",
                    (version, datetime.utcnow().isoformat()),
                )
                self._conn.commit()
                logger.info(f"Migration {version} complete")

    def close(self):
        self._conn.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

    # -------------------------------------------------------------------------
    # Day-ahead prices
    # -------------------------------------------------------------------------

    def insert_price(self, area: str, start_time: datetime, end_time: datetime, price: float) -> None:
        self._conn.execute(
            """
            INSERT INTO day_ahead_prices (area, start_time, end_time, price)
            VALUES (?, ?, ?, ?)
            ON CONFLICT (area, start_time) DO UPDATE SET
                end_time = excluded.end_time, price = excluded.price
            """,
            (area, dt_to_ms(start_time), dt_to_ms(end_time), price),
        )
        self._conn.commit()

    def insert_prices(self, area: str, prices: list[tuple[datetime, datetime, float]]) -> None:
        self._conn.executemany(
            """
            INSERT INTO day_ahead_prices (area, start_time, end_time, price)
            VALUES (?, ?, ?, ?)
            ON CONFLICT (area, start_time) DO UPDATE SET
                end_time = excluded.end_time, price = excluded.price
            """,
            [(area, dt_to_ms(start), dt_to_ms(end), price) for start, end, price in prices],
        )
        self._conn.commit()
        logger.debug(f"Inserted {len(prices)} price records")

    def get_prices(self, area: str, start: datetime, end: datetime) -> list[tuple[datetime, datetime, float]]:
        cursor = self._conn.execute(
            """
            SELECT start_time, end_time, price
            FROM day_ahead_prices
            WHERE area = ? AND start_time >= ? AND start_time < ?
            ORDER BY start_time
            """,
            (area, dt_to_ms(start), dt_to_ms(end)),
        )
        return [(ms_to_dt(row["start_time"]), ms_to_dt(row["end_time"]), row["price"]) for row in cursor.fetchall()]

    def get_latest_price_time(self, area: str) -> datetime | None:
        cursor = self._conn.execute(
            "SELECT MAX(end_time) as latest FROM day_ahead_prices WHERE area = ?",
            (area,),
        )
        row = cursor.fetchone()
        if row and row["latest"]:
            return ms_to_dt(row["latest"])
        return None

    # -------------------------------------------------------------------------
    # System measurements
    # -------------------------------------------------------------------------

    def insert_system_measurements(self, timestamp: datetime, phases: dict[int, SystemMeasurement]) -> None:
        ts = dt_to_ms(timestamp)
        rows = [
            (ts, phase, m.get("ac_consumption"), m.get("grid_power"), m.get("grid_to_multiplus"), m.get("multiplus_output"))
            for phase, m in phases.items()
        ]
        self._conn.executemany(
            """
            INSERT INTO system_measurements (timestamp, phase, ac_consumption, grid_power, grid_to_multiplus, multiplus_output)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT (timestamp, phase) DO UPDATE SET
                ac_consumption = excluded.ac_consumption, grid_power = excluded.grid_power,
                grid_to_multiplus = excluded.grid_to_multiplus, multiplus_output = excluded.multiplus_output
            """,
            rows,
        )
        self._conn.commit()

    def insert_battery_measurement(self, timestamp: datetime, measurement: BatteryMeasurement) -> None:
        self._conn.execute(
            """
            INSERT INTO system_battery (timestamp, battery_power, battery_soc, charger_power, dc_system_power, inverter_charger_power)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT (timestamp) DO UPDATE SET
                battery_power = excluded.battery_power, battery_soc = excluded.battery_soc,
                charger_power = excluded.charger_power, dc_system_power = excluded.dc_system_power,
                inverter_charger_power = excluded.inverter_charger_power
            """,
            (
                dt_to_ms(timestamp),
                measurement.get("battery_power"),
                measurement.get("battery_soc"),
                measurement.get("charger_power"),
                measurement.get("dc_system_power"),
                measurement.get("inverter_charger_power"),
            ),
        )
        self._conn.commit()

    # -------------------------------------------------------------------------
    # VEBus measurements
    # -------------------------------------------------------------------------

    def insert_vebus_measurements(self, timestamp: datetime, modbus_id: int, phases: dict[int, VEBusMeasurement]) -> None:
        ts = dt_to_ms(timestamp)
        rows = [(ts, modbus_id, phase, m.get("ac_input_power"), m.get("ac_output_power")) for phase, m in phases.items()]
        self._conn.executemany(
            """
            INSERT INTO vebus_measurements (timestamp, modbus_id, phase, ac_input_power, ac_output_power)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT (timestamp, modbus_id, phase) DO UPDATE SET
                ac_input_power = excluded.ac_input_power, ac_output_power = excluded.ac_output_power
            """,
            rows,
        )
        self._conn.commit()

    def insert_vebus_energy(self, timestamp: datetime, modbus_id: int, energy: VEBusEnergy) -> None:
        self._conn.execute(
            """
            INSERT INTO vebus_energy
                (timestamp, modbus_id, energy_ac_in1_to_ac_out, energy_ac_in1_to_battery,
                 energy_ac_in2_to_ac_out, energy_ac_in2_to_battery, energy_ac_out_to_ac_in1,
                 energy_ac_out_to_ac_in2, energy_battery_to_ac_in1, energy_battery_to_ac_in2,
                 energy_battery_to_ac_out, energy_ac_out_to_battery)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (timestamp, modbus_id) DO UPDATE SET
                energy_ac_in1_to_ac_out = excluded.energy_ac_in1_to_ac_out,
                energy_ac_in1_to_battery = excluded.energy_ac_in1_to_battery,
                energy_ac_in2_to_ac_out = excluded.energy_ac_in2_to_ac_out,
                energy_ac_in2_to_battery = excluded.energy_ac_in2_to_battery,
                energy_ac_out_to_ac_in1 = excluded.energy_ac_out_to_ac_in1,
                energy_ac_out_to_ac_in2 = excluded.energy_ac_out_to_ac_in2,
                energy_battery_to_ac_in1 = excluded.energy_battery_to_ac_in1,
                energy_battery_to_ac_in2 = excluded.energy_battery_to_ac_in2,
                energy_battery_to_ac_out = excluded.energy_battery_to_ac_out,
                energy_ac_out_to_battery = excluded.energy_ac_out_to_battery
            """,
            (
                dt_to_ms(timestamp),
                modbus_id,
                energy.get("energy_ac_in1_to_ac_out"),
                energy.get("energy_ac_in1_to_battery"),
                energy.get("energy_ac_in2_to_ac_out"),
                energy.get("energy_ac_in2_to_battery"),
                energy.get("energy_ac_out_to_ac_in1"),
                energy.get("energy_ac_out_to_ac_in2"),
                energy.get("energy_battery_to_ac_in1"),
                energy.get("energy_battery_to_ac_in2"),
                energy.get("energy_battery_to_ac_out"),
                energy.get("energy_ac_out_to_battery"),
            ),
        )
        self._conn.commit()

    # -------------------------------------------------------------------------
    # Charge schedule
    # -------------------------------------------------------------------------

    def set_schedule(self, entries: list[tuple[datetime, datetime, int, int]]) -> None:
        """Replace entire schedule with new entries.

        Args:
            entries: List of (start_time, end_time, power_w, expected_soc)
        """
        self._conn.execute("DELETE FROM charge_schedule")
        self._conn.executemany(
            "INSERT INTO charge_schedule (start_time, end_time, power, expected_soc) VALUES (?, ?, ?, ?)",
            [(dt_to_ms(start), dt_to_ms(end), power, soc) for start, end, power, soc in entries],
        )
        self._conn.commit()

    def get_schedule(self, start: datetime | None = None) -> list[tuple[datetime, datetime, int, int]]:
        """Get schedule entries from start time onwards.

        Returns: List of (start_time, end_time, power_w, expected_soc)
        """
        if start is None:
            cursor = self._conn.execute(
                "SELECT start_time, end_time, power, expected_soc FROM charge_schedule ORDER BY start_time"
            )
        else:
            cursor = self._conn.execute(
                "SELECT start_time, end_time, power, expected_soc FROM charge_schedule WHERE start_time >= ? ORDER BY start_time",
                [dt_to_ms(start)],
            )
        return [(ms_to_dt(row[0]), ms_to_dt(row[1]), row[2], row[3]) for row in cursor.fetchall()]

    def get_current_schedule_entry(self, now: datetime) -> tuple[datetime, datetime, int, int] | None:
        """Get the schedule entry active at the given time."""
        now_ms = dt_to_ms(now)
        cursor = self._conn.execute(
            "SELECT start_time, end_time, power, expected_soc FROM charge_schedule WHERE start_time <= ? AND end_time > ?",
            [now_ms, now_ms],
        )
        row = cursor.fetchone()
        if row:
            return (ms_to_dt(row[0]), ms_to_dt(row[1]), row[2], row[3])
        return None

    def prune_old_schedule(self, before: datetime) -> int:
        """Remove schedule entries that ended before the given time. Returns count deleted."""
        cursor = self._conn.execute("DELETE FROM charge_schedule WHERE end_time < ?", [dt_to_ms(before)])
        self._conn.commit()
        return cursor.rowcount
