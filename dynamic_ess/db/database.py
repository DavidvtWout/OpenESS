"""Core database class and utilities."""

import logging
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from .runner import get_migrations, run_migration

logger = logging.getLogger(__name__)


def dt_to_ms(dt: datetime) -> int:
    """Convert datetime to Unix milliseconds."""
    return int(dt.timestamp() * 1000)


def ms_to_dt(ms: int) -> datetime:
    """Convert Unix milliseconds to UTC datetime."""
    return datetime.fromtimestamp(ms / 1000, tz=timezone.utc)


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

    @property
    def conn(self) -> sqlite3.Connection:
        """Get the underlying database connection."""
        return self._conn

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
                    (version, datetime.now(timezone.utc)),
                )
                self._conn.commit()
                logger.info(f"Migration {version} complete")

    def close(self):
        self._conn.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

    def _get_labels(self, table_name, start: datetime | None = None, end: datetime | None = None) -> list[str]:
        conditions = []
        params = []
        if start is not None:
            conditions.append("start_time >= ?")
            params.append(dt_to_ms(start))
        if end is not None:
            conditions.append("start_time < ?")
            params.append(dt_to_ms(end))

        if conditions:
            where_clause = "WHERE " + " AND ".join(conditions)
        else:
            where_clause = ""
        query = f"""
            SELECT DISTINCT label
            FROM {table_name}
            {where_clause}
        """
        cursor = self.conn.execute(query, params)
        return [row[0] for row in cursor.fetchall()]

    # -------------------------------------------------------------------------
    # Power
    # -------------------------------------------------------------------------

    def insert_power(self, label: str, timestamp: datetime, power: float):
        if power is None:
            return
        self.conn.execute(
            "INSERT INTO power (label, start_time, sample_count, value) VALUES (?, ?, 1, ?)",
            (label, dt_to_ms(timestamp), power),
        )
        self.conn.commit()

    def get_power(
        self,
        label: str,
        start: datetime | None,
        end: datetime | None,
        bucket_seconds: float | None = None,
    ) -> list[tuple[datetime, float]]:
        if bucket_seconds is not None:
            bucket_ms = round(bucket_seconds * 1000)
            params: list = [bucket_ms, bucket_ms]
            select_clause = "(start_time / ?) * ? as bucket, CAST(AVG(value) AS INTEGER) as avg_value"
        else:
            params = []
            select_clause = "start_time, value"

        conditions = ["label = ?"]
        params.append(label)
        if start is not None:
            conditions.append("start_time >= ?")
            params.append(dt_to_ms(start))
        if end is not None:
            conditions.append("start_time < ?")
            params.append(dt_to_ms(end))

        where_clause = " AND ".join(conditions)
        query = f"""
            SELECT {select_clause}
            FROM power
            WHERE {where_clause}
            ORDER BY bucket
        """
        cursor = self.conn.execute(query, params)
        return [(ms_to_dt(row[0]), row[1]) for row in cursor.fetchall()]

    def get_power_labels(self, start: datetime | None = None, end: datetime | None = None) -> list[str]:
        return self._get_labels("power", start, end)

    def get_all_power(
        self, start: datetime, end: datetime | None = None, bucket_seconds: float | None = None
    ) -> dict[str, list[tuple[datetime, int]]]:
        power_series = {}
        for label in self.get_power_labels(start, end):
            power_series[label] = self.get_power(label, start, end, bucket_seconds)
        return power_series

    def compress_power(self, older_than: datetime, bucket_seconds: float) -> tuple[int, int]:
        bucket_ms = round(bucket_seconds * 1000)
        cutoff_ms = dt_to_ms(older_than) // bucket_ms * bucket_ms
        # ^ cutoff alignment with bucket size enforces that we never cross bucket boundaries. This
        #   makes calculating average power much easier since we don't need to work with weighted
        #   averages and take duration of semi-bucket into account.

        bucket_query = """
            SELECT
                label,
                (start_time / ?) * ? AS bucket,
                SUM(sample_count) AS total_samples,
                COUNT(*) AS row_count
            FROM power
            WHERE start_time < ?
            GROUP BY label, bucket
            HAVING row_count > 1
            ORDER BY bucket
        """
        cursor = self.conn.execute(bucket_query, (bucket_ms, bucket_ms, cutoff_ms))
        buckets = cursor.fetchall()

        total_sample_count = 0
        total_bucket_count = 0
        for row in buckets:
            label = row["label"]
            bucket_start = row["bucket"]
            bucket_end = bucket_start + bucket_ms
            total_samples = row["total_samples"]

            cursor = self.conn.execute(
                """
                SELECT start_time, end_time, sample_count, value
                FROM power
                WHERE label = ? AND start_time >= ? AND start_time < ?
                ORDER BY start_time
                """,
                (label, bucket_start, bucket_end),
            )
            samples = cursor.fetchall()

            total_sample_count = 0
            total_power = 0.0
            for sample in samples:
                total_sample_count += sample["sample_count"]
                total_power += sample["value"]
            average_power = total_power / len(samples)

            self.conn.execute(
                "DELETE FROM power_flows WHERE label = ? AND start_time >= ? AND start_time < ?",
                (label, bucket_start, bucket_end),
            )
            self.conn.execute(
                "INSERT INTO power_flows (label, start_time, end_time, sample_count, value) VALUES (?, ?, ?, ?, ?)",
                (label, bucket_start, bucket_end, total_samples, average_power),
            )

            total_sample_count += len(samples)
            total_bucket_count += 1

        self.conn.commit()
        return total_sample_count, total_bucket_count

    # -------------------------------------------------------------------------
    # Energy
    # -------------------------------------------------------------------------

    def insert_energy(
        self,
        label: str,
        timestamp: datetime,
        energy: float,
    ):
        self.conn.execute(
            """
            INSERT INTO energy (label, timestamp, value)
            SELECT ?, ?, ?
            WHERE ? != COALESCE(
                (SELECT value FROM energy
                 WHERE label = ?
                 ORDER BY timestamp DESC LIMIT 1),
                -1
            )
            """,
            (label, dt_to_ms(timestamp), energy, energy, label),
        )
        self.conn.commit()

    def get_energy(
        self,
        label: str,
        start: datetime | None,
        end: datetime | None,
        normalize: bool = False,
    ) -> list[tuple[datetime, float]]:

        conditions = []
        params = []
        if label is not None:
            conditions.append("label = ?")
            params.append(label)
        if start is not None:
            conditions.append("timestamp >= ?")
            params.append(dt_to_ms(start))
        if end is not None:
            conditions.append("timestamp < ?")
            params.append(dt_to_ms(end))

        where_clause = " AND ".join(conditions)
        query = f"""
                SELECT timestamp, value
                FROM energy
                WHERE {where_clause}
                ORDER BY timestamp
            """
        cursor = self.conn.execute(query, params)

        result = [(row[0], row[1]) for row in cursor.fetchall()]
        if normalize and result:
            start_energy = result[0][1]
            result = [(t, v - start_energy) for t, v in result]
        return result

    def get_energy_labels(self, start: datetime | None, end: datetime | None = None) -> list[str]:
        return self._get_labels("energy", start, end)

    def get_all_energy(
        self, start: datetime, end: datetime | None = None, normalize: bool = False
    ) -> dict[str, list[tuple[datetime, int]]]:
        energy_series = {}
        for label in self.get_energy_labels(start, end):
            energy_series[label] = self.get_energy(label, start, end, normalize)
        return energy_series

    # -------------------------------------------------------------------------
    # Day-ahead prices
    # -------------------------------------------------------------------------

    def insert_price(self, area: str, start_time: datetime, end_time: datetime, price: float):
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

    def insert_prices(self, area: str, prices: list[tuple[datetime, datetime, float]]):
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
    # Battery SOC
    # -------------------------------------------------------------------------

    def insert_soc(self, label: str, timestamp: datetime, soc: int):
        """Insert battery SOC if changed from previous value."""
        # TODO: also insert if last update was more than 5 minutes ago
        self._conn.execute(
            """
            INSERT INTO battery_soc (label, timestamp, value)
            SELECT ?, ?, ?
            WHERE ? != COALESCE(
                (SELECT value FROM battery_soc WHERE label = ? ORDER BY timestamp DESC LIMIT 1),
                -1
            )
            """,
            (label, dt_to_ms(timestamp), soc, soc, label),
        )
        self._conn.commit()

    def get_battery_soc(self, label: str, start: datetime, end: datetime) -> list[tuple[datetime, int]]:
        """Select rows from battery_soc, extending range to include boundary values for step rendering."""
        start_ms = dt_to_ms(start)
        end_ms = dt_to_ms(end)
        cursor = self._conn.execute(
            """
            SELECT timestamp, soc
            FROM battery_soc
            WHERE label = ?
            AND timestamp >= COALESCE(
                (SELECT MAX(timestamp) FROM battery_soc WHERE timestamp < ?),
                ?
            )
            AND timestamp <= COALESCE(
                (SELECT MIN(timestamp) FROM battery_soc WHERE timestamp >= ?),
                ?
            )
            ORDER BY timestamp
            """,
            [label, start_ms, start_ms, end_ms, end_ms],
        )
        return [(ms_to_dt(row[0]), row[1]) for row in cursor.fetchall()]

    def get_current_soc(self) -> int | None:
        """Get the most recent battery SOC reading."""
        cursor = self._conn.execute("SELECT soc FROM battery_soc ORDER BY timestamp DESC LIMIT 1")
        row = cursor.fetchone()
        return row["soc"] if row else None

    def get_soc_at(self, timestamp: datetime) -> int | None:
        """Get battery SOC reading at or after timestamp.
        Before would seemingly make more sense but might return a very out of data SoC value after a
        cold-start which would mess with the optimizer."""
        ts_ms = dt_to_ms(timestamp)
        cursor = self._conn.execute(
            "SELECT value FROM battery_soc WHERE timestamp >= ? ORDER BY timestamp ASC LIMIT 1",
            [ts_ms],
        )
        row = cursor.fetchone()
        if not row:
            cursor = self._conn.execute(
                "SELECT value FROM battery_soc WHERE timestamp <= ? ORDER BY timestamp DESC LIMIT 1",
                [ts_ms],
            )
            row = cursor.fetchone()
        return row["value"] if row else None

    def get_soc_series(self, label: str, start: datetime, end: datetime) -> list[tuple[int, int]]:
        """Get raw SoC time series. Returns list of (timestamp_ms, soc)."""
        cursor = self._conn.execute(
            "SELECT timestamp, value FROM battery_soc WHERE label = ? AND timestamp >= ? AND timestamp < ? ORDER BY timestamp",
            [label, dt_to_ms(start), dt_to_ms(end)],
        )
        return [(row["timestamp"], row["value"]) for row in cursor.fetchall()]

    # -------------------------------------------------------------------------
    # Charge schedule
    # -------------------------------------------------------------------------

    def set_schedule(self, entries: list[tuple[datetime, datetime, int, int]]) -> None:
        """Insert or update schedule entries."""
        self._conn.executemany(
            "INSERT OR REPLACE INTO charge_schedule (start_time, end_time, power, expected_soc) VALUES (?, ?, ?, ?)",
            [(dt_to_ms(start), dt_to_ms(end), power, soc) for start, end, power, soc in entries],
        )
        self._conn.commit()

    def get_schedule(self, start: datetime | None = None) -> list[tuple[datetime, datetime, int, int]]:
        """Get schedule entries from start time onwards."""
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
            return ms_to_dt(row[0]), ms_to_dt(row[1]), row[2], row[3]
        return None
