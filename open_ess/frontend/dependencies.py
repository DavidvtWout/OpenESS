from typing import Annotated

from fastapi import Depends, Request

from open_ess.battery_system import BatterySystem
from open_ess.database import DatabaseConnection
from open_ess.pricing import PriceConfig


def get_database(request: Request) -> DatabaseConnection:
    return request.app.state.database  # type: ignore[no-any-return]


def get_price_config(request: Request) -> PriceConfig:
    return request.app.state.price_config  # type: ignore[no-any-return]


def get_battery_systems(request: Request) -> list[BatterySystem]:
    return request.app.state.battery_systems  # type: ignore[no-any-return]


# Type aliases for cleaner route signatures
Database = Annotated[DatabaseConnection, Depends(get_database)]
PriceConfigDep = Annotated[PriceConfig, Depends(get_price_config)]
BatterySystemsDep = Annotated[list[BatterySystem], Depends(get_battery_systems)]
