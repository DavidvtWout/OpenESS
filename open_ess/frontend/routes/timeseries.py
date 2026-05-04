"""Timeseries query proxy routes.

These routes proxy queries to the timeseries backend (VictoriaMetrics).
For MetricSQLite, the native metricsqlite.fastapi routes are used instead.
"""

from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException

from ..dependencies import TimeseriesDep

router = APIRouter()


def _parse_timestamp(value: float | str) -> datetime:
    """Parse a timestamp from float (unix seconds) or ISO string."""
    if isinstance(value, str):
        # Try parsing as ISO format
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            # Try parsing as float string
            return datetime.fromtimestamp(float(value), tz=UTC)
    return datetime.fromtimestamp(value, tz=UTC)


@router.get("/query")
async def query(
    timeseries: TimeseriesDep,
    query: str,
    time: float | str | None = None,
) -> dict:
    """Execute an instant query against the timeseries backend."""
    if timeseries is None:
        raise HTTPException(503, "Timeseries backend not configured")

    eval_time = _parse_timestamp(time) if time is not None else None
    result = timeseries.query(query, eval_time)

    return {
        "status": "success",
        "data": {
            "resultType": "vector",
            "result": [
                {
                    "metric": series.metric,
                    "value": [series.values[0][0].timestamp(), series.values[0][1]] if series.values else None,
                }
                for series in result.series
            ],
        },
    }


@router.get("/query_range")
async def query_range(
    timeseries: TimeseriesDep,
    query: str,
    start: float | str,
    end: float | str,
    step: str = "1m",
) -> dict:
    """Execute a range query against the timeseries backend."""
    if timeseries is None:
        raise HTTPException(503, "Timeseries backend not configured")

    start_time = _parse_timestamp(start)
    end_time = _parse_timestamp(end)

    result = timeseries.query_range(query, start_time, end_time, step)

    return {
        "status": "success",
        "data": {
            "resultType": "matrix",
            "result": [
                {
                    "metric": series.metric,
                    "values": [[v[0].timestamp(), str(v[1])] for v in series.values],
                }
                for series in result.series
            ],
        },
    }
