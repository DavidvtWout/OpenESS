There are quite a few configuration options that need to have the correct values for
OpenESS to work correctly.

1. Get an [API key](https://transparencyplatform.zendesk.com/hc/en-us/articles/12845911031188-How-to-get-security-token) from ENTSOE-E.
2. Configure [pricing](./pricing.md).
3. Configure [battery system control](./control.md)
4. Configure [battery](./battery-config.md)

In the future it will be possible "upload" pricing information to OpenESS via MQTT. This
enables you for example to pass pricing data from a HomeAssistant plugin to OpenESS and
makes you independent of the Entso-E api key.

The complete config file could look something like this;

```yaml
database:
  path: /path/to/database/file

frontend:
  host: 127.0.0.1

prices:
  area: NL
  entsoe_api_key_file: /path/to/entsoe-api-key
  buy_formula: "0.02 + (price + 0.09161) * 1.21"
  sell_formula: "0.02 + (price + 0.09161) * 1.21"

battery-system:
  name: "MultiPlus-II"
  control:
    type: victron
    host: 192.168.0.42
    vebus_id: 228
    battery_id: 225
  capacity_kwh: 10
  max_charge_power_kw: 3.0
  max_invert_power_kw: 4.5

# Or in case of multiple battery systems use yaml list format;

battery-system:
  - name: "Battery system 1"
    ...
  - name: "Battery system 2"
    ...
```
