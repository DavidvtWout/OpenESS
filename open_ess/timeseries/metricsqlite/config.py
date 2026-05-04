from pathlib import Path
from typing import Literal

from pydantic import BaseModel


class MetricSQLiteConfig(BaseModel):
    backend: Literal["metricsqlite"] = "metricsqlite"
    db_path: Path = Path("openess.db")
