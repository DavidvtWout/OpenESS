import argparse
import logging
import signal
from pathlib import Path

from dynamic_ess.config import Config
from dynamic_ess.db import Database
from dynamic_ess.entsoe_api import EntsoeService
from dynamic_ess.optimizer import SchedulerService
from dynamic_ess.victron_modbus import VictronService

logger = logging.getLogger(__name__)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Victron dynamic ESS controller - optimize charging based on day-ahead prices"
    )
    parser.add_argument(
        "--config",
        type=Path,
        required=True,
        help="Path to config file (YAML)",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    config = Config.from_file(args.config)

    # Run migrations on startup (main thread)
    Database(config.db_path, run_migrations=True).close()

    # Services create their own connections in their threads
    services = [
        VictronService(config.victron_gx, config.db_path),
        EntsoeService(config.entsoe, config.db_path, check_interval_hours=1.0),
        SchedulerService(
            config.db_path,
            area=config.entsoe.area,
            run_at_minute=55,
            battery=config.battery,
        ),
    ]

    # Shutdown handler
    def shutdown(signum, frame):
        logger.info("Shutting down...")
        for s in services:
            s.stop()

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    # Start all services
    for s in services:
        s.start()

    # Wait for all services to finish
    for s in services:
        s.join()

    logger.info("Shutdown complete")


if __name__ == "__main__":
    main()
