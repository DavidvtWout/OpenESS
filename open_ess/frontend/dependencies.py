from typing import Annotated

from fastapi import Depends, Request

from open_ess.battery_system import BatterySystem
from open_ess.pricing import PriceConfig
from open_ess.timeseries import TimeseriesBackend


def get_price_config(request: Request) -> PriceConfig:
    return request.app.state.price_config  # type: ignore[no-any-return]


def get_battery_systems(request: Request) -> list[BatterySystem]:
    return request.app.state.battery_systems  # type: ignore[no-any-return]


def get_mql_client(request: Request) -> TimeseriesBackend:
    return request.app.state.mql_client  # type: ignore[no-any-return]


# Type aliases for cleaner route signatures
PriceConfigDep = Annotated[PriceConfig, Depends(get_price_config)]
BatterySystemsDep = Annotated[list[BatterySystem], Depends(get_battery_systems)]
MqlClientDep = Annotated[TimeseriesBackend, Depends(get_mql_client)]
