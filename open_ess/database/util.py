from datetime import datetime, timezone


def dt_to_ms(dt: datetime) -> int:
    """UTC datetime to Unix milliseconds."""
    return int(dt.timestamp() * 1000)


def ms_to_dt(ms: int) -> datetime:
    """Unix milliseconds to UTC datetime."""
    return datetime.fromtimestamp(ms / 1000, tz=timezone.utc)


def base_conditions(
    label: str,
    start: datetime | None,
    end: datetime | None,
    label_name: str = "label",
    timestamp_name: str = "timestamp",
) -> tuple[list[str], list[str | int]]:
    conditions = [f"{label_name} = ?"]
    params: list = [label]
    if start is not None:
        conditions.append(f"{timestamp_name} >= ?")
        params.append(dt_to_ms(start))
    if end is not None:
        conditions.append(f"{timestamp_name} < ?")
        params.append(dt_to_ms(end))
    return conditions, params
