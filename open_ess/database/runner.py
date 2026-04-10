"""Migration runner for OpenESS."""

from importlib import import_module
from pathlib import Path

MIGRATIONS_DIR = Path(__file__).parent / "migrations"


def get_migrations() -> list[tuple[int, str]]:
    """
    Discover all migration files in the migrations directory.

    Returns:
        List of (version, module_name) tuples, sorted by version.
    """
    migrations = []
    for file in MIGRATIONS_DIR.glob("*.py"):
        if file.name.startswith("_"):
            continue
        # Parse version from filename like "001_initial.py"
        parts = file.stem.split("_", 1)
        if len(parts) >= 1 and parts[0].isdigit():
            version = int(parts[0])
            module_name = f"open_ess.database.migrations.{file.stem}"
            migrations.append((version, module_name))
    return sorted(migrations)


def run_migration(version: int, module_name: str, conn) -> None:
    """
    Run a single migration.

    Args:
        version: Migration version number
        module_name: Full module name to import
        conn: SQLite connection
    """
    module = import_module(module_name)
    module.upgrade(conn)
