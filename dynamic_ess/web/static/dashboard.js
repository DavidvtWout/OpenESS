function getAggregateMinutes(hours) {
    if (hours <= 48) return 5;
    if (hours <= 168) return 15;
    return 60;
}

function getBucketMinutes(hours) {
    if (hours <= 48) return 60;      // hourly for Today and Last 2 days
    if (hours <= 168) return 120;    // 2-hourly for Last 7 days
    return 360;                       // 6-hourly for Last 30 days
}

// Store timestamps for alignment
let dashboardStart = null;
let dashboardEnd = null;
let currentFoR = 'multiplus';
let cachedEnergyData = null;
let cachedScheduleData = null;
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

// Load and display battery SoC chart with scheduled SoC
async function loadSocChart(elementId, start, end, aggregateMinutes = 5) {
    showLoading(elementId);

    const batterySocUrl = `/api/battery-soc?start=${formatDate(start)}&end=${formatDate(end)}`;
    console.log('Fetching SoC:', batterySocUrl);

    try {
        const response = await fetch(batterySocUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch battery SoC: ${response.status}`);
        }

        const data = await response.json();
        console.log('SoC data:', data.history.length, 'actual,', data.future.length, 'scheduled');

        const now = new Date();

        // Check if we have any data to show
        if (data.history.length === 0 && data.future.length === 0) {
            showError(elementId, 'No SoC data available');
            return;
        }

        const traces = [];

        // Add historical SoC trace with step interpolation
        if (data.history.length > 0) {
            const times = data.history.map(d => new Date(d.time));
            const socs = data.history.map(d => d.soc);

            // Extend the line to "now" with the last known SOC value
            const lastTime = times[times.length - 1];
            if (now > lastTime) {
                times.push(now);
                socs.push(socs[socs.length - 1]);
            }

            traces.push({
                x: times,
                y: socs,
                type: 'scatter',
                mode: 'lines',
                name: 'SoC',
                line: { color: '#3498db', width: 2 },
                hovertemplate: '%{y}%<extra>SoC</extra>',
            });
        }

        // Add scheduled SoC trace
        if (data.future.length > 0) {
            traces.push({
                x: data.future.map(d => new Date(d.time)),
                y: data.future.map(d => d.soc),
                type: 'scatter',
                mode: 'lines',
                name: 'Scheduled',
                line: { color: '#2ecc71', width: 2, dash: 'dot' },
                hovertemplate: '%{y}%<extra>Scheduled</extra>',
            });
        }

        const defaultLayout = getPlotlyLayout();
        const layout = {
            ...defaultLayout,
            hovermode: 'x unified',
            xaxis: {
                ...defaultLayout.xaxis,
                range: [start, end],
            },
            yaxis: {
                ...defaultLayout.yaxis,
                title: 'SoC (%)',
                range: [0, 100],
            },
            legend: getHorizontalLegend(),
            shapes: getNowLineShape(now, start, end),
        };

        document.getElementById(elementId).innerHTML = '';
        Plotly.newPlot(elementId, traces, layout, defaultConfig);
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
    cachedScheduleData = null;
    cachedBucketMinutes = bucketMinutes;

    await Promise.all([
        loadSocChart('soc-chart', dashboardStart, dashboardEnd, aggregateMinutes),
        loadPowerChart('power-chart', dashboardStart, dashboardEnd, aggregateMinutes),
        loadAndCacheEnergyData(dashboardStart, dashboardEnd, bucketMinutes),
        loadPricesChartRange('prices-chart', dashboardStart, dashboardEnd)
    ]);

    renderEnergyFlowChart('energy-chart', cachedEnergyData, dashboardStart, dashboardEnd, currentFoR, cachedScheduleData, cachedBucketMinutes);

    // Setup zoom sync after charts are loaded (needs to be re-attached after each newPlot)
    setupZoomSync();
}

async function loadAndCacheEnergyData(start, end, bucketMinutes) {
    const energyUrl = `/api/energy-graph?start=${start.toISOString()}&end=${end.toISOString()}&bucket_minutes=${bucketMinutes}`;

    try {
        const response = await fetch(energyUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch energy flow: ${response.status}`);
        }
        const result = await response.json();
        cachedEnergyData = result.energy;
        cachedScheduleData = result.schedule;
    } catch (error) {
        console.error('Error fetching energy data:', error);
        cachedEnergyData = null;
        cachedScheduleData = [];
    }
}

function renderEnergyOnly() {
    if (dashboardStart && dashboardEnd && (cachedEnergyData || cachedScheduleData)) {
        renderEnergyFlowChart('energy-chart', cachedEnergyData, dashboardStart, dashboardEnd, currentFoR, cachedScheduleData || [], cachedBucketMinutes);
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