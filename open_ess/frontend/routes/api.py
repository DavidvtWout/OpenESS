import logging
from datetime import datetime, timedelta, timezone
from typing import Iterable

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from open_ess.database import Database
from open_ess.pricing import PriceConfig
from .util import find_full_battery_cycles

logger = logging.getLogger(__name__)

router = APIRouter(tags=["api"])


def get_db() -> Database:
    from open_ess.frontend.dependencies import get_database

    return get_database()


def get_prices() -> PriceConfig:
    from open_ess.frontend.dependencies import get_price_config

    return get_price_config()


class TimeSeries(BaseModel):
    timestamps: list[datetime]
    values: list[float]


class PricePoint(BaseModel):
    time: datetime
    market_price: float
    buy_price: float
    sell_price: float


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


def data_to_timeseries(data: Iterable[tuple[datetime, float]]) -> TimeSeries:
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
        # TODO:
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
    try:
        now = datetime.now(timezone.utc)
        if start is None:
            start = now - timedelta(hours=24)
        if end is None:
            end = now

        series = {
            "grid_import": db.get_energy_aggregated(
                "grid_import", bucket_minutes * 60, start, end, center_buckets=True
            ),
            "grid_export": db.get_energy_aggregated(
                "grid_export", bucket_minutes * 60, start, end, center_buckets=True
            ),
            "vebus_228_import": db.get_energy_aggregated(
                "vebus_228_ac_in_import", bucket_minutes * 60, start, end, center_buckets=True
            ),
            "vebus_228_export": db.get_energy_aggregated(
                "vebus_228_ac_in_export", bucket_minutes * 60, start, end, center_buckets=True
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
            from_mp = series_as_dict["vebus_228_export"].get(ts)
            grid_exports["From MP"].append(from_mp)
            unaccounted_export = series_as_dict["grid_export"].get(ts, 0) - (from_mp or 0)

            # Grid import
            to_mp = series_as_dict["vebus_228_import"].get(ts)
            grid_imports["To MP"].append(to_mp)
            grid_import = series_as_dict["grid_import"].get(ts)
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
    try:
        now = datetime.now(timezone.utc)
        if start is None:
            start = now - timedelta(hours=24)
        if end is None:
            end = now

        bucket_seconds = aggregate_minutes * 60

        series = {f"Grid L{i}": db.get_power(f"grid_l{i}", start, end, bucket_seconds) for i in (1, 2, 3)}

        series["To MP 228"] = []
        for (ts, ac_in), (_, ac_out) in zip(
            db.get_power("vebus_228_ac_in_l1", start, end, bucket_seconds),
            db.get_power("vebus_228_ac_out_l1", start, end, bucket_seconds),
        ):
            series["To MP 228"].append((ts, ac_in - ac_out))

        series["Battery (BMS 225)"] = db.get_power("battery_225", start, end, bucket_seconds)
        series["Battery (MP 228)"] = db.get_power("vebus_228_battery", start, end, bucket_seconds)

        series["Solar"] = db.get_power("pvinverter_31_l1", start, end, bucket_seconds)

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
    voltage: TimeSeries


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

        actual = db.get_battery_soc("battery_225", start, end)
        scheduled = [(t, soc) for _, t, _, soc in db.get_schedule(start)]
        voltage = db.get_voltage("battery_225_voltage", start, end, bucket_seconds=60)
        return BatterySocResponse(
            history=data_to_timeseries(actual),
            future=data_to_timeseries(scheduled),
            voltage=data_to_timeseries((t, round(v, 2)) for t, v in voltage),
        )
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


class BatteryCycle(BaseModel):
    start_time: datetime
    end_time: datetime
    duration_hours: float
    min_soc: int
    ac_energy_in: float | None
    ac_energy_out: float | None
    dc_energy_in: float
    dc_energy_out: float
    system_efficiency: float | None
    battery_efficiency: float
    charger_efficiency: float | None
    inverter_efficiency: float | None


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

        battery_soc = db.get_battery_soc("vebus_228_soc", start, end)
        raw_cycles = find_full_battery_cycles(battery_soc, min_soc_swing=min_soc_swing)

        cycles = []
        for cycle_start, cycle_end, min_soc in raw_cycles:
            duration = (cycle_end - cycle_start).total_seconds() / 3600.0

            # TODO: this is cursed AF and should be fixed
            dc_energy_in = 0.0
            dc_energy_out = 0.0
            for _, p in db.get_power("battery_225", cycle_start, cycle_end):
                # for _, p in db.get_power("vebus_228_battery", cycle_start, cycle_end):
                if p > 0:
                    dc_energy_in += p
                else:
                    dc_energy_out += -p
            dc_energy_in /= 60000
            dc_energy_out /= 60000

            ac_in_import = db.get_energy("vebus_228_ac_in_import", cycle_start, cycle_end, normalize=True)
            ac_out_import = db.get_energy("vebus_228_ac_out_import", cycle_start, cycle_end, normalize=True)
            ac_in_export = db.get_energy("vebus_228_ac_in_export", cycle_start, cycle_end, normalize=True)
            ac_out_export = db.get_energy("vebus_228_ac_out_export", cycle_start, cycle_end, normalize=True)

            ac_energy_in = 0.0
            if ac_in_import:
                ac_energy_in += ac_in_import[-1][1]
            if ac_out_import:
                ac_energy_in += ac_out_import[-1][1]
            ac_energy_out = 0.0
            if ac_in_export:
                ac_energy_out += ac_in_export[-1][1]
            if ac_out_export:
                ac_energy_out += ac_out_export[-1][1]

            cycles.append(
                BatteryCycle(
                    start_time=cycle_start,
                    end_time=cycle_end,
                    duration_hours=round(duration, 2),
                    min_soc=round(min_soc, 1),
                    ac_energy_in=round(ac_energy_in, 2) if ac_energy_in else None,
                    ac_energy_out=round(ac_energy_out, 2) if ac_energy_out else None,
                    dc_energy_in=round(dc_energy_in, 2),
                    dc_energy_out=round(dc_energy_out, 2),
                    system_efficiency=round(ac_energy_out / ac_energy_in * 100, 1) if ac_energy_in else None,
                    battery_efficiency=round(dc_energy_out / dc_energy_in * 100, 1),
                    charger_efficiency=round(dc_energy_in / ac_energy_in * 100, 1) if ac_energy_in else None,
                    inverter_efficiency=round(ac_energy_out / dc_energy_out * 100, 1) if dc_energy_out else None,
                )
            )

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

        # Get integrated power flows
        for label in db.get_power_labels(start, end):
            series[f"{label} [integrated]"] = db.integrate_power(label, start, end)

        return EnergyResponse(series={k: data_to_timeseries(v) for k, v in series.items()})
    except Exception as e:
        logger.exception("Failed to get debug energy flows")
        raise HTTPException(status_code=500, detail=str(e))
