from datetime import datetime
from typing import Literal

from open_ess.timeseries import TimeseriesBackend

from .areas import AREAS

PRICE_TYPES = {"market", "buy", "sell"}
PriceType = Literal["market", "buy", "sell"]


def get_prices_from_mql(
    mql_client: TimeseriesBackend, area: str, start: datetime, end: datetime, hourly=False, price: PriceType = "market"
) -> list[tuple[datetime, float]]:
    """Prices are returned in currency per Kwh (usually €/kWh)."""

    # Validate area and price to prevent MetricsQL injection.
    if area not in AREAS:
        raise ValueError(f"Unknown area code: '{area}'")
    if price not in PRICE_TYPES:
        raise ValueError(f"Unknown price type: '{price}'")

    if hourly:
        query = f'avg_over_time(openess_prices{{area="{area}", price="{price}"}}[1h])'
        step = "1h"
    else:
        query = f'openess_prices{{area="{area}", price="{price}"}}'
        step = "15m"
    result = mql_client.query_range(query, start, end, step)

    if not result.series:
        return []
    return list(result.series[0].values)
