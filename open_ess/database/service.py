import logging
from datetime import datetime, timezone, timedelta

from open_ess.service import Service
from .config import DatabaseConfig
from .database import Database

logger = logging.getLogger(__name__)


class DatabaseService(Service):
    """Periodically compresses time series data to reduce storage."""

    def __init__(self, config: DatabaseConfig):
        super().__init__("DatabaseService")
        self._config = config
        self._database: Database | None = None

    def on_start(self):
        self._database = Database(self._config, run_migrations=False)
        logger.info("DatabaseService started")

    def tick(self):
        self._run_compression()

    def _run_compression(self):
        n_samples, n_buckets = self._database.compress_power(datetime.now(timezone.utc), 60)
        if n_samples > 0:
            logger.debug(f"Compressed {n_samples}/{n_buckets} power samples/buckets to 1-minute resolution")
            self._database.conn.execute("PRAGMA incremental_vacuum")

    def wait_until_next(self):
        now = datetime.now(timezone.utc)
        next_run = now.replace(second=0, microsecond=0) + timedelta(minutes=1, seconds=10)
        # ^ Run next compression 10 seconds after a new minute starts. This ensures that all new metrics
        #   have been written to the database.

        self.wait_seconds((next_run - now).total_seconds())
