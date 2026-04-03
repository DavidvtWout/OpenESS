import logging
import os
from pathlib import Path

from pydantic import BaseModel, model_validator

logger = logging.getLogger(__name__)


class EntsoeConfig(BaseModel):
    api_key: str | None = None
    api_key_file: Path | None = None
    area: str

    @model_validator(mode="after")
    def resolve_api_key(self) -> "EntsoeConfig":
        """Resolve API key from: direct value > file > environment variable."""
        if self.api_key:
            return self

        if self.api_key_file:
            logger.info(f"Reading API key from {self.api_key_file}")
            self.api_key = self.api_key_file.read_text().strip()
            return self

        env_key = os.environ.get("ENTSOE_API")
        if env_key:
            self.api_key = env_key
            return self

        raise ValueError(
            "ENTSO-E API key not configured. Provide api_key, api_key_file, or set ENTSOE_API environment variable."
        )
