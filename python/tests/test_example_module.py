from example_module import normalize


def test_normalize_empty():
    assert normalize([]) == []


def test_normalize_spread():
    assert normalize([0, 5, 10]) == [0.0, 0.5, 1.0]


def test_normalize_constant():
    assert normalize([3, 3, 3]) == [0.0, 0.0, 0.0]


