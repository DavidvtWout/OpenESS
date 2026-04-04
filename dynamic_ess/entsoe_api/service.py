import logging
from pathlib import Path

from dynamic_ess.db import Database
from dynamic_ess.service import Service
from .client import EntsoeClient
from .config import EntsoeConfig

logger = logging.getLogger(__name__)


class EntsoeService(Service):
    """Fetches day-ahead prices from ENTSO-E at regular intervals."""

    def __init__(self, config: EntsoeConfig, db_path: Path, check_interval_hours: float = 1.0):
        super().__init__("EntsoeService")
        self.config = config
        self.db_path = db_path
        self.check_interval = check_interval_hours * 3600
        self.client: EntsoeClient | None = None

    def on_start(self):
        db = Database(self.db_path, run_migrations=False)
        self.client = EntsoeClient(self.config, db)
        self._fetch_prices()

    def tick(self):
        self._fetch_prices()

    def _fetch_prices(self):
        try:
            self.client.fetch_missing_prices()
        except Exception as e:
            logger.error(f"Failed to fetch ENTSO-E prices: {e}")

    def wait_until_next(self):
        self.wait_seconds(self.check_interval)
