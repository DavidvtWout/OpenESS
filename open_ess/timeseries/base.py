"""Base interface for timeseries backends."""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class Sample:
    """A single metric sample for writing."""

    metric: str
    value: float
    timestamp: datetime
    labels: dict[str, str] = field(default_factory=dict)


@dataclass
class QueryResultSeries:
    """A single series from a query result."""

    metric: dict[str, str]
    values: list[tuple[datetime, float]]  # (timestamp, value) pairs


@dataclass
class QueryResult:
    """Result of a query or query_range call."""

    series: list[QueryResultSeries]

    def scalar(self) -> float | None:
        """Get single scalar value if result has exactly one series with one value."""
        if len(self.series) == 1 and len(self.series[0].values) == 1:
            return self.series[0].values[0][1]
        return None


class TimeseriesBackend(ABC):
    """Abstract base class for timeseries backends.

    Provides a unified interface for writing and querying metrics,
    supporting both VictoriaMetrics and MetricSQLite backends.
    """

    @abstractmethod
    def write(self, samples: list[Sample]) -> None:
        """Write a batch of samples.

        Args:
            samples: List of samples to write.
        """
        ...

    @abstractmethod
    def query(self, query: str, time: datetime | None = None) -> QueryResult:
        """Execute an instant query.

        Args:
            query: MetricsQL/PromQL query string.
            time: Evaluation timestamp. Defaults to now.

        Returns:
            Query result containing matching series.
        """
        ...

    @abstractmethod
    def query_range(
        self,
        query: str,
        start: datetime,
        end: datetime,
        step: str = "1m",
    ) -> QueryResult:
        """Execute a range query.

        Args:
            query: MetricsQL/PromQL query string.
            start: Start of time range.
            end: End of time range.
            step: Query resolution (e.g., "1m", "5m", "1h").

        Returns:
            Query result containing matching series with values at each step.
        """
        ...

    @abstractmethod
    def close(self) -> None:
        """Close any connections."""
        ...
