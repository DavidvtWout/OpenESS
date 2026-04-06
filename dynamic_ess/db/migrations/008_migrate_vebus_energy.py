"""Migrate vebus_energy data to the new unified energy_flows table."""


def upgrade(conn) -> None:
    # Clear existing data in new tables
    conn.execute("DELETE FROM energy_flows")
    conn.execute("DELETE FROM nodes")

    # Create pool nodes
    conn.execute("INSERT INTO nodes (name, type, phase) VALUES ('pool', 'pool', NULL)")
    conn.execute("INSERT INTO nodes (name, type, phase) VALUES ('pool L1', 'pool', 1)")
    conn.execute("INSERT INTO nodes (name, type, phase) VALUES ('pool L2', 'pool', 2)")
    conn.execute("INSERT INTO nodes (name, type, phase) VALUES ('pool L3', 'pool', 3)")

    # Get pool node id
    cursor = conn.execute("SELECT id FROM nodes WHERE name = 'pool'")
    pool_id = cursor.fetchone()[0]

    # Find all unique modbus_ids in vebus_energy
    cursor = conn.execute("SELECT DISTINCT modbus_id FROM vebus_energy")
    modbus_ids = [row[0] for row in cursor.fetchall()]

    # Create nodes for each MultiPlus and migrate its energy data
    for modbus_id in modbus_ids:
        # Create AC nodes for this MultiPlus
        conn.execute(
            "INSERT INTO nodes (name, type, phase) VALUES (?, 'multiplus', NULL)",
            (f"mp_{modbus_id}_ac_in1",),
        )
        cursor = conn.execute("SELECT last_insert_rowid()")
        ac1_id = cursor.fetchone()[0]

        conn.execute(
            "INSERT INTO nodes (name, type, phase) VALUES (?, 'multiplus', NULL)",
            (f"mp_{modbus_id}_ac_in2",),
        )
        cursor = conn.execute("SELECT last_insert_rowid()")
        ac2_id = cursor.fetchone()[0]

        conn.execute(
            "INSERT INTO nodes (name, type, phase) VALUES (?, 'multiplus', NULL)",
            (f"mp_{modbus_id}_ac_out",),
        )
        cursor = conn.execute("SELECT last_insert_rowid()")
        out_id = cursor.fetchone()[0]

        # Migrate energy data for this MultiPlus
        # Mapping follows client.py implementation:
        # - energy_ac_in1_to_ac_out: ac1 → out
        # - energy_ac_in1_to_battery: pool → ac1
        # - energy_ac_in2_to_ac_out: ac2 → out
        # - energy_ac_in2_to_battery: pool → ac2
        # - energy_ac_out_to_ac_in1: out → ac1
        # - energy_ac_out_to_ac_in2: out → ac2
        # - energy_battery_to_ac_in1: ac1 → pool
        # - energy_battery_to_ac_in2: ac2 → pool
        # - energy_battery_to_ac_out: out → pool
        # - energy_ac_out_to_battery: pool → out

        energy_mappings = [
            ("energy_ac_in1_to_ac_out", ac1_id, out_id),
            ("energy_ac_in1_to_battery", pool_id, ac1_id),
            ("energy_ac_in2_to_ac_out", ac2_id, out_id),
            ("energy_ac_in2_to_battery", pool_id, ac2_id),
            ("energy_ac_out_to_ac_in1", out_id, ac1_id),
            ("energy_ac_out_to_ac_in2", out_id, ac2_id),
            ("energy_battery_to_ac_in1", ac1_id, pool_id),
            ("energy_battery_to_ac_in2", ac2_id, pool_id),
            ("energy_battery_to_ac_out", out_id, pool_id),
            ("energy_ac_out_to_battery", pool_id, out_id),
        ]

        for column, from_id, to_id in energy_mappings:
            # Insert energy flows, skipping nulls and zeros,
            # and only inserting when value changes from previous
            conn.execute(
                f"""
                INSERT INTO energy_flows (timestamp, node_a, node_b, energy)
                SELECT timestamp, ?, ?, {column}
                FROM vebus_energy
                WHERE modbus_id = ?
                  AND {column} IS NOT NULL
                  AND {column} != 0
                  AND {column} != COALESCE(
                      (SELECT {column} FROM vebus_energy v2
                       WHERE v2.modbus_id = vebus_energy.modbus_id
                         AND v2.timestamp < vebus_energy.timestamp
                       ORDER BY v2.timestamp DESC LIMIT 1),
                      -1
                  )
                """,
                (from_id, to_id, modbus_id),
            )

    conn.commit()
