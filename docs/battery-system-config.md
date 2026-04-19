The battery system forms the core of OpenESS.

```yaml
battery-system:
  name:
  #  Defaults to the id of the battery system. Each battery system gets a unique id. By
  #  default, this id is also used as the name as shown in the frontend. However, this
  #  default name isn't very pretty so you can set a more meaningful name here. Changing
  #  the name is safe because all metrics are tied to the id of the battery system.
  monitor_only: no
  #  If set to 'yes', metrics are still collected from the system, but the battery isn't
  #  actively being controlled by OpenESS anymore.
  capacity:  # kWh
  max_charge_power:  # W
  max_invert_power:  # W
  #  The capacity and power limits of the system must be set for the charge schedule
  #  optimizer. Note that the capacity is in kWh and the power limits are in W!
  idle_threshold: 100  # W
  #  If the scheduled power is lower than the idle_threshold, the power is set 0 instead.
  min_soc: 10  # %
  max_soc: 100 # %
  #  min_soc and max_soc define the lower and upper limits that OpenESS tries to keep the
  #  battery State-of-Charge inbetween. It's recommended to keep the max_soc at 100%
  #  to allow for cell balancing.
  control:
    type:
    #  Either victron or mqtt. The chosen control type determines the other config options.
    #  See [Victron control] and [MQTT control] for a more detailed overview of the options.
  metrics:
    # 
```

### Multiple systems

OpenESS supports multiple battery systems by providing a yaml list to `battery-system`.
Each system should get a unique `control` section. It's not possible to re-use the same
Victron GX device for two different battery-systems.

```yaml
battery-system:
  - name: system 1
    capacity:
    ...
  - name: system 2
    capacity:
    ...
``` 


### Victron control

```yaml
battery-system:
  control:
    type: victron
    host: # IP address or hostname on which the GX device is reachable.
    port: 502
    
    disable_charger_when_idle: no
    disable_inverter_when_idle: no
    #  These options default to "no" but can be set to "yes" for a much higher efficiency
    #  of the system. By default, victron keeps the transformer coil energized when the 
    #  system is idling. This consumes about 50-75 W on a MultiPlus-II 48/5000/70-50 GX.
    #  Disabling the charger and inverter will bring the battery consumption to 0W and
    #  the system starts using power from the grid instead. A grid failure will still
    #  result in a smooth transition to battery power without down-time of the system.
    #  However, I'm not sure if the inverter can be turned on quick enough to start
    #  powering AC out without interruption (probably not). You should ask yourself if
    #  losing >1 kWh per day is worth the uninterested transition in case of grid failure.
    
    #  Below are the modbus unit IDs. On the GX device, check Settings → Services → 
    #  Modbus TCP → Available services.
    #  An excel sheet with all available modbus registers can be downloaded from Victron;
    #  https://www.victronenergy.com/upload/documents/CCGX-Modbus-TCP-register-list-3.71.xlsx
    system_id: 100
    #  Modbus ID for com.victronenergy.system metrics. Defaults to 100.
    vebus_id:
    #  ID of the VE.Bus connected devices (com.victronenergy.vebus). Victron aggregates
    #  metrics from all connected devices together to create one virtual charger/inverter.
    battery_id:
    #  ID of the BMS of the battery (com.victronenergy.battery). Usually connected via
    #  CAN-bus. The battery_id is optional but can provide more accurate metrics about
    #  the battery then vebus can provide.
    grid_id:
    #  Optional modbus ID for com.victronenergy.grid. com.victronenergy.system also
    #  provides grid power metrics but com.victronenergy.grid also provides energy metrics.
    pvinverter_id:
    #  Optional modbus ID for com.victronenergy.pvinverter. Provides solar inverter metrics.
```


### MQTT control

Not supported yet!


### Metrics

The Victron modbus client automatically collects metrics and stores these with specific
labels. 


```yaml
battery-system:
  metrics:
    battery_soc:
    battery_voltage:
    power_to_system: 
    power_to_battery: 
    energy_to_system:
    energy_from_system:
    energy_to_battery:
    energy_from_battery:
```