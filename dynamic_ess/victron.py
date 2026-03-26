import logging
from dataclasses import dataclass

from pydantic import BaseModel
from pymodbus.client import ModbusTcpClient
from pymodbus.exceptions import ModbusException

logger = logging.getLogger(__name__)

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

    def _read_register(self, unit_id: int, address: int, signed: bool = False) -> int | None:
        """Read a single holding register."""
        try:
            result = self._client.read_holding_registers(address, count=1, device_id=unit_id)
            if result.isError():
                logger.error(f"Modbus error reading register {address}: {result}")
                return None
            value = result.registers[0]
            if signed and value >= 0x8000:
                value -= 0x10000
            return value
        except ModbusException as e:
            logger.error(f"Modbus exception reading register {address}: {e}")
            return None

    def _write_register(self, unit_id: int, address: int, value: int) -> bool:
        """Write a single holding register."""
        try:
            if value < 0:
                value += 0x10000
            result = self._client.write_register(address, value, device_id=unit_id)
            if result.isError():
                logger.error(f"Modbus error writing register {address}: {result}")
                return False
            return True
        except ModbusException as e:
            logger.error(f"Modbus exception writing register {address}: {e}")
            return False

    def scan_registers(self, unit_id: int):
        logger.info(f"Readable registers for unit {unit_id}:")

        for register in range(1, 10000):
            try:
                result = self._client.read_holding_registers(register, device_id=unit_id)
                if not result.isError():
                    logger.info(f"unit {unit_id} - register {register}: Readable ({result.registers})")
            except ModbusException as e:
                logger.info(f"unit {unit_id} - register {register}: Error - {e}")

    def get_state(self) -> SystemState | None:
        """Read current system state."""
        battery_soc = self._read_register(REGISTERS["battery_soc"])
        battery_power = self._read_register(REGISTERS["battery_power"], signed=True)
        grid_power = self._read_register(REGISTERS["grid_power"], signed=True)
        consumption = self._read_register(REGISTERS["consumption"])
        pv_power = self._read_register(REGISTERS["pv_power"])

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
        return self._write_register(REGISTERS["ess_setpoint"], power)

    @property
    def host(self) -> str:
        return self._config.host

    @property
    def port(self) -> int:
        return self._config.port
