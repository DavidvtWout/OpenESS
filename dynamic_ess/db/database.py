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
    ac_consumption: float | None
    grid_power: float | None
    grid_to_multiplus: float | None
    multiplus_output: float | None


class BatteryMeasurement(TypedDict, total=False):
    battery_power: float | None
    battery_soc: float | None
    inverter_charger_power: float | None


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
        # WAL mode allows concurrent reads/writes without blocking
        self._conn.execute("PRAGMA journal_mode=WAL")
        # Wait up to 30 seconds for locks instead of failing immediately
        self._conn.execute("PRAGMA busy_timeout = 30000")
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
            (
                ts,
                1,
                phase,
                m.get("ac_consumption"),
                m.get("grid_power"),
                m.get("grid_to_multiplus"),
                m.get("multiplus_output"),
            )
            for phase, m in phases.items()
        ]
        self._conn.executemany(
            """
            INSERT INTO system_measurements (timestamp, sample_count, phase, ac_consumption, grid_power, grid_to_multiplus, multiplus_output)
            VALUES (?, ?, ?, ?, ?, ?, ?)
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
            INSERT INTO system_battery (timestamp, sample_count, battery_power, battery_soc, inverter_charger_power)
            VALUES (?, 1, ?, ?, ?)
            ON CONFLICT (timestamp) DO UPDATE SET
                battery_power = excluded.battery_power, battery_soc = excluded.battery_soc,
                inverter_charger_power = excluded.inverter_charger_power
            """,
            (
                dt_to_ms(timestamp),
                measurement.get("battery_power"),
                measurement.get("battery_soc"),
                measurement.get("inverter_charger_power"),
            ),
        )
        self._conn.commit()

    # -------------------------------------------------------------------------
    # VEBus measurements
    # -------------------------------------------------------------------------

    def insert_vebus_measurements(
        self, timestamp: datetime, modbus_id: int, phases: dict[int, VEBusMeasurement]
    ) -> None:
        ts = dt_to_ms(timestamp)
        rows = [
            (ts, 1, modbus_id, phase, m.get("ac_input_power"), m.get("ac_output_power")) for phase, m in phases.items()
        ]
        self._conn.executemany(
            """
            INSERT INTO vebus_measurements (timestamp, sample_count, modbus_id, phase, ac_input_power, ac_output_power)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT (timestamp, modbus_id, phase) DO UPDATE SET
                ac_input_power = excluded.ac_input_power, ac_output_power = excluded.ac_output_power
            """,
            rows,
        )
        self._conn.commit()

    def insert_vebus_energy(self, timestamp: datetime, modbus_id: int, energy: VEBusEnergy) -> None:
        values = (
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
        )

        # Check if values are the same as the previous entry
        cursor = self._conn.execute(
            """
            SELECT energy_ac_in1_to_ac_out, energy_ac_in1_to_battery,
                   energy_ac_in2_to_ac_out, energy_ac_in2_to_battery,
                   energy_ac_out_to_ac_in1, energy_ac_out_to_ac_in2,
                   energy_battery_to_ac_in1, energy_battery_to_ac_in2,
                   energy_battery_to_ac_out, energy_ac_out_to_battery
            FROM vebus_energy
            WHERE modbus_id = ?
            ORDER BY timestamp DESC
            LIMIT 1
            """,
            (modbus_id,),
        )
        prev = cursor.fetchone()
        if prev and tuple(prev) == values:
            return  # Skip insert, values unchanged

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
            (dt_to_ms(timestamp), modbus_id) + values,
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

    def get_average_price(self, area: str, start: datetime, end: datetime) -> float | None:
        """Get average price for an area over a time range. Returns EUR/MWh or None if no data."""
        cursor = self._conn.execute(
            "SELECT AVG(price) as avg_price FROM day_ahead_prices WHERE area = ? AND start_time >= ? AND start_time < ?",
            (area, dt_to_ms(start), dt_to_ms(end)),
        )
        row = cursor.fetchone()
        return row["avg_price"] if row and row["avg_price"] is not None else None

    def get_current_soc(self) -> int | None:
        """Get the most recent battery SOC reading."""
        cursor = self._conn.execute(
            "SELECT battery_soc FROM system_battery WHERE battery_soc IS NOT NULL ORDER BY timestamp DESC LIMIT 1"
        )
        row = cursor.fetchone()
        return row["battery_soc"] if row else None

    def get_soc_at(self, timestamp: datetime):
        """Get battery SOC reading at timestamp."""
        cursor = self._conn.execute(
            """
            SELECT battery_soc
            FROM system_battery
            WHERE battery_soc IS NOT NULL AND timestamp < ?
            ORDER BY timestamp
            DESC LIMIT 1
            """,
            [dt_to_ms(timestamp)],
        )
        row = cursor.fetchone()
        return row["battery_soc"] if row else None

    def get_hourly_prices(
        self, area: str, start: datetime, end: datetime | None = None
    ) -> list[tuple[datetime, float]]:
        """Get hourly aggregated prices. Returns list of (hour_start, price_eur_per_kwh)."""
        params = [area, dt_to_ms(start)]
        if end is not None:
            params.append(dt_to_ms(end))
        cursor = self._conn.execute(
            f"""
            SELECT (start_time / 3600000) * 3600000 AS hour, AVG(price) / 1000.0 AS price
            FROM day_ahead_prices
            WHERE area = ? AND start_time >= ?{" AND start_time < ?" if end is not None else ""}
            GROUP BY hour ORDER BY hour
            """,
            params,
        )
        return [(ms_to_dt(row["hour"]), row["price"]) for row in cursor.fetchall()]

    # -------------------------------------------------------------------------
    # Data compression
    # -------------------------------------------------------------------------

    def compress_battery_data(self, older_than: datetime, bucket_ms: int) -> int:
        """Compress raw battery measurements older than a given time into buckets.

        Raw samples (end_timestamp IS NULL) are grouped into time buckets and replaced
        with a single time-weighted average entry. If the bucket is "whole" (first sample
        at bucket start, last sample at bucket end), timestamps are rounded to whole minutes.

        Args:
            older_than: Only compress data with timestamp before this
            bucket_ms: Bucket size in milliseconds (e.g., 60000 for 1 minute)

        Returns:
            Number of rows compressed (removed)
        """
        return self._compress_table(
            table="system_battery",
            columns=["battery_power", "battery_soc", "inverter_charger_power"],
            older_than=older_than,
            bucket_ms=bucket_ms,
            group_by=None,
        )

    def compress_system_measurements(self, older_than: datetime, bucket_ms: int) -> int:
        """Compress raw system measurements older than a given time into buckets.

        Args:
            older_than: Only compress data with timestamp before this
            bucket_ms: Bucket size in milliseconds (e.g., 60000 for 1 minute)

        Returns:
            Number of rows compressed (removed)
        """
        return self._compress_table(
            table="system_measurements",
            columns=["ac_consumption", "grid_power", "grid_to_multiplus", "multiplus_output"],
            older_than=older_than,
            bucket_ms=bucket_ms,
            group_by="phase",
        )

    def compress_vebus_measurements(self, older_than: datetime, bucket_ms: int) -> int:
        """Compress raw vebus measurements older than a given time into buckets.

        Args:
            older_than: Only compress data with timestamp before this
            bucket_ms: Bucket size in milliseconds (e.g., 60000 for 1 minute)

        Returns:
            Number of rows compressed (removed)
        """
        return self._compress_table(
            table="vebus_measurements",
            columns=["ac_input_power", "ac_output_power"],
            older_than=older_than,
            bucket_ms=bucket_ms,
            group_by=["modbus_id", "phase"],
        )

    def _compress_table(
        self,
        table: str,
        columns: list[str],
        older_than: datetime,
        bucket_ms: int,
        group_by: str | list[str] | None,
    ) -> int:
        """Generic compression for time-series tables with end_timestamp support.

        Groups raw samples (end_timestamp IS NULL) into time buckets and replaces them
        with a single time-weighted average entry. If the bucket is "whole" (samples
        span from bucket start to bucket end), timestamps are rounded to whole minutes.

        What about leap seconds?
        Luckily unix time doesn't take leap seconds into account at all! This means that
        aligning buckets with actual minutes is very easy. The only "problem" is that
        buckets with leap seconds are a second longer or shorter than the unix time would
        let you believe. But I don't care at all about this.

        Args:
            table: Table name to compress
            columns: List of value columns to average
            older_than: Only compress data with timestamp before this
            bucket_ms: Bucket size in milliseconds
            group_by: Optional column(s) to group by (e.g., "phase" or ["modbus_id", "phase"])

        Returns:
            Number of rows compressed
        """
        cutoff_ms = dt_to_ms(older_than)
        group_cols = [group_by] if isinstance(group_by, str) else (group_by or [])

        # Build query to find buckets with data to compress
        # Include both raw samples and already-compressed data (for re-compression)
        bucket_query = f"""
            SELECT
                (timestamp / ?) * ? AS bucket,
                {"".join(f"{col}, " for col in group_cols)}
                MIN(timestamp) AS first_ts,
                MAX(COALESCE(end_timestamp, timestamp)) AS last_ts,
                SUM(sample_count) AS total_samples,
                COUNT(*) AS row_count
            FROM {table}
            WHERE timestamp < ?
            GROUP BY {", ".join(["bucket"] + group_cols)}
            ORDER BY bucket
        """

        cursor = self._conn.execute(bucket_query, (bucket_ms, bucket_ms, cutoff_ms))
        buckets = cursor.fetchall()

        total_compressed = 0
        for bucket_row in buckets:
            bucket_start = bucket_row["bucket"]
            bucket_end = bucket_start + bucket_ms
            first_ts = bucket_row["first_ts"]
            last_ts = bucket_row["last_ts"]
            total_samples = bucket_row["total_samples"]

            # Build WHERE clause for this bucket
            where_clause = " AND ".join(["timestamp >= ?", "timestamp < ?"] + [f"{col} = ?" for col in group_cols])
            group_values = [bucket_row[col] for col in group_cols]
            where_params = [bucket_start, bucket_end] + group_values

            # Get all samples in this bucket, ordered by time
            col_select = ", ".join(columns)
            cursor = self._conn.execute(
                f"SELECT timestamp, end_timestamp, sample_count, {col_select} FROM {table} WHERE {where_clause} ORDER BY timestamp",
                where_params,
            )
            samples = cursor.fetchall()
            if len(samples) <= 1:
                # Should never happen, but just to be sure.
                continue

            # Calculate time-weighted averages
            # For raw samples (end_timestamp IS NULL), weight by duration to next sample
            # For compressed samples, weight by their own duration (end_timestamp - timestamp)
            total_duration = 0
            total_sample_count = 0
            weighted_sums = {col: 0.0 for col in columns}

            for i, sample in enumerate(samples):
                if sample["end_timestamp"] is not None:
                    # Already compressed: use its own duration
                    duration = sample["end_timestamp"] - sample["timestamp"]
                elif i < len(samples) - 1:
                    # Raw sample: use duration to next sample
                    duration = samples[i + 1]["timestamp"] - sample["timestamp"]
                else:
                    # Last raw sample: assume duration is equal to average sample duration.
                    duration = total_duration / total_sample_count
                total_sample_count += sample["sample_count"]

                total_duration += duration
                for col in columns:
                    val = sample[col]
                    if val is not None:
                        weighted_sums[col] += val * duration

            if total_duration <= 0:
                # Should never happen, but just to be sure.
                continue

            # Calculate averages
            averages = {}
            for col in columns:
                has_data = any(s[col] is not None for s in samples)
                if has_data:
                    averages[col] = weighted_sums[col] / total_duration
                else:
                    averages[col] = None

            # Determine timestamps: use whole minutes if bucket is "whole"
            average_duration = total_duration / total_sample_count
            if first_ts <= bucket_start + 1.5 * average_duration:
                first_ts = bucket_start
            if last_ts >= bucket_end - 1.5 * average_duration:
                last_ts = bucket_end

            # Delete original samples
            self._conn.execute(f"DELETE FROM {table} WHERE {where_clause}", where_params)
            total_compressed += len(samples)

            # Insert compressed entry with summed sample_count
            all_cols = ["timestamp", "end_timestamp", "sample_count"] + group_cols + columns
            placeholders = ", ".join("?" for _ in all_cols)
            col_names = ", ".join(all_cols)
            values = [first_ts, last_ts, total_samples] + group_values + [averages[col] for col in columns]

            self._conn.execute(f"INSERT INTO {table} ({col_names}) VALUES ({placeholders})", values)

        self._conn.commit()
        return total_compressed
