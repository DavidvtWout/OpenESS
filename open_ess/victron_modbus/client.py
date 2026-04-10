import logging
from datetime import datetime, timezone, timedelta
from threading import Lock

from pydantic import BaseModel

from open_ess.database import Database
from open_ess.metrics import BatteryConfig, VictronControl
from .config import VictronConfig
from .modbus_client import VictronModbusClient
from .registers import Register, System, VEBus, GridMeter, Battery, SolarInverter

logger = logging.getLogger(__name__)


class MultiPlusConfig(BaseModel):
    battery_config: BatteryConfig
    setpoint: int | None = None
    setpoint_expiration: datetime | None = None

    @property
    def vebus_id(self) -> int:
        return self.battery_config.control.vebus_id

    @property
    def battery_id(self) -> int | None:
        return self.battery_config.control.battery_id


class VictronClient:
    def __init__(self, config: VictronConfig, battery_configs: list[BatteryConfig], database: Database):
        self._config = config
        self._mp_configs: dict[str, MultiPlusConfig] = {
            cfg.name: MultiPlusConfig(battery_config=cfg)
            for cfg in battery_configs
            if isinstance(cfg.control, VictronControl)
        }
        self._database = database

        self._client = VictronModbusClient(config)

        self._lock = Lock()

    @property
    def host(self) -> str:
        return self._config.host

    @property
    def port(self) -> int:
        return self._config.port

    @property
    def address(self) -> str:
        return f"{self.host}:{self.port}"

    @property
    def system_id(self) -> int:
        return self._config.system_id

    @property
    def need_mode_3(self) -> bool:
        with self._lock:
            return any(not cfg.battery_config.control.monitor_only for cfg in self._mp_configs.values())

    def set_ess_setpoint(self, battery_name: str, power: float, until: datetime | None = None):
        with self._lock:
            if battery_name not in self._mp_configs:
                raise ValueError(f"No known battery with name '{battery_name}'")
            if until is None:
                until = datetime.now(tz=timezone.utc) + timedelta(hours=1)
            logger.info(f"Set {battery_name} to {power} W")
            self._mp_configs[battery_name].setpoint = power
            self._mp_configs[battery_name].setpoint_expiration = until

    def initialize(self) -> bool:
        if not self.connect():
            return False

        # Enable ESS mode 3 (external control)
        if self.need_mode_3:
            self.write(self.system_id, System.ESS_MODE, 3)

        return True

    def write_setpoints(self):
        if self.need_mode_3:
            ess_mode = self.read(self.system_id, System.ESS_MODE)
            if ess_mode != 3:
                raise ValueError("Someone disabled ESS mode 3! Is VRM still managing the system?")

        now = datetime.now(tz=timezone.utc)
        for mp_config in self._mp_configs.values():
            with self._lock:
                if mp_config.setpoint_expiration is None or mp_config.setpoint_expiration >= now:
                    mp_config.setpoint = None
                    mp_config.setpoint_expiration = None
                if mp_config.setpoint is None:
                    continue
            idle_threshold = mp_config.battery_config.idle_threshold_w
            if self._database.get_current_soc() >= 99 and mp_config.setpoint >= -idle_threshold:
                # Keep putting power into the battery to allow balancing of the cells by the BMS.
                # TODO: implement balancing limits?
                self.write(
                    mp_config.vebus_id, VEBus.ESS_SETPOINT_L1, int(mp_config.battery_config.max_charge_power_kw * 1000)
                )
                self.write(mp_config.vebus_id, VEBus.ESS_DISABLE_CHARGE, 0)
            else:
                if abs(mp_config.setpoint) >= idle_threshold:
                    self.write(mp_config.vebus_id, VEBus.ESS_SETPOINT_L1, mp_config.setpoint)
                    self.write(mp_config.vebus_id, VEBus.ESS_DISABLE_CHARGE, 0)
                    self.write(mp_config.vebus_id, VEBus.ESS_DISABLE_FEEDBACK, 0)
                else:
                    self.write(mp_config.vebus_id, VEBus.ESS_SETPOINT_L1, 0)
                    if mp_config.battery_config.control.disable_charger_when_idle:
                        self.write(mp_config.vebus_id, VEBus.ESS_DISABLE_CHARGE, 1)
                    if mp_config.battery_config.control.disable_inverter_when_idle:
                        self.write(mp_config.vebus_id, VEBus.ESS_DISABLE_FEEDBACK, 1)

    def collect_and_store_measurements(self) -> None:
        timestamp = datetime.now(timezone.utc)

        # Read System registers
        system_regs = [System.GRID_L1, System.GRID_L2, System.GRID_L3]
        system_values = self.read_many(self.system_id, system_regs)
        self._database.insert_power("grid_l1", timestamp, system_values.get(System.GRID_L1))
        self._database.insert_power("grid_l2", timestamp, system_values.get(System.GRID_L2))
        self._database.insert_power("grid_l3", timestamp, system_values.get(System.GRID_L3))

        if self._config.grid_id:
            # TODO: check if grid meter delivers data per phase or not
            grid_values = self.read_many(
                self._config.grid_id,
                [GridMeter.ENERGY_TO_NET_TOTAL, GridMeter.ENERGY_FROM_NET_TOTAL],
            )
            self._database.insert_energy("grid_import", timestamp, grid_values.get(GridMeter.ENERGY_FROM_NET_TOTAL))
            self._database.insert_energy("grid_export", timestamp, grid_values.get(GridMeter.ENERGY_TO_NET_TOTAL))

        if self._config.pvinverter_id:
            pvinverter_values = self.read_many(
                self._config.pvinverter_id,
                [
                    SolarInverter.ENERGY_L1,
                    SolarInverter.POWER_L1,
                ],
            )
            self._database.insert_energy(
                f"pvinverter_{self._config.pvinverter_id}_l1", timestamp, pvinverter_values.get(SolarInverter.ENERGY_L1)
            )
            self._database.insert_power(
                f"pvinverter_{self._config.pvinverter_id}_l1", timestamp, pvinverter_values.get(SolarInverter.POWER_L1)
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

        for mp_config in self._mp_configs.values():
            vebus_values = self.read_many(mp_config.vebus_id, vebus_regs)

            self._database.insert_power(
                f"vebus_{mp_config.vebus_id}_ac_in_l1", timestamp, vebus_values.get(VEBus.AC_INPUT_POWER_L1)
            )
            self._database.insert_power(
                f"vebus_{mp_config.vebus_id}_ac_out_l1", timestamp, vebus_values.get(VEBus.AC_OUTPUT_POWER_L1)
            )

            soc = vebus_values.get(VEBus.SOC)
            if soc is not None:
                self._database.insert_soc(f"vebus_{mp_config.vebus_id}_soc", timestamp, int(soc))

            # DC power from MultiPlus: mp_dc → battery
            dc_current = vebus_values.get(VEBus.DC_CURRENT)
            dc_voltage = vebus_values.get(VEBus.DC_VOLTAGE)
            if dc_current is not None and dc_voltage is not None:
                dc_power = dc_current * dc_voltage
                self._database.insert_power(f"vebus_{mp_config.vebus_id}_battery", timestamp, dc_power)
            self._database.insert_power(f"vebus_{mp_config.vebus_id}_battery_voltage", timestamp, dc_voltage)

            # Energy flows
            self._database.insert_energy(
                f"vebus_{mp_config.vebus_id}_ac_in_to_ac_out",
                timestamp,
                vebus_values.get(VEBus.ENERGY_AC_IN1_TO_AC_OUT),
            )
            self._database.insert_energy(
                f"vebus_{mp_config.vebus_id}_ac_in_import", timestamp, vebus_values.get(VEBus.ENERGY_AC_IN1_TO_BATTERY)
            )
            # self._database.insert_energy("", timestamp, vebus_values.get(VEBus.ENERGY_AC_IN2_TO_AC_OUT))
            # self._database.insert_energy("", timestamp, vebus_values.get(VEBus.ENERGY_AC_IN2_TO_BATTERY))
            self._database.insert_energy(
                f"vebus_{mp_config.vebus_id}_ac_out_to_ac_in",
                timestamp,
                vebus_values.get(VEBus.ENERGY_AC_OUT_TO_AC_IN1),
            )
            # self._database.insert_energy("", timestamp, vebus_values.get(VEBus.ENERGY_AC_OUT_TO_AC_IN2))
            self._database.insert_energy(
                f"vebus_{mp_config.vebus_id}_ac_in_export", timestamp, vebus_values.get(VEBus.ENERGY_BATTERY_TO_AC_IN1)
            )
            # self._database.insert_energy("", timestamp, vebus_values.get(VEBus.ENERGY_BATTERY_TO_AC_IN2))
            self._database.insert_energy(
                f"vebus_{mp_config.vebus_id}_ac_out_export", timestamp, vebus_values.get(VEBus.ENERGY_BATTERY_TO_AC_OUT)
            )
            self._database.insert_energy(
                f"vebus_{mp_config.vebus_id}_ac_out_import", timestamp, vebus_values.get(VEBus.ENERGY_AC_OUT_TO_BATTERY)
            )

            if mp_config.battery_id is not None:
                bms_values = self.read_many(
                    mp_config.battery_id,
                    [
                        Battery.DC_VOLTAGE,
                        Battery.DC_POWER,
                        Battery.SOC,
                        # Battery.CHARGED_ENERGY,
                        # Battery.DISCHARGED_ENERGY,
                    ],
                )

                self._database.insert_power(
                    f"battery_{mp_config.battery_id}", timestamp, bms_values.get(Battery.DC_POWER)
                )
                # "Abuse" power table for voltages because the compression algorithm also works perfectly fine for voltages.
                self._database.insert_power(
                    f"battery_{mp_config.battery_id}_voltage", timestamp, bms_values.get(Battery.DC_VOLTAGE)
                )
                if bms_values.get(Battery.SOC) is not None:
                    self._database.insert_soc(
                        f"battery_{mp_config.battery_id}", timestamp, round(bms_values.get(Battery.SOC))
                    )

    # --------------------------------#
    #  VictronModbusClient bindings  #
    # --------------------------------#

    def connect(self) -> bool:
        return self._client.connect()

    def read(self, unit_id: int, register: Register) -> float | None:
        return self._client.read(unit_id, register)

    def write(self, unit_id: int, register: Register, value: float) -> bool:
        return self._client.write(unit_id, register, value)

    def read_many(self, unit_id: int, registers: list[Register]) -> dict[Register, float | None]:
        return self._client.read_many(unit_id, registers)

    def close(self):
        self._client.close()
