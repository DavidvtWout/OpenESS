from typing import Annotated, Literal

from pydantic import BaseModel, Field, model_validator

from open_ess.victron_modbus import VictronConfig


class MqttControl(BaseModel):
    type: Literal["mqtt"] = "mqtt"
    topic: str


class QueriesConfig(BaseModel):
    # Battery state
    # Readings from battery (BMS) have priority over readings from vebus (MultiPlus).
    soc: str = """
      (
        openess_soc_ratio{device=~"$device", node="battery", unit="battery"}
        or
        openess_soc_ratio{device=~"$device", node="battery", unit="vebus"}
      ) * 100
    """
    voltage: str = """
      (
        openess_voltage_volts{device=~"$device", node="battery", unit="battery"}
        or
        openess_voltage_volts{device=~"$device", node="battery", unit="vebus"}
      ) * 100
    """

    # Power
    system_power: str = """
      openess_power_watts{device="$device", phase=~"$phase", from="ac_in", to="system"}
      -
      openess_power_watts{device="$device", phase=~"$phase", from="system", to="ac_out"}
    """
    battery_power: str = """
      openess_power_watts{device="$device", from="system", to="battery", unit="battery"}
      or
      openess_power_watts{device="$device", from="system", to="battery", unit="vebus"}
    """

    # energy_to_system: str | list[str] | None = None
    # energy_from_system: str | list[str] | None = None
    # energy_to_battery: str | list[str] | None = None
    # energy_from_battery: str | list[str] | None = None


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
    queries: QueriesConfig = QueriesConfig()

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
