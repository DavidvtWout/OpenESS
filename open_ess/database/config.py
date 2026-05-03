from pathlib import Path

from pydantic import BaseModel


class DatabaseCompressionConfig(BaseModel):
    enable: bool = True
    bucket_seconds: int = 60


class DatabaseConfig(BaseModel):
    path: Path = Path("./data.db")
    compression: DatabaseCompressionConfig = DatabaseCompressionConfig()
