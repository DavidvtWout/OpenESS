"""Remove duplicate consecutive vebus_energy entries where all values are identical.

Keeps only the oldest timestamp for each sequence of duplicates.
"""


def upgrade(conn) -> None:
    # Use a CTE to identify rows to keep:
    # A row is kept if it's the first row, or if any of its values differ from the previous row
    conn.execute("""
        DELETE FROM vebus_energy
        WHERE rowid NOT IN (
            SELECT rowid FROM (
                SELECT
                    rowid,
                    timestamp,
                    modbus_id,
                    -- Check if this row differs from the previous row for the same modbus_id
                    CASE WHEN
                        LAG(energy_ac_in1_to_ac_out) OVER w IS NULL OR
                        energy_ac_in1_to_ac_out IS NOT LAG(energy_ac_in1_to_ac_out) OVER w OR
                        energy_ac_in1_to_battery IS NOT LAG(energy_ac_in1_to_battery) OVER w OR
                        energy_ac_in2_to_ac_out IS NOT LAG(energy_ac_in2_to_ac_out) OVER w OR
                        energy_ac_in2_to_battery IS NOT LAG(energy_ac_in2_to_battery) OVER w OR
                        energy_ac_out_to_ac_in1 IS NOT LAG(energy_ac_out_to_ac_in1) OVER w OR
                        energy_ac_out_to_ac_in2 IS NOT LAG(energy_ac_out_to_ac_in2) OVER w OR
                        energy_battery_to_ac_in1 IS NOT LAG(energy_battery_to_ac_in1) OVER w OR
                        energy_battery_to_ac_in2 IS NOT LAG(energy_battery_to_ac_in2) OVER w OR
                        energy_battery_to_ac_out IS NOT LAG(energy_battery_to_ac_out) OVER w OR
                        energy_ac_out_to_battery IS NOT LAG(energy_ac_out_to_battery) OVER w
                    THEN 1 ELSE 0 END AS is_different
                FROM vebus_energy
                WINDOW w AS (PARTITION BY modbus_id ORDER BY timestamp)
            )
            WHERE is_different = 1
        )
    """)
    conn.commit()

    # Get stats
    cursor = conn.execute("SELECT COUNT(*) FROM vebus_energy")
    count = cursor.fetchone()[0]
    print(f"vebus_energy now has {count} rows after deduplication")

    # Reclaim space
    conn.execute("VACUUM")
