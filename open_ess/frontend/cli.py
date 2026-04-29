import logging

import uvicorn

from open_ess.config import Config
from open_ess.database import Database
from open_ess.frontend.app import create_app
from open_ess.util import parse_args, setup_logging

setup_logging()
logger = logging.getLogger(__name__)


def main() -> None:
    args = parse_args("Open Energy Storage System web dashboard")

    config = Config.from_file(args.config)
    if not config.frontend.enable:
        logger.info("Frontend is not enabled. Exiting...")
        return

    database = Database(config.database)

    logger.info(f"Starting web server on http://{config.frontend.host}:{config.frontend.port}")

    app = create_app(database, config, battery_systems=[])
    uvicorn.run(
        app,
        host=config.frontend.host,
        port=config.frontend.port,
        log_level="info",
    )


if __name__ == "__main__":
    main()
