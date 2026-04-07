"""Energy flow database queries."""

from dataclasses import dataclass
from datetime import datetime
from sqlite3 import Connection

from .database import dt_to_ms, ms_to_dt


@dataclass
class EnergyFlowPoint:
    """A single energy flow measurement."""

    time: datetime
    from_node_id: int
    to_node_id: int
    energy: float  # kWh


@dataclass
class EnergyFlowWithNames:
    """Energy flow with resolved node names."""

    time: datetime
    from_node: str
    to_node: str
    energy: float  # kWh
    source: str  # "counter" or "integrated"


def insert_energy_flow(
    conn: Connection,
    timestamp: datetime,
    from_node_id: int,
    to_node_id: int,
    energy: float,
) -> None:
    """Insert energy flow if value changed from previous.

    Uses SQL to check if the value differs from the most recent entry.
    Skips insert if energy is zero or unchanged.

    Args:
        conn: Database connection
        timestamp: Measurement timestamp
        from_node_id: Source node ID
        to_node_id: Destination node ID
        energy: Cumulative energy value (kWh)
    """
    if energy == 0:
        return

    conn.execute(
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
    conn.commit()


def get_energy_flows(
    conn: Connection,
    start: datetime,
    end: datetime,
) -> list[EnergyFlowPoint]:
    """Get all energy flows in a time range.

    Args:
        conn: Database connection
        start: Start of time range
        end: End of time range

    Returns:
        List of EnergyFlowPoint
    """
    start_ms, end_ms = dt_to_ms(start), dt_to_ms(end)

    query = """
        SELECT timestamp, node_a, node_b, energy
        FROM energy_flows
        WHERE timestamp >= ? AND timestamp < ?
        ORDER BY node_a, node_b, timestamp
    """
    cursor = conn.execute(query, [start_ms, end_ms])
    return [
        EnergyFlowPoint(
            time=ms_to_dt(row["timestamp"]),
            from_node_id=row["node_a"],
            to_node_id=row["node_b"],
            energy=row["energy"],
        )
        for row in cursor.fetchall()
    ]


def get_all_energy_flows_with_names(
    conn: Connection,
    start: datetime,
    end: datetime,
    normalize: bool = True,
) -> list[EnergyFlowWithNames]:
    """Get all energy flows with node names.

    Args:
        conn: Database connection
        start: Start of time range
        end: End of time range
        normalize: If True, subtract first value so each flow starts at 0

    Returns:
        List of EnergyFlowWithNames
    """
    start_ms, end_ms = dt_to_ms(start), dt_to_ms(end)

    query = """
        SELECT ef.timestamp, na.name as from_node, nb.name as to_node, ef.energy,
               ef.node_a, ef.node_b
        FROM energy_flows ef
        LEFT JOIN nodes na ON ef.node_a = na.id
        LEFT JOIN nodes nb ON ef.node_b = nb.id
        WHERE ef.timestamp >= ? AND ef.timestamp < ?
        ORDER BY ef.node_a, ef.node_b, ef.timestamp
    """
    cursor = conn.execute(query, [start_ms, end_ms])
    rows = cursor.fetchall()

    if normalize:
        first_values: dict[tuple[int, int], float] = {}
        for row in rows:
            key = (row["node_a"], row["node_b"])
            if key not in first_values:
                first_values[key] = row["energy"]

        return [
            EnergyFlowWithNames(
                time=ms_to_dt(row["timestamp"]),
                from_node=row["from_node"] or "unknown",
                to_node=row["to_node"] or "unknown",
                energy=round(row["energy"] - first_values[(row["node_a"], row["node_b"])], 3),
                source="counter",
            )
            for row in rows
        ]
    else:
        return [
            EnergyFlowWithNames(
                time=ms_to_dt(row["timestamp"]),
                from_node=row["from_node"] or "unknown",
                to_node=row["to_node"] or "unknown",
                energy=row["energy"],
                source="counter",
            )
            for row in rows
        ]


def get_energy_flow_at(
    conn: Connection,
    from_node_pattern: str,
    to_node_pattern: str,
    timestamp: datetime,
) -> float:
    """Get the latest energy flow value at or before the given timestamp.

    Sums across all node pairs matching the given patterns.

    Args:
        conn: Database connection
        from_node_pattern: SQL LIKE pattern for source node name
        to_node_pattern: SQL LIKE pattern for destination node name
        timestamp: Target timestamp

    Returns:
        Total energy in kWh
    """
    timestamp_ms = dt_to_ms(timestamp)

    cursor = conn.execute(
        """
        SELECT COALESCE(SUM(ef.energy), 0) as total
        FROM (
            SELECT node_a, node_b, energy
            FROM energy_flows
            WHERE timestamp <= ?
              AND (node_a, node_b) IN (
                  SELECT n1.id, n2.id
                  FROM nodes n1, nodes n2
                  WHERE n1.name LIKE ? AND n2.name LIKE ?
              )
            GROUP BY node_a, node_b
            HAVING timestamp = MAX(timestamp)
        ) ef
        """,
        [timestamp_ms, from_node_pattern, to_node_pattern],
    )
    row = cursor.fetchone()
    return row["total"] if row else 0


def get_vebus_energy_at(conn: Connection, timestamp: datetime) -> dict[str, float]:
    """Get energy counter values at the given timestamp.

    Args:
        conn: Database connection
        timestamp: Target timestamp

    Returns:
        Dict with keys: ac_in_to_battery, ac_out_to_battery, battery_to_ac_in, battery_to_ac_out
    """
    return {
        "ac_in_to_battery": get_energy_flow_at(conn, "%pool%", "%ac_in%", timestamp),
        "ac_out_to_battery": get_energy_flow_at(conn, "%pool%", "%ac_out%", timestamp),
        "battery_to_ac_in": get_energy_flow_at(conn, "%ac_in%", "%pool%", timestamp),
        "battery_to_ac_out": get_energy_flow_at(conn, "%ac_out%", "%pool%", timestamp),
    }


def integrate_power_flows(
    conn: Connection,
    start: datetime,
    end: datetime,
    max_gap_seconds: float = 300,
) -> list[EnergyFlowWithNames]:
    """Integrate power flows to calculate energy.

    Args:
        conn: Database connection
        start: Start of time range
        end: End of time range
        max_gap_seconds: Maximum gap between samples to integrate across

    Returns:
        List of EnergyFlowWithNames with source="integrated"
    """
    start_ms, end_ms = dt_to_ms(start), dt_to_ms(end)
    max_gap_hours = max_gap_seconds / 3600

    # Get node name mapping
    cursor = conn.execute("SELECT id, name FROM nodes")
    node_names = {row["id"]: row["name"] for row in cursor.fetchall()}

    # Get all power flows
    query = """
        SELECT start_time, node_a, node_b, power
        FROM power_flows
        WHERE start_time >= ? AND start_time < ?
        ORDER BY node_a, node_b, start_time
    """
    cursor = conn.execute(query, [start_ms, end_ms])
    rows = cursor.fetchall()

    # Group by node pair
    power_by_pair: dict[tuple[int, int], list[tuple[int, float]]] = {}
    for row in rows:
        key = (row["node_a"], row["node_b"])
        if key not in power_by_pair:
            power_by_pair[key] = []
        power_by_pair[key].append((row["start_time"], row["power"]))

    # Integrate each series
    result: list[EnergyFlowWithNames] = []
    for (node_a, node_b), measurements in power_by_pair.items():
        cumulative_wh = 0.0
        prev_ts = None
        prev_power = None

        for ts, power in measurements:
            if prev_ts is not None and prev_power is not None:
                dt_hours = (ts - prev_ts) / 3_600_000.0
                if dt_hours < max_gap_hours:
                    cumulative_wh += prev_power * dt_hours

            result.append(
                EnergyFlowWithNames(
                    time=ms_to_dt(ts),
                    from_node=node_names.get(node_a, f"unknown_{node_a}"),
                    to_node=node_names.get(node_b, f"unknown_{node_b}"),
                    energy=round(cumulative_wh / 1000, 3),  # Wh to kWh
                    source="integrated",
                )
            )

            prev_ts = ts
            prev_power = power

    return result


def get_grid_energy_by_bucket(
    conn: Connection,
    start: datetime,
    end: datetime,
    bucket_seconds: float,
    max_gap_seconds: float = 300,
) -> list[tuple[datetime, float, float]]:
    """Get grid energy import/export by integrating power over time.

    Args:
        conn: Database connection
        start: Start of time range
        end: End of time range
        bucket_seconds: Bucket size for aggregation
        max_gap_seconds: Maximum gap to integrate across

    Returns:
        List of (bucket_center_time, import_wh, export_wh) tuples
    """
    start_ms, end_ms = dt_to_ms(start), dt_to_ms(end)
    bucket_ms = round(bucket_seconds * 1000)
    max_gap_ms = round(max_gap_seconds * 1000)

    # Get total grid power (sum across phases)
    cursor = conn.execute(
        """
        SELECT pf.start_time as timestamp, SUM(pf.power) as grid_power
        FROM power_flows pf
        JOIN nodes n ON pf.node_a = n.id
        WHERE n.type = 'grid' AND pf.start_time >= ? AND pf.start_time < ?
        GROUP BY pf.start_time
        ORDER BY pf.start_time
        """,
        [start_ms, end_ms],
    )
    rows = cursor.fetchall()

    if len(rows) < 2:
        return []

    buckets: dict[int, dict] = {}
    prev_ts = None
    prev_power = None

    for row in rows:
        ts = row["timestamp"]
        grid_power = row["grid_power"]

        if prev_ts is not None:
            gap_ms = ts - prev_ts
            if gap_ms <= max_gap_ms:
                dt_hours = gap_ms / 3_600_000.0
                bucket_key = (ts // bucket_ms) * bucket_ms

                if bucket_key not in buckets:
                    buckets[bucket_key] = {"import_wh": 0.0, "export_wh": 0.0}

                if prev_power is not None:
                    if prev_power > 0:
                        buckets[bucket_key]["import_wh"] += prev_power * dt_hours
                    else:
                        buckets[bucket_key]["export_wh"] += abs(prev_power) * dt_hours

        prev_ts = ts
        prev_power = grid_power

    half_bucket_ms = bucket_ms // 2
    return [(ms_to_dt(bk + half_bucket_ms), d["import_wh"], d["export_wh"]) for bk, d in sorted(buckets.items())]
