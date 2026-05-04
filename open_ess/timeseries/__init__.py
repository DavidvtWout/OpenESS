from .base import (
    InstantQueryResult,
    InstantSeries,
    RangeQueryResult,
    RangeSeries,
    Sample,
    ScalarResult,
    TimeseriesBackend,
    VectorResult,
)
from .config import TimeseriesConfig
from .metricsqlite.config import MetricSQLiteConfig
from .victoriametrics.config import VictoriaMetricsConfig


def create_backend(
    config: TimeseriesConfig,
) -> TimeseriesBackend:
    """Create a timeseries backend from config.

    Args:
        config: Timeseries configuration (MetricSQLiteConfig or VictoriaMetricsConfig).

    Returns:
        Configured backend instance.
    """
    if isinstance(config, VictoriaMetricsConfig):
        from .victoriametrics.backend import VictoriaMetricsBackend

        return VictoriaMetricsBackend(config)
    elif isinstance(config, MetricSQLiteConfig):
        from .metricsqlite.backend import MetricSQLiteBackend

        return MetricSQLiteBackend(config)
    else:
        raise ValueError(f"Unknown timeseries config type: {type(config)}")


__all__ = [
    "InstantQueryResult",
    "InstantSeries",
    "RangeQueryResult",
    "RangeSeries",
    "Sample",
    "ScalarResult",
    "TimeseriesBackend",
    "TimeseriesConfig",
    "VectorResult",
    "create_backend",
]
