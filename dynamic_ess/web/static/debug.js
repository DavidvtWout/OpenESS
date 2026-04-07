// Debug page functionality

// Color palette for different flow traces
const FLOW_COLORS = [
    '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
    '#1abc9c', '#e67e22', '#34495e', '#16a085', '#c0392b',
    '#2980b9', '#27ae60', '#d35400', '#8e44ad', '#17a2b8',
];

function getFlowColor(index) {
    return FLOW_COLORS[index % FLOW_COLORS.length];
}

async function loadPowerFlowsChart() {
    const elementId = 'power-chart';
    showLoading(elementId);

    const hours = parseInt(document.getElementById('hours-select').value);
    const aggregateMinutes = parseInt(document.getElementById('aggregate-select').value);

    const now = new Date();
    const start = new Date(now.getTime() - hours * 60 * 60 * 1000);

    const url = `/api/debug/power-flows?start=${formatDate(start)}&end=${formatDate(now)}&aggregate_minutes=${aggregateMinutes}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.length === 0) {
            showError(elementId, 'No power flow data available');
            return;
        }

        const settings = loadSettings();
        const useKw = settings.powerUnit === 'kw';
        const divisor = useKw ? 1000 : 1;
        const powerUnit = useKw ? 'kW' : 'W';

        // Group data by flow (from_node -> to_node)
        const flows = {};
        for (const d of data) {
            const key = `${d.from_node} -> ${d.to_node}`;
            if (!flows[key]) {
                flows[key] = { times: [], powers: [] };
            }
            flows[key].times.push(new Date(d.time));
            flows[key].powers.push(d.power / divisor);
        }

        // Gap threshold: 2x the aggregate interval
        const gapThresholdMs = aggregateMinutes * 60 * 1000 * 2;

        // Create traces for each flow
        const traces = [];
        const sortedKeys = Object.keys(flows).sort();
        for (let i = 0; i < sortedKeys.length; i++) {
            const key = sortedKeys[i];
            const flow = flows[key];
            const gapped = insertGapNulls(flow.times, flow.powers, gapThresholdMs);
            traces.push({
                x: gapped.times,
                y: gapped.values,
                type: 'scatter',
                mode: 'lines',
                name: key,
                line: { color: getFlowColor(i), width: 1.5 },
                connectgaps: false,
                hovertemplate: `%{y:.1f} ${powerUnit}<extra>${key}</extra>`,
            });
        }

        const defaultLayout = getPlotlyLayout();
        const layout = {
            ...defaultLayout,
            hovermode: 'x unified',
            xaxis: {
                ...defaultLayout.xaxis,
                range: [start, now],
            },
            yaxis: {
                ...defaultLayout.yaxis,
                title: `Power (${powerUnit})`,
                zeroline: true,
                zerolinecolor: getZerolineColor(),
            },
            legend: {
                ...getHorizontalLegend(-0.25),
                traceorder: 'normal',
            },
            shapes: getNowLineShape(now, start, now),
        };

        document.getElementById(elementId).innerHTML = '';
        Plotly.newPlot(elementId, traces, layout, defaultConfig);

    } catch (error) {
        console.error('Error loading power flows:', error);
        showError(elementId, 'Failed to load power flows');
    }
}

async function loadEnergyFlowsChart() {
    const elementId = 'energy-chart';
    showLoading(elementId);

    const hours = parseInt(document.getElementById('hours-select').value);

    const now = new Date();
    const start = new Date(now.getTime() - hours * 60 * 60 * 1000);

    const url = `/api/debug/energy-flows?start=${formatDate(start)}&end=${formatDate(now)}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.length === 0) {
            showError(elementId, 'No energy flow data available');
            return;
        }

        const settings = loadSettings();
        const useKw = settings.powerUnit === 'kw';
        const energyUnit = useKw ? 'kWh' : 'Wh';
        const multiplier = useKw ? 1 : 1000;  // API returns kWh

        // Group data by flow (from_node -> to_node) and source (counter vs integrated)
        const flows = {};
        for (const d of data) {
            const suffix = d.source === 'integrated' ? ' [int]' : '';
            const key = `${d.from_node} -> ${d.to_node}${suffix}`;
            if (!flows[key]) {
                flows[key] = { times: [], energies: [], source: d.source };
            }
            flows[key].times.push(new Date(d.time));
            flows[key].energies.push(d.energy * multiplier);
        }

        // Create traces for each flow
        const traces = [];
        const sortedKeys = Object.keys(flows).sort();
        for (let i = 0; i < sortedKeys.length; i++) {
            const key = sortedKeys[i];
            const flow = flows[key];
            const isIntegrated = flow.source === 'integrated';
            traces.push({
                x: flow.times,
                y: flow.energies,
                type: 'scatter',
                mode: 'lines',
                name: key,
                line: {
                    color: getFlowColor(i),
                    width: isIntegrated ? 1.5 : 2,
                    dash: isIntegrated ? 'dot' : 'solid',
                },
                hovertemplate: `%{y:.2f} ${energyUnit}<extra>${key}</extra>`,
            });
        }

        const defaultLayout = getPlotlyLayout();
        const layout = {
            ...defaultLayout,
            hovermode: 'x unified',
            xaxis: {
                ...defaultLayout.xaxis,
                range: [start, now],
            },
            yaxis: {
                ...defaultLayout.yaxis,
                title: `Energy (${energyUnit})`,
                zeroline: true,
                zerolinecolor: getZerolineColor(),
            },
            legend: {
                ...getHorizontalLegend(-0.25),
                traceorder: 'normal',
            },
            shapes: getNowLineShape(now, start, now),
        };

        document.getElementById(elementId).innerHTML = '';
        Plotly.newPlot(elementId, traces, layout, defaultConfig);

    } catch (error) {
        console.error('Error loading energy flows:', error);
        showError(elementId, 'Failed to load energy flows');
    }
}

function loadAllCharts() {
    loadPowerFlowsChart();
    loadEnergyFlowsChart();
}

document.addEventListener('DOMContentLoaded', () => {
    // Restore saved preferences
    document.getElementById('hours-select').value = loadPagePref('debug', 'hours', '24');
    document.getElementById('aggregate-select').value = loadPagePref('debug', 'aggregate', '1');

    // Event listeners
    document.getElementById('hours-select').addEventListener('change', (e) => {
        savePagePref('debug', 'hours', e.target.value);
        loadAllCharts();
    });
    document.getElementById('aggregate-select').addEventListener('change', (e) => {
        savePagePref('debug', 'aggregate', e.target.value);
        loadAllCharts();
    });

    // Initial load
    loadAllCharts();
});
