# Victron Dynamic ESS day-ahead price charging scheduler



# Requirements
- ENTSO-E API key (see https://github.com/BerriJ/entsoe-apy for instructions)
- Victron MultiPlus, MultiPlus-II, Quattro, EasySolar
- Victron GX device

While technically possible to directly communicate with a MultiPlus via the VE.Bus port, this is not recommended by Victron and not supported by this charge controller. The recommended (and only support way) is to communicate with a Victron GX device via Modbus-TCP.
