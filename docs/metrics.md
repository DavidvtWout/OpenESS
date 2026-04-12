OpenESS uses SQLite to store metrics in. These metrics are mainly stored in two tables, 
`energy` and `power`.


Note: the actual tables are `_energy` and `_power`. `energy` and `power` are just
views on these tables. The 

### Data compression
Inserting one row per second would make the database consume a lot of unnecessary disk
space since SQLite doesn't do any compression on the inserted data. To prevent this, openESS
uses two different methods.

For the energy table the approach is the simplest. Only when a value is different from the
previously inserted value, the new row is inserted. The only drawback of this is that it
is harder to determine if a gap in the time-series is caused by an actual gap in data collection
or that the metrics hasn't changes in some time.

For the power table this approach wouldn't work since power values change much faster than
energy values. The approach here is to calculate the 

```yaml
database:
  compression:
    enable: True       # Enabled by default but can be disabled if desired.
    bucket_seconds: 60 # Bucket size in seconds. 
```

### Metric names
By default, the following metrics are collected by the victron modbus service;
- `vebus_<vebus_id>/ac_in/l1`:
- `vebus_<vebus_id>/ac_out/l1`:
...

```yaml
battery:
  id: # Defaults to victron_<vebus_id> or <mqtt_topic>. This parameter is read-only and can't be set in the config file.
  name: # User-friendly name that is used in the frontend. Metrics are independent of this name and renaming a battery is safe to do.
  metrics:
    battery_soc: <battery.id>/battery_soc
    battery_voltage:
    power_to_system: 
    power_to_battery: 
    energy_to_system:
    energy_from_system:
    energy_to_battery:
    energy_from_battery:
```

For a full overview of the `battery` config options, see [docs/settings.md](settings.md)
