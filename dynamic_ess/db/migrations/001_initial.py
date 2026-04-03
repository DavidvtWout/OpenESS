"""Initial migration: day_ahead_prices table."""


def upgrade(conn) -> None:
    conn.execute("""
        CREATE TABLE IF NOT EXISTS day_ahead_prices (
            area TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            price REAL NOT NULL,
            PRIMARY KEY (area, start_time)
        )
    """)
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_prices_area_time
        ON day_ahead_prices (area, start_time, end_time)
    """)
    conn.commit()
