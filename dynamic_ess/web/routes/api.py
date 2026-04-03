from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from dynamic_ess.db import Database

router = APIRouter(tags=["api"])


def get_db() -> Database:
    """Dependency to get database connection."""
    # TODO: Use proper connection pooling / context management
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


@router.get("/prices", response_model=list[PricePoint])
async def get_prices(
    area: str = "NL",
    start: datetime | None = Query(default=None),
    end: datetime | None = Query(default=None),
    db: Database = Depends(get_db),
):
    """Get day-ahead energy prices."""
    now = datetime.now(timezone.utc)
    if start is None:
        start = now - timedelta(days=7)
    if end is None:
        end = now + timedelta(days=2)

    prices = db.get_prices(area, start, end)
    return [PricePoint(time=p[0], price=p[2]) for p in prices]


@router.get("/system", response_model=list[SystemMeasurementPoint])
async def get_system_measurements(
    start: datetime | None = Query(default=None),
    end: datetime | None = Query(default=None),
    phase: int | None = Query(default=None),
    aggregate_minutes: int = Query(default=0, description="Aggregate into N-minute buckets (0 = no aggregation)"),
    db: Database = Depends(get_db),
):
    """Get system measurements (AC consumption, grid power per phase)."""
    now = datetime.now(timezone.utc)
    if start is None:
        start = now - timedelta(hours=24)
    if end is None:
        end = now

    # Build query with optional aggregation
    if aggregate_minutes > 0:
        # Aggregate query
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
        # Raw query
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


@router.get("/battery", response_model=list[BatteryMeasurementPoint])
async def get_battery_measurements(
    start: datetime | None = Query(default=None),
    end: datetime | None = Query(default=None),
    aggregate_minutes: int = Query(default=0, description="Aggregate into N-minute buckets (0 = no aggregation)"),
    db: Database = Depends(get_db),
):
    """Get battery measurements (power, SOC)."""
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
