import logging
import re
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from dynamic_ess.db import Database, dt_to_ms, ms_to_dt
from dynamic_ess.optimizer.optimizer import charger_loss, inverter_loss
from dynamic_ess.pricing import PriceConfig

logger = logging.getLogger(__name__)

router = APIRouter(tags=["api"])

# Milliseconds per minute/hour
MS_PER_MIN = 60_000
MS_PER_HOUR = 3_600_000


def get_db() -> Database:
    from dynamic_ess.web.dependencies import get_database

    return get_database()


def get_prices() -> PriceConfig:
    from dynamic_ess.web.dependencies import get_price_config

    return get_price_config()


class PricePoint(BaseModel):
    time: datetime
    market_price: float
    buy_price: float
    sell_price: float


class GridPowerPoint(BaseModel):
    time: datetime
    phase: int
    grid_power: int | None


class SocPoint(BaseModel):
    time: datetime
    soc: int


class BatterySocResponse(BaseModel):
    actual: list[SocPoint]
    scheduled: list[SocPoint]


class BatteryMeasurementPoint(BaseModel):
    time: datetime
    battery_power: int | None
    battery_soc: int | None


class HealthResponse(BaseModel):
    status: str
    database: str
    tables: list[str]


class BatteryCycle(BaseModel):
    start_time: datetime
    end_time: datetime
    duration_hours: float
    min_soc: int
    # AC side from energy_flows counters
    ac_energy_in_wh: float  # energy drawn from grid for charging (counter)
    ac_energy_out_wh: float  # energy delivered to grid/loads (counter)
    # Efficiency
    system_efficiency: float | None  # AC out / AC in from counters


class EnergyFlowPoint(BaseModel):
    time: datetime
    inverter_output_wh: float
    inverter_losses_wh: float
    charger_input_wh: float
    charger_losses_wh: float
    grid_export_wh: float
    grid_import_wh: float
    consumption_wh: float


class GridEnergyFlowPoint(BaseModel):
    time: datetime
    grid_import_wh: float
    grid_export_wh: float


class GridPowerSummary(BaseModel):
    time: datetime
    grid_power: int | None


class PowerPoint(BaseModel):
    time: datetime
    grid_power: int | None
    battery_power: int | None
    inverter_charger_power: int | None


class EfficiencyScatterPoint(BaseModel):
    time: datetime
    battery_power: float
    inverter_charger_power: float
    losses: float
    efficiency: float | None
    soc: int | None
    category: str


class SchedulePoint(BaseModel):
    start_time: datetime
    end_time: datetime
    power_w: int  # positive = charging, negative = discharging
    expected_soc: int
    # Predicted values based on loss formulas
    charger_input_w: float  # power drawn from grid when charging
    inverter_output_w: float  # power delivered to grid when discharging
    charger_loss_w: float
    inverter_loss_w: float


@router.get("/health", response_model=HealthResponse)
async def health_check(db: Database = Depends(get_db)):
    try:
        cursor = db._conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row["name"] for row in cursor.fetchall()]
        return HealthResponse(status="ok", database="connected", tables=tables)
    except Exception as e:
        logger.exception("Health check failed")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/schedule", response_model=list[SchedulePoint])
async def get_schedule(
    start: datetime | None = Query(default=None),
    db: Database = Depends(get_db),
):
    """Get the charge/discharge schedule with predicted losses."""
    try:
        schedule = db.get_schedule(start)
        result = []
        for start_time, end_time, power_w, expected_soc in schedule:
            power_kw = power_w / 1000.0
            if power_w > 0:
                # Charging: charger draws more from grid than goes into battery
                charger_loss_w = charger_loss(power_kw) * 1000  # W
                charger_input = power_w + charger_loss_w
                inverter_output = 0
                inverter_loss_w = 0
            elif power_w < 0:
                # Discharging: battery provides more than goes to grid
                # power_w is negative, so abs() for calculation
                battery_power_kw = abs(power_kw)
                inverter_loss_w = inverter_loss(battery_power_kw) * 1000  # W
                inverter_output = abs(power_w) - inverter_loss_w
                charger_input = 0
                charger_loss_w = 0
            else:
                charger_input = 0
                charger_loss_w = 0
                inverter_output = 0
                inverter_loss_w = 0

            result.append(
                SchedulePoint(
                    start_time=start_time,
                    end_time=end_time,
                    power_w=power_w,
                    expected_soc=expected_soc,
                    charger_input_w=round(charger_input, 1),
                    inverter_output_w=round(inverter_output, 1),
                    charger_loss_w=round(charger_loss_w, 1),
                    inverter_loss_w=round(inverter_loss_w, 1),
                )
            )
        return result
    except Exception as e:
        logger.exception("Failed to get schedule")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/prices", response_model=list[PricePoint])
async def get_price_data(
    start: datetime | None = Query(default=None),
    end: datetime | None = Query(default=None),
    db: Database = Depends(get_db),
    price_config: PriceConfig = Depends(get_prices),
):
    try:
        now = datetime.now(timezone.utc)
        if start is None:
            start = now - timedelta(days=7)
        if end is None:
            end = now + timedelta(days=2)

        # Aggregate to hourly - bucket by hour
        query = """
            SELECT (start_time / ?) * ? as hour, AVG(price) / 1000.0 as price
            FROM day_ahead_prices
            WHERE area = ? AND start_time >= ? AND start_time < ?
            GROUP BY hour ORDER BY hour
        """
        cursor = db._conn.execute(query, [MS_PER_HOUR, MS_PER_HOUR, price_config.area, dt_to_ms(start), dt_to_ms(end)])
        return [
            PricePoint(
                time=ms_to_dt(row["hour"]),
                market_price=row["price"],
                buy_price=price_config.buy_price(row["price"]),
                sell_price=price_config.sell_price(row["price"]),
            )
            for row in cursor.fetchall()
        ]
    except Exception as e:
        logger.exception("Failed to get prices")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/grid-power", response_model=list[GridPowerPoint])
async def get_grid_power(
    start: datetime | None = Query(default=None),
    end: datetime | None = Query(default=None),
    phase: int | None = Query(default=None),
    aggregate_minutes: int = Query(default=0),
    db: Database = Depends(get_db),
):
    """Get grid power measurements per phase from power_flows table."""
    try:
        now = datetime.now(timezone.utc)
        if start is None:
            start = now - timedelta(hours=24)
        if end is None:
            end = now

        phase_filter = "AND n.phase = ?" if phase else ""
        params: list = []

        if aggregate_minutes > 0:
            bucket_ms = aggregate_minutes * MS_PER_MIN
            params = [bucket_ms, bucket_ms, dt_to_ms(start), dt_to_ms(end)]
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
            cursor = db._conn.execute(query, params)
        else:
            params = [dt_to_ms(start), dt_to_ms(end)]
            if phase:
                params.append(phase)

            query = f"""
                SELECT pf.start_time as timestamp, n.phase, CAST(pf.power AS INTEGER) as grid_power
                FROM power_flows pf
                JOIN nodes n ON pf.node_a = n.id
                WHERE n.type = 'grid' AND pf.start_time >= ? AND pf.start_time < ? {phase_filter}
                ORDER BY pf.start_time
            """
            cursor = db._conn.execute(query, params)

        return [
            GridPowerPoint(
                time=ms_to_dt(row["bucket"] if aggregate_minutes > 0 else row["timestamp"]),
                phase=row["phase"],
                grid_power=row["grid_power"],
            )
            for row in cursor.fetchall()
        ]
    except Exception as e:
        logger.exception("Failed to get grid power")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/battery-soc", response_model=BatterySocResponse)
async def get_battery_soc(
    start: datetime | None = Query(default=None),
    end: datetime | None = Query(default=None),
    db: Database = Depends(get_db),
):
    try:
        now = datetime.now(timezone.utc)
        if start is None:
            start = now - timedelta(hours=24)
        if end is None:
            end = now

        actual = [SocPoint(time=t, soc=soc) for t, soc in db.get_battery_soc(start, end)]
        scheduled = [SocPoint(time=t, soc=soc) for _, t, _, soc in db.get_schedule(start)]
        return BatterySocResponse(actual=actual, scheduled=scheduled)
    except Exception as e:
        logger.exception("Failed to get battery SOC")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/battery", response_model=list[BatteryMeasurementPoint])
async def get_battery_measurements(
    start: datetime | None = Query(default=None),
    end: datetime | None = Query(default=None),
    aggregate_minutes: int = Query(default=0),
    db: Database = Depends(get_db),
):
    """Get battery power and SOC measurements."""
    try:
        now = datetime.now(timezone.utc)
        if start is None:
            start = now - timedelta(hours=24)
        if end is None:
            end = now

        start_ms, end_ms = dt_to_ms(start), dt_to_ms(end)

        # Get battery node IDs
        cursor = db._conn.execute("SELECT id FROM nodes WHERE name = 'multiplus'")
        row = cursor.fetchone()
        if not row:
            return []
        multiplus_id = row["id"]

        cursor = db._conn.execute("SELECT id FROM nodes WHERE name = 'battery'")
        row = cursor.fetchone()
        if not row:
            return []
        battery_id = row["id"]

        if aggregate_minutes > 0:
            bucket_ms = aggregate_minutes * MS_PER_MIN
            # Get battery power from power_flows
            power_query = f"""
                SELECT (start_time / {bucket_ms}) * {bucket_ms} as bucket,
                       CAST(AVG(power) AS INTEGER) as battery_power
                FROM power_flows
                WHERE node_a = ? AND node_b = ? AND start_time >= ? AND start_time < ?
                GROUP BY bucket
            """
            cursor = db._conn.execute(power_query, [multiplus_id, battery_id, start_ms, end_ms])
            power_data = {row["bucket"]: row["battery_power"] for row in cursor.fetchall()}

            # Get SOC - use last value in each bucket
            soc_query = f"""
                SELECT (timestamp / {bucket_ms}) * {bucket_ms} as bucket,
                       soc as battery_soc
                FROM battery_soc
                WHERE timestamp >= ? AND timestamp < ?
                GROUP BY bucket
                HAVING timestamp = MAX(timestamp)
            """
            cursor = db._conn.execute(soc_query, [start_ms, end_ms])
            soc_data = {row["bucket"]: row["battery_soc"] for row in cursor.fetchall()}

            all_buckets = sorted(set(power_data.keys()) | set(soc_data.keys()))
            return [
                BatteryMeasurementPoint(
                    time=ms_to_dt(b),
                    battery_power=power_data.get(b),
                    battery_soc=soc_data.get(b),
                )
                for b in all_buckets
            ]
        else:
            # Get battery power from power_flows
            cursor = db._conn.execute(
                """
                SELECT start_time as timestamp, CAST(power AS INTEGER) as battery_power
                FROM power_flows
                WHERE node_a = ? AND node_b = ? AND start_time >= ? AND start_time < ?
                ORDER BY start_time
                """,
                [multiplus_id, battery_id, start_ms, end_ms],
            )
            power_data = {row["timestamp"]: row["battery_power"] for row in cursor.fetchall()}

            # Get SOC
            cursor = db._conn.execute(
                "SELECT timestamp, soc as battery_soc FROM battery_soc WHERE timestamp >= ? AND timestamp < ? ORDER BY timestamp",
                [start_ms, end_ms],
            )
            soc_data = {row["timestamp"]: row["battery_soc"] for row in cursor.fetchall()}

            all_timestamps = sorted(set(power_data.keys()) | set(soc_data.keys()))
            return [
                BatteryMeasurementPoint(
                    time=ms_to_dt(ts),
                    battery_power=power_data.get(ts),
                    battery_soc=soc_data.get(ts),
                )
                for ts in all_timestamps
            ]
    except Exception as e:
        logger.exception("Failed to get battery measurements")
        raise HTTPException(status_code=500, detail=str(e))


def _find_cycles_recursive(
    rows: list,
    start: int,
    end: int,
    min_soc_swing: int,
) -> list[dict]:
    """
    Find battery cycles using divide-and-conquer.

    Algorithm:
    1. Find the global minimum SoC in the range
    2. Find the peak (max SoC) on the left and right sides
    3. If min(left_peak, right_peak) - min_soc >= threshold, it's a valid cycle
    4. Recursively process data before left peak and after right peak
    5. If no valid cycle, split at minimum and recurse both sides

    rows: list of (timestamp_ms, soc) tuples
    start, end: range indices (end exclusive)

    Returns cycle boundaries only; energy is calculated separately.
    """
    if end - start < 3:
        return []

    # Find minimum SoC in range
    min_idx = start
    min_soc = rows[start][1]
    for i in range(start + 1, end):
        if rows[i][1] < min_soc:
            min_soc = rows[i][1]
            min_idx = i

    # Find peak on left side (start to min_idx inclusive)
    left_peak_idx = start
    left_peak = rows[start][1]
    for i in range(start, min_idx + 1):
        if rows[i][1] > left_peak:
            left_peak = rows[i][1]
            left_peak_idx = i

    # Find peak on right side (min_idx to end exclusive)
    right_peak_idx = min_idx
    right_peak = rows[min_idx][1]
    for i in range(min_idx, end):
        if rows[i][1] > right_peak:
            right_peak = rows[i][1]
            right_peak_idx = i

    # Calculate effective peak (lower of the two) and swing
    effective_peak = min(left_peak, right_peak)
    swing = effective_peak - min_soc

    if swing >= min_soc_swing:
        cycle = {
            "start_idx": left_peak_idx,
            "end_idx": right_peak_idx,
            "start_ms": rows[left_peak_idx][0],
            "end_ms": rows[right_peak_idx][0],
            "min_soc": min_soc,
        }

        return (
            _find_cycles_recursive(rows, start, left_peak_idx, min_soc_swing)
            + [cycle]
            + _find_cycles_recursive(rows, right_peak_idx + 1, end, min_soc_swing)
        )
    else:
        return _find_cycles_recursive(rows, start, left_peak_idx, min_soc_swing) + _find_cycles_recursive(
            rows, right_peak_idx + 1, end, min_soc_swing
        )


def _get_energy_flow_at(conn, from_node_type: str, to_node_type: str, timestamp_ms: int) -> float:
    """Get the latest energy flow value at or before the given timestamp.

    Sums across all node pairs matching the given types (e.g., all ac_in → pool flows).
    """
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
        [timestamp_ms, f"%{from_node_type}%", f"%{to_node_type}%"],
    )
    row = cursor.fetchone()
    return row["total"] if row else 0


def _get_vebus_energy_at(conn, timestamp_ms: int) -> dict:
    """Get energy counter values at the given timestamp using energy_flows table."""
    return {
        "ac_in_to_battery": _get_energy_flow_at(conn, "pool", "ac_in", timestamp_ms),
        "ac_out_to_battery": _get_energy_flow_at(conn, "pool", "ac_out", timestamp_ms),
        "battery_to_ac_in": _get_energy_flow_at(conn, "ac_in", "pool", timestamp_ms),
        "battery_to_ac_out": _get_energy_flow_at(conn, "ac_out", "pool", timestamp_ms),
    }


@router.get("/cycles", response_model=list[BatteryCycle])
async def get_battery_cycles(
    start: datetime | None = Query(default=None),
    end: datetime | None = Query(default=None),
    min_soc_swing: int = Query(default=10),
    db: Database = Depends(get_db),
):
    """Find battery cycles based on SOC swings and calculate energy from counters."""
    try:
        now = datetime.now(timezone.utc)
        if start is None:
            start = now - timedelta(days=30)
        if end is None:
            end = now

        cursor = db._conn.execute(
            "SELECT timestamp, soc FROM battery_soc WHERE timestamp >= ? AND timestamp < ? ORDER BY timestamp",
            [dt_to_ms(start), dt_to_ms(end)],
        )
        rows = [(row["timestamp"], row["soc"]) for row in cursor.fetchall()]

        if len(rows) < 3:
            return []

        # Find cycles using divide-and-conquer (boundaries only)
        raw_cycles = _find_cycles_recursive(rows, 0, len(rows), min_soc_swing)

        # Calculate energy for each cycle and convert to response format
        cycles = []
        for c in sorted(raw_cycles, key=lambda x: x["start_ms"]):
            start_time = ms_to_dt(c["start_ms"])
            end_time = ms_to_dt(c["end_ms"])
            duration = (end_time - start_time).total_seconds() / 3600.0

            # AC energy from energy_flows counters (cumulative, so take delta)
            vebus_start = _get_vebus_energy_at(db._conn, c["start_ms"])
            vebus_end = _get_vebus_energy_at(db._conn, c["end_ms"])

            # Energy drawn from grid for charging (kWh -> Wh)
            ac_energy_in = (
                vebus_end["ac_in_to_battery"]
                - vebus_start["ac_in_to_battery"]
                + (vebus_end["ac_out_to_battery"] - vebus_start["ac_out_to_battery"])
            ) * 1000
            # Energy delivered from battery to grid and loads (kWh -> Wh)
            ac_energy_out = (
                (vebus_end["battery_to_ac_in"] - vebus_start["battery_to_ac_in"])
                + (vebus_end["battery_to_ac_out"] - vebus_start["battery_to_ac_out"])
            ) * 1000

            # System efficiency from counters: AC out / AC in
            system_eff = (ac_energy_out / ac_energy_in) * 100 if ac_energy_in > 0 else None

            cycles.append(
                BatteryCycle(
                    start_time=start_time,
                    end_time=end_time,
                    duration_hours=round(duration, 2),
                    min_soc=round(c["min_soc"]),
                    ac_energy_in_wh=round(ac_energy_in, 1),
                    ac_energy_out_wh=round(ac_energy_out, 1),
                    system_efficiency=round(system_eff, 1) if system_eff else None,
                )
            )

        return cycles
    except Exception as e:
        logger.exception("Failed to get battery cycles")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/grid-energy", response_model=list[GridEnergyFlowPoint])
async def get_grid_energy(
    start: datetime | None = Query(default=None),
    end: datetime | None = Query(default=None),
    bucket_minutes: int = Query(default=60),
    max_gap_seconds: int = Query(default=300),
    db: Database = Depends(get_db),
):
    """Get grid energy import/export by integrating power over time."""
    try:
        now = datetime.now(timezone.utc)
        if start is None:
            start = now - timedelta(hours=24)
        if end is None:
            end = now

        start_ms, end_ms = dt_to_ms(start), dt_to_ms(end)

        # Get total grid power (sum across phases) from power_flows
        cursor = db._conn.execute(
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

        bucket_ms = bucket_minutes * MS_PER_MIN
        max_gap_ms = max_gap_seconds * 1000
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
                        buckets[bucket_key] = {"grid_import_wh": 0.0, "grid_export_wh": 0.0}

                    if prev_power is not None:
                        if prev_power > 0:
                            buckets[bucket_key]["grid_import_wh"] += prev_power * dt_hours
                        else:
                            buckets[bucket_key]["grid_export_wh"] += abs(prev_power) * dt_hours

            prev_ts = ts
            prev_power = grid_power

        # Center the time in the middle of each bucket
        half_bucket_ms = bucket_ms // 2
        return [
            GridEnergyFlowPoint(
                time=ms_to_dt(bk + half_bucket_ms),
                grid_import_wh=round(d["grid_import_wh"], 1),
                grid_export_wh=round(d["grid_export_wh"], 1),
            )
            for bk, d in sorted(buckets.items())
        ]
    except Exception as e:
        logger.exception("Failed to get grid energy")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/energy-flow", response_model=list[EnergyFlowPoint])
async def get_energy_flow(
    start: datetime | None = Query(default=None),
    end: datetime | None = Query(default=None),
    bucket_minutes: int = Query(default=60),
    max_gap_seconds: int = Query(default=300),
    db: Database = Depends(get_db),
):
    """Get energy flow data by integrating power over time.

    Returns per-bucket breakdown of:
    - charger_input_wh: energy drawn from grid for charging
    - charger_losses_wh: losses during charging
    - inverter_output_wh: energy delivered from battery
    - inverter_losses_wh: losses during discharging
    - grid_import_wh / grid_export_wh: total grid energy
    - consumption_wh: energy consumed by loads
    """
    try:
        now = datetime.now(timezone.utc)
        if start is None:
            start = now - timedelta(hours=24)
        if end is None:
            end = now

        start_ms, end_ms = dt_to_ms(start), dt_to_ms(end)

        # Get node IDs
        cursor = db._conn.execute("SELECT id FROM nodes WHERE name = 'battery'")
        row = cursor.fetchone()
        battery_id = row["id"] if row else None

        cursor = db._conn.execute("SELECT id FROM nodes WHERE type = 'multiplus' AND name NOT LIKE 'mp_%_ac%'")
        row = cursor.fetchone()
        multiplus_id = row["id"] if row else None

        cursor = db._conn.execute("SELECT id FROM nodes WHERE name = 'pool'")
        row = cursor.fetchone()
        pool_id = row["id"] if row else None

        # Get all power measurements at each timestamp
        # Grid power (sum across phases)
        cursor = db._conn.execute(
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
        grid_data = {row["timestamp"]: row["grid_power"] for row in cursor.fetchall()}

        # Battery power (multiplus → battery)
        battery_data = {}
        if multiplus_id and battery_id:
            cursor = db._conn.execute(
                "SELECT start_time as timestamp, power as battery_power FROM power_flows WHERE node_a = ? AND node_b = ? AND start_time >= ? AND start_time < ? ORDER BY start_time",
                [multiplus_id, battery_id, start_ms, end_ms],
            )
            battery_data = {row["timestamp"]: row["battery_power"] for row in cursor.fetchall()}

        # Inverter/charger power (pool → multiplus)
        inverter_data = {}
        if pool_id and multiplus_id:
            cursor = db._conn.execute(
                "SELECT start_time as timestamp, power as inverter_charger_power FROM power_flows WHERE node_a = ? AND node_b = ? AND start_time >= ? AND start_time < ? ORDER BY start_time",
                [pool_id, multiplus_id, start_ms, end_ms],
            )
            inverter_data = {row["timestamp"]: row["inverter_charger_power"] for row in cursor.fetchall()}

        # Merge all timestamps
        all_timestamps = sorted(set(grid_data.keys()) | set(battery_data.keys()) | set(inverter_data.keys()))

        if len(all_timestamps) < 2:
            return []

        bucket_ms = bucket_minutes * MS_PER_MIN
        max_gap_ms = max_gap_seconds * 1000
        buckets: dict[int, dict] = {}

        prev_ts = None
        for ts in all_timestamps:
            if prev_ts is not None:
                gap_ms = ts - prev_ts
                if gap_ms <= max_gap_ms:
                    dt_hours = gap_ms / 3_600_000.0
                    bucket_key = (ts // bucket_ms) * bucket_ms

                    if bucket_key not in buckets:
                        buckets[bucket_key] = {
                            "grid_import_wh": 0.0,
                            "grid_export_wh": 0.0,
                            "charger_input_wh": 0.0,
                            "charger_losses_wh": 0.0,
                            "inverter_output_wh": 0.0,
                            "inverter_losses_wh": 0.0,
                        }

                    b = buckets[bucket_key]

                    # Grid energy
                    grid_power = grid_data.get(prev_ts, 0)
                    if grid_power > 0:
                        b["grid_import_wh"] += grid_power * dt_hours
                    else:
                        b["grid_export_wh"] += abs(grid_power) * dt_hours

                    # Battery and inverter energy
                    battery_power = battery_data.get(prev_ts, 0)
                    inverter_power = inverter_data.get(prev_ts, 0)

                    if battery_power > 0:
                        # Charging: inverter_power is input, battery_power is what gets stored
                        b["charger_input_wh"] += abs(inverter_power) * dt_hours
                        b["charger_losses_wh"] += max(0, abs(inverter_power) - battery_power) * dt_hours
                    elif battery_power < 0:
                        # Discharging: battery provides power, inverter outputs less due to losses
                        battery_discharge = abs(battery_power)
                        inverter_out = abs(inverter_power)
                        b["inverter_output_wh"] += inverter_out * dt_hours
                        b["inverter_losses_wh"] += max(0, battery_discharge - inverter_out) * dt_hours

            prev_ts = ts

        # Calculate consumption and center time in buckets
        half_bucket_ms = bucket_ms // 2
        result = []
        for bk, d in sorted(buckets.items()):
            # Consumption = grid_import + inverter_output - charger_input
            # (energy that went to loads, not back to grid or battery)
            consumption = d["grid_import_wh"] + d["inverter_output_wh"] - d["charger_input_wh"] - d["grid_export_wh"]
            consumption = max(0, consumption)  # Clip negative values

            result.append(
                EnergyFlowPoint(
                    time=ms_to_dt(bk + half_bucket_ms),
                    inverter_output_wh=round(d["inverter_output_wh"], 1),
                    inverter_losses_wh=round(d["inverter_losses_wh"], 1),
                    charger_input_wh=round(d["charger_input_wh"], 1),
                    charger_losses_wh=round(d["charger_losses_wh"], 1),
                    grid_export_wh=round(d["grid_export_wh"], 1),
                    grid_import_wh=round(d["grid_import_wh"], 1),
                    consumption_wh=round(consumption, 1),
                )
            )

        return result
    except Exception as e:
        logger.exception("Failed to get energy flow")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/power", response_model=list[PowerPoint])
async def get_power(
    start: datetime | None = Query(default=None),
    end: datetime | None = Query(default=None),
    aggregate_minutes: int = Query(default=1),
    db: Database = Depends(get_db),
):
    """Get power measurements: grid, battery, and inverter/charger."""
    try:
        now = datetime.now(timezone.utc)
        if start is None:
            start = now - timedelta(hours=24)
        if end is None:
            end = now

        bucket_seconds = aggregate_minutes * 60

        # Get mp_ac node IDs (e.g., mp_228_ac_in1, mp_228_ac_out)
        mp_ac_pattern = re.compile(r"^mp_\d+_ac_.*$")
        mp_ac_ids = [node_id for node_id, name, _, _ in db.get_nodes() if mp_ac_pattern.match(name)]

        battery_id = db.get_battery_id()
        pool_id = db.get_pool_id()

        # Grid power (sum across phases)
        grid_data = {t: p for t, p in db.get_grid_power(start, end, bucket_seconds)}

        # Battery power (multiplus → battery)
        # Get flows where destination is battery, sum all sources
        battery_flows = db.get_power_flow(start, end, bucket_seconds, to_node_ids=[battery_id])
        battery_data: dict[datetime, int] = {}
        for bucket_time, _, _, power in battery_flows:
            battery_data[bucket_time] = battery_data.get(bucket_time, 0) + power

        # Inverter/charger power (pool → mp_ac nodes, sum all)
        inverter_flows = db.get_power_flow(start, end, bucket_seconds, from_node_ids=[pool_id], to_node_ids=mp_ac_ids)
        inverter_data: dict[datetime, int] = {}
        for bucket_time, _, _, power in inverter_flows:
            inverter_data[bucket_time] = inverter_data.get(bucket_time, 0) + power

        all_buckets = sorted(set(grid_data.keys()) | set(battery_data.keys()) | set(inverter_data.keys()))
        return [
            PowerPoint(
                time=b,
                grid_power=grid_data.get(b),
                battery_power=battery_data.get(b),
                inverter_charger_power=inverter_data.get(b),
            )
            for b in all_buckets
        ]
    except Exception as e:
        logger.exception("Failed to get power data")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/efficiency-scatter", response_model=list[EfficiencyScatterPoint])
async def get_efficiency_scatter(
    limit: int = Query(default=2000),
    aggregate_minutes: int = Query(default=10),
    idle_threshold: int = Query(default=5),
    balancing_threshold: int = Query(default=100),
    db: Database = Depends(get_db),
):
    """Get efficiency scatter data for battery power vs inverter/charger power."""
    try:
        bucket_ms = aggregate_minutes * MS_PER_MIN

        # Get node IDs
        cursor = db._conn.execute("SELECT id FROM nodes WHERE name = 'battery'")
        row = cursor.fetchone()
        if not row:
            return []
        battery_id = row["id"]

        cursor = db._conn.execute("SELECT id FROM nodes WHERE type = 'multiplus' AND name NOT LIKE 'mp_%_ac%'")
        row = cursor.fetchone()
        if not row:
            return []
        multiplus_id = row["id"]

        cursor = db._conn.execute("SELECT id FROM nodes WHERE name = 'pool'")
        row = cursor.fetchone()
        if not row:
            return []
        pool_id = row["id"]

        # Get battery power (multiplus → battery) grouped by bucket
        battery_query = f"""
            SELECT (start_time / {bucket_ms}) * {bucket_ms} as bucket,
                   AVG(power) as battery_power
            FROM power_flows
            WHERE node_a = ? AND node_b = ?
            GROUP BY bucket
            ORDER BY bucket DESC
            LIMIT ?
        """
        cursor = db._conn.execute(battery_query, [multiplus_id, battery_id, limit])
        battery_data = {row["bucket"]: row["battery_power"] for row in cursor.fetchall()}

        # Get inverter/charger power (pool → multiplus) grouped by bucket
        inverter_query = f"""
            SELECT (start_time / {bucket_ms}) * {bucket_ms} as bucket,
                   AVG(power) as inverter_charger_power
            FROM power_flows
            WHERE node_a = ? AND node_b = ?
            GROUP BY bucket
        """
        cursor = db._conn.execute(inverter_query, [pool_id, multiplus_id])
        inverter_data = {row["bucket"]: row["inverter_charger_power"] for row in cursor.fetchall()}

        # Get SOC grouped by bucket
        soc_query = f"""
            SELECT (timestamp / {bucket_ms}) * {bucket_ms} as bucket,
                   CAST(ROUND(AVG(soc)) AS INTEGER) as battery_soc
            FROM battery_soc
            GROUP BY bucket
        """
        cursor = db._conn.execute(soc_query)
        soc_data = {row["bucket"]: row["battery_soc"] for row in cursor.fetchall()}

        points = []
        for bucket in battery_data.keys():
            battery_power = battery_data.get(bucket)
            inverter_charger_power = inverter_data.get(bucket)
            battery_soc = soc_data.get(bucket)

            if battery_power is None or inverter_charger_power is None:
                continue

            if abs(battery_power) < idle_threshold:
                category = "idling"
            elif battery_power > 0 and battery_soc == 100 and abs(inverter_charger_power) < balancing_threshold:
                category = "balancing"
            elif battery_power > 0:
                category = "charging"
            else:
                category = "discharging"

            losses = inverter_charger_power - battery_power
            efficiency = None
            if category == "charging" and inverter_charger_power > 0:
                efficiency = (battery_power / inverter_charger_power) * 100
            elif category == "discharging" and battery_power < 0:
                efficiency = (inverter_charger_power / battery_power) * 100

            points.append(
                EfficiencyScatterPoint(
                    time=ms_to_dt(bucket),
                    battery_power=round(abs(battery_power), 1),
                    inverter_charger_power=round(inverter_charger_power, 1),
                    losses=round(losses, 1),
                    efficiency=round(efficiency, 1) if efficiency is not None else None,
                    soc=battery_soc,
                    category=category,
                )
            )

        return points
    except Exception as e:
        logger.exception("Failed to get efficiency scatter data")
        raise HTTPException(status_code=500, detail=str(e))
