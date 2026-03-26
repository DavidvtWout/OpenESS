from dataclasses import dataclass
from enum import Enum


class DataType(Enum):
    UINT16 = (1, False)
    INT16 = (1, True)
    UINT32 = (2, False)
    INT32 = (2, True)

    def __init__(self, register_count: int, signed: bool):
        self.register_count = register_count
        self.signed = signed


@dataclass(frozen=True)
class Register:
    """
    Victron Modbus register definition.

    Attributes:
        address: Modbus register address
        dtype: Data type (UINT16, INT16, UINT32, INT32)
        scale: Divisor to convert raw value to actual value (default 1)
        writable: Whether the register can be written to
    """

    address: int
    dtype: DataType
    scale: int = 1
    writable: bool = False


# =============================================================================
# com.victronenergy.system (Unit ID 100)
# Aggregated system-level data
# =============================================================================
class System:
    # AC consumption
    AC_CONSUMPTION_L1 = Register(817, DataType.UINT16)
    AC_CONSUMPTION_L2 = Register(818, DataType.UINT16)
    AC_CONSUMPTION_L3 = Register(819, DataType.UINT16)

    # Grid power
    GRID_L1 = Register(820, DataType.INT16)
    GRID_L2 = Register(821, DataType.INT16)
    GRID_L3 = Register(822, DataType.INT16)

    # Battery
    BATTERY_VOLTAGE = Register(840, DataType.UINT16, scale=10)
    BATTERY_CURRENT = Register(841, DataType.INT16, scale=10)
    BATTERY_POWER = Register(842, DataType.INT16)
    BATTERY_SOC = Register(843, DataType.UINT16)
    BATTERY_STATE = Register(844, DataType.UINT16)  # 0=idle, 1=charging, 2=discharging

    # PV power
    PV_AC_COUPLED_OUTPUT_L1 = Register(850, DataType.UINT16)
    PV_AC_COUPLED_OUTPUT_L2 = Register(851, DataType.UINT16)
    PV_AC_COUPLED_OUTPUT_L3 = Register(852, DataType.UINT16)
    PV_DC_COUPLED = Register(855, DataType.UINT16)

    # ESS control (requires ESS Assistant)
    ESS_SETPOINT_L1 = Register(2700, DataType.INT16, writable=True)
    ESS_SETPOINT_L2 = Register(2701, DataType.INT16, writable=True)
    ESS_SETPOINT_L3 = Register(2702, DataType.INT16, writable=True)
    ESS_DISABLE_CHARGE = Register(2703, DataType.UINT16, writable=True)  # 0=charge allowed, 1=disabled
    ESS_DISABLE_FEEDBACK = Register(2704, DataType.UINT16, writable=True)  # 0=feedback allowed, 1=disabled
    ESS_MIN_SOC = Register(2901, DataType.UINT16, scale=10, writable=True)


# =============================================================================
# com.victronenergy.vebus (Unit ID varies, check GX device)
# MultiPlus / Quattro inverter/charger
# =============================================================================
class VEBus:
    # AC input
    AC_INPUT_VOLTAGE_L1 = Register(3, DataType.UINT16, scale=10)
    AC_INPUT_VOLTAGE_L2 = Register(4, DataType.UINT16, scale=10)
    AC_INPUT_VOLTAGE_L3 = Register(5, DataType.UINT16, scale=10)
    AC_INPUT_CURRENT_L1 = Register(6, DataType.INT16, scale=10)
    AC_INPUT_CURRENT_L2 = Register(7, DataType.INT16, scale=10)
    AC_INPUT_CURRENT_L3 = Register(8, DataType.INT16, scale=10)
    AC_INPUT_FREQUENCY = Register(9, DataType.INT16, scale=100)
    AC_INPUT_POWER_L1 = Register(12, DataType.INT16, scale=0.1)  # note: multiply by 10
    AC_INPUT_POWER_L2 = Register(13, DataType.INT16, scale=0.1)
    AC_INPUT_POWER_L3 = Register(14, DataType.INT16, scale=0.1)

    # AC output
    AC_OUTPUT_VOLTAGE_L1 = Register(15, DataType.UINT16, scale=10)
    AC_OUTPUT_VOLTAGE_L2 = Register(16, DataType.UINT16, scale=10)
    AC_OUTPUT_VOLTAGE_L3 = Register(17, DataType.UINT16, scale=10)
    AC_OUTPUT_CURRENT_L1 = Register(18, DataType.INT16, scale=10)
    AC_OUTPUT_CURRENT_L2 = Register(19, DataType.INT16, scale=10)
    AC_OUTPUT_CURRENT_L3 = Register(20, DataType.INT16, scale=10)
    AC_OUTPUT_FREQUENCY = Register(21, DataType.INT16, scale=100)
    AC_OUTPUT_POWER_L1 = Register(23, DataType.INT16, scale=0.1)
    AC_OUTPUT_POWER_L2 = Register(24, DataType.INT16, scale=0.1)
    AC_OUTPUT_POWER_L3 = Register(25, DataType.INT16, scale=0.1)

    # DC (battery side)
    DC_VOLTAGE = Register(26, DataType.UINT16, scale=100)
    DC_CURRENT = Register(27, DataType.INT16, scale=10)

    # State
    SOC = Register(30, DataType.UINT16, scale=10, writable=True)
    STATE = Register(31, DataType.UINT16)  # See VEBusState enum
    ERROR = Register(32, DataType.UINT16)

    # Control
    SWITCH_POSITION = Register(33, DataType.UINT16, writable=True)  # 1=charger only, 2=inverter only, 3=on, 4=off
    AC_INPUT_CURRENT_LIMIT = Register(22, DataType.INT16, scale=10, writable=True)


# =============================================================================
# com.victronenergy.battery (Unit ID varies)
# Battery Management System (BMS)
# =============================================================================
class Battery:
    DC_VOLTAGE = Register(259, DataType.UINT16, scale=100)
    DC_CURRENT = Register(261, DataType.INT16, scale=10)
    DC_POWER = Register(258, DataType.INT16)
    SOC = Register(266, DataType.UINT16, scale=10)
    TEMPERATURE = Register(262, DataType.INT16, scale=10)
    STATE_OF_HEALTH = Register(304, DataType.UINT16, scale=10)

    # Cell voltages (if supported by BMS)
    MIN_CELL_VOLTAGE = Register(1290, DataType.UINT16, scale=100)
    MAX_CELL_VOLTAGE = Register(1291, DataType.UINT16, scale=100)

    # Limits
    MAX_CHARGE_CURRENT = Register(305, DataType.UINT16, scale=10)
    MAX_DISCHARGE_CURRENT = Register(306, DataType.UINT16, scale=10)
    MAX_CHARGE_VOLTAGE = Register(303, DataType.UINT16, scale=10)

    # Alarms
    ALARM_LOW_VOLTAGE = Register(267, DataType.UINT16)
    ALARM_HIGH_VOLTAGE = Register(268, DataType.UINT16)
    ALARM_LOW_SOC = Register(269, DataType.UINT16)
    ALARM_HIGH_TEMPERATURE = Register(270, DataType.UINT16)
    ALARM_LOW_TEMPERATURE = Register(271, DataType.UINT16)


# =============================================================================
# com.victronenergy.solarcharger (Unit ID varies)
# MPPT Solar Charger
# =============================================================================
class SolarCharger:
    PV_VOLTAGE = Register(3700, DataType.UINT16, scale=100)
    PV_CURRENT = Register(3701, DataType.INT16, scale=10)
    PV_POWER = Register(3702, DataType.UINT32)

    BATTERY_VOLTAGE = Register(3704, DataType.UINT16, scale=100)
    BATTERY_CURRENT = Register(3705, DataType.INT16, scale=10)

    YIELD_TODAY = Register(3708, DataType.UINT16, scale=10)  # kWh
    MAX_POWER_TODAY = Register(3709, DataType.UINT16)  # W
    YIELD_YESTERDAY = Register(3710, DataType.UINT16, scale=10)  # kWh
    MAX_POWER_YESTERDAY = Register(3711, DataType.UINT16)  # W

    STATE = Register(3706, DataType.UINT16)  # 0=off, 2=fault, 3=bulk, 4=absorption, 5=float
    ERROR = Register(3707, DataType.UINT16)


# =============================================================================
# com.victronenergy.grid (Unit ID varies)
# Energy Meter (grid)
# =============================================================================
class GridMeter:
    POWER_L1 = Register(2600, DataType.INT16)
    POWER_L2 = Register(2601, DataType.INT16)
    POWER_L3 = Register(2602, DataType.INT16)
    POWER_TOTAL = Register(2603, DataType.INT16)

    VOLTAGE_L1 = Register(2616, DataType.UINT16, scale=10)
    VOLTAGE_L2 = Register(2617, DataType.UINT16, scale=10)
    VOLTAGE_L3 = Register(2618, DataType.UINT16, scale=10)

    CURRENT_L1 = Register(2619, DataType.INT16, scale=10)
    CURRENT_L2 = Register(2620, DataType.INT16, scale=10)
    CURRENT_L3 = Register(2621, DataType.INT16, scale=10)

    ENERGY_FORWARD = Register(2634, DataType.UINT32, scale=100)  # kWh imported
    ENERGY_REVERSE = Register(2636, DataType.UINT32, scale=100)  # kWh exported
