from pathlib import Path

import yaml
from pydantic import BaseModel

from open_ess.database import DatabaseConfig
from open_ess.metrics import BatteryConfig
from open_ess.pricing import PriceConfig
from open_ess.victron_modbus import VictronConfig
from open_ess.frontend import FrontendConfig

# TODO: Validate config. If a battery defines victron control, require victron_gx config.


class Config(BaseModel):
    database: DatabaseConfig
    frontend: FrontendConfig
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
