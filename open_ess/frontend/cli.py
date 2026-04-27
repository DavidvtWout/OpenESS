import logging

import uvicorn

from open_ess.config import Config
from open_ess.frontend.app import create_app
from open_ess.frontend.dependencies import close_dependencies, init_dependencies
from open_ess.util import parse_args, setup_logging

setup_logging()
logger = logging.getLogger(__name__)


def main():
    args = parse_args("Open Energy Storage System web dashboard")

    config = Config.from_file(args.config)
    if not config.frontend.enable:
        logger.info("Frontend is not enabled. Exiting...")

    init_dependencies(config.database, config.prices)

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


if __name__ == "__main__":
    main()
