import logging
from datetime import datetime, timedelta, timezone
from enum import Enum

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from open_ess.database import DatabaseConnection
from open_ess.battery_system import BatteryConfig
from open_ess.pricing import PriceConfig
from .util import TimeSeries, data_to_timeseries, find_full_battery_cycles

logger = logging.getLogger(__name__)

router = APIRouter(tags=["api"])


def get_db() -> DatabaseConnection:
    from open_ess.frontend.dependencies import get_database

    return get_database()


def get_prices() -> PriceConfig:
    from open_ess.frontend.dependencies import get_price_config

    return get_price_config()


def get_batteries() -> dict[str, BatteryConfig]:
    from open_ess.frontend.dependencies import get_battery_configs

    return get_battery_configs()


class PowerResponse(BaseModel):
    series: dict[str, TimeSeries]


class EnergyResponse(BaseModel):
    series: dict[str, TimeSeries]


class HealthResponse(BaseModel):
    status: str
    database: str
    tables: list[str]


@router.get("/health", response_model=HealthResponse)
async def health_check(db: DatabaseConnection = Depends(get_db)):
    try:
        # TODO:
        cursor = db.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row["name"] for row in cursor.fetchall()]
        return HealthResponse(status="ok", database="connected", tables=tables)
    except Exception as e:
        logger.exception("Health check failed")
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------- #
#  Power overview (Dashboard)  #
# ---------------------------- #


class BatterySystemInfo(BaseModel):
    id: str
    name: str


class SystemLayoutData(BaseModel):
    phases: list[int]
    has_solar: bool
    battery_systems: list[BatterySystemInfo]


class PowerFlowData(BaseModel):
    grid: dict[str, float]  # e.g. {"L1": 500, "L2": 200, "L3": 100}
    solar: float | None
    consumption: dict[str, float]  # e.g. {"L1": 800, "L2": 300, "L3": 200}
    batteries: dict[str, float]  # e.g. {"bat1": -500, "bat2": 200} positive=charging


@router.get("/system-layout", response_model=SystemLayoutData)
async def get_system_layout():
    """Returns the system layout for the power flow dashboard.

    This is a stub endpoint - actual implementation will discover battery systems
    from the database and configuration.
    """
    return SystemLayoutData(
        phases=[1, 2, 3],
        has_solar=True,
        battery_systems=[
            BatterySystemInfo(id="bat1", name="MultiPlus 1"),
            BatterySystemInfo(id="bat2", name="MultiPlus 2"),
            BatterySystemInfo(id="bat3", name="MultiPlus 3"),
        ],
    )


@router.get("/power-flow", response_model=PowerFlowData)
async def get_power_flow():
    """Returns real-time power flow data for the dashboard.

    This is a stub endpoint - actual implementation will read from database.
    """
    return PowerFlowData(
        grid={"L1": 0.0, "L2": 0.0, "L3": 0.0},
        solar=0.0,
        consumption={"L1": 0.0, "L2": 0.0, "L3": 0.0},
        batteries={"bat1": 0.0, "bat2": 0.0, "bat3": 0.0},
    )


# ------------------------------- #
#  Services overview (Dashboard)  #
# ------------------------------- #


class Status(str, Enum):
    OK = "ok"
    WARNING = "warning"
    ERROR = "error"


class ServiceMessage(BaseModel):
    timestamp: datetime
    status: Status
    message: str


class ServiceStatus(BaseModel):
    status: Status
    messages: list[ServiceMessage]


class ServicesStatusResponse(BaseModel):
    database: ServiceStatus | None
    optimizer: ServiceStatus | None


@router.get("/services-status", response_model=ServicesStatusResponse)
async def services_status(db: DatabaseConnection = Depends(get_db)):
    try:
        return ServicesStatusResponse(
            database=ServiceStatus(status=Status.OK, messages=[]),
            optimizer=ServiceStatus(status=Status.OK, messages=[]),
        )
    except Exception as e:
        logger.exception("Health check failed")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/battery-ids", response_model=list[str])
async def get_battery_ids(battery_configs: dict[str, BatteryConfig] = Depends(get_batteries)):
    try:
        return list(battery_configs.keys())
    except Exception as e:
        logger.exception("Failed to get battery ids")
        raise HTTPException(status_code=500, detail=str(e))


# ------------------------ #
#  Metrics page endpoints  #
# ------------------------ #


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
    battery_id: str | None = Query(default=None),
    start: datetime | None = Query(default=None),
    end: datetime | None = Query(default=None),
    bucket_minutes: int = Query(default=60),
    db: DatabaseConnection = Depends(get_db),
    battery_configs: dict[str, BatteryConfig] = Depends(get_batteries),
):
    try:
        if battery_id is None:
            battery_config = battery_configs["victron/vebus/228"]  # TODO
        else:
            battery_config = battery_configs[battery_id]
        now = datetime.now(timezone.utc)
        if start is None:
            start = now - timedelta(hours=24)
        if end is None:
            end = now

        series = {
            "grid_import": db.get_energy_aggregated(
                "grid/energy/import/total", bucket_minutes * 60, start, end, center_buckets=True
            ),
            "grid_export": db.get_energy_aggregated(
                "grid/energy/export/total", bucket_minutes * 60, start, end, center_buckets=True
            ),
            "vebus_228_import": db.get_energy_aggregated(
                battery_config.metrics.energy_to_system, bucket_minutes * 60, start, end, center_buckets=True
            ),
            "vebus_228_export": db.get_energy_aggregated(
                battery_config.metrics.energy_from_system, bucket_minutes * 60, start, end, center_buckets=True
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
async def get_power_graph(
    battery_id: str | None = Query(default=None),
    start: datetime | None = Query(default=None),
    end: datetime | None = Query(default=None),
    aggregate_minutes: int = Query(default=1),
    db: DatabaseConnection = Depends(get_db),
    battery_configs: dict[str, BatteryConfig] = Depends(get_batteries),
):
    try:
        if battery_id is None:
            battery_config = battery_configs["victron/vebus/228"]  # TODO
        else:
            battery_config = battery_configs[battery_id]
        now = datetime.now(timezone.utc)
        if start is None:
            start = now - timedelta(hours=24)
        if end is None:
            end = now

        bucket_seconds = aggregate_minutes * 60

        series = {f"Grid L{i}": db.get_power(f"grid/power/l{i}", start, end, bucket_seconds) for i in (1, 2, 3)}

        series["To MP"] = db.get_power(battery_config.metrics.power_to_system, start, end, bucket_seconds)

        series["Battery"] = db.get_power(battery_config.metrics.power_to_battery, start, end, bucket_seconds)

        series["Solar"] = [
            (t, -p) for t, p in db.get_power("victron/pvinverter/31/power/l1", start, end, bucket_seconds)
        ]

        series["Schedule"] = []
        for ts_start, ts_end, v, _ in db.get_schedule(battery_config.id, start):
            series["Schedule"].extend([(ts_start, v), (ts_end, v)])

        return PowerResponse(series={k: data_to_timeseries(v) for k, v in series.items()})
    except Exception as e:
        logger.exception("Failed to get power data")
        raise HTTPException(status_code=500, detail=str(e))


class PricePoint(BaseModel):
    time: datetime
    market: float | None
    buy: float | None
    sell: float | None


class PricesResponse(BaseModel):
    area: str
    aggregate_minutes: int
    unit: str = "€/kWh"  # TODO: based on area
    timeseries: list[PricePoint]


@router.get("/prices", response_model=PricesResponse)
async def get_price_data(
    area: str | None = Query(default=None),
    start: datetime | None = Query(default=None),
    end: datetime | None = Query(default=None),
    aggregate_minutes: int | None = Query(default=None),
    db: DatabaseConnection = Depends(get_db),
    price_config: PriceConfig = Depends(get_prices),
):
    try:
        if area is None:
            area = price_config.area
        now = datetime.now(timezone.utc)
        if start is None:
            start = now - timedelta(days=7)
        if end is None:
            end = now + timedelta(days=2)
        if aggregate_minutes is None:
            aggregate_minutes = price_config.aggregate_minutes

        timeseries = []
        for timestamp, price in db.get_prices(area, start, end, aggregate_minutes=aggregate_minutes):
            timeseries.append(
                PricePoint(
                    time=timestamp,
                    market=round(price, 4),
                    buy=round(price_config.buy_price(price), 4),
                    sell=round(price_config.sell_price(price), 4),
                )
            )

        return PricesResponse(
            area=area,
            aggregate_minutes=aggregate_minutes,
            timeseries=timeseries,
        )
    except Exception as e:
        logger.exception("Failed to get prices")
        raise HTTPException(status_code=500, detail=str(e))


class BatteryGraphResponse(BaseModel):
    soc: TimeSeries
    schedule: TimeSeries  # Scheduled (past and future) SoC
    voltage: TimeSeries


@router.get("/battery-graph", response_model=dict[str, BatteryGraphResponse])
async def get_battery_graph(
    battery_id: str | None = Query(default=None),
    start: datetime | None = Query(default=None),
    end: datetime | None = Query(default=None),
    db: DatabaseConnection = Depends(get_db),
    battery_configs: dict[str, BatteryConfig] = Depends(get_batteries),
):
    try:
        now = datetime.now(timezone.utc)
        if start is None:
            start = now - timedelta(hours=48)
        if end is None:
            end = now + timedelta(hours=24)

        result = {}
        for battery_config in battery_configs.values():
            if battery_id is not None and battery_config.id != battery_id:
                continue

            soc = db.get_battery_soc(battery_config.metrics.battery_soc, start, end)
            scheduled = [(t, soc) for _, t, _, soc in db.get_schedule(battery_config.id, start)]
            voltage = db.get_voltage(battery_config.metrics.battery_voltage, start, end, bucket_seconds=60)

            result[battery_config.name] = BatteryGraphResponse(
                soc=data_to_timeseries(soc, rounding=1),
                schedule=data_to_timeseries(scheduled, rounding=1),
                voltage=data_to_timeseries(voltage, rounding=2),
            )
        return result
    except Exception as e:
        logger.exception("Failed to get battery SOC")
        raise HTTPException(status_code=500, detail=str(e))


# ---------------#
#  Cycles page  #
# ---------------#


class EfficiencyScatterPoint(BaseModel):
    time: datetime
    battery_power: float
    inverter_charger_power: float
    losses: float
    efficiency: float | None
    soc: int | None
    category: str


@router.get("/efficiency-scatter", response_model=list[EfficiencyScatterPoint])
async def get_efficiency_scatter(
    limit: int = Query(default=2000),
    aggregate_minutes: int = Query(default=10),
    idle_threshold: int = Query(default=5),
    balancing_threshold: int = Query(default=100),
    db: DatabaseConnection = Depends(get_db),
):
    try:
        ac_in = db.get_power("victron/vebus/228/power/ac_in/l1", bucket_seconds=aggregate_minutes * 60, limit=limit)
        ac_out = db.get_power("victron/vebus/228/power/ac_out/l1", bucket_seconds=aggregate_minutes * 60, limit=limit)
        dc = db.get_power("victron/vebus/228/power/battery", bucket_seconds=aggregate_minutes * 60, limit=limit)
        # dc = db.get_power("victron/battery/225/power/battery", bucket_seconds=aggregate_minutes * 60, limit=limit)

        data = {ts: [v_in - v_out, None] for (ts, v_in), (_, v_out) in zip(ac_in, ac_out)}
        for ts, v in dc:
            if ts in data:
                data[ts][1] = v

        points = []
        for ts, (ac, dc) in data.items():
            if abs(dc) < idle_threshold:
                category = "idling"
            # elif dc > 0 and soc == 100 and abs(ac) < balancing_threshold:
            #     category = "balancing"
            elif dc > 0:
                category = "charging"
            else:
                category = "discharging"

            losses = ac - dc
            efficiency = None
            if category == "charging" and ac > 0:
                efficiency = (dc / ac) * 100
            elif category == "discharging" and dc < 0:
                efficiency = (ac / dc) * 100

            points.append(
                EfficiencyScatterPoint(
                    time=ts,
                    battery_power=round(abs(dc), 1),
                    inverter_charger_power=round(ac, 1),
                    losses=round(losses, 1),
                    efficiency=round(efficiency, 1) if efficiency is not None else None,
                    soc=None,
                    category=category,
                )
            )

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
    battery_efficiency: float | None
    charger_efficiency: float | None
    inverter_efficiency: float | None
    profit: float | None
    scheduled_profit: float | None


@router.get("/cycles", response_model=list[BatteryCycle])
async def get_battery_cycles(
    battery_id: str | None = Query(default=None),
    start: datetime | None = Query(default=None),
    end: datetime | None = Query(default=None),
    min_soc_swing: int = Query(default=10),
    db: DatabaseConnection = Depends(get_db),
    battery_configs: dict[str, BatteryConfig] = Depends(get_batteries),
    price_config: PriceConfig = Depends(get_prices),
):
    try:
        if battery_id is None:
            battery_config = battery_configs["victron/vebus/228"]  # TODO
        else:
            battery_config = battery_configs[battery_id]
        now = datetime.now(timezone.utc)
        if start is None:
            start = now - timedelta(days=30)
        if end is None:
            end = now

        battery_soc = db.get_battery_soc(battery_config.metrics.battery_soc, start, end)
        raw_cycles = find_full_battery_cycles(battery_soc, full_threshold=90, min_soc_swing=min_soc_swing)

        cycles = []
        for cycle_start, cycle_end, min_soc in raw_cycles:
            duration = (cycle_end - cycle_start).total_seconds() / 3600.0

            # TODO: this is cursed AF and should be fixed
            dc_energy_in = 0.0
            dc_energy_out = 0.0
            for _, p in db.get_power(battery_config.metrics.power_to_battery[0], cycle_start, cycle_end):
                # for _, p in db.get_power("vebus_228_battery", cycle_start, cycle_end):
                if p > 0:
                    dc_energy_in += p
                else:
                    dc_energy_out += -p
            dc_energy_in /= 60000
            dc_energy_out /= 60000

            ac_in_import = db.get_energy(
                battery_config.metrics.energy_to_system, cycle_start, cycle_end, normalize=True
            )
            # ac_out_import = db.get_energy("vebus_228_ac_out_import", cycle_start, cycle_end, normalize=True)
            ac_in_export = db.get_energy(
                battery_config.metrics.energy_from_system, cycle_start, cycle_end, normalize=True
            )
            # ac_out_export = db.get_energy("vebus_228_ac_out_export", cycle_start, cycle_end, normalize=True)

            ac_energy_in = 0.0
            if ac_in_import:
                ac_energy_in += ac_in_import[-1][1]
            # if ac_out_import:
            #     ac_energy_in += ac_out_import[-1][1]
            ac_energy_out = 0.0
            if ac_in_export:
                ac_energy_out += ac_in_export[-1][1]
            # if ac_out_export:
            #     ac_energy_out += ac_out_export[-1][1]

            profit = 0.0
            scheduled_profit = 0.0
            e_in = {
                ts: v
                for ts, v in db.get_energy_aggregated(
                    battery_config.metrics.energy_to_system, 3600, cycle_start, cycle_end
                )
            }
            e_out = {
                ts: v
                for ts, v in db.get_energy_aggregated(
                    battery_config.metrics.energy_from_system, 3600, cycle_start, cycle_end
                )
            }
            scheduled = {ts: v for ts, _, v, _ in db.get_schedule(battery_config.id, cycle_start)}
            for ts, v in db.get_prices(price_config.area, cycle_start, cycle_end, aggregate_minutes=60):
                profit -= price_config.buy_price(v) * e_in.get(ts, 0)
                profit += price_config.sell_price(v) * e_out.get(ts, 0)
                scheduled_power = scheduled.get(ts, 0)
                if scheduled_power > 0:
                    scheduled_profit -= price_config.buy_price(v) * scheduled_power / 1000
                if scheduled_power < 0:
                    scheduled_profit += price_config.sell_price(v) * -scheduled_power / 1000

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
                    battery_efficiency=round(dc_energy_out / dc_energy_in * 100, 1) if dc_energy_in else None,
                    charger_efficiency=round(dc_energy_in / ac_energy_in * 100, 1) if ac_energy_in else None,
                    inverter_efficiency=round(ac_energy_out / dc_energy_out * 100, 1) if dc_energy_out else None,
                    profit=round(profit, 2),
                    scheduled_profit=round(scheduled_profit, 2),
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
    db: DatabaseConnection = Depends(get_db),
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
    db: DatabaseConnection = Depends(get_db),
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
