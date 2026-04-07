import logging
import time
from pathlib import Path

from dynamic_ess.db import Database
from dynamic_ess.service import Service
from .client import VictronClient
from .config import VictronConfig

logger = logging.getLogger(__name__)


class VictronService(Service):
    """Collects measurements from Victron GX every second."""

    def __init__(self, config: VictronConfig, db_path: Path):
        super().__init__("VictronService")
        self.config = config
        self.db_path = db_path
        self.client: VictronClient | None = None

    def on_start(self):
        db = Database(self.db_path, run_migrations=False)
        self.client = VictronClient(self.config, db)
        if not self.client.initialize():
            raise RuntimeError(f"Could not connect to Victron GX at {self.client.address}")
        logger.info(f"Connected to Victron GX at {self.client.address}")

    def tick(self):
        self.client.collect_and_store_measurements()

    def wait_until_next(self):
        # Sleep until the start of the next second
        now = time.time()
        sleep_duration = 1.0 - (now % 1.0)
        self._stop_event.wait(timeout=sleep_duration)

    def stop(self):
        super().stop()
        if self.client:
            self.client.close()
