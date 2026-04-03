import argparse
import logging
import signal
import sys
import time
from pathlib import Path

from dynamic_ess.config import Config
from dynamic_ess.db import Database
from dynamic_ess.entsoe_api import EntsoeClient
from dynamic_ess.victron_modbus import VictronClient

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

    database = Database(config.db_path)
    entsoe_client = EntsoeClient(config.entsoe, database)
    victron_client = VictronClient(config.victron_gx, database)

    if not victron_client.initialize():
        logger.error(f"Could not connect to Victron GX at {victron_client.address}")
        sys.exit(1)
    logger.info(f"Connected to Victron GX at {victron_client.address}")

    running = True

    def shutdown(signum, frame):
        nonlocal running
        logger.info("Shutting down...")
        running = False

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    try:
        entsoe_client.fetch_missing_prices()
    except Exception as e:
        logger.exception(f"Could not fetch prices: {e}")

    # Main polling loop
    poll_interval = config.victron_gx.poll_interval
    last_poll = 0.0

    while running:
        now = time.monotonic()

        if now - last_poll >= poll_interval:
            try:
                victron_client.collect_and_store_measurements()
                last_poll = now
            except Exception as e:
                logger.exception(f"Error collecting measurements: {e}")

        time.sleep(0.1)

    victron_client.close()
    database.close()


if __name__ == "__main__":
    main()
