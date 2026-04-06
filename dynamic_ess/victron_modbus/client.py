import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone

from pymodbus.client import ModbusTcpClient
from pymodbus.exceptions import ModbusException

from dynamic_ess.db import Database
from .config import VictronConfig
from .registers import Register, System, VEBus

logger = logging.getLogger(__name__)


@dataclass
class SystemState:
    battery_soc: float  # %
    battery_power: float  # W (negative = discharging)
    grid_power: float  # W
    consumption: float  # W
    pv_power: float  # W


@dataclass
class MultiPLusConfig:
    vebus_id: int
    phase_count: int
    ess_setpoint: int
    node_ac_in1: int | None = field(default=None)
    node_ac_in2: int | None = field(default=None)
    node_ac_out: int | None = field(default=None)


class VictronClient:
    def __init__(self, config: VictronConfig, database: Database):
        self._config = config
        self._database = database

        self._client = ModbusTcpClient(config.host, port=config.port)
        self._mp_configs: list[MultiPLusConfig] = [MultiPLusConfig(vebus_id, 0, 0) for vebus_id in config.vebus_ids]

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

        for mp_config in self._mp_configs:
            vid = mp_config.vebus_id
            mp_config.phase_count = self.detect_phases(vid)
            mp_config.node_ac_in1 = self._database.get_or_create_node(f"mp_{vid}_ac_in1", "multiplus")
            mp_config.node_ac_in2 = self._database.get_or_create_node(f"mp_{vid}_ac_in2", "multiplus")
            mp_config.node_ac_out = self._database.get_or_create_node(f"mp_{vid}_ac_out", "multiplus")

        # Enable ESS mode 3 (external control)
        self.write(self.system_id, System.ESS_MODE, 3)

        return True

    def detect_phases(self, vebus_id: int) -> int:
        """
        Detect the number of phases from a VEBus device.
        Returns 1, 2, or 3. Defaults to 3 if detection fails.
        """
        phases = self.read(vebus_id, VEBus.NUMBER_OF_PHASES)
        if phases is None or phases not in (1, 2, 3):
            logger.warning(f"Could not detect phases for VEBus {vebus_id}, defaulting to 3")
            return 3
        return int(phases)

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
            self.write(mp_config.vebus_id, VEBus.ESS_SETPOINT_L1, mp_config.ess_setpoint)

        timestamp = datetime.now(timezone.utc)

        # Read System registers
        system_regs = [
            # Per-phase
            System.AC_CONSUMPTION_L1,
            System.AC_CONSUMPTION_L2,
            System.AC_CONSUMPTION_L3,
            System.GRID_L1,
            System.GRID_L2,
            System.GRID_L3,
            System.GRID_TO_MULTIPLUS_POWER_L1,
            System.GRID_TO_MULTIPLUS_POWER_L2,
            System.GRID_TO_MULTIPLUS_POWER_L3,
            System.MULTIPLUS_OUTPUT_POWER_L1,
            System.MULTIPLUS_OUTPUT_POWER_L2,
            System.MULTIPLUS_OUTPUT_POWER_L3,
            # Non-phase (battery/system)
            System.BATTERY_POWER,
            System.BATTERY_SOC,
            System.CHARGER_POWER,
            System.DC_SYSTEM_POWER,
            System.INVERTER_CHARGER_POWER,
        ]
        system_values = self.read_many(self.system_id, system_regs)

        # Build per-phase system measurements
        phase_data = {
            1: {
                "ac_consumption": _to_int(system_values.get(System.AC_CONSUMPTION_L1)),
                "grid_power": _to_int(system_values.get(System.GRID_L1)),
                "grid_to_multiplus": _to_int(system_values.get(System.GRID_TO_MULTIPLUS_POWER_L1)),
                "multiplus_output": _to_int(system_values.get(System.MULTIPLUS_OUTPUT_POWER_L1)),
            },
            2: {
                "ac_consumption": _to_int(system_values.get(System.AC_CONSUMPTION_L2)),
                "grid_power": _to_int(system_values.get(System.GRID_L2)),
                "grid_to_multiplus": _to_int(system_values.get(System.GRID_TO_MULTIPLUS_POWER_L2)),
                "multiplus_output": _to_int(system_values.get(System.MULTIPLUS_OUTPUT_POWER_L2)),
            },
            3: {
                "ac_consumption": _to_int(system_values.get(System.AC_CONSUMPTION_L3)),
                "grid_power": _to_int(system_values.get(System.GRID_L3)),
                "grid_to_multiplus": _to_int(system_values.get(System.GRID_TO_MULTIPLUS_POWER_L3)),
                "multiplus_output": _to_int(system_values.get(System.MULTIPLUS_OUTPUT_POWER_L3)),
            },
        }
        filtered_phases = {p: phase_data[p] for p in [1, 2, 3]}
        self._database.insert_system_measurements(timestamp, filtered_phases)

        # Battery measurements
        battery_data = {
            "battery_power": _to_int(system_values.get(System.BATTERY_POWER)),
            "battery_soc": _to_int(system_values.get(System.BATTERY_SOC)),
            "inverter_charger_power": _to_int(system_values.get(System.INVERTER_CHARGER_POWER)),
        }
        self._database.insert_battery_measurement(timestamp, battery_data)

        # VEBus registers for each device
        vebus_regs = [
            VEBus.AC_INPUT_POWER_L1,
            VEBus.AC_INPUT_POWER_L2,
            VEBus.AC_INPUT_POWER_L3,
            VEBus.AC_OUTPUT_POWER_L1,
            VEBus.AC_OUTPUT_POWER_L2,
            VEBus.AC_OUTPUT_POWER_L3,
            # Energy counters
            VEBus.ENERGY_AC_IN1_TO_AC_OUT,
            VEBus.ENERGY_AC_IN1_TO_BATTERY,
            VEBus.ENERGY_AC_IN2_TO_AC_OUT,
            VEBus.ENERGY_AC_IN2_TO_BATTERY,
            VEBus.ENERGY_AC_OUT_TO_AC_IN1,
            VEBus.ENERGY_AC_OUT_TO_AC_IN2,
            VEBus.ENERGY_BATTERY_TO_AC_IN1,
            VEBus.ENERGY_BATTERY_TO_AC_IN2,
            VEBus.ENERGY_BATTERY_TO_AC_OUT,
            VEBus.ENERGY_AC_OUT_TO_BATTERY,
        ]

        for mp_config in self._mp_configs:
            vebus_values = self.read_many(mp_config.vebus_id, vebus_regs)
            # Per-phase power measurements
            vebus_phase_data = {
                1: {
                    "ac_input_power": vebus_values.get(VEBus.AC_INPUT_POWER_L1),
                    "ac_output_power": vebus_values.get(VEBus.AC_OUTPUT_POWER_L1),
                },
                2: {
                    "ac_input_power": vebus_values.get(VEBus.AC_INPUT_POWER_L2),
                    "ac_output_power": vebus_values.get(VEBus.AC_OUTPUT_POWER_L2),
                },
                3: {
                    "ac_input_power": vebus_values.get(VEBus.AC_INPUT_POWER_L3),
                    "ac_output_power": vebus_values.get(VEBus.AC_OUTPUT_POWER_L3),
                },
            }
            filtered_vebus = {p: vebus_phase_data[p] for p in range(1, mp_config.phase_count + 1)}
            self._database.insert_vebus_measurements(timestamp, mp_config.vebus_id, filtered_vebus)

            # Energy flows
            pool = self._database.get_pool_id()
            ac1 = mp_config.node_ac_in1
            ac2 = mp_config.node_ac_in2
            out = mp_config.node_ac_out
            self._database.insert_energy_flow(timestamp, ac1, out, vebus_values.get(VEBus.ENERGY_AC_IN1_TO_AC_OUT))
            self._database.insert_energy_flow(timestamp, pool, ac1, vebus_values.get(VEBus.ENERGY_AC_IN1_TO_BATTERY))
            self._database.insert_energy_flow(timestamp, ac1, out, vebus_values.get(VEBus.ENERGY_AC_IN2_TO_AC_OUT))
            self._database.insert_energy_flow(timestamp, pool, ac2, vebus_values.get(VEBus.ENERGY_AC_IN2_TO_BATTERY))
            self._database.insert_energy_flow(timestamp, out, ac1, vebus_values.get(VEBus.ENERGY_AC_OUT_TO_AC_IN1))
            self._database.insert_energy_flow(timestamp, out, ac2, vebus_values.get(VEBus.ENERGY_AC_OUT_TO_AC_IN2))
            self._database.insert_energy_flow(timestamp, ac1, pool, vebus_values.get(VEBus.ENERGY_BATTERY_TO_AC_IN1))
            self._database.insert_energy_flow(timestamp, ac2, pool, vebus_values.get(VEBus.ENERGY_BATTERY_TO_AC_IN2))
            self._database.insert_energy_flow(timestamp, out, pool, vebus_values.get(VEBus.ENERGY_BATTERY_TO_AC_OUT))
            self._database.insert_energy_flow(timestamp, pool, out, vebus_values.get(VEBus.ENERGY_AC_OUT_TO_BATTERY))

        # if self._config.grid_id:
        #     grid_regs = [
        #         GridMeter.POWER_L1,
        #         GridMeter.POWER_L2,
        #         GridMeter.POWER_L3,
        #         GridMeter.ENERGY_FORWARD,
        #         GridMeter.ENERGY_REVERSE,
        #     ]
        #
        #     grid_values = self.read_many(self._config.grid_id, grid_regs)
        #     logger.info(grid_values)

        # if self._config.bms_id:
        #     bms_regs = [
        #         Battery.DC_POWER,
        #         Battery.DISCHARGED_ENERGY,
        #         Battery.CHARGED_ENERGY,
        #     ]
        #
        #     bms_values = self.read_many(self._config.bms_id, bms_regs)
        #     logger.info(bms_values)
        # logger.debug(f"Stored measurements at {timestamp.isoformat()}")


def _to_int(value: float | None) -> int | None:
    """Convert float to int, preserving None."""
    return int(value) if value is not None else None
