import logging
import re
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from dynamic_ess.db import Database, dt_to_ms, ms_to_dt, power_flow, energy_flow
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
    ac_energy_in_wh: float
    ac_energy_out_wh: float
    system_efficiency: float | None


class EnergyFlowPoint(BaseModel):
    time: datetime
    inverter_output_wh: float
    inverter_losses_wh: float
    charger_input_wh: float
    charger_losses_wh: float
    grid_export_wh: float
    grid_import_wh: float
    consumption_wh: float


class EnergyFlowResponse(BaseModel):
    energy: list[EnergyFlowPoint]
    schedule: list["SchedulePoint"]


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


class PowerResponse(BaseModel):
    power: list[PowerPoint]
    schedule: list["SchedulePoint"]


class EfficiencyScatterPoint(BaseModel):
    time: datetime
    battery_power: float
    inverter_charger_power: float
    losses: float
    efficiency: float | None
    soc: int | None
    category: str


class DebugPowerFlowPoint(BaseModel):
    time: datetime
    from_node: str
    to_node: str
    power: int


class DebugEnergyFlowPoint(BaseModel):
    time: datetime
    from_node: str
    to_node: str
    energy: float
    source: str


class SchedulePoint(BaseModel):
    start_time: datetime
    end_time: datetime
    power_w: int
    expected_soc: int
    charger_input_w: float
    inverter_output_w: float
    charger_loss_w: float
    inverter_loss_w: float


@router.get("/health", response_model=HealthResponse)
async def health_check(db: Database = Depends(get_db)):
    try:
        cursor = db.conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row["name"] for row in cursor.fetchall()]
        return HealthResponse(status="ok", database="connected", tables=tables)
    except Exception as e:
        logger.exception("Health check failed")
        raise HTTPException(status_code=500, detail=str(e))


def _build_schedule_points(db: Database, start: datetime | None) -> list[SchedulePoint]:
    """Build schedule points with predicted losses."""
    schedule = db.get_schedule(start)
    result = []
    for start_time, end_time, power_w, expected_soc in schedule:
        power_kw = power_w / 1000.0
        if power_w > 0:
            charger_loss_w = charger_loss(power_kw) * 1000
            charger_input = power_w + charger_loss_w
            inverter_output = 0
            inverter_loss_w = 0
        elif power_w < 0:
            battery_power_kw = abs(power_kw)
            inverter_loss_w = inverter_loss(battery_power_kw) * 1000
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

        prices = db.get_hourly_prices(price_config.area, start, end)
        return [
            PricePoint(
                time=hour,
                market_price=price,
                buy_price=price_config.buy_price(price),
                sell_price=price_config.sell_price(price),
            )
            for hour, price in prices
        ]
    except Exception as e:
        logger.exception("Failed to get prices")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/grid-power", response_model=list[GridPowerPoint])
async def get_grid_power_endpoint(
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

        bucket_seconds = aggregate_minutes * 60 if aggregate_minutes > 0 else None
        data = power_flow.get_grid_power_by_phase(db.conn, start, end, bucket_seconds, phase)

        return [GridPowerPoint(time=t, phase=p, grid_power=power) for t, p, power in data]
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

        multiplus_id = db.get_multiplus_id()
        battery_id = db.get_battery_id()
        if not multiplus_id:
            return []

        bucket_seconds = aggregate_minutes * 60 if aggregate_minutes > 0 else None
        power_data = power_flow.get_battery_measurements(db.conn, start, end, multiplus_id, battery_id, bucket_seconds)
        soc_data = db.get_soc_by_bucket(start, end, bucket_seconds) if bucket_seconds else {}

        if not bucket_seconds:
            # Get raw SOC data
            start_ms, end_ms = dt_to_ms(start), dt_to_ms(end)
            cursor = db.conn.execute(
                "SELECT timestamp, soc FROM battery_soc WHERE timestamp >= ? AND timestamp < ? ORDER BY timestamp",
                [start_ms, end_ms],
            )
            soc_data = {row["timestamp"]: row["soc"] for row in cursor.fetchall()}

        all_keys = sorted(set(power_data.keys()) | set(soc_data.keys()))
        return [
            BatteryMeasurementPoint(
                time=ms_to_dt(k),
                battery_power=power_data.get(k),
                battery_soc=soc_data.get(k),
            )
            for k in all_keys
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
    """Find battery cycles using divide-and-conquer."""
    if end - start < 3:
        return []

    min_idx = start
    min_soc = rows[start][1]
    for i in range(start + 1, end):
        if rows[i][1] < min_soc:
            min_soc = rows[i][1]
            min_idx = i

    left_peak_idx = start
    left_peak = rows[start][1]
    for i in range(start, min_idx + 1):
        if rows[i][1] > left_peak:
            left_peak = rows[i][1]
            left_peak_idx = i

    right_peak_idx = min_idx
    right_peak = rows[min_idx][1]
    for i in range(min_idx, end):
        if rows[i][1] > right_peak:
            right_peak = rows[i][1]
            right_peak_idx = i

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

        rows = db.get_soc_series(start, end)

        if len(rows) < 3:
            return []

        raw_cycles = _find_cycles_recursive(rows, 0, len(rows), min_soc_swing)

        cycles = []
        for c in sorted(raw_cycles, key=lambda x: x["start_ms"]):
            start_time = ms_to_dt(c["start_ms"])
            end_time = ms_to_dt(c["end_ms"])
            duration = (end_time - start_time).total_seconds() / 3600.0

            vebus_start = energy_flow.get_vebus_energy_at(db.conn, start_time)
            vebus_end = energy_flow.get_vebus_energy_at(db.conn, end_time)

            ac_energy_in = (
                vebus_end["ac_in_to_battery"]
                - vebus_start["ac_in_to_battery"]
                + (vebus_end["ac_out_to_battery"] - vebus_start["ac_out_to_battery"])
            ) * 1000
            ac_energy_out = (
                (vebus_end["battery_to_ac_in"] - vebus_start["battery_to_ac_in"])
                + (vebus_end["battery_to_ac_out"] - vebus_start["battery_to_ac_out"])
            ) * 1000

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

        data = energy_flow.get_grid_energy_by_bucket(db.conn, start, end, bucket_minutes * 60, max_gap_seconds)

        return [
            GridEnergyFlowPoint(time=t, grid_import_wh=round(imp, 1), grid_export_wh=round(exp, 1))
            for t, imp, exp in data
        ]
    except Exception as e:
        logger.exception("Failed to get grid energy")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/energy-flow", response_model=EnergyFlowResponse)
async def get_energy_flow_endpoint(
    start: datetime | None = Query(default=None),
    end: datetime | None = Query(default=None),
    bucket_minutes: int = Query(default=60),
    max_gap_seconds: int = Query(default=300),
    db: Database = Depends(get_db),
):
    """Get energy flow data by integrating power over time, plus schedule."""
    try:
        now = datetime.now(timezone.utc)
        if start is None:
            start = now - timedelta(hours=24)
        if end is None:
            end = now

        start_ms, end_ms = dt_to_ms(start), dt_to_ms(end)

        battery_id = db.get_battery_id()
        multiplus_id = db.get_multiplus_id()
        pool_id = db.get_pool_id()

        # Get power data
        cursor = db.conn.execute(
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

        battery_data = {}
        if multiplus_id and battery_id:
            cursor = db.conn.execute(
                "SELECT start_time as timestamp, power FROM power_flows WHERE node_a = ? AND node_b = ? AND start_time >= ? AND start_time < ? ORDER BY start_time",
                [multiplus_id, battery_id, start_ms, end_ms],
            )
            battery_data = {row["timestamp"]: row["power"] for row in cursor.fetchall()}

        inverter_data = {}
        if pool_id and multiplus_id:
            cursor = db.conn.execute(
                "SELECT start_time as timestamp, power FROM power_flows WHERE node_a = ? AND node_b = ? AND start_time >= ? AND start_time < ? ORDER BY start_time",
                [pool_id, multiplus_id, start_ms, end_ms],
            )
            inverter_data = {row["timestamp"]: row["power"] for row in cursor.fetchall()}

        all_timestamps = sorted(set(grid_data.keys()) | set(battery_data.keys()) | set(inverter_data.keys()))

        energy_points = []
        if len(all_timestamps) >= 2:
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

                        grid_power = grid_data.get(prev_ts, 0)
                        if grid_power > 0:
                            b["grid_import_wh"] += grid_power * dt_hours
                        else:
                            b["grid_export_wh"] += abs(grid_power) * dt_hours

                        battery_power = battery_data.get(prev_ts, 0)
                        inverter_power = inverter_data.get(prev_ts, 0)

                        if battery_power > 0:
                            b["charger_input_wh"] += abs(inverter_power) * dt_hours
                            b["charger_losses_wh"] += max(0, abs(inverter_power) - battery_power) * dt_hours
                        elif battery_power < 0:
                            battery_discharge = abs(battery_power)
                            inverter_out = abs(inverter_power)
                            b["inverter_output_wh"] += inverter_out * dt_hours
                            b["inverter_losses_wh"] += max(0, battery_discharge - inverter_out) * dt_hours

                prev_ts = ts

            half_bucket_ms = bucket_ms // 2
            for bk, d in sorted(buckets.items()):
                consumption = (
                    d["grid_import_wh"] + d["inverter_output_wh"] - d["charger_input_wh"] - d["grid_export_wh"]
                )
                consumption = max(0, consumption)

                energy_points.append(
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

        schedule_points = _build_schedule_points(db, start)

        return EnergyFlowResponse(energy=energy_points, schedule=schedule_points)
    except Exception as e:
        logger.exception("Failed to get energy flow")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/power", response_model=PowerResponse)
async def get_power(
    start: datetime | None = Query(default=None),
    end: datetime | None = Query(default=None),
    aggregate_minutes: int = Query(default=1),
    db: Database = Depends(get_db),
):
    """Get power measurements: grid, battery, and inverter/charger, plus schedule."""
    try:
        now = datetime.now(timezone.utc)
        if start is None:
            start = now - timedelta(hours=24)
        if end is None:
            end = now

        bucket_seconds = aggregate_minutes * 60

        mp_ac_pattern = re.compile(r"^mp_\d+_ac_.*$")
        mp_ac_ids = [node_id for node_id, name, _, _ in db.get_nodes() if mp_ac_pattern.match(name)]

        battery_id = db.get_battery_id()
        pool_id = db.get_pool_id()

        grid_data = {t: p for t, p in db.get_grid_power(start, end, bucket_seconds)}

        battery_flows = db.get_power_flow(start, end, bucket_seconds, to_node_ids=[battery_id])
        battery_data: dict[datetime, int] = {}
        for bucket_time, _, _, pwr in battery_flows:
            battery_data[bucket_time] = battery_data.get(bucket_time, 0) + pwr

        inverter_flows = db.get_power_flow(start, end, bucket_seconds, from_node_ids=[pool_id], to_node_ids=mp_ac_ids)
        inverter_data: dict[datetime, int] = {}
        for bucket_time, _, _, pwr in inverter_flows:
            inverter_data[bucket_time] = inverter_data.get(bucket_time, 0) + pwr

        all_buckets = sorted(set(grid_data.keys()) | set(battery_data.keys()) | set(inverter_data.keys()))
        power_points = [
            PowerPoint(
                time=b,
                grid_power=grid_data.get(b),
                battery_power=battery_data.get(b),
                inverter_charger_power=inverter_data.get(b),
            )
            for b in all_buckets
        ]

        schedule_points = _build_schedule_points(db, start)

        return PowerResponse(power=power_points, schedule=schedule_points)
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
        multiplus_id = db.get_multiplus_id()
        battery_id = db.get_battery_id()
        pool_id = db.get_pool_id()

        if not multiplus_id:
            return []

        data = power_flow.get_efficiency_scatter_data(
            db.conn, multiplus_id, battery_id, pool_id, aggregate_minutes * 60, limit
        )

        points = []
        for d in data:
            battery_power = d["battery_power"]
            inverter_charger_power = d["inverter_charger_power"]
            battery_soc = d["battery_soc"]

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
                    time=ms_to_dt(d["bucket"]),
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


@router.get("/debug/power-flows", response_model=list[DebugPowerFlowPoint])
async def get_debug_power_flows(
    start: datetime | None = Query(default=None),
    end: datetime | None = Query(default=None),
    aggregate_minutes: int = Query(default=1),
    db: Database = Depends(get_db),
):
    """Get all power flows with node names for debugging."""
    try:
        now = datetime.now(timezone.utc)
        if start is None:
            start = now - timedelta(hours=24)
        if end is None:
            end = now

        data = power_flow.get_all_power_flows(db.conn, start, end, aggregate_minutes * 60)

        return [
            DebugPowerFlowPoint(
                time=d.time,
                from_node=d.from_node,
                to_node=d.to_node,
                power=d.power,
            )
            for d in data
        ]
    except Exception as e:
        logger.exception("Failed to get debug power flows")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/debug/energy-flows", response_model=list[DebugEnergyFlowPoint])
async def get_debug_energy_flows(
    start: datetime | None = Query(default=None),
    end: datetime | None = Query(default=None),
    db: Database = Depends(get_db),
):
    """Get all energy flows with node names, normalized so each flow starts at 0."""
    try:
        now = datetime.now(timezone.utc)
        if start is None:
            start = now - timedelta(hours=24)
        if end is None:
            end = now

        # Get counter-based energy flows
        counter_flows = energy_flow.get_all_energy_flows_with_names(db.conn, start, end, normalize=True)

        # Get integrated power flows
        integrated_flows = energy_flow.integrate_power_flows(db.conn, start, end)

        result = [
            DebugEnergyFlowPoint(
                time=f.time,
                from_node=f.from_node,
                to_node=f.to_node,
                energy=f.energy,
                source=f.source,
            )
            for f in counter_flows + integrated_flows
        ]

        return result
    except Exception as e:
        logger.exception("Failed to get debug energy flows")
        raise HTTPException(status_code=500, detail=str(e))
