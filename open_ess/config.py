from pathlib import Path

import yaml
from pydantic import BaseModel

from open_ess.database import DatabaseConfig
from open_ess.frontend import FrontendConfig
from open_ess.battery_system import BatteryConfig
from open_ess.pricing import PriceConfig

# TODO: Validate config. If a battery defines mqtt control, require mqtt config.


class Config(BaseModel):
    database: DatabaseConfig
    frontend: FrontendConfig
    prices: PriceConfig
    battery_system: BatteryConfig | list[BatteryConfig]

    @property
    def battery_systems(self) -> list[BatteryConfig]:
        if isinstance(self.battery_system, list):
            return self.battery_system
        return [self.battery_system]

    @classmethod
    def from_file(cls, path: Path) -> "Config":
        with open(path) as f:
            data = yaml.safe_load(f)
        return cls.model_validate(data)
