import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from dynamic_ess.db import Database

logger = logging.getLogger(__name__)

router = APIRouter(tags=["api"])


def get_db() -> Database:
    """Dependency to get database connection."""
    from dynamic_ess.web.dependencies import get_database

    return get_database()


class PricePoint(BaseModel):
    time: datetime
    price: float


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


class PowerPoint(BaseModel):
    time: datetime
    grid_power: int | None
    battery_power: int | None
    charger_power: int | None
    inverter_charger_power: int | None


class EfficiencyScatterPoint(BaseModel):
    time: datetime
    battery_power: float  # Always positive (absolute value)
    losses: float
    efficiency: float | None  # Percentage, None if can't be calculated
    is_charging: bool


@router.get("/health", response_model=HealthResponse)
async def health_check(db: Database = Depends(get_db)):
    """Check API health and database connectivity."""
    try:
        cursor = db._conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row["name"] for row in cursor.fetchall()]
        return HealthResponse(status="ok", database="connected", tables=tables)
    except Exception as e:
        logger.exception("Health check failed")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/prices", response_model=list[PricePoint])
async def get_prices(
    area: str = "NL",
    start: datetime | None = Query(default=None),
    end: datetime | None = Query(default=None),
    db: Database = Depends(get_db),
):
    """Get day-ahead energy prices, aggregated to hourly averages."""
    try:
        now = datetime.now(timezone.utc)
        if start is None:
            start = now - timedelta(days=7)
        if end is None:
            end = now + timedelta(days=2)

        # Aggregate 15-minute prices to hourly averages (as energy providers do)
        # Convert from EUR/MWh to EUR/kWh (divide by 1000)
        query = """
            SELECT
                strftime('%Y-%m-%dT%H:00:00', start_time) as hour,
                AVG(price) / 1000.0 as price
            FROM day_ahead_prices
            WHERE area = ? AND start_time >= ? AND start_time < ?
            GROUP BY hour
            ORDER BY hour
        """
        cursor = db._conn.execute(query, [area, start.isoformat(), end.isoformat()])
        return [
            PricePoint(time=datetime.fromisoformat(row["hour"]), price=row["price"])
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
    aggregate_minutes: int = Query(default=0, description="Aggregate into N-minute buckets (0 = no aggregation)"),
    db: Database = Depends(get_db),
):
    """Get system measurements (AC consumption, grid power per phase)."""
    try:
        now = datetime.now(timezone.utc)
        if start is None:
            start = now - timedelta(hours=24)
        if end is None:
            end = now

        # Build query with optional aggregation
        if aggregate_minutes > 0:
            phase_filter = "AND phase = ?" if phase else ""
            params = [start.isoformat(), end.isoformat()]
            if phase:
                params.append(phase)

            query = f"""
                SELECT
                    strftime('%Y-%m-%dT%H:', timestamp) ||
                        printf('%02d', (CAST(strftime('%M', timestamp) AS INTEGER) / {aggregate_minutes}) * {aggregate_minutes})
                        || ':00' as bucket,
                    phase,
                    CAST(AVG(ac_consumption) AS INTEGER) as ac_consumption,
                    CAST(AVG(grid_power) AS INTEGER) as grid_power
                FROM system_measurements
                WHERE timestamp >= ? AND timestamp < ? {phase_filter}
                GROUP BY bucket, phase
                ORDER BY bucket
            """
            cursor = db._conn.execute(query, params)
            return [
                SystemMeasurementPoint(
                    time=datetime.fromisoformat(row["bucket"]),
                    phase=row["phase"],
                    ac_consumption=row["ac_consumption"],
                    grid_power=row["grid_power"],
                )
                for row in cursor.fetchall()
            ]
        else:
            phase_filter = "AND phase = ?" if phase else ""
            params = [start.isoformat(), end.isoformat()]
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
                    time=datetime.fromisoformat(row["timestamp"]),
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
    aggregate_minutes: int = Query(default=0, description="Aggregate into N-minute buckets (0 = no aggregation)"),
    db: Database = Depends(get_db),
):
    """Get battery measurements (power, SOC)."""
    try:
        now = datetime.now(timezone.utc)
        if start is None:
            start = now - timedelta(hours=24)
        if end is None:
            end = now

        if aggregate_minutes > 0:
            query = f"""
                SELECT
                    strftime('%Y-%m-%dT%H:', timestamp) ||
                        printf('%02d', (CAST(strftime('%M', timestamp) AS INTEGER) / {aggregate_minutes}) * {aggregate_minutes})
                        || ':00' as bucket,
                    CAST(AVG(battery_power) AS INTEGER) as battery_power,
                    CAST(AVG(battery_soc) AS INTEGER) as battery_soc
                FROM system_battery
                WHERE timestamp >= ? AND timestamp < ?
                GROUP BY bucket
                ORDER BY bucket
            """
            cursor = db._conn.execute(query, [start.isoformat(), end.isoformat()])
            return [
                BatteryMeasurementPoint(
                    time=datetime.fromisoformat(row["bucket"]),
                    battery_power=row["battery_power"],
                    battery_soc=row["battery_soc"],
                )
                for row in cursor.fetchall()
            ]
        else:
            cursor = db._conn.execute(
                """
                SELECT timestamp, battery_power, battery_soc
                FROM system_battery
                WHERE timestamp >= ? AND timestamp < ?
                ORDER BY timestamp
                """,
                [start.isoformat(), end.isoformat()],
            )
            return [
                BatteryMeasurementPoint(
                    time=datetime.fromisoformat(row["timestamp"]),
                    battery_power=row["battery_power"],
                    battery_soc=row["battery_soc"],
                )
                for row in cursor.fetchall()
            ]
    except Exception as e:
        logger.exception("Failed to get battery measurements")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/cycles", response_model=list[BatteryCycle])
async def get_battery_cycles(
    start: datetime | None = Query(default=None),
    end: datetime | None = Query(default=None),
    min_soc_swing: int = Query(default=10, description="Minimum SOC swing to count as a cycle"),
    db: Database = Depends(get_db),
):
    """Get battery charge/discharge cycles with efficiency.

    A cycle is defined as: starting at 100% SOC, discharging to at least (100 - min_soc_swing)%,
    then charging back to 100%.
    """
    try:
        now = datetime.now(timezone.utc)
        if start is None:
            start = now - timedelta(days=30)
        if end is None:
            end = now

        # Get all battery data points ordered by time
        cursor = db._conn.execute(
            """
            SELECT timestamp, battery_power, battery_soc
            FROM system_battery
            WHERE timestamp >= ? AND timestamp < ?
            ORDER BY timestamp
            """,
            [start.isoformat(), end.isoformat()],
        )
        rows = cursor.fetchall()

        if len(rows) < 2:
            return []

        cycles = []
        cycle_start = None
        cycle_min_soc = 100
        energy_discharged = 0.0  # Wh (positive value)
        energy_charged = 0.0  # Wh (positive value)
        prev_time = None
        prev_soc = None

        for row in rows:
            time = datetime.fromisoformat(row["timestamp"])
            power = row["battery_power"]  # W, positive = charging, negative = discharging
            soc = row["battery_soc"]

            if power is None or soc is None:
                continue

            # Calculate time delta in hours
            if prev_time is not None:
                dt_hours = (time - prev_time).total_seconds() / 3600.0

                # Integrate power to get energy (Wh)
                if power > 0:
                    energy_charged += power * dt_hours
                else:
                    energy_discharged += abs(power) * dt_hours

            # State machine for cycle detection
            if cycle_start is None:
                # Not in a cycle - look for SOC dropping from 100%
                if prev_soc == 100 and soc < 100:
                    cycle_start = prev_time or time
                    cycle_min_soc = soc
                    energy_discharged = abs(power) * (dt_hours if prev_time else 0)
                    energy_charged = 0.0
            else:
                # In a cycle - track min SOC and look for return to 100%
                cycle_min_soc = min(cycle_min_soc, soc)

                if soc == 100:
                    # Cycle complete - check if it meets minimum swing requirement
                    soc_swing = 100 - cycle_min_soc
                    if soc_swing >= min_soc_swing and energy_charged > 0:
                        efficiency = (energy_discharged / energy_charged) * 100 if energy_charged > 0 else 0
                        duration = (time - cycle_start).total_seconds() / 3600.0

                        cycles.append(
                            BatteryCycle(
                                start_time=cycle_start,
                                end_time=time,
                                duration_hours=round(duration, 2),
                                min_soc=cycle_min_soc,
                                energy_discharged_wh=round(energy_discharged, 1),
                                energy_charged_wh=round(energy_charged, 1),
                                efficiency=round(efficiency, 1),
                            )
                        )

                    # Reset for next cycle
                    cycle_start = None
                    cycle_min_soc = 100
                    energy_discharged = 0.0
                    energy_charged = 0.0

            prev_time = time
            prev_soc = soc

        return cycles
    except Exception as e:
        logger.exception("Failed to get battery cycles")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/energy-flow", response_model=list[EnergyFlowPoint])
async def get_energy_flow(
    start: datetime | None = Query(default=None),
    end: datetime | None = Query(default=None),
    bucket_minutes: int = Query(default=60, description="Bucket size in minutes (60 = hourly, 1440 = daily)"),
    db: Database = Depends(get_db),
):
    """Get energy flow data aggregated into time buckets.

    Returns grid import/export and battery charge/discharge in Wh per bucket.
    """
    try:
        now = datetime.now(timezone.utc)
        if start is None:
            start = now - timedelta(hours=24)
        if end is None:
            end = now

        # Get raw data from both tables
        # Grid power from system_measurements (sum all phases)
        grid_query = """
            SELECT timestamp, SUM(grid_power) as grid_power
            FROM system_measurements
            WHERE timestamp >= ? AND timestamp < ?
            GROUP BY timestamp
            ORDER BY timestamp
        """
        grid_cursor = db._conn.execute(grid_query, [start.isoformat(), end.isoformat()])
        grid_data = {row["timestamp"]: row["grid_power"] for row in grid_cursor.fetchall()}

        # Battery power from system_battery
        battery_query = """
            SELECT timestamp, battery_power
            FROM system_battery
            WHERE timestamp >= ? AND timestamp < ?
            ORDER BY timestamp
        """
        battery_cursor = db._conn.execute(battery_query, [start.isoformat(), end.isoformat()])
        battery_data = {row["timestamp"]: row["battery_power"] for row in battery_cursor.fetchall()}

        # Merge timestamps and calculate energy per bucket
        all_timestamps = sorted(set(grid_data.keys()) | set(battery_data.keys()))

        if len(all_timestamps) < 2:
            return []

        # Group into buckets
        buckets: dict[str, dict] = {}

        prev_ts = None
        for ts_str in all_timestamps:
            ts = datetime.fromisoformat(ts_str)

            if prev_ts is not None:
                dt_hours = (ts - prev_ts).total_seconds() / 3600.0

                # Calculate bucket key
                if bucket_minutes >= 1440:
                    bucket_key = ts.strftime("%Y-%m-%dT00:00:00")
                else:
                    minute_bucket = (ts.minute // bucket_minutes) * bucket_minutes
                    bucket_key = ts.strftime(f"%Y-%m-%dT%H:{minute_bucket:02d}:00")

                if bucket_key not in buckets:
                    buckets[bucket_key] = {
                        "grid_import_wh": 0.0,
                        "grid_export_wh": 0.0,
                        "battery_charge_wh": 0.0,
                        "battery_discharge_wh": 0.0,
                    }

                grid_power = grid_data.get(ts_str)
                battery_power = battery_data.get(ts_str)

                if grid_power is not None:
                    if grid_power > 0:
                        buckets[bucket_key]["grid_import_wh"] += grid_power * dt_hours
                    else:
                        buckets[bucket_key]["grid_export_wh"] += abs(grid_power) * dt_hours

                if battery_power is not None:
                    if battery_power > 0:
                        buckets[bucket_key]["battery_charge_wh"] += battery_power * dt_hours
                    else:
                        buckets[bucket_key]["battery_discharge_wh"] += abs(battery_power) * dt_hours

            prev_ts = ts

        return [
            EnergyFlowPoint(
                time=datetime.fromisoformat(bucket_key),
                grid_import_wh=round(data["grid_import_wh"], 1),
                grid_export_wh=round(data["grid_export_wh"], 1),
                battery_charge_wh=round(data["battery_charge_wh"], 1),
                battery_discharge_wh=round(data["battery_discharge_wh"], 1),
            )
            for bucket_key, data in sorted(buckets.items())
        ]
    except Exception as e:
        logger.exception("Failed to get energy flow")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/power", response_model=list[PowerPoint])
async def get_power(
    start: datetime | None = Query(default=None),
    end: datetime | None = Query(default=None),
    aggregate_minutes: int = Query(default=0, description="Aggregate into N-minute buckets (0 = no aggregation)"),
    db: Database = Depends(get_db),
):
    """Get combined power data (grid, battery, charger, inverter)."""
    try:
        now = datetime.now(timezone.utc)
        if start is None:
            start = now - timedelta(hours=24)
        if end is None:
            end = now

        if aggregate_minutes > 0:
            # Grid power (sum of phases)
            grid_query = f"""
                SELECT
                    strftime('%Y-%m-%dT%H:', timestamp) ||
                        printf('%02d', (CAST(strftime('%M', timestamp) AS INTEGER) / {aggregate_minutes}) * {aggregate_minutes})
                        || ':00' as bucket,
                    CAST(SUM(grid_power) AS INTEGER) as grid_power
                FROM system_measurements
                WHERE timestamp >= ? AND timestamp < ?
                GROUP BY bucket
            """
            grid_cursor = db._conn.execute(grid_query, [start.isoformat(), end.isoformat()])
            grid_data = {row["bucket"]: row["grid_power"] for row in grid_cursor.fetchall()}

            # Battery data
            battery_query = f"""
                SELECT
                    strftime('%Y-%m-%dT%H:', timestamp) ||
                        printf('%02d', (CAST(strftime('%M', timestamp) AS INTEGER) / {aggregate_minutes}) * {aggregate_minutes})
                        || ':00' as bucket,
                    CAST(AVG(battery_power) AS INTEGER) as battery_power,
                    CAST(AVG(charger_power) AS INTEGER) as charger_power,
                    CAST(AVG(inverter_charger_power) AS INTEGER) as inverter_charger_power
                FROM system_battery
                WHERE timestamp >= ? AND timestamp < ?
                GROUP BY bucket
            """
            battery_cursor = db._conn.execute(battery_query, [start.isoformat(), end.isoformat()])
            battery_data = {
                row["bucket"]: {
                    "battery_power": row["battery_power"],
                    "charger_power": row["charger_power"],
                    "inverter_charger_power": row["inverter_charger_power"],
                }
                for row in battery_cursor.fetchall()
            }

            # Merge
            all_buckets = sorted(set(grid_data.keys()) | set(battery_data.keys()))
            return [
                PowerPoint(
                    time=datetime.fromisoformat(bucket),
                    grid_power=grid_data.get(bucket),
                    battery_power=battery_data.get(bucket, {}).get("battery_power"),
                    charger_power=battery_data.get(bucket, {}).get("charger_power"),
                    inverter_charger_power=battery_data.get(bucket, {}).get("inverter_charger_power"),
                )
                for bucket in all_buckets
            ]
        else:
            # Non-aggregated: join on timestamp
            query = """
                SELECT
                    COALESCE(g.timestamp, b.timestamp) as timestamp,
                    g.grid_power,
                    b.battery_power,
                    b.charger_power,
                    b.inverter_charger_power
                FROM (
                    SELECT timestamp, SUM(grid_power) as grid_power
                    FROM system_measurements
                    WHERE timestamp >= ? AND timestamp < ?
                    GROUP BY timestamp
                ) g
                FULL OUTER JOIN system_battery b ON g.timestamp = b.timestamp
                WHERE COALESCE(g.timestamp, b.timestamp) >= ? AND COALESCE(g.timestamp, b.timestamp) < ?
                ORDER BY timestamp
            """
            # SQLite doesn't support FULL OUTER JOIN, so use UNION approach
            query = """
                SELECT timestamp, grid_power, battery_power, charger_power, inverter_charger_power
                FROM (
                    SELECT
                        g.timestamp,
                        g.grid_power,
                        b.battery_power,
                        b.charger_power,
                        b.inverter_charger_power
                    FROM (
                        SELECT timestamp, SUM(grid_power) as grid_power
                        FROM system_measurements
                        WHERE timestamp >= ? AND timestamp < ?
                        GROUP BY timestamp
                    ) g
                    LEFT JOIN system_battery b ON g.timestamp = b.timestamp
                    UNION
                    SELECT
                        b.timestamp,
                        g.grid_power,
                        b.battery_power,
                        b.charger_power,
                        b.inverter_charger_power
                    FROM system_battery b
                    LEFT JOIN (
                        SELECT timestamp, SUM(grid_power) as grid_power
                        FROM system_measurements
                        WHERE timestamp >= ? AND timestamp < ?
                        GROUP BY timestamp
                    ) g ON b.timestamp = g.timestamp
                    WHERE b.timestamp >= ? AND b.timestamp < ?
                )
                ORDER BY timestamp
            """
            cursor = db._conn.execute(
                query,
                [
                    start.isoformat(), end.isoformat(),
                    start.isoformat(), end.isoformat(),
                    start.isoformat(), end.isoformat(),
                ],
            )
            return [
                PowerPoint(
                    time=datetime.fromisoformat(row["timestamp"]),
                    grid_power=row["grid_power"],
                    battery_power=row["battery_power"],
                    charger_power=row["charger_power"],
                    inverter_charger_power=row["inverter_charger_power"],
                )
                for row in cursor.fetchall()
            ]
    except Exception as e:
        logger.exception("Failed to get power data")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/efficiency-scatter", response_model=list[EfficiencyScatterPoint])
async def get_efficiency_scatter(
    limit: int = Query(default=2000, description="Maximum number of data points to return"),
    aggregate_minutes: int = Query(default=10, description="Aggregate into N-minute buckets"),
    db: Database = Depends(get_db),
):
    """Get scatter plot data for battery power vs losses.

    Losses are calculated as: inverter_charger_power - battery_power
    (the difference between AC and DC side power).
    Battery power is always returned as positive (absolute value).
    """
    try:
        # Get aggregated data, ordered by most recent first, limited to N points
        query = f"""
            SELECT
                strftime('%Y-%m-%dT%H:', timestamp) ||
                    printf('%02d', (CAST(strftime('%M', timestamp) AS INTEGER) / {aggregate_minutes}) * {aggregate_minutes})
                    || ':00' as bucket,
                AVG(battery_power) as battery_power,
                AVG(inverter_charger_power) as inverter_charger_power
            FROM system_battery
            WHERE battery_power IS NOT NULL
              AND inverter_charger_power IS NOT NULL
            GROUP BY bucket
            ORDER BY bucket DESC
            LIMIT ?
        """
        cursor = db._conn.execute(query, [limit])
        rows = cursor.fetchall()

        points = []
        for row in rows:
            battery_power = row["battery_power"]
            inverter_charger_power = row["inverter_charger_power"]
            bucket = row["bucket"]

            if battery_power is None or inverter_charger_power is None:
                continue

            is_charging = battery_power > 0

            # Calculate losses: difference between AC and DC side
            # When charging: inverter_charger_power > battery_power (loss is positive)
            # When discharging: battery_power < 0, inverter_charger_power < 0, loss = icp - bp is positive
            losses = inverter_charger_power - battery_power

            # Calculate efficiency
            # Charging: efficiency = DC out / AC in = battery_power / inverter_charger_power
            # Discharging: efficiency = AC out / DC in = |inverter_charger_power| / |battery_power|
            efficiency = None
            if is_charging and inverter_charger_power > 0:
                efficiency = (battery_power / inverter_charger_power) * 100
            elif not is_charging and battery_power < 0:
                efficiency = (inverter_charger_power / battery_power) * 100  # Both negative, result positive

            points.append(
                EfficiencyScatterPoint(
                    time=datetime.fromisoformat(bucket),
                    battery_power=round(abs(battery_power), 1),  # Always positive
                    losses=round(losses, 1),
                    efficiency=round(efficiency, 1) if efficiency is not None else None,
                    is_charging=is_charging,
                )
            )

        return points
    except Exception as e:
        logger.exception("Failed to get efficiency scatter data")
        raise HTTPException(status_code=500, detail=str(e))
