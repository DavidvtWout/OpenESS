import logging

from dynamic_ess.database import Database, DatabaseConfig
from dynamic_ess.service import Service
from .client import EntsoeClient
from .config import PriceConfig

logger = logging.getLogger(__name__)


class EntsoeService(Service):
    """Fetches day-ahead prices from ENTSO-E at regular intervals."""

    def __init__(self, config: PriceConfig, db_config: DatabaseConfig, check_interval_hours: float = 1.0):
        super().__init__("EntsoeService")
        self._config = config
        self._db_config = db_config
        self._check_interval = check_interval_hours * 3600
        self._client: EntsoeClient | None = None

    def on_start(self):
        db = Database(self._db_config, run_migrations=False)
        self._client = EntsoeClient(self._config, db)
        self._fetch_prices()

    def tick(self):
        self._fetch_prices()

    def _fetch_prices(self):
        try:
            self._client.fetch_missing_prices()
        except Exception as e:
            logger.error(f"Failed to fetch ENTSO-E prices: {e}")

    def wait_until_next(self):
        # TODO: run from 14:00
        self.wait_seconds(self._check_interval)
