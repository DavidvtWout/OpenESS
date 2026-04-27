import logging
import time
from typing import TYPE_CHECKING

from open_ess.database import Database
from open_ess.service import Service

from .client import VictronClient

if TYPE_CHECKING:
    from open_ess.battery_system import BatterySystemConfig

logger = logging.getLogger(__name__)


class VictronService(Service):
    """Collects measurements from Victron GX every second."""

    def __init__(self, db: Database, config: "BatterySystemConfig"):
        super().__init__("VictronService")
        self._config = config
        self._client = VictronClient(db, config)

    @property
    def client(self) -> VictronClient:
        return self._client

    def on_start(self):
        if not self._client.initialize():
            raise RuntimeError(f"Could not connect to Victron GX at {self._client.address}")
        logger.info(f"Connected to Victron GX at {self._client.address}")

    def tick(self):
        self._client.write_setpoints()
        self._client.collect_and_store_measurements()

    def wait_until_next(self):
        # Sleep until the start of the next second
        now = time.time()
        sleep_duration = 1.0 - (now % 1.0)
        self._stop_event.wait(timeout=sleep_duration)

    def stop(self):
        super().stop()
        if self._client:
            self._client.close()
