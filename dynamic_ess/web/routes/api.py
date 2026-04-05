import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from dynamic_ess.db import Database, dt_to_ms, ms_to_dt
from dynamic_ess.optimizer.optimizer import charger_loss_kw, inverter_loss_kw
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


class SystemMeasurementPoint(BaseModel):
    time: datetime
    phase: int
    ac_consumption: int | None
    grid_power: int | None


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
    energy_discharged_wh: float
    energy_charged_wh: float
    efficiency: float


class EnergyFlowPoint(BaseModel):
    time: datetime
    grid_import_wh: float
    grid_export_wh: float
    battery_charge_wh: float
    battery_discharge_wh: float
    charger_input_wh: float
    inverter_output_wh: float
    charger_losses_wh: float
    inverter_losses_wh: float
    consumption_wh: float


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
                charger_loss = charger_loss_kw(power_kw) * 1000  # W
                charger_input = power_w + charger_loss
                inverter_output = 0
                inverter_loss = 0
            elif power_w < 0:
                # Discharging: battery provides more than goes to grid
                # power_w is negative, so abs() for calculation
                battery_power_kw = abs(power_kw)
                inverter_loss = inverter_loss_kw(battery_power_kw) * 1000  # W
                inverter_output = abs(power_w) - inverter_loss
                charger_input = 0
                charger_loss = 0
            else:
                charger_input = 0
                charger_loss = 0
                inverter_output = 0
                inverter_loss = 0

            result.append(
                SchedulePoint(
                    start_time=start_time,
                    end_time=end_time,
                    power_w=power_w,
                    expected_soc=expected_soc,
                    charger_input_w=round(charger_input, 1),
                    inverter_output_w=round(inverter_output, 1),
                    charger_loss_w=round(charger_loss, 1),
                    inverter_loss_w=round(inverter_loss, 1),
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


@router.get("/system", response_model=list[SystemMeasurementPoint])
async def get_system_measurements(
    start: datetime | None = Query(default=None),
    end: datetime | None = Query(default=None),
    phase: int | None = Query(default=None),
    aggregate_minutes: int = Query(default=0),
    db: Database = Depends(get_db),
):
    try:
        now = datetime.now(timezone.utc)
        if start is None:
            start = now - timedelta(hours=24)
        if end is None:
            end = now

        if aggregate_minutes > 0:
            bucket_ms = aggregate_minutes * MS_PER_MIN
            phase_filter = "AND phase = ?" if phase else ""
            params = [bucket_ms, bucket_ms, dt_to_ms(start), dt_to_ms(end)]
            if phase:
                params.append(phase)

            query = f"""
                SELECT (timestamp / ?) * ? as bucket, phase,
                       CAST(AVG(ac_consumption) AS INTEGER) as ac_consumption,
                       CAST(AVG(grid_power) AS INTEGER) as grid_power
                FROM system_measurements
                WHERE timestamp >= ? AND timestamp < ? {phase_filter}
                GROUP BY bucket, phase ORDER BY bucket
            """
            cursor = db._conn.execute(query, params)
        else:
            phase_filter = "AND phase = ?" if phase else ""
            params = [dt_to_ms(start), dt_to_ms(end)]
            if phase:
                params.append(phase)

            query = f"""
                SELECT timestamp, phase, ac_consumption, grid_power
                FROM system_measurements
                WHERE timestamp >= ? AND timestamp < ? {phase_filter}
                ORDER BY timestamp
            """
            cursor = db._conn.execute(query, params)

        return [
            SystemMeasurementPoint(
                time=ms_to_dt(row["bucket"] if aggregate_minutes > 0 else row["timestamp"]),
                phase=row["phase"],
                ac_consumption=row["ac_consumption"],
                grid_power=row["grid_power"],
            )
            for row in cursor.fetchall()
        ]
    except Exception as e:
        logger.exception("Failed to get system measurements")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/battery", response_model=list[BatteryMeasurementPoint])
async def get_battery_measurements(
    start: datetime | None = Query(default=None),
    end: datetime | None = Query(default=None),
    aggregate_minutes: int = Query(default=0),
    db: Database = Depends(get_db),
):
    try:
        now = datetime.now(timezone.utc)
        if start is None:
            start = now - timedelta(hours=24)
        if end is None:
            end = now

        if aggregate_minutes > 0:
            bucket_ms = aggregate_minutes * MS_PER_MIN
            query = """
                SELECT (timestamp / ?) * ? as bucket,
                       CAST(AVG(battery_power) AS INTEGER) as battery_power,
                       CAST(AVG(battery_soc) AS INTEGER) as battery_soc
                FROM system_battery
                WHERE timestamp >= ? AND timestamp < ?
                GROUP BY bucket ORDER BY bucket
            """
            cursor = db._conn.execute(query, [bucket_ms, bucket_ms, dt_to_ms(start), dt_to_ms(end)])
        else:
            cursor = db._conn.execute(
                "SELECT timestamp, battery_power, battery_soc FROM system_battery WHERE timestamp >= ? AND timestamp < ? ORDER BY timestamp",
                [dt_to_ms(start), dt_to_ms(end)],
            )

        return [
            BatteryMeasurementPoint(
                time=ms_to_dt(row["bucket"] if aggregate_minutes > 0 else row["timestamp"]),
                battery_power=row["battery_power"],
                battery_soc=row["battery_soc"],
            )
            for row in cursor.fetchall()
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

    rows: list of (timestamp_ms, power, soc) tuples
    start, end: range indices (end exclusive)
    """
    if end - start < 3:
        return []

    # Find minimum SoC in range
    min_idx = start
    min_soc = rows[start][2]
    for i in range(start + 1, end):
        if rows[i][2] < min_soc:
            min_soc = rows[i][2]
            min_idx = i

    # Find peak on left side (start to min_idx inclusive)
    left_peak_idx = start
    left_peak = rows[start][2]
    for i in range(start, min_idx + 1):
        if rows[i][2] > left_peak:
            left_peak = rows[i][2]
            left_peak_idx = i

    # Find peak on right side (min_idx to end exclusive)
    right_peak_idx = min_idx
    right_peak = rows[min_idx][2]
    for i in range(min_idx, end):
        if rows[i][2] > right_peak:
            right_peak = rows[i][2]
            right_peak_idx = i

    # Calculate effective peak (lower of the two) and swing
    effective_peak = min(left_peak, right_peak)
    swing = effective_peak - min_soc

    if swing >= min_soc_swing:
        # Valid cycle from left_peak to right_peak
        # Calculate energy during the cycle
        energy_discharged = 0.0
        energy_charged = 0.0
        for i in range(left_peak_idx + 1, right_peak_idx + 1):
            dt_hours = (rows[i][0] - rows[i - 1][0]) / 3_600_000.0
            power = rows[i][1]
            if power is not None:
                if power > 0:
                    energy_charged += power * dt_hours
                else:
                    energy_discharged += abs(power) * dt_hours

        cycle = {
            "start_ms": rows[left_peak_idx][0],
            "end_ms": rows[right_peak_idx][0],
            "min_soc": min_soc,
            "energy_discharged": energy_discharged,
            "energy_charged": energy_charged,
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


@router.get("/cycles", response_model=list[BatteryCycle])
async def get_battery_cycles(
    start: datetime | None = Query(default=None),
    end: datetime | None = Query(default=None),
    min_soc_swing: int = Query(default=10),
    db: Database = Depends(get_db),
):
    try:
        now = datetime.now(timezone.utc)
        if start is None:
            start = now - timedelta(days=30)
        if end is None:
            end = now

        cursor = db._conn.execute(
            "SELECT timestamp, battery_power, battery_soc FROM system_battery WHERE timestamp >= ? AND timestamp < ? ORDER BY timestamp",
            [dt_to_ms(start), dt_to_ms(end)],
        )
        rows = [(row["timestamp"], row["battery_power"], row["battery_soc"]) for row in cursor.fetchall()]

        if len(rows) < 3:
            return []

        # Find cycles using divide-and-conquer
        raw_cycles = _find_cycles_recursive(rows, 0, len(rows), min_soc_swing)

        # Convert to response format, sorted by start time
        cycles = []
        for c in sorted(raw_cycles, key=lambda x: x["start_ms"]):
            start_time = ms_to_dt(c["start_ms"])
            end_time = ms_to_dt(c["end_ms"])
            duration = (end_time - start_time).total_seconds() / 3600.0
            efficiency = (c["energy_discharged"] / c["energy_charged"]) * 100 if c["energy_charged"] > 0 else 0
            cycles.append(
                BatteryCycle(
                    start_time=start_time,
                    end_time=end_time,
                    duration_hours=round(duration, 2),
                    min_soc=round(c["min_soc"]),
                    energy_discharged_wh=round(c["energy_discharged"], 1),
                    energy_charged_wh=round(c["energy_charged"], 1),
                    efficiency=round(efficiency, 1),
                )
            )

        return cycles
    except Exception as e:
        logger.exception("Failed to get battery cycles")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/energy-flow", response_model=list[EnergyFlowPoint])
async def get_energy_flow(
    start: datetime | None = Query(default=None),
    end: datetime | None = Query(default=None),
    bucket_minutes: int = Query(default=60),
    max_gap_seconds: int = Query(default=300),
    db: Database = Depends(get_db),
):
    try:
        now = datetime.now(timezone.utc)
        if start is None:
            start = now - timedelta(hours=24)
        if end is None:
            end = now

        start_ms, end_ms = dt_to_ms(start), dt_to_ms(end)

        grid_cursor = db._conn.execute(
            "SELECT timestamp, SUM(grid_power) as grid_power, SUM(ac_consumption) as consumption FROM system_measurements WHERE timestamp >= ? AND timestamp < ? GROUP BY timestamp ORDER BY timestamp",
            [start_ms, end_ms],
        )
        grid_data = {
            row["timestamp"]: {"grid_power": row["grid_power"], "consumption": row["consumption"]}
            for row in grid_cursor.fetchall()
        }

        battery_cursor = db._conn.execute(
            "SELECT timestamp, battery_power, inverter_charger_power FROM system_battery WHERE timestamp >= ? AND timestamp < ? ORDER BY timestamp",
            [start_ms, end_ms],
        )
        battery_data = {
            row["timestamp"]: {
                "battery_power": row["battery_power"],
                "inverter_charger_power": row["inverter_charger_power"],
            }
            for row in battery_cursor.fetchall()
        }

        all_timestamps = sorted(set(grid_data.keys()) | set(battery_data.keys()))
        if len(all_timestamps) < 2:
            return []

        bucket_ms = bucket_minutes * MS_PER_MIN
        max_gap_ms = max_gap_seconds * 1000
        buckets: dict[int, dict] = {}

        prev_ts = None
        for ts in all_timestamps:
            if prev_ts is not None:
                gap_ms = ts - prev_ts
                if gap_ms > max_gap_ms:
                    # Gap too large, skip this interval to avoid inflated values
                    prev_ts = ts
                    continue

                dt_hours = gap_ms / 3_600_000.0
                bucket_key = (ts // bucket_ms) * bucket_ms

                if bucket_key not in buckets:
                    buckets[bucket_key] = {
                        "grid_import_wh": 0.0,
                        "grid_export_wh": 0.0,
                        "battery_charge_wh": 0.0,
                        "battery_discharge_wh": 0.0,
                        "charger_input_wh": 0.0,
                        "inverter_output_wh": 0.0,
                        "consumption_wh": 0.0,
                    }

                gd = grid_data.get(ts, {})
                bd = battery_data.get(ts, {})
                grid_power = gd.get("grid_power")
                consumption = gd.get("consumption")
                battery_power = bd.get("battery_power")
                inverter_charger_power = bd.get("inverter_charger_power")

                if grid_power is not None:
                    if grid_power > 0:
                        buckets[bucket_key]["grid_import_wh"] += grid_power * dt_hours
                    else:
                        buckets[bucket_key]["grid_export_wh"] += abs(grid_power) * dt_hours

                if battery_power is not None:
                    if battery_power > 0:
                        buckets[bucket_key]["battery_charge_wh"] += battery_power * dt_hours
                        if inverter_charger_power is not None and inverter_charger_power > 0:
                            buckets[bucket_key]["charger_input_wh"] += inverter_charger_power * dt_hours
                    else:
                        buckets[bucket_key]["battery_discharge_wh"] += abs(battery_power) * dt_hours
                        if inverter_charger_power is not None and inverter_charger_power < 0:
                            buckets[bucket_key]["inverter_output_wh"] += abs(inverter_charger_power) * dt_hours

                if consumption is not None:
                    buckets[bucket_key]["consumption_wh"] += consumption * dt_hours

            prev_ts = ts

        # Center the time in the middle of each bucket
        half_bucket_ms = bucket_ms // 2
        return [
            EnergyFlowPoint(
                time=ms_to_dt(bk + half_bucket_ms),
                grid_import_wh=round(d["grid_import_wh"], 1),
                grid_export_wh=round(d["grid_export_wh"], 1),
                battery_charge_wh=round(d["battery_charge_wh"], 1),
                battery_discharge_wh=round(d["battery_discharge_wh"], 1),
                charger_input_wh=round(d["charger_input_wh"], 1),
                inverter_output_wh=round(d["inverter_output_wh"], 1),
                charger_losses_wh=round(max(0, d["charger_input_wh"] - d["battery_charge_wh"]), 1),
                inverter_losses_wh=round(max(0, d["battery_discharge_wh"] - d["inverter_output_wh"]), 1),
                consumption_wh=round(d["consumption_wh"], 1),
            )
            for bk, d in sorted(buckets.items())
        ]
    except Exception as e:
        logger.exception("Failed to get energy flow")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/power", response_model=list[PowerPoint])
async def get_power(
    start: datetime | None = Query(default=None),
    end: datetime | None = Query(default=None),
    aggregate_minutes: int = Query(default=0),
    db: Database = Depends(get_db),
):
    try:
        now = datetime.now(timezone.utc)
        if start is None:
            start = now - timedelta(hours=24)
        if end is None:
            end = now

        start_ms, end_ms = dt_to_ms(start), dt_to_ms(end)

        if aggregate_minutes > 0:
            bucket_ms = aggregate_minutes * MS_PER_MIN
            grid_query = f"""
                SELECT bucket, CAST(AVG(phase_sum) AS INTEGER) as grid_power FROM (
                    SELECT (timestamp / {bucket_ms}) * {bucket_ms} as bucket, timestamp, SUM(grid_power) as phase_sum
                    FROM system_measurements WHERE timestamp >= ? AND timestamp < ? GROUP BY bucket, timestamp
                ) GROUP BY bucket
            """
            grid_cursor = db._conn.execute(grid_query, [start_ms, end_ms])
            grid_data = {row["bucket"]: row["grid_power"] for row in grid_cursor.fetchall()}

            battery_query = f"""
                SELECT (timestamp / {bucket_ms}) * {bucket_ms} as bucket,
                       CAST(AVG(battery_power) AS INTEGER) as battery_power,
                       CAST(AVG(inverter_charger_power) AS INTEGER) as inverter_charger_power
                FROM system_battery WHERE timestamp >= ? AND timestamp < ? GROUP BY bucket
            """
            battery_cursor = db._conn.execute(battery_query, [start_ms, end_ms])
            battery_data = {
                row["bucket"]: {
                    "battery_power": row["battery_power"],
                    "inverter_charger_power": row["inverter_charger_power"],
                }
                for row in battery_cursor.fetchall()
            }

            all_buckets = sorted(set(grid_data.keys()) | set(battery_data.keys()))
            return [
                PowerPoint(
                    time=ms_to_dt(b),
                    grid_power=grid_data.get(b),
                    battery_power=battery_data.get(b, {}).get("battery_power"),
                    inverter_charger_power=battery_data.get(b, {}).get("inverter_charger_power"),
                )
                for b in all_buckets
            ]
        else:
            # SQLite UNION approach for FULL OUTER JOIN
            query = """
                SELECT timestamp, grid_power, battery_power, inverter_charger_power FROM (
                    SELECT g.timestamp, g.grid_power, b.battery_power, b.inverter_charger_power
                    FROM (SELECT timestamp, SUM(grid_power) as grid_power FROM system_measurements WHERE timestamp >= ? AND timestamp < ? GROUP BY timestamp) g
                    LEFT JOIN system_battery b ON g.timestamp = b.timestamp
                    UNION
                    SELECT b.timestamp, g.grid_power, b.battery_power, b.inverter_charger_power
                    FROM system_battery b
                    LEFT JOIN (SELECT timestamp, SUM(grid_power) as grid_power FROM system_measurements WHERE timestamp >= ? AND timestamp < ? GROUP BY timestamp) g ON b.timestamp = g.timestamp
                    WHERE b.timestamp >= ? AND b.timestamp < ?
                ) ORDER BY timestamp
            """
            cursor = db._conn.execute(query, [start_ms, end_ms, start_ms, end_ms, start_ms, end_ms])
            return [
                PowerPoint(
                    time=ms_to_dt(row["timestamp"]),
                    grid_power=row["grid_power"],
                    battery_power=row["battery_power"],
                    inverter_charger_power=row["inverter_charger_power"],
                )
                for row in cursor.fetchall()
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
    try:
        bucket_ms = aggregate_minutes * MS_PER_MIN
        query = f"""
            SELECT (timestamp / {bucket_ms}) * {bucket_ms} as bucket,
                   AVG(battery_power) as battery_power, AVG(inverter_charger_power) as inverter_charger_power,
                   CAST(ROUND(AVG(battery_soc)) AS INTEGER) as battery_soc
            FROM system_battery WHERE battery_power IS NOT NULL AND inverter_charger_power IS NOT NULL
            GROUP BY bucket ORDER BY bucket DESC LIMIT ?
        """
        cursor = db._conn.execute(query, [limit])

        points = []
        for row in cursor.fetchall():
            battery_power = row["battery_power"]
            inverter_charger_power = row["inverter_charger_power"]
            battery_soc = row["battery_soc"]

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
                    time=ms_to_dt(row["bucket"]),
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
