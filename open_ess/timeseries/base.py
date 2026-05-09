"""Base interface for timeseries backends."""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import TYPE_CHECKING, Literal

if TYPE_CHECKING:
    pass


@dataclass
class Sample:
    """A single metric sample for writing."""

    metric: str
    value: float
    timestamp: datetime
    labels: dict[str, str] = field(default_factory=dict)


# --- Instant Query Result Types ---


@dataclass
class ScalarResult:
    """Result of an instant query returning a scalar value."""

    result_type: Literal["scalar"] = field(default="scalar", repr=False)
    timestamp: datetime = field(default_factory=datetime.now)
    value: float = 0.0


@dataclass
class InstantSeries:
    """A series with a single value (instant vector element)."""

    metric: dict[str, str]
    timestamp: datetime
    value: float


@dataclass
class VectorResult:
    """Result of an instant query returning an instant vector."""

    result_type: Literal["vector"] = field(default="vector", repr=False)
    series: list[InstantSeries] = field(default_factory=list)


@dataclass
class RangeSeries:
    """A series with multiple values over time (range vector/matrix element)."""

    metric: dict[str, str]
    values: list[tuple[datetime, float]]  # (timestamp, value) pairs


InstantQueryResult = ScalarResult | VectorResult


# --- Range Query Result Type ---


@dataclass
class RangeQueryResult:
    """Result of a range query (always returns a matrix)."""

    series: list[RangeSeries] = field(default_factory=list)


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
    def query(self, query: str, time: datetime | None = None) -> InstantQueryResult:
        """Execute an instant query.

        Args:
            query: MetricsQL/PromQL query string.
            time: Evaluation timestamp. Defaults to now.

        Returns:
            ScalarResult, VectorResult, or MatrixResult depending on query.
        """
        ...

    @abstractmethod
    def query_range(
        self,
        query: str,
        start: datetime,
        end: datetime,
        step: str = "1m",
    ) -> RangeQueryResult:
        """Execute a range query.

        Args:
            query: MetricsQL/PromQL query string.
            start: Start of time range.
            end: End of time range.
            step: Query resolution (e.g., "1m", "5m", "1h").

        Returns:
            RangeQueryResult containing series with values at each step.
        """
        ...

    @abstractmethod
    def close(self) -> None:
        """Close any connections."""
        ...

    def get_prices(
        self,
        area: str,
        start: datetime,
        end: datetime,
        hourly: bool = False,
        price: Literal["market", "buy", "sell"] = "market",
    ) -> list[tuple[datetime, float]]:
        """Prices are returned in currency per Kwh (usually €/kWh)."""
        # Lazy import to avoid circular dependency
        from open_ess.pricing import AREAS

        # Validate area and price to prevent MetricsQL injection.
        if area not in AREAS:
            raise ValueError(f"Unknown area code: '{area}'")
        if price not in ("market", "buy", "sell"):
            raise ValueError(f"Unknown price type: '{price}'")

        if hourly:
            query = f'avg_over_time(openess_prices{{area="{area}", price="{price}"}}[1h])'
            step = "1h"
        else:
            query = f'openess_prices{{area="{area}", price="{price}"}}'
            step = "15m"
        result = self.query_range(query, start, end, step)

        if not result.series:
            return []
        return list(result.series[0].values)
