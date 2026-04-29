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

(function() {
    'use strict';

    window.Api = {
    /**
     * @returns {Promise<HealthResponse>}
     */
    health: async function() {
        var response = await fetch('/api/health');
        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }
        return response.json();
    },

    /**
     * @returns {Promise<SystemLayoutData>}
     */
    systemLayout: async function() {
        var response = await fetch('/api/system-layout');
        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }
        return response.json();
    },

    /**
     * @returns {Promise<PowerFlowData>}
     */
    powerFlow: async function() {
        var response = await fetch('/api/power-flow');
        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }
        return response.json();
    },

    /**
     * @returns {Promise<ServicesStatusResponse>}
     */
    servicesStatus: async function() {
        var response = await fetch('/api/services-status');
        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }
        return response.json();
    },

    /**
     * @returns {Promise<string[]>}
     */
    batteryIds: async function() {
        var response = await fetch('/api/battery-ids');
        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }
        return response.json();
    },

    /**
     * @param {(string | null)} [params.battery_id]
     * @param {(string | null)} [params.start]
     * @param {(string | null)} [params.end]
     * @param {number} [params.bucket_minutes]
     * @returns {Promise<EnergyGraphResponse>}
     */
    energyGraph: async function(params) {
        var searchParams = new URLSearchParams();
        if (params.battery_id !== undefined) searchParams.set('battery_id', String(params.battery_id));
        if (params.start !== undefined) searchParams.set('start', String(params.start));
        if (params.end !== undefined) searchParams.set('end', String(params.end));
        if (params.bucket_minutes !== undefined) searchParams.set('bucket_minutes', String(params.bucket_minutes));
        var query = searchParams.toString() ? '?' + searchParams.toString() : '';
        var response = await fetch('/api/energy-graph' + query);
        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }
        return response.json();
    },

    /**
     * @param {(string | null)} [params.battery_id]
     * @param {(string | null)} [params.start]
     * @param {(string | null)} [params.end]
     * @param {number} [params.aggregate_minutes]
     * @returns {Promise<PowerResponse>}
     */
    powerGraph: async function(params) {
        var searchParams = new URLSearchParams();
        if (params.battery_id !== undefined) searchParams.set('battery_id', String(params.battery_id));
        if (params.start !== undefined) searchParams.set('start', String(params.start));
        if (params.end !== undefined) searchParams.set('end', String(params.end));
        if (params.aggregate_minutes !== undefined) searchParams.set('aggregate_minutes', String(params.aggregate_minutes));
        var query = searchParams.toString() ? '?' + searchParams.toString() : '';
        var response = await fetch('/api/power-graph' + query);
        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }
        return response.json();
    },

    /**
     * @param {(string | null)} [params.area]
     * @param {(string | null)} [params.start]
     * @param {(string | null)} [params.end]
     * @param {(number | null)} [params.aggregate_minutes]
     * @returns {Promise<PricesResponse>}
     */
    prices: async function(params) {
        var searchParams = new URLSearchParams();
        if (params.area !== undefined) searchParams.set('area', String(params.area));
        if (params.start !== undefined) searchParams.set('start', String(params.start));
        if (params.end !== undefined) searchParams.set('end', String(params.end));
        if (params.aggregate_minutes !== undefined) searchParams.set('aggregate_minutes', String(params.aggregate_minutes));
        var query = searchParams.toString() ? '?' + searchParams.toString() : '';
        var response = await fetch('/api/prices' + query);
        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }
        return response.json();
    },

    /**
     * @param {(string | null)} [params.battery_id]
     * @param {(string | null)} [params.start]
     * @param {(string | null)} [params.end]
     * @returns {Promise<Object.<string, BatteryGraphResponse>>}
     */
    batteryGraph: async function(params) {
        var searchParams = new URLSearchParams();
        if (params.battery_id !== undefined) searchParams.set('battery_id', String(params.battery_id));
        if (params.start !== undefined) searchParams.set('start', String(params.start));
        if (params.end !== undefined) searchParams.set('end', String(params.end));
        var query = searchParams.toString() ? '?' + searchParams.toString() : '';
        var response = await fetch('/api/battery-graph' + query);
        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }
        return response.json();
    },

    /**
     * @param {number} [params.limit]
     * @param {number} [params.aggregate_minutes]
     * @param {number} [params.idle_threshold]
     * @returns {Promise<EfficiencyScatterPoint[]>}
     */
    efficiencyScatter: async function(params) {
        var searchParams = new URLSearchParams();
        if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
        if (params.aggregate_minutes !== undefined) searchParams.set('aggregate_minutes', String(params.aggregate_minutes));
        if (params.idle_threshold !== undefined) searchParams.set('idle_threshold', String(params.idle_threshold));
        var query = searchParams.toString() ? '?' + searchParams.toString() : '';
        var response = await fetch('/api/efficiency-scatter' + query);
        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }
        return response.json();
    },

    /**
     * @param {(string | null)} [params.battery_id]
     * @param {(string | null)} [params.start]
     * @param {(string | null)} [params.end]
     * @param {number} [params.min_soc_swing]
     * @returns {Promise<BatteryCycle[]>}
     */
    cycles: async function(params) {
        var searchParams = new URLSearchParams();
        if (params.battery_id !== undefined) searchParams.set('battery_id', String(params.battery_id));
        if (params.start !== undefined) searchParams.set('start', String(params.start));
        if (params.end !== undefined) searchParams.set('end', String(params.end));
        if (params.min_soc_swing !== undefined) searchParams.set('min_soc_swing', String(params.min_soc_swing));
        var query = searchParams.toString() ? '?' + searchParams.toString() : '';
        var response = await fetch('/api/cycles' + query);
        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }
        return response.json();
    },

    /**
     * @param {(string | null)} [params.start]
     * @param {(string | null)} [params.end]
     * @param {number} [params.aggregate_minutes]
     * @returns {Promise<PowerResponse>}
     */
    power: async function(params) {
        var searchParams = new URLSearchParams();
        if (params.start !== undefined) searchParams.set('start', String(params.start));
        if (params.end !== undefined) searchParams.set('end', String(params.end));
        if (params.aggregate_minutes !== undefined) searchParams.set('aggregate_minutes', String(params.aggregate_minutes));
        var query = searchParams.toString() ? '?' + searchParams.toString() : '';
        var response = await fetch('/api/power' + query);
        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }
        return response.json();
    },

    /**
     * @param {(string | null)} [params.start]
     * @param {(string | null)} [params.end]
     * @returns {Promise<EnergyResponse>}
     */
    energy: async function(params) {
        var searchParams = new URLSearchParams();
        if (params.start !== undefined) searchParams.set('start', String(params.start));
        if (params.end !== undefined) searchParams.set('end', String(params.end));
        var query = searchParams.toString() ? '?' + searchParams.toString() : '';
        var response = await fetch('/api/energy' + query);
        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }
        return response.json();
    }

    };
})();
