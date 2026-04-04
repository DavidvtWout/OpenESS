import argparse
import logging
from pathlib import Path

import uvicorn

from dynamic_ess.config import Config
from dynamic_ess.web.app import create_app
from dynamic_ess.web.dependencies import init_dependencies, close_dependencies

logger = logging.getLogger(__name__)


def main():
    parser = argparse.ArgumentParser(
        description="Dynamic ESS web dashboard"
    )
    parser.add_argument(
        "--config",
        type=Path,
        required=True,
        help="Path to config file (YAML)",
    )
    parser.add_argument(
        "--host",
        type=str,
        default="127.0.0.1",
        help="Host to bind to (default: 127.0.0.1)",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8000,
        help="Port to bind to (default: 8000)",
    )
    parser.add_argument(
        "--reload",
        action="store_true",
        help="Enable auto-reload for development",
    )
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )

    config = Config.from_file(args.config)
    init_dependencies(config.db_path, config.prices)

    logger.info(f"Starting web server on http://{args.host}:{args.port}")

    try:
        app = create_app()
        uvicorn.run(
            app,
            host=args.host,
            port=args.port,
            log_level="info",
        )
    finally:
        close_dependencies()


if __name__ == "__main__":
    main()
