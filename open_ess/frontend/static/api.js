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
 * @typedef {Object} BatteryEnergySeries
 * @property {(number | null)[]} [energy_to_charger]
 * @property {(number | null)[]} [energy_from_inverter]
 * @property {(number | null)[]} [energy_to_battery]
 * @property {(number | null)[]} [energy_from_battery]
 * @property {(number | null)[]} [energy_loss_to_battery]
 * @property {(number | null)[]} [energy_loss_from_battery]
 */

/**
 * @typedef {Object} ChartsPowerResponse
 * @property {PowerQueryDef[]} [queries]
 * @property {string[]} [phases]
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
     * @param {Annotated} params.timeseries
     * @returns {Promise<ChartsPowerResponse>}
     */
    chartsPowerQueries: async function(params) {
        var searchParams = new URLSearchParams();
        if (params.timeseries !== undefined) searchParams.set('timeseries', String(params.timeseries));
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
    graphPriceQueries: async function(params) {
        var searchParams = new URLSearchParams();
        if (params.area !== undefined) searchParams.set('area', String(params.area));
        var query = searchParams.toString() ? '?' + searchParams.toString() : '';
        var response = await fetch('/api/graph/price-queries' + query);
        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }
        return response.json();
    }

    };
})();
