"""Timeseries backend configuration."""

from typing import Annotated

from pydantic import Field

from .metricsqlite.config import MetricSQLiteConfig
from .victoriametrics.config import VictoriaMetricsConfig

TimeseriesConfig = Annotated[
    MetricSQLiteConfig | VictoriaMetricsConfig,
    Field(discriminator="backend"),
]
