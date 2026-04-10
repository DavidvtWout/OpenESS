import argparse
import logging
import signal
from pathlib import Path

from open_ess.config import Config
from open_ess.database import Database, DatabaseService
from open_ess.optimizer import OptimizerService
from open_ess.pricing import EntsoeService
from open_ess.victron_modbus import VictronService


class ColoredFormatter(logging.Formatter):
    RESET = "\033[0m"

    LEVEL_COLORS = {
        logging.DEBUG: "\033[36m",  # cyan
        logging.INFO: "\033[32m",  # green
        logging.WARNING: "\033[33m",  # yellow
        logging.ERROR: "\033[31m",  # red
        logging.CRITICAL: "\033[1;91m",  # bold red
    }

    def format(self, record):
        timestamp = self.formatTime(record, "%Y-%m-%d %H:%M:%S")
        msecs = f"{record.msecs:03.0f}"
        time_str = f"\033[90m{timestamp}.{msecs}{self.RESET}"  # grey

        level_color = self.LEVEL_COLORS.get(record.levelno, self.RESET)
        level_str = f"{level_color}{record.levelname:<8}{self.RESET}"

        location_str = (
            f"\033[34m{record.name}{self.RESET}:"  # blue
            f"\033[36m{record.funcName}{self.RESET}:"  # cyan
            f"\033[32m{record.lineno}{self.RESET}"  # green
        )

        # Message with level color
        message_str = f"{record.getMessage()}{self.RESET}"

        result = f"{time_str} | {level_str} | {location_str} - {message_str}"

        # Append exception traceback if present
        if record.exc_info:
            exc_text = self.formatException(record.exc_info)
            result = f"{result}\n{exc_text}"

        return result


def setup_logging():
    handler = logging.StreamHandler()
    handler.setFormatter(ColoredFormatter())
    logging.root.addHandler(handler)
    logging.root.setLevel(logging.INFO)


setup_logging()
logger = logging.getLogger(__name__)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Open Energy Storage System - optimize charging based on day-ahead prices"
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

    # Run migrations on startup
    Database(config.database, run_migrations=True).close()

    # Services create their own connections in their threads
    database_service = DatabaseService(config.database)
    entsoe_service = EntsoeService(config.prices, config.database, check_interval_hours=1.0)
    victron_service = VictronService(config.victron_gx, config.database, config.batteries)
    optimer_service = OptimizerService(
        config.database,
        victron_service=victron_service,
        price_config=config.prices,
        battery_configs=config.batteries,
    )

    services = [
        database_service,
        entsoe_service,
        victron_service,
        optimer_service,
    ]

    # Shutdown handler
    def shutdown(signum, frame):
        logger.info("Shutting down...")
        for s in services:
            s.stop()

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    for s in services:
        s.start()
    for s in services:
        s.join()

    logger.info("Shutdown complete")


if __name__ == "__main__":
    main()
