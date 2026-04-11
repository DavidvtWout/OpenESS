from open_ess.database import Database, DatabaseConfig
from open_ess.pricing import PriceConfig

# Global instances (simple approach for now)
_database: Database | None = None
_price_config: PriceConfig | None = None


def init_dependencies(db_config: DatabaseConfig, price_config: PriceConfig) -> None:
    """Initialize global dependencies."""
    global _database, _price_config
    _database = Database(db_config)
    _price_config = price_config


def get_database() -> Database:
    """Get the global database instance."""
    if _database is None:
        raise RuntimeError("Database not initialized. Call init_dependencies() first.")
    return _database


def get_price_config() -> PriceConfig:
    """Get the global price config instance."""
    if _price_config is None:
        raise RuntimeError("Price config not initialized. Call init_dependencies() first.")
    return _price_config


def close_dependencies() -> None:
    """Close global connections."""
    global _database, _price_config
    if _database is not None:
        _database.close()
        _database = None
    _price_config = None
