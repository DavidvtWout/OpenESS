from .base import QueryResult, QueryResultSeries, Sample, TimeseriesBackend
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
    "QueryResult",
    "QueryResultSeries",
    "Sample",
    "TimeseriesBackend",
    "TimeseriesConfig",
    "create_backend",
]
