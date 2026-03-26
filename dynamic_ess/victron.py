import logging
from dataclasses import dataclass
from enum import Enum

from pydantic import BaseModel
from pymodbus.client import ModbusTcpClient
from pymodbus.exceptions import ModbusException

logger = logging.getLogger(__name__)


class DataType(Enum):
    UINT16 = (1, False)
    INT16 = (1, True)
    UINT32 = (2, False)
    INT32 = (2, True)

    def __init__(self, register_count: int, signed: bool):
        self.register_count = register_count
        self.signed = signed

# Victron GX Modbus registers (Unit ID 100 = com.victronenergy.system)
# Verify these against your setup: Settings → Services → Modbus TCP → Available services
# Full list: https://github.com/victronenergy/dbus_modbustcp/blob/master/CCGX-Modbus-TCP-register-list.xlsx
REGISTERS = {
    "battery_soc": 843,  # uint16, %
    "battery_power": 842,  # int16, W (negative = discharging)
    "grid_power": 820,  # int16, W (L1)
    "consumption": 817,  # uint16, W (AC consumption L1)
    "pv_power": 850,  # uint16, W (PV on AC output)
    "ess_setpoint": 2700,  # int16, W (ESS control, requires ESS Assistant)
}


@dataclass
class SystemState:
    battery_soc: float  # %
    battery_power: float  # W (negative = discharging)
    grid_power: float  # W
    consumption: float  # W
    pv_power: float  # W


class VictronConfig(BaseModel):
    host: str
    port: int = 502

    # Lowest allowed State-of-Charge of the battery.
    min_soc: int = 10

    # Modbus unit IDs, check Settings → Services → Modbus TCP → Available services
    system_id: int = 100
    vebus_id: int | None = None
    bms_id: int | None = None
    inverter_id: int | None = None
    grid_id: int | None = None


class VictronClient:
    def __init__(self, config: VictronConfig):
        self._config = config
        self._client = ModbusTcpClient(config.host, port=config.port)

    def connect(self) -> bool:
        return self._client.connect()

    def close(self):
        self._client.close()

    def read(self, unit_id: int, address: int, dtype: DataType) -> int | None:
        try:
            result = self._client.read_holding_registers(address, count=dtype.register_count, device_id=unit_id)
            if result.isError():
                logger.error(f"Modbus error reading register {address}: {result}")
                return None

            if dtype.register_count == 1:
                value = result.registers[0]
                max_val = 0x8000
                subtract = 0x10000
            else:
                high, low = result.registers
                value = (high << 16) | low
                max_val = 0x80000000
                subtract = 0x100000000

            if dtype.signed and value >= max_val:
                value -= subtract
            return value
        except ModbusException as e:
            logger.error(f"Modbus exception reading register {address}: {e}")
            return None

    def write(self, unit_id: int, address: int, dtype: DataType, value: int) -> bool:
        """Write register(s) as the specified data type."""
        try:
            if dtype.signed and value < 0:
                value += 0x10000 if dtype.register_count == 1 else 0x100000000

            if dtype.register_count == 2:
                high = (value >> 16) & 0xFFFF
                low = value & 0xFFFF
                result = self._client.write_registers(address, [high, low], device_id=unit_id)
            else:
                result = self._client.write_register(address, value & 0xFFFF, device_id=unit_id)

            if result.isError():
                logger.error(f"Modbus error writing register {address}: {result}")
                return False
            return True
        except ModbusException as e:
            logger.error(f"Modbus exception writing register {address}: {e}")
            return False

    def get_state(self) -> SystemState | None:
        """Read current system state."""
        unit_id = self._config.system_id
        battery_soc = self.read(unit_id, REGISTERS["battery_soc"], DataType.INT16)
        battery_power = self.read(unit_id, REGISTERS["battery_power"], DataType.INT16)
        grid_power = self.read(unit_id, REGISTERS["grid_power"], DataType.INT16)
        consumption = self.read(unit_id, REGISTERS["consumption"], DataType.UINT16)
        pv_power = self.read(unit_id, REGISTERS["pv_power"], DataType.UINT16)

        if any(v is None for v in [battery_soc, battery_power, grid_power, consumption, pv_power]):
            return None

        return SystemState(
            battery_soc=battery_soc,
            battery_power=battery_power,
            grid_power=grid_power,
            consumption=consumption,
            pv_power=pv_power,
        )

    def set_ess_power(self, power: int) -> bool:
        """
        Set ESS power setpoint.
        Positive = charge from grid, Negative = discharge to grid/loads.
        Requires ESS Assistant installed on MultiPlus.
        """
        return self.write(self._config.system_id, REGISTERS["ess_setpoint"], DataType.INT16, power)

    @property
    def host(self) -> str:
        return self._config.host

    @property
    def port(self) -> int:
        return self._config.port
