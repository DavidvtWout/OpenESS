import { power, energy } from './types';
import { loadSettings, loadPagePref, savePagePref, applyTheme } from './settings';
import {
    formatDate,
    showLoading,
    showError,
    getDefaultLayout,
    layoutSetXRange,
    makePlot,
    PlotlyData,
} from './utils';

function getHoursSelect(): HTMLSelectElement {
    return document.getElementById('hours-select') as HTMLSelectElement;
}

function getAggregateSelect(): HTMLSelectElement {
    return document.getElementById('aggregate-select') as HTMLSelectElement;
}

async function loadPowerChart(): Promise<void> {
    const elementId = 'power-chart';
    showLoading(elementId);

    const hours = parseInt(getHoursSelect().value);
    const aggregateMinutes = parseInt(getAggregateSelect().value);

    const now = new Date();
    const start = new Date(now.getTime() - hours * 60 * 60 * 1000);

    try {
        const data = await power({
            start: formatDate(start),
            end: formatDate(now),
            aggregate_minutes: aggregateMinutes,
        });

        if (!data.series || Object.keys(data.series).length === 0) {
            showError(elementId, 'No power flow data available');
            return;
        }

        const settings = loadSettings();
        const useKw = settings.powerUnit === 'kw';
        const powerUnit = useKw ? 'kW' : 'W';

        const traces: PlotlyData[] = [];
        const sortedKeys = Object.keys(data.series).sort();

        for (const key of sortedKeys) {
            const series = data.series[key];
            if (!series.timestamps || !series.values) continue;

            traces.push({
                x: series.timestamps.map(t => new Date(t)),
                y: series.values,
                type: 'scatter',
                mode: 'lines',
                name: key,
                line: { width: 1.5 },
                connectgaps: false,
                hovertemplate: `%{y:.1f} ${powerUnit}<extra>${key}</extra>`,
            });
        }

        const layout = getDefaultLayout();
        layoutSetXRange(layout, start, now);
        layout.hovermode = 'x unified';
        makePlot(elementId, traces, layout);
    } catch (error) {
        console.error('Error loading power flows:', error);
        showError(elementId, 'Failed to load power flows');
    }
}

async function loadEnergyChart(): Promise<void> {
    const elementId = 'energy-chart';
    showLoading(elementId);

    const hours = parseInt(getHoursSelect().value);

    const now = new Date();
    const start = new Date(now.getTime() - hours * 60 * 60 * 1000);

    try {
        const data = await energy({
            start: formatDate(start),
            end: formatDate(now),
        });

        if (!data.series || Object.keys(data.series).length === 0) {
            showError(elementId, 'No energy flow data available');
            return;
        }

        const settings = loadSettings();
        const useKw = settings.powerUnit === 'kw';
        const energyUnit = useKw ? 'kWh' : 'Wh';

        const traces: PlotlyData[] = [];
        const sortedKeys = Object.keys(data.series).sort();

        for (const key of sortedKeys) {
            const series = data.series[key];
            if (!series.timestamps || !series.values) continue;

            // Add "now" to the end of the series
            const timestamps = [...series.timestamps.map(t => new Date(t)), new Date()];
            const lastValue = series.values[series.values.length - 1];
            const values = [...series.values, lastValue];

            const isIntegrated = key.includes('[integrated]');
            traces.push({
                x: timestamps,
                y: values,
                type: 'scatter',
                mode: 'lines',
                name: key,
                line: {
                    width: isIntegrated ? 1.5 : 2,
                    dash: isIntegrated ? 'dot' : 'solid',
                },
                hovertemplate: `%{y:.2f} ${energyUnit}<extra>${key}</extra>`,
            });
        }

        const layout = getDefaultLayout();
        layoutSetXRange(layout, start, now);
        layout.hovermode = 'x unified';
        makePlot(elementId, traces, layout);
    } catch (error) {
        console.error('Error loading energy flows:', error);
        showError(elementId, 'Failed to load energy flows');
    }
}

function loadAllCharts(): void {
    loadPowerChart();
    loadEnergyChart();
}

document.addEventListener('DOMContentLoaded', () => {
    const settings = loadSettings();
    applyTheme(settings.theme);

    getHoursSelect().value = loadPagePref('debug', 'hours', '24');
    getAggregateSelect().value = loadPagePref('debug', 'aggregate', '1');

    getHoursSelect().addEventListener('change', (e) => {
        savePagePref('debug', 'hours', (e.target as HTMLSelectElement).value);
        loadAllCharts();
    });
    getAggregateSelect().addEventListener('change', (e) => {
        savePagePref('debug', 'aggregate', (e.target as HTMLSelectElement).value);
        loadAllCharts();
    });

    loadAllCharts();
});
