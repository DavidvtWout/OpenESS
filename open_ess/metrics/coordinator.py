from typing import TYPE_CHECKING

from .battery_config import BatteryConfig

if TYPE_CHECKING:
    from open_ess.config import Config


class MetricsCoordinator:
    def __init__(self, config: "Config"):
        self._config = config

    @property
    def battery_configs(self) -> list[BatteryConfig]:
        return self._config.batteries
