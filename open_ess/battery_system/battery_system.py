import logging
from abc import ABC, abstractmethod
from datetime import datetime, timedelta, timezone

from open_ess.victron_modbus import VictronClient

from .config import BatterySystemConfig

logger = logging.getLogger(__name__)


class BatterySystem(ABC):
    def __init__(self, config: BatterySystemConfig):
        self._config = config

    @property
    def config(self) -> BatterySystemConfig:
        return self._config

    @property
    def name(self) -> str:
        return self._config.name

    @property
    @abstractmethod
    def id(self) -> str | None: ...

    @abstractmethod
    def set_ess_setpoint(self, power: float, until: datetime | None = None): ...


class VictronBatterySystem(BatterySystem):
    def __init__(self, config: BatterySystemConfig, control: VictronClient):
        BatterySystem.__init__(self, config)

        self._victron_client: VictronClient = control

    @property
    def id(self) -> str | None:
        if self._victron_client.serial is None:
            return None
        return f"victron/{self._victron_client.serial}"

    def set_ess_setpoint(self, power: float, until: datetime | None = None):
        if until is None:
            until = datetime.now(tz=timezone.utc) + timedelta(hours=1)
        logger.info(f"{self.name}: Set setpoint to {power} W")
        self._victron_client.set_ess_setpoint(power, until)
