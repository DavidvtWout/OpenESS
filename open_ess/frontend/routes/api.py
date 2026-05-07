import logging
from datetime import UTC, datetime, timedelta
from enum import StrEnum
from typing import TYPE_CHECKING, Literal

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from open_ess.frontend.dependencies import BatterySystemsDep, MqlClientDep, PriceConfigDep
from open_ess.timeseries import TimeseriesBackend

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


@router.get("/system-layout", response_model=SystemLayoutData)
async def get_system_layout(
    mql_client: MqlClientDep,
    battery_systems: BatterySystemsDep,
) -> SystemLayoutData:
    # Discover phases from grid power metrics
    phases: list[int] = []
    if mql_client:
        result = mql_client.query('openess_power_watts{from="grid"}')
        phase_set: set[int] = set()
        if hasattr(result, "series"):
            for series in result.series:
                phase_label = series.metric.get("phase", "")
                if phase_label.startswith("L"):
                    phase_set.add(int(phase_label[1:]))
        phases = sorted(phase_set) if phase_set else [1, 2, 3]
    else:
        phases = [1, 2, 3]

    # TODO: detect solar from metrics
    has_solar = False

    return SystemLayoutData(
        phases=phases,
        has_solar=has_solar,
        battery_systems=[BatterySystemInfo(id=b.id, name=b.name or b.id) for b in battery_systems],
    )


class BatteryPowerValues(BaseModel):
    charger: float | None
    inverter: float | None
    battery: float | None
    losses: float | None
    soc: float | None


class PowerFlowData(BaseModel):
    grid: dict[str, float | None]
    solar: float | None
    consumption: dict[str, float]
    batteries: dict[str, BatteryPowerValues]


def _get_instant_value(result) -> float | None:
    """Extract the value from an instant query result."""
    if hasattr(result, "series") and result.series:
        return result.series[0].value
    return None


def _get_instant_values_by_label(result, label_key: str) -> dict[str, float]:
    """Extract values from an instant query result, keyed by a label."""
    values: dict[str, float] = {}
    if hasattr(result, "series"):
        for series in result.series:
            key = series.metric.get(label_key, "")
            if key:
                values[key] = series.value
    return values


@router.get("/power-flow", response_model=PowerFlowData)
async def get_power_flow(
    mql_client: MqlClientDep,
    battery_systems: BatterySystemsDep,
) -> PowerFlowData:
    if mql_client is None:
        raise HTTPException(503, "Timeseries backend not configured")

    # Grid power per phase
    grid_result = mql_client.query('openess_power_watts{from="grid"}')
    grid_power = _get_instant_values_by_label(grid_result, "phase")

    # Solar power (sum all PV inverter phases)
    solar_result = mql_client.query('sum(openess_power_watts{from="pvinverter"})')
    solar_power = _get_instant_value(solar_result)

    # Battery power for each system
    batteries: dict[str, BatteryPowerValues] = {}
    for battery_system in battery_systems:
        device = battery_system.device_serial

        # AC power: charger input - inverter output
        ac_in_result = mql_client.query(f'sum(openess_power_watts{{from="ac_in", to="system", device="{device}"}})')
        ac_out_result = mql_client.query(f'sum(openess_power_watts{{from="system", to="ac_out", device="{device}"}})')
        ac_in = _get_instant_value(ac_in_result) or 0
        ac_out = _get_instant_value(ac_out_result) or 0

        charger = ac_in
        inverter = ac_out

        # DC battery power
        battery_result = mql_client.query(f'openess_power_watts{{from="system", to="battery", device="{device}"}}')
        battery_power = _get_instant_value(battery_result) or 0

        # SOC
        soc_result = mql_client.query(f'openess_soc_ratio{{device="{device}", node="battery"}} * 100')
        soc = _get_instant_value(soc_result)

        # Losses = AC net - DC
        ac_net = ac_in - ac_out
        losses = ac_net - battery_power

        batteries[battery_system.id] = BatteryPowerValues(
            charger=charger,
            inverter=inverter,
            battery=battery_power,
            losses=losses,
            soc=soc,
        )

    # Consumption = grid + solar + battery discharge - battery charge
    # For now, return zeros (would need more complex calculation)
    consumption: dict[str, float] = {}
    for phase, grid_val in grid_power.items():
        consumption[phase] = grid_val or 0.0

    return PowerFlowData(
        grid=grid_power,
        solar=solar_power,
        consumption=consumption,
        batteries=batteries,
    )


# ------------------------------- #
#  Services overview (Dashboard)  #
# ------------------------------- #


class Status(StrEnum):
    OK = "ok"
    WARNING = "warning"
    ERROR = "error"


class ServiceMessage(BaseModel):
    message: str


class ServiceStatus(BaseModel):
    status: Status
    messages: list[ServiceMessage]


class ServicesStatusResponse(BaseModel):
    database: ServiceStatus | None
    optimizer: ServiceStatus | None


@router.get("/services-status", response_model=ServicesStatusResponse)
async def services_status() -> ServicesStatusResponse:
    try:
        return ServicesStatusResponse(
            database=ServiceStatus(status=Status.OK, messages=[]),
            optimizer=ServiceStatus(status=Status.OK, messages=[]),
        )
    except Exception as e:
        logger.exception("Services status check failed")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/battery-ids", response_model=list[str])
async def get_battery_ids(battery_systems: BatterySystemsDep) -> list[str]:
    try:
        return [s.id for s in battery_systems]
    except Exception as e:
        logger.exception("Failed to get battery ids")
        raise HTTPException(status_code=500, detail=str(e)) from e


# ------------------------ #
#  Metrics page endpoints  #
# ------------------------ #


class EnergyQueryDef(BaseModel):
    query: str
    label: str
    color: str
    negate: bool = False


class EnergyViewConfig(BaseModel):
    """Configuration for a single energy chart view."""

    id: str
    name: str
    queries: list[EnergyQueryDef]


class EnergyQueriesResponse(BaseModel):
    """Response containing all energy chart view configurations."""

    views: list[EnergyViewConfig]


@router.get("/charts/energy-queries", response_model=EnergyQueriesResponse)
async def get_energy_queries(battery_systems: BatterySystemsDep) -> EnergyQueriesResponse:
    try:
        views: list[EnergyViewConfig] = []

        # Collect grid queries across all battery systems
        grid_import_parts: list[str] = []
        grid_export_parts: list[str] = []
        consumption_parts: list[str] = []

        for battery_system in battery_systems:
            device = battery_system.device_serial
            bs_name = battery_system.name or battery_system.id
            queries = battery_system.get_energy_queries()

            # Battery system view: shows charge/discharge from battery's perspective
            views.append(
                EnergyViewConfig(
                    id=battery_system.id,
                    name=bs_name,
                    queries=[
                        EnergyQueryDef(
                            query=queries.energy_to_charger,
                            label="Charge",
                            color="#3498db",
                            negate=True,
                        ),
                        EnergyQueryDef(
                            query=queries.energy_from_inverter,
                            label="Discharge",
                            color="#f39c12",
                        ),
                        EnergyQueryDef(
                            query=queries.energy_loss_to_battery,
                            label="Charge Losses",
                            color="#e74c3c",
                            negate=True,
                        ),
                        EnergyQueryDef(
                            query=queries.energy_loss_from_battery,
                            label="Discharge Losses",
                            color="#c0392b",
                            negate=True,
                        ),
                    ],
                )
            )

            # Collect grid queries per device
            grid_import_parts.append(
                f'increase(openess_energy_kwh{{from="grid", to="system", device="{device}"}}[$step])'
            )
            grid_export_parts.append(
                f'increase(openess_energy_kwh{{from="system", to="grid", device="{device}"}}[$step])'
            )

            # Consumption = AC out from inverter
            consumption_parts.append(
                f'increase(openess_energy_kwh{{from="system", to="ac_out", device="{device}"}}[$step])'
            )

        # Grid view: shows grid import/export
        grid_import_query = " + ".join(f"({q})" for q in grid_import_parts) if grid_import_parts else ""
        grid_export_query = " + ".join(f"({q})" for q in grid_export_parts) if grid_export_parts else ""

        grid_queries: list[EnergyQueryDef] = []
        if grid_import_query:
            grid_queries.append(EnergyQueryDef(query=grid_import_query, label="Import", color="#e74c3c", negate=True))
        if grid_export_query:
            grid_queries.append(EnergyQueryDef(query=grid_export_query, label="Export", color="#2ecc71"))
        # TODO: Add solar query when solar support is implemented

        views.append(EnergyViewConfig(id="grid", name="Grid", queries=grid_queries))

        # Consumption view: shows energy consumed (AC out)
        consumption_query = " + ".join(f"({q})" for q in consumption_parts) if consumption_parts else ""
        consumption_queries: list[EnergyQueryDef] = []
        if consumption_query:
            consumption_queries.append(EnergyQueryDef(query=consumption_query, label="Consumption", color="#9b59b6"))
        if grid_import_query:
            consumption_queries.append(EnergyQueryDef(query=grid_import_query, label="From Grid", color="#e74c3c"))
        # TODO: Add solar contribution

        views.append(EnergyViewConfig(id="consumption", name="Consumption", queries=consumption_queries))

        return EnergyQueriesResponse(views=views)
    except Exception as e:
        logger.exception("Failed to get energy queries")
        raise HTTPException(status_code=500, detail=str(e)) from e


class PowerQueryDef(BaseModel):
    label: str
    query: str
    is_total: bool | None = None


class ChartsPowerResponse(BaseModel):
    queries: list[PowerQueryDef]
    phases: list[str]


def _discover_phases(mql_client, query: str) -> list[str]:
    if mql_client is None:
        return []
    result = mql_client.query(query)
    phase_set: set[str] = set()
    if hasattr(result, "series"):
        for series in result.series:
            phase_label = series.metric.get("phase")
            if phase_label:
                phase_set.add(phase_label)
    return sorted(phase_set)


@router.get("/charts/power-queries", response_model=ChartsPowerResponse)
async def get_power_queries(
    mql_client: MqlClientDep,
    battery_systems: BatterySystemsDep,
) -> ChartsPowerResponse:
    queries: list[PowerQueryDef] = []

    # Discover grid phases
    phases = _discover_phases(mql_client, 'openess_power_watts{from="grid"}')

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
        bs_phases = _discover_phases(mql_client, f'openess_power_watts{{to="system", device="{device}"}}')
        bs_queries = bs.get_power_queries(bs_phases)
        for q in bs_queries.queries:
            queries.append(PowerQueryDef(query=q.query, label=q.label, is_total=q.is_total))

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


@router.get("/charts/price-queries", response_model=PriceQueriesResponse)
async def get_price_queries(
    price_config: PriceConfigDep,
    area: str | None = Query(default=None),
) -> PriceQueriesResponse:
    try:
        if not area:
            area = price_config.area
        # TODO: validate area value

        step: Literal["15m", "1h"] = "1h" if price_config.hourly_average else "15m"

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
async def get_battery_queries(
    battery_systems: BatterySystemsDep,
) -> dict[str, BatteryQueriesResponse]:
    try:
        result = {}
        for bs in battery_systems:
            queries = bs.get_battery_queries()
            result[bs.config.name] = BatteryQueriesResponse(
                soc_query=queries.soc_query,
                schedule_soc_query=queries.schedule_soc_query,
                voltage_query=queries.voltage_query,
            )
        return result
    except Exception as e:
        logger.exception("Failed to get battery queries")
        raise HTTPException(status_code=500, detail=str(e)) from e


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
    mql_client: MqlClientDep,
    battery_systems: BatterySystemsDep,
    battery_id: str | None = Query(default=None),
    start: datetime | None = Query(default=None),
    end: datetime | None = Query(default=None),
    aggregate_minutes: int = Query(default=10),
    idle_threshold: int = Query(default=5),
    limit: int = Query(default=2000),
) -> list[EfficiencyScatterPoint]:
    try:
        if mql_client is None:
            raise HTTPException(503, "Timeseries backend not configured")

        battery_system = None
        if battery_id:
            for bs in battery_systems:
                if bs.id == battery_id:
                    battery_system = bs
                    break
        elif len(battery_systems) == 1:
            battery_system = battery_systems[0]

        if battery_system is None:
            if battery_id:
                raise HTTPException(status_code=400, detail=f"No battery system with id '{battery_id}'")
            else:
                raise HTTPException(status_code=400, detail="Please provide a battery_id")

        now = datetime.now(UTC)
        if start is None:
            start = now - timedelta(days=7)
        if end is None:
            end = now

        return _get_efficiency_scatter(mql_client, battery_system, start, end, aggregate_minutes, idle_threshold, limit)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to get efficiency scatter data")
        raise HTTPException(status_code=500, detail=str(e)) from e


def _get_efficiency_scatter(
    mql_client: TimeseriesBackend,
    battery_system,
    start: datetime,
    end: datetime,
    aggregate_minutes: int,
    idle_threshold: int,
    limit: int,
) -> list[EfficiencyScatterPoint]:
    """Get efficiency scatter data from timeseries backend."""
    device = battery_system.device_serial
    step = f"{aggregate_minutes}m"

    # Query AC in, AC out, and battery DC power
    ac_in_query = f'sum(avg_over_time(openess_power_watts{{from="ac_in", to="system", device="{device}"}}[{step}]))'
    ac_out_query = f'sum(avg_over_time(openess_power_watts{{from="system", to="ac_out", device="{device}"}}[{step}]))'
    dc_query = f'avg_over_time(openess_power_watts{{from="system", to="battery", device="{device}"}}[{step}])'

    ac_in_result = mql_client.query_range(ac_in_query, start, end, step)
    ac_out_result = mql_client.query_range(ac_out_query, start, end, step)
    dc_result = mql_client.query_range(dc_query, start, end, step)

    # Convert to dicts
    def result_to_dict(result) -> dict[datetime, float]:
        if not result.series or not result.series[0].values:
            return {}
        return {ts: val for ts, val in result.series[0].values}

    ac_in_data = result_to_dict(ac_in_result)
    ac_out_data = result_to_dict(ac_out_result)
    dc_data = result_to_dict(dc_result)

    # Merge data by timestamp
    all_timestamps = set(ac_in_data.keys()) & set(dc_data.keys())
    if ac_out_data:
        all_timestamps &= set(ac_out_data.keys())

    points = []
    for ts in sorted(all_timestamps):
        ac_in = ac_in_data.get(ts, 0)
        ac_out = ac_out_data.get(ts, 0)
        ac = ac_in - ac_out  # Net AC power (positive = charging)
        dc = dc_data[ts]

        if abs(dc) < idle_threshold:
            category = "idling"
        elif dc > 0:
            category = "charging"
        else:
            category = "discharging"

        losses = abs(ac) - abs(dc)
        efficiency = None
        if category == "charging" and ac > 0:
            efficiency = (dc / ac) * 100
        elif category == "discharging" and dc < 0 and ac_out > 0:
            efficiency = (ac_out / abs(dc)) * 100

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

        if len(points) >= limit:
            break

    return points


class BatteryCycle(BaseModel):
    start_time: datetime
    end_time: datetime
    duration_hours: float
    min_soc: float
    ac_energy_in: float | None
    ac_energy_out: float | None
    dc_energy_in: float | None
    dc_energy_out: float | None
    system_efficiency: float | None
    battery_efficiency: float | None
    charger_efficiency: float | None
    inverter_efficiency: float | None
    profit: float | None
    scheduled_profit: float | None


@router.get("/cycles", response_model=list[BatteryCycle])
async def get_battery_cycles(
    mql_client: MqlClientDep,
    battery_systems: BatterySystemsDep,
    price_config: PriceConfigDep,
    battery_id: str | None = Query(default=None),
    start: datetime | None = Query(default=None),
    end: datetime | None = Query(default=None),
    min_soc_swing: int = Query(default=10),
) -> list[BatteryCycle]:
    try:
        if mql_client is None:
            raise HTTPException(503, "Timeseries backend not configured")

        battery_system = None
        if battery_id:
            for bs in battery_systems:
                if bs.id == battery_id:
                    battery_system = bs
                    break
        elif len(battery_systems) == 1:
            battery_system = battery_systems[0]

        if battery_system is None:
            if battery_id:
                raise HTTPException(status_code=400, detail=f"No battery system with id '{battery_id}'")
            else:
                raise HTTPException(status_code=400, detail="Please provide a battery_id")

        now = datetime.now(UTC)
        if start is None:
            start = now - timedelta(days=30)
        if end is None:
            end = now

        return _get_battery_cycles(mql_client, battery_system, price_config, start, end, min_soc_swing)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to get battery cycles")
        raise HTTPException(status_code=500, detail=str(e)) from e


def _get_battery_cycles(
    mql_client: TimeseriesBackend,
    battery_system,
    price_config,
    start: datetime,
    end: datetime,
    min_soc_swing: int,
) -> list[BatteryCycle]:
    """Get battery cycles from timeseries backend."""
    from .util import find_full_battery_cycles

    device = battery_system.device_serial

    # Get SOC data at 1-minute resolution for cycle detection
    soc_query = f'openess_soc_ratio{{device="{device}", node="battery"}} * 100'
    soc_result = mql_client.query_range(soc_query, start, end, step="1m")

    if not soc_result.series or not soc_result.series[0].values:
        return []

    battery_soc = [(ts, val) for ts, val in soc_result.series[0].values]

    # Find cycles using the existing algorithm
    raw_cycles = find_full_battery_cycles(battery_soc, full_threshold=90, min_soc_swing=min_soc_swing)

    cycles = []
    for cycle_start, cycle_end, min_soc in raw_cycles:
        duration = (cycle_end - cycle_start).total_seconds() / 3600.0

        # Query energy for this cycle
        # AC energy in (charger input)
        ac_in_query = f'increase(openess_energy_kwh{{from="ac_in", to="system", device="{device}"}}[1h])'
        ac_in_result = mql_client.query_range(ac_in_query, cycle_start, cycle_end, step="1h")
        ac_energy_in = _sum_series_values(ac_in_result)

        # AC energy out (inverter output)
        ac_out_query = f'increase(openess_energy_kwh{{from="system", to="ac_out", device="{device}"}}[1h])'
        ac_out_result = mql_client.query_range(ac_out_query, cycle_start, cycle_end, step="1h")
        ac_energy_out = _sum_series_values(ac_out_result)

        # DC energy in (battery charge)
        dc_in_query = f'increase(openess_energy_kwh{{from="system", to="battery", device="{device}"}}[1h])'
        dc_in_result = mql_client.query_range(dc_in_query, cycle_start, cycle_end, step="1h")
        dc_energy_in = _sum_series_values(dc_in_result)

        # DC energy out (battery discharge)
        dc_out_query = f'increase(openess_energy_kwh{{from="battery", to="system", device="{device}"}}[1h])'
        dc_out_result = mql_client.query_range(dc_out_query, cycle_start, cycle_end, step="1h")
        dc_energy_out = _sum_series_values(dc_out_result)

        # Calculate efficiencies
        system_eff = None
        if ac_energy_in and ac_energy_in > 0:
            system_eff = round((ac_energy_out or 0) / ac_energy_in * 100, 1)

        battery_eff = None
        if dc_energy_in and dc_energy_in > 0:
            battery_eff = round((dc_energy_out or 0) / dc_energy_in * 100, 1)

        charger_eff = None
        if ac_energy_in and ac_energy_in > 0:
            charger_eff = round((dc_energy_in or 0) / ac_energy_in * 100, 1)

        inverter_eff = None
        if dc_energy_out and dc_energy_out > 0:
            inverter_eff = round((ac_energy_out or 0) / dc_energy_out * 100, 1)

        # Calculate profit using hourly prices
        profit = _calculate_cycle_profit(mql_client, price_config, device, cycle_start, cycle_end)

        cycles.append(
            BatteryCycle(
                start_time=cycle_start,
                end_time=cycle_end,
                duration_hours=round(duration, 2),
                min_soc=round(min_soc, 1),
                ac_energy_in=round(ac_energy_in, 3) if ac_energy_in else None,
                ac_energy_out=round(ac_energy_out, 3) if ac_energy_out else None,
                dc_energy_in=round(dc_energy_in, 3) if dc_energy_in else None,
                dc_energy_out=round(dc_energy_out, 3) if dc_energy_out else None,
                system_efficiency=system_eff,
                battery_efficiency=battery_eff,
                charger_efficiency=charger_eff,
                inverter_efficiency=inverter_eff,
                profit=profit,
                scheduled_profit=None,  # TODO: implement scheduled profit
            )
        )

    return cycles


def _sum_series_values(result) -> float | None:
    """Sum all values in a range query result."""
    if not result.series or not result.series[0].values:
        return None
    total = sum(val for _, val in result.series[0].values)
    return total if total > 0 else None


def _calculate_cycle_profit(
    mql_client: TimeseriesBackend,
    price_config,
    device: str,
    cycle_start: datetime,
    cycle_end: datetime,
) -> float | None:
    """Calculate profit for a battery cycle based on hourly prices."""
    area = price_config.area

    # Get hourly prices
    price_query = f'avg_over_time(openess_prices{{area="{area}", price="market"}}[1h])'
    price_result = mql_client.query_range(price_query, cycle_start, cycle_end, step="1h")

    if not price_result.series or not price_result.series[0].values:
        return None

    # Get hourly energy in/out
    ac_in_query = f'increase(openess_energy_kwh{{from="ac_in", to="system", device="{device}"}}[1h])'
    ac_out_query = f'increase(openess_energy_kwh{{from="system", to="ac_out", device="{device}"}}[1h])'

    ac_in_result = mql_client.query_range(ac_in_query, cycle_start, cycle_end, step="1h")
    ac_out_result = mql_client.query_range(ac_out_query, cycle_start, cycle_end, step="1h")

    # Build timestamp -> value dicts
    prices = {ts: val for ts, val in price_result.series[0].values}
    energy_in = {}
    energy_out = {}

    if ac_in_result.series and ac_in_result.series[0].values:
        energy_in = {ts: val for ts, val in ac_in_result.series[0].values}
    if ac_out_result.series and ac_out_result.series[0].values:
        energy_out = {ts: val for ts, val in ac_out_result.series[0].values}

    profit = 0.0
    for ts, market_price in prices.items():
        e_in = energy_in.get(ts, 0)
        e_out = energy_out.get(ts, 0)

        buy_price = price_config.buy_price(market_price)
        sell_price = price_config.sell_price(market_price)

        profit -= buy_price * e_in
        profit += sell_price * e_out

    return round(profit, 2) if profit != 0 else None
