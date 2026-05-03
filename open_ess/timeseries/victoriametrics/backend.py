"""VictoriaMetrics timeseries backend implementation."""

import json
import logging
from datetime import datetime

from urllib3 import HTTPConnectionPool, HTTPSConnectionPool
from urllib3.util import parse_url

from ..base import QueryResult, QueryResultSeries, Sample, TimeseriesBackend
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

        self._job = config.job

    def write(self, samples: list[Sample]) -> None:
        """Write samples using Prometheus remote write protocol."""
        if not samples:
            return

        remote_samples = [
            RemoteWriteSample(
                metric=s.metric,
                value=s.value,
                timestamp_ms=int(s.timestamp.timestamp() * 1000),
                labels={"job": self._job, **s.labels},
            )
            for s in samples
        ]
        self._write_client.write(remote_samples)

    def query(self, query: str, time: datetime | None = None) -> QueryResult:
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
            raise RuntimeError(
                f"Query failed: {response.status} {response.data.decode('utf-8', errors='replace')}"
            )

        data = json.loads(response.data.decode("utf-8"))
        return self._parse_response(data)

    def query_range(
        self,
        query: str,
        start: datetime,
        end: datetime,
        step: str = "1m",
    ) -> QueryResult:
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
            raise RuntimeError(
                f"Query failed: {response.status} {response.data.decode('utf-8', errors='replace')}"
            )

        data = json.loads(response.data.decode("utf-8"))
        return self._parse_response(data)

    def _parse_response(self, data: dict) -> QueryResult:
        """Parse VictoriaMetrics/Prometheus API response."""
        if data.get("status") != "success":
            error = data.get("error", "Unknown error")
            raise RuntimeError(f"Query error: {error}")

        result = data.get("data", {}).get("result", [])
        series_list = []

        for item in result:
            metric = item.get("metric", {})

            # Handle both instant query (value) and range query (values)
            if "value" in item:
                # Instant query: [timestamp, value]
                ts, val = item["value"]
                values = [(datetime.fromtimestamp(float(ts)), float(val))]
            elif "values" in item:
                # Range query: [[timestamp, value], ...]
                values = [
                    (datetime.fromtimestamp(float(ts)), float(val))
                    for ts, val in item["values"]
                ]
            else:
                values = []

            series_list.append(QueryResultSeries(metric=metric, values=values))

        return QueryResult(series=series_list)

    def close(self) -> None:
        """Close connections."""
        self._write_client.close()
        self._pool.close()
