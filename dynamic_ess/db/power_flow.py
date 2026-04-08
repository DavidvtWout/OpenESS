"""Power flow database queries."""

from dataclasses import dataclass
from datetime import datetime
from sqlite3 import Connection

from .database import dt_to_ms, ms_to_dt


def get_grid_power_by_phase(
    conn: Connection,
    start: datetime,
    end: datetime,
    bucket_seconds: float | None = None,
    phase: int | None = None,
) -> list[tuple[datetime, int, int]]:
    """Get grid power per phase.

    Args:
        conn: Database connection
        start: Start of time range
        end: End of time range
        bucket_seconds: Bucket size for aggregation (None = raw data)
        phase: Filter by phase (None = all phases)

    Returns:
        List of (time, phase, power) tuples
    """
    start_ms, end_ms = dt_to_ms(start), dt_to_ms(end)
    phase_filter = "AND n.phase = ?" if phase else ""

    if bucket_seconds:
        bucket_ms = round(bucket_seconds * 1000)
        params = [bucket_ms, bucket_ms, start_ms, end_ms]
        if phase:
            params.append(phase)

        query = f"""
            SELECT (pf.start_time / ?) * ? as bucket, n.phase,
                   CAST(AVG(pf.power) AS INTEGER) as grid_power
            FROM power_flows pf
            JOIN nodes n ON pf.node_a = n.id
            WHERE n.type = 'grid' AND pf.start_time >= ? AND pf.start_time < ? {phase_filter}
            GROUP BY bucket, n.phase ORDER BY bucket
        """
    else:
        params = [start_ms, end_ms]
        if phase:
            params.append(phase)

        query = f"""
            SELECT pf.start_time as bucket, n.phase, CAST(pf.power AS INTEGER) as grid_power
            FROM power_flows pf
            JOIN nodes n ON pf.node_a = n.id
            WHERE n.type = 'grid' AND pf.start_time >= ? AND pf.start_time < ? {phase_filter}
            ORDER BY pf.start_time
        """

    cursor = conn.execute(query, params)
    return [(ms_to_dt(row["bucket"]), row["phase"], row["grid_power"]) for row in cursor.fetchall()]


def get_total_grid_power(
    conn: Connection,
    start: datetime,
    end: datetime,
    bucket_seconds: float,
) -> list[tuple[datetime, int]]:
    """Get total grid power (sum across all phases).

    First averages power per phase per bucket, then sums across phases.

    Args:
        conn: Database connection
        start: Start of time range
        end: End of time range
        bucket_seconds: Bucket size for aggregation

    Returns:
        List of (time, total_power) tuples
    """
    bucket_ms = round(bucket_seconds * 1000)
    start_ms, end_ms = dt_to_ms(start), dt_to_ms(end)

    # First average per phase per bucket, then sum across phases
    query = f"""
        SELECT bucket, CAST(SUM(avg_power) AS INTEGER) as total_power
        FROM (
            SELECT (pf.start_time / {bucket_ms}) * {bucket_ms} as bucket,
                   pf.node_a,
                   AVG(pf.power) as avg_power
            FROM power_flows pf
            JOIN nodes n ON pf.node_a = n.id
            WHERE n.type = 'grid' AND pf.start_time >= ? AND pf.start_time < ?
            GROUP BY bucket, pf.node_a
        )
        GROUP BY bucket
        ORDER BY bucket
    """
    cursor = conn.execute(query, [start_ms, end_ms])
    return [(ms_to_dt(row["bucket"]), row["total_power"]) for row in cursor.fetchall()]


def get_battery_measurements(
    conn: Connection,
    start: datetime,
    end: datetime,
    multiplus_id: int,
    battery_id: int,
    bucket_seconds: float | None = None,
) -> dict[int, int]:
    """Get battery power measurements.

    Args:
        conn: Database connection
        start: Start of time range
        end: End of time range
        multiplus_id: Multiplus node ID
        battery_id: Battery node ID
        bucket_seconds: Bucket size for aggregation (None = raw data)

    Returns:
        Dict mapping timestamp_ms to power
    """
    start_ms, end_ms = dt_to_ms(start), dt_to_ms(end)

    if bucket_seconds:
        bucket_ms = round(bucket_seconds * 1000)
        query = f"""
            SELECT (start_time / {bucket_ms}) * {bucket_ms} as bucket,
                   CAST(AVG(power) AS INTEGER) as battery_power
            FROM power_flows
            WHERE node_a = ? AND node_b = ? AND start_time >= ? AND start_time < ?
            GROUP BY bucket
        """
        cursor = conn.execute(query, [multiplus_id, battery_id, start_ms, end_ms])
        return {row["bucket"]: row["battery_power"] for row in cursor.fetchall()}
    else:
        query = """
            SELECT start_time as timestamp, CAST(power AS INTEGER) as battery_power
            FROM power_flows
            WHERE node_a = ? AND node_b = ? AND start_time >= ? AND start_time < ?
            ORDER BY start_time
        """
        cursor = conn.execute(query, [multiplus_id, battery_id, start_ms, end_ms])
        return {row["timestamp"]: row["battery_power"] for row in cursor.fetchall()}


def get_efficiency_scatter_data(
    conn: Connection,
    multiplus_id: int,
    battery_id: int,
    pool_id: int,
    bucket_seconds: float,
    limit: int,
) -> list[dict]:
    """Get data for efficiency scatter chart.

    Args:
        conn: Database connection
        multiplus_id: Multiplus node ID
        battery_id: Battery node ID
        pool_id: Pool node ID
        bucket_seconds: Bucket size for aggregation
        limit: Maximum number of buckets to return

    Returns:
        List of dicts with bucket, battery_power, inverter_charger_power, battery_soc
    """
    bucket_ms = round(bucket_seconds * 1000)

    # Get battery power (multiplus → battery)
    battery_query = f"""
        SELECT (start_time / {bucket_ms}) * {bucket_ms} as bucket,
               AVG(power) as battery_power
        FROM power_flows
        WHERE node_a = ? AND node_b = ?
        GROUP BY bucket
        ORDER BY bucket DESC
        LIMIT ?
    """
    cursor = conn.execute(battery_query, [multiplus_id, battery_id, limit])
    battery_data = {row["bucket"]: row["battery_power"] for row in cursor.fetchall()}

    # Get inverter/charger power (pool → multiplus)
    inverter_query = f"""
        SELECT (start_time / {bucket_ms}) * {bucket_ms} as bucket,
               AVG(power) as inverter_charger_power
        FROM power_flows
        WHERE node_a = ? AND node_b = ?
        GROUP BY bucket
    """
    cursor = conn.execute(inverter_query, [pool_id, multiplus_id])
    inverter_data = {row["bucket"]: row["inverter_charger_power"] for row in cursor.fetchall()}

    # Get SOC
    soc_query = f"""
        SELECT (timestamp / {bucket_ms}) * {bucket_ms} as bucket,
               CAST(ROUND(AVG(soc)) AS INTEGER) as battery_soc
        FROM battery_soc
        GROUP BY bucket
    """
    cursor = conn.execute(soc_query)
    soc_data = {row["bucket"]: row["battery_soc"] for row in cursor.fetchall()}

    result = []
    for bucket in battery_data.keys():
        if bucket in inverter_data:
            result.append(
                {
                    "bucket": bucket,
                    "battery_power": battery_data[bucket],
                    "inverter_charger_power": inverter_data[bucket],
                    "battery_soc": soc_data.get(bucket),
                }
            )
    return result


def compress_power_flows(conn: Connection, older_than: datetime, bucket_ms: int) -> int:
    """Compress raw power flow measurements older than a given time into buckets.

    Args:
        conn: Database connection
        older_than: Only compress data with start_time before this
        bucket_ms: Bucket size in milliseconds

    Returns:
        Number of rows compressed (removed)
    """
    cutoff_ms = dt_to_ms(older_than)

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

    cursor = conn.execute(bucket_query, (bucket_ms, bucket_ms, cutoff_ms))
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

        cursor = conn.execute(
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

        average_duration = total_duration / total_sample_count
        if first_ts <= bucket_start + 1.5 * average_duration:
            first_ts = bucket_start
        if last_ts >= bucket_end - 1.5 * average_duration:
            last_ts = bucket_end

        conn.execute(
            "DELETE FROM power_flows WHERE start_time >= ? AND start_time < ? AND node_a = ? AND node_b = ?",
            (bucket_start, bucket_end, node_a, node_b),
        )
        total_compressed += len(samples)

        conn.execute(
            "INSERT INTO power_flows (start_time, end_time, sample_count, node_a, node_b, power) VALUES (?, ?, ?, ?, ?, ?)",
            (first_ts, last_ts, total_samples, node_a, node_b, avg_power),
        )

    conn.commit()
    return total_compressed
