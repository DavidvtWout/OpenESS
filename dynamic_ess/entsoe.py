import os
from datetime import datetime, timedelta, timezone

from entsoe.Market import EnergyPrices
from entsoe.utils import add_timestamps, extract_records
from pandas import DataFrame

AREA_CODES = {
    "NL": "10YNL----------L",
    "DE": "10Y1001A1001A83F",
    "BE": "10YBE----------2",
    "FR": "10YFR-RTE------C",
    "NO1": "10YNO-1--------2",
    "NO2": "10YNO-2--------T",
    "NO3": "10YNO-3--------J",
    "NO4": "10YNO-4--------9",
    "NO5": "10Y1001A1001A48H",
}


def set_api_key(api_key: str):
    os.environ["ENTSOE_API"] = api_key


def fetch_day_ahead_prices(
    area: str,
    start: datetime,
    end: datetime,
) -> list[tuple[datetime, datetime, float]]:
    """
    Fetch day-ahead prices from ENTSO-E for a given area and time range.

    Args:
        area: Area code (e.g., "NL", "DE") or full EIC code
        start: Start datetime (UTC)
        end: End datetime (UTC)

    Returns:
        List of (start_time, end_time, price) tuples with prices in EUR/MWh
    """
    eic_code = AREA_CODES.get(area, area)

    # Format timestamps as YYYYMMDDhhmm (ENTSO-E expects CET/CEST)
    # The API expects local time, so we convert from UTC
    cet = timezone(timedelta(hours=1))
    start_cet = start.astimezone(cet)
    end_cet = end.astimezone(cet)

    period_start = int(start_cet.strftime("%Y%m%d%H%M"))
    period_end = int(end_cet.strftime("%Y%m%d%H%M"))

    result = EnergyPrices(
        in_domain=eic_code,
        out_domain=eic_code,
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
