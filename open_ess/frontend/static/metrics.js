// Metrics page - SOC, Power, Energy, Prices charts
(function() {
    'use strict';

    var dashboardStart = null;
    var dashboardEnd = null;
    var currentEnergyView = null;    // Current energy view ID
    var currentPowerMode = 'total';  // 'total' or 'phases'
    var cachedPowerConfig = null;    // Cached power chart config
    var cachedEnergyConfig = null;   // Cached energy chart config
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

    /**
     * Execute a MetricsQL query and return a Plotly trace.
     * @param {string} query - MetricsQL query with $step placeholder
     * @param {string} label - Trace label
     * @param {Date} start - Start time
     * @param {Date} end - End time
     * @param {string} step - Step string like '60m'
     * @param {Object} opts - Trace options (color, negate)
     * @returns {Promise<Object|null>} Plotly trace or null
     */
    async function executeEnergyQuery(query, label, start, end, step, opts) {
        if (!query) return null;
        opts = opts || {};

        try {
            var resolvedQuery = query.replace(/\$step/g, step);
            var result = await Timeseries.queryRangeRaw(resolvedQuery, start, end, step);
            var plotlyTraces = Timeseries.toPlotlyTraces(result);

            if (plotlyTraces[0]) {
                var trace = plotlyTraces[0];
                trace.name = label;
                trace.type = 'bar';
                delete trace.mode;
                delete trace.line;
                trace.marker = { color: opts.color || '#95a5a6' };

                if (opts.negate) {
                    trace.y = trace.y.map(function(v) { return -v; });
                }

                return trace;
            }
        } catch (e) {
            console.error('Query failed for', label, ':', e);
        }
        return null;
    }

    /**
     * Initialize energy view buttons based on config.
     */
    function initEnergyViewButtons() {
        if (!cachedEnergyConfig || !cachedEnergyConfig.views) return;

        var container = document.getElementById('for-buttons');
        if (!container) return;

        // Clear existing buttons
        container.innerHTML = '';

        // Create buttons for each view
        cachedEnergyConfig.views.forEach(function(view, index) {
            var btn = document.createElement('button');
            btn.className = 'btn-toggle';
            btn.dataset.value = view.id;
            btn.textContent = view.name;

            // Set first button or saved preference as active
            if (currentEnergyView === view.id || (!currentEnergyView && index === 0)) {
                btn.classList.add('active');
                currentEnergyView = view.id;
            }

            btn.addEventListener('click', function() {
                container.querySelectorAll('.btn-toggle').forEach(function(b) {
                    b.classList.remove('active');
                });
                btn.classList.add('active');
                currentEnergyView = view.id;
                Settings.savePagePref('dashboard', 'for', currentEnergyView);
                reloadEnergyChart();
            });

            container.appendChild(btn);
        });
    }

    /**
     * Get the current view config.
     * @returns {Object|null} Current view config or null
     */
    function getCurrentEnergyView() {
        if (!cachedEnergyConfig || !cachedEnergyConfig.views) return null;

        for (var i = 0; i < cachedEnergyConfig.views.length; i++) {
            if (cachedEnergyConfig.views[i].id === currentEnergyView) {
                return cachedEnergyConfig.views[i];
            }
        }
        // Fallback to first view
        return cachedEnergyConfig.views[0] || null;
    }

    async function loadEnergyChart(elementId, start, end, bucketMinutes) {
        Utils.showLoading(elementId);

        try {
            // Fetch query definitions (cached after first call)
            if (!cachedEnergyConfig) {
                cachedEnergyConfig = await Api.chartsEnergyQueries();
                initEnergyViewButtons();
            }

            var view = getCurrentEnergyView();
            if (!view || !view.queries) {
                Utils.showError(elementId, 'No energy view configured');
                return;
            }

            var step = bucketMinutes + 'm';
            var promises = [];

            // Execute all queries for the current view
            view.queries.forEach(function(queryDef) {
                promises.push(executeEnergyQuery(
                    queryDef.query,
                    queryDef.label,
                    start, end, step,
                    { color: queryDef.color, negate: queryDef.negate }
                ));
            });

            var results = await Promise.all(promises);
            var traces = results.filter(function(t) { return t !== null; });

            var layout = Utils.getDefaultLayout();
            layout.barmode = 'relative';
            Utils.layoutSetXRange(layout, start, end);
            Utils.layoutAddNowLine(layout, start, end);
            layout.yaxis = layout.yaxis || {};
            layout.yaxis.title = { text: 'kWh' };
            Utils.makePlot(elementId, traces, layout);
        } catch (error) {
            console.error('Error loading energy data:', error);
            Utils.showError(elementId, 'Failed to load energy data');
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
                    var traces = Timeseries.toPlotlyTraces(result);
                    if (traces[0]) {
                        traces[0].name = q.label;
                    }
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

    async function loadPriceChart(elementId, start, end, aggregateMinutes) {
        Utils.showLoading(elementId);

        // Extend end to show future prices
        var extendedEnd = new Date(end.getTime() + 2 * 24 * 60 * 60 * 1000);

        try {
            // Fetch query definitions from backend
            var config = await Api.chartsPriceQueries({});

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

    async function loadSocChart(elementId, start, end, aggregateMinutes) {
        Utils.showLoading(elementId);

        try {
            // Fetch query definitions from backend
            var step = aggregateMinutes + 'm';
            var config = await Api.chartsBatteryQueries();
            var batteryNames = Object.keys(config);
            var multipleSystems = batteryNames.length > 1;
            var traces = [];

            // Query all battery systems in parallel
            var queryPromises = batteryNames.map(async function(name) {
                var queries = config[name];
                var [socResult, scheduleResult, voltageResult] = await Promise.all([
                    Timeseries.queryRangeRaw(queries.soc_query, start, end, step).catch(function() { return null; }),
                    Timeseries.queryRangeRaw(queries.schedule_soc_query, start, end, step).catch(function() { return null; }),
                    Timeseries.queryRangeRaw(queries.voltage_query, start, end, step).catch(function() { return null; }),
                ]);
                return { name: name, socResult: socResult, scheduleResult: scheduleResult, voltageResult: voltageResult };
            });

            var results = await Promise.all(queryPromises);

            for (var i = 0; i < results.length; i++) {
                var result = results[i];
                var batteryName = result.name;
                var prefix = multipleSystems ? batteryName + ' ' : '';

                // SOC trace
                var socTraces = Timeseries.toPlotlyTraces(result.socResult);
                if (socTraces[0]) {
                    var socTrace = socTraces[0];
                    socTrace.name = prefix + 'SoC';
                    socTrace.line = { color: '#3498db', width: 2 };
                    socTrace.hovertemplate = '%{y:.1f}%<extra>' + socTrace.name + '</extra>';
                    if (multipleSystems) {
                        socTrace.legendgroup = batteryName;
                        socTrace.legendgrouptitle = { text: batteryName };
                    }
                    traces.push(socTrace);
                }

                // Scheduled SOC trace
                var schedTraces = Timeseries.toPlotlyTraces(result.scheduleResult);
                if (schedTraces[0]) {
                    var schedTrace = schedTraces[0];
                    schedTrace.name = prefix + 'Scheduled';
                    schedTrace.line = { color: '#2ecc71', width: 2, dash: 'dot' };
                    schedTrace.hovertemplate = '%{y:.1f}%<extra>' + schedTrace.name + '</extra>';
                    if (multipleSystems) {
                        schedTrace.legendgroup = batteryName;
                        schedTrace.legendgrouptitle = { text: batteryName };
                    }
                    traces.push(schedTrace);
                }

                // Voltage trace (secondary y-axis)
                var voltTraces = Timeseries.toPlotlyTraces(result.voltageResult);
                if (voltTraces[0]) {
                    var voltTrace = voltTraces[0];
                    voltTrace.name = prefix + 'Voltage';
                    voltTrace.line = { color: '#ff7171', width: 2 };
                    voltTrace.hovertemplate = '%{y:.1f}V<extra>' + voltTrace.name + '</extra>';
                    voltTrace.yaxis = 'y2';
                    if (multipleSystems) {
                        voltTrace.legendgroup = batteryName;
                        voltTrace.legendgrouptitle = { text: batteryName };
                    }
                    traces.push(voltTrace);
                }
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

    async function loadDashboard() {
        var hours = parseInt(document.getElementById('range-select').value);
        var aggregateMinutes = getAggregateMinutes(hours);
        var bucketMinutes = getBucketMinutes(hours);

        var range = getTimeRange(hours, rangeOffset);
        dashboardStart = range.start;
        dashboardEnd = range.end;

        updateRangeLabel();

        await Promise.all([
            loadEnergyChart('energy-chart', dashboardStart, dashboardEnd, bucketMinutes),
            loadPowerChart('power-chart', dashboardStart, dashboardEnd, aggregateMinutes),
            loadPriceChart('prices-chart', dashboardStart, dashboardEnd, aggregateMinutes),
            loadSocChart('soc-chart', dashboardStart, dashboardEnd, aggregateMinutes)
        ]);

        setupZoomSync();
    }

    function reloadEnergyChart() {
        if (dashboardStart && dashboardEnd) {
            var hours = parseInt(document.getElementById('range-select').value);
            var bucketMinutes = getBucketMinutes(hours);
            loadEnergyChart('energy-chart', dashboardStart, dashboardEnd, bucketMinutes);
        }
    }

    document.addEventListener('DOMContentLoaded', function() {
        var savedRange = Settings.loadPagePref('dashboard', 'range', '24');
        var savedEnergyView = Settings.loadPagePref('dashboard', 'for', null);
        var savedPowerMode = Settings.loadPagePref('dashboard', 'powerMode', 'total');

        document.getElementById('range-select').value = savedRange;
        currentEnergyView = savedEnergyView;  // Will be validated when config loads
        currentPowerMode = savedPowerMode;

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
