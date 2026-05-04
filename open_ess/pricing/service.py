import logging

from open_ess.service import Service
from open_ess.timeseries import TimeseriesBackend

from .client import EntsoeClient
from .config import PriceConfig

logger = logging.getLogger(__name__)


class EntsoeService(Service):
    def __init__(self, mql_client: TimeseriesBackend, config: PriceConfig):
        super().__init__("EntsoeService")
        self._mql_client = mql_client
        self._config = config
        self._check_interval = 3600
        self._client: EntsoeClient | None = None

    def on_start(self) -> None:
        self._client = EntsoeClient(self._config, self._mql_client)
        self._fetch_prices()

    def tick(self) -> None:
        self._fetch_prices()

    def _fetch_prices(self) -> None:
        if self._client is None:
            return None
        try:
            self._client.fetch_missing_prices(self._config.area)
        except Exception as e:
            logger.error(f"Failed to fetch ENTSO-E prices: {e}")

    def wait_until_next(self) -> None:
        # TODO: run from 14:00
        self.wait_seconds(self._check_interval)
