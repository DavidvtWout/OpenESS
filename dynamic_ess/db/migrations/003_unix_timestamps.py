"""Convert TEXT timestamps to INTEGER (Unix milliseconds)."""


def upgrade(conn) -> None:
    # day_ahead_prices
    conn.execute("""
        CREATE TABLE day_ahead_prices_new (
            area TEXT NOT NULL,
            start_time INTEGER NOT NULL,
            end_time INTEGER NOT NULL,
            price REAL NOT NULL,
            PRIMARY KEY (area, start_time)
        )
    """)
    conn.execute("""
        INSERT INTO day_ahead_prices_new (area, start_time, end_time, price)
        SELECT area,
               CAST(strftime('%s', start_time) AS INTEGER) * 1000,
               CAST(strftime('%s', end_time) AS INTEGER) * 1000,
               price
        FROM day_ahead_prices
    """)
    conn.execute("DROP TABLE day_ahead_prices")
    conn.execute("ALTER TABLE day_ahead_prices_new RENAME TO day_ahead_prices")
    conn.execute("CREATE INDEX idx_prices_area_time ON day_ahead_prices (area, start_time)")

    # system_measurements
    conn.execute("""
        CREATE TABLE system_measurements_new (
            timestamp INTEGER NOT NULL,
            phase INTEGER NOT NULL,
            ac_consumption INTEGER,
            grid_power INTEGER,
            grid_to_multiplus INTEGER,
            multiplus_output INTEGER,
            PRIMARY KEY (timestamp, phase)
        )
    """)
    conn.execute("""
        INSERT INTO system_measurements_new
        SELECT CAST(strftime('%s', timestamp) AS INTEGER) * 1000,
               phase, ac_consumption, grid_power, grid_to_multiplus, multiplus_output
        FROM system_measurements
    """)
    conn.execute("DROP TABLE system_measurements")
    conn.execute("ALTER TABLE system_measurements_new RENAME TO system_measurements")
    conn.execute("CREATE INDEX idx_system_measurements_time ON system_measurements (timestamp)")

    # system_battery
    conn.execute("""
        CREATE TABLE system_battery_new (
            timestamp INTEGER NOT NULL PRIMARY KEY,
            battery_power INTEGER,
            battery_soc INTEGER,
            charger_power INTEGER,
            dc_system_power INTEGER,
            inverter_charger_power INTEGER
        )
    """)
    conn.execute("""
        INSERT INTO system_battery_new
        SELECT CAST(strftime('%s', timestamp) AS INTEGER) * 1000,
               battery_power, battery_soc, charger_power, dc_system_power, inverter_charger_power
        FROM system_battery
    """)
    conn.execute("DROP TABLE system_battery")
    conn.execute("ALTER TABLE system_battery_new RENAME TO system_battery")

    # vebus_measurements
    conn.execute("""
        CREATE TABLE vebus_measurements_new (
            timestamp INTEGER NOT NULL,
            modbus_id INTEGER NOT NULL,
            phase INTEGER NOT NULL,
            ac_input_power REAL,
            ac_output_power REAL,
            PRIMARY KEY (timestamp, modbus_id, phase)
        )
    """)
    conn.execute("""
        INSERT INTO vebus_measurements_new
        SELECT CAST(strftime('%s', timestamp) AS INTEGER) * 1000,
               modbus_id, phase, ac_input_power, ac_output_power
        FROM vebus_measurements
    """)
    conn.execute("DROP TABLE vebus_measurements")
    conn.execute("ALTER TABLE vebus_measurements_new RENAME TO vebus_measurements")
    conn.execute("CREATE INDEX idx_vebus_measurements_time ON vebus_measurements (timestamp, modbus_id)")

    # vebus_energy
    conn.execute("""
        CREATE TABLE vebus_energy_new (
            timestamp INTEGER NOT NULL,
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
    conn.execute("""
        INSERT INTO vebus_energy_new
        SELECT CAST(strftime('%s', timestamp) AS INTEGER) * 1000,
               modbus_id, energy_ac_in1_to_ac_out, energy_ac_in1_to_battery,
               energy_ac_in2_to_ac_out, energy_ac_in2_to_battery, energy_ac_out_to_ac_in1,
               energy_ac_out_to_ac_in2, energy_battery_to_ac_in1, energy_battery_to_ac_in2,
               energy_battery_to_ac_out, energy_ac_out_to_battery
        FROM vebus_energy
    """)
    conn.execute("DROP TABLE vebus_energy")
    conn.execute("ALTER TABLE vebus_energy_new RENAME TO vebus_energy")

    conn.commit()

    # Reclaim space from dropped tables
    conn.execute("VACUUM")
