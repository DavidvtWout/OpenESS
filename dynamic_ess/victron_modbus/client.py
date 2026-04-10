import logging
import pprint
from dataclasses import dataclass, field
from datetime import datetime, timezone

from pymodbus.client import ModbusTcpClient
from pymodbus.exceptions import ModbusException

from dynamic_ess.db import Database
from .config import VictronConfig
from .registers import Register, System, VEBus, GridMeter, Battery

logger = logging.getLogger(__name__)


@dataclass
class MultiPlusConfig:
    vebus_id: int
    ess_setpoint: int


class VictronClient:
    def __init__(self, config: VictronConfig, database: Database):
        self._config = config
        self._database = database

        self._client = ModbusTcpClient(config.host, port=config.port)
        self._mp_configs: list[MultiPlusConfig] = [MultiPlusConfig(vebus_id, 0) for vebus_id in config.vebus_ids]

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

    def connect(self) -> bool:
        return self._client.connect()

    def close(self):
        self._client.close()

    def set_ess_setpoint(self, power: float):
        logger.info(f"Set ESS to {power} W")
        power /= len(self._mp_configs)
        for mp_config in self._mp_configs:
            mp_config.ess_setpoint = round(power)

    def initialize(self) -> bool:
        """Connect and detect phases for all configured VEBus devices."""
        if not self.connect():
            return False

        # Enable ESS mode 3 (external control)
        self.write(self.system_id, System.ESS_MODE, 3)

        return True

    def read(self, unit_id: int, register: Register) -> float | None:
        """Read a register and return the scaled value."""
        try:
            result = self._client.read_holding_registers(
                register.address, count=register.dtype.register_count, device_id=unit_id
            )
            if result.isError():
                logger.error(f"Modbus error reading register {register.address}: {result}")
                return None

            # Combine registers based on data type
            if register.dtype.register_count == 1:
                value = result.registers[0]
                max_val = 0x8000
                subtract = 0x10000
            else:
                high, low = result.registers
                value = (high << 16) | low
                max_val = 0x80000000
                subtract = 0x100000000

            # Handle signed values
            if register.dtype.signed and value >= max_val:
                value -= subtract

            # Apply scale factor
            return value / register.scale

        except ModbusException as e:
            logger.error(f"Modbus exception reading register {register.address}: {e}")
            return None

    def write(self, unit_id: int, register: Register, value: float) -> bool:
        """Write a scaled value to a register."""
        if not register.writable:
            logger.error(f"Register {register.address} is not writable")
            return False

        try:
            # Apply scale factor (reverse)
            raw_value = int(value * register.scale)

            # Handle signed values
            if register.dtype.signed and raw_value < 0:
                raw_value += 0x10000 if register.dtype.register_count == 1 else 0x100000000

            # Write based on register count
            if register.dtype.register_count == 2:
                high = (raw_value >> 16) & 0xFFFF
                low = raw_value & 0xFFFF
                result = self._client.write_registers(register.address, [high, low], device_id=unit_id)
            else:
                result = self._client.write_register(register.address, raw_value & 0xFFFF, device_id=unit_id)

            if result.isError():
                logger.error(f"Modbus error writing register {register.address}: {result}")
                return False
            return True

        except ModbusException as e:
            logger.error(f"Modbus exception writing register {register.address}: {e}")
            return False

    def read_many(self, unit_id: int, registers: list[Register]) -> dict[Register, float | None]:
        """
        Read multiple registers efficiently by batching consecutive addresses.

        Args:
            unit_id: Modbus unit ID
            registers: List of registers to read

        Returns:
            Dict mapping each register to its scaled value (or None if read failed)
        """
        if not registers:
            return {}

        # Sort by address and track end address (for 32-bit registers)
        sorted_regs = sorted(registers, key=lambda r: r.address)

        # Group registers into batches
        batches: list[list[Register]] = []
        current_batch: list[Register] = [sorted_regs[0]]

        for reg in sorted_regs[1:]:
            prev = current_batch[-1]
            prev_end = prev.address + prev.dtype.register_count
            if reg.address == prev_end:
                current_batch.append(reg)
            else:
                batches.append(current_batch)
                current_batch = [reg]

        batches.append(current_batch)

        # Read each batch
        results: dict[Register, float | None] = {}

        for batch in batches:
            start_addr = batch[0].address
            last_reg = batch[-1]
            end_addr = last_reg.address + last_reg.dtype.register_count
            count = end_addr - start_addr

            try:
                response = self._client.read_holding_registers(start_addr, count=count, device_id=unit_id)
                if response.isError():
                    # Batch read failed - fall back to individual reads
                    logger.debug(f"Batch read {start_addr}-{end_addr} failed, falling back to individual reads")
                    for reg in batch:
                        results[reg] = self.read(unit_id, reg)
                    continue

                # Extract values for each register in this batch
                for reg in batch:
                    offset = reg.address - start_addr
                    results[reg] = self._extract_value(reg, response.registers, offset)

            except ModbusException as e:
                logger.debug(f"Batch read {start_addr}-{end_addr} failed: {e}, falling back to individual reads")
                for reg in batch:
                    results[reg] = self.read(unit_id, reg)

        return results

    @staticmethod
    def _extract_value(register: Register, raw_registers: list[int], offset: int) -> float:
        """Extract and scale a register value from raw register data."""
        if register.dtype.register_count == 1:
            value = raw_registers[offset]
            max_val = 0x8000
            subtract = 0x10000
        else:
            high = raw_registers[offset]
            low = raw_registers[offset + 1]
            value = (high << 16) | low
            max_val = 0x80000000
            subtract = 0x100000000

        if register.dtype.signed and value >= max_val:
            value -= subtract

        return value / register.scale

    def collect_and_store_measurements(self) -> None:
        """Collect all measurements from Victron and store in database."""
        for mp_config in self._mp_configs:
            threshold = 50
            if self._database.get_current_soc() >= 99 and mp_config.ess_setpoint >= -threshold:
                # Keep putting power into the battery to allow balancing of the cells by the BMS.
                # TODO: implement balancing limits?
                self.write(mp_config.vebus_id, VEBus.ESS_SETPOINT_L1, 1000)
                self.write(mp_config.vebus_id, VEBus.ESS_DISABLE_CHARGE, 0)
            else:
                if abs(mp_config.ess_setpoint) >= threshold:
                    self.write(mp_config.vebus_id, VEBus.ESS_SETPOINT_L1, mp_config.ess_setpoint)
                    self.write(mp_config.vebus_id, VEBus.ESS_DISABLE_CHARGE, 0)
                    self.write(mp_config.vebus_id, VEBus.ESS_DISABLE_FEEDBACK, 0)
                else:
                    self.write(mp_config.vebus_id, VEBus.ESS_SETPOINT_L1, 0)
                    self.write(mp_config.vebus_id, VEBus.ESS_DISABLE_CHARGE, 1)
                    self.write(mp_config.vebus_id, VEBus.ESS_DISABLE_FEEDBACK, 1)

        timestamp = datetime.now(timezone.utc)

        # Read System registers
        system_regs = [
            System.GRID_L1,
            System.GRID_L2,
            System.GRID_L3,
            System.INVERTER_CHARGER_POWER,
        ]
        system_values = self.read_many(self.system_id, system_regs)

        self._database.insert_power("grid_l1", timestamp, system_values.get(System.GRID_L1))
        self._database.insert_power("grid_l2", timestamp, system_values.get(System.GRID_L2))
        self._database.insert_power("grid_l3", timestamp, system_values.get(System.GRID_L3))
        self._database.insert_power("system_battery", timestamp, system_values.get(System.BATTERY_POWER))
        self._database.insert_power(
            "system_inverter_charger", timestamp, system_values.get(System.INVERTER_CHARGER_POWER)
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

        for mp_config in self._mp_configs:
            vebus_values = self.read_many(mp_config.vebus_id, vebus_regs)
            # logger.info(pprint.pformat(vebus_values))

            self._database.insert_power(
                f"mp_{mp_config.vebus_id}_ac_in", timestamp, vebus_values.get(VEBus.AC_INPUT_POWER_L1)
            )
            self._database.insert_power(
                f"mp_{mp_config.vebus_id}_ac_out", timestamp, vebus_values.get(VEBus.AC_OUTPUT_POWER_L1)
            )

            soc = vebus_values.get(VEBus.SOC)
            if soc is not None:
                self._database.insert_soc(f"mp_{mp_config.vebus_id}_soc", timestamp, int(soc))

            # DC power from MultiPlus: mp_dc → battery
            dc_current = vebus_values.get(VEBus.DC_CURRENT)
            dc_voltage = vebus_values.get(VEBus.DC_VOLTAGE)
            if dc_current is not None and dc_voltage is not None:
                dc_power = dc_current * dc_voltage
                self._database.insert_power(f"mp_{mp_config.vebus_id}_battery", timestamp, dc_power)

            # Energy flows
            self._database.insert_energy(
                f"mp_{mp_config.vebus_id}_ac_in_to_ac_out", timestamp, vebus_values.get(VEBus.ENERGY_AC_IN1_TO_AC_OUT)
            )
            self._database.insert_energy(
                f"mp_{mp_config.vebus_id}_ac_in_to_dc", timestamp, vebus_values.get(VEBus.ENERGY_AC_IN1_TO_BATTERY)
            )
            # self._database.insert_energy("", timestamp, vebus_values.get(VEBus.ENERGY_AC_IN2_TO_AC_OUT))
            # self._database.insert_energy("", timestamp, vebus_values.get(VEBus.ENERGY_AC_IN2_TO_BATTERY))
            self._database.insert_energy(
                f"mp_{mp_config.vebus_id}_ac_out_to_ac_in", timestamp, vebus_values.get(VEBus.ENERGY_AC_OUT_TO_AC_IN1)
            )
            # self._database.insert_energy("", timestamp, vebus_values.get(VEBus.ENERGY_AC_OUT_TO_AC_IN2))
            self._database.insert_energy(
                f"mp_{mp_config.vebus_id}_dc_to_ac_in", timestamp, vebus_values.get(VEBus.ENERGY_BATTERY_TO_AC_IN1)
            )
            # self._database.insert_energy("", timestamp, vebus_values.get(VEBus.ENERGY_BATTERY_TO_AC_IN2))
            self._database.insert_energy(
                f"mp_{mp_config.vebus_id}_dc_to_ac_out", timestamp, vebus_values.get(VEBus.ENERGY_BATTERY_TO_AC_OUT)
            )
            self._database.insert_energy(
                f"mp_{mp_config.vebus_id}_ac_out_to_dc", timestamp, vebus_values.get(VEBus.ENERGY_AC_OUT_TO_BATTERY)
            )

        if self._config.grid_id:
            # TODO: check if grid meter delivers data per phase or not
            grid_values = self.read_many(
                self._config.grid_id,
                [
                    GridMeter.ENERGY_TO_NET_TOTAL,
                    GridMeter.ENERGY_FROM_NET_TOTAL,
                ],
            )
            self._database.insert_energy("from_net_total", timestamp, grid_values.get(GridMeter.ENERGY_FROM_NET_TOTAL))
            self._database.insert_energy("to_net_total", timestamp, grid_values.get(GridMeter.ENERGY_TO_NET_TOTAL))

        if self._config.bms_id is not None:
            bms_values = self.read_many(
                self._config.bms_id,
                [
                    Battery.DC_POWER,
                    # TODO:
                    # Battery.CHARGED_ENERGY,
                    # Battery.DISCHARGED_ENERGY,
                ],
            )

            self._database.insert_power(f"bms_{self._config.bms_id}", timestamp, bms_values.get(Battery.DC_POWER))
