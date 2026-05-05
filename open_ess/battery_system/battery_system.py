import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta

from open_ess.victron_modbus import VictronClient

from .config import BatterySystemConfig

logger = logging.getLogger(__name__)


@dataclass
class PowerQueryDef:
    """Definition of a power chart query."""

    query: str
    label: str
    is_total: bool | None = None  # True=total only, False=phases only, None=both


@dataclass
class PowerQueries:
    """Power chart queries for a battery system."""

    queries: list[PowerQueryDef] = field(default_factory=list)
    phases: list[str] = field(default_factory=list)


@dataclass
class BatteryQueries:
    """Battery chart queries (SOC, voltage, schedule)."""

    soc_query: str
    voltage_query: str
    schedule_soc_query: str


class BatterySystem(ABC):
    def __init__(self, config: BatterySystemConfig):
        self._config = config

    @property
    def config(self) -> BatterySystemConfig:
        return self._config

    @property
    def name(self) -> str | None:
        return self._config.name

    @property
    @abstractmethod
    def id(self) -> str | None: ...

    @property
    @abstractmethod
    def device_serial(self) -> str | None:
        """Device serial number used for metrics labeling."""
        ...

    @abstractmethod
    def set_ess_setpoint(self, power: float, until: datetime | None = None) -> None: ...

    @abstractmethod
    def get_soc(self) -> float | None: ...

    @abstractmethod
    def get_power_queries(self, phases: list[str] | None = None) -> PowerQueries:
        """Return power chart queries for this battery system."""
        ...

    @abstractmethod
    def get_battery_queries(self) -> BatteryQueries:
        """Return battery chart queries (SOC, voltage, schedule)."""
        ...


class VictronBatterySystem(BatterySystem):
    def __init__(self, config: BatterySystemConfig, control: VictronClient):
        BatterySystem.__init__(self, config)

        self._victron_client: VictronClient = control

    @property
    def id(self) -> str | None:
        return self._victron_client.serial

    @property
    def device_serial(self) -> str | None:
        return self._victron_client.serial

    def set_ess_setpoint(self, power: float, until: datetime | None = None) -> None:
        if until is None:
            until = datetime.now(tz=UTC) + timedelta(hours=1)
        logger.info(f"{self.name}: Set setpoint to {power} W")
        self._victron_client.set_ess_setpoint(power, until)

    def get_soc(self) -> float | None:
        return self._victron_client.current_soc

    def get_power_queries(self, phases: list[str] | None = None) -> PowerQueries:
        device = self.device_serial or "unknown"
        bs_name = self.config.name or self.id
        queries: list[PowerQueryDef] = []

        if phases and len(phases) > 1:
            # Multi-phase: add total and per-phase queries
            queries.append(
                PowerQueryDef(
                    query=f"""
                      sum by (device) (avg_over_time(openess_power_watts{{from="ac_in", to="system", device="{device}"}}[$step]))
                      - on(device)
                      sum by (device) (avg_over_time(openess_power_watts{{from="system", to="ac_out", device="{device}"}}[$step]))
                    """,
                    label=f"{bs_name} AC",
                    is_total=True,
                )
            )
            for phase in phases:
                queries.append(
                    PowerQueryDef(
                        query=f"""
                          sum by (device, phase) (avg_over_time(openess_power_watts{{from="ac_in", to="system", device="{device}", phase="{phase}"}}[$step]))
                          - on(device, phase)
                          sum by (device, phase) (avg_over_time(openess_power_watts{{from="system", to="ac_out", device="{device}", phase="{phase}"}}[$step]))
                        """,
                        label=f"{bs_name} AC {phase}",
                        is_total=False,
                    )
                )
        else:
            # Single phase or unknown
            queries.append(
                PowerQueryDef(
                    query=f"""
                      sum by (device) (avg_over_time(openess_power_watts{{from="ac_in", to="system", device="{device}"}}[$step]))
                      - on(device)
                      sum by (device) (avg_over_time(openess_power_watts{{from="system", to="ac_out", device="{device}"}}[$step]))
                    """,
                    label=f"{bs_name} AC",
                )
            )

        # Battery DC power (works for both single and multi-phase)
        queries.append(
            PowerQueryDef(
                query=f"""
                  avg_over_time(openess_power_watts{{from="system", to="battery", unit="battery", device="{device}"}}[$step])
                  or
                  avg_over_time(openess_power_watts{{from="system", to="battery", unit="vebus", device="{device}"}}[$step])
                """,
                label=f"{bs_name} Battery",
            )
        )

        return PowerQueries(queries=queries, phases=phases or [])

    def get_battery_queries(self) -> BatteryQueries:
        device = self.device_serial or "unknown"

        return BatteryQueries(
            soc_query=f"""
              openess_soc_ratio{{device="{device}", node="battery", unit="battery"}} * 100
              or
              openess_soc_ratio{{device="{device}", node="battery", unit="vebus"}} * 100
            """,
            voltage_query=f"""
              openess_voltage_volts{{device="{device}", node="battery", unit="battery"}}
              or
              openess_voltage_volts{{device="{device}", node="battery", unit="vebus"}}
            """,
            schedule_soc_query=f'first_over_time(openess_scheduled_soc_ratio{{device="{device}"}}) * 100',
        )
