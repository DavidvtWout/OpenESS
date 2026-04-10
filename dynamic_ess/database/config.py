from pathlib import Path

from pydantic import BaseModel


class DatabaseConfig(BaseModel):
    path: Path
