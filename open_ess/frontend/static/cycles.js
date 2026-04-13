// Cycles page functionality

function getEfficiencyClass(efficiency) {
    if (efficiency == null) return '';
    if (efficiency >= 90) return 'efficiency-good';
    if (efficiency >= 80) return 'efficiency-ok';
    return 'efficiency-poor';
}

function formatEfficiency(eff) {
    if (eff == null) return '-';
    return eff.toFixed(1) + '%';
}

function formatScatterTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
}

async function loadScatterChart() {
    const elementId = 'scatter-chart';
    const aggregate = document.getElementById('scatter-aggregate-select').value;
    const limit = document.getElementById('scatter-limit-select').value;

    document.getElementById(elementId).innerHTML = '<div class="loading">Loading...</div>';

    const url = `/api/efficiency-scatter?aggregate_minutes=${aggregate}&limit=${limit}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.length === 0) {
            document.getElementById(elementId).innerHTML = '<div class="no-data">No data available</div>';
            return;
        }

        const settings = loadSettings();
        const isDark = settings.theme === 'dark';
        const useKw = settings.powerUnit === 'kw';
        const divisor = useKw ? 1000 : 1;
        const powerUnit = useKw ? 'kW' : 'W';

        // Separate points by category
        const categories = {
            charging: { data: [], color: 'rgba(52, 152, 219, 0.5)', name: 'Charging' },
            discharging: { data: [], color: 'rgba(231, 76, 60, 0.5)', name: 'Discharging' },
            idling: { data: [], color: 'rgba(149, 165, 166, 0.5)', name: 'Idling' },
            balancing: { data: [], color: 'rgba(155, 89, 182, 0.5)', name: 'Balancing' },
        };

        for (const d of data) {
            if (categories[d.category]) {
                categories[d.category].data.push(d);
            }
        }

        // Format power value based on unit
        const fmtPower = (w) => useKw ? (w / 1000).toFixed(2) : Math.round(w);

        // Build hover text based on category
        function buildHoverText(d) {
            const eff = d.efficiency != null ? `${d.efficiency.toFixed(1)}%` : 'N/A';
            const soc = d.soc != null ? `${d.soc}%` : 'N/A';
            const time = formatScatterTime(d.time);

            switch (d.category) {
                case 'charging':
                    return `Time: ${time}<br>SOC: ${soc}<br>Battery: ${fmtPower(d.battery_power)} ${powerUnit}<br>Charger: ${fmtPower(d.inverter_charger_power)} ${powerUnit}<br>Losses: ${fmtPower(d.losses)} ${powerUnit}<br>Efficiency: ${eff}`;
                case 'discharging':
                    return `Time: ${time}<br>SOC: ${soc}<br>Battery: ${fmtPower(d.battery_power)} ${powerUnit}<br>Inverter: ${fmtPower(Math.abs(d.inverter_charger_power))} ${powerUnit}<br>Losses: ${fmtPower(d.losses)} ${powerUnit}<br>Efficiency: ${eff}`;
                case 'balancing':
                    return `Time: ${time}<br>SOC: ${soc}<br>Battery: ${fmtPower(d.battery_power)} ${powerUnit}<br>Balancing power`;
                case 'idling':
                    return `Time: ${time}<br>SOC: ${soc}<br>Idle consumption: ${fmtPower(d.losses)} ${powerUnit}`;
                default:
                    return `Time: ${time}`;
            }
        }

        const traces = Object.entries(categories).map(([key, cat]) => ({
            x: cat.data.map(d => d.battery_power / divisor),
            y: cat.data.map(d => d.losses / divisor),
            type: 'scatter',
            mode: 'markers',
            name: cat.name,
            marker: {
                color: cat.color,
                size: 8,
            },
            text: cat.data.map(buildHoverText),
            hoverinfo: 'text',
        }));

        const layout = {
            margin: { t: 30, r: 30, b: 60, l: 60 },
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            font: {
                family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                color: isDark ? '#e4e4e4' : '#333333',
            },
            xaxis: {
                title: `Battery Power (${powerUnit})`,
                gridcolor: isDark ? '#2a2a4a' : '#eeeeee',
                linecolor: isDark ? '#3a3a5a' : '#dddddd',
                rangemode: 'tozero',
            },
            yaxis: {
                title: `Losses (${powerUnit})`,
                gridcolor: isDark ? '#2a2a4a' : '#eeeeee',
                linecolor: isDark ? '#3a3a5a' : '#dddddd',
                rangemode: 'tozero',
            },
            legend: {
                orientation: 'h',
                y: -0.15,
                font: { color: isDark ? '#e4e4e4' : '#333333' },
            },
            hovermode: 'closest',
        };

        document.getElementById(elementId).innerHTML = '';
        Plotly.newPlot(elementId, traces, layout, { responsive: true, displayModeBar: false });

    } catch (error) {
        console.error('Error loading scatter chart:', error);
        document.getElementById(elementId).innerHTML = '<div class="error">Failed to load scatter chart</div>';
    }
}

let cyclesGrid = null;

// All available columns for the cycles table
const allColumns = [
    { field: 'start_time', headerName: 'Start', valueFormatter: p => formatDateTime(p.value), sort: 'desc' },
    { field: 'end_time', headerName: 'End', valueFormatter: p => formatDateTime(p.value) },
    { field: 'duration_hours', headerName: 'Duration', valueFormatter: p => formatDuration(p.value) },
    { field: 'min_soc', headerName: 'Min SOC', valueFormatter: p => p.value + '%' },
    { field: 'max_soc', headerName: 'Max SOC', valueFormatter: p => p.value + '%', hide: true },
    { field: 'ac_energy_in', headerName: 'AC In', valueFormatter: p => formatEnergy(p.value) },
    { field: 'ac_energy_out', headerName: 'AC Out', valueFormatter: p => formatEnergy(p.value) },
    { field: 'dc_energy_in', headerName: 'DC In', valueFormatter: p => formatEnergy(p.value), hide: true },
    { field: 'dc_energy_out', headerName: 'DC Out', valueFormatter: p => formatEnergy(p.value), hide: true },
    { field: 'charger_efficiency', headerName: 'Charger Eff.', cellRenderer: efficiencyRenderer, hide: true },
    { field: 'battery_efficiency', headerName: 'Battery Eff.', cellRenderer: efficiencyRenderer, hide: true },
    { field: 'inverter_efficiency', headerName: 'Inverter Eff.', cellRenderer: efficiencyRenderer, hide: true },
    { field: 'system_efficiency', headerName: 'System Eff.', cellRenderer: efficiencyRenderer },
    { field: 'profit', headerName: 'Profit', valueFormatter: p => p.value != null ? p.value.toFixed(2) : '-' },
    { field: 'scheduled_profit', headerName: 'Profit Sch.', valueFormatter: p => p.value != null ? p.value.toFixed(2) : '-', hide: true },
];

function efficiencyRenderer(params) {
    if (params.value == null) return '-';
    const cls = getEfficiencyClass(params.value);
    return `<span class="${cls}">${params.value.toFixed(1)}%</span>`;
}

function saveColumnState(api) {
    const columnState = api.getColumnState();
    localStorage.setItem('cycles-table-columns', JSON.stringify(columnState));
}

function loadColumnState() {
    const saved = localStorage.getItem('cycles-table-columns');
    return saved ? JSON.parse(saved) : null;
}

function buildColumnPicker() {
    const dropdown = document.getElementById('column-picker-dropdown');
    dropdown.innerHTML = allColumns.map(col => `
        <div class="column-picker-item">
            <input type="checkbox" id="col-${col.field}" data-field="${col.field}" ${col.hide ? '' : 'checked'}>
            <label for="col-${col.field}">${col.headerName}</label>
        </div>
    `).join('');

    // Update checkboxes based on current column state
    updateColumnPickerState();
}

function updateColumnPickerState() {
    if (!cyclesGrid) return;
    const columnState = cyclesGrid.getColumnState();
    columnState.forEach(state => {
        const checkbox = document.querySelector(`#col-${state.colId}`);
        if (checkbox) {
            checkbox.checked = !state.hide;
        }
    });
}

function initColumnPicker() {
    const btn = document.getElementById('column-picker-btn');
    const dropdown = document.getElementById('column-picker-dropdown');

    // Toggle dropdown
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('hidden');
        if (!dropdown.classList.contains('hidden')) {
            updateColumnPickerState();
        }
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && e.target !== btn) {
            dropdown.classList.add('hidden');
        }
    });

    // Handle checkbox changes
    dropdown.addEventListener('change', (e) => {
        if (e.target.type === 'checkbox') {
            const field = e.target.dataset.field;
            cyclesGrid.setColumnsVisible([field], e.target.checked);
            saveColumnState(cyclesGrid);
        }
    });

    buildColumnPicker();
}

function initCyclesTable() {
    const settings = loadSettings();
    const isDark = settings.theme === 'dark';

    const gridOptions = {
        columnDefs: allColumns,
        rowData: [],
        defaultColDef: {
            sortable: true,
            resizable: true,
            suppressMovable: false,
        },
        domLayout: 'autoHeight',
        suppressColumnVirtualisation: true,
        animateRows: true,
        rowDragManaged: false,

        // Enable column moving
        suppressDragLeaveHidesColumns: true,

        // Persistence
        onColumnMoved: (e) => saveColumnState(e.api),
        onColumnResized: (e) => { if (e.finished) saveColumnState(e.api); },
        onColumnVisible: (e) => saveColumnState(e.api),
        onSortChanged: (e) => saveColumnState(e.api),

        // Restore saved state after grid is ready
        onGridReady: (e) => {
            const savedState = loadColumnState();
            if (savedState) {
                e.api.applyColumnState({ state: savedState, applyOrder: true });
            }
            // Update column picker checkboxes after state is restored
            setTimeout(updateColumnPickerState, 0);
        },

        // Loading overlay
        overlayLoadingTemplate: '<span class="ag-overlay-loading">Loading...</span>',
        overlayNoRowsTemplate: '<span class="ag-overlay-no-rows">No cycles found</span>',
    };

    const gridDiv = document.getElementById('cycles-table');
    gridDiv.className = isDark ? 'ag-theme-alpine-dark' : 'ag-theme-alpine';

    cyclesGrid = agGrid.createGrid(gridDiv, gridOptions);

    return cyclesGrid;
}

async function loadCycles() {
    const days = parseInt(document.getElementById('days-select').value);
    const minSwing = parseInt(document.getElementById('swing-select').value);

    const now = new Date();
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const url = `/api/cycles?start=${formatDate(start)}&end=${formatDate(now)}&min_soc_swing=${minSwing}`;

    cyclesGrid.setGridOption('loading', true);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const cycles = await response.json();

        cyclesGrid.setGridOption('rowData', cycles);
        cyclesGrid.setGridOption('loading', false);

        if (cycles.length === 0) {
            document.getElementById('cycle-stats').innerHTML = '';
            return;
        }

        // Calculate and show stats
        const totalAcIn = cycles.reduce((sum, c) => sum + (c.ac_energy_in || 0), 0);
        const totalAcOut = cycles.reduce((sum, c) => sum + (c.ac_energy_out || 0), 0);
        const avgEfficiency = totalAcIn > 0 ? (totalAcOut / totalAcIn) * 100 : null;

        document.getElementById('cycle-stats').innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${cycles.length}</div>
                <div class="stat-label">Total Cycles</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${formatEnergy(totalAcIn)}</div>
                <div class="stat-label">Total AC In</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${formatEnergy(totalAcOut)}</div>
                <div class="stat-label">Total AC Out</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${formatEfficiency(avgEfficiency)}</div>
                <div class="stat-label">Avg Efficiency</div>
            </div>
        `;

    } catch (error) {
        console.error('Error loading cycles:', error);
        cyclesGrid.setGridOption('rowData', []);
        cyclesGrid.setGridOption('loading', false);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Restore saved preferences
    document.getElementById('scatter-aggregate-select').value = loadPagePref('cycles', 'aggregate', '10');
    document.getElementById('scatter-limit-select').value = loadPagePref('cycles', 'limit', '2000');
    document.getElementById('days-select').value = loadPagePref('cycles', 'days', '30');
    document.getElementById('swing-select').value = loadPagePref('cycles', 'swing', '10');

    // Scatter chart controls
    document.getElementById('scatter-aggregate-select').addEventListener('change', (e) => {
        savePagePref('cycles', 'aggregate', e.target.value);
        loadScatterChart();
    });
    document.getElementById('scatter-limit-select').addEventListener('change', (e) => {
        savePagePref('cycles', 'limit', e.target.value);
        loadScatterChart();
    });
    loadScatterChart();

    // Initialize AG Grid table and column picker
    initCyclesTable();
    initColumnPicker();

    // Cycles table controls
    document.getElementById('days-select').addEventListener('change', (e) => {
        savePagePref('cycles', 'days', e.target.value);
        loadCycles();
    });
    document.getElementById('swing-select').addEventListener('change', (e) => {
        savePagePref('cycles', 'swing', e.target.value);
        loadCycles();
    });
    loadCycles();
});
