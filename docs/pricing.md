The config section for pricing is as follows;

```yaml

pricing:
  entsoe_api_key_file:
  area: 
  hourly_average: True
  buy_formula: "price"
  sell_formula: "price"
```

### API key
Instruction on how to obtain a key can be found [here](https://transparencyplatform.zendesk.com/hc/en-us/articles/12845911031188-How-to-get-security-token).
This usually takes 1-3 days.
Store the key in a separate file and restrict read access to only the user that runs OpenESS.
set `entsoe_api_key_file` to the path of the key file.

### Area
The area must be an ENTSO-E bidding zone short name (`NL`, `BE`, `DK1`, `DK2`, etc...).
These bidding zone names can be found [here](https://eepublicdownloads.entsoe.eu/clean-documents/nc-tasks/SDAC%20costs%20coefficient%20%E2%80%93%2017.06.2021.pdf).

In this repo there is also a [list](../open_ess/pricing/areas.py) of zones to choose from.
This list includes the local timezones of these bidding zones because the ENTSO-E api somehow
returns timestamps in the local timezone and not as UTC timestamps...


### Hourly average
The day-ahead prices are provided in 15-minute resolution but most energy providers use
the hourly average instead. By default, `hourly_average` is `True`, but when your provider
uses 15-minute pricing, it's slightly more profitable to set is to `False` and use the 
5-minute data.

Note: The charge schedule optimizer becomes much slower with 4 times the data input. With
15-minute price data, the optimizer takes about 8 times as much time. However, even on a
raspberry pi the optimizer would still finish in under a minute. With 15-minute prices
instead of 1-hour, you can expect about 20% more profit.


### Formulas
By default, the `buy_formula` and `sell_formula` simply return the market price.

The 'price' placeholder is the market price. The formula supports the `+`, `-`, 
`*` (multiplication), `/` (division), and `**` (powers) operators as well parenthesis (`(` and `)`).
If you need any more features (pricing based on time of day?), let me known by creating an issue or pull-request!

For Dutch energy providers, the pricing methods can be found at [jeroen.nl](https://jeroen.nl/dynamische-energie/aanbieders)
and [dynamisch-tarief.nl](https://www.dynamisch-tarief.nl/leveranciers).

The tax on energy varies by country. The Dutch rates can be found at [belastingdienst.nl](https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/overige_belastingen/belastingen_op_milieugrondslag/energiebelasting/energiebelasting).
For 2026, the tax is €0.09161 / kWh. On top of this 21% VAT is calculated. This VAT is also
applied to the market price (even if the market price is negative).

Now some examples. Zonneplan has a markup of €0.02 per kWh for both imported and exported energy.
This already includes the VAT of 21%. So for Zonneplan, the formulas are;

```yaml
pricing:
  buy_formula: "0.02 + (price + 0.09161) * 1.21"
  sell_formula: "0.02 + (price + 0.09161) * 1.21"
```

GreenChoice for example (Don't ever choose them for various reasons...) doesn't give the markup back for
exported energy. Instead, it charges the markup price again. The pricing formulas are then;

```yaml
pricing:
  buy_formula: "0.029 + (price + 0.09161) * 1.21"
  sell_formula: "-0.029 + (price + 0.09161) * 1.21"
```
