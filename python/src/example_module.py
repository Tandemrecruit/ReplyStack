"""Example ML/AI utility functions."""

from __future__ import annotations


def normalize(values: list[float]) -> list[float]:
    """Return values scaled to 0-1 range; empty list returns empty list."""
    if not values:
        return []
    min_val = min(values)
    max_val = max(values)
    if max_val == min_val:
        return [0.0 for _ in values]
    span = max_val - min_val
    return [(v - min_val) / span for v in values]


