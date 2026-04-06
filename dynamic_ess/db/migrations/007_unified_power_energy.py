"""Unified power and energy flow tables with flexible node structure."""


def upgrade(conn) -> None:
    # Nodes represent logical points in the energy system
    conn.execute("""
        CREATE TABLE nodes (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            type TEXT NOT NULL,
            phase INTEGER,
            CHECK (phase IS NULL OR phase IN (1, 2, 3))
        )
    """)

    # Power flows between nodes (canonical ordering: node_a < node_b)
    # Positive power = flow from node_a to node_b
    # Negative power = flow from node_b to node_a
    conn.execute("""
        CREATE TABLE power_flows (
            start_time INTEGER NOT NULL,
            end_time INTEGER,
            sample_count INTEGER,
            node_a INTEGER NOT NULL,
            node_b INTEGER NOT NULL,
            power REAL NOT NULL,
            PRIMARY KEY (start_time, node_a, node_b),
            FOREIGN KEY (node_a) REFERENCES nodes(id),
            FOREIGN KEY (node_b) REFERENCES nodes(id)
        )
    """)
    conn.execute("CREATE INDEX idx_power_flows_nodes ON power_flows(node_a, node_b, start_time)")

    # Energy flows between nodes
    conn.execute("""
        CREATE TABLE energy_flows (
            timestamp INTEGER NOT NULL,
            node_a INTEGER NOT NULL,
            node_b INTEGER NOT NULL,
            energy REAL NOT NULL,
            PRIMARY KEY (timestamp, node_a, node_b),
            FOREIGN KEY (node_a) REFERENCES nodes(id),
            FOREIGN KEY (node_b) REFERENCES nodes(id)
        )
    """)
    conn.execute("CREATE INDEX idx_energy_flows_nodes ON energy_flows(node_a, node_b, timestamp)")

    conn.commit()
