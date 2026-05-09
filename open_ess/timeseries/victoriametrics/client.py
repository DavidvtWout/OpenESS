"""Prometheus remote write client for VictoriaMetrics and Prometheus."""

import logging
import time
from dataclasses import dataclass, field

import snappy
from urllib3 import HTTPConnectionPool, HTTPSConnectionPool
from urllib3.util import parse_url

from .protobuf import encode_timeseries, encode_write_request

logger = logging.getLogger(__name__)


@dataclass
class Sample:
    """A single metric sample."""

    metric: str
    value: float
    timestamp_ms: int
    labels: dict[str, str] = field(default_factory=dict)

    def to_labels(self) -> list[tuple[str, str]]:
        """Convert to list of label tuples including __name__."""
        return [("__name__", self.metric), *self.labels.items()]


class RemoteWriteError(Exception):
    """Error during remote write."""

    pass


class RemoteWriteClient:
    """Client for Prometheus remote write protocol.

    Sends metrics to VictoriaMetrics or Prometheus using the remote write
    protocol (protobuf + snappy compression).
    """

    def __init__(
        self,
        url: str,
        *,
        username: str | None = None,
        password: str | None = None,
        timeout: float = 30.0,
    ):
        """Initialize the remote write client.

        Args:
            url: Remote write endpoint URL (e.g., "http://localhost:8428/api/v1/write")
            username: Optional username for basic auth
            password: Optional password for basic auth
            timeout: Request timeout in seconds
        """
        self.url = url
        self.timeout = timeout

        parsed = parse_url(url)
        self._path = parsed.path or "/api/v1/write"
        self._host = parsed.host
        self._port = parsed.port

        # Set up connection pool
        pool_cls = HTTPSConnectionPool if parsed.scheme == "https" else HTTPConnectionPool
        pool_kwargs: dict = {
            "host": self._host,
            "port": self._port,
            "timeout": timeout,
            "maxsize": 1,
            "block": True,
        }
        if username and password:
            pool_kwargs["headers"] = {"Authorization": f"Basic {self._encode_basic_auth(username, password)}"}
        self._pool = pool_cls(**pool_kwargs)

    @staticmethod
    def _encode_basic_auth(username: str, password: str) -> str:
        """Encode credentials for basic auth header."""
        import base64

        credentials = f"{username}:{password}".encode()
        return base64.b64encode(credentials).decode("ascii")

    def write(self, samples: list[Sample]) -> None:
        """Write a batch of samples.

        Args:
            samples: List of samples to write.

        Raises:
            RemoteWriteError: If the write fails.
        """
        if not samples:
            return

        # Group samples by metric+labels to create timeseries
        timeseries_map: dict[tuple, list[tuple[float, int]]] = {}
        for sample in samples:
            key = tuple(sorted(sample.to_labels()))
            if key not in timeseries_map:
                timeseries_map[key] = []
            timeseries_map[key].append((sample.value, sample.timestamp_ms))

        # Encode timeseries
        encoded_timeseries = []
        for labels_tuple, sample_list in timeseries_map.items():
            labels = list(labels_tuple)
            # Sort samples by timestamp as required by spec
            sample_list.sort(key=lambda x: x[1])
            encoded_timeseries.append(encode_timeseries(labels, sample_list))

        # Encode write request and compress
        write_request = encode_write_request(encoded_timeseries)
        compressed = snappy.compress(write_request)

        # Send request
        headers = {
            "Content-Type": "application/x-protobuf",
            "Content-Encoding": "snappy",
            "X-Prometheus-Remote-Write-Version": "0.1.0",
            "User-Agent": "OpenESS/1.0",
        }

        response = self._pool.urlopen(
            "POST",
            self._path,
            body=compressed,
            headers=headers,
        )

        if response.status >= 400:
            raise RemoteWriteError(
                f"Remote write failed: {response.status} {response.data.decode('utf-8', errors='replace')}"
            )

        logger.debug(f"Wrote {len(samples)} samples to {self.url}")

    def close(self) -> None:
        """Close the connection pool."""
        self._pool.close()


def timestamp_ms() -> int:
    """Get current timestamp in milliseconds."""
    return int(time.time() * 1000)
