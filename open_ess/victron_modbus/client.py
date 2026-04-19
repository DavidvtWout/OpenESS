import logging
from datetime import datetime, timezone
from threading import Lock
from typing import TYPE_CHECKING

from open_ess.database import Database, DatabaseConnection
from .modbus_client import VictronModbusClient
from .registers import Register, System, VEBus, GridMeter, Battery, SolarInverter

if TYPE_CHECKING:
    from open_ess.battery_system import BatterySystemConfig

logger = logging.getLogger(__name__)


class VictronClient:
    def __init__(self, database: Database, config: "BatterySystemConfig"):
        self._db = database
        self._config = config
        self._client = VictronModbusClient(config.control)

        self._db_conn: DatabaseConnection | None = None
        self._serial: str | None = None

        self._setpoint: float | None = None  # In Watt
        self._setpoint_expiration: datetime | None = None

        self._lock = Lock()

    def initialize(self) -> bool:
        self._db_conn = self._db.connect()
        if not self.connect():
            return False

        self._serial = self.read(self.system_id, System.SERIAL).decode("utf-8")

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
        return self._config.control.system_id

    @property
    def vebus_id(self) -> int:
        return self._config.control.vebus_id

    @property
    def battery_id(self) -> int | None:
        return self._config.control.battery_id

    @property
    def grid_id(self) -> int | None:
        return self._config.control.grid_id

    @property
    def pvinverter_id(self) -> int | None:
        return self._config.control.pvinverter_id

    @property
    def need_mode_3(self) -> bool:
        return not self._config.monitor_only

    def set_ess_setpoint(self, power: float, until: datetime):
        with self._lock:
            self._setpoint = power
            self._setpoint_expiration = until

    def write_setpoints(self):
        if self._config.monitor_only:
            return

        ess_mode = self.read(self.system_id, System.ESS_MODE)
        if ess_mode != 3:
            raise ValueError("Someone disabled ESS mode 3! Is VRM still managing the system?")

        now = datetime.now(tz=timezone.utc)

        with self._lock:
            if self._setpoint_expiration is None or now >= self._setpoint_expiration:
                self._setpoint = None
                self._setpoint_expiration = None
            if self._setpoint is None:
                return

        idle_threshold = self._config.idle_threshold_w / 1000
        if self._db_conn.get_current_soc() >= 99 and self._setpoint >= -idle_threshold:
            # Keep putting power into the battery to allow balancing of the cells by the BMS.
            # TODO: implement balancing limits?
            self.write(self.vebus_id, VEBus.ESS_SETPOINT_L1, int(self._config.max_charge_power_kw * 1000))
            self.write(self.vebus_id, VEBus.ESS_DISABLE_CHARGE, 0)
        else:
            if abs(self._setpoint) >= idle_threshold:
                self.write(self.vebus_id, VEBus.ESS_SETPOINT_L1, self._setpoint)
                self.write(self.vebus_id, VEBus.ESS_DISABLE_CHARGE, 0)
                self.write(self.vebus_id, VEBus.ESS_DISABLE_FEEDBACK, 0)
            else:
                self.write(self.vebus_id, VEBus.ESS_SETPOINT_L1, 0)
                if self._config.control.disable_charger_when_idle:
                    self.write(self.vebus_id, VEBus.ESS_DISABLE_CHARGE, 1)
                if self._config.control.disable_inverter_when_idle:
                    self.write(self.vebus_id, VEBus.ESS_DISABLE_FEEDBACK, 1)

    def collect_and_store_measurements(self) -> None:
        timestamp = datetime.now(timezone.utc)

        # Read System registers
        system_regs = [System.GRID_L1, System.GRID_L2, System.GRID_L3]
        system_values = self.read_many(self.system_id, system_regs)
        self._db_conn.insert_power("grid/power/l1", timestamp, system_values.get(System.GRID_L1))
        self._db_conn.insert_power("grid/power/l2", timestamp, system_values.get(System.GRID_L2))
        self._db_conn.insert_power("grid/power/l3", timestamp, system_values.get(System.GRID_L3))

        if self.grid_id:
            # TODO: check if grid meter delivers data per phase or not
            grid_values = self.read_many(
                self.grid_id,
                [GridMeter.ENERGY_TO_NET_TOTAL, GridMeter.ENERGY_FROM_NET_TOTAL],
            )
            self._db_conn.insert_energy(
                "grid/energy/import/total", timestamp, grid_values.get(GridMeter.ENERGY_FROM_NET_TOTAL)
            )
            self._db_conn.insert_energy(
                "grid/energy/export/total", timestamp, grid_values.get(GridMeter.ENERGY_TO_NET_TOTAL)
            )

        if self.pvinverter_id:
            pvinverter_values = self.read_many(
                self.pvinverter_id,
                [
                    SolarInverter.ENERGY_L1,
                    SolarInverter.POWER_L1,
                ],
            )
            self._db_conn.insert_energy(
                f"victron/pvinverter/{self.pvinverter_id}/energy/l1",
                timestamp,
                pvinverter_values.get(SolarInverter.ENERGY_L1),
            )
            self._db_conn.insert_power(
                f"victron/pvinverter/{self.pvinverter_id}/power/l1",
                timestamp,
                pvinverter_values.get(SolarInverter.POWER_L1),
            )

        # VEBus registers for each device
        vebus_regs = [
            VEBus.AC_INPUT_POWER_L1,
            # VEBus.AC_INPUT_POWER_L2,
            # VEBus.AC_INPUT_POWER_L3,
            VEBus.AC_OUTPUT_POWER_L1,
            # VEBus.AC_OUTPUT_POWER_L2,
            # VEBus.AC_OUTPUT_POWER_L3,
            VEBus.DC_CURRENT,
            VEBus.DC_VOLTAGE,
            VEBus.SOC,
            # Energy counters
            VEBus.ENERGY_AC_IN1_TO_AC_OUT,
            VEBus.ENERGY_AC_IN1_TO_BATTERY,
            # VEBus.ENERGY_AC_IN2_TO_AC_OUT,
            # VEBus.ENERGY_AC_IN2_TO_BATTERY,
            VEBus.ENERGY_AC_OUT_TO_AC_IN1,
            # VEBus.ENERGY_AC_OUT_TO_AC_IN2,
            VEBus.ENERGY_BATTERY_TO_AC_IN1,
            # VEBus.ENERGY_BATTERY_TO_AC_IN2,
            VEBus.ENERGY_BATTERY_TO_AC_OUT,
            VEBus.ENERGY_AC_OUT_TO_BATTERY,
        ]

        vebus_prefix = self._config.control.vebus_prefix

        vebus_values = self.read_many(self.vebus_id, vebus_regs)

        self._db_conn.insert_power(
            f"{vebus_prefix}/power/ac_in/l1", timestamp, vebus_values.get(VEBus.AC_INPUT_POWER_L1)
        )
        self._db_conn.insert_power(
            f"{vebus_prefix}/power/ac_out/l1", timestamp, vebus_values.get(VEBus.AC_OUTPUT_POWER_L1)
        )

        soc = vebus_values.get(VEBus.SOC)
        if soc is not None:
            self._db_conn.insert_soc(f"{vebus_prefix}/soc", timestamp, int(soc))

        dc_current = vebus_values.get(VEBus.DC_CURRENT)
        dc_voltage = vebus_values.get(VEBus.DC_VOLTAGE)
        self._db_conn.insert_voltage(f"{vebus_prefix}/voltage/battery", timestamp, dc_voltage)
        if dc_current is not None and dc_voltage is not None:
            dc_power = dc_current * dc_voltage
            self._db_conn.insert_power(f"{vebus_prefix}/power/battery", timestamp, dc_power)

        # Energy flows
        self._db_conn.insert_energy(
            f"{vebus_prefix}/energy/ac_in_to_ac_out",
            timestamp,
            vebus_values.get(VEBus.ENERGY_AC_IN1_TO_AC_OUT),
        )
        self._db_conn.insert_energy(
            f"{vebus_prefix}/energy/ac_in_import", timestamp, vebus_values.get(VEBus.ENERGY_AC_IN1_TO_BATTERY)
        )
        # self._database.insert_energy("", timestamp, vebus_values.get(VEBus.ENERGY_AC_IN2_TO_AC_OUT))
        # self._database.insert_energy("", timestamp, vebus_values.get(VEBus.ENERGY_AC_IN2_TO_BATTERY))
        self._db_conn.insert_energy(
            f"{vebus_prefix}/energy/ac_out_to_ac_in",
            timestamp,
            vebus_values.get(VEBus.ENERGY_AC_OUT_TO_AC_IN1),
        )
        # self._database.insert_energy("", timestamp, vebus_values.get(VEBus.ENERGY_AC_OUT_TO_AC_IN2))
        self._db_conn.insert_energy(
            f"{vebus_prefix}/energy/ac_in_export", timestamp, vebus_values.get(VEBus.ENERGY_BATTERY_TO_AC_IN1)
        )
        # self._database.insert_energy("", timestamp, vebus_values.get(VEBus.ENERGY_BATTERY_TO_AC_IN2))
        self._db_conn.insert_energy(
            f"{vebus_prefix}/energy/ac_out_export", timestamp, vebus_values.get(VEBus.ENERGY_BATTERY_TO_AC_OUT)
        )
        self._db_conn.insert_energy(
            f"{vebus_prefix}/energy/ac_out_import", timestamp, vebus_values.get(VEBus.ENERGY_AC_OUT_TO_BATTERY)
        )

        if self.battery_id is not None:
            bms_prefix = self._config.control.battery_prefix

            bms_values = self.read_many(
                self.battery_id,
                [
                    Battery.DC_VOLTAGE,
                    Battery.DC_POWER,
                    Battery.SOC,
                    # Battery.CHARGED_ENERGY,
                    # Battery.DISCHARGED_ENERGY,
                ],
            )

            self._db_conn.insert_power(f"{bms_prefix}/power/battery", timestamp, bms_values.get(Battery.DC_POWER))
            self._db_conn.insert_voltage(f"{bms_prefix}/voltage/battery", timestamp, bms_values.get(Battery.DC_VOLTAGE))
            self._db_conn.insert_soc(f"{bms_prefix}/soc", timestamp, round(bms_values.get(Battery.SOC)))

    # --------------------------------#
    #  VictronModbusClient bindings  #
    # --------------------------------#

    def connect(self) -> bool:
        return self._client.connect()

    def read(self, unit_id: int, register: Register) -> float | bytes | None:
        return self._client.read(unit_id, register)

    def write(self, unit_id: int, register: Register, value: float) -> bool:
        return self._client.write(unit_id, register, value)

    def read_many(self, unit_id: int, registers: list[Register]) -> dict[Register, float | None]:
        return self._client.read_many(unit_id, registers)

    def close(self):
        self._client.close()
