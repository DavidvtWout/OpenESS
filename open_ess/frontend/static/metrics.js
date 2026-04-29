// Metrics page - SOC, Power, Energy, Prices charts
(function() {
    'use strict';

    var dashboardStart = null;
    var dashboardEnd = null;
    var currentFoR = 'multiplus';
    var cachedEnergyData = null;
    var rangeOffset = 0;
    var isRelayoutInProgress = false;

    var chartIds = ['soc-chart', 'power-chart', 'energy-chart', 'prices-chart'];

    function getAggregateMinutes(hours) {
        if (hours <= 48) return 1;
        if (hours <= 168) return 5;
        return 15;
    }

    function getBucketMinutes(hours) {
        if (hours <= 48) return 60;
        if (hours <= 168) return 120;
        if (hours <= 768) return 360;
        return 1440;
    }

    function getTimeRange(hours, offset) {
        offset = offset || 0;
        var end = new Date();
        end.setHours(0, 0, 0, 0);
        end.setDate(end.getDate() + 1 - offset);
        var start = new Date(end);
        start.setDate(start.getDate() - hours / 24);
        return { start: start, end: end };
    }

    function updateRangeLabel() {
        var hours = parseInt(document.getElementById('range-select').value);
        var labelEl = document.getElementById('range-label');
        var nextBtn = document.getElementById('range-next');

        nextBtn.disabled = rangeOffset <= -1;

        if (dashboardStart && dashboardEnd && labelEl) {
            var opts = { month: 'short', day: 'numeric' };
            var startStr = dashboardStart.toLocaleDateString(undefined, opts);
            var endStr = dashboardEnd.toLocaleDateString(undefined, opts);
            if (startStr === endStr || hours === 24) {
                labelEl.textContent = startStr;
            } else {
                labelEl.textContent = startStr + ' - ' + endStr;
            }
        }
    }

    function setupZoomSync() {
        chartIds.forEach(function(chartId) {
            var chartEl = document.getElementById(chartId);
            if (!chartEl || !chartEl.on) return;

            chartEl.on('plotly_relayout', function(eventData) {
                if (isRelayoutInProgress) return;

                var xRange = eventData['xaxis.range[0]'] !== undefined
                    ? [eventData['xaxis.range[0]'], eventData['xaxis.range[1]']]
                    : eventData['xaxis.range'];

                if (!xRange) return;

                isRelayoutInProgress = true;

                chartIds.forEach(function(otherId) {
                    if (otherId !== chartId) {
                        var otherEl = document.getElementById(otherId);
                        if (otherEl && otherEl.data) {
                            Plotly.relayout(otherEl, {
                                'xaxis.range[0]': xRange[0],
                                'xaxis.range[1]': xRange[1]
                            });
                        }
                    }
                });

                setTimeout(function() {
                    isRelayoutInProgress = false;
                }, 100);
            });
        });
    }

    function renderGridEnergyChart(elementId, data, start, end) {
        var settings = Settings.load();
        var useKw = settings.powerUnit === 'kw';
        var toDisplay = useKw ? function(wh) { return wh ? wh / 1000 : 0; } : function(wh) { return wh || 0; };

        var timestamps = (data.timestamps || []).map(function(t) { return new Date(t); });

        var gridExport = data.grid_export || {};
        var gridImport = data.grid_import || {};

        var traces = [
            {
                x: timestamps,
                y: (gridExport["From MP"] || []).map(function(v) { return toDisplay(v); }),
                type: 'bar',
                name: 'From MP',
                marker: { color: '#278e60' },
                textposition: 'none',
            },
            {
                x: timestamps,
                y: (gridImport["Consumption"] || []).map(function(v) { return -toDisplay(v); }),
                type: 'bar',
                name: 'Consumption',
                marker: { color: '#3498db' },
                textposition: 'none',
            },
            {
                x: timestamps,
                y: (gridImport["To MP"] || []).map(function(v) { return -toDisplay(v); }),
                type: 'bar',
                name: 'To MP',
                marker: { color: '#3498ab' },
                textposition: 'none',
            },
        ];

        var layout = Utils.getDefaultLayout();
        Utils.layoutSetXRange(layout, start, end);
        Utils.layoutAddNowLine(layout, start, end);
        Utils.makePlot(elementId, traces, layout);
    }

    function renderBatteryEnergyChart(elementId, data, start, end) {
        var settings = Settings.load();
        var useKw = settings.powerUnit === 'kw';
        var toDisplay = useKw ? function(wh) { return wh ? wh / 1000 : 0; } : function(wh) { return wh || 0; };

        var timestamps = (data.timestamps || []).map(function(t) { return new Date(t); });
        var mpData = (data.battery_systems || {})["MultiPlus"] || {};

        var traces = [
            {
                x: timestamps,
                y: (mpData.energy_from_inverter || []).map(function(v) { return toDisplay(v); }),
                type: 'bar',
                name: 'Inverter Output',
                marker: { color: '#f39c12' },
                textposition: 'none',
            },
            {
                x: timestamps,
                y: (mpData.energy_to_charger || []).map(function(v) { return -toDisplay(v); }),
                type: 'bar',
                name: 'Charger Input',
                marker: { color: '#3498db' },
                textposition: 'none',
            },
        ];

        var layout = Utils.getDefaultLayout();
        Utils.layoutSetXRange(layout, start, end);
        Utils.layoutAddNowLine(layout, start, end);
        Utils.makePlot(elementId, traces, layout);
    }

    function renderEnergyFlowChart(elementId, data, start, end, frameOfReference) {
        frameOfReference = frameOfReference || 'multiplus';
        if (frameOfReference === 'grid') {
            renderGridEnergyChart(elementId, data, start, end);
        } else {
            renderBatteryEnergyChart(elementId, data, start, end);
        }
    }

    async function loadPowerChart(elementId, start, end, aggregateMinutes) {
        aggregateMinutes = aggregateMinutes || 5;
        Utils.showLoading(elementId);

        try {
            var data = await Api.powerGraph({
                start: Utils.formatDate(start),
                end: Utils.formatDate(end),
                aggregate_minutes: aggregateMinutes,
            });

            var settings = Settings.load();
            var useKw = settings.powerUnit === 'kw';
            var unit = useKw ? 'kW' : 'W';

            var traces = [];
            var series = data.series || {};
            var sortedKeys = Object.keys(series).sort();

            for (var i = 0; i < sortedKeys.length; i++) {
                var key = sortedKeys[i];
                var s = series[key];
                if (!s.timestamps || !s.values) continue;

                traces.push({
                    x: s.timestamps.map(function(t) { return new Date(t); }),
                    y: s.values,
                    type: 'scatter',
                    mode: 'lines',
                    name: key,
                    line: { width: 1.5 },
                    connectgaps: false,
                    hovertemplate: '%{y:.1f} ' + unit + '<extra>' + key + '</extra>',
                });
            }

            var layout = Utils.getDefaultLayout();
            Utils.layoutSetXRange(layout, start, end);
            Utils.layoutAddNowLine(layout, start, end);
            Utils.makePlot(elementId, traces, layout);
        } catch (error) {
            console.error('Error loading power data:', error);
            Utils.showError(elementId, 'Failed to load power data');
        }
    }

    async function loadPriceChart(elementId, start, end) {
        Utils.showLoading(elementId);

        var extendedEnd = new Date(end.getTime() + 2 * 24 * 60 * 60 * 1000);

        try {
            var data = await Api.prices({
                start: Utils.formatDate(start),
                end: Utils.formatDate(extendedEnd),
            });

            if (!data.timeseries || data.timeseries.length === 0) {
                Utils.showError(elementId, 'No price data available');
                return;
            }

            var settings = Settings.load();
            var priceMultiplier = settings.priceUnit === 'cent' ? 100 : 1;
            var priceLabel = settings.priceUnit === 'cent' ? 'ct/kWh' : (data.unit || '€/kWh');

            var timestamps = data.timeseries.map(function(d) { return new Date(d.time); });
            var marketPrices = data.timeseries.map(function(d) { return (d.market || 0) * priceMultiplier; });
            var buyPrices = data.timeseries.map(function(d) { return (d.buy || 0) * priceMultiplier; });
            var sellPrices = data.timeseries.map(function(d) { return (d.sell || 0) * priceMultiplier; });

            var lastTime = timestamps[timestamps.length - 1];
            var extendedTime = new Date(lastTime.getTime() + (data.aggregate_minutes || 60) * 60 * 1000);
            timestamps.push(extendedTime);
            marketPrices.push(marketPrices[marketPrices.length - 1]);
            buyPrices.push(buyPrices[buyPrices.length - 1]);
            sellPrices.push(sellPrices[sellPrices.length - 1]);

            var traces = [
                {
                    name: 'Market',
                    x: timestamps,
                    y: marketPrices,
                    type: 'scatter',
                    mode: 'lines',
                    line: { shape: 'hv', color: '#95a5a6', width: 1 },
                    hovertemplate: 'Market: %{y:.2f} ' + priceLabel + '<extra></extra>',
                },
                {
                    name: 'Buy',
                    x: timestamps,
                    y: buyPrices,
                    type: 'scatter',
                    mode: 'lines',
                    line: { shape: 'hv', color: '#e74c3c', width: 1.5 },
                    hovertemplate: 'Buy: %{y:.2f} ' + priceLabel + '<extra></extra>',
                },
                {
                    name: 'Sell',
                    x: timestamps,
                    y: sellPrices,
                    type: 'scatter',
                    mode: 'lines',
                    line: { shape: 'hv', color: '#2ecc71', width: 1.5 },
                    hovertemplate: 'Sell: %{y:.2f} ' + priceLabel + '<extra></extra>',
                },
            ];

            var layout = Utils.getDefaultLayout();
            Utils.layoutSetXRange(layout, start, end);
            Utils.layoutAddNowLine(layout, start, end);
            layout.yaxis = layout.yaxis || {};
            layout.yaxis.title = { text: priceLabel };
            Utils.makePlot(elementId, traces, layout);
        } catch (error) {
            console.error('Error loading prices:', error);
            Utils.showError(elementId, 'Failed to load prices');
        }
    }

    async function loadSocChart(elementId, start, end) {
        Utils.showLoading(elementId);

        try {
            var data = await Api.batteryGraph({
                start: Utils.formatDate(start),
                end: Utils.formatDate(end),
            });

            var keys = Object.keys(data);
            var multipleSystems = keys.length > 1;
            var traces = [];

            for (var i = 0; i < keys.length; i++) {
                var name = keys[i];
                var battery = data[name];

                var socTrace = Utils.makeTrace('SoC', Utils.timeseriesExtendToNow(battery.soc || { timestamps: [], values: [] }));
                socTrace.line = { color: '#3498db', width: 2 };
                socTrace.hovertemplate = '%{y}%<extra>SoC</extra>';
                if (multipleSystems) {
                    socTrace.legendgroup = name;
                    socTrace.legendgrouptitle = { text: name };
                }
                traces.push(socTrace);

                var schedTrace = Utils.makeTrace('Scheduled', battery.schedule || { timestamps: [], values: [] });
                schedTrace.line = { color: '#2ecc71', width: 2, dash: 'dot' };
                schedTrace.hovertemplate = '%{y}%<extra>Scheduled</extra>';
                if (multipleSystems) {
                    schedTrace.legendgroup = name;
                    schedTrace.legendgrouptitle = { text: name };
                }
                traces.push(schedTrace);

                var voltTrace = Utils.makeTrace('Voltage', battery.voltage || { timestamps: [], values: [] });
                voltTrace.line = { color: '#ff7171', width: 2 };
                voltTrace.hovertemplate = '%{y}V<extra>Voltage</extra>';
                voltTrace.yaxis = 'y2';
                if (multipleSystems) {
                    voltTrace.legendgroup = name;
                    voltTrace.legendgrouptitle = { text: name };
                }
                traces.push(voltTrace);
            }

            var layout = Utils.getDefaultLayout();
            Utils.layoutSetXRange(layout, start, end);
            Utils.layoutAddNowLine(layout, start, end);
            layout.yaxis = layout.yaxis || {};
            layout.yaxis.side = 'left';
            layout.yaxis.range = [0, 100];
            layout.yaxis.title = { text: "SoC (%)" };
            layout.yaxis2 = {
                overlaying: 'y',
                side: 'right',
                gridcolor: 'transparent',
                title: { text: "Voltage (V)" },
            };
            if (multipleSystems && layout.legend) {
                layout.legend.y = -0.25;
            }
            Utils.makePlot(elementId, traces, layout);
        } catch (error) {
            console.error('Error loading SoC data:', error);
            Utils.showError(elementId, 'Failed to load SoC data');
        }
    }

    async function loadAndCacheEnergyData(start, end, bucketMinutes) {
        try {
            cachedEnergyData = await Api.energyGraph({
                start: Utils.formatDate(start),
                end: Utils.formatDate(end),
                bucket_minutes: bucketMinutes,
            });
        } catch (error) {
            console.error('Error fetching energy data:', error);
            cachedEnergyData = null;
        }
    }

    async function loadDashboard() {
        var hours = parseInt(document.getElementById('range-select').value);
        var aggregateMinutes = getAggregateMinutes(hours);
        var bucketMinutes = getBucketMinutes(hours);

        var range = getTimeRange(hours, rangeOffset);
        dashboardStart = range.start;
        dashboardEnd = range.end;

        updateRangeLabel();

        cachedEnergyData = null;

        await Promise.all([
            loadAndCacheEnergyData(dashboardStart, dashboardEnd, bucketMinutes),
            loadPowerChart('power-chart', dashboardStart, dashboardEnd, aggregateMinutes),
            loadPriceChart('prices-chart', dashboardStart, dashboardEnd),
            loadSocChart('soc-chart', dashboardStart, dashboardEnd)
        ]);

        if (cachedEnergyData) {
            renderEnergyFlowChart('energy-chart', cachedEnergyData, dashboardStart, dashboardEnd, currentFoR);
        }

        setupZoomSync();
    }

    function renderEnergyOnly() {
        if (dashboardStart && dashboardEnd && cachedEnergyData) {
            renderEnergyFlowChart('energy-chart', cachedEnergyData, dashboardStart, dashboardEnd, currentFoR);
        }
    }

    document.addEventListener('DOMContentLoaded', function() {
        var savedRange = Settings.loadPagePref('dashboard', 'range', '24');
        var savedFoR = Settings.loadPagePref('dashboard', 'for', 'multiplus');

        document.getElementById('range-select').value = savedRange;
        currentFoR = savedFoR;

        var forButtons = document.querySelectorAll('#for-buttons .btn-toggle');
        forButtons.forEach(function(btn) {
            btn.classList.toggle('active', btn.dataset.value === savedFoR);
        });

        document.getElementById('range-select').addEventListener('change', function(e) {
            Settings.savePagePref('dashboard', 'range', e.target.value);
            rangeOffset = 0;
            loadDashboard();
        });

        document.getElementById('range-prev').addEventListener('click', function() {
            rangeOffset++;
            loadDashboard();
        });

        document.getElementById('range-next').addEventListener('click', function() {
            if (rangeOffset > -1) {
                rangeOffset--;
                loadDashboard();
            }
        });

        forButtons.forEach(function(btn) {
            btn.addEventListener('click', function() {
                document.querySelectorAll('#for-buttons .btn-toggle').forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                currentFoR = btn.dataset.value || 'multiplus';
                Settings.savePagePref('dashboard', 'for', currentFoR);
                renderEnergyOnly();
            });
        });

        loadDashboard();
    });
})();
