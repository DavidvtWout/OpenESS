import pytest

from open_ess.optimizer import Optimizer


@pytest.fixture
def optimizer():
    optimizer = Optimizer(None, None, None)
    yield optimizer


class TestOptimizer:
    def test(self):
        """"""
        pytest.skip("TODO: Implement test")

    def test_no_data(self):
        """"""
        pytest.skip("TODO: Implement test")
