import logging
import sqlite3
from datetime import datetime
from pathlib import Path

logger = logging.getLogger(__name__)


class Database:
    def __init__(self, db_path: Path):
        db_path.parent.mkdir(parents=True, exist_ok=True)
        self._conn = sqlite3.connect(db_path)
        self._conn.row_factory = sqlite3.Row
        self._create_tables()

    def _create_tables(self):
        self._conn.execute("""
            CREATE TABLE IF NOT EXISTS day_ahead_prices (
                area TEXT NOT NULL,
                start_time TEXT NOT NULL,
                end_time TEXT NOT NULL,
                price REAL NOT NULL,
                PRIMARY KEY (area, start_time)
            )
        """)
        self._conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_prices_area_time
            ON day_ahead_prices (area, start_time, end_time)
        """)
        self._conn.commit()

    def close(self):
        self._conn.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

    def insert_price(
        self,
        area: str,
        start_time: datetime,
        end_time: datetime,
        price: float,
    ) -> None:
        self._conn.execute(
            """
            INSERT INTO day_ahead_prices (area, start_time, end_time, price)
            VALUES (?, ?, ?, ?)
            ON CONFLICT (area, start_time) DO UPDATE SET
                end_time = excluded.end_time,
                price = excluded.price
            """,
            (area, start_time.isoformat(), end_time.isoformat(), price),
        )
        self._conn.commit()

    def insert_prices(
        self,
        area: str,
        prices: list[tuple[datetime, datetime, float]],
    ) -> None:
        self._conn.executemany(
            """
            INSERT INTO day_ahead_prices (area, start_time, end_time, price)
            VALUES (?, ?, ?, ?)
            ON CONFLICT (area, start_time) DO UPDATE SET
                end_time = excluded.end_time,
                price = excluded.price
            """,
            [
                (area, start.isoformat(), end.isoformat(), price)
                for start, end, price in prices
            ],
        )
        self._conn.commit()
        logger.debug(f"Inserted {len(prices)} price records")

    def get_prices(
        self,
        area: str,
        start: datetime,
        end: datetime,
    ) -> list[tuple[datetime, datetime, float]]:
        cursor = self._conn.execute(
            """
            SELECT start_time, end_time, price
            FROM day_ahead_prices
            WHERE area = ? AND start_time >= ? AND start_time < ?
            ORDER BY start_time
            """,
            (area, start.isoformat(), end.isoformat()),
        )
        return [
            (
                datetime.fromisoformat(row["start_time"]),
                datetime.fromisoformat(row["end_time"]),
                row["price"],
            )
            for row in cursor.fetchall()
        ]

    def get_latest_price_time(self, area: str) -> datetime | None:
        cursor = self._conn.execute(
            """
            SELECT MAX(end_time) as latest
            FROM day_ahead_prices
            WHERE area = ?
            """,
            (area,),
        )
        row = cursor.fetchone()
        if row and row["latest"]:
            return datetime.fromisoformat(row["latest"])
        return None
