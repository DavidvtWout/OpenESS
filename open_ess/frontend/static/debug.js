// Debug page - Raw Power and Energy metrics
(function() {
    'use strict';

    function getHoursSelect() {
        return document.getElementById('hours-select');
    }

    function getAggregateSelect() {
        return document.getElementById('aggregate-select');
    }

    /**
     * Execute a query and convert to Plotly traces.
     * @param {string} query - MetricsQL query
     * @param {Date} start - Start time
     * @param {Date} end - End time
     * @param {string} step - Step string
     * @returns {Promise<Array>} Array of Plotly traces
     */
    async function queryToTraces(query, start, end, step) {
        try {
            var result = await Timeseries.queryRangeRaw(query, start, end, step);
            return Timeseries.toPlotlyTraces(result);
        } catch (e) {
            console.error('Query failed:', query, e);
            return [];
        }
    }

    async function loadPowerChart() {
        var elementId = 'power-chart';
        Utils.showLoading(elementId);

        var hours = parseInt(getHoursSelect().value);
        var aggregateMinutes = parseInt(getAggregateSelect().value);
        var step = aggregateMinutes + 'm';

        var now = new Date();
        var start = new Date(now.getTime() - hours * 60 * 60 * 1000);

        try {
            // Query raw power metrics
            var powerQuery = 'avg_over_time(openess_power_watts[' + step + '])';
            var scheduledQuery = 'avg_over_time(openess_scheduled_power_watts[' + step + '])';

            var [powerTraces, scheduledTraces] = await Promise.all([
                queryToTraces(powerQuery, start, now, step),
                queryToTraces(scheduledQuery, start, now, step),
            ]);

            var traces = powerTraces.concat(scheduledTraces);

            if (traces.length === 0) {
                Utils.showError(elementId, 'No power data available');
                return;
            }

            // Style scheduled traces differently
            traces.forEach(function(trace) {
                if (trace.name && trace.name.indexOf('scheduled') !== -1) {
                    trace.line = { width: 1.5, dash: 'dot' };
                } else {
                    trace.line = { width: 1.5 };
                }
            });

            var settings = Settings.load();
            var useKw = settings.powerUnit === 'kw';
            var powerUnit = useKw ? 'kW' : 'W';
            var divisor = useKw ? 1000 : 1;

            if (useKw) {
                traces.forEach(function(trace) {
                    trace.y = trace.y.map(function(v) { return v / divisor; });
                });
            }

            traces.forEach(function(trace) {
                trace.hovertemplate = '%{y:.1f} ' + powerUnit + '<extra>' + trace.name + '</extra>';
            });

            var layout = Utils.getDefaultLayout();
            Utils.layoutSetXRange(layout, start, now);
            layout.hovermode = 'x unified';
            layout.yaxis = layout.yaxis || {};
            layout.yaxis.title = { text: powerUnit };
            Utils.makePlot(elementId, traces, layout);
        } catch (error) {
            console.error('Error loading power flows:', error);
            Utils.showError(elementId, 'Failed to load power flows');
        }
    }

    async function loadEnergyChart() {
        var elementId = 'energy-chart';
        Utils.showLoading(elementId);

        var hours = parseInt(getHoursSelect().value);
        var aggregateMinutes = parseInt(getAggregateSelect().value);
        var step = aggregateMinutes + 'm';

        var now = new Date();
        var start = new Date(now.getTime() - hours * 60 * 60 * 1000);

        try {
            // Query raw energy counter and integrated power
            var energyQuery = 'openess_energy_kwh';
            var integratedQuery = 'integrate(openess_power_watts) / 3600000';  // Convert Ws to kWh

            var [energyTraces, integratedTraces] = await Promise.all([
                queryToTraces(energyQuery, start, now, step),
                queryToTraces(integratedQuery, start, now, step),
            ]);

            // Mark integrated traces
            integratedTraces.forEach(function(trace) {
                trace.name = trace.name + ' [integrated]';
                trace.line = { width: 1.5, dash: 'dot' };
            });

            var traces = energyTraces.concat(integratedTraces);

            if (traces.length === 0) {
                Utils.showError(elementId, 'No energy data available');
                return;
            }

            // Style energy traces
            energyTraces.forEach(function(trace) {
                trace.line = { width: 2 };
            });

            traces.forEach(function(trace) {
                trace.hovertemplate = '%{y:.3f} kWh<extra>' + trace.name + '</extra>';
            });

            var layout = Utils.getDefaultLayout();
            Utils.layoutSetXRange(layout, start, now);
            layout.hovermode = 'x unified';
            layout.yaxis = layout.yaxis || {};
            layout.yaxis.title = { text: 'kWh' };
            Utils.makePlot(elementId, traces, layout);
        } catch (error) {
            console.error('Error loading energy flows:', error);
            Utils.showError(elementId, 'Failed to load energy flows');
        }
    }

    function loadAllCharts() {
        loadPowerChart();
        loadEnergyChart();
    }

    document.addEventListener('DOMContentLoaded', function() {
        getHoursSelect().value = Settings.loadPagePref('debug', 'hours', '24');
        getAggregateSelect().value = Settings.loadPagePref('debug', 'aggregate', '1');

        getHoursSelect().addEventListener('change', function(e) {
            Settings.savePagePref('debug', 'hours', e.target.value);
            loadAllCharts();
        });
        getAggregateSelect().addEventListener('change', function(e) {
            Settings.savePagePref('debug', 'aggregate', e.target.value);
            loadAllCharts();
        });

        loadAllCharts();
    });
})();
