import $ from 'jquery';
import DataTable from 'datatables.net';

import { efficiencyScatter, cycles, EfficiencyScatterPoint, BatteryCycle } from './types';
import { loadSettings, loadPagePref, savePagePref } from './settings';
import { formatDate, formatDateTime, formatDuration, formatEnergy, isDarkTheme } from './utils';

// Plotly is loaded globally from vendor
declare const Plotly: {
    newPlot(elementId: string, traces: PlotlyData[], layout: PlotlyLayout, config?: Record<string, unknown>): void;
};

interface PlotlyLayout {
    [key: string]: unknown;
}

interface PlotlyData {
    x?: number[];
    y?: number[];
    type?: string;
    mode?: string;
    name?: string;
    marker?: { color?: string; size?: number };
    text?: string[];
    hoverinfo?: string;
}

// Module state
let cyclesTable: DataTable.Api | null = null;

function getEfficiencyClass(efficiency: number | null): string {
    if (efficiency == null) return '';
    if (efficiency >= 90) return 'efficiency-good';
    if (efficiency >= 80) return 'efficiency-ok';
    return 'efficiency-poor';
}

function formatEfficiency(eff: number | null): string {
    if (eff == null) return '-';
    return eff.toFixed(1) + '%';
}

function formatScatterTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

async function loadScatterChart(): Promise<void> {
    const elementId = 'scatter-chart';
    const aggregate = (document.getElementById('scatter-aggregate-select') as HTMLSelectElement).value;
    const limit = (document.getElementById('scatter-limit-select') as HTMLSelectElement).value;

    document.getElementById(elementId)!.innerHTML = '<div class="loading">Loading...</div>';

    try {
        const data = await efficiencyScatter({
            aggregate_minutes: parseInt(aggregate),
            limit: parseInt(limit),
        });

        if (data.length === 0) {
            document.getElementById(elementId)!.innerHTML = '<div class="no-data">No data available</div>';
            return;
        }

        const isDark = isDarkTheme();
        const settings = loadSettings();
        const useKw = settings.powerUnit === 'kw';
        const divisor = useKw ? 1000 : 1;
        const powerUnit = useKw ? 'kW' : 'W';

        interface Category {
            data: EfficiencyScatterPoint[];
            color: string;
            name: string;
        }

        const categories: Record<string, Category> = {
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

        const fmtPower = (w: number) => useKw ? (w / 1000).toFixed(2) : Math.round(w).toString();

        function buildHoverText(d: EfficiencyScatterPoint): string {
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

        const traces: PlotlyData[] = Object.entries(categories).map(([, cat]) => ({
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

        const layout: PlotlyLayout = {
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

        document.getElementById(elementId)!.innerHTML = '';
        Plotly.newPlot(elementId, traces, layout, { responsive: true, displayModeBar: false });

    } catch (error) {
        console.error('Error loading scatter chart:', error);
        document.getElementById(elementId)!.innerHTML = '<div class="error">Failed to load scatter chart</div>';
    }
}

function efficiencyRenderer(data: number | null): string {
    if (data == null) return '-';
    const cls = getEfficiencyClass(data);
    return `<span class="${cls}">${data.toFixed(1)}%</span>`;
}

function initCyclesTable(): DataTable.Api {
    cyclesTable = new DataTable('#cycles-table', {
        data: [],
        columns: [
            { data: 'start_time', render: (data: string) => formatDateTime(data) },
            { data: 'end_time', render: (data: string) => formatDateTime(data), visible: false },
            { data: 'duration_hours', render: (data: number) => formatDuration(data) },
            { data: 'min_soc', render: (data: number) => data + '%', visible: false },
            { data: 'max_soc', render: (data: number) => data + '%', visible: false },
            { data: 'ac_energy_in', render: (data: number | null) => formatEnergy(data) },
            { data: 'ac_energy_out', render: (data: number | null) => formatEnergy(data) },
            { data: 'dc_energy_in', render: (data: number | null) => formatEnergy(data), visible: false },
            { data: 'dc_energy_out', render: (data: number | null) => formatEnergy(data), visible: false },
            { data: 'charger_efficiency', render: efficiencyRenderer },
            { data: 'battery_efficiency', render: efficiencyRenderer },
            { data: 'inverter_efficiency', render: efficiencyRenderer },
            { data: 'system_efficiency', render: efficiencyRenderer },
            { data: 'profit', render: (data: number | null) => data != null ? data.toFixed(2) : '-' },
            { data: 'scheduled_profit', render: (data: number | null) => data != null ? data.toFixed(2) : '-', visible: false },
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

async function loadCycles(): Promise<void> {
    const days = parseInt((document.getElementById('days-select') as HTMLSelectElement).value);
    const minSwing = parseInt((document.getElementById('swing-select') as HTMLSelectElement).value);

    const now = new Date();
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    try {
        const cyclesData = await cycles({
            start: formatDate(start),
            end: formatDate(now),
            min_soc_swing: minSwing,
        });

        cyclesTable!.clear();
        cyclesTable!.rows.add(cyclesData);
        cyclesTable!.draw();

        if (cyclesData.length === 0) {
            document.getElementById('cycle-stats')!.innerHTML = '';
            return;
        }

        const totalAcIn = cyclesData.reduce((sum, c) => sum + (c.ac_energy_in ?? 0), 0);
        const totalAcOut = cyclesData.reduce((sum, c) => sum + (c.ac_energy_out ?? 0), 0);
        const avgEfficiency = totalAcIn > 0 ? (totalAcOut / totalAcIn) * 100 : null;

        document.getElementById('cycle-stats')!.innerHTML = `
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
        cyclesTable!.clear().draw();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    (document.getElementById('scatter-aggregate-select') as HTMLSelectElement).value = loadPagePref('cycles', 'aggregate', '10');
    (document.getElementById('scatter-limit-select') as HTMLSelectElement).value = loadPagePref('cycles', 'limit', '2000');
    (document.getElementById('days-select') as HTMLSelectElement).value = loadPagePref('cycles', 'days', '30');
    (document.getElementById('swing-select') as HTMLSelectElement).value = loadPagePref('cycles', 'swing', '10');

    document.getElementById('scatter-aggregate-select')!.addEventListener('change', (e) => {
        savePagePref('cycles', 'aggregate', (e.target as HTMLSelectElement).value);
        loadScatterChart();
    });
    document.getElementById('scatter-limit-select')!.addEventListener('change', (e) => {
        savePagePref('cycles', 'limit', (e.target as HTMLSelectElement).value);
        loadScatterChart();
    });
    loadScatterChart();

    initCyclesTable();

    document.getElementById('days-select')!.addEventListener('change', (e) => {
        savePagePref('cycles', 'days', (e.target as HTMLSelectElement).value);
        loadCycles();
    });
    document.getElementById('swing-select')!.addEventListener('change', (e) => {
        savePagePref('cycles', 'swing', (e.target as HTMLSelectElement).value);
        loadCycles();
    });
    loadCycles();
});
