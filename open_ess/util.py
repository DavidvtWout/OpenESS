import logging
from datetime import datetime, timedelta, timezone

import matplotlib.pyplot as plt

from open_ess.database import Database

logger = logging.getLogger(__name__)


def plot_energy_prices(db: Database, area: str):
    now = datetime.now(timezone.utc)
    start = now - timedelta(days=28)
    end = now + timedelta(days=2)

    prices = db.get_prices(area, start, end)
    if not prices:
        logger.warning(f"No prices found for {area} between {start} and {end}")
        return

    # Group prices by week (Monday-based)
    weeks: dict[tuple[int, int], tuple[list[float], list[float]]] = {}
    for start_time, _, price in prices:
        # Find the Monday of this week
        days_since_monday = start_time.weekday()
        week_start = (start_time - timedelta(days=days_since_monday)).replace(hour=0, minute=0, second=0, microsecond=0)
        iso_year, iso_week, _ = week_start.isocalendar()
        week_key = (iso_year, iso_week)

        # Hours since Monday 00:00
        hours_offset = (start_time - week_start).total_seconds() / 3600

        if week_key not in weeks:
            weeks[week_key] = ([], [])
        weeks[week_key][0].append(hours_offset)
        weeks[week_key][1].append(price)

    plt.figure(figsize=(12, 6))
    for (year, week), (hours, values) in sorted(weeks.items()):
        plt.step(hours, values, where="post", label=f"{year} W{week}")

    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    plt.xticks(ticks=[i * 24 for i in range(7)], labels=day_names)
    plt.ylabel("Price (EUR/MWh)")
    plt.title(f"Day-Ahead Energy Prices - {area}")
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.show()
