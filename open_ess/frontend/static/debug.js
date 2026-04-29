// Debug page - Power and Energy charts
(function() {
    'use strict';

    function getHoursSelect() {
        return document.getElementById('hours-select');
    }

    function getAggregateSelect() {
        return document.getElementById('aggregate-select');
    }

    async function loadPowerChart() {
        var elementId = 'power-chart';
        Utils.showLoading(elementId);

        var hours = parseInt(getHoursSelect().value);
        var aggregateMinutes = parseInt(getAggregateSelect().value);

        var now = new Date();
        var start = new Date(now.getTime() - hours * 60 * 60 * 1000);

        try {
            var data = await Api.power({
                start: Utils.formatDate(start),
                end: Utils.formatDate(now),
                aggregate_minutes: aggregateMinutes,
            });

            if (!data.series || Object.keys(data.series).length === 0) {
                Utils.showError(elementId, 'No power flow data available');
                return;
            }

            var settings = Settings.load();
            var useKw = settings.powerUnit === 'kw';
            var powerUnit = useKw ? 'kW' : 'W';

            var traces = [];
            var sortedKeys = Object.keys(data.series).sort();

            for (var i = 0; i < sortedKeys.length; i++) {
                var key = sortedKeys[i];
                var series = data.series[key];
                if (!series.timestamps || !series.values) continue;

                traces.push({
                    x: series.timestamps.map(function(t) { return new Date(t); }),
                    y: series.values,
                    type: 'scatter',
                    mode: 'lines',
                    name: key,
                    line: { width: 1.5 },
                    connectgaps: false,
                    hovertemplate: '%{y:.1f} ' + powerUnit + '<extra>' + key + '</extra>',
                });
            }

            var layout = Utils.getDefaultLayout();
            Utils.layoutSetXRange(layout, start, now);
            layout.hovermode = 'x unified';
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

        var now = new Date();
        var start = new Date(now.getTime() - hours * 60 * 60 * 1000);

        try {
            var data = await Api.energy({
                start: Utils.formatDate(start),
                end: Utils.formatDate(now),
            });

            if (!data.series || Object.keys(data.series).length === 0) {
                Utils.showError(elementId, 'No energy flow data available');
                return;
            }

            var settings = Settings.load();
            var useKw = settings.powerUnit === 'kw';
            var energyUnit = useKw ? 'kWh' : 'Wh';

            var traces = [];
            var sortedKeys = Object.keys(data.series).sort();

            for (var i = 0; i < sortedKeys.length; i++) {
                var key = sortedKeys[i];
                var series = data.series[key];
                if (!series.timestamps || !series.values) continue;

                var timestamps = series.timestamps.map(function(t) { return new Date(t); });
                timestamps.push(new Date());
                var lastValue = series.values[series.values.length - 1];
                var values = series.values.concat([lastValue]);

                var isIntegrated = key.includes('[integrated]');
                traces.push({
                    x: timestamps,
                    y: values,
                    type: 'scatter',
                    mode: 'lines',
                    name: key,
                    line: {
                        width: isIntegrated ? 1.5 : 2,
                        dash: isIntegrated ? 'dot' : 'solid',
                    },
                    hovertemplate: '%{y:.2f} ' + energyUnit + '<extra>' + key + '</extra>',
                });
            }

            var layout = Utils.getDefaultLayout();
            Utils.layoutSetXRange(layout, start, now);
            layout.hovermode = 'x unified';
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
