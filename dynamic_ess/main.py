import argparse
import logging
import signal
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

from dynamic_ess.config import Config
from dynamic_ess.db import Database
from dynamic_ess.entsoe_api import EntsoeClient
from dynamic_ess.util import plot_energy_prices
from dynamic_ess.victron_modbus import VictronClient

logger = logging.getLogger(__name__)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)


def fetch_missing_prices(db: Database, entsoe: EntsoeClient, area: str):
    now = datetime.now(timezone.utc)
    end_of_tomorrow = (now + timedelta(days=2)).replace(hour=0, minute=0, second=0, microsecond=0)

    latest = db.get_latest_price_time(area)
    if latest is None:
        fetch_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        fetch_start -= timedelta(days=14)
    elif latest >= end_of_tomorrow:
        return
    else:
        fetch_start = latest

    logger.info(f"Fetching prices for {area} from {fetch_start} to {end_of_tomorrow}")
    prices = entsoe.fetch_day_ahead_prices(fetch_start, end_of_tomorrow)
    if prices:
        db.insert_prices(area, prices)


def main():
    parser = argparse.ArgumentParser(
        description="Victron dynamic ESS controller - optimize charging based on day-ahead prices"
    )
    parser.add_argument(
        "--config",
        type=Path,
        required=True,
        help="Path to config file (YAML)",
    )
    args = parser.parse_args()

    config = Config.from_file(args.config)

    db = Database(config.db_path)
    entsoe = EntsoeClient(config.entsoe)
    victron = VictronClient(config.victron_gx)

    if not victron.connect():
        logger.error(f"Could not connect to Victron GX at {victron.host}:{victron.port}")
        sys.exit(1)
    logger.info(f"Connected to Victron GX at {victron.host}:{victron.port}")

    running = True

    def shutdown(signum, frame):
        nonlocal running
        logger.info("Shutting down...")
        running = False

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    # try:
    #     fetch_missing_prices(db, entsoe, config.entsoe.area)
    # except Exception as e:
    #     logger.exception(f"Could not fetch prices: {e}")

    plot_energy_prices(db, config.entsoe.area)

    # Main loop
    while running:
        try:
            victron.get_state()
        except Exception as e:
            logger.exception(f"Could not read Victron state: {e}")

        time.sleep(1)
        running = False

    victron.close()
    db.close()


if __name__ == "__main__":
    main()
