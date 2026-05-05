// Metrics page - SOC, Power, Energy, Prices charts
(function() {
    'use strict';

    var dashboardStart = null;
    var dashboardEnd = null;
    var currentFoR = 'multiplus';
    var currentPowerMode = 'total';  // 'total' or 'phases'
    var cachedEnergyData = null;
    var cachedPowerConfig = null;    // Cached power chart config
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

    /**
     * Fetch power chart configuration from backend.
     * @returns {Promise<Object>} Chart config with queries, phases, has_phase_toggle
     */
    async function fetchPowerChartConfig() {
        if (cachedPowerConfig) {
            return cachedPowerConfig;
        }
        cachedPowerConfig = await Api.chartsPowerQueries({});

        // Show/hide phase toggle button based on phases
        var toggleContainer = document.getElementById('power-phase-buttons');
        if (toggleContainer) {
            toggleContainer.style.display = cachedPowerConfig.phases.length > 1 ? '' : 'none';
        }

        return cachedPowerConfig;
    }

    /**
     * Filter queries based on current phase mode.
     * @param {Array} queries - All query definitions
     * @param {string} mode - 'total' or 'phases'
     * @returns {Array} Filtered queries
     */
    function filterQueriesByMode(queries, mode) {
        return queries.filter(function(q) {
            // null means show in both modes
            if (q.is_total === null) {
                return true;
            }
            if (mode === 'total') {
                return q.is_total === true;
            } else {
                return q.is_total === false;
            }
        });
    }

    async function loadPowerChart(elementId, start, end, aggregateMinutes) {
        aggregateMinutes = aggregateMinutes || 5;
        Utils.showLoading(elementId);

        try {
            var config = await fetchPowerChartConfig();
            var step = aggregateMinutes + 'm';

            // Filter queries based on current mode
            var activeQueries = filterQueriesByMode(config.queries, currentPowerMode);

            // Execute all queries in parallel using Timeseries helper
            var tracePromises = activeQueries.map(async function(q) {
                var query = q.query.replace(/\$step/g, step);
                try {
                    var result = await Timeseries.queryRangeRaw(query, start, end, step);
                    var traces = Timeseries.toPlotlyTraces(result, { name: q.label });
                    return traces[0] || null;
                } catch (e) {
                    console.error('Query failed for', q.label, ':', e);
                    return null;
                }
            });
            var traces = await Promise.all(tracePromises);

            // Filter out null results and apply settings
            var settings = Settings.load();
            var useKw = settings.powerUnit === 'kw';
            var unit = useKw ? 'kW' : 'W';
            var divisor = useKw ? 1000 : 1;

            var validTraces = traces.filter(function(t) { return t !== null; });
            validTraces.forEach(function(trace) {
                if (useKw) {
                    trace.y = trace.y.map(function(v) { return v / divisor; });
                }
                trace.hovertemplate = '%{y:.1f} ' + unit + '<extra>' + trace.name + '</extra>';
            });

            var layout = Utils.getDefaultLayout();
            Utils.layoutSetXRange(layout, start, end);
            Utils.layoutAddNowLine(layout, start, end);
            Utils.makePlot(elementId, validTraces, layout);
        } catch (error) {
            console.error('Error loading power data:', error);
            Utils.showError(elementId, 'Failed to load power data');
        }
    }

    /**
     * Re-render power chart with current settings (called when toggle changes).
     */
    function reloadPowerChart() {
        if (dashboardStart && dashboardEnd) {
            var hours = parseInt(document.getElementById('range-select').value);
            var aggregateMinutes = getAggregateMinutes(hours);
            loadPowerChart('power-chart', dashboardStart, dashboardEnd, aggregateMinutes);
        }
    }

    /**
     * Extend trace data with one extra point for step-function display.
     * @param {Object} trace - Plotly trace with x and y arrays
     * @param {string} step - Step string like '1h' or '15m'
     */
    function extendTraceForStepFunction(trace, step) {
        if (trace.x.length > 0) {
            var lastTime = trace.x[trace.x.length - 1];
            var stepMs = step === '1h' ? 3600000 : 900000;
            trace.x.push(new Date(lastTime.getTime() + stepMs));
            trace.y.push(trace.y[trace.y.length - 1]);
        }
    }

    async function loadPriceChart(elementId, start, end) {
        Utils.showLoading(elementId);

        // Extend end to show future prices
        var extendedEnd = new Date(end.getTime() + 2 * 24 * 60 * 60 * 1000);

        try {
            // Fetch query definitions from backend
            var config = await Api.graphPriceQueries({});

            // Execute all price queries in parallel
            var [marketResult, buyResult, sellResult] = await Promise.all([
                Timeseries.queryRangeRaw(config.market_query, start, extendedEnd, config.step).catch(function() { return null; }),
                Timeseries.queryRangeRaw(config.buy_query, start, extendedEnd, config.step).catch(function() { return null; }),
                Timeseries.queryRangeRaw(config.sell_query, start, extendedEnd, config.step).catch(function() { return null; }),
            ]);

            var marketTraces = Timeseries.toPlotlyTraces(marketResult, { name: 'Market' });
            var buyTraces = Timeseries.toPlotlyTraces(buyResult, { name: 'Buy' });
            var sellTraces = Timeseries.toPlotlyTraces(sellResult, { name: 'Sell' });

            if (marketTraces.length === 0 && buyTraces.length === 0 && sellTraces.length === 0) {
                Utils.showError(elementId, 'No price data available');
                return;
            }

            var settings = Settings.load();
            var priceMultiplier = settings.priceUnit === 'cent' ? 100 : 1;
            var priceLabel = settings.priceUnit === 'cent' ? 'ct/kWh' : (config.currency + '/kWh');

            var traces = [];

            if (marketTraces[0]) {
                var marketTrace = marketTraces[0];
                marketTrace.y = marketTrace.y.map(function(v) { return v * priceMultiplier; });
                marketTrace.line = { shape: 'hv', color: '#95a5a6', width: 1 };
                marketTrace.hovertemplate = 'Market: %{y:.2f} ' + priceLabel + '<extra></extra>';
                extendTraceForStepFunction(marketTrace, config.step);
                traces.push(marketTrace);
            }

            if (buyTraces[0]) {
                var buyTrace = buyTraces[0];
                buyTrace.y = buyTrace.y.map(function(v) { return v * priceMultiplier; });
                buyTrace.line = { shape: 'hv', color: '#e74c3c', width: 1.5 };
                buyTrace.hovertemplate = 'Buy: %{y:.2f} ' + priceLabel + '<extra></extra>';
                extendTraceForStepFunction(buyTrace, config.step);
                traces.push(buyTrace);
            }

            if (sellTraces[0]) {
                var sellTrace = sellTraces[0];
                sellTrace.y = sellTrace.y.map(function(v) { return v * priceMultiplier; });
                sellTrace.line = { shape: 'hv', color: '#2ecc71', width: 1.5 };
                sellTrace.hovertemplate = 'Sell: %{y:.2f} ' + priceLabel + '<extra></extra>';
                extendTraceForStepFunction(sellTrace, config.step);
                traces.push(sellTrace);
            }

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

    // Toggle: set to true to use new Timeseries API, false for legacy API
    var USE_TIMESERIES_FOR_SOC = false;

    async function loadSocChartLegacy(elementId, start, end) {
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

    /**
     * Load SOC chart using the new Timeseries API.
     * This queries the timeseries backend directly via /api/v1/query_range.
     */
    async function loadSocChartTimeseries(elementId, start, end, batteryId) {
        Utils.showLoading(elementId);

        try {
            // Initialize Timeseries with battery system ID
            await Timeseries.init(batteryId);

            // Query SOC and voltage in parallel
            var [socResult, voltageResult] = await Promise.all([
                Timeseries.queryRange('soc', start, end),
                Timeseries.queryRange('voltage', start, end),
            ]);

            var traces = [];

            // Convert SOC result to Plotly trace
            var socTraces = Timeseries.toPlotlyTraces(socResult, { name: 'SoC' });
            socTraces.forEach(function(trace) {
                trace.line = { color: '#3498db', width: 2 };
                trace.hovertemplate = '%{y:.1f}%<extra>SoC</extra>';
                traces.push(trace);
            });

            // Convert voltage result to Plotly trace (on secondary y-axis)
            var voltTraces = Timeseries.toPlotlyTraces(voltageResult, { name: 'Voltage' });
            voltTraces.forEach(function(trace) {
                trace.line = { color: '#ff7171', width: 2 };
                trace.hovertemplate = '%{y:.1f}V<extra>Voltage</extra>';
                trace.yaxis = 'y2';
                traces.push(trace);
            });

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
            Utils.makePlot(elementId, traces, layout);
        } catch (error) {
            console.error('Error loading SoC data via Timeseries:', error);
            Utils.showError(elementId, 'Failed to load SoC data');
        }
    }

    async function loadSocChart(elementId, start, end) {
        if (USE_TIMESERIES_FOR_SOC) {
            // Get battery system ID from system layout
            var layout = await Api.systemLayout();
            var batteryId = layout.battery_systems && layout.battery_systems[0]
                ? layout.battery_systems[0].id
                : null;

            if (batteryId) {
                return loadSocChartTimeseries(elementId, start, end, batteryId);
            }
            console.warn('No battery system found, falling back to legacy API');
        }
        return loadSocChartLegacy(elementId, start, end);
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
        var savedPowerMode = Settings.loadPagePref('dashboard', 'powerMode', 'total');

        document.getElementById('range-select').value = savedRange;
        currentFoR = savedFoR;
        currentPowerMode = savedPowerMode;

        // Energy frame-of-reference buttons
        var forButtons = document.querySelectorAll('#for-buttons .btn-toggle');
        forButtons.forEach(function(btn) {
            btn.classList.toggle('active', btn.dataset.value === savedFoR);
        });

        // Power phase toggle buttons
        var powerPhaseButtons = document.querySelectorAll('#power-phase-buttons .btn-toggle');
        powerPhaseButtons.forEach(function(btn) {
            btn.classList.toggle('active', btn.dataset.value === savedPowerMode);
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

        // Power phase toggle handlers
        powerPhaseButtons.forEach(function(btn) {
            btn.addEventListener('click', function() {
                document.querySelectorAll('#power-phase-buttons .btn-toggle').forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                currentPowerMode = btn.dataset.value || 'total';
                Settings.savePagePref('dashboard', 'powerMode', currentPowerMode);
                reloadPowerChart();
            });
        });

        loadDashboard();
    });
})();
