// Auto-generated from Pydantic models - do not edit manually
// Run `generate-types` to regenerate

// ============
// === Types ===
// ============

/**
 * @typedef {Object} TimeSeries
 * @property {string[]} [timestamps]
 * @property {number[]} [values]
 */

/**
 * @typedef {Object} BatteryQueriesResponse
 * @property {string} [soc_query]
 * @property {string} [schedule_soc_query]
 * @property {string} [voltage_query]
 */

/**
 * @typedef {Object} BatterySystemQueries
 * @property {string} [energy_to_charger]
 * @property {string} [energy_from_inverter]
 * @property {string} [energy_to_battery]
 * @property {string} [energy_from_battery]
 * @property {string} [energy_loss_to_battery]
 * @property {string} [energy_loss_from_battery]
 */

/**
 * @typedef {Object} ChartsPowerResponse
 * @property {PowerQueryDef[]} [queries]
 * @property {string[]} [phases]
 */

/**
 * @typedef {Object} EnergyQueriesResponse
 * @property {string} [grid_import_query]
 * @property {string} [grid_export_query]
 * @property {Object.<string, BatterySystemQueries>} [battery_systems]
 * @property {string} [solar_query]
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
     * @param {Annotated} params.mql_client
     * @returns {Promise<ChartsPowerResponse>}
     */
    chartsPowerQueries: async function(params) {
        var searchParams = new URLSearchParams();
        if (params.mql_client !== undefined) searchParams.set('mql_client', String(params.mql_client));
        var query = searchParams.toString() ? '?' + searchParams.toString() : '';
        var response = await fetch('/api/charts/power-queries' + query);
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
    }

    };
})();
