"""Rename labels."""

from open_ess.database import DatabaseConnection


def upgrade(conn: DatabaseConnection) -> None:
    renames = [
        ("victron/vebus/228", "victron/c0619ab2f37c"),
        ("victron/vebus/228/power/ac_in/l1", "victron/c0619ab2f37c/228/power/ac_in/l1"),
        ("victron/vebus/228/power/ac_out/l1", "victron/c0619ab2f37c/228/power/ac_out/l1"),
        ("victron/vebus/228/soc", "victron/c0619ab2f37c/228/soc"),
        ("victron/vebus/228/power/battery", "victron/c0619ab2f37c/228/power/battery"),
        ("victron/vebus/228/energy/ac_in_to_ac_out", "victron/c0619ab2f37c/228/energy/ac_in_to_ac_out"),
        ("victron/vebus/228/energy/ac_in_import", "victron/c0619ab2f37c/228/energy/ac_in_import"),
        ("victron/vebus/228/energy/ac_out_to_ac_in", "victron/c0619ab2f37c/228/energy/ac_out_to_ac_in"),
        ("victron/vebus/228/energy/ac_in_export", "victron/c0619ab2f37c/228/energy/ac_in_export"),
        ("victron/vebus/228/energy/ac_out_export", "victron/c0619ab2f37c/228/energy/ac_out_export"),
        ("victron/vebus/228/energy/ac_out_import", "victron/c0619ab2f37c/228/energy/ac_out_import"),
        ("victron/vebus/228/voltage/battery", "victron/c0619ab2f37c/228/voltage/battery"),
        ("victron/battery/225/power/battery", "victron/c0619ab2f37c/225/power/battery"),
        ("victron/battery/225/voltage/battery", "victron/c0619ab2f37c/225/voltage/battery"),
        ("victron/battery/225/soc", "victron/c0619ab2f37c/225/soc"),
        ("victron/pvinverter/31/power/l1", "victron/c0619ab2f37c/31/power/l1"),
        ("victron/pvinverter/31/energy/l1", "victron/c0619ab2f37c/31/energy/l1"),
    ]

    for old_label, new_label in renames:
        conn.execute(
            "UPDATE labels SET label = ? WHERE label = ?",
            (new_label, old_label),
        )

    conn.commit()
