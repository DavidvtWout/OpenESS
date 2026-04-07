"""Rename pool phase nodes from 'pool Lx' to 'pool_lx' for consistency."""


def upgrade(conn) -> None:
    conn.execute("UPDATE nodes SET name = 'pool_l1' WHERE name = 'pool L1'")
    conn.execute("UPDATE nodes SET name = 'pool_l2' WHERE name = 'pool L2'")
    conn.execute("UPDATE nodes SET name = 'pool_l3' WHERE name = 'pool L3'")
    conn.commit()
