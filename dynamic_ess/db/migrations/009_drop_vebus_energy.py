"""Remove vebus_energy table after migration to energy_flows."""


def upgrade(conn) -> None:
    conn.execute("DROP TABLE IF EXISTS vebus_energy")
    conn.commit()
