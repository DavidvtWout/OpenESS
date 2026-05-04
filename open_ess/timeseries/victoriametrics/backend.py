"""VictoriaMetrics timeseries backend implementation."""

import json
import logging
from datetime import UTC, datetime

from urllib3 import HTTPConnectionPool, HTTPSConnectionPool
from urllib3.util import parse_url

from ..base import (
    InstantQueryResult,
    InstantSeries,
    RangeQueryResult,
    RangeSeries,
    Sample,
    ScalarResult,
    TimeseriesBackend,
    VectorResult,
)
from .client import RemoteWriteClient
from .client import Sample as RemoteWriteSample
from .config import VictoriaMetricsConfig

logger = logging.getLogger(__name__)


class VictoriaMetricsBackend(TimeseriesBackend):
    """VictoriaMetrics backend using remote write protocol for writes and HTTP API for queries."""

    def __init__(self, config: VictoriaMetricsConfig):
        self.config = config

        # Parse URL to get components
        parsed = parse_url(config.url)
        self._host = parsed.host
        self._port = parsed.port
        self._scheme = parsed.scheme or "http"

        # Build base path (strip trailing slash)
        self._base_path = (parsed.path or "").rstrip("/")

        # Set up connection pool for queries
        pool_cls = HTTPSConnectionPool if self._scheme == "https" else HTTPConnectionPool
        pool_kwargs: dict = {
            "host": self._host,
            "port": self._port,
            "timeout": config.timeout,
            "maxsize": 2,
            "block": True,
        }
        if config.username and config.password:
            import base64

            credentials = f"{config.username}:{config.password}".encode()
            auth = base64.b64encode(credentials).decode("ascii")
            pool_kwargs["headers"] = {"Authorization": f"Basic {auth}"}
        self._pool = pool_cls(**pool_kwargs)

        # Set up remote write client
        write_url = f"{self._scheme}://{self._host}"
        if self._port:
            write_url += f":{self._port}"
        write_url += f"{self._base_path}/api/v1/write"

        self._write_client = RemoteWriteClient(
            url=write_url,
            username=config.username,
            password=config.password,
            timeout=config.timeout,
        )

    def write(self, samples: list[Sample]) -> None:
        """Write samples using Prometheus remote write protocol."""
        if not samples:
            return

        remote_samples = [
            RemoteWriteSample(
                metric=s.metric,
                value=s.value,
                timestamp_ms=int(s.timestamp.timestamp() * 1000),
                labels=s.labels,
            )
            for s in samples
        ]
        self._write_client.write(remote_samples)

    def query(self, query: str, time: datetime | None = None) -> InstantQueryResult:
        """Execute an instant query."""
        params = {"query": query}
        if time is not None:
            params["time"] = str(int(time.timestamp()))

        response = self._pool.request(
            "GET",
            f"{self._base_path}/api/v1/query",
            fields=params,
        )

        if response.status != 200:
            raise RuntimeError(f"Query failed: {response.status} {response.data.decode('utf-8', errors='replace')}")

        data = json.loads(response.data.decode("utf-8"))
        return self._parse_instant_response(data)

    def query_range(
        self,
        query: str,
        start: datetime,
        end: datetime,
        step: str = "1m",
    ) -> RangeQueryResult:
        """Execute a range query."""
        params = {
            "query": query,
            "start": str(int(start.timestamp())),
            "end": str(int(end.timestamp())),
            "step": step,
        }

        response = self._pool.request(
            "GET",
            f"{self._base_path}/api/v1/query_range",
            fields=params,
        )

        if response.status != 200:
            raise RuntimeError(f"Query failed: {response.status} {response.data.decode('utf-8', errors='replace')}")

        data = json.loads(response.data.decode("utf-8"))
        return self._parse_range_response(data)

    def _parse_instant_response(self, data: dict) -> InstantQueryResult:
        """Parse VictoriaMetrics/Prometheus instant query response."""
        if data.get("status") != "success":
            error = data.get("error", "Unknown error")
            raise RuntimeError(f"Query error: {error}")

        result_type = data.get("data", {}).get("resultType", "vector")
        result = data.get("data", {}).get("result", [])

        if result_type == "scalar":
            # Scalar: [timestamp, value]
            ts, val = result
            return ScalarResult(
                timestamp=datetime.fromtimestamp(float(ts), tz=UTC),
                value=float(val),
            )

        if result_type == "vector":
            # Vector: list of {metric, value: [timestamp, value]}
            series = []
            for item in result:
                metric = item.get("metric", {})
                ts, val = item["value"]
                series.append(
                    InstantSeries(
                        metric=metric,
                        timestamp=datetime.fromtimestamp(float(ts), tz=UTC),
                        value=float(val),
                    )
                )
            return VectorResult(series=series)

        if result_type == "matrix":
            # Matrix from instant query (range selector like [5m])
            # Convert to VectorResult by taking the last value from each series
            logger.warning("Instant query returned matrix (range selector?), taking last value")
            series = []
            for item in result:
                metric = item.get("metric", {})
                values = item.get("values", [])
                if values:
                    ts, val = values[-1]
                    series.append(
                        InstantSeries(
                            metric=metric,
                            timestamp=datetime.fromtimestamp(float(ts), tz=UTC),
                            value=float(val),
                        )
                    )
            return VectorResult(series=series)

        raise RuntimeError(f"Unknown result type: {result_type}")

    def _parse_range_response(self, data: dict) -> RangeQueryResult:
        """Parse VictoriaMetrics/Prometheus range query response."""
        if data.get("status") != "success":
            error = data.get("error", "Unknown error")
            raise RuntimeError(f"Query error: {error}")

        result = data.get("data", {}).get("result", [])
        series = []

        for item in result:
            metric = item.get("metric", {})
            values = [(datetime.fromtimestamp(float(ts), tz=UTC), float(val)) for ts, val in item.get("values", [])]
            series.append(RangeSeries(metric=metric, values=values))

        return RangeQueryResult(series=series)

    def close(self) -> None:
        """Close connections."""
        self._write_client.close()
        self._pool.close()
