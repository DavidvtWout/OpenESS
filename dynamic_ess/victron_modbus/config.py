from pydantic import BaseModel


class VictronConfig(BaseModel):
    host: str
    port: int = 502

    # Modbus unit IDs, check Settings → Services → Modbus TCP → Available services
    # vebus and battery IDs must be configured in the battery config section.
    system_id: int = 100
    grid_id: int | None = None
    pvinverter_id: int | None = None
    # TODO: support solarcharger
