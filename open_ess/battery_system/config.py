from typing import Annotated, Literal

from pydantic import BaseModel, Field, model_validator

from open_ess.victron_modbus import VictronConfig


class MqttControl(BaseModel):
    type: Literal["mqtt"] = "mqtt"
    topic: str


class BatterySystemConfig(BaseModel):
    name: str | None = None
    monitor_only: bool = False
    phases: int = 1
    capacity_kwh: float | None = None
    max_charge_power_kw: float | None = None
    max_invert_power_kw: float | None = None
    idle_threshold_w: float = 100
    min_soc: int = 10
    max_soc: int = 100

    control: Annotated[VictronConfig | MqttControl, Field(discriminator="type")]

    @property
    def is_victron(self) -> bool:
        return isinstance(self.control, VictronConfig)

    @model_validator(mode="after")
    def check_power_limits(self) -> "BatterySystemConfig":
        if not self.monitor_only:
            if self.max_charge_power_kw is None:
                raise ValueError(
                    "max_charge_power_kw is not configured. Either set a value or set monitor_only to True."
                )
            if self.max_invert_power_kw is None:
                raise ValueError(
                    "max_invert_power_kw is not configured. Either set a value or set monitor_only to True."
                )
        return self
