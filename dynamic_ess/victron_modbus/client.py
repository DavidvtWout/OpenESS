import logging
import pprint
from dataclasses import dataclass

from pydantic import BaseModel
from pymodbus.client import ModbusTcpClient
from pymodbus.exceptions import ModbusException

from .registers import Register, System, VEBus, Battery

logger = logging.getLogger(__name__)


class VictronConfig(BaseModel):
    host: str
    port: int = 502

    # Lowest allowed State-of-Charge of the battery.
    min_soc: int = 10

    # Modbus unit IDs, check Settings → Services → Modbus TCP → Available services
    system_id: int = 100
    vebus_id: int | None = None
    bms_id: int | None = None
    solarcharger_id: int | None = None
    grid_id: int | None = None


@dataclass
class SystemState:
    battery_soc: float  # %
    battery_power: float  # W (negative = discharging)
    grid_power: float  # W
    consumption: float  # W
    pv_power: float  # W


class VictronClient:
    def __init__(self, config: VictronConfig):
        self._config = config
        self._client = ModbusTcpClient(config.host, port=config.port)

    @property
    def host(self) -> str:
        return self._config.host

    @property
    def port(self) -> int:
        return self._config.port

    def connect(self) -> bool:
        return self._client.connect()

    def close(self):
        self._client.close()

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

    def read_many(
            self, unit_id: int, registers: list[Register]
    ) -> dict[Register, float | None]:
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

    def get_state(self):
        print()

        regs = [
            System.AC_CONSUMPTION_L1,
            System.AC_CONSUMPTION_L2,
            System.AC_CONSUMPTION_L3,
            System.GRID_L1,
            System.GRID_L2,
            System.GRID_L3,
            System.GENSET_L1,
            System.GENSET_L2,
            System.GENSET_L3,
            System.BATTERY_POWER,
            System.CHARGER_POWER,
            System.DC_SYSTEM_POWER,
            System.INVERTER_CHARGER_POWER,
            System.GRID_TO_MULTIPLUS_POWER_L1,
            System.GRID_TO_MULTIPLUS_POWER_L2,
            System.GRID_TO_MULTIPLUS_POWER_L3,
            System.MULTIPLUS_OUTPUT_POWER_L1,
            System.MULTIPLUS_OUTPUT_POWER_L2,
            System.MULTIPLUS_OUTPUT_POWER_L3,
        ]
        system_values = self.read_many(self._config.system_id, regs)
        logger.info(f"\n{pprint.pformat(system_values, indent=2)}")

        regs = [
            VEBus.AC_INPUT_POWER_L1,
            VEBus.AC_INPUT_POWER_L2,
            VEBus.AC_INPUT_POWER_L3,
            VEBus.AC_OUTPUT_POWER_L1,
            VEBus.AC_OUTPUT_POWER_L2,
            VEBus.AC_OUTPUT_POWER_L3,
            VEBus.DC_VOLTAGE,
            VEBus.DC_CURRENT,
            # Energy counters (kWh)
            VEBus.ENERGY_AC_IN1_TO_AC_OUT,
            VEBus.ENERGY_AC_IN1_TO_INVERTER,
            VEBus.ENERGY_AC_IN2_TO_AC_OUT,
            VEBus.ENERGY_AC_IN2_TO_INVERTER,
            VEBus.ENERGY_AC_OUT_TO_AC_IN1,
            VEBus.ENERGY_AC_OUT_TO_AC_IN2,
            VEBus.ENERGY_INVERTER_TO_AC_IN1,
            VEBus.ENERGY_INVERTER_TO_AC_IN2,
            VEBus.ENERGY_INVERTER_TO_AC_OUT,
            VEBus.ENERGY_AC_OUT_TO_INVERTER,
        ]
        multiplus_values = self.read_many(self._config.vebus_id, regs)
        logger.info(f"\n{pprint.pformat(multiplus_values, indent=2)}")

        regs = [
            Battery.DC_POWER,
            Battery.DISCHARGED_ENERGY,
            Battery.CHARGED_ENERGY,
        ]
        bms_values = self.read_many(self._config.bms_id, regs)
        logger.info(f"\n{pprint.pformat(bms_values, indent=2)}")
