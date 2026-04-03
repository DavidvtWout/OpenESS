from pydantic import BaseModel, field_validator


class VictronConfig(BaseModel):
    host: str
    port: int = 502
    poll_interval: int = 2

    # Lowest allowed State-of-Charge of the battery.
    min_soc: int = 10

    # Modbus unit IDs, check Settings → Services → Modbus TCP → Available services
    system_id: int = 100
    vebus_ids: list[int] = []
    bms_id: int | None = None
    solarcharger_id: int | None = None
    grid_id: int | None = None
