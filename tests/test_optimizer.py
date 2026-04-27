from collections.abc import Generator

import pytest

from open_ess.optimizer import Optimizer


@pytest.fixture
def optimizer() -> Generator[Optimizer, None, None]:
    optimizer = Optimizer(None, None, None)  # type: ignore[arg-type]
    yield optimizer


class TestOptimizer:
    def test(self) -> None:
        """"""
        pytest.skip("TODO: Implement test")

    def test_no_data(self) -> None:
        """"""
        pytest.skip("TODO: Implement test")
