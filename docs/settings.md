# Configuration

OpenESS is configured via a YAML file

### Example Configuration

```yaml
database:
  path: /var/lib/open-ess/data.db

prices:
  area: NL
  entsoe_api_key_file: /var/lib/open-ess/entsoe_api_key
  buy_formula: "price"
  sell_formula: "price"

victron_gx:
  host: 192.168.1.100
  port: 502
  system_id: 100

battery:
  control:
    type: victron
    vebus_id: 228
  capacity_kwh: 10.0
  max_charge_power_kw: 3.0
  max_discharge_power_kw: 3.0
  min_soc: 10
  max_soc: 100
```

### prices

```yaml
prices:
  area:
  entsoe_api_key_file: /var/lib/open-ess/entsoe_api_key
  buy_formula: "price"
  sell_formula: "price"
```

The `buy_formula` and `sell_formula` allow you to transform the market price into your actual buy/sell price. Use `price` or `p` as the market price variable (EUR/kWh).

Allowed operations: `+`, `-`, `*`, `/`, `**`, parentheses

Examples:
- `"price"` - use market price directly
- `"(price + 0.05) * 1.21"` - add 0.05 EUR/kWh markup and 21% VAT
- `"price * 0.9"` - sell at 90% of market price

### victron_gx

Settings for connecting to your Victron GX device via Modbus TCP.

| Setting | Required | Default | Description |
|---------|----------|---------|-------------|
| `host` | Yes | - | IP address of the GX device |
| `port` | No | `502` | Modbus TCP port |
| `system_id` | Yes | - | Modbus unit ID for system data (usually 100) |
| `grid_id` | No | - | Modbus unit ID for grid meter |
| `pvinverter_id` | No | - | Modbus unit ID for PV inverter |

To find the Modbus unit IDs, go to your GX device: **Settings > Services > Modbus TCP > Available services**

### battery

Configuration for your battery system. Can be a single battery or a list of batteries (multi-battery support is planned).

| Setting | Required | Default | Description |
|---------|----------|---------|-------------|
| `capacity_kwh` | Yes | - | Total battery capacity in kWh |
| `max_charge_power_kw` | Yes | - | Maximum charge power in kW (AC side) |
| `max_discharge_power_kw` | Yes | - | Maximum discharge power in kW (AC side) |
| `min_soc` | No | `10` | Minimum state of charge (%) |
| `max_soc` | No | `100` | Maximum state of charge (%) |
| `control` | Yes | - | Control configuration (see below) |

#### battery.control (Victron)

| Setting | Required | Default | Description |
|---------|----------|---------|-------------|
| `type` | Yes | - | Must be `victron` |
| `vebus_id` | Yes | - | Modbus unit ID of the MultiPlus/Quattro |
| `battery_id` | No | - | Modbus unit ID of the BMS (if available) |
| `monitor_only` | No | `false` | Only collect metrics, don't control the battery |
| `disable_charger_when_idle` | No | `false` | Disable charger when not charging (saves power) |
| `disable_inverter_when_idle` | No | `false` | Disable inverter when not discharging (saves power) |

#### battery.control (MQTT) - Planned

| Setting | Required | Default | Description |
|---------|----------|---------|-------------|
| `type` | Yes | - | Must be `mqtt` |
| `topic` | Yes | - | MQTT topic prefix for this battery |
| `monitor_only` | No | `false` | Only collect metrics, don't control the battery |
