import logging
from datetime import datetime, timedelta, timezone

from open_ess.database import Database, DatabaseConnection
from open_ess.metrics import BatteryConfig
from open_ess.pricing import PriceConfig
from open_ess.service import Service
from open_ess.victron_modbus import VictronService
from .optimizer import Optimizer

logger = logging.getLogger(__name__)


class OptimizerService(Service):
    """Runs the charge optimizer at the start of each hour."""

    def __init__(
        self,
        db: Database,
        victron_service: VictronService,
        price_config: PriceConfig,
        battery_configs: list[BatteryConfig],
    ):
        super().__init__("SchedulerService")
        self._db = db
        self._victron_service = victron_service
        self._price_config = price_config
        self._battery_configs = battery_configs
        self._optimizers: list[Optimizer] | None = None
        self._db_conn: DatabaseConnection | None = None

    def on_start(self):
        self._db_conn = self._db.connect()
        self._optimizers = [
            Optimizer(self._db_conn, price_config=self._price_config, battery_config=cfg)
            for cfg in self._battery_configs
        ]

    def tick(self):
        logger.debug("Running charge optimizer(s)")

        for optimizer in self._optimizers:
            schedule = optimizer.optimize()
            batt_cfg = optimizer.battery_config

            if schedule:
                _, _, power, _ = schedule[0]
                self._victron_service.client.set_ess_setpoint(power)
                # TODO: support multiple schedules
                self._db_conn.set_schedule("victron/vebus/228", schedule)
                logger.debug(f"Updated schedule with {len(schedule)} entries")
            else:
                logger.warning("Optimizer returned empty schedule")

    def wait_until_next(self):
        """Wait until the start of the next price bracket."""
        now = datetime.now(timezone.utc)
        next_run = now.replace(
            minute=(now.minute // self._price_config.aggregate_minutes) * self._price_config.aggregate_minutes,
            second=0,
            microsecond=0,
        ) + timedelta(minutes=self._price_config.aggregate_minutes)
        self.wait_seconds((next_run - now).total_seconds())
