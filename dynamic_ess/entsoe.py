import os
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from entsoe.Market import EnergyPrices
from entsoe.utils import add_timestamps, extract_records
from pandas import DataFrame
from pydantic import BaseModel

# EIC codes and timezones for European bidding zones
# source: https://github.com/EnergieID/entsoe-py/blob/master/entsoe/mappings.py
AREAS = {
    # Western Europe
    "NL": ("10YNL----------L", "Europe/Amsterdam"),
    "BE": ("10YBE----------2", "Europe/Brussels"),
    "FR": ("10YFR-RTE------C", "Europe/Paris"),
    "DE": ("10Y1001A1001A83F", "Europe/Berlin"),
    "DE_LU": ("10Y1001A1001A82H", "Europe/Berlin"),
    "LU": ("10YLU-CEGEDEL-NQ", "Europe/Luxembourg"),
    "AT": ("10YAT-APG------L", "Europe/Vienna"),
    "CH": ("10YCH-SWISSGRIDZ", "Europe/Zurich"),
    # Northern Europe
    "DK1": ("10YDK-1--------W", "Europe/Copenhagen"),
    "DK2": ("10YDK-2--------M", "Europe/Copenhagen"),
    "NO1": ("10YNO-1--------2", "Europe/Oslo"),
    "NO2": ("10YNO-2--------T", "Europe/Oslo"),
    "NO3": ("10YNO-3--------J", "Europe/Oslo"),
    "NO4": ("10YNO-4--------9", "Europe/Oslo"),
    "NO5": ("10Y1001A1001A48H", "Europe/Oslo"),
    "SE1": ("10Y1001A1001A44P", "Europe/Stockholm"),
    "SE2": ("10Y1001A1001A45N", "Europe/Stockholm"),
    "SE3": ("10Y1001A1001A46L", "Europe/Stockholm"),
    "SE4": ("10Y1001A1001A47J", "Europe/Stockholm"),
    "FI": ("10YFI-1--------U", "Europe/Helsinki"),
    # Baltic
    "EE": ("10Y1001A1001A39I", "Europe/Tallinn"),
    "LV": ("10YLV-1001A00074", "Europe/Riga"),
    "LT": ("10YLT-1001A0008Q", "Europe/Vilnius"),
    "PL": ("10YPL-AREA-----S", "Europe/Warsaw"),
    # Southern Europe
    "ES": ("10YES-REE------0", "Europe/Madrid"),
    "PT": ("10YPT-REN------W", "Europe/Lisbon"),
    "IT_NORD": ("10Y1001A1001A73I", "Europe/Rome"),
    "IT_CNOR": ("10Y1001A1001A70O", "Europe/Rome"),
    "IT_CSUD": ("10Y1001A1001A71M", "Europe/Rome"),
    "IT_SUD": ("10Y1001A1001A788", "Europe/Rome"),
    "IT_SICI": ("10Y1001A1001A75E", "Europe/Rome"),
    "IT_SARD": ("10Y1001A1001A74G", "Europe/Rome"),
    "GR": ("10YGR-HTSO-----Y", "Europe/Athens"),
    # Central/Eastern Europe
    "CZ": ("10YCZ-CEPS-----N", "Europe/Prague"),
    "SK": ("10YSK-SEPS-----K", "Europe/Bratislava"),
    "HU": ("10YHU-MAVIR----U", "Europe/Budapest"),
    "RO": ("10YRO-TEL------P", "Europe/Bucharest"),
    "BG": ("10YCA-BULGARIA-R", "Europe/Sofia"),
    "SI": ("10YSI-ELES-----O", "Europe/Ljubljana"),
    "HR": ("10YHR-HEP------M", "Europe/Zagreb"),
    "RS": ("10YCS-SERBIATSOV", "Europe/Belgrade"),
    # UK & Ireland
    "GB": ("10YGB----------A", "Europe/London"),
    "IE_SEM": ("10Y1001A1001A59C", "Europe/Dublin"),
}


class EntsoeConfig(BaseModel):
    api_key: str = os.environ.get("ENTSOE_API")
    area: str


class EntsoeClient:
    def __init__(self, config: EntsoeConfig):
        if config.area not in AREAS:
            raise ValueError(f"Unknown area code: '{config.area}'")

        self._eic_code, tz_name = AREAS[config.area]
        self._tz = ZoneInfo(tz_name)

        self._api_key = config.api_key
        os.environ["ENTSOE_API"] = config.api_key

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
