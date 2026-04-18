from typing import Literal

from pydantic import BaseModel


class VictronConfig(BaseModel):
    type: Literal["victron"] = "victron"
    host: str
    port: int = 502

    # Modbus unit IDs, check Settings → Services → Modbus TCP → Available services
    # vebus and battery IDs must be configured in the battery config section.
    system_id: int = 100
    vebus_id: int
    battery_id: int | None = None
    grid_id: int | None = None
    pvinverter_id: int | None = None
    # TODO: support solarcharger?

    disable_charger_when_idle: bool = False
    disable_inverter_when_idle: bool = False

    @property
    def vebus_prefix(self) -> str:
        return f"victron/vebus/{self.vebus_id}"

    @property
    def battery_prefix(self) -> str | None:
        return f"victron/battery/{self.battery_id}" if self.battery_id else None
