import $ from 'jquery';
import DataTable from 'datatables.net-dt';
import 'datatables.net-buttons-dt';
import 'datatables.net-buttons/js/buttons.colVis.mjs';
import 'datatables.net-buttons/js/buttons.html5.mjs';
import 'datatables.net-colreorder-dt';
import 'datatables.net-columncontrol-dt';
import 'datatables.net-select-dt';
import 'datatables.net-staterestore-dt';

import { efficiencyScatter, cycles } from './api.js';
import { loadSettings, loadPagePref, savePagePref, applyTheme } from './settings.js';
import { formatDate, formatDateTime, formatDuration, formatEnergy, isDarkTheme } from './utils.js';

/**
 * @typedef {import('./api.js').EfficiencyScatterPoint} EfficiencyScatterPoint
 * @typedef {import('./api.js').BatteryCycle} BatteryCycle
 */

// Plotly is loaded globally from vendor
/** @type {{ newPlot(elementId: string, traces: PlotlyData[], layout: PlotlyLayout, config?: Record<string, unknown>): void }} */
const Plotly = /** @type {any} */ (window).Plotly;

/**
 * @typedef {Object.<string, unknown>} PlotlyLayout
 */

/**
 * @typedef {Object} PlotlyData
 * @property {number[]} [x]
 * @property {number[]} [y]
 * @property {string} [type]
 * @property {string} [mode]
 * @property {string} [name]
 * @property {{ color?: string; size?: number }} [marker]
 * @property {string[]} [text]
 * @property {string} [hoverinfo]
 */

// Module state
/** @type {DataTable.Api | null} */
let cyclesTable = null;

/**
 * @param {number | null} efficiency
 * @returns {string}
 */
function getEfficiencyClass(efficiency) {
    if (efficiency == null) return '';
    if (efficiency >= 90) return 'efficiency-good';
    if (efficiency >= 80) return 'efficiency-ok';
    return 'efficiency-poor';
}

/**
 * @param {number | null} eff
 * @returns {string}
 */
function formatEfficiency(eff) {
    if (eff == null) return '-';
    return eff.toFixed(1) + '%';
}

/**
 * @param {string} isoString
 * @returns {string}
 */
function formatScatterTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

async function loadScatterChart() {
    const elementId = 'scatter-chart';
    const aggregate = /** @type {HTMLSelectElement} */ (document.getElementById('scatter-aggregate-select')).value;
    const limit = /** @type {HTMLSelectElement} */ (document.getElementById('scatter-limit-select')).value;

    document.getElementById(elementId).innerHTML = '<div class="loading">Loading...</div>';

    try {
        const data = await efficiencyScatter({
            aggregate_minutes: parseInt(aggregate),
            limit: parseInt(limit),
        });

        if (data.length === 0) {
            document.getElementById(elementId).innerHTML = '<div class="no-data">No data available</div>';
            return;
        }

        const isDark = isDarkTheme();
        const settings = loadSettings();
        const useKw = settings.powerUnit === 'kw';
        const divisor = useKw ? 1000 : 1;
        const powerUnit = useKw ? 'kW' : 'W';

        /**
         * @typedef {Object} Category
         * @property {EfficiencyScatterPoint[]} data
         * @property {string} color
         * @property {string} name
         */

        /** @type {Record<string, Category>} */
        const categories = {
            charging: { data: [], color: 'rgba(52, 152, 219, 0.5)', name: 'Charging' },
            discharging: { data: [], color: 'rgba(231, 76, 60, 0.5)', name: 'Discharging' },
            idling: { data: [], color: 'rgba(149, 165, 166, 0.5)', name: 'Idling' },
            balancing: { data: [], color: 'rgba(155, 89, 182, 0.5)', name: 'Balancing' },
        };

        for (const d of data) {
            if (d.category && categories[d.category]) {
                categories[d.category].data.push(d);
            }
        }

        /** @param {number} w */
        const fmtPower = (w) => useKw ? (w / 1000).toFixed(2) : Math.round(w).toString();

        /**
         * @param {EfficiencyScatterPoint} d
         * @returns {string}
         */
        function buildHoverText(d) {
            const eff = d.efficiency != null ? `${d.efficiency.toFixed(1)}%` : 'N/A';
            const soc = d.soc != null ? `${d.soc}%` : 'N/A';
            const time = formatScatterTime(d.time ?? '');

            switch (d.category) {
                case 'charging':
                    return `Time: ${time}<br>SOC: ${soc}<br>Battery: ${fmtPower(d.battery_power ?? 0)} ${powerUnit}<br>Charger: ${fmtPower(d.inverter_charger_power ?? 0)} ${powerUnit}<br>Losses: ${fmtPower(d.losses ?? 0)} ${powerUnit}<br>Efficiency: ${eff}`;
                case 'discharging':
                    return `Time: ${time}<br>SOC: ${soc}<br>Battery: ${fmtPower(d.battery_power ?? 0)} ${powerUnit}<br>Inverter: ${fmtPower(Math.abs(d.inverter_charger_power ?? 0))} ${powerUnit}<br>Losses: ${fmtPower(d.losses ?? 0)} ${powerUnit}<br>Efficiency: ${eff}`;
                case 'balancing':
                    return `Time: ${time}<br>SOC: ${soc}<br>Battery: ${fmtPower(d.battery_power ?? 0)} ${powerUnit}<br>Balancing power`;
                case 'idling':
                    return `Time: ${time}<br>SOC: ${soc}<br>Idle consumption: ${fmtPower(d.losses ?? 0)} ${powerUnit}`;
                default:
                    return `Time: ${time}`;
            }
        }

        /** @type {PlotlyData[]} */
        const traces = Object.entries(categories).map(([, cat]) => ({
            x: cat.data.map(d => (d.battery_power ?? 0) / divisor),
            y: cat.data.map(d => (d.losses ?? 0) / divisor),
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

        /** @type {PlotlyLayout} */
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

/**
 * @param {number | null} data
 * @returns {string}
 */
function efficiencyRenderer(data) {
    if (data == null) return '-';
    const cls = getEfficiencyClass(data);
    return `<span class="${cls}">${data.toFixed(1)}%</span>`;
}

/**
 * @returns {DataTable.Api}
 */
function initCyclesTable() {
    cyclesTable = new DataTable('#cycles-table', {
        data: [],
        columns: [
            { data: 'start_time', render: (/** @type {string} */ data) => formatDateTime(data) },
            { data: 'end_time', render: (/** @type {string} */ data) => formatDateTime(data), visible: false },
            { data: 'duration_hours', render: (/** @type {number} */ data) => formatDuration(data) },
            { data: 'min_soc', render: (/** @type {number} */ data) => data + '%', visible: false },
            { data: 'max_soc', render: (/** @type {number} */ data) => data + '%', visible: false },
            { data: 'ac_energy_in', render: (/** @type {number | null} */ data) => formatEnergy(data) },
            { data: 'ac_energy_out', render: (/** @type {number | null} */ data) => formatEnergy(data) },
            { data: 'dc_energy_in', render: (/** @type {number | null} */ data) => formatEnergy(data), visible: false },
            { data: 'dc_energy_out', render: (/** @type {number | null} */ data) => formatEnergy(data), visible: false },
            { data: 'charger_efficiency', render: efficiencyRenderer },
            { data: 'battery_efficiency', render: efficiencyRenderer },
            { data: 'inverter_efficiency', render: efficiencyRenderer },
            { data: 'system_efficiency', render: efficiencyRenderer },
            { data: 'profit', render: (/** @type {number | null} */ data) => data != null ? data.toFixed(2) : '-' },
            { data: 'scheduled_profit', render: (/** @type {number | null} */ data) => data != null ? data.toFixed(2) : '-', visible: false },
        ],
        order: [[0, 'desc']],
        colReorder: true,
        stateSave: true,
        stateDuration: -1,
        language: {
            emptyTable: 'No cycles found',
            loadingRecords: 'Loading...',
        },
        layout: {
            topStart: null,
            topEnd: {
                buttons: [
                    {
                        extend: 'colvis',
                        text: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect></svg>',
                        titleAttr: 'Select columns',
                        className: 'btn-colvis',
                    }
                ]
            },
        },
    });

    return cyclesTable;
}

async function loadCycles() {
    const days = parseInt(/** @type {HTMLSelectElement} */ (document.getElementById('days-select')).value);
    const minSwing = parseInt(/** @type {HTMLSelectElement} */ (document.getElementById('swing-select')).value);

    const now = new Date();
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    try {
        const cyclesData = await cycles({
            start: formatDate(start),
            end: formatDate(now),
            min_soc_swing: minSwing,
        });

        cyclesTable.clear();
        cyclesTable.rows.add(cyclesData);
        cyclesTable.draw();

        if (cyclesData.length === 0) {
            document.getElementById('cycle-stats').innerHTML = '';
            return;
        }

        const totalAcIn = cyclesData.reduce((sum, c) => sum + (c.ac_energy_in ?? 0), 0);
        const totalAcOut = cyclesData.reduce((sum, c) => sum + (c.ac_energy_out ?? 0), 0);
        const avgEfficiency = totalAcIn > 0 ? (totalAcOut / totalAcIn) * 100 : null;

        document.getElementById('cycle-stats').innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${cyclesData.length}</div>
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
        cyclesTable.clear().draw();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const settings = loadSettings();
    applyTheme(settings.theme);

    /** @type {HTMLSelectElement} */ (document.getElementById('scatter-aggregate-select')).value = loadPagePref('cycles', 'aggregate', '10');
    /** @type {HTMLSelectElement} */ (document.getElementById('scatter-limit-select')).value = loadPagePref('cycles', 'limit', '2000');
    /** @type {HTMLSelectElement} */ (document.getElementById('days-select')).value = loadPagePref('cycles', 'days', '30');
    /** @type {HTMLSelectElement} */ (document.getElementById('swing-select')).value = loadPagePref('cycles', 'swing', '10');

    document.getElementById('scatter-aggregate-select').addEventListener('change', (e) => {
        savePagePref('cycles', 'aggregate', /** @type {HTMLSelectElement} */ (e.target).value);
        loadScatterChart();
    });
    document.getElementById('scatter-limit-select').addEventListener('change', (e) => {
        savePagePref('cycles', 'limit', /** @type {HTMLSelectElement} */ (e.target).value);
        loadScatterChart();
    });
    loadScatterChart();

    initCyclesTable();

    document.getElementById('days-select').addEventListener('change', (e) => {
        savePagePref('cycles', 'days', /** @type {HTMLSelectElement} */ (e.target).value);
        loadCycles();
    });
    document.getElementById('swing-select').addEventListener('change', (e) => {
        savePagePref('cycles', 'swing', /** @type {HTMLSelectElement} */ (e.target).value);
        loadCycles();
    });
    loadCycles();
});
