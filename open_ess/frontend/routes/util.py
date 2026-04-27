from collections.abc import Iterable
from datetime import datetime

from pydantic import BaseModel


class TimeSeries(BaseModel):
    timestamps: list[datetime]
    values: list[float]


def data_to_timeseries(data: Iterable[tuple[datetime, float]], rounding: int | None = None) -> TimeSeries:
    timestamps = []
    values = []
    for t, v in data:
        timestamps.append(t)
        if rounding is not None:
            values.append(round(v, rounding))
        else:
            values.append(v)
    return TimeSeries(timestamps=timestamps, values=values)


def find_full_battery_cycles(
    battery_soc: list[tuple[datetime, float]], full_threshold=99, min_soc_swing=10
) -> list[tuple[datetime, datetime, int]]:
    """Very simple algorithm to find battery cycles from full -> lower -> full.
    Only the start and end timestamps and min SoC for the cycles are returned.
    """
    cycles = []
    soc_start_ts = None
    soc_swing_reached = False
    min_soc = 100
    for timestamp, soc in battery_soc:
        min_soc = min(soc, min_soc)
        if soc >= full_threshold:
            if soc_start_ts is not None:
                if soc_swing_reached:
                    cycles.append((soc_start_ts, timestamp, min_soc))
                soc_start_ts = None
                min_soc = 100
                soc_swing_reached = False
        else:
            if soc_start_ts is None:
                soc_start_ts = timestamp
        if soc <= full_threshold - min_soc_swing:
            soc_swing_reached = True
    return cycles


def find_battery_cycles(
    rows: list[tuple[int, float]],
    start: int,
    end: int,
    min_soc_swing: int,
) -> list[dict]:
    """Find battery cycles using divide-and-conquer.

    The problem is somewhat similar to the "Trapping Rain Water" problem (see https://leetcode.com/problems/trapping-rain-water).
    Except that the cut-off isn't always at 100% battery. This algorithm also finds smaller cycles.
    """
    if end - start < 3:
        return []

    min_idx = start
    min_soc = rows[start][1]
    for i in range(start + 1, end):
        if rows[i][1] < min_soc:
            min_soc = rows[i][1]
            min_idx = i

    left_peak_idx = start
    left_peak = rows[start][1]
    for i in range(start, min_idx + 1):
        if rows[i][1] > left_peak:
            left_peak = rows[i][1]
            left_peak_idx = i

    right_peak_idx = min_idx
    right_peak = rows[min_idx][1]
    for i in range(min_idx, end):
        if rows[i][1] > right_peak:
            right_peak = rows[i][1]
            right_peak_idx = i

    effective_peak = min(left_peak, right_peak)
    swing = effective_peak - min_soc

    if swing >= min_soc_swing:
        cycle = {
            "start_idx": left_peak_idx,
            "end_idx": right_peak_idx,
            "start_ms": rows[left_peak_idx][0],
            "end_ms": rows[right_peak_idx][0],
            "min_soc": min_soc,
        }

        return [
            *find_battery_cycles(rows, start, left_peak_idx, min_soc_swing),
            cycle,
            *find_battery_cycles(rows, right_peak_idx + 1, end, min_soc_swing),
        ]
    else:
        return find_battery_cycles(rows, start, left_peak_idx, min_soc_swing) + find_battery_cycles(
            rows, right_peak_idx + 1, end, min_soc_swing
        )
