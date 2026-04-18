import logging

from open_ess.database import Database, DatabaseConnection
from open_ess.service import Service
from .client import EntsoeClient
from .config import PriceConfig

logger = logging.getLogger(__name__)


class EntsoeService(Service):
    """Fetches day-ahead prices from ENTSO-E at regular intervals."""

    def __init__(self, db: Database, config: PriceConfig):
        super().__init__("EntsoeService")
        self._db = db
        self._config = config
        self._check_interval = 3600
        self._client: EntsoeClient | None = None
        self._db_conn: DatabaseConnection | None = None

    def on_start(self):
        self._db_conn = self._db.connect()
        self._client = EntsoeClient(self._config, self._db_conn)
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
