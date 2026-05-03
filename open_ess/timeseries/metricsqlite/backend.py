"""MetricSQLite timeseries backend implementation."""

from datetime import datetime
from pathlib import Path

from metricsqlite import MetricsQLiteClient
from metricsqlite.engine import InstantVector, MatrixResult, RangeVectorResult, ScalarResult

from ..base import QueryResult, QueryResultSeries, Sample, TimeseriesBackend
from .config import MetricSQLiteConfig


class MetricSQLiteBackend(TimeseriesBackend):
    """MetricSQLite backend using SQLite for storage."""

    def __init__(self, config: MetricSQLiteConfig, db_path: Path):
        """Initialize MetricSQLite backend.

        Args:
            config: MetricSQLite configuration.
            db_path: Path to SQLite database file.
        """
        self.config = config
        self._client = MetricsQLiteClient(db_path, enable_wal=True)
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

    def query(self, query: str, time: datetime | None = None) -> QueryResult:
        """Execute an instant query."""
        eval_time: float | None = None
        if time is not None:
            eval_time = time.timestamp() * 1000

        result = self._client.query(query, time=eval_time)
        return self._convert_result(result)

    def query_range(
        self,
        query: str,
        start: datetime,
        end: datetime,
        step: str = "1m",
    ) -> QueryResult:
        """Execute a range query."""
        start_ms = start.timestamp() * 1000
        end_ms = end.timestamp() * 1000

        result = self._client.query_range(query, start=start_ms, end=end_ms, step=step)
        return self._convert_matrix_result(result)

    def _convert_result(
        self, result: InstantVector | RangeVectorResult | ScalarResult
    ) -> QueryResult:
        """Convert metricsqlite result to QueryResult."""
        if isinstance(result, ScalarResult):
            # Scalar result - single value
            return QueryResult(
                series=[
                    QueryResultSeries(
                        metric={},
                        values=[(datetime.fromtimestamp(result.timestamp / 1000), result.value)],
                    )
                ]
            )

        if isinstance(result, RangeVectorResult):
            # Range vector from instant query (e.g., metric[5m])
            series_list = []
            for labels, samples in result.series:
                values = [
                    (datetime.fromtimestamp(sample.timestamp / 1000), sample.value)
                    for sample in samples
                ]
                series_list.append(QueryResultSeries(metric=labels, values=values))
            return QueryResult(series=series_list)

        # InstantVector
        series_list = []
        for labels, sample in result.series:
            series_list.append(
                QueryResultSeries(
                    metric=labels,
                    values=[(datetime.fromtimestamp(sample.timestamp / 1000), sample.value)],
                )
            )
        return QueryResult(series=series_list)

    def _convert_matrix_result(self, result: MatrixResult) -> QueryResult:
        """Convert metricsqlite MatrixResult to QueryResult."""
        series_list = []
        for labels, samples in result.series:
            values = [
                (datetime.fromtimestamp(sample.timestamp / 1000), sample.value)
                for sample in samples
            ]
            series_list.append(QueryResultSeries(metric=labels, values=values))
        return QueryResult(series=series_list)

    def close(self) -> None:
        """Close the database connection."""
        self._client.close()
