import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path

from dynamic_ess.db import Database
from dynamic_ess.pricing import PriceConfig
from dynamic_ess.service import Service
from dynamic_ess.victron_modbus import VictronService
from .optimizer import BatteryConfig, Optimizer

logger = logging.getLogger(__name__)


class OptimizerService(Service):
    """Runs the charge optimizer at the start of each hour."""

    def __init__(
        self,
        db_path: Path,
        victron_service: VictronService,
        price_config: PriceConfig,
        battery_config: BatteryConfig,
    ):
        super().__init__("SchedulerService")
        self.db_path = db_path
        self.victron_service = victron_service
        self.price_config = price_config
        self.battery_config = battery_config
        self.db: Database | None = None
        self.optimizer: Optimizer | None = None

    def on_start(self):
        self.db = Database(self.db_path, run_migrations=False)
        self.optimizer = Optimizer(self.db, price_config=self.price_config, battery_config=self.battery_config)

    def tick(self):
        now = datetime.now(timezone.utc)
        self.db.prune_old_schedule(now - timedelta(hours=1))

        logger.debug("Running charge optimizer")
        schedule = self.optimizer.optimize()

        if schedule:
            _, _, power, _ = schedule[0]
            self.victron_service.client.set_ess_setpoint(power)
            self.db.set_schedule(schedule)
            logger.debug(f"Updated schedule with {len(schedule)} entries")
        else:
            logger.warning("Optimizer returned empty schedule")

    def wait_until_next(self):
        now = datetime.now(timezone.utc)
        next_run = now.replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)

        wait_seconds = (next_run - now).total_seconds()
        logger.debug(f"Next optimizer run at {next_run} (in {wait_seconds:.0f}s)")

        self.wait_seconds(wait_seconds)
