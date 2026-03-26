import logging
from dataclasses import dataclass

from pydantic import BaseModel
from pymodbus.client import ModbusTcpClient
from pymodbus.exceptions import ModbusException

from .registers import Register, System

logger = logging.getLogger(__name__)


class VictronConfig(BaseModel):
    host: str
    port: int = 502

    # Lowest allowed State-of-Charge of the battery.
    min_soc: int = 10

    # Modbus unit IDs, check Settings → Services → Modbus TCP → Available services
    system_id: int = 100
    vebus_id: int | None = None
    battery_id: int | None = None
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

    def read_raw(self, unit_id: int, register: Register) -> int | None:
        """Read a register without applying scale factor."""
        try:
            result = self._client.read_holding_registers(
                register.address, count=register.dtype.register_count, device_id=unit_id
            )
            if result.isError():
                logger.error(f"Modbus error reading register {register.address}: {result}")
                return None

            if register.dtype.register_count == 1:
                value = result.registers[0]
                max_val = 0x8000
                subtract = 0x10000
            else:
                high, low = result.registers
                value = (high << 16) | low
                max_val = 0x80000000
                subtract = 0x100000000

            if register.dtype.signed and value >= max_val:
                value -= subtract

            return value

        except ModbusException as e:
            logger.error(f"Modbus exception reading register {register.address}: {e}")
            return None

    def get_state(self) -> SystemState | None:
        """Read current system state from com.victronenergy.system registers."""
        unit_id = self._config.system_id
        battery_soc = self.read(unit_id, System.BATTERY_SOC)
        battery_power = self.read(unit_id, System.BATTERY_POWER)
        grid_power = self.read(unit_id, System.GRID_L1)
        consumption = self.read(unit_id, System.AC_CONSUMPTION_L1)
        pv_power = self.read(unit_id, System.PV_DC_COUPLED)

        if any(v is None for v in [battery_soc, battery_power, grid_power, consumption, pv_power]):
            return None

        return SystemState(
            battery_soc=battery_soc,
            battery_power=battery_power,
            grid_power=grid_power,
            consumption=consumption,
            pv_power=pv_power,
        )
