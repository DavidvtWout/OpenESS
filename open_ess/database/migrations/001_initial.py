"""Initial migration: create tables."""


def upgrade(conn) -> None:
    conn.execute("PRAGMA foreign_keys = ON")

    # -------------
    #  Labels
    # -------------

    conn.execute("""
        CREATE TABLE labels (
            label_id INTEGER PRIMARY KEY,
            label TEXT UNIQUE NOT NULL
        )
    """)

    # -------------
    #  Day-ahead prices
    # -------------

    conn.execute("""
        CREATE TABLE day_ahead_prices (
            area TEXT NOT NULL,
            start_time INTEGER NOT NULL,
            end_time INTEGER NOT NULL,
            price REAL NOT NULL,
            PRIMARY KEY (area, start_time)
        )
    """)

    # -------------
    #  Charge schedule
    # -------------

    conn.execute("""
        CREATE TABLE _charge_schedule (
            label_id INTEGER NOT NULL,
            start_time INTEGER NOT NULL,
            end_time INTEGER NOT NULL,
            power INTEGER NOT NULL,
            expected_soc REAL NOT NULL,
            PRIMARY KEY (label_id, start_time),
            FOREIGN KEY (label_id) REFERENCES labels(label_id)
        )
    """)
    conn.execute("""
        CREATE VIEW charge_schedule AS
        SELECT l.label, cs.start_time, cs.end_time, cs.power, cs.expected_soc
        FROM _charge_schedule AS cs
        JOIN labels AS l USING (label_id)
    """)
    conn.execute("""
        CREATE TRIGGER charge_schedule_insert
        INSTEAD OF INSERT ON charge_schedule
        BEGIN
            INSERT OR IGNORE INTO labels(label) VALUES (NEW.label);
            INSERT OR REPLACE INTO _charge_schedule(label_id, start_time, end_time, power, expected_soc)
            VALUES (
                (SELECT label_id FROM labels WHERE label = NEW.label),
                NEW.start_time,
                NEW.end_time,
                NEW.power,
                NEW.expected_soc
            );
        END
    """)
    conn.execute("""
        CREATE TRIGGER charge_schedule_delete
        INSTEAD OF DELETE ON charge_schedule
        BEGIN
            DELETE FROM _charge_schedule
            WHERE label_id = (SELECT label_id FROM labels WHERE label = OLD.label)
            AND start_time = OLD.start_time;
        END
    """)

    # -------------
    #  Power
    # -------------

    conn.execute("""
        CREATE TABLE _power (
            label_id INTEGER NOT NULL,
            start_time INTEGER NOT NULL,
            end_time INTEGER,
            sample_count INTEGER,
            value REAL NOT NULL,
            PRIMARY KEY (label_id, start_time),
            FOREIGN KEY (label_id) REFERENCES labels(label_id)
        )
    """)
    conn.execute("""
        CREATE VIEW power AS
        SELECT l.label, p.start_time, p.end_time, p.sample_count, p.value
        FROM _power AS p
        JOIN labels AS l USING (label_id)
    """)
    conn.execute("""
        CREATE TRIGGER power_insert
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
        CREATE TRIGGER power_delete
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
        CREATE TABLE _energy (
            label_id INTEGER NOT NULL,
            timestamp INTEGER NOT NULL,
            value REAL NOT NULL,
            PRIMARY KEY (label_id, timestamp),
            FOREIGN KEY (label_id) REFERENCES labels(label_id)
        )
    """)
    conn.execute("""
        CREATE VIEW energy AS
        SELECT l.label, e.timestamp, e.value
        FROM _energy AS e
        JOIN labels AS l USING (label_id)
    """)
    conn.execute("""
        CREATE TRIGGER energy_insert
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
        CREATE TRIGGER energy_delete
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
        CREATE TABLE _battery_soc (
            label_id INTEGER NOT NULL,
            timestamp INTEGER NOT NULL,
            value INTEGER NOT NULL,
            PRIMARY KEY (label_id, timestamp),
            FOREIGN KEY (label_id) REFERENCES labels(label_id)
        )
        """)
    conn.execute("""
        CREATE VIEW battery_soc AS
        SELECT l.label, e.timestamp, e.value
        FROM _battery_soc AS e
        JOIN labels AS l USING (label_id)
    """)
    conn.execute("""
        CREATE TRIGGER battery_soc_insert
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
