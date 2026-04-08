import logging
from datetime import datetime, timezone, timedelta
from pathlib import Path

from dynamic_ess.service import Service
from .database import Database

logger = logging.getLogger(__name__)


class DatabaseService(Service):
    """Periodically compresses time series data to reduce storage."""

    def __init__(self, db_path: Path):
        super().__init__("DatabaseService")
        self.db_path = db_path
        self.db: Database | None = None

    def on_start(self):
        self.db = Database(self.db_path, run_migrations=False)
        logger.info("DatabaseService started")

    def tick(self):
        self._run_compression()

    def _run_compression(self):
        # Compress recent data to 1-minute resolution
        logger.info("Running compression")
        n_samples, n_buckets = self.db.compress_power(datetime.now(timezone.utc), 60_000)
        logger.info("Compression done")
        if n_samples > 0:
            logger.info(f"Compressed {n_samples} / {n_buckets} power samples / buckets to 1-minute resolution")
            self.db.conn.execute("PRAGMA incremental_vacuum")

    def wait_until_next(self):
        now = datetime.now(timezone.utc)
        next_run = now.replace(second=0, microsecond=0) + timedelta(minutes=1, seconds=10)
        # ^ Run next compression 10 seconds after a new minute starts. This ensures that all new metrics
        #   have been written to the database.

        self.wait_seconds((next_run - now).total_seconds())
