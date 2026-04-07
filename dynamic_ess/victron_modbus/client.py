import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone

from pymodbus.client import ModbusTcpClient
from pymodbus.exceptions import ModbusException

from dynamic_ess.db import Database
from .config import VictronConfig
from .registers import Register, System, VEBus, GridMeter, Battery

logger = logging.getLogger(__name__)


@dataclass
class SystemState:
    battery_soc: float  # %
    battery_power: float  # W (negative = discharging)
    grid_power: float  # W
    consumption: float  # W
    pv_power: float  # W


@dataclass
class MultiPlusConfig:
    vebus_id: int
    phase_count: int
    ess_setpoint: int
    node_ac_in1: int | None = field(default=None)
    node_ac_in2: int | None = field(default=None)
    node_ac_out: int | None = field(default=None)
    node_dc: int | None = field(default=None)


@dataclass
class BmsConfig:
    bms_id: int
    node_bms: int | None = field(default=None)
    node_battery: int | None = field(default=None)


@dataclass
class GridNodes:
    grid_l1: int
    grid_l2: int
    grid_l3: int
    pool_l1: int
    pool_l2: int
    pool_l3: int


@dataclass
class BatteryNodes:
    pool: int
    multiplus: int
    battery: int


class VictronClient:
    def __init__(self, config: VictronConfig, database: Database):
        self._config = config
        self._database = database

        self._client = ModbusTcpClient(config.host, port=config.port)
        self._mp_configs: list[MultiPlusConfig] = [MultiPlusConfig(vebus_id, 0, 0) for vebus_id in config.vebus_ids]
        self._bms_config: BmsConfig | None = BmsConfig(config.bms_id) if config.bms_id else None
        self._grid_nodes: GridNodes | None = None
        self._battery_nodes: BatteryNodes | None = None

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
            mp_config.node_dc = self._database.get_or_create_node(f"mp_{vid}_dc", "multiplus")

        # Initialize BMS nodes
        if self._bms_config:
            bid = self._bms_config.bms_id
            self._bms_config.node_bms = self._database.get_or_create_node(f"bms_{bid}", "bms")
            self._bms_config.node_battery = self._database.get_or_create_node(f"battery_{bid}", "battery")

        # Initialize grid nodes for per-phase power measurements
        self._grid_nodes = GridNodes(
            grid_l1=self._database.get_or_create_node("grid_l1", "grid", 1),
            grid_l2=self._database.get_or_create_node("grid_l2", "grid", 2),
            grid_l3=self._database.get_or_create_node("grid_l3", "grid", 3),
            pool_l1=self._database.get_pool_id(1),
            pool_l2=self._database.get_pool_id(2),
            pool_l3=self._database.get_pool_id(3),
        )

        # Initialize battery nodes for battery power measurements
        self._battery_nodes = BatteryNodes(
            pool=self._database.get_pool_id(),
            multiplus=self._database.get_or_create_node("multiplus", "multiplus"),
            battery=self._database.get_or_create_node("battery", "battery"),
        )

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
            # TODO: if SoC is >99% enable charger to balance cells.
            threshold = 50
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
            System.BATTERY_POWER,
            System.BATTERY_SOC,
            System.INVERTER_CHARGER_POWER,
        ]
        system_values = self.read_many(self.system_id, system_regs)

        # Grid power per phase: grid_lX → pool_lX
        gn = self._grid_nodes
        grid_l1 = system_values.get(System.GRID_L1)
        grid_l2 = system_values.get(System.GRID_L2)
        grid_l3 = system_values.get(System.GRID_L3)
        if grid_l1 is not None:
            self._database.insert_power_flow(timestamp, gn.grid_l1, gn.pool_l1, grid_l1)
        if grid_l2 is not None:
            self._database.insert_power_flow(timestamp, gn.grid_l2, gn.pool_l2, grid_l2)
        if grid_l3 is not None:
            self._database.insert_power_flow(timestamp, gn.grid_l3, gn.pool_l3, grid_l3)

        # Battery power: multiplus → battery
        bn = self._battery_nodes
        battery_power = system_values.get(System.BATTERY_POWER)
        if battery_power is not None:
            self._database.insert_power_flow(timestamp, bn.multiplus, bn.battery, battery_power)

        # Inverter/charger power: pool → multiplus
        inverter_charger_power = system_values.get(System.INVERTER_CHARGER_POWER)
        if inverter_charger_power is not None:
            self._database.insert_power_flow(timestamp, bn.pool, bn.multiplus, inverter_charger_power)

        # Battery SOC
        soc = system_values.get(System.BATTERY_SOC)
        if soc is not None:
            self._database.insert_soc(timestamp, int(soc))

        # VEBus registers for each device
        vebus_regs = [
            VEBus.AC_INPUT_POWER_L1,
            VEBus.AC_INPUT_POWER_L2,
            VEBus.AC_INPUT_POWER_L3,
            VEBus.AC_OUTPUT_POWER_L1,
            VEBus.AC_OUTPUT_POWER_L2,
            VEBus.AC_OUTPUT_POWER_L3,
            VEBus.DC_CURRENT,
            VEBus.DC_VOLTAGE,
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

        pool = self._database.get_pool_id()

        for mp_config in self._mp_configs:
            vebus_values = self.read_many(mp_config.vebus_id, vebus_regs)
            # logger.info(pprint.pformat(vebus_values))

            # Sum power across phases for ac_input and ac_output
            ac_input_power = sum(
                vebus_values.get(reg) or 0
                for reg in [VEBus.AC_INPUT_POWER_L1, VEBus.AC_INPUT_POWER_L2, VEBus.AC_INPUT_POWER_L3]
            )
            ac_output_power = sum(
                vebus_values.get(reg) or 0
                for reg in [VEBus.AC_OUTPUT_POWER_L1, VEBus.AC_OUTPUT_POWER_L2, VEBus.AC_OUTPUT_POWER_L3]
            )

            # Power flows: pool → ac_in1, pool → ac_out (ac_out is negative)
            ac1 = mp_config.node_ac_in1
            out = mp_config.node_ac_out
            self._database.insert_power_flow(timestamp, pool, ac1, ac_input_power)
            self._database.insert_power_flow(timestamp, pool, out, -ac_output_power)

            # DC power from MultiPlus: mp_dc → battery
            dc_current = vebus_values.get(VEBus.DC_CURRENT)
            dc_voltage = vebus_values.get(VEBus.DC_VOLTAGE)
            if dc_current is not None and dc_voltage is not None:
                dc_power = dc_current * dc_voltage
                self._database.insert_power_flow(timestamp, mp_config.node_dc, bn.battery, dc_power)

            # Energy flows
            ac2 = mp_config.node_ac_in2
            self._database.insert_energy_flow(timestamp, ac1, out, vebus_values.get(VEBus.ENERGY_AC_IN1_TO_AC_OUT))
            self._database.insert_energy_flow(timestamp, pool, ac1, vebus_values.get(VEBus.ENERGY_AC_IN1_TO_BATTERY))
            self._database.insert_energy_flow(timestamp, ac2, out, vebus_values.get(VEBus.ENERGY_AC_IN2_TO_AC_OUT))
            self._database.insert_energy_flow(timestamp, pool, ac2, vebus_values.get(VEBus.ENERGY_AC_IN2_TO_BATTERY))
            self._database.insert_energy_flow(timestamp, out, ac1, vebus_values.get(VEBus.ENERGY_AC_OUT_TO_AC_IN1))
            self._database.insert_energy_flow(timestamp, out, ac2, vebus_values.get(VEBus.ENERGY_AC_OUT_TO_AC_IN2))
            self._database.insert_energy_flow(timestamp, ac1, pool, vebus_values.get(VEBus.ENERGY_BATTERY_TO_AC_IN1))
            self._database.insert_energy_flow(timestamp, ac2, pool, vebus_values.get(VEBus.ENERGY_BATTERY_TO_AC_IN2))
            self._database.insert_energy_flow(timestamp, out, pool, vebus_values.get(VEBus.ENERGY_BATTERY_TO_AC_OUT))
            self._database.insert_energy_flow(timestamp, pool, out, vebus_values.get(VEBus.ENERGY_AC_OUT_TO_BATTERY))

        if self._config.grid_id:
            # TODO: check if grid meter delivers data per phase or not
            grid_values = self.read_many(
                self._config.grid_id,
                [
                    GridMeter.ENERGY_TO_NET_TOTAL,
                    GridMeter.ENERGY_FROM_NET_TOTAL,
                ],
            )
            gid = self._database.get_grid_id()
            pid = self._database.get_pool_id()
            self._database.insert_energy_flow(timestamp, gid, pid, grid_values.get(GridMeter.ENERGY_FROM_NET_TOTAL))
            self._database.insert_energy_flow(timestamp, pid, gid, grid_values.get(GridMeter.ENERGY_FROM_NET_TOTAL))

        if self._bms_config:
            bms_regs = [Battery.DC_POWER]
            bms_values = self.read_many(self._bms_config.bms_id, bms_regs)

            # BMS DC power: bms → battery
            bms_dc_power = bms_values.get(Battery.DC_POWER)
            if bms_dc_power is not None:
                self._database.insert_power_flow(
                    timestamp, self._bms_config.node_bms, self._bms_config.node_battery, bms_dc_power
                )
        logger.debug(f"Stored measurements at {timestamp.isoformat()}")
