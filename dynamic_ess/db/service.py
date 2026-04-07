import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path

from dynamic_ess.service import Service
from .database import Database

logger = logging.getLogger(__name__)

# Bucket sizes in milliseconds
ONE_MINUTE_MS = 60_000
FIVE_MINUTES_MS = 300_000


class DatabaseService(Service):
    """Periodically compresses time series data to reduce storage.

    Compression rules:
    - Data older than 2 minutes: compressed to 1-minute resolution
    - Data older than 1 week: compressed to 5-minute resolution
    """

    def __init__(self, db_path: Path, run_interval_minutes=10):
        super().__init__("DatabaseService")
        self.db_path = db_path
        self.run_interval = run_interval_minutes * 60
        self.db: Database | None = None

    def on_start(self):
        self.db = Database(self.db_path, run_migrations=False)
        logger.info("DatabaseService started, running initial compression")

    def tick(self):
        self._run_compression()

    def _run_compression(self):
        now = datetime.now(timezone.utc)
        total_removed = 0

        # Compress recent data to 1-minute resolution
        removed = self.db.compress_power_flows(now - timedelta(minutes=2), ONE_MINUTE_MS)
        if removed > 0:
            logger.info(f"Compressed {removed} power_flows samples to 1-minute resolution")
            total_removed += removed

        # Compress data older than 1 week to 5-minute resolution
        removed = self.db.compress_power_flows(now - timedelta(days=7), FIVE_MINUTES_MS)
        if removed > 0:
            logger.info(f"Compressed {removed} power_flows samples to 5-minute resolution")
            total_removed += removed

        # Reclaim disk space if any compression happened
        if total_removed > 0:
            self.db.conn.execute("PRAGMA incremental_vacuum")
            logger.debug("Ran incremental vacuum")
        else:
            logger.debug("No data to compress")

    def wait_until_next(self):
        self.wait_seconds(self.run_interval)
