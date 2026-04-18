import logging
import time

from open_ess.database import Database, DatabaseConnection
from open_ess.metrics import BatteryConfig
from open_ess.service import Service
from .client import VictronClient
from .config import VictronConfig

logger = logging.getLogger(__name__)


class VictronService(Service):
    """Collects measurements from Victron GX every second."""

    def __init__(self, db: Database, config: VictronConfig, battery_configs: list[BatteryConfig]):
        super().__init__("VictronService")
        self._db = db
        self._config = config
        self._battery_configs = battery_configs
        self._client: VictronClient | None = None
        self._db_conn: DatabaseConnection | None = None

    @property
    def client(self) -> VictronClient:
        return self._client

    def on_start(self):
        self._db_conn = self._db.connect()
        self._client = VictronClient(self._config, self._battery_configs, self._db_conn)
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
