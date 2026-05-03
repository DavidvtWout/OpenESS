import logging
from datetime import UTC, datetime
from threading import Lock
from typing import TYPE_CHECKING

from open_ess.database import Database, DatabaseConnection
from open_ess.timeseries import Sample, TimeseriesBackend

from .config import VictronConfig
from .modbus_client import VictronModbusClient
from .registers import Battery, GridMeter, Register, SolarInverter, System, VEBus

if TYPE_CHECKING:
    from open_ess.battery_system import BatterySystemConfig

logger = logging.getLogger(__name__)


def _get_float(values: dict[Register, float | bytes | None], key: Register) -> float | None:
    """Extract a float value from read_many results, filtering out bytes and None."""
    val = values.get(key)
    return val if isinstance(val, (int, float)) else None


class VictronClient:
    def __init__(
        self,
        database: Database,
        config: "BatterySystemConfig",
        timeseries: TimeseriesBackend | None = None,
    ):
        if not isinstance(config.control, VictronConfig):
            raise TypeError(f"VictronClient requires VictronConfig, got {type(config.control).__name__}")
        self._db = database
        self._config = config
        self._control: VictronConfig = config.control
        self._client = VictronModbusClient(self._control)
        self._timeseries = timeseries

        self._db_conn: DatabaseConnection | None = None
        self._serial: str | None = None

        self._setpoint: float = 0.0  # In Watt
        self._setpoint_expiration: datetime | None = None

        self._lock = Lock()

    def initialize(self) -> bool:
        self._db_conn = self._db.connect()
        if not self.connect():
            return False

        serial_bytes = self.read(self.system_id, System.SERIAL)
        if isinstance(serial_bytes, bytes):
            self._serial = serial_bytes.decode("utf-8")

        # Enable ESS mode 3 (external control)
        if not self._config.monitor_only:
            self.write(self.system_id, System.ESS_MODE, 3)

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

    def set_ess_setpoint(self, power: float, until: datetime) -> None:
        with self._lock:
            self._setpoint = power
            self._setpoint_expiration = until

    def write_setpoints(self) -> None:
        if self._db_conn is None:
            return

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
        if (self._db_conn.get_current_soc() or 0) >= 99 and self._setpoint >= -idle_threshold:
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

    def collect_and_store_measurements(self) -> None:
        if self._db_conn is None and self._timeseries is None:
            return
        timestamp = datetime.now(UTC)
        samples: list[Sample] = []

        def add_sample(metric: str, value: float | None) -> None:
            if value is not None:
                samples.append(Sample(metric, value, timestamp))

        # Read System registers
        system_regs = [System.GRID_L1, System.GRID_L2, System.GRID_L3]
        system_values = self.read_many(self.system_id, system_regs)
        add_sample("grid/power/l1", _get_float(system_values, System.GRID_L1))
        add_sample("grid/power/l2", _get_float(system_values, System.GRID_L2))
        add_sample("grid/power/l3", _get_float(system_values, System.GRID_L3))

        if self.grid_id:
            grid_values = self.read_many(
                self.grid_id,
                [GridMeter.ENERGY_TO_NET_TOTAL, GridMeter.ENERGY_FROM_NET_TOTAL],
            )
            add_sample("grid/energy/import/total", _get_float(grid_values, GridMeter.ENERGY_FROM_NET_TOTAL))
            add_sample("grid/energy/export/total", _get_float(grid_values, GridMeter.ENERGY_TO_NET_TOTAL))

        if self.pvinverter_id:
            pvinverter_values = self.read_many(
                self.pvinverter_id,
                [SolarInverter.ENERGY_L1, SolarInverter.POWER_L1],
            )
            add_sample(
                f"victron/pvinverter/{self.pvinverter_id}/energy/l1",
                _get_float(pvinverter_values, SolarInverter.ENERGY_L1),
            )
            add_sample(
                f"victron/pvinverter/{self.pvinverter_id}/power/l1",
                _get_float(pvinverter_values, SolarInverter.POWER_L1),
            )

        # VEBus registers
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

        vebus_prefix = self._control.vebus_prefix
        vebus_values = self.read_many(self.vebus_id, vebus_regs)

        add_sample(f"{vebus_prefix}/power/ac_in/l1", _get_float(vebus_values, VEBus.AC_INPUT_POWER_L1))
        add_sample(f"{vebus_prefix}/power/ac_out/l1", _get_float(vebus_values, VEBus.AC_OUTPUT_POWER_L1))
        add_sample(f"{vebus_prefix}/soc", _get_float(vebus_values, VEBus.SOC))

        dc_current = _get_float(vebus_values, VEBus.DC_CURRENT)
        dc_voltage = _get_float(vebus_values, VEBus.DC_VOLTAGE)
        add_sample(f"{vebus_prefix}/voltage/battery", dc_voltage)
        if dc_voltage is not None and dc_current is not None:
            add_sample(f"{vebus_prefix}/power/battery", dc_current * dc_voltage)

        # Energy flows
        add_sample(f"{vebus_prefix}/energy/ac_in_to_ac_out", _get_float(vebus_values, VEBus.ENERGY_AC_IN1_TO_AC_OUT))
        add_sample(f"{vebus_prefix}/energy/ac_in_import", _get_float(vebus_values, VEBus.ENERGY_AC_IN1_TO_BATTERY))
        add_sample(f"{vebus_prefix}/energy/ac_out_to_ac_in", _get_float(vebus_values, VEBus.ENERGY_AC_OUT_TO_AC_IN1))
        add_sample(f"{vebus_prefix}/energy/ac_in_export", _get_float(vebus_values, VEBus.ENERGY_BATTERY_TO_AC_IN1))
        add_sample(f"{vebus_prefix}/energy/ac_out_export", _get_float(vebus_values, VEBus.ENERGY_BATTERY_TO_AC_OUT))
        add_sample(f"{vebus_prefix}/energy/ac_out_import", _get_float(vebus_values, VEBus.ENERGY_AC_OUT_TO_BATTERY))

        if self.battery_id is not None:
            bms_prefix = self._control.battery_prefix
            bms_values = self.read_many(
                self.battery_id,
                [Battery.DC_VOLTAGE, Battery.DC_POWER, Battery.SOC],
            )
            add_sample(f"{bms_prefix}/power/battery", _get_float(bms_values, Battery.DC_POWER))
            add_sample(f"{bms_prefix}/voltage/battery", _get_float(bms_values, Battery.DC_VOLTAGE))
            add_sample(f"{bms_prefix}/soc", _get_float(bms_values, Battery.SOC))

        # Write to timeseries backend
        if self._timeseries is not None and samples:
            try:
                self._timeseries.write(samples)
            except Exception:
                logger.exception("Failed to write samples to timeseries backend")

        # Legacy: also write to database
        if self._db_conn is not None:
            for sample in samples:
                if "power" in sample.metric or "voltage" in sample.metric:
                    self._db_conn.insert_power(sample.metric, sample.timestamp, sample.value)
                elif "energy" in sample.metric:
                    self._db_conn.insert_energy(sample.metric, sample.timestamp, sample.value)
                elif "soc" in sample.metric:
                    self._db_conn.insert_soc(sample.metric, sample.timestamp, round(sample.value))

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
