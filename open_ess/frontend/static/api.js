// Auto-generated from Pydantic models - do not edit manually
// Run `generate-types` to regenerate

// ============
// === Types ===
// ============

/** @typedef {"ok" | "warning" | "error"} Status */

/** @typedef {} StrEnum */

/**
 * @typedef {Object} TimeSeries
 * @property {string[]} [timestamps]
 * @property {number[]} [values]
 */

/**
 * @typedef {Object} BatteryCycle
 * @property {string} [start_time]
 * @property {string} [end_time]
 * @property {number} [duration_hours]
 * @property {number} [min_soc]
 * @property {(number | null)} [ac_energy_in]
 * @property {(number | null)} [ac_energy_out]
 * @property {number} [dc_energy_in]
 * @property {number} [dc_energy_out]
 * @property {(number | null)} [system_efficiency]
 * @property {(number | null)} [battery_efficiency]
 * @property {(number | null)} [charger_efficiency]
 * @property {(number | null)} [inverter_efficiency]
 * @property {(number | null)} [profit]
 * @property {(number | null)} [scheduled_profit]
 */

/**
 * @typedef {Object} BatteryEnergySeries
 * @property {(number | null)[]} [energy_to_charger]
 * @property {(number | null)[]} [energy_from_inverter]
 * @property {(number | null)[]} [energy_to_battery]
 * @property {(number | null)[]} [energy_from_battery]
 * @property {(number | null)[]} [energy_loss_to_battery]
 * @property {(number | null)[]} [energy_loss_from_battery]
 */

/**
 * @typedef {Object} BatteryGraphResponse
 * @property {TimeSeries} [soc]
 * @property {TimeSeries} [schedule]
 * @property {TimeSeries} [voltage]
 */

/**
 * @typedef {Object} BatteryPowerValues
 * @property {(number | null)} [charger]
 * @property {(number | null)} [inverter]
 * @property {(number | null)} [battery]
 * @property {(number | null)} [losses]
 */

/**
 * @typedef {Object} BatterySystemConfig
 * @property {(string | null)} name
 * @property {boolean} [monitor_only]
 * @property {number} [phases]
 * @property {(number | null)} capacity_kwh
 * @property {(number | null)} max_charge_power_kw
 * @property {(number | null)} max_invert_power_kw
 * @property {number} [idle_threshold_w]
 * @property {number} [min_soc]
 * @property {number} [max_soc]
 * @property {(VictronConfig | MqttControl)} [control]
 * @property {MetricsConfig} [metrics]
 */

/**
 * @typedef {Object} BatterySystemInfo
 * @property {string} [id]
 * @property {string} [name]
 */

/**
 * @typedef {Object} EfficiencyScatterPoint
 * @property {string} [time]
 * @property {number} [battery_power]
 * @property {number} [inverter_charger_power]
 * @property {number} [losses]
 * @property {(number | null)} [efficiency]
 * @property {(number | null)} [soc]
 * @property {string} [category]
 */

/**
 * @typedef {Object} EnergyGraphResponse
 * @property {string[]} [timestamps]
 * @property {Object.<string, (number | null)[]>} [grid_import]
 * @property {Object.<string, (number | null)[]>} [grid_export]
 * @property {Object.<string, BatteryEnergySeries>} [battery_systems]
 * @property {(number | null)[]} [solar]
 * @property {(number | null)[]} [to_consumption]
 * @property {(number | null)[]} [from_consumption]
 */

/**
 * @typedef {Object} EnergyResponse
 * @property {Object.<string, TimeSeries>} [series]
 */

/**
 * @typedef {Object} HealthResponse
 * @property {string} [status]
 * @property {string} [database]
 * @property {string[]} [tables]
 */

/**
 * @typedef {Object} PowerFlowData
 * @property {Object.<string, (number | null)>} [grid]
 * @property {(number | null)} [solar]
 * @property {Object.<string, number>} [consumption]
 * @property {Object.<string, BatteryPowerValues>} [batteries]
 */

/**
 * @typedef {Object} PowerResponse
 * @property {Object.<string, TimeSeries>} [series]
 */

/**
 * @typedef {Object} PriceConfig
 * @property {string} [area]
 * @property {boolean} [hourly_average]
 * @property {(string | null)} entsoe_api_key
 * @property {(Path | null)} entsoe_api_key_file
 * @property {string} [buy_formula]
 * @property {string} [sell_formula]
 */

/**
 * @typedef {Object} PricePoint
 * @property {string} [time]
 * @property {(number | null)} [market]
 * @property {(number | null)} [buy]
 * @property {(number | null)} [sell]
 */

/**
 * @typedef {Object} PricesResponse
 * @property {string} [area]
 * @property {number} [aggregate_minutes]
 * @property {string} [unit]
 * @property {PricePoint[]} [timeseries]
 */

/**
 * @typedef {Object} ServiceMessage
 * @property {string} [timestamp]
 * @property {Status} [status]
 * @property {string} [message]
 */

/**
 * @typedef {Object} ServiceStatus
 * @property {Status} [status]
 * @property {ServiceMessage[]} [messages]
 */

/**
 * @typedef {Object} ServicesStatusResponse
 * @property {(ServiceStatus | null)} [database]
 * @property {(ServiceStatus | null)} [optimizer]
 */

/**
 * @typedef {Object} SystemLayoutData
 * @property {number[]} [phases]
 * @property {boolean} [has_solar]
 * @property {BatterySystemInfo[]} [battery_systems]
 */

/**
 * @typedef {Object} TimeSeries
 * @property {string[]} [timestamps]
 * @property {number[]} [values]
 */

// ===================
// === API Client ===
// ===================

/**
 * @returns {Promise<HealthResponse>}
 */
export async function health() {
    const response = await fetch(`/api/health`);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
}

/**
 * @returns {Promise<SystemLayoutData>}
 */
export async function systemLayout() {
    const response = await fetch(`/api/system-layout`);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
}

/**
 * @returns {Promise<PowerFlowData>}
 */
export async function powerFlow() {
    const response = await fetch(`/api/power-flow`);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
}

/**
 * @returns {Promise<ServicesStatusResponse>}
 */
export async function servicesStatus() {
    const response = await fetch(`/api/services-status`);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
}

/**
 * @returns {Promise<string[]>}
 */
export async function batteryIds() {
    const response = await fetch(`/api/battery-ids`);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
}

/**
 * @param {(string | null)} [params.battery_id]
 * @param {(string | null)} [params.start]
 * @param {(string | null)} [params.end]
 * @param {number} [params.bucket_minutes]
 * @returns {Promise<EnergyGraphResponse>}
 */
export async function energyGraph(params) {
    const searchParams = new URLSearchParams();
    if (params.battery_id !== undefined) searchParams.set('battery_id', String(params.battery_id));
    if (params.start !== undefined) searchParams.set('start', String(params.start));
    if (params.end !== undefined) searchParams.set('end', String(params.end));
    if (params.bucket_minutes !== undefined) searchParams.set('bucket_minutes', String(params.bucket_minutes));
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const response = await fetch(`/api/energy-graph${query}`);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
}

/**
 * @param {(string | null)} [params.battery_id]
 * @param {(string | null)} [params.start]
 * @param {(string | null)} [params.end]
 * @param {number} [params.aggregate_minutes]
 * @returns {Promise<PowerResponse>}
 */
export async function powerGraph(params) {
    const searchParams = new URLSearchParams();
    if (params.battery_id !== undefined) searchParams.set('battery_id', String(params.battery_id));
    if (params.start !== undefined) searchParams.set('start', String(params.start));
    if (params.end !== undefined) searchParams.set('end', String(params.end));
    if (params.aggregate_minutes !== undefined) searchParams.set('aggregate_minutes', String(params.aggregate_minutes));
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const response = await fetch(`/api/power-graph${query}`);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
}

/**
 * @param {(string | null)} [params.area]
 * @param {(string | null)} [params.start]
 * @param {(string | null)} [params.end]
 * @param {(number | null)} [params.aggregate_minutes]
 * @returns {Promise<PricesResponse>}
 */
export async function prices(params) {
    const searchParams = new URLSearchParams();
    if (params.area !== undefined) searchParams.set('area', String(params.area));
    if (params.start !== undefined) searchParams.set('start', String(params.start));
    if (params.end !== undefined) searchParams.set('end', String(params.end));
    if (params.aggregate_minutes !== undefined) searchParams.set('aggregate_minutes', String(params.aggregate_minutes));
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const response = await fetch(`/api/prices${query}`);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
}

/**
 * @param {(string | null)} [params.battery_id]
 * @param {(string | null)} [params.start]
 * @param {(string | null)} [params.end]
 * @returns {Promise<Object.<string, BatteryGraphResponse>>}
 */
export async function batteryGraph(params) {
    const searchParams = new URLSearchParams();
    if (params.battery_id !== undefined) searchParams.set('battery_id', String(params.battery_id));
    if (params.start !== undefined) searchParams.set('start', String(params.start));
    if (params.end !== undefined) searchParams.set('end', String(params.end));
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const response = await fetch(`/api/battery-graph${query}`);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
}

/**
 * @param {number} [params.limit]
 * @param {number} [params.aggregate_minutes]
 * @param {number} [params.idle_threshold]
 * @returns {Promise<EfficiencyScatterPoint[]>}
 */
export async function efficiencyScatter(params) {
    const searchParams = new URLSearchParams();
    if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
    if (params.aggregate_minutes !== undefined) searchParams.set('aggregate_minutes', String(params.aggregate_minutes));
    if (params.idle_threshold !== undefined) searchParams.set('idle_threshold', String(params.idle_threshold));
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const response = await fetch(`/api/efficiency-scatter${query}`);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
}

/**
 * @param {(string | null)} [params.battery_id]
 * @param {(string | null)} [params.start]
 * @param {(string | null)} [params.end]
 * @param {number} [params.min_soc_swing]
 * @returns {Promise<BatteryCycle[]>}
 */
export async function cycles(params) {
    const searchParams = new URLSearchParams();
    if (params.battery_id !== undefined) searchParams.set('battery_id', String(params.battery_id));
    if (params.start !== undefined) searchParams.set('start', String(params.start));
    if (params.end !== undefined) searchParams.set('end', String(params.end));
    if (params.min_soc_swing !== undefined) searchParams.set('min_soc_swing', String(params.min_soc_swing));
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const response = await fetch(`/api/cycles${query}`);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
}

/**
 * @param {(string | null)} [params.start]
 * @param {(string | null)} [params.end]
 * @param {number} [params.aggregate_minutes]
 * @returns {Promise<PowerResponse>}
 */
export async function power(params) {
    const searchParams = new URLSearchParams();
    if (params.start !== undefined) searchParams.set('start', String(params.start));
    if (params.end !== undefined) searchParams.set('end', String(params.end));
    if (params.aggregate_minutes !== undefined) searchParams.set('aggregate_minutes', String(params.aggregate_minutes));
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const response = await fetch(`/api/power${query}`);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
}

/**
 * @param {(string | null)} [params.start]
 * @param {(string | null)} [params.end]
 * @returns {Promise<EnergyResponse>}
 */
export async function energy(params) {
    const searchParams = new URLSearchParams();
    if (params.start !== undefined) searchParams.set('start', String(params.start));
    if (params.end !== undefined) searchParams.set('end', String(params.end));
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const response = await fetch(`/api/energy${query}`);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
}
