"""Victron measurement tables."""


def upgrade(conn) -> None:
    # Per-phase system measurements
    conn.execute("""
        CREATE TABLE system_measurements (
            timestamp TEXT NOT NULL,
            phase INTEGER NOT NULL,
            ac_consumption INTEGER,
            grid_power INTEGER,
            grid_to_multiplus INTEGER,
            multiplus_output INTEGER,
            PRIMARY KEY (timestamp, phase)
        )
    """)
    conn.execute("""
        CREATE INDEX idx_system_measurements_time
        ON system_measurements (timestamp)
    """)

    # System-wide battery measurements (no phase)
    conn.execute("""
        CREATE TABLE system_battery (
            timestamp TEXT NOT NULL PRIMARY KEY,
            battery_power INTEGER,
            battery_soc INTEGER,
            charger_power INTEGER,
            dc_system_power INTEGER,
            inverter_charger_power INTEGER
        )
    """)

    # Per-device, per-phase VEBus measurements
    conn.execute("""
        CREATE TABLE vebus_measurements (
            timestamp TEXT NOT NULL,
            modbus_id INTEGER NOT NULL,
            phase INTEGER NOT NULL,
            ac_input_power REAL,
            ac_output_power REAL,
            PRIMARY KEY (timestamp, modbus_id, phase)
        )
    """)
    conn.execute("""
        CREATE INDEX idx_vebus_measurements_time
        ON vebus_measurements (timestamp, modbus_id)
    """)

    # Per-device energy counters (no phase)
    conn.execute("""
        CREATE TABLE vebus_energy (
            timestamp TEXT NOT NULL,
            modbus_id INTEGER NOT NULL,
            energy_ac_in1_to_ac_out REAL,
            energy_ac_in1_to_battery REAL,
            energy_ac_in2_to_ac_out REAL,
            energy_ac_in2_to_battery REAL,
            energy_ac_out_to_ac_in1 REAL,
            energy_ac_out_to_ac_in2 REAL,
            energy_battery_to_ac_in1 REAL,
            energy_battery_to_ac_in2 REAL,
            energy_battery_to_ac_out REAL,
            energy_ac_out_to_battery REAL,
            PRIMARY KEY (timestamp, modbus_id)
        )
    """)

    conn.commit()
