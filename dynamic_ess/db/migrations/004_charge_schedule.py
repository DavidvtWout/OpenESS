"""Charge schedule table and hourly prices view."""


def upgrade(conn) -> None:
    # Mutable schedule table - only current/future entries
    conn.execute("""
        CREATE TABLE charge_schedule (
            start_time INTEGER NOT NULL PRIMARY KEY,
            end_time INTEGER NOT NULL,
            power INTEGER NOT NULL,
            expected_soc INTEGER NOT NULL
        )
    """)
    conn.execute("CREATE INDEX idx_schedule_end ON charge_schedule (end_time)")

    # Hourly aggregated prices view
    # Buckets 15-min prices into hours, returns average price in EUR/kWh
    conn.execute("""
        CREATE VIEW hourly_prices AS
        SELECT
            area,
            (start_time / 3600000) * 3600000 AS hour,
            AVG(price) / 1000.0 AS price
        FROM day_ahead_prices
        GROUP BY area, hour
    """)

    conn.commit()
