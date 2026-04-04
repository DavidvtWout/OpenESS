"""Add compression support for all measurement tables.

Changes:
- Drop charge_power and dc_system_power from system_battery
- Convert INT columns to REAL for better average representation
- Add end_timestamp and sample_count to all measurement tables
- Enable incremental auto_vacuum
"""


def upgrade(conn) -> None:
    # --- system_battery: drop columns, convert to REAL, add end_timestamp and sample_count ---
    conn.execute("""
        CREATE TABLE system_battery_new (
            timestamp INTEGER NOT NULL PRIMARY KEY,
            end_timestamp INTEGER,
            sample_count INTEGER NOT NULL DEFAULT 1,
            battery_power REAL,
            battery_soc REAL,
            inverter_charger_power REAL
        )
    """)
    conn.execute("""
        INSERT INTO system_battery_new (timestamp, sample_count, battery_power, battery_soc, inverter_charger_power)
        SELECT timestamp, 1, battery_power, battery_soc, inverter_charger_power
        FROM system_battery
    """)
    conn.execute("DROP TABLE system_battery")
    conn.execute("ALTER TABLE system_battery_new RENAME TO system_battery")

    # --- system_measurements: convert to REAL, add end_timestamp and sample_count ---
    conn.execute("""
        CREATE TABLE system_measurements_new (
            timestamp INTEGER NOT NULL,
            end_timestamp INTEGER,
            sample_count INTEGER NOT NULL DEFAULT 1,
            phase INTEGER NOT NULL,
            ac_consumption REAL,
            grid_power REAL,
            grid_to_multiplus REAL,
            multiplus_output REAL,
            PRIMARY KEY (timestamp, phase)
        )
    """)
    conn.execute("""
        INSERT INTO system_measurements_new (timestamp, sample_count, phase, ac_consumption, grid_power, grid_to_multiplus, multiplus_output)
        SELECT timestamp, 1, phase, ac_consumption, grid_power, grid_to_multiplus, multiplus_output
        FROM system_measurements
    """)
    conn.execute("DROP TABLE system_measurements")
    conn.execute("ALTER TABLE system_measurements_new RENAME TO system_measurements")
    conn.execute("""
        CREATE INDEX idx_system_measurements_time
        ON system_measurements (timestamp)
    """)

    # --- vebus_measurements: add end_timestamp and sample_count ---
    conn.execute("""
        CREATE TABLE vebus_measurements_new (
            timestamp INTEGER NOT NULL,
            end_timestamp INTEGER,
            sample_count INTEGER NOT NULL DEFAULT 1,
            modbus_id INTEGER NOT NULL,
            phase INTEGER NOT NULL,
            ac_input_power REAL,
            ac_output_power REAL,
            PRIMARY KEY (timestamp, modbus_id, phase)
        )
    """)
    conn.execute("""
        INSERT INTO vebus_measurements_new (timestamp, sample_count, modbus_id, phase, ac_input_power, ac_output_power)
        SELECT timestamp, 1, modbus_id, phase, ac_input_power, ac_output_power
        FROM vebus_measurements
    """)
    conn.execute("DROP TABLE vebus_measurements")
    conn.execute("ALTER TABLE vebus_measurements_new RENAME TO vebus_measurements")
    conn.execute("""
        CREATE INDEX idx_vebus_measurements_time
        ON vebus_measurements (timestamp, modbus_id)
    """)

    conn.commit()

    # Enable incremental auto_vacuum (VACUUM cannot run inside a transaction)
    conn.execute("PRAGMA auto_vacuum = INCREMENTAL")
    conn.execute("VACUUM")
