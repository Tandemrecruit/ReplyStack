"""Example ML/AI utility functions."""

from __future__ import annotations


def normalize(values: list[float]) -> list[float]:
    """
    Scale numeric values into the range 0.0 to 1.0.
    
    If `values` is empty, returns an empty list. If all items in `values` are equal, returns a list of `0.0` values with the same length.
    
    Returns:
        list[float]: Each input mapped so the minimum value becomes `0.0` and the maximum value becomes `1.0`; intermediate values are linearly scaled.
    """
    if not values:
        return []
    min_val = min(values)
    max_val = max(values)
    if max_val == min_val:
        return [0.0 for _ in values]
    span = max_val - min_val
    return [(v - min_val) / span for v in values]

