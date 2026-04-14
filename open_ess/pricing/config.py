"""Price configuration including market data source and buy/sell formulas."""

import logging
import os
from pathlib import Path
from typing import Callable

from pydantic import BaseModel, model_validator

from .formula import compile_formula, FormulaError

logger = logging.getLogger(__name__)


class PriceConfig(BaseModel):
    """Configuration for electricity prices.

    Attributes:
        area: ENTSO-E bidding zone code (e.g., "NL", "DE_LU", "BE")
        entsoe_api_key: Direct API key value
        entsoe_api_key_file: Path to file containing API key
        buy_formula: Formula to calculate buy price from market price (EUR/kWh)
        sell_formula: Formula to calculate sell price from market price (EUR/kWh)

    The formulas use 'price' or 'p' as the market price variable.
    Example: "(price + 0.05) * 1.21" adds €0.05/kWh and 21% VAT
    """

    area: str
    hourly_average: bool = True

    entsoe_api_key: str | None = None
    entsoe_api_key_file: Path | None = None

    # Default formulas: pass-through (no markup)
    buy_formula: str = "price"
    sell_formula: str = "price"

    # Compiled formula functions (not serialized)
    _buy_fn: Callable[[float], float] | None = None
    _sell_fn: Callable[[float], float] | None = None

    class Config:
        arbitrary_types_allowed = True

    @property
    def aggregate_minutes(self) -> int:
        return 60 if self.hourly_average else 15

    @model_validator(mode="after")
    def resolve_and_validate(self) -> "PriceConfig":
        """Resolve API key and compile formulas."""
        # Resolve API key
        if not self.entsoe_api_key:
            if self.entsoe_api_key_file:
                logger.info(f"Reading ENTSO-E API key from {self.entsoe_api_key_file}")
                self.entsoe_api_key = self.entsoe_api_key_file.read_text().strip()
            else:
                env_key = os.environ.get("ENTSOE_API")
                if env_key:
                    self.entsoe_api_key = env_key
                else:
                    raise ValueError(
                        "ENTSO-E API key not configured. "
                        "Provide entsoe_api_key, entsoe_api_key_file, or set ENTSOE_API environment variable."
                    )

        # Compile formulas
        try:
            self._buy_fn = compile_formula(self.buy_formula)
        except FormulaError as e:
            raise ValueError(f"Invalid buy_formula: {e}")

        try:
            self._sell_fn = compile_formula(self.sell_formula)
        except FormulaError as e:
            raise ValueError(f"Invalid sell_formula: {e}")

        return self

    def buy_price(self, market_price: float) -> float:
        """Calculate buy price from market price."""
        if self._buy_fn is None:
            self._buy_fn = compile_formula(self.buy_formula)
        return self._buy_fn(market_price)

    def sell_price(self, market_price: float) -> float:
        """Calculate sell price from market price."""
        if self._sell_fn is None:
            self._sell_fn = compile_formula(self.sell_formula)
        return self._sell_fn(market_price)
