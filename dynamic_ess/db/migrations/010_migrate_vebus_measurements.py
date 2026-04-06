"""Migrate vebus_measurements, system_measurements, and system_battery to new tables."""


def upgrade(conn) -> None:
    # Get pool node id
    cursor = conn.execute("SELECT id FROM nodes WHERE name = 'pool'")
    row = cursor.fetchone()
    if not row:
        return  # No pool node, nothing to migrate
    pool_id = row[0]

    # Create nodes for system_measurements
    conn.execute("INSERT OR IGNORE INTO nodes (name, type, phase) VALUES ('grid', 'grid', NULL)")
    conn.execute("INSERT OR IGNORE INTO nodes (name, type, phase) VALUES ('grid_l1', 'grid', 1)")
    conn.execute("INSERT OR IGNORE INTO nodes (name, type, phase) VALUES ('grid_l2', 'grid', 2)")
    conn.execute("INSERT OR IGNORE INTO nodes (name, type, phase) VALUES ('grid_l3', 'grid', 3)")

    # grid_power per phase: grid Lx → pool Lx
    for phase in [1, 2, 3]:
        cursor = conn.execute("SELECT id FROM nodes WHERE name = ?", (f"grid_l{phase}",))
        phase_grid_id = cursor.fetchone()[0]

        cursor = conn.execute("SELECT id FROM nodes WHERE name = ?", (f"pool L{phase}",))
        phase_pool_id = cursor.fetchone()[0]

        conn.execute(
            """
            INSERT INTO power_flows (start_time, end_time, sample_count, node_a, node_b, power)
            SELECT
                timestamp,
                end_timestamp,
                sample_count,
                ?,
                ?,
                grid_power
            FROM system_measurements
            WHERE grid_power IS NOT NULL
              AND grid_power != 0
              AND phase = ?
            """,
            (phase_grid_id, phase_pool_id, phase),
        )

    # Find all unique modbus_ids in vebus_measurements
    cursor = conn.execute("SELECT DISTINCT modbus_id FROM vebus_measurements")
    modbus_ids = [row[0] for row in cursor.fetchall()]

    for modbus_id in modbus_ids:
        # Get node IDs for this MultiPlus (created in migration 008)
        cursor = conn.execute("SELECT id FROM nodes WHERE name = ?", (f"mp_{modbus_id}_ac_in1",))
        row = cursor.fetchone()
        if not row:
            continue
        ac_in1_id = row[0]

        cursor = conn.execute("SELECT id FROM nodes WHERE name = ?", (f"mp_{modbus_id}_ac_out",))
        row = cursor.fetchone()
        if not row:
            continue
        ac_out_id = row[0]

        # Migrate ac_input_power: pool → ac_in1
        # Sum across phases, group by timestamp
        conn.execute(
            """
            INSERT INTO power_flows (start_time, end_time, sample_count, node_a, node_b, power)
            SELECT
                timestamp,
                end_timestamp,
                sample_count,
                ?,
                ?,
                SUM(ac_input_power)
            FROM vebus_measurements
            WHERE modbus_id = ?
              AND ac_input_power IS NOT NULL
            GROUP BY timestamp
            HAVING SUM(ac_input_power) != 0
            """,
            (pool_id, ac_in1_id, modbus_id),
        )

        # Migrate ac_output_power: pool → ac_out
        conn.execute(
            """
            INSERT INTO power_flows (start_time, end_time, sample_count, node_a, node_b, power)
            SELECT
                timestamp,
                end_timestamp,
                sample_count,
                ?,
                ?,
                SUM(ac_output_power)
            FROM vebus_measurements
            WHERE modbus_id = ?
              AND ac_output_power IS NOT NULL
            GROUP BY timestamp
            HAVING SUM(ac_output_power) != 0
            """,
            (pool_id, ac_out_id, modbus_id),
        )

    # Create nodes for system_battery migration
    conn.execute("INSERT OR IGNORE INTO nodes (name, type, phase) VALUES ('battery', 'battery', NULL)")
    conn.execute("INSERT OR IGNORE INTO nodes (name, type, phase) VALUES ('mp_228', 'multiplus', NULL)")

    cursor = conn.execute("SELECT id FROM nodes WHERE name = 'battery'")
    battery_id = cursor.fetchone()[0]

    cursor = conn.execute("SELECT id FROM nodes WHERE name = 'mp_228'")
    multiplus_id = cursor.fetchone()[0]

    # Migrate battery_power: multiplus → battery
    conn.execute(
        """
        INSERT INTO power_flows (start_time, end_time, sample_count, node_a, node_b, power)
        SELECT
            timestamp,
            end_timestamp,
            sample_count,
            ?,
            ?,
            battery_power
        FROM system_battery
        WHERE battery_power IS NOT NULL
          AND battery_power != 0
        """,
        (multiplus_id, battery_id),
    )

    # Migrate inverter_charger_power: pool → multiplus
    conn.execute(
        """
        INSERT INTO power_flows (start_time, end_time, sample_count, node_a, node_b, power)
        SELECT
            timestamp,
            end_timestamp,
            sample_count,
            ?,
            ?,
            inverter_charger_power
        FROM system_battery
        WHERE inverter_charger_power IS NOT NULL
          AND inverter_charger_power != 0
        """,
        (pool_id, multiplus_id),
    )

    # Create battery_soc table
    conn.execute("""
        CREATE TABLE IF NOT EXISTS battery_soc (
            timestamp INTEGER PRIMARY KEY,
            soc INTEGER NOT NULL
        )
        """)

    # Migrate battery_soc with deduplication (only insert when soc changes)
    conn.execute("""
        INSERT INTO battery_soc (timestamp, soc)
        SELECT timestamp, CAST(battery_soc AS INTEGER) as soc
        FROM system_battery
        WHERE battery_soc IS NOT NULL
          AND CAST(battery_soc AS INTEGER) != COALESCE(
              (SELECT CAST(battery_soc AS INTEGER) FROM system_battery sb2
               WHERE sb2.timestamp < system_battery.timestamp
               ORDER BY sb2.timestamp DESC LIMIT 1),
              -1
          )
        """)

    # Drop old tables
    conn.execute("DROP TABLE IF EXISTS vebus_measurements")
    conn.execute("DROP TABLE IF EXISTS system_measurements")
    conn.execute("DROP TABLE IF EXISTS system_battery")

    conn.commit()
