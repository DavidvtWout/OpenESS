from pathlib import Path

import yaml
from pydantic import BaseModel

from open_ess.battery_system import BatterySystemConfig
from open_ess.frontend import FrontendConfig
from open_ess.pricing import PriceConfig
from open_ess.timeseries import TimeseriesConfig
from open_ess.timeseries.metricsqlite.config import MetricSQLiteConfig

# TODO: Validate config. If a battery defines mqtt control, require mqtt config.


class Config(BaseModel):
    frontend: FrontendConfig
    prices: PriceConfig
    timeseries: TimeseriesConfig = MetricSQLiteConfig()
    battery_system: BatterySystemConfig | list[BatterySystemConfig]

    @property
    def battery_systems(self) -> list[BatterySystemConfig]:
        if isinstance(self.battery_system, list):
            return self.battery_system
        return [self.battery_system]

    @classmethod
    def from_file(cls, path: Path) -> "Config":
        with open(path) as f:
            data = yaml.safe_load(f)
        return cls.model_validate(data)
