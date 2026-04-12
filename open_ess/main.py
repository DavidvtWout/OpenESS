import logging
import signal

import uvicorn

from open_ess.config import Config
from open_ess.database import Database, DatabaseService
from open_ess.frontend import init_dependencies, create_app, close_dependencies
from open_ess.optimizer import OptimizerService
from open_ess.pricing import EntsoeService
from open_ess.util import setup_logging, parse_args
from open_ess.victron_modbus import VictronService

setup_logging()
logger = logging.getLogger(__name__)


def main():
    args = parse_args("Open Energy Storage System - optimize charging based on day-ahead prices")
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

    # Frontend
    if config.frontend.enable:
        init_dependencies(config)
        logger.info(f"Starting web server on http://{config.frontend.host}:{config.frontend.port}")
        try:
            app = create_app()
            uvicorn.run(
                app,
                host=config.frontend.host,
                port=config.frontend.port,
                log_level="info",
            )
        finally:
            close_dependencies()

    for s in services:
        s.join()

    logger.info("Shutdown complete")


if __name__ == "__main__":
    main()
