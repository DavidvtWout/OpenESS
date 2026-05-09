import logging
from datetime import UTC, datetime

import fastapi
from metricsqlite import MetricsQLiteClient
from metricsqlite.engine import InstantVector, MatrixResult, RangeVectorResult, ScalarResult
from metricsqlite.fastapi import create_router

from ..base import (
    InstantQueryResult,
    InstantSeries,
    RangeQueryResult,
    RangeSeries,
    Sample,
    TimeseriesBackend,
    VectorResult,
)
from ..base import ScalarResult as BaseScalarResult
from .config import MetricSQLiteConfig

logger = logging.getLogger(__name__)


class MetricSQLiteBackend(TimeseriesBackend):
    def __init__(self, config: MetricSQLiteConfig):
        self.config = config
        self._client = MetricsQLiteClient(config.db_path, enable_wal=True)
        self._client.connect()
        self._client.create_tables()

    def write(self, samples: list[Sample]) -> None:
        """Write samples as gauge metrics."""
        for sample in samples:
            timestamp_ms = int(sample.timestamp.timestamp() * 1000)
            self._client.insert_gauge(
                name=sample.metric,
                value=sample.value,
                timestamp=timestamp_ms,
                labels=sample.labels if sample.labels else None,
            )

    def query(self, query: str, time: datetime | None = None) -> InstantQueryResult:
        """Execute an instant query."""
        eval_time: float | None = None
        if time is not None:
            eval_time = time.timestamp() * 1000

        result = self._client.query(query, time=eval_time)
        return self._convert_instant_result(result)

    def query_range(
        self,
        query: str,
        start: datetime,
        end: datetime,
        step: str = "1m",
    ) -> RangeQueryResult:
        """Execute a range query."""
        start_ms = start.timestamp() * 1000
        end_ms = end.timestamp() * 1000

        result = self._client.query_range(query, start=start_ms, end=end_ms, step=step)
        return self._convert_range_result(result)

    def _convert_instant_result(self, result: InstantVector | RangeVectorResult | ScalarResult) -> InstantQueryResult:
        """Convert metricsqlite instant query result."""
        if isinstance(result, ScalarResult):
            return BaseScalarResult(
                timestamp=datetime.fromtimestamp(result.timestamp / 1000, tz=UTC),
                value=result.value,
            )

        if isinstance(result, RangeVectorResult):
            # Range vector from instant query (e.g., metric[5m])
            # Convert to VectorResult by taking the last value
            logger.warning("Instant query returned range vector, taking last value")
            series = []
            for labels, samples in result.series:
                if samples:
                    last = samples[-1]
                    series.append(
                        InstantSeries(
                            metric=labels,
                            timestamp=datetime.fromtimestamp(last.timestamp / 1000, tz=UTC),
                            value=last.value,
                        )
                    )
            return VectorResult(series=series)

        # InstantVector
        series = []
        for labels, sample in result.series:
            series.append(
                InstantSeries(
                    metric=labels,
                    timestamp=datetime.fromtimestamp(sample.timestamp / 1000, tz=UTC),
                    value=sample.value,
                )
            )
        return VectorResult(series=series)

    def _convert_range_result(self, result: MatrixResult) -> RangeQueryResult:
        """Convert metricsqlite range query result."""
        series = []
        for labels, samples in result.series:
            values = [(datetime.fromtimestamp(sample.timestamp / 1000, tz=UTC), sample.value) for sample in samples]
            series.append(RangeSeries(metric=labels, values=values))
        return RangeQueryResult(series=series)

    def create_fastapi_router(self) -> fastapi.APIRouter:
        router: fastapi.APIRouter = create_router(self._client)
        return router

    def close(self) -> None:
        """Close the database connection."""
        self._client.close()
