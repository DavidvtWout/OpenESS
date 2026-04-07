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

        self._grid_node_ids = [
            self.get_or_create_node("grid", "grid"),
            self.get_or_create_node("grid_l1", "grid", 1),
            self.get_or_create_node("grid_l2", "grid", 2),
            self.get_or_create_node("grid_l3", "grid", 3),
        ]
        self._pool_node_ids = [
            self.get_or_create_node("pool", "pool"),
            self.get_or_create_node("pool_l1", "pool", 1),
            self.get_or_create_node("pool_l2", "pool", 2),
            self.get_or_create_node("pool_l3", "pool", 3),
        ]

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
    # Nodes
    # -------------------------------------------------------------------------

    _node_cache: dict[str, int] = {}  # name -> id cache

    def get_grid_id(self, phase: int = None):
        if phase is None:
            phase = 0
        return self._grid_node_ids[phase]

    def get_pool_id(self, phase: int = None):
        if phase is None:
            phase = 0
        return self._pool_node_ids[phase]

    def get_battery_id(self) -> int:
        return self.get_or_create_node("battery", "battery")

    def get_or_create_node(self, name: str, node_type: str, phase: int | None = None) -> int:
        """Get node ID by name, creating it if it doesn't exist."""
        if name in self._node_cache:
            return self._node_cache[name]

        cursor = self._conn.execute("SELECT id FROM nodes WHERE name = ?", (name,))
        row = cursor.fetchone()
        if row:
            self._node_cache[name] = row["id"]
            return row["id"]

        cursor = self._conn.execute(
            "INSERT INTO nodes (name, type, phase) VALUES (?, ?, ?)",
            (name, node_type, phase),
        )
        self._conn.commit()
        node_id = cursor.lastrowid
        self._node_cache[name] = node_id
        return node_id

    def get_nodes(self) -> list[tuple[int, str, str, int | None]]:
        cursor = self._conn.execute("SELECT id, name, type, phase FROM nodes;")
        return [(row["id"], row["name"], row["type"], row["phase"]) for row in cursor.fetchall()]

    # -------------------------------------------------------------------------
    # Energy flows
    # -------------------------------------------------------------------------

    def insert_energy_flow(
        self,
        timestamp: datetime,
        from_node_id: int,
        to_node_id: int,
        energy: float,
    ) -> None:
        """Insert energy flow if value changed from previous.

        Uses SQL to check if the value differs from the most recent entry.
        Skips insert if energy is zero or unchanged.

        Args:
            timestamp: Measurement timestamp
            from_node_id: Source node ID
            to_node_id: Destination node ID
            energy: Cumulative energy value (kWh)
        """
        if energy == 0:
            return

        # Only insert if different from the previous value
        self._conn.execute(
            """
            INSERT INTO energy_flows (timestamp, node_a, node_b, energy)
            SELECT ?, ?, ?, ?
            WHERE ? != COALESCE(
                (SELECT energy FROM energy_flows
                 WHERE node_a = ? AND node_b = ?
                 ORDER BY timestamp DESC LIMIT 1),
                -1
            )
            """,
            (dt_to_ms(timestamp), from_node_id, to_node_id, energy, energy, from_node_id, to_node_id),
        )
        self._conn.commit()

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
    # Power flows
    # -------------------------------------------------------------------------

    def insert_power_flow(
        self,
        timestamp: datetime,
        from_node_id: int,
        to_node_id: int,
        power: float,
    ) -> None:
        """Insert a power flow measurement.

        Args:
            timestamp: Measurement timestamp
            from_node_id: Source node ID
            to_node_id: Destination node ID
            power: Power in watts
        """
        if power == 0:
            return

        self._conn.execute(
            """
            INSERT INTO power_flows (start_time, sample_count, node_a, node_b, power)
            VALUES (?, 1, ?, ?, ?)
            ON CONFLICT (start_time, node_a, node_b) DO UPDATE SET
                power = excluded.power
            """,
            (dt_to_ms(timestamp), from_node_id, to_node_id, power),
        )
        self._conn.commit()

    def get_power_flow(
        self,
        start: datetime,
        end: datetime,
        bucket_seconds: float,
        from_node_ids: list[int] | None = None,
        to_node_ids: list[int] | None = None,
    ) -> list[tuple[datetime, int, int, int]]:
        """Get power flow data grouped by time bucket and node pair.

        Args:
            start: Start of time range
            end: End of time range
            bucket_seconds: Bucket size for aggregation
            from_node_ids: Filter by source node IDs (None = all)
            to_node_ids: Filter by destination node IDs (None = all)

        Returns:
            List of (bucket_time, node_a, node_b, avg_power) tuples
        """
        bucket_ms = round(bucket_seconds * 1000)
        start_ms, end_ms = dt_to_ms(start), dt_to_ms(end)

        # Build WHERE clause and params
        conditions = ["start_time >= ?", "start_time < ?"]
        params: list = [bucket_ms, bucket_ms, start_ms, end_ms]

        if from_node_ids:
            placeholders = ",".join("?" * len(from_node_ids))
            conditions.append(f"node_a IN ({placeholders})")
            params.extend(from_node_ids)

        if to_node_ids:
            placeholders = ",".join("?" * len(to_node_ids))
            conditions.append(f"node_b IN ({placeholders})")
            params.extend(to_node_ids)

        where_clause = " AND ".join(conditions)

        query = f"""
            SELECT (start_time / ?) * ? as bucket, node_a, node_b,
                   CAST(AVG(power) AS INTEGER) as avg_power
            FROM power_flows
            WHERE {where_clause}
            GROUP BY bucket, node_a, node_b
            ORDER BY bucket, node_a, node_b
        """
        cursor = self._conn.execute(query, params)
        return [(ms_to_dt(row[0]), row[1], row[2], row[3]) for row in cursor.fetchall()]

    def get_grid_power(
        self,
        start: datetime,
        end: datetime,
        bucket_seconds: float,
    ) -> list[tuple[datetime, int]]:
        """Get total grid power (sum across all phases) as a single time series.

        Args:
            start: Start of time range
            end: End of time range
            bucket_seconds: Bucket size for aggregation

        Returns:
            List of (bucket_time, total_power) tuples
        """
        # Get power flows from grid nodes (all phases)
        power_flows = self.get_power_flow(
            start,
            end,
            bucket_seconds,
            from_node_ids=self._grid_node_ids,
        )

        # Sum power across all node pairs per bucket
        totals: dict[datetime, int] = {}
        for bucket_time, _, _, power in power_flows:
            totals[bucket_time] = totals.get(bucket_time, 0) + power

        return sorted(totals.items())

    # -------------------------------------------------------------------------
    # Battery SOC
    # -------------------------------------------------------------------------

    def insert_soc(self, timestamp: datetime, soc: int) -> None:
        """Insert battery SOC if changed from previous value.

        Args:
            timestamp: Measurement timestamp
            soc: State of charge (0-100)
        """
        self._conn.execute(
            """
            INSERT INTO battery_soc (timestamp, soc)
            SELECT ?, ?
            WHERE ? != COALESCE(
                (SELECT soc FROM battery_soc ORDER BY timestamp DESC LIMIT 1),
                -1
            )
            """,
            (dt_to_ms(timestamp), soc, soc),
        )
        self._conn.commit()

    def get_battery_soc(self, start: datetime, end: datetime) -> list[tuple[datetime, int]]:
        """Select rows from battery_soc, extending range to include boundary values for step rendering."""
        start_ms = dt_to_ms(start)
        end_ms = dt_to_ms(end)
        cursor = self._conn.execute(
            """
            SELECT timestamp, soc
            FROM battery_soc
            WHERE timestamp >= COALESCE(
                (SELECT MAX(timestamp) FROM battery_soc WHERE timestamp < ?),
                ?
            )
            AND timestamp <= COALESCE(
                (SELECT MIN(timestamp) FROM battery_soc WHERE timestamp >= ?),
                ?
            )
            ORDER BY timestamp
            """,
            [start_ms, start_ms, end_ms, end_ms],
        )
        return [(ms_to_dt(row[0]), row[1]) for row in cursor.fetchall()]

    # -------------------------------------------------------------------------
    # Charge schedule
    # -------------------------------------------------------------------------

    def set_schedule(self, entries: list[tuple[datetime, datetime, int, int]]) -> None:
        """Insert or update schedule entries.

        Existing entries with matching start_time are overwritten.
        Past entries are preserved for comparison with actual data.

        Args:
            entries: List of (start_time, end_time, power_w, expected_soc)
        """
        self._conn.executemany(
            "INSERT OR REPLACE INTO charge_schedule (start_time, end_time, power, expected_soc) VALUES (?, ?, ?, ?)",
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
        cursor = self._conn.execute("SELECT soc FROM battery_soc ORDER BY timestamp DESC LIMIT 1")
        row = cursor.fetchone()
        return row["soc"] if row else None

    def get_soc_at(self, timestamp: datetime) -> int | None:
        """Get battery SOC reading at or before timestamp."""
        cursor = self._conn.execute(
            "SELECT soc FROM battery_soc WHERE timestamp <= ? ORDER BY timestamp DESC LIMIT 1",
            [dt_to_ms(timestamp)],
        )
        row = cursor.fetchone()
        return row["soc"] if row else None

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

    def compress_power_flows(self, older_than: datetime, bucket_ms: int) -> int:
        """Compress raw power flow measurements older than a given time into buckets.

        Raw samples (end_time IS NULL) are grouped into time buckets per node pair and
        replaced with a single time-weighted average entry.

        Args:
            older_than: Only compress data with start_time before this
            bucket_ms: Bucket size in milliseconds (e.g., 60000 for 1 minute)

        Returns:
            Number of rows compressed (removed)
        """
        cutoff_ms = dt_to_ms(older_than)

        # Find buckets with data to compress, grouped by node pair
        bucket_query = """
            SELECT
                (start_time / ?) * ? AS bucket,
                node_a,
                node_b,
                MIN(start_time) AS first_ts,
                MAX(COALESCE(end_time, start_time)) AS last_ts,
                SUM(sample_count) AS total_samples,
                COUNT(*) AS row_count
            FROM power_flows
            WHERE start_time < ?
            GROUP BY bucket, node_a, node_b
            HAVING row_count > 1
            ORDER BY bucket
        """

        cursor = self._conn.execute(bucket_query, (bucket_ms, bucket_ms, cutoff_ms))
        buckets = cursor.fetchall()

        total_compressed = 0
        for bucket_row in buckets:
            bucket_start = bucket_row["bucket"]
            bucket_end = bucket_start + bucket_ms
            node_a = bucket_row["node_a"]
            node_b = bucket_row["node_b"]
            first_ts = bucket_row["first_ts"]
            last_ts = bucket_row["last_ts"]
            total_samples = bucket_row["total_samples"]

            # Get all samples in this bucket for this node pair
            cursor = self._conn.execute(
                """
                SELECT start_time, end_time, sample_count, power
                FROM power_flows
                WHERE start_time >= ? AND start_time < ? AND node_a = ? AND node_b = ?
                ORDER BY start_time
                """,
                (bucket_start, bucket_end, node_a, node_b),
            )
            samples = cursor.fetchall()
            if len(samples) <= 1:
                continue

            # Calculate time-weighted average
            total_duration = 0
            total_sample_count = 0
            weighted_sum = 0.0

            for i, sample in enumerate(samples):
                if sample["end_time"] is not None:
                    duration = sample["end_time"] - sample["start_time"]
                elif i < len(samples) - 1:
                    duration = samples[i + 1]["start_time"] - sample["start_time"]
                else:
                    duration = total_duration / total_sample_count if total_sample_count > 0 else 0
                total_sample_count += sample["sample_count"]

                total_duration += duration
                weighted_sum += sample["power"] * duration

            if total_duration <= 0:
                continue

            avg_power = weighted_sum / total_duration

            # Determine timestamps: use whole bucket boundaries if appropriate
            average_duration = total_duration / total_sample_count
            if first_ts <= bucket_start + 1.5 * average_duration:
                first_ts = bucket_start
            if last_ts >= bucket_end - 1.5 * average_duration:
                last_ts = bucket_end

            # Delete original samples and insert compressed entry
            self._conn.execute(
                "DELETE FROM power_flows WHERE start_time >= ? AND start_time < ? AND node_a = ? AND node_b = ?",
                (bucket_start, bucket_end, node_a, node_b),
            )
            total_compressed += len(samples)

            self._conn.execute(
                "INSERT INTO power_flows (start_time, end_time, sample_count, node_a, node_b, power) VALUES (?, ?, ?, ?, ?, ?)",
                (first_ts, last_ts, total_samples, node_a, node_b, avg_power),
            )

        self._conn.commit()
        return total_compressed
