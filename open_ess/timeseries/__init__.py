"""Timeseries backend abstraction."""

from pathlib import Path

from .base import QueryResult, QueryResultSeries, Sample, TimeseriesBackend
from .config import TimeseriesConfig
from .metricsqlite.config import MetricSQLiteConfig
from .victoriametrics.config import VictoriaMetricsConfig


def create_backend(
    config: TimeseriesConfig,
    db_path: Path | None = None,
) -> TimeseriesBackend:
    """Create a timeseries backend from config.

    Args:
        config: Timeseries configuration (MetricSQLiteConfig or VictoriaMetricsConfig).
        db_path: Database path for MetricSQLite backend. Required if using MetricSQLite.

    Returns:
        Configured backend instance.
    """
    if isinstance(config, VictoriaMetricsConfig):
        from .victoriametrics.backend import VictoriaMetricsBackend

        return VictoriaMetricsBackend(config)
    elif isinstance(config, MetricSQLiteConfig):
        from .metricsqlite.backend import MetricSQLiteBackend

        if db_path is None:
            raise ValueError("db_path is required for MetricSQLite backend")
        return MetricSQLiteBackend(config, db_path)
    else:
        raise ValueError(f"Unknown timeseries config type: {type(config)}")


__all__ = [
    "QueryResult",
    "QueryResultSeries",
    "Sample",
    "TimeseriesBackend",
    "TimeseriesConfig",
    "create_backend",
]
