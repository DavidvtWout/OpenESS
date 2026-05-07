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
 * @typedef {Object} EnergyQueryDef
 * @property {string} query
 * @property {string} label
 * @property {string} color
 * @property {boolean} [negate]
 */

/**
 * @typedef {Object} EnergyViewConfig
 * @property {string} id
 * @property {string} name
 * @property {EnergyQueryDef[]} queries
 */

/**
 * @typedef {Object} EnergyQueriesResponse
 * @property {EnergyViewConfig[]} views
 */

/**
 * @typedef {Object} ChartsPowerResponse
 * @property {PowerQueryDef[]} [queries]
 * @property {string[]} [phases]
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
     * @param {Object} params
     * @param {number} [params.aggregate_minutes]
     * @param {number} [params.limit]
     * @returns {Promise<Array>}
     */
    efficiencyScatter: async function(params) {
        params = params || {};
        var searchParams = new URLSearchParams();
        if (params.aggregate_minutes !== undefined) searchParams.set('aggregate_minutes', String(params.aggregate_minutes));
        if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
        var query = searchParams.toString() ? '?' + searchParams.toString() : '';
        var response = await fetch('/api/efficiency-scatter' + query);
        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }
        return response.json();
    },

    /**
     * @param {Object} params
     * @param {string} [params.start]
     * @param {string} [params.end]
     * @param {number} [params.min_soc_swing]
     * @returns {Promise<Array>}
     */
    cycles: async function(params) {
        params = params || {};
        var searchParams = new URLSearchParams();
        if (params.start !== undefined) searchParams.set('start', params.start);
        if (params.end !== undefined) searchParams.set('end', params.end);
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
