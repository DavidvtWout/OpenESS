from typing import Annotated, Literal

from pydantic import BaseModel, Field

# TODO: Validate config. max_charge_power_kw and max_invert_power_kw must be set when monitor_only is False.


class VictronControl(BaseModel):
    type: Literal["victron"] = "victron"
    monitor_only: bool = False
    vebus_id: int
    battery_id: int | None = None
    disable_charger_when_idle: bool = False
    disable_inverter_when_idle: bool = False


class MqttControl(BaseModel):
    type: Literal["mqtt"] = "mqtt"
    monitor_only: bool = False
    topic: str


class PowerMetricConfig(BaseModel):
    to_charger_inverter: str | None = None
    to_battery: str | None = None


class EnergyMetricConfig(BaseModel):
    to_charger: str | None = None
    from_inverter: str | None = None
    to_battery: str | None = None
    from_battery: str | None = None


class BatteryConfig(BaseModel):
    name: str | None = "battery"
    capacity_kwh: float | None = None
    max_charge_power_kw: float | None = None
    max_invert_power_kw: float | None = None
    idle_threshold_w: float = 100
    min_soc: int = 10
    max_soc: int = 100

    control: Annotated[VictronControl | MqttControl, Field(discriminator="type")]
    power_metric: PowerMetricConfig | None = None
    energy_metric: EnergyMetricConfig | None = None

    def get_name(self) -> str:
        if self.name is not None:
            return self.name
        match self.control:
            case VictronControl(vebus_id=vebus_id):
                return f"vebus_{vebus_id}"
            case MqttControl(topic=topic):
                return topic.replace("/", "_")

    def get_default_power_metrics(self) -> PowerMetricConfig:
        if self.power_metric is not None:
            return self.power_metric
        match self.control:
            case VictronControl(vebus_id=vebus_id):
                return PowerMetricConfig(
                    to_charger_inverter=f"victron/vebus/{vebus_id}/ac_power",
                    to_battery=f"victron/vebus/{vebus_id}/dc_power",
                )
            case MqttControl(topic=topic):
                return PowerMetricConfig(
                    to_charger_inverter=f"{topic}/ac_power",
                    to_battery=f"{topic}/dc_power",
                )

    def get_default_energy_metrics(self) -> EnergyMetricConfig:
        if self.energy_metric is not None:
            return self.energy_metric
        match self.control:
            case VictronControl(vebus_id=vebus_id):
                return EnergyMetricConfig(
                    to_charger=f"victron/vebus/{vebus_id}/energy_to_charger",
                    from_inverter=f"victron/vebus/{vebus_id}/energy_from_inverter",
                    to_battery=f"victron/vebus/{vebus_id}/energy_to_battery",
                    from_battery=f"victron/vebus/{vebus_id}/energy_from_battery",
                )
            case MqttControl(topic=topic):
                return EnergyMetricConfig(
                    to_charger=f"{topic}/energy_to_charger",
                    from_inverter=f"{topic}/energy_from_inverter",
                    to_battery=f"{topic}/energy_to_battery",
                    from_battery=f"{topic}/energy_from_battery",
                )
