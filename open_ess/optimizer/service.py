import logging
from datetime import datetime, timedelta, timezone

from open_ess.battery_system import BatterySystem
from open_ess.database import Database, DatabaseConnection
from open_ess.pricing import PriceConfig
from open_ess.service import Service
from .optimizer import Optimizer

logger = logging.getLogger(__name__)


class OptimizerService(Service):
    def __init__(
        self,
        db: Database,
        battery_system: BatterySystem,
        price_config: PriceConfig,
    ):
        super().__init__("OptimizerService")
        self._db = db
        self._battery_system = battery_system
        self._price_config = price_config

        self._db_conn: DatabaseConnection | None = None
        self._optimizer: Optimizer | None = None

    def on_start(self):
        self._db_conn = self._db.connect()
        self._optimizer = Optimizer(
            self._db_conn, price_config=self._price_config, battery_config=self._battery_system.config
        )

    def tick(self):
        logger.debug("Running charge optimizer(s)")
        schedule = self._optimizer.optimize()
        if schedule:
            _, _, power, _ = schedule[0]
            self._battery_system.set_ess_setpoint(power)
            self._db_conn.set_schedule(self._battery_system.id, schedule)
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
