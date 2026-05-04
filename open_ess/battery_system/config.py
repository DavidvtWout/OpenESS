from typing import Annotated, Literal

from pydantic import BaseModel, Field, model_validator

from open_ess.victron_modbus import VictronConfig


class MqttControl(BaseModel):
    type: Literal["mqtt"] = "mqtt"
    topic: str


class MetricsConfig(BaseModel):
    battery_soc: str | list[str] | None = None
    battery_voltage: str | list[str] | None = None
    power_to_system: str | list[str] | None = None
    power_to_battery: str | list[str] | None = None
    energy_to_system: str | list[str] | None = None
    energy_from_system: str | list[str] | None = None
    energy_to_battery: str | list[str] | None = None
    energy_from_battery: str | list[str] | None = None


class QueriesConfig(BaseModel):
    # Battery state
    soc: str = 'openess_soc_ratio{node="battery", device="$device"} * 100'
    voltage: str = 'openess_voltage_volts{node="battery", device="$device"}'

    # Power
    power_grid: str = 'openess_power_watts{from="grid", device="$device"}'
    power_pv: str = 'openess_power_watts{from="pvinverter", device="$device"}'
    power_battery: str = 'openess_power_watts{from="system", to="battery", device="$device"}'
    power_ac_in: str = 'openess_power_watts{from="ac_in", device="$device"}'
    power_ac_out: str = 'openess_power_watts{from="ac_out", device="$device"}'

    # Energy
    energy_grid_import: str = 'openess_energy_kwh{from="grid", device="$device"}'
    energy_grid_export: str = 'openess_energy_kwh{to="grid", device="$device"}'
    energy_to_battery: str = 'openess_energy_kwh{to="system", device="$device"}'
    energy_from_battery: str = 'openess_energy_kwh{from="system", device="$device"}'


class BatterySystemConfig(BaseModel):
    name: str | None = None  # Is set to self.id if not provided.
    monitor_only: bool = False
    phases: int = 1
    capacity_kwh: float | None = None
    max_charge_power_kw: float | None = None
    max_invert_power_kw: float | None = None
    idle_threshold_w: float = 100
    min_soc: int = 10
    max_soc: int = 100

    control: Annotated[VictronConfig | MqttControl, Field(discriminator="type")]
    metrics: MetricsConfig = MetricsConfig()
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
