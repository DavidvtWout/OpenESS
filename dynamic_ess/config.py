from pathlib import Path

import yaml
from pydantic import BaseModel

from dynamic_ess.entsoe_api import EntsoeConfig
from dynamic_ess.victron_modbus import VictronConfig
from dynamic_ess.optimizer import BatteryConfig

class Config(BaseModel):
    db_path: Path

    entsoe: EntsoeConfig
    victron_gx: VictronConfig
    battery: BatteryConfig

    @classmethod
    def from_file(cls, path: Path) -> "Config":
        with open(path) as f:
            data = yaml.safe_load(f)
        return cls.model_validate(data)
