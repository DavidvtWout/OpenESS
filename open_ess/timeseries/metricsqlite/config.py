"""MetricSQLite timeseries backend configuration."""

from typing import Literal

from pydantic import BaseModel


class MetricSQLiteConfig(BaseModel):
    """Configuration for MetricSQLite backend.

    Uses the database path from DatabaseConfig.
    """

    backend: Literal["metricsqlite"] = "metricsqlite"
