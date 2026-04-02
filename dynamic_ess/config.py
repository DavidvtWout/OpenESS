from pathlib import Path

import yaml
from pydantic import BaseModel

from dynamic_ess.entsoe_api import EntsoeConfig
from dynamic_ess.victron_modbus import VictronConfig


class Config(BaseModel):
    db_path: Path = Path("dynamic_ess.db")
    poll_interval: int = 3600

    entsoe: EntsoeConfig
    victron_gx: VictronConfig

    @classmethod
    def from_file(cls, path: Path) -> "Config":
        with open(path) as f:
            data = yaml.safe_load(f)
        return cls.model_validate(data)
