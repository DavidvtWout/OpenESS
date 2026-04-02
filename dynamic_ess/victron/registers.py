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
        name: Human-readable name for the register
        address: Modbus register address
        dtype: Data type (UINT16, INT16, UINT32, INT32)
        scale: Divisor to convert raw value to actual value (default 1)
        writable: Whether the register can be written to
    """

    name: str
    address: int
    dtype: DataType
    scale: float = 1
    writable: bool = False

    def __str__(self) -> str:
        return f"{self.name} ({self.address})"

    def __repr__(self) -> str:
        return str(self)

    def __lt__(self, other: "Register") -> bool:
        return self.address < other.address


# =============================================================================
# com.victronenergy.system (Unit ID 100)
# Aggregated system-level data
# =============================================================================
class System:
    # AC consumption
    AC_CONSUMPTION_L1 = Register("AC Consumption L1", 817, DataType.UINT16)
    AC_CONSUMPTION_L2 = Register("AC Consumption L2", 818, DataType.UINT16)
    AC_CONSUMPTION_L3 = Register("AC Consumption L3", 819, DataType.UINT16)

    # Grid power
    GRID_L1 = Register("Grid L1", 820, DataType.INT16)
    GRID_L2 = Register("Grid L2", 821, DataType.INT16)
    GRID_L3 = Register("Grid L3", 822, DataType.INT16)

    # Genset power
    GENSET_L1 = Register("Genset L1", 823, DataType.INT16)
    GENSET_L2 = Register("Genset L2", 824, DataType.INT16)
    GENSET_L3 = Register("Genset L3", 825, DataType.INT16)

    # Battery
    BATTERY_VOLTAGE = Register("Battery Voltage", 840, DataType.UINT16, scale=10)
    BATTERY_CURRENT = Register("Battery Current", 841, DataType.INT16, scale=10)
    BATTERY_POWER = Register("Battery Power", 842, DataType.INT16)
    BATTERY_SOC = Register("Battery SOC", 843, DataType.UINT16)
    BATTERY_STATE = Register("Battery State", 844, DataType.UINT16)  # 0=idle, 1=charging, 2=discharging
    BATTERY_CONSUMED_AH = Register("Battery Consumed Amp-hours", 845, DataType.UINT16, scale=-10)

    # Charger/Inverter power
    CHARGER_POWER = Register("Charger Power", 855, DataType.UINT16)
    DC_SYSTEM_POWER = Register("DC System Power", 860, DataType.INT16)
    INVERTER_CHARGER_POWER = Register("Inverter/Charger Power", 870, DataType.INT32)
    GRID_TO_MULTIPLUS_POWER_L1 = Register("Grid to MultiPlus Power L1", 872, DataType.INT32)
    GRID_TO_MULTIPLUS_POWER_L2 = Register("Grid to MultiPlus Power L2", 874, DataType.INT32)
    GRID_TO_MULTIPLUS_POWER_L3 = Register("Grid to MultiPlus Power L3", 876, DataType.INT32)
    MULTIPLUS_OUTPUT_POWER_L1 = Register("MultiPlus to Output Power L1", 878, DataType.INT32)
    MULTIPLUS_OUTPUT_POWER_L2 = Register("MultiPlus to Output Power L2", 880, DataType.INT32)
    MULTIPLUS_OUTPUT_POWER_L3 = Register("MultiPlus to Output Power L3", 882, DataType.INT32)

    # PV power
    PV_DC_COUPLED_POWER = Register("PV DC Coupled Power", 850, DataType.UINT16)
    PV_AC_COUPLED_OUTPUT_L1 = Register("PV AC Output L1", 884, DataType.UINT16)
    PV_AC_COUPLED_OUTPUT_L2 = Register("PV AC Output L2", 885, DataType.UINT16)
    PV_AC_COUPLED_OUTPUT_L3 = Register("PV AC Output L3", 886, DataType.UINT16)

    # ESS control (requires ESS Assistant)
    ESS_SETPOINT_L1 = Register("ESS Setpoint L1", 2700, DataType.INT16, writable=True)
    ESS_SETPOINT_L2 = Register("ESS Setpoint L2", 2701, DataType.INT16, writable=True)
    ESS_SETPOINT_L3 = Register("ESS Setpoint L3", 2702, DataType.INT16, writable=True)
    ESS_DISABLE_CHARGE = Register("ESS Disable Charge", 2703, DataType.UINT16, writable=True)
    ESS_DISABLE_FEEDBACK = Register("ESS Disable Feedback", 2704, DataType.UINT16, writable=True)
    ESS_MIN_SOC = Register("ESS Min SOC", 2901, DataType.UINT16, scale=10, writable=True)


# =============================================================================
# com.victronenergy.vebus (Unit ID varies, check GX device)
# MultiPlus / Quattro inverter/charger
# =============================================================================
class VEBus:
    # AC input
    AC_INPUT_VOLTAGE_L1 = Register("AC Input Voltage L1", 3, DataType.UINT16, scale=10)
    AC_INPUT_VOLTAGE_L2 = Register("AC Input Voltage L2", 4, DataType.UINT16, scale=10)
    AC_INPUT_VOLTAGE_L3 = Register("AC Input Voltage L3", 5, DataType.UINT16, scale=10)
    AC_INPUT_CURRENT_L1 = Register("AC Input Current L1", 6, DataType.INT16, scale=10)
    AC_INPUT_CURRENT_L2 = Register("AC Input Current L2", 7, DataType.INT16, scale=10)
    AC_INPUT_CURRENT_L3 = Register("AC Input Current L3", 8, DataType.INT16, scale=10)
    AC_INPUT_FREQUENCY = Register("AC Input Frequency", 9, DataType.INT16, scale=100)
    AC_INPUT_POWER_L1 = Register("AC Input Power L1", 12, DataType.INT16, scale=0.1)
    AC_INPUT_POWER_L2 = Register("AC Input Power L2", 13, DataType.INT16, scale=0.1)
    AC_INPUT_POWER_L3 = Register("AC Input Power L3", 14, DataType.INT16, scale=0.1)

    # AC output
    AC_OUTPUT_VOLTAGE_L1 = Register("AC Output Voltage L1", 15, DataType.UINT16, scale=10)
    AC_OUTPUT_VOLTAGE_L2 = Register("AC Output Voltage L2", 16, DataType.UINT16, scale=10)
    AC_OUTPUT_VOLTAGE_L3 = Register("AC Output Voltage L3", 17, DataType.UINT16, scale=10)
    AC_OUTPUT_CURRENT_L1 = Register("AC Output Current L1", 18, DataType.INT16, scale=10)
    AC_OUTPUT_CURRENT_L2 = Register("AC Output Current L2", 19, DataType.INT16, scale=10)
    AC_OUTPUT_CURRENT_L3 = Register("AC Output Current L3", 20, DataType.INT16, scale=10)
    AC_OUTPUT_FREQUENCY = Register("AC Output Frequency", 21, DataType.INT16, scale=100)
    AC_OUTPUT_POWER_L1 = Register("AC Output Power L1", 23, DataType.INT16, scale=0.1)
    AC_OUTPUT_POWER_L2 = Register("AC Output Power L2", 24, DataType.INT16, scale=0.1)
    AC_OUTPUT_POWER_L3 = Register("AC Output Power L3", 25, DataType.INT16, scale=0.1)

    # DC (battery side)
    DC_VOLTAGE = Register("DC Voltage", 26, DataType.UINT16, scale=100)
    DC_CURRENT = Register("DC Current", 27, DataType.INT16, scale=10)

    # State
    SOC = Register("SOC", 30, DataType.UINT16, scale=10, writable=True)
    STATE = Register("State", 31, DataType.UINT16)
    ERROR = Register("Error", 32, DataType.UINT16)

    # Control
    SWITCH_POSITION = Register("Switch Position", 33, DataType.UINT16, writable=True)
    AC_INPUT_CURRENT_LIMIT = Register("AC Input Current Limit", 22, DataType.INT16, scale=10, writable=True)

    # Energy counters (kWh) - NOTE: These are volatile and reset on Multi/GX reboot
    ENERGY_AC_IN1_TO_AC_OUT = Register("Energy AC-In 1 to AC-Out", 74, DataType.UINT32, scale=100)
    ENERGY_AC_IN1_TO_INVERTER = Register("Energy AC-In 1 to Battery", 76, DataType.UINT32, scale=100)
    ENERGY_AC_IN2_TO_AC_OUT = Register("Energy AC-In 2 to AC-Out", 78, DataType.UINT32, scale=100)
    ENERGY_AC_IN2_TO_INVERTER = Register("Energy AC-In 2 to Battery", 80, DataType.UINT32, scale=100)
    ENERGY_AC_OUT_TO_AC_IN1 = Register("Energy AC-Out to AC-In 1", 82, DataType.UINT32, scale=100)
    ENERGY_AC_OUT_TO_AC_IN2 = Register("Energy AC-Out to AC-In 2", 84, DataType.UINT32, scale=100)
    ENERGY_INVERTER_TO_AC_IN1 = Register("Energy Battery to AC-In 1", 86, DataType.UINT32, scale=100)
    ENERGY_INVERTER_TO_AC_IN2 = Register("Energy Battery to AC-In 2", 88, DataType.UINT32, scale=100)
    ENERGY_INVERTER_TO_AC_OUT = Register("Energy Battery to AC-Out", 90, DataType.UINT32, scale=100)
    ENERGY_AC_OUT_TO_INVERTER = Register("Energy AC-Out to Battery", 92, DataType.UINT32, scale=100)


# =============================================================================
# com.victronenergy.battery (Unit ID varies)
# Battery Management System (BMS)
# =============================================================================
class Battery:
    DC_VOLTAGE = Register("DC Voltage", 259, DataType.UINT16, scale=100)
    DC_CURRENT = Register("DC Current", 261, DataType.INT16, scale=10)
    DC_POWER = Register("DC Power", 258, DataType.INT16)
    SOC = Register("SOC", 266, DataType.UINT16, scale=10)
    TEMPERATURE = Register("Temperature", 262, DataType.INT16, scale=10)
    STATE_OF_HEALTH = Register("State of Health", 304, DataType.UINT16, scale=10)

    # Cell voltages (if supported by BMS)
    MIN_CELL_VOLTAGE = Register("Min Cell Voltage", 1290, DataType.UINT16, scale=100)
    MAX_CELL_VOLTAGE = Register("Max Cell Voltage", 1291, DataType.UINT16, scale=100)

    # Charge/discharge energy in kWh
    DISCHARGED_ENERGY = Register("Discharged Energy", 301, DataType.UINT16, scale=10)
    CHARGED_ENERGY = Register("Charged Energy", 302, DataType.UINT16, scale=10)

    # Limits
    MAX_CHARGE_CURRENT = Register("Max Charge Current", 305, DataType.UINT16, scale=10)
    MAX_DISCHARGE_CURRENT = Register("Max Discharge Current", 306, DataType.UINT16, scale=10)
    MAX_CHARGE_VOLTAGE = Register("Max Charge Voltage", 303, DataType.UINT16, scale=10)

    # Alarms
    ALARM_LOW_VOLTAGE = Register("Alarm Low Voltage", 267, DataType.UINT16)
    ALARM_HIGH_VOLTAGE = Register("Alarm High Voltage", 268, DataType.UINT16)
    ALARM_LOW_SOC = Register("Alarm Low SOC", 269, DataType.UINT16)
    ALARM_HIGH_TEMPERATURE = Register("Alarm High Temperature", 270, DataType.UINT16)
    ALARM_LOW_TEMPERATURE = Register("Alarm Low Temperature", 271, DataType.UINT16)


# =============================================================================
# com.victronenergy.solarcharger (Unit ID varies)
# MPPT Solar Charger
# =============================================================================
class SolarCharger:
    PV_VOLTAGE = Register("PV Voltage", 3700, DataType.UINT16, scale=100)
    PV_CURRENT = Register("PV Current", 3701, DataType.INT16, scale=10)
    PV_POWER = Register("PV Power", 3702, DataType.UINT32)

    BATTERY_VOLTAGE = Register("Battery Voltage", 3704, DataType.UINT16, scale=100)
    BATTERY_CURRENT = Register("Battery Current", 3705, DataType.INT16, scale=10)

    YIELD_TODAY = Register("Yield Today", 3708, DataType.UINT16, scale=10)
    MAX_POWER_TODAY = Register("Max Power Today", 3709, DataType.UINT16)
    YIELD_YESTERDAY = Register("Yield Yesterday", 3710, DataType.UINT16, scale=10)
    MAX_POWER_YESTERDAY = Register("Max Power Yesterday", 3711, DataType.UINT16)

    STATE = Register("State", 3706, DataType.UINT16)
    ERROR = Register("Error", 3707, DataType.UINT16)


# =============================================================================
# com.victronenergy.grid (Unit ID varies)
# Energy Meter (grid)
# =============================================================================
class GridMeter:
    POWER_L1 = Register("Power L1", 2600, DataType.INT16)
    POWER_L2 = Register("Power L2", 2601, DataType.INT16)
    POWER_L3 = Register("Power L3", 2602, DataType.INT16)
    POWER_TOTAL = Register("Power Total", 2603, DataType.INT16)

    VOLTAGE_L1 = Register("Voltage L1", 2616, DataType.UINT16, scale=10)
    VOLTAGE_L2 = Register("Voltage L2", 2617, DataType.UINT16, scale=10)
    VOLTAGE_L3 = Register("Voltage L3", 2618, DataType.UINT16, scale=10)

    CURRENT_L1 = Register("Current L1", 2619, DataType.INT16, scale=10)
    CURRENT_L2 = Register("Current L2", 2620, DataType.INT16, scale=10)
    CURRENT_L3 = Register("Current L3", 2621, DataType.INT16, scale=10)

    ENERGY_FORWARD = Register("Energy Forward", 2634, DataType.UINT32, scale=100)
    ENERGY_REVERSE = Register("Energy Reverse", 2636, DataType.UINT32, scale=100)
