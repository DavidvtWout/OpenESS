import logging
from datetime import UTC, datetime
from threading import Lock
from typing import TYPE_CHECKING

from open_ess.timeseries import Sample, TimeseriesBackend

from .config import VictronConfig
from .modbus_client import VictronModbusClient
from .registers import Battery, GridMeter, Register, SolarInverter, System, VEBus

if TYPE_CHECKING:
    from open_ess.battery_system import BatterySystemConfig

logger = logging.getLogger(__name__)

POWER_METRIC = "openess_power_watts"
ENERGY_METRIC = "openess_energy_kwh"
SOC_METRIC = "openess_soc_ratio"
VOLTAGE_METRIC = "openess_voltage_volts"


def _get_float(values: dict[Register, float | bytes | None], key: Register) -> float | None:
    """Extract a float value from read_many results, filtering out bytes and None."""
    val = values.get(key)
    return val if isinstance(val, (int, float)) else None


class VictronClient:
    def __init__(
        self,
        config: "BatterySystemConfig",
        mql_client: TimeseriesBackend | None = None,
    ):
        if not isinstance(config.control, VictronConfig):
            raise TypeError(f"VictronClient requires VictronConfig, got {type(config.control).__name__}")
        self._config = config
        self._control: VictronConfig = config.control
        self._client = VictronModbusClient(self._control)
        self._mql_client = mql_client

        self._serial: str | None = None

        self._current_soc: float | None = None
        self._setpoint: float = 0.0  # In Watt
        self._setpoint_expiration: datetime | None = None

        self._lock = Lock()

    def initialize(self) -> bool:
        if not self.connect():
            return False

        serial_bytes = self.read(self.system_id, System.SERIAL)
        if isinstance(serial_bytes, bytes):
            self._serial = serial_bytes.decode("utf-8")

        # Enable ESS mode 3 (external control)
        if not self._config.monitor_only:
            self.write(self.system_id, System.ESS_MODE, 3)

        self._current_soc = self.read(self.system_id, System.BATTERY_SOC)

        return True

    @property
    def address(self) -> str:
        return self._client.address

    @property
    def serial(self) -> str | None:
        return self._serial

    @property
    def system_id(self) -> int:
        return self._control.system_id

    @property
    def vebus_id(self) -> int:
        return self._control.vebus_id

    @property
    def battery_id(self) -> int | None:
        return self._control.battery_id

    @property
    def grid_id(self) -> int | None:
        return self._control.grid_id

    @property
    def pvinverter_id(self) -> int | None:
        return self._control.pvinverter_id

    @property
    def need_mode_3(self) -> bool:
        return not self._config.monitor_only

    @property
    def current_soc(self) -> float | None:
        return self._current_soc

    def set_ess_setpoint(self, power: float, until: datetime) -> None:
        with self._lock:
            self._setpoint = power
            self._setpoint_expiration = until

    def write_setpoints(self) -> None:
        if self._config.monitor_only:
            return

        ess_mode = self.read(self.system_id, System.ESS_MODE)
        if ess_mode != 3:
            raise ValueError("Someone disabled ESS mode 3! Is VRM still managing the system?")

        now = datetime.now(tz=UTC)

        with self._lock:
            if self._setpoint_expiration is None or now >= self._setpoint_expiration:
                self._setpoint = 0.0
                self._setpoint_expiration = None
            if self._setpoint is None:
                return

        idle_threshold = self._config.idle_threshold_w / 1000
        if (self._current_soc or 0) >= 99 and self._setpoint >= -idle_threshold:
            # Keep putting power into the battery to allow balancing of the cells by the BMS.
            # TODO: implement balancing limits?
            self.write(self.vebus_id, VEBus.ESS_SETPOINT_L1, int((self._config.max_charge_power_kw or 0) * 1000))
            self.write(self.vebus_id, VEBus.ESS_DISABLE_CHARGE, 0)
        else:
            if abs(self._setpoint) >= idle_threshold:
                self.write(self.vebus_id, VEBus.ESS_SETPOINT_L1, self._setpoint)
                self.write(self.vebus_id, VEBus.ESS_DISABLE_CHARGE, 0)
                self.write(self.vebus_id, VEBus.ESS_DISABLE_FEEDBACK, 0)
            else:
                self.write(self.vebus_id, VEBus.ESS_SETPOINT_L1, 0)
                if self._control.disable_charger_when_idle:
                    self.write(self.vebus_id, VEBus.ESS_DISABLE_CHARGE, 1)
                if self._control.disable_inverter_when_idle:
                    self.write(self.vebus_id, VEBus.ESS_DISABLE_FEEDBACK, 1)

    def scrape_metrics(self) -> None:
        if self._mql_client is None:
            return
        timestamp = datetime.now(UTC)
        samples: list[Sample] = []

        def add(metric: str, value: float | None, labels: dict[str, str]) -> None:
            labels["device"] = self.serial
            if value is not None:
                samples.append(Sample(metric, value, timestamp, labels))

        # Grid power
        system_regs = [System.GRID_L1, System.GRID_L2, System.GRID_L3]
        system_values = self.read_many(self.system_id, system_regs)
        add(POWER_METRIC, _get_float(system_values, System.GRID_L1), {"from": "grid", "phase": "L1"})
        add(POWER_METRIC, _get_float(system_values, System.GRID_L2), {"from": "grid", "phase": "L2"})
        add(POWER_METRIC, _get_float(system_values, System.GRID_L3), {"from": "grid", "phase": "L3"})

        # Grid energy
        if self.grid_id:
            grid_values = self.read_many(
                self.grid_id, [GridMeter.ENERGY_TO_GRID_TOTAL, GridMeter.ENERGY_FROM_GRID_TOTAL]
            )
            add(
                ENERGY_METRIC,
                _get_float(grid_values, GridMeter.ENERGY_FROM_GRID_TOTAL),
                {"from": "grid", "phase": "total"},
            )
            add(
                ENERGY_METRIC, _get_float(grid_values, GridMeter.ENERGY_TO_GRID_TOTAL), {"to": "grid", "phase": "total"}
            )

        # PV inverter
        if self.pvinverter_id:
            pv_values = self.read_many(
                self.pvinverter_id,
                [SolarInverter.ENERGY_L1, SolarInverter.POWER_L1],
            )
            pv_labels = {"from": "pvinverter", "unit_id": str(self.pvinverter_id), "phase": "L1"}
            add(POWER_METRIC, _get_float(pv_values, SolarInverter.POWER_L1), pv_labels)
            add(ENERGY_METRIC, _get_float(pv_values, SolarInverter.ENERGY_L1), pv_labels)

        # VEBus (inverter/charger)
        vebus_regs = [
            VEBus.AC_INPUT_POWER_L1,
            VEBus.AC_OUTPUT_POWER_L1,
            VEBus.DC_CURRENT,
            VEBus.DC_VOLTAGE,
            VEBus.SOC,
            VEBus.ENERGY_AC_IN1_TO_AC_OUT,
            VEBus.ENERGY_AC_IN1_TO_BATTERY,
            VEBus.ENERGY_AC_OUT_TO_AC_IN1,
            VEBus.ENERGY_BATTERY_TO_AC_IN1,
            VEBus.ENERGY_BATTERY_TO_AC_OUT,
            VEBus.ENERGY_AC_OUT_TO_BATTERY,
        ]
        vebus_values = self.read_many(self.vebus_id, vebus_regs)

        # VEBus power
        add(
            POWER_METRIC,
            _get_float(vebus_values, VEBus.AC_INPUT_POWER_L1),
            {"from": "ac_in", "to": "system", "phase": "L1"},
        )
        add(
            POWER_METRIC,
            _get_float(vebus_values, VEBus.AC_OUTPUT_POWER_L1),
            {"from": "system", "to": "ac_out", "phase": "L1"},
        )

        # VEBus battery
        vebus_dc_current = _get_float(vebus_values, VEBus.DC_CURRENT)
        vebus_dc_voltage = _get_float(vebus_values, VEBus.DC_VOLTAGE)
        vebus_battery_power = (
            vebus_dc_current * vebus_dc_voltage
            if vebus_dc_current is not None and vebus_dc_voltage is not None
            else None
        )
        add(POWER_METRIC, vebus_battery_power, {"from": "system", "to": "battery", "unit": "vebus"})
        add(VOLTAGE_METRIC, vebus_dc_voltage, {"node": "battery", "unit": "vebus"})

        # VEBus SOC
        vebus_soc = _get_float(vebus_values, VEBus.SOC)
        if vebus_soc is not None:
            add(SOC_METRIC, vebus_soc / 100, {"node": "battery", "unit": "vebus"})

        # VEBus energy flows
        add(ENERGY_METRIC, _get_float(vebus_values, VEBus.ENERGY_AC_IN1_TO_AC_OUT), {"from": "ac_in", "to": "ac_out"})
        add(ENERGY_METRIC, _get_float(vebus_values, VEBus.ENERGY_AC_IN1_TO_BATTERY), {"from": "ac_in", "to": "system"})
        add(ENERGY_METRIC, _get_float(vebus_values, VEBus.ENERGY_AC_OUT_TO_AC_IN1), {"from": "ac_out", "to": "ac_in"})
        add(ENERGY_METRIC, _get_float(vebus_values, VEBus.ENERGY_BATTERY_TO_AC_IN1), {"from": "system", "to": "ac_in"})
        add(ENERGY_METRIC, _get_float(vebus_values, VEBus.ENERGY_BATTERY_TO_AC_OUT), {"from": "system", "to": "ac_out"})
        add(ENERGY_METRIC, _get_float(vebus_values, VEBus.ENERGY_AC_OUT_TO_BATTERY), {"from": "ac_out", "to": "system"})

        # BMS (direct battery measurements)
        bms_soc = None
        if self.battery_id is not None:
            bms_values = self.read_many(
                self.battery_id,
                [Battery.DC_VOLTAGE, Battery.DC_POWER, Battery.SOC],
            )
            add(
                POWER_METRIC,
                _get_float(bms_values, Battery.DC_POWER),
                {"from": "system", "to": "battery", "unit": "battery"},
            )
            add(VOLTAGE_METRIC, _get_float(bms_values, Battery.DC_VOLTAGE), {"node": "battery", "unit": "battery"})
            bms_soc = _get_float(bms_values, Battery.SOC)
            if bms_soc is not None:
                add(SOC_METRIC, bms_soc / 100, {"node": "battery", "unit": "battery"})

        if samples:
            try:
                self._mql_client.write(samples)
            except Exception as e:
                logger.exception(f"Failed to write samples to timeseries backend: {e}")

        if bms_soc is not None:
            self._current_soc = bms_soc
        elif vebus_soc is not None:
            self._current_soc = vebus_soc

    # --------------------------------#
    #  VictronModbusClient bindings  #
    # --------------------------------#

    def connect(self) -> bool:
        return self._client.connect()

    def read(self, unit_id: int, register: Register) -> float | bytes | None:
        return self._client.read(unit_id, register)

    def write(self, unit_id: int, register: Register, value: float) -> bool:
        return self._client.write(unit_id, register, value)

    def read_many(self, unit_id: int, registers: list[Register]) -> dict[Register, float | bytes | None]:
        return self._client.read_many(unit_id, registers)

    def close(self) -> None:
        self._client.close()
