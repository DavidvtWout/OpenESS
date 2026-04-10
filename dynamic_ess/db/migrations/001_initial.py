"""Initial migration: create many tables."""


def upgrade(conn) -> None:

    # -------------
    #  Day-ahead prices
    # -------------

    conn.execute("""
        CREATE TABLE IF NOT EXISTS day_ahead_prices (
            area TEXT NOT NULL,
            start_time INTEGER NOT NULL,
            end_time INTEGER NOT NULL,
            price REAL NOT NULL,
            PRIMARY KEY (area, start_time)
        )
    """)
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_prices_area_time
        ON day_ahead_prices (area, start_time)
    """)

    # -------------
    #  Charge schedule
    # -------------

    conn.execute("""
        CREATE TABLE IF NOT EXISTS charge_schedule (
            start_time INTEGER NOT NULL PRIMARY KEY,
            end_time INTEGER NOT NULL,
            power INTEGER NOT NULL,
            expected_soc REAL NOT NULL
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_charge_schedule ON charge_schedule (start_time)")

    # -------------
    #  Labels
    # -------------

    conn.execute("""
        CREATE TABLE IF NOT EXISTS labels (
            label_id INTEGER PRIMARY KEY,
            label TEXT UNIQUE NOT NULL
        )
    """)

    # -------------
    #  Power
    # -------------

    conn.execute("""
        CREATE TABLE IF NOT EXISTS _power (
            label_id INTEGER NOT NULL,
            start_time INTEGER NOT NULL,
            end_time INTEGER,
            sample_count INTEGER,
            value REAL NOT NULL,
            PRIMARY KEY (label_id, start_time),
            FOREIGN KEY (label_id) REFERENCES labels(label_id)
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_power ON _power(label_id, start_time)")
    conn.execute("""
        CREATE VIEW IF NOT EXISTS power AS
        SELECT l.label, p.start_time, p.end_time, p.sample_count, p.value
        FROM _power AS p
        JOIN labels AS l USING (label_id)
    """)
    conn.execute("""
        CREATE TRIGGER IF NOT EXISTS power_insert
        INSTEAD OF INSERT ON power
        BEGIN
            INSERT OR IGNORE INTO labels(label) VALUES (NEW.label);
            INSERT INTO _power(label_id, start_time, end_time, sample_count, value)
            VALUES (
                (SELECT label_id FROM labels WHERE label = NEW.label),
                NEW.start_time,
                NEW.end_time,
                NEW.sample_count,
                NEW.value
            );
        END
    """)
    conn.execute("""
        CREATE TRIGGER IF NOT EXISTS power_delete
        INSTEAD OF DELETE ON power
        BEGIN
            DELETE FROM _power
            WHERE label_id = (SELECT label_id FROM labels WHERE label = OLD.label)
              AND start_time = OLD.start_time;
        END
    """)

    # -------------
    #  Energy
    # -------------

    conn.execute("""
        CREATE TABLE IF NOT EXISTS _energy (
            label_id INTEGER NOT NULL,
            timestamp INTEGER NOT NULL,
            value REAL NOT NULL,
            PRIMARY KEY (label_id, timestamp),
            FOREIGN KEY (label_id) REFERENCES labels(label_id)
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_energy ON _energy(label_id, timestamp)")
    conn.execute("""
        CREATE VIEW IF NOT EXISTS energy AS
        SELECT l.label, e.timestamp, e.value
        FROM _energy AS e
        JOIN labels AS l USING (label_id)
    """)
    conn.execute("""
        CREATE TRIGGER IF NOT EXISTS energy_insert
        INSTEAD OF INSERT ON energy
        BEGIN
            INSERT OR IGNORE INTO labels(label) VALUES (NEW.label);
            INSERT INTO _energy(label_id, timestamp, value)
            VALUES (
                (SELECT label_id FROM labels WHERE label = NEW.label),
                NEW.timestamp,
                NEW.value
            );
        END
    """)
    conn.execute("""
        CREATE TRIGGER IF NOT EXISTS energy_delete
        INSTEAD OF DELETE ON energy
        BEGIN
            DELETE FROM _energy
            WHERE label_id = (SELECT label_id FROM labels WHERE label = OLD.label)
              AND timestamp = OLD.timestamp;
        END
    """)

    # -------------
    #  Battery SoC
    # -------------

    conn.execute("""
        CREATE TABLE IF NOT EXISTS _battery_soc (
            label_id INTEGER NOT NULL,
            timestamp INTEGER NOT NULL,
            value INTEGER NOT NULL,
            PRIMARY KEY (label_id, timestamp),
            FOREIGN KEY (label_id) REFERENCES labels(label_id)
        )
        """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_battery_soc ON _battery_soc(label_id, timestamp)")
    conn.execute("""
        CREATE VIEW IF NOT EXISTS battery_soc AS
        SELECT l.label, e.timestamp, e.value
        FROM _battery_soc AS e
        JOIN labels AS l USING (label_id)
    """)
    conn.execute("""
        CREATE TRIGGER IF NOT EXISTS battery_soc_insert
        INSTEAD OF INSERT ON battery_soc
        BEGIN
            INSERT OR IGNORE INTO labels(label) VALUES (NEW.label);
            INSERT INTO _battery_soc(label_id, timestamp, value)
            VALUES (
                (SELECT label_id FROM labels WHERE label = NEW.label),
                NEW.timestamp,
                NEW.value
            );
        END
    """)

    conn.commit()
