import argparse
import logging
import signal
from pathlib import Path

from dynamic_ess.components import ChargePlanner, EntsoeCollector, VictronCollector
from dynamic_ess.config import Config
from dynamic_ess.db import Database

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

    # Components create their own connections in their threads
    components = [
        VictronCollector(config.victron_gx, config.db_path),
        EntsoeCollector(config.entsoe, config.db_path, check_interval_hours=1.0),
        ChargePlanner(config.db_path, area=config.entsoe.area, run_at_minute=58),
    ]

    # Shutdown handler
    def shutdown(signum, frame):
        logger.info("Shutting down...")
        for c in components:
            c.stop()

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    # Start all components
    for c in components:
        c.start()

    # Wait for all components to finish
    for c in components:
        c.join()

    logger.info("Shutdown complete")


if __name__ == "__main__":
    main()
