import argparse
import logging
import os
import signal
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

from .db import Database
from .entsoe import EntsoeClient

logger = logging.getLogger(__name__)


def fetch_missing_prices(db: Database, entsoe: EntsoeClient, area: str):
    now = datetime.now(timezone.utc)
    end_of_tomorrow = (now + timedelta(days=2)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )

    latest = db.get_latest_price_time(area)
    if latest is None:
        fetch_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        fetch_start -= timedelta(days=70)
    elif latest >= end_of_tomorrow:
        return
    else:
        fetch_start = latest

    logger.info(f"Fetching prices for {area} from {fetch_start} to {end_of_tomorrow}")
    prices = entsoe.fetch_day_ahead_prices(area, fetch_start, end_of_tomorrow)
    if prices:
        db.insert_prices(area, prices)


def main():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )

    parser = argparse.ArgumentParser(
        description="Victron dynamic ESS controller - optimize charging based on day-ahead prices"
    )
    parser.add_argument(
        "--db-path",
        type=Path,
        default=Path("dynamic_ess.db"),
        help="Path to SQLite database file (default: ./dynamic_ess.db)",
    )
    parser.add_argument(
        "--entsoe-api-key",
        type=str,
        default=os.environ.get("ENTSOE_API"),
        help="ENTSO-E API key (or set ENTSOE_API env var)",
    )
    parser.add_argument(
        "--area",
        type=str,
        default="NL",
        help="Bidding zone area code (default: NL)",
    )
    parser.add_argument(
        "--poll-interval",
        type=int,
        default=3600,
        help="Seconds between price fetches (default: 3600)",
    )
    args = parser.parse_args()

    if not args.entsoe_api_key:
        logger.error(
            "ENTSO-E API key required. Use --entsoe-api-key or set ENTSOE_API env var.\n"
            "See https://github.com/BerriJ/entsoe-apy for instructions on how to aquire an API key."
        )
        sys.exit(1)

    db = Database(args.db_path)
    entsoe = EntsoeClient(args.entsoe_api_key)

    logger.info(f"Database initialized at {args.db_path}")

    running = True

    def shutdown(signum, frame):
        nonlocal running
        logger.info("Shutting down...")
        running = False

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    # Main loop
    while running:
        try:
            fetch_missing_prices(db, entsoe, args.area)
        except Exception as e:
            logger.exception(f"Could not fetch prices: {e}")

        # Sleep in small intervals to allow clean shutdown
        for _ in range(args.poll_interval):
            if not running:
                break
            time.sleep(1)

    db.close()


if __name__ == "__main__":
    main()
