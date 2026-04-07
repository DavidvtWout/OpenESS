"""Invert ac_out power values to use negative sign convention."""


def upgrade(conn) -> None:
    # Find all ac_out node IDs (e.g., mp_228_ac_out, mp_229_ac_out)
    cursor = conn.execute("SELECT id FROM nodes WHERE name LIKE 'mp_%_ac_out'")
    ac_out_ids = [row[0] for row in cursor.fetchall()]

    if not ac_out_ids:
        return

    # Invert power values for flows to ac_out nodes
    placeholders = ",".join("?" * len(ac_out_ids))
    conn.execute(
        f"UPDATE power_flows SET power = -power WHERE node_b IN ({placeholders})",
        ac_out_ids,
    )
    conn.commit()
