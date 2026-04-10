import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from dynamic_ess.db import Database, ms_to_dt
from dynamic_ess.pricing import PriceConfig

logger = logging.getLogger(__name__)

router = APIRouter(tags=["api"])


def get_db() -> Database:
    from dynamic_ess.web.dependencies import get_database

    return get_database()


def get_prices() -> PriceConfig:
    from dynamic_ess.web.dependencies import get_price_config

    return get_price_config()


class TimeSeries(BaseModel):
    timestamps: list[datetime]
    values: list[float]


class PricePoint(BaseModel):
    time: datetime
    market_price: float
    buy_price: float
    sell_price: float


class BatteryCycle(BaseModel):
    start_time: datetime
    end_time: datetime
    duration_hours: float
    min_soc: int
    ac_energy_in_wh: float
    ac_energy_out_wh: float
    system_efficiency: float | None


class EnergySample(BaseModel):
    time: datetime
    inverter_output_wh: float
    inverter_losses_wh: float
    charger_input_wh: float
    charger_losses_wh: float
    grid_export_wh: float
    grid_import_wh: float
    consumption_wh: float


class PowerResponse(BaseModel):
    series: dict[str, TimeSeries]


class EnergyResponse(BaseModel):
    series: dict[str, TimeSeries]


class EfficiencyScatterPoint(BaseModel):
    time: datetime
    battery_power: float
    inverter_charger_power: float
    losses: float
    efficiency: float | None
    soc: int | None
    category: str


def data_to_timeseries(data: list[tuple[datetime, float]]) -> TimeSeries:
    timestamps = []
    values = []
    for t, v in data:
        timestamps.append(t)
        values.append(v)
    return TimeSeries(timestamps=timestamps, values=values)


class HealthResponse(BaseModel):
    status: str
    database: str
    tables: list[str]


@router.get("/health", response_model=HealthResponse)
async def health_check(db: Database = Depends(get_db)):
    try:
        cursor = db.conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row["name"] for row in cursor.fetchall()]
        return HealthResponse(status="ok", database="connected", tables=tables)
    except Exception as e:
        logger.exception("Health check failed")
        raise HTTPException(status_code=500, detail=str(e))


class BatteryEnergySeries(BaseModel):
    energy_to_charger: list[float | None] = []
    energy_from_inverter: list[float | None] = []
    energy_to_battery: list[float | None] = []
    energy_from_battery: list[float | None] = []
    energy_loss_to_battery: list[float | None] = []
    energy_loss_from_battery: list[float | None] = []


class EnergyGraphResponse(BaseModel):
    timestamps: list[datetime]

    grid_import: dict[str, list[float | None]]
    grid_export: dict[str, list[float | None]]

    battery_systems: dict[str, BatteryEnergySeries]

    solar: list[float | None] = []
    to_consumption: list[float | None] = []
    from_consumption: list[float | None] = []


@router.get("/energy-graph", response_model=EnergyGraphResponse)
async def get_energy_flow_endpoint(
    start: datetime | None = Query(default=None),
    end: datetime | None = Query(default=None),
    bucket_minutes: int = Query(default=60),
    db: Database = Depends(get_db),
):
    """Get energy flow data by integrating power over time, plus schedule."""
    try:
        now = datetime.now(timezone.utc)
        if start is None:
            start = now - timedelta(hours=24)
        if end is None:
            end = now

        series = {
            "from_grid": db.get_energy_aggregated(
                "from_net_total", bucket_minutes * 60, start, end, center_buckets=True
            ),
            "to_grid": db.get_energy_aggregated("to_net_total", bucket_minutes * 60, start, end, center_buckets=True),
            "to_mp": db.get_energy_aggregated(
                "mp_228_ac_in_to_dc", bucket_minutes * 60, start, end, center_buckets=True
            ),
            "from_mp": db.get_energy_aggregated(
                "mp_228_dc_to_ac_in", bucket_minutes * 60, start, end, center_buckets=True
            ),
        }

        timestamps = set()
        series_as_dict: dict[str, dict[datetime, float]] = {name: {} for name in series}
        for name, s in series.items():
            for ts, v in s:
                timestamps.add(ts)
                series_as_dict[name][ts] = v
        timestamps = list(sorted(timestamps))

        grid_exports = {
            "From MP": [],
        }
        grid_imports = {
            "Consumption": [],
            "To MP": [],
        }
        battery_stats = BatteryEnergySeries()
        for ts in timestamps:
            # Grid export
            from_mp = series_as_dict["from_mp"].get(ts)
            grid_exports["From MP"].append(from_mp)
            unaccounted_export = series_as_dict["to_grid"].get(ts, 0) - (from_mp or 0)

            # Grid import
            to_mp = series_as_dict["to_mp"].get(ts)
            grid_imports["To MP"].append(to_mp)
            grid_import = series_as_dict["from_grid"].get(ts)
            if grid_import is not None:
                grid_import -= (to_mp or 0) - unaccounted_export
            grid_imports["Consumption"].append(grid_import)

            # Battery stats
            battery_stats.energy_to_charger.append(to_mp)
            battery_stats.energy_from_inverter.append(from_mp)

        return EnergyGraphResponse(
            timestamps=timestamps,
            grid_export=grid_exports,
            grid_import=grid_imports,
            battery_systems={"MultiPlus": battery_stats},
        )
    except Exception as e:
        logger.exception("Failed to get energy flow")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/power-graph", response_model=PowerResponse)
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

        # First add grid data
        series = {f"Grid L{i}": db.get_power(f"grid_l{i}", start, end, bucket_seconds) for i in (1, 2, 3)}

        # TODO: grep series based on patterns instead of hard-coded
        # mp_ac_pattern = re.compile(r"^mp_\d+_ac.*$")
        # mp_ac_labels = [label for label in db.get_power_labels() if mp_ac_pattern.match(label)]

        series["To MP 228"] = []
        for (ts, ac_in), (_, ac_out) in zip(
            db.get_power("mp_228_ac_in", start, end, bucket_seconds),
            db.get_power("mp_228_ac_out", start, end, bucket_seconds),
        ):
            series["To MP 228"].append((ts, ac_in - ac_out))

        series["Battery (BMS 225)"] = db.get_power("bms_225", start, end, bucket_seconds)
        series["Battery (MP 228)"] = db.get_power("mp_228_battery", start, end, bucket_seconds)

        series["Schedule"] = []
        for ts_start, ts_end, v, _ in db.get_schedule(start):
            series["Schedule"].extend([(ts_start, v), (ts_end, v)])

        return PowerResponse(series={k: data_to_timeseries(v) for k, v in series.items()})
    except Exception as e:
        logger.exception("Failed to get power data")
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


class BatterySocResponse(BaseModel):
    history: TimeSeries
    future: TimeSeries


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

        # TODO: label
        actual = db.get_battery_soc("mp_228_soc", start, end)
        scheduled = [(t, soc) for _, t, _, soc in db.get_schedule(start)]
        return BatterySocResponse(history=data_to_timeseries(actual), future=data_to_timeseries(scheduled))
    except Exception as e:
        logger.exception("Failed to get battery SOC")
        raise HTTPException(status_code=500, detail=str(e))


# ---------------#
#  Cycles page  #
# ---------------#


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
        # TODO

        # data = power_flow.get_efficiency_scatter_data(
        #     db.conn, multiplus_id, battery_id, pool_id, aggregate_minutes * 60, limit
        # )

        points = []
        # for d in data:
        #     battery_power = d["battery_power"]
        #     inverter_charger_power = d["inverter_charger_power"]
        #     battery_soc = d["battery_soc"]
        #
        #     if abs(battery_power) < idle_threshold:
        #         category = "idling"
        #     elif battery_power > 0 and battery_soc == 100 and abs(inverter_charger_power) < balancing_threshold:
        #         category = "balancing"
        #     elif battery_power > 0:
        #         category = "charging"
        #     else:
        #         category = "discharging"
        #
        #     losses = inverter_charger_power - battery_power
        #     efficiency = None
        #     if category == "charging" and inverter_charger_power > 0:
        #         efficiency = (battery_power / inverter_charger_power) * 100
        #     elif category == "discharging" and battery_power < 0:
        #         efficiency = (inverter_charger_power / battery_power) * 100
        #
        #     points.append(
        #         EfficiencyScatterPoint(
        #             time=ms_to_dt(d["bucket"]),
        #             battery_power=round(abs(battery_power), 1),
        #             inverter_charger_power=round(inverter_charger_power, 1),
        #             losses=round(losses, 1),
        #             efficiency=round(efficiency, 1) if efficiency is not None else None,
        #             soc=battery_soc,
        #             category=category,
        #         )
        #     )

        return points
    except Exception as e:
        logger.exception("Failed to get efficiency scatter data")
        raise HTTPException(status_code=500, detail=str(e))


def _find_cycles_recursive(
    rows: list[tuple[int, float]],
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

        # TODO: label
        rows = db.get_battery_soc("mp_228_soc", start, end)

        if len(rows) < 3:
            return []

        raw_cycles = _find_cycles_recursive(rows, 0, len(rows), min_soc_swing)

        cycles = []
        for c in sorted(raw_cycles, key=lambda x: x["start_ms"]):
            start_time = ms_to_dt(c["start_ms"])
            end_time = ms_to_dt(c["end_ms"])
            duration = (end_time - start_time).total_seconds() / 3600.0

            # vebus_start = energy_flow.get_vebus_energy_at(db.conn, start_time)
            # vebus_end = energy_flow.get_vebus_energy_at(db.conn, end_time)

            # ac_energy_in = (
            #     vebus_end["ac_in_to_battery"]
            #     - vebus_start["ac_in_to_battery"]
            #     + (vebus_end["ac_out_to_battery"] - vebus_start["ac_out_to_battery"])
            # ) * 1000
            # ac_energy_out = (
            #     (vebus_end["battery_to_ac_in"] - vebus_start["battery_to_ac_in"])
            #     + (vebus_end["battery_to_ac_out"] - vebus_start["battery_to_ac_out"])
            # ) * 1000

            # system_eff = (ac_energy_out / ac_energy_in) * 100 if ac_energy_in > 0 else None
            #
            # cycles.append(
            #     BatteryCycle(
            #         start_time=start_time,
            #         end_time=end_time,
            #         duration_hours=round(duration, 2),
            #         min_soc=round(c["min_soc"]),
            #         ac_energy_in_wh=round(ac_energy_in, 1),
            #         ac_energy_out_wh=round(ac_energy_out, 1),
            #         system_efficiency=round(system_eff, 1) if system_eff else None,
            #     )
            # )

        return cycles
    except Exception as e:
        logger.exception("Failed to get battery cycles")
        raise HTTPException(status_code=500, detail=str(e))


# -------------------------#
#  Generalized endpoints  #
# -------------------------#


# TODO: add parameter to select subset of series
@router.get("/power", response_model=PowerResponse)
async def get_power(
    start: datetime | None = Query(default=None),
    end: datetime | None = Query(default=None),
    aggregate_minutes: int = Query(default=1),
    db: Database = Depends(get_db),
):
    try:
        now = datetime.now(timezone.utc)
        if start is None:
            start = now - timedelta(hours=24)
        if end is None:
            end = now
        series = db.get_all_power(start, end, aggregate_minutes * 60)
        return PowerResponse(series={k: data_to_timeseries(v) for k, v in series.items()})
    except Exception as e:
        logger.exception("Failed to get debug power flows")
        raise HTTPException(status_code=500, detail=str(e))


# TODO: add parameter to select subset of series
# TODO: add normalize parameter
@router.get("/energy", response_model=EnergyResponse)
async def get_energy(
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

        # Get counter-based energy flows
        series = db.get_all_energy(start, end, normalize=True)

        # TODO: Get integrated power flows
        for label in db.get_power_labels(start, end):
            series[f"{label} [integrated]"] = db.integrate_power(label, start, end)

        return EnergyResponse(series={k: data_to_timeseries(v) for k, v in series.items()})
    except Exception as e:
        logger.exception("Failed to get debug energy flows")
        raise HTTPException(status_code=500, detail=str(e))
