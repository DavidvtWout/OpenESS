import logging
from datetime import UTC, datetime, timedelta

from open_ess.battery_system import BatterySystem
from open_ess.pricing import PriceConfig
from open_ess.service import Service
from open_ess.timeseries import Sample, TimeseriesBackend

from .optimizer import Optimizer

logger = logging.getLogger(__name__)


class OptimizerService(Service):
    def __init__(
        self,
        battery_system: BatterySystem,
        price_config: PriceConfig,
        mql_client: TimeseriesBackend,
    ):
        super().__init__("OptimizerService")
        self._battery_system = battery_system
        self._price_config = price_config
        self._mql_client = mql_client

        self._optimizer: Optimizer | None = None

    def on_start(self) -> None:
        self._optimizer = Optimizer(self._price_config, self._battery_system, self._mql_client)

    def tick(self) -> None:
        if self._optimizer is None:
            return

        logger.debug("Running charge optimizer(s)")
        schedule = self._optimizer.optimize()
        if schedule:
            _, _, power, _ = schedule[0]
            self._battery_system.set_ess_setpoint(power)
            self._upsert_schedule(schedule)
            logger.debug(f"Updated schedule with {len(schedule)} entries")
        else:
            logger.warning("Optimizer returned empty schedule")

    def wait_until_next(self) -> None:
        """Wait until the start of the next price bracket."""
        now = datetime.now(UTC)
        next_run = now.replace(
            minute=(now.minute // self._price_config.aggregate_minutes) * self._price_config.aggregate_minutes,
            second=0,
            microsecond=0,
        ) + timedelta(minutes=self._price_config.aggregate_minutes)
        self.wait_seconds((next_run - now).total_seconds())

    def _upsert_schedule(self, schedule: list[tuple[datetime, datetime, int, float]]) -> None:
        """
        Schedules are stored in a bit of an insane way in the timeseries backend...
        The timestamp of each inserted sample is increased by a tiny bit, proportional to how far in
        the future the sample is. This way, a first_over_time() query will return the most recently
        generated sample for a given timestamp.
        """

        device_id = self._battery_system.id
        if device_id is None:
            logger.warning("Cannot upsert schedule: battery system has no device ID")
            return

        samples: list[Sample] = []

        now = datetime.now(UTC)
        for ts_start, ts_end, power, soc in schedule:
            delta = timedelta(milliseconds=1 + (ts_start - now).total_seconds() // 60)

            samples.append(
                Sample(
                    metric="openess_scheduled_power_watts",
                    timestamp=ts_start + delta,
                    value=power,
                    labels={"device": device_id},
                )
            )
            samples.append(
                Sample(
                    metric="openess_scheduled_soc_ratio",
                    timestamp=ts_end + delta,
                    value=soc / 100,
                    labels={"device": device_id},
                )
            )

        self._mql_client.write(samples)
