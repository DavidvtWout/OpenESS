// Get Plotly layout based on current theme
function getPlotlyLayout() {
    const settings = loadSettings();
    const isDark = settings.theme === 'dark';

    return {
        margin: { t: 30, r: 30, b: 50, l: 60 },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        font: {
            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            color: isDark ? '#e4e4e4' : '#333333',
        },
        xaxis: {
            gridcolor: isDark ? '#2a2a4a' : '#eeeeee',
            linecolor: isDark ? '#3a3a5a' : '#dddddd',
        },
        yaxis: {
            gridcolor: isDark ? '#2a2a4a' : '#eeeeee',
            linecolor: isDark ? '#3a3a5a' : '#dddddd',
        },
    };
}

const defaultConfig = {
    responsive: true,
    displayModeBar: false,
};

// Helper to format dates for API
function formatDate(date) {
    return date.toISOString();
}

// Helper to show loading state
function showLoading(elementId) {
    document.getElementById(elementId).innerHTML = '<div class="loading">Loading...</div>';
}

// Helper to show error state
function showError(elementId, message) {
    document.getElementById(elementId).innerHTML = `<div class="error">${message}</div>`;
}

// Load and display prices chart
async function loadPricesChart(elementId, days = 7, showStats = false) {
    showLoading(elementId);

    const now = new Date();
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const end = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    const url = `/api/prices?start=${formatDate(start)}&end=${formatDate(end)}`;
    console.log('Fetching prices:', url);

    try {
        const response = await fetch(url);
        console.log('Prices response:', response.status);
        if (!response.ok) {
            const text = await response.text();
            console.error('Prices error:', text);
            throw new Error(`Failed to fetch prices: ${response.status}`);
        }

        const data = await response.json();
        console.log('Prices data:', data.length, 'points');

        if (data.length === 0) {
            showError(elementId, 'No price data available');
            return;
        }

        const settings = loadSettings();
        const priceMultiplier = settings.priceUnit === 'cent' ? 100 : 1;
        const priceLabel = settings.priceUnit === 'cent' ? 'ct/kWh' : 'EUR/kWh';

        const times = data.map(d => new Date(d.time));
        const prices = data.map(d => d.price * priceMultiplier);

        // Extend the last price by 1 hour so the step chart shows the full last hour
        if (times.length > 0) {
            const lastTime = times[times.length - 1];
            const extendedTime = new Date(lastTime.getTime() + 60 * 60 * 1000);
            times.push(extendedTime);
            prices.push(prices[prices.length - 1]);
        }

        // Find current price
        const currentTime = now.getTime();
        let currentPriceIdx = times.findIndex((t, i) =>
            t.getTime() <= currentTime &&
            (i === times.length - 1 || times[i + 1].getTime() > currentTime)
        );

        const trace = {
            x: times,
            y: prices,
            type: 'scatter',
            mode: 'lines',
            line: { shape: 'hv', color: '#3498db', width: 2 },
            fill: 'tozeroy',
            fillcolor: 'rgba(52, 152, 219, 0.1)',
            name: 'Price',
        };

        const defaultLayout = getPlotlyLayout();
        const layout = {
            ...defaultLayout,
            xaxis: {
                ...defaultLayout.xaxis,
                title: 'Time',
            },
            yaxis: {
                ...defaultLayout.yaxis,
                title: priceLabel,
            },
            shapes: currentPriceIdx >= 0 ? [{
                type: 'line',
                x0: now,
                x1: now,
                y0: 0,
                y1: 1,
                yref: 'paper',
                line: { color: '#e74c3c', width: 2, dash: 'dash' },
            }] : [],
        };

        document.getElementById(elementId).innerHTML = '';
        Plotly.newPlot(elementId, [trace], layout, defaultConfig);

        // Update stats if requested
        if (showStats) {
            const statsEl = document.getElementById('price-stats');
            if (statsEl) {
                const min = Math.min(...prices);
                const max = Math.max(...prices);
                const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
                const current = currentPriceIdx >= 0 ? prices[currentPriceIdx] : null;
                const decimals = settings.priceUnit === 'cent' ? 2 : 4;

                statsEl.innerHTML = `
                    <div class="stat-card">
                        <div class="stat-value">${current !== null ? current.toFixed(decimals) : '-'}</div>
                        <div class="stat-label">Current (${priceLabel})</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${min.toFixed(decimals)}</div>
                        <div class="stat-label">Minimum</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${max.toFixed(decimals)}</div>
                        <div class="stat-label">Maximum</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${avg.toFixed(decimals)}</div>
                        <div class="stat-label">Average</div>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error loading prices:', error);
        showError(elementId, 'Failed to load prices');
    }
}

// Load and display battery chart
async function loadBatteryChart(elementId, hours = 24) {
    showLoading(elementId);

    const now = new Date();
    const start = new Date(now.getTime() - hours * 60 * 60 * 1000);

    const url = `/api/battery?start=${formatDate(start)}&end=${formatDate(now)}&aggregate_minutes=5`;
    console.log('Fetching battery:', url);

    try {
        const response = await fetch(url);
        console.log('Battery response:', response.status);
        if (!response.ok) {
            const text = await response.text();
            console.error('Battery error:', text);
            throw new Error(`Failed to fetch battery data: ${response.status}`);
        }

        const data = await response.json();
        console.log('Battery data:', data.length, 'points');

        if (data.length === 0) {
            showError(elementId, 'No battery data available');
            return;
        }

        const times = data.map(d => new Date(d.time));
        const power = data.map(d => d.battery_power);
        const soc = data.map(d => d.battery_soc);

        const powerTrace = {
            x: times,
            y: power,
            type: 'scatter',
            mode: 'lines',
            name: 'Power (W)',
            line: { color: '#3498db', width: 2 },
            yaxis: 'y',
        };

        const socTrace = {
            x: times,
            y: soc,
            type: 'scatter',
            mode: 'lines',
            name: 'SOC (%)',
            line: { color: '#2ecc71', width: 2 },
            yaxis: 'y2',
        };

        const defaultLayout = getPlotlyLayout();
        const settings = loadSettings();
        const isDark = settings.theme === 'dark';

        const layout = {
            ...defaultLayout,
            xaxis: { ...defaultLayout.xaxis },
            yaxis: {
                ...defaultLayout.yaxis,
                title: 'Power (W)',
                side: 'left',
            },
            yaxis2: {
                title: 'SOC (%)',
                overlaying: 'y',
                side: 'right',
                range: [0, 100],
                gridcolor: 'transparent',
                linecolor: isDark ? '#3a3a5a' : '#dddddd',
            },
            legend: {
                orientation: 'h',
                y: -0.2,
                font: { color: isDark ? '#e4e4e4' : '#333333' },
            },
        };

        document.getElementById(elementId).innerHTML = '';
        Plotly.newPlot(elementId, [powerTrace, socTrace], layout, defaultConfig);
    } catch (error) {
        console.error('Error loading battery data:', error);
        showError(elementId, 'Failed to load battery data');
    }
}

// Load and display grid power chart
async function loadGridChart(elementId, hours = 24) {
    showLoading(elementId);

    const now = new Date();
    const start = new Date(now.getTime() - hours * 60 * 60 * 1000);

    const url = `/api/system?start=${formatDate(start)}&end=${formatDate(now)}&aggregate_minutes=5`;
    console.log('Fetching system:', url);

    try {
        const response = await fetch(url);
        console.log('System response:', response.status);
        if (!response.ok) {
            const text = await response.text();
            console.error('System error:', text);
            throw new Error(`Failed to fetch system data: ${response.status}`);
        }

        const data = await response.json();
        console.log('System data:', data.length, 'points');

        if (data.length === 0) {
            showError(elementId, 'No system data available');
            return;
        }

        // Group by phase
        const phases = {};
        for (const d of data) {
            if (!phases[d.phase]) {
                phases[d.phase] = { times: [], grid: [], consumption: [] };
            }
            phases[d.phase].times.push(new Date(d.time));
            phases[d.phase].grid.push(d.grid_power);
            phases[d.phase].consumption.push(d.ac_consumption);
        }

        const colors = { 1: '#e74c3c', 2: '#f39c12', 3: '#9b59b6' };
        const traces = [];

        for (const [phase, values] of Object.entries(phases)) {
            traces.push({
                x: values.times,
                y: values.grid,
                type: 'scatter',
                mode: 'lines',
                name: `Grid L${phase}`,
                line: { color: colors[phase], width: 2 },
            });
        }

        const defaultLayout = getPlotlyLayout();
        const settings = loadSettings();
        const isDark = settings.theme === 'dark';

        const layout = {
            ...defaultLayout,
            xaxis: { ...defaultLayout.xaxis },
            yaxis: {
                ...defaultLayout.yaxis,
                title: 'Power (W)',
            },
            legend: {
                orientation: 'h',
                y: -0.2,
                font: { color: isDark ? '#e4e4e4' : '#333333' },
            },
        };

        document.getElementById(elementId).innerHTML = '';
        Plotly.newPlot(elementId, traces, layout, defaultConfig);
    } catch (error) {
        console.error('Error loading system data:', error);
        showError(elementId, 'Failed to load system data');
    }
}

// Load and display combined power chart (grid, battery, charger, inverter)
async function loadPowerChart(elementId, hours = 24, aggregateMinutes = 5) {
    showLoading(elementId);

    const now = new Date();
    const start = new Date(now.getTime() - hours * 60 * 60 * 1000);

    const url = `/api/power?start=${formatDate(start)}&end=${formatDate(now)}&aggregate_minutes=${aggregateMinutes}`;
    console.log('Fetching power:', url);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch power data: ${response.status}`);
        }

        const data = await response.json();
        console.log('Power data:', data.length, 'points');

        if (data.length === 0) {
            showError(elementId, 'No power data available');
            return;
        }

        const times = data.map(d => new Date(d.time));

        const traces = [
            {
                x: times,
                y: data.map(d => d.grid_power),
                type: 'scatter',
                mode: 'lines',
                name: 'Grid',
                line: { color: '#e74c3c', width: 2 },
            },
            {
                x: times,
                y: data.map(d => d.battery_power),
                type: 'scatter',
                mode: 'lines',
                name: 'Battery',
                line: { color: '#3498db', width: 2 },
            },
            {
                x: times,
                y: data.map(d => d.charger_power),
                type: 'scatter',
                mode: 'lines',
                name: 'Charger',
                line: { color: '#2ecc71', width: 1.5, dash: 'dot' },
                visible: 'legendonly',
            },
            {
                x: times,
                y: data.map(d => d.inverter_charger_power),
                type: 'scatter',
                mode: 'lines',
                name: 'Inverter/Charger',
                line: { color: '#9b59b6', width: 1.5, dash: 'dot' },
                visible: 'legendonly',
            },
        ];

        const defaultLayout = getPlotlyLayout();
        const settings = loadSettings();
        const isDark = settings.theme === 'dark';

        const layout = {
            ...defaultLayout,
            xaxis: { ...defaultLayout.xaxis },
            yaxis: {
                ...defaultLayout.yaxis,
                title: 'Power (W)',
                zeroline: true,
                zerolinecolor: isDark ? '#4a4a6a' : '#cccccc',
            },
            legend: {
                orientation: 'h',
                y: -0.15,
                font: { color: isDark ? '#e4e4e4' : '#333333' },
            },
            shapes: [{
                type: 'line',
                x0: now,
                x1: now,
                y0: 0,
                y1: 1,
                yref: 'paper',
                line: { color: '#e74c3c', width: 1, dash: 'dash' },
            }],
        };

        document.getElementById(elementId).innerHTML = '';
        Plotly.newPlot(elementId, traces, layout, defaultConfig);
    } catch (error) {
        console.error('Error loading power data:', error);
        showError(elementId, 'Failed to load power data');
    }
}

// Load and display energy flow stacked bar chart
async function loadEnergyFlowChart(elementId, hours = 24, bucketMinutes = 60) {
    showLoading(elementId);

    const now = new Date();
    const start = new Date(now.getTime() - hours * 60 * 60 * 1000);

    const url = `/api/energy-flow?start=${formatDate(start)}&end=${formatDate(now)}&bucket_minutes=${bucketMinutes}`;
    console.log('Fetching energy flow:', url);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch energy flow: ${response.status}`);
        }

        const data = await response.json();
        console.log('Energy flow data:', data.length, 'buckets');

        if (data.length === 0) {
            showError(elementId, 'No energy flow data available');
            return;
        }

        const times = data.map(d => new Date(d.time));

        // Convert Wh to kWh for display
        const toKwh = (wh) => wh / 1000;

        const traces = [
            {
                x: times,
                y: data.map(d => toKwh(d.grid_import_wh)),
                type: 'bar',
                name: 'Grid Import',
                marker: { color: '#e74c3c' },
            },
            {
                x: times,
                y: data.map(d => -toKwh(d.grid_export_wh)),
                type: 'bar',
                name: 'Grid Export',
                marker: { color: '#27ae60' },
            },
            {
                x: times,
                y: data.map(d => toKwh(d.battery_charge_wh)),
                type: 'bar',
                name: 'Battery Charge',
                marker: { color: '#3498db' },
            },
            {
                x: times,
                y: data.map(d => -toKwh(d.battery_discharge_wh)),
                type: 'bar',
                name: 'Battery Discharge',
                marker: { color: '#f39c12' },
            },
        ];

        const defaultLayout = getPlotlyLayout();
        const settings = loadSettings();
        const isDark = settings.theme === 'dark';

        const layout = {
            ...defaultLayout,
            barmode: 'relative',
            xaxis: { ...defaultLayout.xaxis },
            yaxis: {
                ...defaultLayout.yaxis,
                title: 'Energy (kWh)',
                zeroline: true,
                zerolinecolor: isDark ? '#4a4a6a' : '#cccccc',
            },
            legend: {
                orientation: 'h',
                y: -0.15,
                font: { color: isDark ? '#e4e4e4' : '#333333' },
            },
        };

        document.getElementById(elementId).innerHTML = '';
        Plotly.newPlot(elementId, traces, layout, defaultConfig);
    } catch (error) {
        console.error('Error loading energy flow:', error);
        showError(elementId, 'Failed to load energy flow');
    }
}
