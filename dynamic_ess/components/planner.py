import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path

from dynamic_ess.components.base import Component
from dynamic_ess.db import Database
from dynamic_ess.scheduler import Optimizer

logger = logging.getLogger(__name__)


class ChargePlanner(Component):
    """Runs the charge optimizer before each hour."""

    def __init__(self, db_path: Path, area: str = "NL", run_at_minute: int = 55):
        super().__init__("ChargePlanner")
        self.db_path = db_path
        self.area = area
        self.run_at_minute = run_at_minute
        self.db: Database | None = None
        self.optimizer: Optimizer | None = None

    def on_start(self):
        # Create connection in this thread
        self.db = Database(self.db_path, run_migrations=False)
        self.optimizer = Optimizer(self.db, area=self.area)

    def tick(self):
        # Prune old schedule entries
        now = datetime.now(timezone.utc)
        self.db.prune_old_schedule(now - timedelta(hours=1))

        # Run optimizer
        logger.info("Running charge optimizer")
        schedule = self.optimizer.optimize()

        if schedule:
            self.db.set_schedule(schedule)
            logger.info(f"Updated schedule with {len(schedule)} entries")
        else:
            logger.warning("Optimizer returned empty schedule")

    def wait_until_next(self):
        """Wait until run_at_minute of the next hour."""
        now = datetime.now(timezone.utc)

        # Calculate next run time
        next_run = now.replace(minute=self.run_at_minute, second=0, microsecond=0)
        if now.minute >= self.run_at_minute:
            next_run += timedelta(hours=1)

        wait_seconds = (next_run - now).total_seconds()
        logger.debug(f"Next optimizer run at {next_run} (in {wait_seconds:.0f}s)")

        self.wait_seconds(wait_seconds)
