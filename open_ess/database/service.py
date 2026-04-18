import logging
from datetime import datetime, timezone, timedelta

from open_ess.service import Service
from .database import Database, DatabaseConnection

logger = logging.getLogger(__name__)


class DatabaseService(Service):
    def __init__(self, database: Database):
        super().__init__("DatabaseService")
        self._database = database
        self._config = database.config
        self._db_conn: DatabaseConnection | None = None

    def on_start(self):
        self._db_conn = self._database.connect()
        logger.info("DatabaseService started")

    def tick(self):
        self._run_compression()

    def _run_compression(self):
        if self._config.compression.enable:
            n_samples, n_buckets = self._db_conn.compress_power(
                datetime.now(timezone.utc), self._config.compression.bucket_seconds
            )
            if n_samples > 0:
                self._db_conn.vacuum()

    def wait_until_next(self):
        now = datetime.now(timezone.utc)
        next_run = now.replace(second=0, microsecond=0) + timedelta(minutes=1, seconds=10)
        # ^ Run next compression 10 seconds after a new minute starts. This ensures that all new metrics
        #   have been written to the database.

        self.wait_seconds((next_run - now).total_seconds())
