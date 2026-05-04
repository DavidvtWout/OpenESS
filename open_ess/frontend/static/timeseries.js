/**
 * Timeseries query helper for frontend visualization.
 *
 * This module provides a unified interface for querying the timeseries backend
 * (VictoriaMetrics or MetricSQLite) using MetricsQL queries defined in the
 * BatterySystemConfig.
 *
 * Usage:
 *   await Timeseries.init(batteryId);
 *   var result = await Timeseries.queryRange('power_grid', start, end);
 *   var traces = Timeseries.toPlotlyTraces(result, { name: 'Grid Power' });
 */
var Timeseries = (function () {
    /** @type {Object<string, string>} */
    var queries = {};

    /** @type {string|null} */
    var currentBatteryId = null;

    /**
     * Initialize the timeseries helper for a battery system.
     * Fetches the resolved MetricsQL queries from the backend.
     *
     * @param {string} batteryId - The battery system ID
     * @returns {Promise<void>}
     */
    async function init(batteryId) {
        if (currentBatteryId === batteryId && Object.keys(queries).length > 0) {
            return; // Already initialized for this battery
        }

        var response = await fetch("/api/queries/" + encodeURIComponent(batteryId));
        if (!response.ok) {
            throw new Error("Failed to fetch queries: HTTP " + response.status);
        }
        queries = await response.json();
        currentBatteryId = batteryId;
    }

    /**
     * Calculate appropriate step based on time range.
     *
     * @param {Date} start - Start time
     * @param {Date} end - End time
     * @returns {string} Step string (e.g., "1m", "5m", "1h")
     */
    function calculateStep(start, end) {
        var durationMs = end.getTime() - start.getTime();
        var hour = 3600000;

        if (durationMs < hour) return "1m";
        if (durationMs < 6 * hour) return "5m";
        if (durationMs < 24 * hour) return "15m";
        if (durationMs < 7 * 24 * hour) return "1h";
        return "6h";
    }

    /**
     * Execute a range query against the timeseries backend.
     *
     * @param {string} queryName - Name of the query (e.g., "power_grid", "soc")
     * @param {Date} start - Start time
     * @param {Date} end - End time
     * @param {string} [step] - Optional step override (e.g., "5m")
     * @returns {Promise<Object>} Query result in Prometheus/VM format
     */
    async function queryRange(queryName, start, end, step) {
        var query = queries[queryName];
        if (!query) {
            throw new Error("Unknown query: " + queryName + ". Available: " + Object.keys(queries).join(", "));
        }

        var params = new URLSearchParams({
            query: query,
            start: (start.getTime() / 1000).toString(),
            end: (end.getTime() / 1000).toString(),
            step: step || calculateStep(start, end),
        });

        var response = await fetch("/api/v1/query_range?" + params);
        if (!response.ok) {
            throw new Error("Query failed: HTTP " + response.status);
        }
        return response.json();
    }

    /**
     * Execute a raw MetricsQL query (not from the predefined queries).
     *
     * @param {string} query - MetricsQL query string
     * @param {Date} start - Start time
     * @param {Date} end - End time
     * @param {string} [step] - Optional step override
     * @returns {Promise<Object>} Query result
     */
    async function queryRangeRaw(query, start, end, step) {
        var params = new URLSearchParams({
            query: query,
            start: (start.getTime() / 1000).toString(),
            end: (end.getTime() / 1000).toString(),
            step: step || calculateStep(start, end),
        });

        var response = await fetch("/api/v1/query_range?" + params);
        if (!response.ok) {
            throw new Error("Query failed: HTTP " + response.status);
        }
        return response.json();
    }

    /**
     * Format metric labels into a readable string.
     *
     * @param {Object} metric - Metric labels object
     * @returns {string} Formatted label string
     */
    function formatLabels(metric) {
        var name = metric.__name__ || "unknown";
        var labels = Object.entries(metric)
            .filter(function (e) {
                return e[0] !== "__name__";
            })
            .map(function (e) {
                return e[0] + "=" + e[1];
            })
            .join(", ");
        return labels ? name + "{" + labels + "}" : name;
    }

    /**
     * Convert a query result to Plotly traces.
     *
     * @param {Object} result - Query result from queryRange
     * @param {Object} [options] - Options
     * @param {string} [options.name] - Override trace name (for single series)
     * @param {function} [options.nameFormatter] - Function to format series name from labels
     * @returns {Array} Array of Plotly trace objects
     */
    function toPlotlyTraces(result, options) {
        options = options || {};

        if (!result || !result.data || !result.data.result) {
            console.warn("Invalid query result:", result);
            return [];
        }

        return result.data.result.map(function (series, index) {
            var name;
            if (options.name && result.data.result.length === 1) {
                name = options.name;
            } else if (options.nameFormatter) {
                name = options.nameFormatter(series.metric);
            } else {
                name = formatLabels(series.metric);
            }

            return {
                x: series.values.map(function (v) {
                    return new Date(v[0] * 1000);
                }),
                y: series.values.map(function (v) {
                    return parseFloat(v[1]);
                }),
                type: "scatter",
                mode: "lines",
                name: name,
                line: { width: 1.5 },
            };
        });
    }

    /**
     * Get the list of available query names.
     *
     * @returns {string[]} Array of query names
     */
    function getQueryNames() {
        return Object.keys(queries);
    }

    /**
     * Get a specific query string.
     *
     * @param {string} name - Query name
     * @returns {string|undefined} The query string or undefined
     */
    function getQuery(name) {
        return queries[name];
    }

    return {
        init: init,
        queryRange: queryRange,
        queryRangeRaw: queryRangeRaw,
        toPlotlyTraces: toPlotlyTraces,
        calculateStep: calculateStep,
        formatLabels: formatLabels,
        getQueryNames: getQueryNames,
        getQuery: getQuery,
    };
})();
