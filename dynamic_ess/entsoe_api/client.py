import logging
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from entsoe import set_config
from entsoe.Market import EnergyPrices
from entsoe.utils import add_timestamps, extract_records
from pandas import DataFrame

from .areas import AREAS
from .config import EntsoeConfig

logger = logging.getLogger(__name__)


class EntsoeClient:
    def __init__(self, config: EntsoeConfig):
        if config.area not in AREAS:
            raise ValueError(f"Unknown area code: '{config.area}'")

        self._eic_code, tz_name = AREAS[config.area]
        self._tz = ZoneInfo(tz_name)

        if config.api_key:
            set_config(config.api_key)

    def fetch_day_ahead_prices(
            self,
            start: datetime,
            end: datetime,
    ) -> list[tuple[datetime, datetime, float]]:
        """
        Fetch day-ahead prices from ENTSO-E for a given area and time range.

        Args:
            start: Start datetime (UTC)
            end: End datetime (UTC)

        Returns:
            List of (start_time, end_time, price) tuples with prices in EUR/MWh
        """

        # ENTSO-E expects timestamps formatted as YYYYMMDDhhmm in the area's local timezone
        start_local = start.astimezone(self._tz)
        end_local = end.astimezone(self._tz)

        period_start = int(start_local.strftime("%Y%m%d%H%M"))
        period_end = int(end_local.strftime("%Y%m%d%H%M"))

        result = EnergyPrices(
            in_domain=self._eic_code,
            out_domain=self._eic_code,
            period_start=period_start,
            period_end=period_end,
        ).query_api()

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
            price = float(row["time_series.period.point.price_amount"])
            prices.append((row_start, row_end, price))
        return prices


def _parse_resolution(resolution: str) -> int:
    """Parse to minutes. E.g., 'PT60M' -> 60, 'PT15M' -> 15."""
    if resolution.startswith("PT") and resolution.endswith("M"):
        return int(resolution[2:-1])
    elif resolution.startswith("PT") and resolution.endswith("H"):
        return int(resolution[2:-1]) * 60
    return 60
