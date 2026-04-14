function getAggregateMinutes(hours) {
    if (hours <= 48) return 1;
    if (hours <= 168) return 5;
    return 15;
}

function getBucketMinutes(hours) {
    if (hours <= 48) return 60;      // hourly for Today and Last 2 days
    if (hours <= 168) return 120;    // 2-hourly for Last 7 days
    if (hours <= 768) return 360;    // 6-hourly for Last 30 days
    return 1440;                     // daily for rest more than that
}

// Store timestamps for alignment
let dashboardStart = null;
let dashboardEnd = null;
let currentFoR = 'multiplus';
let cachedEnergyData = null;
let cachedBucketMinutes = 60;
let rangeOffset = 0; // Number of periods to shift back from current
let isRelayoutInProgress = false; // Flag to prevent infinite zoom sync loops

// Chart IDs for synchronized zooming
const chartIds = ['soc-chart', 'power-chart', 'energy-chart', 'prices-chart'];

function getTimeRange(hours, offset = 0) {
    const now = new Date();

    if (hours === 24) {
        // Today: 0:00 today to 0:00 tomorrow, shifted by offset days
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() - offset);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        return { start, end };
    } else {
        // Other ranges: aligned to midnight, shifted by offset periods
        const periodMs = hours * 60 * 60 * 1000;
        const end = new Date(now.getTime() - offset * periodMs);
        const start = new Date(end.getTime() - periodMs);
        start.setHours(0, 0, 0, 0);
        if (offset === 0) {
            return { start, end: now };
        }
        return { start, end };
    }
}

function updateRangeLabel() {
    const hours = parseInt(document.getElementById('range-select').value);
    const labelEl = document.getElementById('range-label');
    const nextBtn = document.getElementById('range-next');

    // Enable/disable next button (allow 1 day into future for schedule)
    nextBtn.disabled = rangeOffset <= -1;

    // Build label showing the date range
    if (dashboardStart && dashboardEnd) {
        const opts = { month: 'short', day: 'numeric' };
        const startStr = dashboardStart.toLocaleDateString(undefined, opts);
        const endStr = dashboardEnd.toLocaleDateString(undefined, opts);
        if (startStr === endStr || hours === 24) {
            labelEl.textContent = startStr;
        } else {
            labelEl.textContent = `${startStr} - ${endStr}`;
        }
    }
}

function setupZoomSync() {
    chartIds.forEach(chartId => {
        const chartEl = document.getElementById(chartId);
        if (!chartEl) return;

        chartEl.on('plotly_relayout', (eventData) => {
            // Ignore if we're already processing a relayout
            if (isRelayoutInProgress) return;

            // Check if this is a zoom/pan event (has xaxis.range)
            const xRange = eventData['xaxis.range[0]'] !== undefined
                ? [eventData['xaxis.range[0]'], eventData['xaxis.range[1]']]
                : eventData['xaxis.range'];

            if (!xRange) return;

            isRelayoutInProgress = true;

            // Apply the same range to all other charts
            chartIds.forEach(otherId => {
                if (otherId !== chartId) {
                    const otherEl = document.getElementById(otherId);
                    if (otherEl && otherEl.data) {
                        Plotly.relayout(otherEl, {
                            'xaxis.range[0]': xRange[0],
                            'xaxis.range[1]': xRange[1]
                        });
                    }
                }
            });

            // Reset flag after a short delay
            setTimeout(() => {
                isRelayoutInProgress = false;
            }, 100);
        });
    });
}

function renderConsumptionEnergyChart(elementId, data, start, end, bucketMinutes = 60) {

}

function renderGridEnergyChart(elementId, data, start, end, bucketMinutes = 60) {
    const settings = loadSettings();
    const useKw = settings.powerUnit === 'kw';
    const fmtEnergy = useKw ? (wh) => (wh / 1000).toFixed(2) : (wh) => Math.round(wh);
    const energyUnit = useKw ? 'kWh' : 'Wh';
    const toDisplay = useKw ? (wh) => wh / 1000 : (wh) => wh;

    //function buildHoverText(d) {
    //    const time = new Date(d.time).toLocaleString();
    //    return `<b>${time}</b><br>` +
    //            `Grid Export: ${fmtEnergy(d.grid_export_wh)} ${energyUnit}<br>` +
    //            `Grid Import: ${fmtEnergy(d.grid_import_wh)} ${energyUnit}<br>` +
    //            `Conversion Losses: ${fmtEnergy(d.charger_losses_wh + d.inverter_losses_wh)} ${energyUnit}`;
    //}
    //const hoverTexts = data.map(d => buildHoverText(d));

    const timestamps = data.timestamps.map(t => new Date(t));

    let traces = [];
    traces = [
        {
            x: timestamps,
            y: data.grid_export["From MP"].map(v => toDisplay(v)),
            type: 'bar',
            name: 'From MP',
            marker: { color: '#278e60' },
            //text: hoverTexts,
            //hoverinfo: 'text',
            textposition: 'none',
        },
        {
            x: timestamps,
            y: data.grid_import["Consumption"].map(v => -toDisplay(v)),
            type: 'bar',
            name: 'Consumption',
            marker: { color: '#3498db' },
            //text: hoverTexts,
            //hoverinfo: 'text',
            textposition: 'none',
        },
        {
            x: timestamps,
            y: data.grid_import["To MP"].map(v => -toDisplay(v)),
            type: 'bar',
            name: 'To MP',
            marker: { color: '#3498ab' },
            //text: hoverTexts,
            //hoverinfo: 'text',
            textposition: 'none',
        },
    ];

    const layout = getDefaultLayout();
    layoutSetXRange(layout, start, end);
    layoutAddNowLine(layout, start, end)
    makePlot(elementId, traces, layout);
}

function renderBatteryEnergyChart(elementId, data, start, end, bucketMinutes = 60) {
    const settings = loadSettings();
    const useKw = settings.powerUnit === 'kw';
    const fmtEnergy = useKw ? (wh) => (wh / 1000).toFixed(2) : (wh) => Math.round(wh);
    const energyUnit = useKw ? 'kWh' : 'Wh';
    const toDisplay = useKw ? (wh) => wh / 1000 : (wh) => wh;

    const timestamps = data.timestamps.map(t => new Date(t));
    const mp_data = data.battery_systems["MultiPlus"];

    let traces = [];
    traces = [
        {
            x: timestamps,
            y: mp_data.energy_from_inverter.map(v => toDisplay(v)),
            type: 'bar',
            name: 'Inverter Output',
            marker: { color: '#f39c12' },
            //text: hoverTexts,
            //hoverinfo: 'text',
            textposition: 'none',
        },
        //{
        //    x: timestamps,
        //    y: data.map(d => -toDisplay(d.inverter_losses_wh)),
        //    type: 'bar',
        //    name: 'Inverter Losses',
        //    marker: { color: '#e67e22' },
        //    text: hoverTexts,
        //    hoverinfo: 'text',
        //    textposition: 'none',
        //},
        {
            x: timestamps,
            y: mp_data.energy_to_charger.map(v => -toDisplay(v)),
            type: 'bar',
            name: 'Charger Input',
            marker: { color: '#3498db' },
            //text: hoverTexts,
            //hoverinfo: 'text',
            textposition: 'none',
        },
        //{
        //    x: timestamps,
        //    y: data.map(d => -toDisplay(d.charger_losses_wh)),
        //    type: 'bar',
        //    name: 'Charger Losses',
        //    marker: { color: '#2980b9' },
        //    text: hoverTexts,
        //    hoverinfo: 'text',
        //    textposition: 'none',
        //},
    ];

    const layout = getDefaultLayout();
    layoutSetXRange(layout, start, end);
    layoutAddNowLine(layout, start, end)
    makePlot(elementId, traces, layout);
}

// Render energy flow chart from pre-fetched data (for caching)
function renderEnergyFlowChart(elementId, data, start, end, frameOfReference = 'multiplus', bucketMinutes = 60) {
    if (frameOfReference === 'consumption') {
        renderConsumptionEnergyChart(elementId, data, start, end, bucketMinutes);
    } else if (frameOfReference === 'grid') {
        renderGridEnergyChart(elementId, data, start, end,bucketMinutes);
    } else {
        renderBatteryEnergyChart(elementId, data, start, end, bucketMinutes);
    }
    return;

    // Build FoR-specific hover text
//    function buildHoverText(d, forType) {
//        const time = new Date(d.time).toLocaleString();
//        if (forType === 'multiplus') {
//            return `<b>${time}</b><br>` +
//                `Inverter Output: ${fmtEnergy(d.inverter_output_wh)} ${energyUnit}<br>` +
//                `Inverter Losses: ${fmtEnergy(d.inverter_losses_wh)} ${energyUnit}<br>` +
//                `Charger Input: ${fmtEnergy(d.charger_input_wh)} ${energyUnit}<br>` +
//                `Charger Losses: ${fmtEnergy(d.charger_losses_wh)} ${energyUnit}`;
//        } else if (forType === 'grid') {
//            return `<b>${time}</b><br>` +
//                `Grid Export: ${fmtEnergy(d.grid_export_wh)} ${energyUnit}<br>` +
//                `Grid Import: ${fmtEnergy(d.grid_import_wh)} ${energyUnit}<br>` +
//                `Conversion Losses: ${fmtEnergy(d.charger_losses_wh + d.inverter_losses_wh)} ${energyUnit}`;
//        } else {
//            return `<b>${time}</b><br>` +
//                `Consumption: ${fmtEnergy(d.consumption_wh)} ${energyUnit}<br>` +
//                `MultiPlus Losses: ${fmtEnergy(d.charger_losses_wh + d.inverter_losses_wh)} ${energyUnit}`;
//        }
//    }
}

// Load and display energy flow stacked bar chart with frame of reference
async function loadEnergyFlowChart(elementId, start, end, bucketMinutes = 60, frameOfReference = 'multiplus') {
    showLoading(elementId);

    const energyUrl = `/api/energy-graph?start=${formatDate(start)}&end=${formatDate(end)}&bucket_minutes=${bucketMinutes}`;
    console.log('Fetching energy flow:', energyUrl);

    try {
        const response = await fetch(energyUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch energy flow: ${response.status}`);
        }

        const result = await response.json();
        renderEnergyFlowChart(elementId, result, start, end, frameOfReference, bucketMinutes);
    } catch (error) {
        console.error('Error loading energy flow:', error);
        showError(elementId, 'Failed to load energy flow');
    }
}

// Load and display combined power chart (grid, battery, inverter/charger, scheduled)
async function loadPowerChart(elementId, start, end, aggregateMinutes = 5) {
    showLoading(elementId);

    const powerGraphUrl = getPowerGraphUrl(start, end, aggregateMinutes);
    console.log('Fetching power:', powerGraphUrl);

    try {
        const response = await fetch(powerGraphUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch power data: ${response.status}`);
        }

        const data = await response.json();
        const settings = loadSettings();
        const useKw = settings.powerUnit === 'kw';
        const divisor = useKw ? 1000 : 1;
        const powerLabel = useKw ? 'Power (kW)' : 'Power (W)';
        const now = new Date();

        const unit = useKw ? 'kW' : 'W';
        const gapThresholdMs = aggregateMinutes * 60 * 1000 * 2;

        const traces = [];
        const sortedKeys = Object.keys(data.series).sort();
        for (let i = 0; i < sortedKeys.length; i++) {
            const key = sortedKeys[i];
            const series = data.series[key];

            traces.push({
                x: series.timestamps.map(t => new Date(t)),
                y: series.values,
                type: 'scatter',
                mode: 'lines',
                name: key,
                line: {width: 1.5},
                connectgaps: false,
                hovertemplate: `%{y:.1f} ${unit}<extra>${key}</extra>`,
            });
        }

        const layout = getDefaultLayout();
        layoutSetXRange(layout, start, end);
        layoutAddNowLine(layout, start, end)
        makePlot(elementId, traces, layout);
    } catch (error) {
        console.error('Error loading power data:', error);
        showError(elementId, 'Failed to load power data');
    }
}

// Load prices chart with start/end range (for dashboard alignment)
async function loadPriceChart(elementId, start, end) {
    showLoading(elementId);

    // Extend end by 2 days for future prices
    const extendedEnd = new Date(end.getTime() + 2 * 24 * 60 * 60 * 1000);

    const priceUrl = getPriceUrl(start, extendedEnd);
    console.log('Fetching prices:', priceUrl);

    try {
        const response = await fetch(priceUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch prices: ${response.status}`);
        }

        const data = await response.json();

        if (data.timeseries.length === 0) {
            showError(elementId, 'No price data available');
            return;
        }

        const settings = loadSettings();
        const priceMultiplier = settings.priceUnit === 'cent' ? 100 : 1;
        const priceLabel = settings.priceUnit === 'cent' ? 'ct/kWh' : data.unit;

        const timestamps = data.timeseries.map(d => new Date(d.time));
        const marketPrices = data.timeseries.map(d => d.market * priceMultiplier);
        const buyPrices = data.timeseries.map(d => d.buy * priceMultiplier);
        const sellPrices = data.timeseries.map(d => d.sell * priceMultiplier);

        // Extend the last price by 1 time bracket.
        const lastTime = timestamps[timestamps.length - 1];
        const extendedTime = new Date(lastTime.getTime() + data.aggregate_minutes * 60 * 1000);
        timestamps.push(extendedTime);
        marketPrices.push(marketPrices[marketPrices.length - 1]);
        buyPrices.push(buyPrices[buyPrices.length - 1]);
        sellPrices.push(sellPrices[sellPrices.length - 1]);

        const now = new Date();

        const marketTrace = {
            name: 'Market',
            x: timestamps,
            y: marketPrices,
            type: 'scatter',
            mode: 'lines',
            line: { shape: 'hv', color: '#95a5a6', width: 1 },
            hovertemplate: `Market: %{y:.2f} ${priceLabel}<extra></extra>`,
        };

        const buyTrace = {
            name: 'Buy',
            x: timestamps,
            y: buyPrices,
            type: 'scatter',
            mode: 'lines',
            line: { shape: 'hv', color: '#e74c3c', width: 1.5 },
            hovertemplate: `Buy: %{y:.2f} ${priceLabel}<extra></extra>`,
        };

        const sellTrace = {
            name: 'Sell',
            x: timestamps,
            y: sellPrices,
            type: 'scatter',
            mode: 'lines',
            line: { shape: 'hv', color: '#2ecc71', width: 1.5 },
            hovertemplate: `Sell: %{y:.2f} ${priceLabel}<extra></extra>`,
        };

        const layout = getDefaultLayout();
        layoutSetXRange(layout, start, end);
        layoutAddNowLine(layout, start, end);
        layout.yaxis.title = {text: priceLabel}
        makePlot(elementId, [marketTrace, buyTrace, sellTrace], layout);
    } catch (error) {
        console.error('Error loading prices:', error);
        showError(elementId, 'Failed to load prices');
    }
}

async function loadSocChart(elementId, start, end, aggregateMinutes = 1) {
    showLoading(elementId);

    const batteryGraphUrl = getBatteryGraphUrl(start, end);
    console.log('Fetching battery graph data:', batteryGraphUrl);

    try {
        const response = await fetch(batteryGraphUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch battery SoC: ${response.status}`);
        }

        const data = await response.json();
        const multipleSystems = Object.keys(data).length > 1;
        const traces = [];

        for (let [name, battery] of Object.entries(data)) {
            traces.push({
                ...makeTrace('SoC', timeseriesExtendToNow(battery.soc)),
                ...(multipleSystems && {
                  legendgroup: name,
                  legendgrouptitle: {text: name},
                }),
                line: { color: '#3498db', width: 2 },
                hovertemplate: '%{y}%<extra>SoC</extra>',
            });
            traces.push({
                ...makeTrace('Scheduled', battery.schedule),
                ...(multipleSystems && {
                  legendgroup: name,
                  legendgrouptitle: {text: name},
                }),
                line: { color: '#2ecc71', width: 2, dash: 'dot' },
                hovertemplate: '%{y}%<extra>Scheduled</extra>',
            });
            traces.push({
                ...makeTrace('Voltage', battery.voltage),
                ...(multipleSystems && {
                  legendgroup: name,
                  legendgrouptitle: {text: name},
                }),
                line: { color: '#ff7171', width: 2},
                hovertemplate: '%{y}V<extra>Voltage</extra>',
                yaxis: 'y2',
            });
        }

        const layout = getDefaultLayout();
        layoutSetXRange(layout, start, end);
        layoutAddNowLine(layout, start, end)
        layout.yaxis.side = 'left';
        layout.yaxis.range = [0, 100];
        layout.yaxis.title = {text: "SoC (%)"}
        layout.yaxis2 = {
            overlaying: 'y',
            side: 'right',
            gridcolor: 'transparent',
            title: {text: "Voltage (V)"},
        };
        if (multipleSystems) {
            layout.legend.y = -0.25;
        };
        makePlot(elementId, traces, layout);
    } catch (error) {
        console.error('Error loading SoC data:', error);
        showError(elementId, 'Failed to load SoC data');
    }
}

async function loadDashboard() {
    const hours = parseInt(document.getElementById('range-select').value);
    const aggregateMinutes = getAggregateMinutes(hours);
    const bucketMinutes = getBucketMinutes(hours);

    // Calculate time range with offset
    const range = getTimeRange(hours, rangeOffset);
    dashboardStart = range.start;
    dashboardEnd = range.end;

    // Update the range label
    updateRangeLabel();

    // Clear cache when time range changes
    cachedEnergyData = null;
    cachedBucketMinutes = bucketMinutes;

    await Promise.all([
        loadAndCacheEnergyData(dashboardStart, dashboardEnd, bucketMinutes),
        loadPowerChart('power-chart', dashboardStart, dashboardEnd, aggregateMinutes),
        loadPriceChart('prices-chart', dashboardStart, dashboardEnd),
        loadSocChart('soc-chart', dashboardStart, dashboardEnd, aggregateMinutes)
    ]);

    renderEnergyFlowChart('energy-chart', cachedEnergyData, dashboardStart, dashboardEnd, currentFoR, cachedBucketMinutes);

    // Setup zoom sync after charts are loaded (needs to be re-attached after each newPlot)
    setupZoomSync();
}

async function loadAndCacheEnergyData(start, end, bucketMinutes) {
    const energyUrl = getEnergyGraphUrl(start, end, bucketMinutes);
    console.log('Fetching', energyUrl);

    try {
        const response = await fetch(energyUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch energy flow: ${response.status}`);
        }
        const result = await response.json();
        cachedEnergyData = result;
    } catch (error) {
        console.error('Error fetching energy data:', error);
        cachedEnergyData = null;
    }
}

function renderEnergyOnly() {
    if (dashboardStart && dashboardEnd && cachedEnergyData) {
        renderEnergyFlowChart('energy-chart', cachedEnergyData, dashboardStart, dashboardEnd, currentFoR, cachedBucketMinutes);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Restore saved preferences
    const savedRange = loadPagePref('dashboard', 'range', '24');
    const savedFoR = loadPagePref('dashboard', 'for', 'multiplus');

    document.getElementById('range-select').value = savedRange;
    currentFoR = savedFoR;

    // Update FoR button active state
    document.querySelectorAll('#for-buttons .btn-toggle').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.value === savedFoR);
    });

    document.getElementById('range-select').addEventListener('change', (e) => {
        savePagePref('dashboard', 'range', e.target.value);
        rangeOffset = 0; // Reset offset when range changes
        loadDashboard();
    });

    // Range navigation buttons
    document.getElementById('range-prev').addEventListener('click', () => {
        rangeOffset++;
        loadDashboard();
    });

    document.getElementById('range-next').addEventListener('click', () => {
        if (rangeOffset > -1) {
            rangeOffset--;
            loadDashboard();
        }
    });

    // Frame of Reference button handlers
    document.querySelectorAll('#for-buttons .btn-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#for-buttons .btn-toggle').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFoR = btn.dataset.value;
            savePagePref('dashboard', 'for', currentFoR);
            renderEnergyOnly();
        });
    });

    loadDashboard();
});