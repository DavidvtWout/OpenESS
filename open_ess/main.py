import logging
import signal

import uvicorn

from open_ess.battery_system import BatterySystem, VictronBatterySystem
from open_ess.config import Config
from open_ess.database import Database, DatabaseService
from open_ess.frontend import create_app
from open_ess.optimizer import OptimizerService
from open_ess.pricing import EntsoeService
from open_ess.service import ServiceManager
from open_ess.util import EndpointFilter, parse_args, setup_logging
from open_ess.victron_modbus import VictronService

setup_logging()
logger = logging.getLogger(__name__)


def main() -> None:
    args = parse_args("Open Energy Storage System - optimize charging based on day-ahead prices")
    config = Config.from_file(args.config)

    database = Database(config.database)
    database.run_migrations()

    # Create services
    service_manager = ServiceManager()
    service_manager.register_service(DatabaseService(database))
    service_manager.register_service(EntsoeService(database, config.prices))
    battery_systems: list[BatterySystem] = []
    for battery_config in config.battery_systems:
        if battery_config.is_victron:
            victron_service = VictronService(database, battery_config)
            service_manager.register_service(victron_service)
            battery_system = VictronBatterySystem(battery_config, victron_service.client)
            battery_systems.append(battery_system)
            service_manager.register_service(
                OptimizerService(
                    database,
                    battery_system=battery_system,
                    price_config=config.prices,
                ),
                requires=victron_service,
            )

    # Shutdown handler
    def shutdown(signum: int, frame: object) -> None:
        logger.info("Shutting down...")
        service_manager.stop()

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    service_manager.start()

    # Frontend
    if config.frontend.enable:
        logger.info(f"Starting web server on http://{config.frontend.host}:{config.frontend.port}")

        logging.getLogger("uvicorn.access").addFilter(EndpointFilter(["/api/power-flow"]))

        app = create_app(database, config, battery_systems)
        uvicorn.run(
            app,
            host=config.frontend.host,
            port=config.frontend.port,
            log_level="info",
        )

    service_manager.wait_for_stop()
    logger.info("Shutdown complete")


if __name__ == "__main__":
    main()
