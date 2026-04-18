from typing import TYPE_CHECKING

from open_ess.battery_system import BatteryConfig, BatterySystem
from open_ess.database import Database, DatabaseConnection
from open_ess.pricing import PriceConfig

if TYPE_CHECKING:
    from open_ess.config import Config

_config: "Config | None" = None
_database: DatabaseConnection | None = None
_battery_systems: list[BatterySystem] | None = None


def init_dependencies(db: Database, config: "Config", battery_systems: list[BatterySystem]) -> None:
    global _config, _database, _battery_systems
    _config = config
    _database = db.connect()
    _battery_systems = battery_systems


def get_database() -> DatabaseConnection:
    if _database is None:
        raise RuntimeError("Database not initialized. Call init_dependencies() first.")
    return _database


def get_price_config() -> PriceConfig:
    if _config is None:
        raise RuntimeError("Price config not initialized. Call init_dependencies() first.")
    return _config.prices


def get_battery_configs() -> dict[str, BatteryConfig]:
    if _config is None:
        raise RuntimeError("Battery configs not initialized. Call init_dependencies() first.")
    return {battery_config.id: battery_config for battery_config in _config.battery_systems}


def get_battery_systems() -> list[BatterySystem]:
    if _battery_systems is None:
        raise RuntimeError("Battery_systems not initialized. Call init_dependencies() first.")
    return _battery_systems


def close_dependencies() -> None:
    global _config, _database, _battery_systems
    _config = None
    _battery_systems = None
    if _database is not None:
        _database.close()
        _database = None
