from pathlib import Path

from dynamic_ess.db import Database

# Global database instance (simple approach for now)
_database: Database | None = None


def init_database(db_path: Path) -> None:
    """Initialize the global database connection."""
    global _database
    _database = Database(db_path)


def get_database() -> Database:
    """Get the global database instance."""
    if _database is None:
        raise RuntimeError("Database not initialized. Call init_database() first.")
    return _database


def close_database() -> None:
    """Close the global database connection."""
    global _database
    if _database is not None:
        _database.close()
        _database = None
