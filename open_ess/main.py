import logging
import signal

import uvicorn

from open_ess.config import Config
from open_ess.database import Database, DatabaseService
from open_ess.frontend import init_dependencies, create_app, close_dependencies
from open_ess.optimizer import OptimizerService
from open_ess.pricing import EntsoeService
from open_ess.util import setup_logging, parse_args, EndpointFilter
from open_ess.victron_modbus import VictronService

setup_logging()
logger = logging.getLogger(__name__)


def main():
    args = parse_args("Open Energy Storage System - optimize charging based on day-ahead prices")
    config = Config.from_file(args.config)

    # Run migrations on startup
    database = Database(config.database)
    database.run_migrations()

    # Services create their own connections in their threads
    database_service = DatabaseService(database)
    entsoe_service = EntsoeService(database, config.prices)
    victron_services = []
    optimizer_services = []
    for battery_system in config.battery_systems:
        if battery_system.is_victron:
            victron_service = VictronService(database, battery_system)
            victron_services.append(victron_service)
            optimizer_services.append(
                OptimizerService(
                    database,
                    victron_service=victron_service,
                    price_config=config.prices,
                    battery_configs=config.battery_systems,
                )
            )

    services = [database_service, entsoe_service] + victron_services + optimizer_services

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
        init_dependencies(database, config)
        logger.info(f"Starting web server on http://{config.frontend.host}:{config.frontend.port}")

        logging.getLogger("uvicorn.access").addFilter(EndpointFilter(["/api/power-flow"]))

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
