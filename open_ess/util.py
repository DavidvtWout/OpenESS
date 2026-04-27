import argparse
import logging
from pathlib import Path
from typing import ClassVar

logger = logging.getLogger(__name__)


class ColoredFormatter(logging.Formatter):
    RESET = "\033[0m"

    LEVEL_COLORS: ClassVar[dict] = {
        logging.DEBUG: "\033[36m",  # cyan
        logging.INFO: "\033[32m",  # green
        logging.WARNING: "\033[33m",  # yellow
        logging.ERROR: "\033[31m",  # red
        logging.CRITICAL: "\033[1;91m",  # bold red
    }

    def format(self, record: logging.LogRecord) -> str:
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


def setup_logging() -> None:
    handler = logging.StreamHandler()
    handler.setFormatter(ColoredFormatter())
    logging.root.addHandler(handler)
    logging.root.setLevel(logging.INFO)


class EndpointFilter(logging.Filter):
    def __init__(self, excluded_paths: list[str]):
        super().__init__()
        self.excluded_paths = excluded_paths

    def filter(self, record: logging.LogRecord) -> bool:
        message = record.getMessage()
        return not any(path in message for path in self.excluded_paths)


def parse_args(description: str) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=description)
    parser.add_argument(
        "--config",
        type=Path,
        required=True,
        help="Path to config file (YAML)",
    )
    return parser.parse_args()
