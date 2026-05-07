import logging
from datetime import UTC, datetime, timedelta
from xml.etree import ElementTree as ET
from zoneinfo import ZoneInfo

from entsoe import set_config
from entsoe.Market import EnergyPrices
from entsoe.utils import add_timestamps, extract_records
from pandas import DataFrame

from open_ess.timeseries import Sample, TimeseriesBackend, VectorResult
from open_ess.util import ms_to_dt

from .areas import AREAS
from .config import PriceConfig

logger = logging.getLogger(__name__)


class EntsoeClient:
    def __init__(self, config: PriceConfig, mql_client: TimeseriesBackend):
        if config.area not in AREAS:
            raise ValueError(f"Unknown area code: '{config.area}'")

        self._config = config
        self._mql_client = mql_client

        if config.entsoe_api_key:
            set_config(security_token=config.entsoe_api_key)

    @staticmethod
    def fetch_day_ahead_prices(
        area: str,
        start: datetime,
        end: datetime,
    ) -> list[tuple[datetime, datetime, float]]:
        """
        Fetch day-ahead prices from ENTSO-E for a given area and time range.

        Args:
            area:
            start: Start datetime (UTC)
            end: End datetime (UTC)

        Returns:
            List of (start_time, end_time, price) tuples with prices in EUR/MWh
        """
        eic_code, tz_name = AREAS[area]
        tz = ZoneInfo(tz_name)

        # ENTSO-E expects timestamps formatted as YYYYMMDDhhmm in the area's local timezone
        start_local = start.astimezone(tz)
        end_local = end.astimezone(tz)

        period_start = int(start_local.strftime("%Y%m%d%H%M"))
        period_end = int(end_local.strftime("%Y%m%d%H%M"))

        try:
            result = EnergyPrices(
                in_domain=eic_code,
                out_domain=eic_code,
                period_start=period_start,
                period_end=period_end,
            ).query_api()
        except ET.ParseError:
            # On a 404, entsoe-apy still tries to parse the result which fails.
            # Other errors such as 503 and timeouts are retried.
            return []

        records = extract_records(result)
        records = add_timestamps(records)
        df = DataFrame(records)
        if df.empty:
            return []

        prices = []
        for _, row in df.iterrows():
            row_start = datetime.fromisoformat(row["timestamp"])
            interval_minutes = _parse_resolution(row["time_series.period.resolution"])
            row_end = row_start + timedelta(minutes=interval_minutes)
            price = float(row["time_series.period.point.price_amount"]) / 1000
            prices.append((row_start, row_end, price))
        return prices

    def fetch_missing_prices(self, area: str) -> None:
        if area not in AREAS:
            raise ValueError(f"Unknown area code: '{area}'")

        now = datetime.now(UTC)
        end_of_tomorrow = (now + timedelta(days=2)).replace(hour=0, minute=0, second=0, microsecond=0)

        result: VectorResult = self._mql_client.query(
            f'timestamp(openess_prices{{area="{area}", price="market"}}[8w])', time=end_of_tomorrow
        )
        if len(result.series) == 0:
            fetch_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            fetch_start -= timedelta(weeks=8)
        else:
            latest_ms = int(result.series[0].value) * 1000
            latest = ms_to_dt(latest_ms)
            if latest >= end_of_tomorrow:
                return
            else:
                fetch_start = latest

        logger.info(f"Fetching prices for {self._config.area} from {fetch_start} to {end_of_tomorrow}")
        prices = self.fetch_day_ahead_prices(area, fetch_start, end_of_tomorrow)
        if prices:
            self._upsert_prices(area, prices)

    def _upsert_prices(self, area: str, prices: list[tuple[datetime, datetime, float]]):
        def make_sample(_ts: datetime, _price_type: str, _price: float):
            return Sample(
                metric="openess_prices",
                labels={
                    "area": area,
                    "price": _price_type,
                },
                timestamp=_ts,
                value=_price,
            )

        samples: list[Sample] = []
        for ts_start, ts_end, price in prices:
            ts = ts_start + (ts_end - ts_start) / 2
            samples.append(make_sample(ts, "market", price))
            samples.append(make_sample(ts, "buy", self._config.buy_price(price)))
            samples.append(make_sample(ts, "sell", self._config.sell_price(price)))
        self._mql_client.write(samples)


def _parse_resolution(resolution: str) -> int:
    """Parse to minutes. E.g., 'PT60M' -> 60, 'PT15M' -> 15."""
    if resolution.startswith("PT") and resolution.endswith("M"):
        return int(resolution[2:-1])
    elif resolution.startswith("PT") and resolution.endswith("H"):
        return int(resolution[2:-1]) * 60
    return 60
