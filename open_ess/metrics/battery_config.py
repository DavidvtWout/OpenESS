from typing import Annotated, Literal

from pydantic import BaseModel, Field, model_validator, computed_field


class VictronControl(BaseModel):
    type: Literal["victron"] = "victron"
    vebus_id: int
    bms_id: int | None = None
    disable_charger_when_idle: bool = False
    disable_inverter_when_idle: bool = False

    @property
    def vebus_prefix(self) -> str:
        return f"victron/vebus/{self.vebus_id}"

    @property
    def bms_prefix(self) -> str | None:
        return f"victron/battery/{self.bms_id}" if self.bms_id else None


class MqttControl(BaseModel):
    type: Literal["mqtt"] = "mqtt"
    topic: str

    @property
    def metrics_prefix(self) -> str:
        return f"mqtt/{self.topic}"


class MetricsConfig(BaseModel):
    battery_soc: str | list[str] | None = None
    battery_voltage: str | list[str] | None = None
    power_to_system: str | list[str] | None = None
    power_to_battery: str | list[str] | None = None
    energy_to_system: str | list[str] | None = None
    energy_from_system: str | list[str] | None = None
    energy_to_battery: str | list[str] | None = None
    energy_from_battery: str | list[str] | None = None


class BatteryConfig(BaseModel):
    name: str | None = None  # Is set to self.id if not provided.
    monitor_only: bool = False
    capacity_kwh: float | None = None
    max_charge_power_kw: float | None = None
    max_invert_power_kw: float | None = None
    idle_threshold_w: float = 100
    min_soc: int = 10
    max_soc: int = 100

    control: Annotated[VictronControl | MqttControl, Field(discriminator="type")]
    metrics: MetricsConfig = MetricsConfig()

    @computed_field
    @property
    def id(self) -> str:
        if isinstance(self.control, VictronControl):
            return f"victron/vebus/{self.control.vebus_id}"
        else:
            return f"mqtt/{self.control.topic}"

    @property
    def is_victron(self) -> bool:
        return isinstance(self.control, VictronControl)

    @model_validator(mode="after")
    def check_power_limits(self):
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

    @model_validator(mode="after")
    def set_defaults(self):
        if self.name is None:
            self.name = self.id

        if self.is_victron:
            vebus_prefix = self.control.vebus_prefix
            bms_prefix = self.control.bms_prefix

            if self.metrics.battery_soc is None:
                if bms_prefix:
                    self.metrics.battery_soc = [f"{bms_prefix}/soc", f"{vebus_prefix}/soc"]
                else:
                    self.metrics.battery_soc = f"{vebus_prefix}/soc"
            if self.metrics.battery_voltage is None:
                if bms_prefix:
                    self.metrics.battery_voltage = [f"{bms_prefix}/voltage/battery", f"{vebus_prefix}/voltage/battery"]
                else:
                    self.metrics.battery_voltage = f"{vebus_prefix}/voltage/battery"
            if self.metrics.power_to_system is None:
                self.metrics.power_to_system = f"{vebus_prefix}/power/ac_in/l1"
            if self.metrics.power_to_system is None:
                if bms_prefix:
                    self.metrics.power_to_battery = [f"{bms_prefix}/power/battery", f"{vebus_prefix}/power/battery"]
                else:
                    self.metrics.power_to_battery = f"{vebus_prefix}/power/battery"
            if self.metrics.energy_to_system is None:
                self.metrics.energy_to_system = f"{vebus_prefix}/energy/ac_in_import"  # TODO + ac_out_import
            if self.metrics.energy_from_system is None:
                self.metrics.energy_from_system = f"{vebus_prefix}/energy/ac_in_export"  # TODO + ac_out_export
            if self.metrics.energy_to_battery is None:
                if bms_prefix:
                    self.metrics.energy_to_battery = [
                        f"{bms_prefix}/energy/charged_energy",
                        f"{bms_prefix}/power/battery",  # integrate power to obtain energy
                        f"{vebus_prefix}/power/battery",  # integrate power to obtain energy
                    ]
                else:
                    self.metrics.energy_to_battery = f"{vebus_prefix}/power/battery"
            if self.metrics.energy_from_battery is None:
                if bms_prefix:
                    self.metrics.energy_from_battery = [
                        f"{bms_prefix}/energy/discharged_energy",
                        f"-{bms_prefix}/power/battery",  # integrate power to obtain energy
                        f"-{vebus_prefix}/power/battery",  # integrate power to obtain energy
                    ]
                else:
                    self.metrics.energy_from_battery = f"-{vebus_prefix}/power/battery"
        else:
            pass  # TODO

        return self
