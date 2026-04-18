import logging
from datetime import datetime, timedelta, timezone

from open_ess.victron_modbus import VictronClient
from .battery_config import BatteryConfig

logger = logging.getLogger(__name__)


class BatterySystem:
    def __init__(self, config: BatteryConfig, control: VictronClient):
        self._config = config
        self._control: VictronClient = control

    @property
    def id(self) -> str:
        return self._config.id

    @property
    def name(self) -> str:
        return self._config.name

    @property
    def config(self) -> BatteryConfig:
        return self._config

    def set_ess_setpoint(self, power: float, until: datetime | None = None):
        if until is None:
            until = datetime.now(tz=timezone.utc) + timedelta(hours=1)
        logger.info(f"{self.name}: Set setpoint to {power} W")
        self._control.set_ess_setpoint(power, until)
