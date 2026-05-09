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
 * @property {(number | null)} [dc_energy_in]
 * @property {(number | null)} [dc_energy_out]
 * @property {(number | null)} [system_efficiency]
 * @property {(number | null)} [battery_efficiency]
 * @property {(number | null)} [charger_efficiency]
 * @property {(number | null)} [inverter_efficiency]
 * @property {(number | null)} [profit]
 * @property {(number | null)} [scheduled_profit]
 */

/**
 * @typedef {Object} BatteryPowerValues
 * @property {(number | null)} [charger]
 * @property {(number | null)} [inverter]
 * @property {(number | null)} [battery]
 * @property {(number | null)} [losses]
 * @property {(number | null)} [soc]
 */

/**
 * @typedef {Object} BatteryQueriesResponse
 * @property {string} [soc_query]
 * @property {string} [schedule_soc_query]
 * @property {string} [voltage_query]
 */

/**
 * @typedef {Object} BatterySystemInfo
 * @property {string} [id]
 * @property {string} [name]
 */

/**
 * @typedef {Object} ChartsPowerResponse
 * @property {PowerQueryDef[]} [queries]
 * @property {string[]} [phases]
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
 * @typedef {Object} EnergyQueriesResponse
 * @property {EnergyViewConfig[]} [views]
 */

/**
 * @typedef {Object} EnergyQueryDef
 * @property {string} [query]
 * @property {string} [label]
 * @property {string} [color]
 * @property {boolean} [negate]
 */

/**
 * @typedef {Object} EnergyResponse
 * @property {Object.<string, TimeSeries>} [series]
 */

/**
 * @typedef {Object} EnergyViewConfig
 * @property {string} [id]
 * @property {string} [name]
 * @property {EnergyQueryDef[]} [queries]
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
 * @typedef {Object} PowerQueryDef
 * @property {string} [label]
 * @property {string} [query]
 * @property {(boolean | null)} is_total
 */

/**
 * @typedef {Object} PowerResponse
 * @property {Object.<string, TimeSeries>} [series]
 */

/**
 * @typedef {Object} PriceQueriesResponse
 * @property {string} [market_query]
 * @property {string} [buy_query]
 * @property {string} [sell_query]
 * @property {Literal} [step]
 * @property {string} [currency]
 */

/**
 * @typedef {Object} ServiceMessage
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
     * @returns {Promise<EnergyQueriesResponse>}
     */
    chartsEnergyQueries: async function() {
        var response = await fetch('/api/charts/energy-queries');
        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }
        return response.json();
    },

    /**
     * @returns {Promise<ChartsPowerResponse>}
     */
    chartsPowerQueries: async function() {
        var response = await fetch('/api/charts/power-queries');
        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }
        return response.json();
    },

    /**
     * @param {(string | null)} [params.area]
     * @returns {Promise<PriceQueriesResponse>}
     */
    chartsPriceQueries: async function(params) {
        var searchParams = new URLSearchParams();
        if (params.area !== undefined) searchParams.set('area', String(params.area));
        var query = searchParams.toString() ? '?' + searchParams.toString() : '';
        var response = await fetch('/api/charts/price-queries' + query);
        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }
        return response.json();
    },

    /**
     * @returns {Promise<Object.<string, BatteryQueriesResponse>>}
     */
    chartsBatteryQueries: async function() {
        var response = await fetch('/api/charts/battery-queries');
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
     * @param {number} [params.idle_threshold]
     * @param {number} [params.limit]
     * @returns {Promise<EfficiencyScatterPoint[]>}
     */
    efficiencyScatter: async function(params) {
        var searchParams = new URLSearchParams();
        if (params.battery_id !== undefined) searchParams.set('battery_id', String(params.battery_id));
        if (params.start !== undefined) searchParams.set('start', String(params.start));
        if (params.end !== undefined) searchParams.set('end', String(params.end));
        if (params.aggregate_minutes !== undefined) searchParams.set('aggregate_minutes', String(params.aggregate_minutes));
        if (params.idle_threshold !== undefined) searchParams.set('idle_threshold', String(params.idle_threshold));
        if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
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
    }

    };
})();
