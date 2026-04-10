from pathlib import Path

import yaml
from pydantic import BaseModel

from dynamic_ess.database import DatabaseConfig
from dynamic_ess.metrics import BatteryConfig
from dynamic_ess.pricing import PriceConfig
from dynamic_ess.victron_modbus import VictronConfig

# TODO: Validate config. If a battery defines victron control, require victron_gx config.


class Config(BaseModel):
    database: DatabaseConfig
    prices: PriceConfig
    victron_gx: VictronConfig
    battery: BatteryConfig | list[BatteryConfig]

    @property
    def batteries(self) -> list[BatteryConfig]:
        if isinstance(self.battery, list):
            return self.battery
        return [self.battery]

    @classmethod
    def from_file(cls, path: Path) -> "Config":
        with open(path) as f:
            data = yaml.safe_load(f)
        return cls.model_validate(data)
