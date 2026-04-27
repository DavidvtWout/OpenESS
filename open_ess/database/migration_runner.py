import logging
from datetime import UTC, datetime
from importlib import import_module
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .database import DatabaseConnection

MIGRATIONS_DIR = Path(__file__).parent / "migrations"

logger = logging.getLogger(__name__)


def get_migrations() -> list[tuple[int, str]]:
    """Discover all migration files in the migrations directory.

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


def run_migration(version: int, module_name: str, conn: "DatabaseConnection") -> None:
    """Run a single migration.

    Args:
        version: Migration version number
        module_name: Full module name to import
        conn: SQLite connection
    """
    module = import_module(module_name)
    module.upgrade(conn)


def run_migrations(conn: "DatabaseConnection") -> None:
    conn.execute("""
                CREATE TABLE IF NOT EXISTS schema_version (
                    version INTEGER PRIMARY KEY,
                    applied_at TEXT NOT NULL
                )
            """)
    conn.commit()

    cursor = conn.execute("SELECT MAX(version) as version FROM schema_version")
    row = cursor.fetchone()
    current_version = row["version"] or 0

    for version, module_name in get_migrations():
        if version > current_version:
            logger.info(f"Running migration {version}: {module_name}")
            run_migration(version, module_name, conn)
            conn.execute(
                "INSERT INTO schema_version (version, applied_at) VALUES (?, ?)",
                (version, datetime.now(UTC)),
            )
            conn.commit()
            logger.info(f"Migration {version} complete")
