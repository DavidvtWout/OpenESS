import logging
from datetime import datetime
from typing import TYPE_CHECKING, Literal

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from open_ess.frontend.dependencies import BatterySystemsDep, MqlClientDep, PriceConfigDep

from .util import TimeSeries

if TYPE_CHECKING:
    pass
logger = logging.getLogger(__name__)

router = APIRouter(tags=["api"])


class PowerResponse(BaseModel):
    series: dict[str, TimeSeries]


class EnergyResponse(BaseModel):
    series: dict[str, TimeSeries]


class HealthResponse(BaseModel):
    status: str
    database: str
    tables: list[str]


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    try:
        # TODO
        # cursor = db.execute("SELECT name FROM sqlite_master WHERE type='table'")
        # tables = [row["name"] for row in cursor.fetchall()]
        return HealthResponse(status="ok", database="connected", tables=[])
    except Exception as e:
        logger.exception("Health check failed")
        raise HTTPException(status_code=500, detail=str(e)) from e


# # ---------------------------- #
# #  Power overview (Dashboard)  #
# # ---------------------------- #
#
#
# class BatterySystemInfo(BaseModel):
#     id: str
#     name: str
#
#
# class SystemLayoutData(BaseModel):
#     phases: list[int]
#     # TODO: grid_labels: list[str]  # ["L1", "L2", "L3"]
#     has_solar: bool
#     battery_systems: list[BatterySystemInfo]
#
#
# @router.get("/system-layout", response_model=SystemLayoutData)
# async def get_system_layout(battery_systems: BatterySystemsDep) -> SystemLayoutData:
#     return SystemLayoutData(
#         phases=[1, 2, 3],
#         # grid_labels=["L1", "L2", "L3"],
#         has_solar=True,  # TODO
#         battery_systems=[BatterySystemInfo(id=b.id, name=b.name) for b in battery_systems],
#     )
#
#
# class BatteryPowerValues(BaseModel):
#     charger: float | None
#     inverter: float | None
#     battery: float | None
#     losses: float | None
#
#
# class PowerFlowData(BaseModel):
#     grid: dict[str, float | None]
#     solar: float | None
#     consumption: dict[str, float]  # e.g. {"L1": 800, "L2": 300, "L3": 200}
#     batteries: dict[str, BatteryPowerValues]
#
#
# def _get_instant_value(result: "QueryResult") -> float | None:
#     """Extract the latest value from an instant query result."""
#     if result.series and result.series[0].values:
#         return result.series[0].values[-1][1]
#     return None
#
#
# @router.get("/power-flow", response_model=PowerFlowData)
# async def get_power_flow(
#     timeseries: TimeseriesDep,
#     battery_systems: BatterySystemsDep,
# ) -> PowerFlowData:
#     if timeseries is not None:
#         return await _get_power_flow_timeseries(timeseries, battery_systems)
#     return await _get_power_flow_legacy(battery_systems)
#
#
# async def _get_power_flow_timeseries(
#     timeseries: "TimeseriesBackend",
#     battery_systems: list,
# ) -> PowerFlowData:
#     """Get power flow data from timeseries backend."""
#     now = datetime.now(UTC)
#
#     # Grid power per phase
#     grid_power: dict[str, float | None] = {}
#     for phase in ("L1", "L2", "L3"):
#         query = f'openess_power_watts{{from="grid", phase="{phase}"}}'
#         result = timeseries.query(query, now)
#         grid_power[phase] = _get_instant_value(result)
#
#     # Solar power
#     solar_query = 'openess_power_watts{from="pvinverter"}'
#     solar_result = timeseries.query(solar_query, now)
#     solar_power = _get_instant_value(solar_result)
#
#     # Battery power for each system
#     batteries: dict[str, BatteryPowerValues] = {}
#     for battery_system in battery_systems:
#         device = battery_system.id
#
#         # AC power (charger/inverter)
#         ac_in_query = battery_system.config.queries.power_ac_in.replace("$device", device)
#         ac_in_result = timeseries.query(ac_in_query, now)
#         system = _get_instant_value(ac_in_result) or 0
#
#         charger = -system if system < 0 else 0
#         inverter = system if system > 0 else 0
#
#         # DC battery power
#         battery_query = battery_system.config.queries.power_battery.replace("$device", device)
#         battery_result = timeseries.query(battery_query, now)
#         battery = _get_instant_value(battery_result) or 0
#
#         losses = battery - system
#
#         batteries[battery_system.id] = BatteryPowerValues(
#             charger=charger,
#             inverter=inverter,
#             battery=battery,
#             losses=losses,
#         )
#
#     return PowerFlowData(
#         grid=grid_power,
#         solar=solar_power,
#         consumption={"L1": 0.0, "L2": 0.0, "L3": 0.0},
#         batteries=batteries,
#     )
#
#
# async def _get_power_flow_legacy(battery_systems: list) -> PowerFlowData:
#     """Get power flow data from legacy database."""
#     start = datetime.now(UTC) - timedelta(seconds=10)
#
#     grid_power: dict[str, float | None] = {}
#     for i in (1, 2, 3):
#         power = None
#         result = db.get_power(f"grid/power/l{i}", start=start, bucket_seconds=None)
#         if result:
#             _, power = result[-1]
#         grid_power[f"L{i}"] = power
#
#     solar_power = None
#     result = db.get_power("victron/pvinverter/31/power/l1", start=start, bucket_seconds=None)
#     if result:
#         _, solar_power = result[-1]
#
#     batteries: dict[str, BatteryPowerValues] = {}
#     for battery_system in battery_systems:
#         charger = 0
#         inverter = 0
#         battery = 0
#         losses = 0
#         system = 0
#         result = db.get_power(battery_system.config.metrics.power_to_system, start=start, bucket_seconds=None)
#         if result:
#             _, system = result[-1]
#             if system < 0:
#                 charger = -system
#             if system > 0:
#                 inverter = system
#
#         result = db.get_power(battery_system.config.metrics.power_to_battery, start=start, bucket_seconds=None)
#         if result:
#             _, battery = result[-1]
#             losses = battery - system
#
#         batteries[battery_system.id] = BatteryPowerValues(
#             charger=charger,
#             inverter=inverter,
#             battery=battery,
#             losses=losses,
#         )
#
#     return PowerFlowData(
#         grid=grid_power,
#         solar=solar_power,
#         consumption={"L1": 0.0, "L2": 0.0, "L3": 0.0},
#         batteries=batteries,
#     )
#
#
# # ------------------------------- #
# #  Services overview (Dashboard)  #
# # ------------------------------- #
#
#
# class Status(StrEnum):
#     OK = "ok"
#     WARNING = "warning"
#     ERROR = "error"
#
#
# class ServiceMessage(BaseModel):
#     timestamp: datetime
#     status: Status
#     message: str
#
#
# class ServiceStatus(BaseModel):
#     status: Status
#     messages: list[ServiceMessage]
#
#
# class ServicesStatusResponse(BaseModel):
#     database: ServiceStatus | None
#     optimizer: ServiceStatus | None
#
#
# @router.get("/services-status", response_model=ServicesStatusResponse)
# async def services_status() -> ServicesStatusResponse:
#     try:
#         return ServicesStatusResponse(
#             database=ServiceStatus(status=Status.OK, messages=[]),
#             optimizer=ServiceStatus(status=Status.OK, messages=[]),
#         )
#     except Exception as e:
#         logger.exception("Health check failed")
#         raise HTTPException(status_code=500, detail=str(e)) from e
#
#
# @router.get("/battery-ids", response_model=list[str])
# async def get_battery_ids(battery_systems: BatterySystemsDep) -> list[str]:
#     try:
#         return [s.id for s in battery_systems]
#     except Exception as e:
#         logger.exception("Failed to get battery ids")
#         raise HTTPException(status_code=500, detail=str(e)) from e


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


# @router.get("/energy-graph", response_model=EnergyGraphResponse)
# async def get_energy_flow_endpoint(
#     timeseries: TimeseriesDep,
#     battery_systems: BatterySystemsDep,
#     battery_id: str | None = Query(default=None),
#     start: datetime | None = Query(default=None),
#     end: datetime | None = Query(default=None),
#     bucket_minutes: int = Query(default=60),
# ) -> EnergyGraphResponse:
#     try:
#         battery_system = None
#         if battery_id:
#             for bs in battery_systems:
#                 if bs.id == battery_id:
#                     battery_system = bs
#                     break
#         elif len(battery_systems) == 1:
#             battery_system = battery_systems[0]
#
#         if battery_system is None:
#             if battery_id:
#                 raise HTTPException(status_code=400, detail=f"No battery system with id '{battery_id}'")
#             else:
#                 raise HTTPException(status_code=400, detail="Please provide a battery_id")
#
#         now = datetime.now(UTC)
#         if start is None:
#             start = now - timedelta(hours=24)
#         if end is None:
#             end = now
#
#         return await _get_energy_graph_timeseries(timeseries, battery_system, start, end, bucket_minutes)
#     except Exception as e:
#         logger.exception("Failed to get energy flow")
#         raise HTTPException(status_code=500, detail=str(e)) from e
#
#
# async def _get_energy_graph_timeseries(
#     mql_client: "TimeseriesBackend",
#     battery_system,
#     start: datetime,
#     end: datetime,
#     bucket_minutes: int,
# ) -> EnergyGraphResponse:
#     """Get energy graph data from timeseries backend."""
#     device = battery_system.id
#     step = f"{bucket_minutes}m"
#
#     # Query energy series using increase() to get per-bucket energy consumption
#     queries = battery_system.config.queries
#     grid_import_query = queries.energy_grid_import.replace("$device", device)
#     grid_export_query = queries.energy_grid_export.replace("$device", device)
#     to_mp_query = queries.energy_to_battery.replace("$device", device)
#     from_mp_query = queries.energy_from_battery.replace("$device", device)
#
#     # Use increase() to get energy delta per bucket
#     grid_import_result = mql_client.query_range(f"increase({grid_import_query}[{step}])", start, end, step)
#     grid_export_result = mql_client.query_range(f"increase({grid_export_query}[{step}])", start, end, step)
#     to_mp_result = mql_client.query_range(f"increase({to_mp_query}[{step}])", start, end, step)
#     from_mp_result = mql_client.query_range(f"increase({from_mp_query}[{step}])", start, end, step)
#
#     # Convert to dict for easier lookup
#     def result_to_dict(result: "QueryResult") -> dict[datetime, float]:
#         if not result.series or not result.series[0].values:
#             return {}
#         return {ts: val for ts, val in result.series[0].values}
#
#     grid_import_data = result_to_dict(grid_import_result)
#     grid_export_data = result_to_dict(grid_export_result)
#     to_mp_data = result_to_dict(to_mp_result)
#     from_mp_data = result_to_dict(from_mp_result)
#
#     # Collect all timestamps
#     all_timestamps: set[datetime] = set()
#     all_timestamps.update(grid_import_data.keys())
#     all_timestamps.update(grid_export_data.keys())
#     all_timestamps.update(to_mp_data.keys())
#     all_timestamps.update(from_mp_data.keys())
#     timestamps = sorted(all_timestamps)
#
#     # Build response series
#     grid_exports: dict[str, list[float | None]] = {"From MP": []}
#     grid_imports: dict[str, list[float | None]] = {"Consumption": [], "To MP": []}
#     battery_stats = BatteryEnergySeries()
#
#     for ts in timestamps:
#         from_mp = from_mp_data.get(ts)
#         grid_exports["From MP"].append(round(from_mp, 3) if from_mp else None)
#         unaccounted_export = grid_export_data.get(ts, 0) - (from_mp or 0)
#
#         to_mp = to_mp_data.get(ts)
#         grid_imports["To MP"].append(round(to_mp, 3) if to_mp else None)
#         grid_import = grid_import_data.get(ts)
#         if grid_import is not None:
#             grid_import -= (to_mp or 0) - unaccounted_export
#         grid_imports["Consumption"].append(round(grid_import, 3) if grid_import else None)
#
#         battery_stats.energy_to_charger.append(round(to_mp, 3) if to_mp else None)
#         battery_stats.energy_from_inverter.append(round(from_mp, 3) if from_mp else None)
#
#     return EnergyGraphResponse(
#         timestamps=timestamps,
#         grid_export=grid_exports,
#         grid_import=grid_imports,
#         battery_systems={battery_system.config.name: battery_stats},
#     )


def _calculate_step(start: datetime, end: datetime, aggregate_minutes: int) -> str:
    """Calculate query step from aggregate_minutes or time range."""
    if aggregate_minutes > 1:
        return f"{aggregate_minutes}m"
    # Auto-calculate based on range
    duration = (end - start).total_seconds()
    if duration <= 3600:  # 1 hour
        return "1m"
    if duration <= 6 * 3600:  # 6 hours
        return "5m"
    if duration <= 24 * 3600:  # 24 hours
        return "15m"
    return "1h"


class PowerQueryDef(BaseModel):
    label: str
    query: str
    is_total: bool | None = None


class ChartsPowerResponse(BaseModel):
    queries: list[PowerQueryDef]
    phases: list[str]


@router.get("/charts/power-queries", response_model=ChartsPowerResponse)
async def get_power_queries(
    mql_client: MqlClientDep,
    battery_systems: BatterySystemsDep,
) -> ChartsPowerResponse:
    queries: list[PowerQueryDef] = []

    phases: list[str] = []
    if mql_client is not None:
        result = mql_client.query('openess_power_watts{from="grid"}')
        phase_set: set[str] = set()
        if hasattr(result, "series"):
            for series in result.series:
                phase_label = series.metric.get("phase")
                if phase_label:
                    phase_set.add(phase_label)
        phases = sorted(phase_set)

    # Grid power queries
    if len(phases) > 1:
        queries.append(
            PowerQueryDef(
                query='sum(avg_over_time(openess_power_watts{from="grid"}[$step]))',
                label="Grid",
                is_total=True,
            )
        )
        for phase in phases:
            queries.append(
                PowerQueryDef(
                    query=f'avg_over_time(openess_power_watts{{from="grid", phase="{phase}"}}[$step])',
                    label=f"Grid {phase}",
                    is_total=False,
                )
            )
    else:
        queries.append(
            PowerQueryDef(
                query='avg_over_time(openess_power_watts{from="grid"}[$step])',
                label="Grid",
            )
        )

    # Battery system queries
    for bs in battery_systems:
        device = bs.device_serial or "unknown"
        bs_name = bs.config.name or bs.id

        # Discover phases for this battery system
        bs_phases: list[str] = []
        if mql_client is not None:
            result = mql_client.query(f'openess_power_watts{{to="system", device="{device}"}}')
            phase_set: set[str] = set()
            if hasattr(result, "series"):
                for series in result.series:
                    phase_label = series.metric.get("phase")
                    if phase_label:
                        phase_set.add(phase_label)
            bs_phases = sorted(phase_set)

        if len(bs_phases) > 1:
            queries.append(
                PowerQueryDef(
                    query=f"""
                      sum by (device) (avg_over_time(openess_power_watts{{from="ac_in", to="system", device="{device}"}}[$step]))
                      - on(device)
                      sum by (device) (avg_over_time(openess_power_watts{{from="system", to="ac_out", device="{device}"}}[$step]))
                    """,
                    label=f"{bs_name} AC",
                    is_total=True,
                )
            )
            for phase in bs_phases:
                queries.append(
                    PowerQueryDef(
                        query=f"""
                          sum by (device, phase) (avg_over_time(openess_power_watts{{from="ac_in", to="system", device="{device}", phase="{phase}"}}[$step]))
                          - on(device, phase)
                          sum by (device, phase) (avg_over_time(openess_power_watts{{from="system", to="ac_out", device="{device}", phase="{phase}"}}[$step]))
                        """,
                        label=f"{bs_name} AC {phase}",
                        is_total=False,
                    )
                )
        else:
            queries.append(
                PowerQueryDef(
                    query=f"""
                      sum by (device) (avg_over_time(openess_power_watts{{from="ac_in", to="system", device="{device}"}}[$step]))
                      - on(device)
                      sum by (device) (avg_over_time(openess_power_watts{{from="system", to="ac_out", device="{device}"}}[$step]))
                    """,
                    label=f"{bs_name} AC",
                )
            )

        queries.append(
            PowerQueryDef(
                query=f"""
                  avg_over_time(openess_power_watts{{from="system", to="battery", unit="battery", device="{device}"}}[$step])
                  or
                  avg_over_time(openess_power_watts{{from="system", to="battery", unit="vebus", device="{device}"}}[$step])
                """,
                label=f"{bs_name} Battery",
            )
        )

    return ChartsPowerResponse(
        queries=queries,
        phases=phases,
    )


class PriceQueriesResponse(BaseModel):
    market_query: str
    buy_query: str
    sell_query: str
    step: Literal["15m", "1h"]
    currency: str = "€"  # TODO: based on area


@router.get("/graph/price-queries", response_model=PriceQueriesResponse)
async def get_price_data(
    price_config: PriceConfigDep,
    area: str | None = Query(default=None),
) -> PriceQueriesResponse:
    try:
        if not area:
            area = price_config.area
        # TODO: validate area value

        step = "1h" if price_config.hourly_average else "15m"

        return PriceQueriesResponse(
            market_query=f'avg_over_time(openess_prices{{area="{area}", price="market"}}[{step}])',
            buy_query=f'avg_over_time(openess_prices{{area="{area}", price="buy"}}[{step}])',
            sell_query=f'avg_over_time(openess_prices{{area="{area}", price="sell"}}[{step}])',
            step=step,
        )
    except Exception as e:
        logger.exception("Failed to get prices")
        raise HTTPException(status_code=500, detail=str(e)) from e


class BatteryQueriesResponse(BaseModel):
    soc_query: str
    schedule_soc_query: str
    voltage_query: str


@router.get("/charts/battery-queries", response_model=dict[str, BatteryQueriesResponse])
async def get_battery_graph(
    battery_systems: BatterySystemsDep,
) -> dict[str, BatteryQueriesResponse]:
    try:
        result = {}
        for battery_system in battery_systems:
            result[battery_system.config.name] = BatteryQueriesResponse(
                soc_query=f"""
                  openess_soc_ratio{{device="{battery_system.id}", node="battery", unit="battery"}} * 100
                  or
                  openess_soc_ratio{{device="{battery_system.id}", node="battery", unit="vebus"}} * 100
                """,
                schedule_soc_query=f'first_over_time(openess_scheduled_soc_ratio{{device="{battery_system.id}"}}) * 100',
                voltage_query=f"""
                  openess_voltage_volts{{device="{battery_system.id}", node="battery", unit="battery"}}
                  or
                  openess_voltage_volts{{device="{battery_system.id}", node="battery", unit="vebus"}}
                """,
            )
        return result
    except Exception as e:
        logger.exception("Failed to get battery SOC")
        raise HTTPException(status_code=500, detail=str(e)) from e


# # ---------------#
# #  Cycles page  #
# # ---------------#
#
#
# class EfficiencyScatterPoint(BaseModel):
#     time: datetime
#     battery_power: float
#     inverter_charger_power: float
#     losses: float
#     efficiency: float | None
#     soc: int | None
#     category: str
#
#
# @router.get("/efficiency-scatter", response_model=list[EfficiencyScatterPoint])
# async def get_efficiency_scatter(
#     db: Database,
#     timeseries: TimeseriesDep,
#     battery_systems: BatterySystemsDep,
#     battery_id: str | None = Query(default=None),
#     start: datetime | None = Query(default=None),
#     end: datetime | None = Query(default=None),
#     aggregate_minutes: int = Query(default=10),
#     idle_threshold: int = Query(default=5),
# ) -> list[EfficiencyScatterPoint]:
#     try:
#         battery_system = None
#         if battery_id:
#             for bs in battery_systems:
#                 if bs.id == battery_id:
#                     battery_system = bs
#                     break
#         elif len(battery_systems) == 1:
#             battery_system = battery_systems[0]
#
#         if battery_system is None:
#             if battery_id:
#                 raise HTTPException(status_code=400, detail=f"No battery system with id '{battery_id}'")
#             else:
#                 raise HTTPException(status_code=400, detail="Please provide a battery_id")
#
#         now = datetime.now(UTC)
#         if start is None:
#             start = now - timedelta(days=7)
#         if end is None:
#             end = now
#
#         if timeseries is not None:
#             return await _get_efficiency_scatter_timeseries(
#                 timeseries, battery_system, start, end, aggregate_minutes, idle_threshold
#             )
#
#         return await _get_efficiency_scatter_legacy(db, battery_system, start, end, aggregate_minutes, idle_threshold)
#     except Exception as e:
#         logger.exception("Failed to get efficiency scatter data")
#         raise HTTPException(status_code=500, detail=str(e)) from e
#
#
# async def _get_efficiency_scatter_timeseries(
#     timeseries: "TimeseriesBackend",
#     battery_system,
#     start: datetime,
#     end: datetime,
#     aggregate_minutes: int,
#     idle_threshold: int,
# ) -> list[EfficiencyScatterPoint]:
#     """Get efficiency scatter data from timeseries backend."""
#     device = battery_system.id
#     step = f"{aggregate_minutes}m"
#     queries = battery_system.config.queries
#
#     # Query AC in, AC out, and battery DC power
#     ac_in_query = queries.power_ac_in.replace("$device", device)
#     ac_out_query = queries.power_ac_out.replace("$device", device)
#     dc_query = queries.power_battery.replace("$device", device)
#
#     ac_in_result = timeseries.query_range(ac_in_query, start, end, step)
#     ac_out_result = timeseries.query_range(ac_out_query, start, end, step)
#     dc_result = timeseries.query_range(dc_query, start, end, step)
#
#     # Convert to dicts
#     def result_to_dict(result: "QueryResult") -> dict[datetime, float]:
#         if not result.series or not result.series[0].values:
#             return {}
#         return {ts: val for ts, val in result.series[0].values}
#
#     ac_in_data = result_to_dict(ac_in_result)
#     ac_out_data = result_to_dict(ac_out_result)
#     dc_data = result_to_dict(dc_result)
#
#     # Merge data by timestamp
#     all_timestamps = set(ac_in_data.keys()) & set(ac_out_data.keys()) & set(dc_data.keys())
#
#     points = []
#     for ts in sorted(all_timestamps):
#         ac = ac_in_data[ts] - ac_out_data[ts]
#         dc = dc_data[ts]
#
#         if abs(dc) < idle_threshold:
#             category = "idling"
#         elif dc > 0:
#             category = "charging"
#         else:
#             category = "discharging"
#
#         losses = ac - dc
#         efficiency = None
#         if category == "charging" and ac > 0:
#             efficiency = (dc / ac) * 100
#         elif category == "discharging" and dc < 0:
#             efficiency = (ac / dc) * 100
#
#         points.append(
#             EfficiencyScatterPoint(
#                 time=ts,
#                 battery_power=round(abs(dc), 1),
#                 inverter_charger_power=round(ac, 1),
#                 losses=round(losses, 1),
#                 efficiency=round(efficiency, 1) if efficiency is not None else None,
#                 soc=None,
#                 category=category,
#             )
#         )
#
#     return points
#
#
# async def _get_efficiency_scatter_legacy(
#     db: "DatabaseConnection",
#     battery_system,
#     start: datetime,
#     end: datetime,
#     aggregate_minutes: int,
#     idle_threshold: int,
# ) -> list[EfficiencyScatterPoint]:
#     """Get efficiency scatter data from legacy database."""
#     metrics = battery_system.config.metrics
#     bucket_seconds = aggregate_minutes * 60
#
#     # Use configured metrics paths
#     ac_in_path = metrics.power_to_system
#     if isinstance(ac_in_path, list):
#         ac_in_path = ac_in_path[0]
#
#     # AC out is typically the same vebus but ac_out instead of ac_in
#     ac_out_path = ac_in_path.replace("ac_in", "ac_out") if ac_in_path else None
#
#     dc_path = metrics.power_to_battery
#     if isinstance(dc_path, list):
#         dc_path = dc_path[0]
#
#     ac_in = db.get_power(ac_in_path, start, end, bucket_seconds=bucket_seconds) if ac_in_path else []
#     ac_out = db.get_power(ac_out_path, start, end, bucket_seconds=bucket_seconds) if ac_out_path else []
#     dc = db.get_power(dc_path, start, end, bucket_seconds=bucket_seconds) if dc_path else []
#
#     data: dict[datetime, list[float | None]] = {
#         ts: [v_in - v_out, None] for (ts, v_in), (_, v_out) in zip(ac_in, ac_out, strict=False)
#     }
#     for ts, v in dc:
#         if ts in data:
#             data[ts][1] = v
#
#     points = []
#     for ts, (ac, dc_val) in data.items():
#         if ac is None or dc_val is None:
#             continue
#
#         if abs(dc_val) < idle_threshold:
#             category = "idling"
#         elif dc_val > 0:
#             category = "charging"
#         else:
#             category = "discharging"
#
#         losses = ac - dc_val
#         efficiency = None
#         if category == "charging" and ac > 0:
#             efficiency = (dc_val / ac) * 100
#         elif category == "discharging" and dc_val < 0:
#             efficiency = (ac / dc_val) * 100
#
#         points.append(
#             EfficiencyScatterPoint(
#                 time=ts,
#                 battery_power=round(abs(dc_val), 1),
#                 inverter_charger_power=round(ac, 1),
#                 losses=round(losses, 1),
#                 efficiency=round(efficiency, 1) if efficiency is not None else None,
#                 soc=None,
#                 category=category,
#             )
#         )
#
#     return points
#
#
# class BatteryCycle(BaseModel):
#     start_time: datetime
#     end_time: datetime
#     duration_hours: float
#     min_soc: float
#     ac_energy_in: float | None
#     ac_energy_out: float | None
#     dc_energy_in: float
#     dc_energy_out: float
#     system_efficiency: float | None
#     battery_efficiency: float | None
#     charger_efficiency: float | None
#     inverter_efficiency: float | None
#     profit: float | None
#     scheduled_profit: float | None
#
#
# @router.get("/cycles", response_model=list[BatteryCycle])
# async def get_battery_cycles(
#     db: Database,
#     timeseries: TimeseriesDep,
#     battery_systems: BatterySystemsDep,
#     price_config: PriceConfigDep,
#     battery_id: str | None = Query(default=None),
#     start: datetime | None = Query(default=None),
#     end: datetime | None = Query(default=None),
#     min_soc_swing: int = Query(default=10),
# ) -> list[BatteryCycle]:
#     try:
#         battery_system = None
#         if battery_id:
#             for bs in battery_systems:
#                 if bs.id == battery_id:
#                     battery_system = bs
#                     break
#         elif len(battery_systems) == 1:
#             battery_system = battery_systems[0]
#
#         if battery_system is None:
#             if battery_id:
#                 raise HTTPException(status_code=400, detail=f"No battery system with id '{battery_id}'")
#             else:
#                 raise HTTPException(status_code=400, detail="Please provide a battery_id")
#
#         now = datetime.now(UTC)
#         if start is None:
#             start = now - timedelta(days=30)
#         if end is None:
#             end = now
#
#         # Get SOC data from timeseries or legacy database
#         if timeseries is not None:
#             device = battery_system.id
#             soc_query = battery_system.config.queries.soc.replace("$device", device)
#             soc_result = timeseries.query_range(soc_query, start, end, step="1m")
#             battery_soc = [(ts, val) for ts, val in soc_result.series[0].values] if soc_result.series else []
#         else:
#             battery_soc = db.get_battery_soc(battery_system.config.metrics.battery_soc, start, end)
#
#         raw_cycles = find_full_battery_cycles(battery_soc, full_threshold=90, min_soc_swing=min_soc_swing)
#
#         cycles = []
#         for cycle_start, cycle_end, min_soc in raw_cycles:
#             duration = (cycle_end - cycle_start).total_seconds() / 3600.0
#
#             # TODO: this is cursed AF and should be fixed
#             dc_energy_in = 0.0
#             dc_energy_out = 0.0
#             for _, p in db.get_power(battery_system.config.metrics.power_to_battery[0], cycle_start, cycle_end):
#                 # for _, p in db.get_power("vebus_228_battery", cycle_start, cycle_end):
#                 if p > 0:
#                     dc_energy_in += p
#                 else:
#                     dc_energy_out += -p
#             dc_energy_in /= 60000
#             dc_energy_out /= 60000
#
#             ac_in_import = db.get_energy(
#                 battery_system.config.metrics.energy_to_system, cycle_start, cycle_end, normalize=True
#             )
#             # ac_out_import = db.get_energy("vebus_228_ac_out_import", cycle_start, cycle_end, normalize=True)
#             ac_in_export = db.get_energy(
#                 battery_system.config.metrics.energy_from_system, cycle_start, cycle_end, normalize=True
#             )
#             # ac_out_export = db.get_energy("vebus_228_ac_out_export", cycle_start, cycle_end, normalize=True)
#
#             ac_energy_in = 0.0
#             if ac_in_import:
#                 ac_energy_in += ac_in_import[-1][1]
#             # if ac_out_import:
#             #     ac_energy_in += ac_out_import[-1][1]
#             ac_energy_out = 0.0
#             if ac_in_export:
#                 ac_energy_out += ac_in_export[-1][1]
#             # if ac_out_export:
#             #     ac_energy_out += ac_out_export[-1][1]
#
#             profit = 0.0
#             scheduled_profit = 0.0
#             e_in = {
#                 ts: v
#                 for ts, v in db.get_energy_aggregated(
#                     battery_system.config.metrics.energy_to_system, 3600, cycle_start, cycle_end
#                 )
#             }
#             e_out = {
#                 ts: v
#                 for ts, v in db.get_energy_aggregated(
#                     battery_system.config.metrics.energy_from_system, 3600, cycle_start, cycle_end
#                 )
#             }
#             scheduled = {ts: v for ts, _, v, _ in db.get_schedule(battery_system.config.id, cycle_start)}
#             for ts, v in db.get_prices(price_config.area, cycle_start, cycle_end, aggregate_minutes=60):
#                 profit -= price_config.buy_price(v) * e_in.get(ts, 0)
#                 profit += price_config.sell_price(v) * e_out.get(ts, 0)
#                 scheduled_power = scheduled.get(ts, 0)
#                 if scheduled_power > 0:
#                     scheduled_profit -= price_config.buy_price(v) * scheduled_power / 1000
#                 if scheduled_power < 0:
#                     scheduled_profit += price_config.sell_price(v) * -scheduled_power / 1000
#
#             cycles.append(
#                 BatteryCycle(
#                     start_time=cycle_start,
#                     end_time=cycle_end,
#                     duration_hours=round(duration, 2),
#                     min_soc=round(min_soc, 1),
#                     ac_energy_in=round(ac_energy_in, 2) if ac_energy_in else None,
#                     ac_energy_out=round(ac_energy_out, 2) if ac_energy_out else None,
#                     dc_energy_in=round(dc_energy_in, 2),
#                     dc_energy_out=round(dc_energy_out, 2),
#                     system_efficiency=round(ac_energy_out / ac_energy_in * 100, 1) if ac_energy_in else None,
#                     battery_efficiency=round(dc_energy_out / dc_energy_in * 100, 1) if dc_energy_in else None,
#                     charger_efficiency=round(dc_energy_in / ac_energy_in * 100, 1) if ac_energy_in else None,
#                     inverter_efficiency=round(ac_energy_out / dc_energy_out * 100, 1) if dc_energy_out else None,
#                     profit=round(profit, 2),
#                     scheduled_profit=round(scheduled_profit, 2),
#                 )
#             )
#
#         return cycles
#     except Exception as e:
#         logger.exception("Failed to get battery cycles")
#         raise HTTPException(status_code=500, detail=str(e)) from e
#
#
# # -------------------------#
# #  Generalized endpoints  #
# # -------------------------#
#
#
# # TODO: add parameter to select subset of series
# @router.get("/power", response_model=PowerResponse)
# async def get_power(
#     db: Database,
#     timeseries: TimeseriesDep,
#     battery_systems: BatterySystemsDep,
#     start: datetime | None = Query(default=None),
#     end: datetime | None = Query(default=None),
#     aggregate_minutes: int = Query(default=1),
# ) -> PowerResponse:
#     try:
#         now = datetime.now(UTC)
#         if start is None:
#             start = now - timedelta(hours=24)
#         if end is None:
#             end = now
#
#         if timeseries is not None and battery_systems:
#             # Query all power metrics from timeseries
#             step = _calculate_step(start, end, aggregate_minutes)
#             series: dict[str, TimeSeries] = {}
#
#             for battery_system in battery_systems:
#                 device = battery_system.id
#                 queries = battery_system.config.queries
#                 prefix = battery_system.config.name or device
#
#                 # Query each power metric
#                 power_queries = {
#                     "Grid": queries.power_grid_total,
#                     "Grid L1": f'openess_power_watts{{from="grid", phase="L1", device="{device}"}}',
#                     "Grid L2": f'openess_power_watts{{from="grid", phase="L2", device="{device}"}}',
#                     "Grid L3": f'openess_power_watts{{from="grid", phase="L3", device="{device}"}}',
#                     "PV": queries.power_pv,
#                     "Battery": queries.power_battery,
#                     "AC In": queries.power_ac_in,
#                     "AC Out": queries.power_ac_out,
#                 }
#
#                 for name, query in power_queries.items():
#                     resolved_query = query.replace("$device", device)
#                     result = timeseries.query_range(resolved_query, start, end, step)
#                     label = f"{prefix}/{name}" if len(battery_systems) > 1 else name
#                     series[label] = query_result_to_timeseries(result)
#
#             return PowerResponse(series=series)
#
#         # Legacy database fallback
#         legacy_series = db.get_all_power(start, end, aggregate_minutes * 60)
#         return PowerResponse(series={k: data_to_timeseries(v) for k, v in legacy_series.items()})
#     except Exception as e:
#         logger.exception("Failed to get debug power flows")
#         raise HTTPException(status_code=500, detail=str(e)) from e
#
#
# # TODO: add parameter to select subset of series
# # TODO: add normalize parameter
# @router.get("/energy", response_model=EnergyResponse)
# async def get_energy(
#     db: Database,
#     timeseries: TimeseriesDep,
#     battery_systems: BatterySystemsDep,
#     start: datetime | None = Query(default=None),
#     end: datetime | None = Query(default=None),
#     bucket_minutes: int = Query(default=60),
# ) -> EnergyResponse:
#     try:
#         now = datetime.now(UTC)
#         if start is None:
#             start = now - timedelta(hours=24)
#         if end is None:
#             end = now
#
#         if timeseries is not None and battery_systems:
#             # Query all energy metrics from timeseries
#             step = f"{bucket_minutes}m"
#             series: dict[str, TimeSeries] = {}
#
#             for battery_system in battery_systems:
#                 device = battery_system.id
#                 queries = battery_system.config.queries
#                 prefix = battery_system.config.name or device
#
#                 energy_queries = {
#                     "Grid Import": queries.energy_grid_import,
#                     "Grid Export": queries.energy_grid_export,
#                     "To Battery": queries.energy_to_battery,
#                     "From Battery": queries.energy_from_battery,
#                 }
#
#                 for name, query in energy_queries.items():
#                     resolved_query = query.replace("$device", device)
#                     # Use increase() to get energy delta per bucket
#                     result = timeseries.query_range(f"increase({resolved_query}[{step}])", start, end, step)
#                     label = f"{prefix}/{name}" if len(battery_systems) > 1 else name
#                     series[label] = query_result_to_timeseries(result, rounding=3)
#
#             return EnergyResponse(series=series)
#
#         # Legacy database fallback
#         legacy_series = db.get_all_energy(start, end, normalize=True)
#
#         # Get integrated power flows
#         for label in db.get_power_labels(start, end):
#             legacy_series[f"{label} [integrated]"] = db.integrate_power(label, start, end)
#
#         return EnergyResponse(series={k: data_to_timeseries(v) for k, v in legacy_series.items()})
#     except Exception as e:
#         logger.exception("Failed to get debug energy flows")
#         raise HTTPException(status_code=500, detail=str(e)) from e
#
#
# # -------------------------- #
# #  Timeseries query helpers  #
# # -------------------------- #
#
#
# @router.get("/queries/{battery_id}")
# async def get_queries(
#     battery_id: str,
#     battery_systems: BatterySystemsDep,
# ) -> dict[str, str]:
#     """Return resolved MetricsQL queries for a battery system.
#
#     The queries are templated in BatterySystemConfig.queries and resolved
#     with the device serial number. Frontend can use these to query the
#     timeseries backend directly via /api/v1/query_range.
#     """
#     battery = next((b for b in battery_systems if b.id == battery_id), None)
#     if not battery:
#         raise HTTPException(404, f"Battery system {battery_id} not found")
#
#     device = battery.id
#     queries = battery.config.queries
#
#     return {field: getattr(queries, field).replace("$device", device) for field in queries.model_fields}
