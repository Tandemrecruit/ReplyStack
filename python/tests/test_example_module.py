"""Tests for the example_module utilities."""

from example_module import normalize


def test_normalize_empty():
    """normalize returns an empty list when given no values."""
    assert normalize([]) == []


def test_normalize_spread():
    """normalize scales a spread of values into 0..1."""
    assert normalize([0, 5, 10]) == [0.0, 0.5, 1.0]


def test_normalize_constant():
    """normalize maps identical values to zeros to avoid division by zero."""
    assert normalize([3, 3, 3]) == [0.0, 0.0, 0.0]


