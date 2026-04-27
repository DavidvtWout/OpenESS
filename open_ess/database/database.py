import logging
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path

from .config import DatabaseConfig
from .migration_runner import run_migrations
from .util import base_conditions, dt_to_ms, ms_to_dt

logger = logging.getLogger(__name__)


class Database:
    def __init__(self, config: DatabaseConfig):
        self._config = config
        config.path.parent.mkdir(parents=True, exist_ok=True)
        with self.connect() as conn:
            conn.execute("PRAGMA journal_mode=WAL")
            # ^ WAL mode allows concurrent reads/writes without blocking
            conn.execute("PRAGMA busy_timeout = 30000")
            # ^ Wait up to 30 seconds for locks instead of failing immediately

    @property
    def config(self) -> DatabaseConfig:
        return self._config

    def connect(self) -> "DatabaseConnection":
        return DatabaseConnection(self._config.path)

    def run_migrations(self) -> None:
        with self.connect() as conn:
            run_migrations(conn)


class DatabaseConnection:
    def __init__(self, path: Path):
        self._conn = sqlite3.connect(path)
        self._conn.row_factory = sqlite3.Row
        # ^ Makes column access by name possible

    def close(self) -> None:
        self._conn.close()

    def __enter__(self) -> "DatabaseConnection":
        return self

    def __exit__(self, exc_type: object, exc_val: object, exc_tb: object) -> None:
        self.close()

    def execute(self, sql: str, parameters: list | tuple | None = None) -> sqlite3.Cursor:
        if parameters is None:
            parameters = []
        return self._conn.execute(sql, parameters)

    def commit(self) -> None:
        self._conn.commit()

    def vacuum(self) -> None:
        self._conn.execute("PRAGMA incremental_vacuum")

    def _get_labels(
        self, table_name: str, timestamp_name: str, start: datetime | None = None, end: datetime | None = None
    ) -> list[str]:
        conditions = []
        params = []
        if start is not None:
            conditions.append(f"{timestamp_name} >= ?")
            params.append(dt_to_ms(start))
        if end is not None:
            conditions.append(f"{timestamp_name} < ?")
            params.append(dt_to_ms(end))

        where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""
        query = f"""
            SELECT DISTINCT label
            FROM {table_name}
            {where_clause}
        """
        cursor = self._conn.execute(query, params)
        return [row[0] for row in cursor.fetchall()]

    # -------------------------------------------------------------------------
    # Power
    # -------------------------------------------------------------------------

    def insert_power(self, label: str, timestamp: datetime, power: float | None) -> None:
        if power is None:
            return
        self._conn.execute(
            "INSERT INTO power (label, start_time, sample_count, value) VALUES (?, ?, 1, ?)",
            (label, dt_to_ms(timestamp), power),
        )
        self._conn.commit()

    def get_power(
        self,
        label: str,
        start: datetime | None = None,
        end: datetime | None = None,
        bucket_seconds: float | None = 60,
        limit: int | None = None,
    ) -> list[tuple[datetime, float]]:
        if isinstance(label, list):
            label = label[0]

        conditions, params = base_conditions(label, start, end, timestamp_name="start_time")

        if bucket_seconds is not None:
            bucket_ms = round(bucket_seconds * 1000)
            select_clause = "(start_time / ?) * ? as bucket, AVG(value) as avg_value"
            params = [bucket_ms, bucket_ms, *params]
            group_by = "GROUP BY bucket"
            order_by = "bucket"
        else:
            select_clause = "start_time, value"
            group_by = ""
            order_by = "start_time"

        limit_clause = ""
        if limit:
            limit_clause = "LIMIT ?"
            params.append(limit)

        where_clause = " AND ".join(conditions)
        query = f"""
            SELECT {select_clause}
            FROM power
            WHERE {where_clause}
            {group_by}
            ORDER BY {order_by}
            {limit_clause}
        """
        cursor = self._conn.execute(query, params)
        return [(ms_to_dt(row[0]), row[1]) for row in cursor.fetchall()]

    def get_power_labels(self, start: datetime | None = None, end: datetime | None = None) -> list[str]:
        return self._get_labels("power", "start_time", start, end)

    def get_all_power(
        self, start: datetime, end: datetime | None = None, bucket_seconds: float | None = None
    ) -> dict[str, list[tuple[datetime, float]]]:
        power_series = {}
        for label in self.get_power_labels(start, end):
            power_series[label] = self.get_power(label, start, end, bucket_seconds)
        return power_series

    def compress_power(self, older_than: datetime, bucket_seconds: float) -> tuple[int, int]:
        older_than = older_than.replace(second=0, microsecond=0)
        bucket_ms = round(bucket_seconds * 1000)
        cutoff_ms = dt_to_ms(older_than)
        # ^ cutoff alignment with bucket size enforces that we never cross bucket boundaries. This
        #   makes calculating average power much easier since we don't need to work with weighted
        #   averages and take duration of semi-bucket into account.

        bucket_query = """
            SELECT
                label_id,
                (start_time / ?) * ? AS bucket,
                SUM(sample_count) AS total_samples,
                COUNT(*) AS row_count
            FROM _power
            WHERE start_time < ?
            GROUP BY label_id, bucket
            HAVING row_count > 1
            ORDER BY bucket
        """
        cursor = self._conn.execute(bucket_query, (bucket_ms, bucket_ms, cutoff_ms))
        buckets = cursor.fetchall()

        total_sample_count = 0
        total_bucket_count = 0
        for row in buckets:
            label_id = row["label_id"]
            bucket_start = row["bucket"]
            bucket_end = bucket_start + bucket_ms
            total_samples = row["total_samples"]

            cursor = self._conn.execute(
                """
                SELECT start_time, end_time, sample_count, value
                FROM _power
                WHERE label_id = ? AND start_time >= ? AND start_time < ?
                ORDER BY start_time
                """,
                (label_id, bucket_start, bucket_end),
            )
            samples = cursor.fetchall()

            sample_count = 0
            total_power = 0.0
            for sample in samples:
                sample_count += sample["sample_count"]
                total_power += sample["value"]
            average_power = total_power / sample_count

            self._conn.execute(
                "DELETE FROM _power WHERE label_id = ? AND start_time >= ? AND start_time < ?",
                (label_id, bucket_start, bucket_end),
            )
            self._conn.execute(
                "INSERT INTO _power (label_id, start_time, end_time, sample_count, value) VALUES (?, ?, ?, ?, ?)",
                (label_id, bucket_start, bucket_end, total_samples, average_power),
            )

            total_sample_count += sample_count
            total_bucket_count += 1

        self._conn.commit()
        return total_sample_count, total_bucket_count

    # "Abuse" power table for voltages because the compression algorithm also works perfectly fine for voltages.
    insert_voltage = insert_power
    get_voltage = get_power

    # -------------------------------------------------------------------------
    # Energy
    # -------------------------------------------------------------------------

    def insert_energy(
        self,
        label: str,
        timestamp: datetime,
        energy: float | None,
    ) -> None:
        if energy is None:
            return
        self._conn.execute(
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
        self._conn.commit()

    def get_energy(
        self,
        label: str,
        start: datetime | None,
        end: datetime | None,
        normalize: bool = False,
    ) -> list[tuple[datetime, float]]:
        conditions, params = base_conditions(label, start, end)
        where_clause = "WHERE " + " AND ".join(conditions)
        query = f"""
            SELECT timestamp, value
            FROM energy
            {where_clause}
            ORDER BY timestamp
        """
        cursor = self._conn.execute(query, params)

        result = [(row[0], row[1]) for row in cursor.fetchall()]
        if normalize and result:
            start_energy = result[0][1]
            result = [(t, v - start_energy) for t, v in result]
        return result

    def get_energy_aggregated(
        self,
        label: str,
        aggregation_seconds: float,
        start: datetime | None,
        end: datetime | None,
        center_buckets: bool = False,
    ) -> list[tuple[datetime, float]]:
        if start:
            start -= timedelta(seconds=aggregation_seconds)
        if end:
            end += timedelta(seconds=aggregation_seconds)

        agg_ms = int(aggregation_seconds * 1000)
        conditions, params = base_conditions(label, start, end)
        where_clause = "WHERE " + " AND ".join(conditions)
        query = f"""
            SELECT
                (timestamp / ?) * ? AS bucket,
                SUM(delta) AS energy_sum
            FROM (
                SELECT
                    timestamp,
                    CASE
                        WHEN prev IS NULL THEN 0      -- first value
                        WHEN value < prev THEN value  -- time series was reset to zero
                        ELSE value - prev
                    END AS delta
                FROM (
                    SELECT
                        timestamp,
                        value,
                        LAG(value) OVER (ORDER BY timestamp) AS prev
                    FROM energy
                    {where_clause}
                )
            )
            GROUP BY bucket
            ORDER BY bucket
        """
        cursor = self._conn.execute(query, [agg_ms, agg_ms, *params])

        center_offset = agg_ms // 2 if center_buckets else 0
        return [(ms_to_dt(r[0] + center_offset), round(r[1], 3)) for r in cursor.fetchall()]

    def get_energy_labels(self, start: datetime | None, end: datetime | None = None) -> list[str]:
        return self._get_labels("energy", "timestamp", start, end)

    def get_all_energy(
        self, start: datetime, end: datetime | None = None, normalize: bool = False
    ) -> dict[str, list[tuple[datetime, float]]]:
        energy_series = {}
        for label in self.get_energy_labels(start, end):
            energy_series[label] = self.get_energy(label, start, end, normalize)
        return energy_series

    def get_grid_energy_total(
        self, start: datetime | None, end: datetime | None = None, normalize: bool = False
    ) -> dict[str, list[tuple[datetime, float]]]:
        # TODO: per phase and total
        return {
            "from_net_total": self.get_energy("from_net_total", start, end, normalize),
            "to_net_total": self.get_energy("to_net_total", start, end, normalize),
        }

    def integrate_power(
        self, label: str, start: datetime, end: datetime, bucket_seconds: int = 60
    ) -> list[tuple[datetime, float]]:
        power_series = self.get_power(label, start, end, bucket_seconds=bucket_seconds)
        if not power_series:
            return []

        energy_series = [(power_series[0][0] - timedelta(seconds=bucket_seconds), 0.0)]
        for ts, v in power_series:
            energy_series.append((ts, energy_series[-1][-1] + v / 1000 / (3600 / bucket_seconds)))
        return energy_series

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

    def get_prices(
        self, area: str, start: datetime, end: datetime | None = None, aggregate_minutes: float | None = None
    ) -> list[tuple[datetime, float]]:
        conditions, params = base_conditions(area, start, end, label_name="area", timestamp_name="start_time")

        if aggregate_minutes is not None:
            timestamp_column = "bucket"
            value_column = "avg_value"
            select_clause = f"(start_time / ?) * ? as {timestamp_column}, AVG(price) as {value_column}"
            group_by = f"GROUP BY {timestamp_column}"
            agg_ms = round(aggregate_minutes * 60000)
            params = [agg_ms, agg_ms, *params]
        else:
            timestamp_column = "start_time"
            group_by = ""
            value_column = "price"
            select_clause = f"{timestamp_column}, {value_column}"

        where_clause = "WHERE " + " AND ".join(conditions)
        cursor = self._conn.execute(
            f"""
            SELECT {select_clause}
            FROM day_ahead_prices
            {where_clause}
            {group_by}
            ORDER BY {timestamp_column}
            """,
            params,
        )
        # TODO: store prices in €/kWh instead of €/MWh
        return [(ms_to_dt(row[timestamp_column]), row[value_column] / 1000) for row in cursor.fetchall()]

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

    def insert_soc(self, label: str, timestamp: datetime, soc: int) -> None:
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

    def get_battery_soc(self, label: str, start: datetime, end: datetime) -> list[tuple[datetime, float]]:
        if isinstance(label, list):
            label = label[0]
        cursor = self._conn.execute(
            "SELECT timestamp, value FROM battery_soc WHERE label = ? AND timestamp >= ? AND timestamp < ? ORDER BY timestamp",
            [label, dt_to_ms(start), dt_to_ms(end)],
        )
        return [(ms_to_dt(row["timestamp"]), row["value"]) for row in cursor.fetchall()]

    def get_current_soc(self) -> int | None:
        cursor = self._conn.execute("SELECT value FROM battery_soc ORDER BY timestamp DESC LIMIT 1")
        row = cursor.fetchone()
        return row["value"] if row else None

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

    # -------------------------------------------------------------------------
    # Charge schedule
    # -------------------------------------------------------------------------

    def set_schedule(self, battery_id: str, entries: list[tuple[datetime, datetime, int, float]]) -> None:
        # The view on the actual table already handles OR REPLACE and add OR REPLACE to this query messes up the
        # insertion... The table_id is then recreated on every conflict.
        if not entries:
            return

        entries = sorted(entries, key=lambda row: row[0])
        first_ts, _, _, _ = entries[0]

        self._conn.execute(
            "DELETE FROM charge_schedule WHERE label = ? AND start_time >= ?", [battery_id, dt_to_ms(first_ts)]
        )
        self._conn.executemany(
            "INSERT INTO charge_schedule (label, start_time, end_time, power, expected_soc) VALUES (?, ?, ?, ?, ?)",
            [(battery_id, dt_to_ms(start), dt_to_ms(end), power, soc) for start, end, power, soc in entries],
        )
        self._conn.commit()

    def get_schedule(
        self, battery_id: str, start: datetime | None = None, end: datetime | None = None
    ) -> list[tuple[datetime, datetime, int, int]]:
        conditions, params = base_conditions(battery_id, start, end, timestamp_name="start_time")
        where_clause = "WHERE " + " AND ".join(conditions)
        cursor = self._conn.execute(
            f"""
            SELECT start_time, end_time, power, expected_soc
            FROM charge_schedule
            {where_clause}
            ORDER BY start_time
            """,
            params,
        )
        return [(ms_to_dt(row[0]), ms_to_dt(row[1]), row[2], row[3]) for row in cursor.fetchall()]
