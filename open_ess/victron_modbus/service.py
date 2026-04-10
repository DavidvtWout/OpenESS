import logging
import time

from open_ess.database import Database, DatabaseConfig
from open_ess.metrics import BatteryConfig
from open_ess.service import Service
from .client import VictronClient
from .config import VictronConfig

logger = logging.getLogger(__name__)


class VictronService(Service):
    """Collects measurements from Victron GX every second."""

    def __init__(self, config: VictronConfig, db_config: DatabaseConfig, battery_configs: list[BatteryConfig]):
        super().__init__("VictronService")
        self._config = config
        self._db_config = db_config
        self._battery_configs = battery_configs
        self._client: VictronClient | None = None

    def on_start(self):
        db = Database(self._db_config, run_migrations=False)
        self._client = VictronClient(self._config, self._battery_configs, db)
        if not self._client.initialize():
            raise RuntimeError(f"Could not connect to Victron GX at {self._client.address}")
        logger.info(f"Connected to Victron GX at {self._client.address}")

    def tick(self):
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
