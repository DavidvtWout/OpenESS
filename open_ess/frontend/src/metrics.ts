import {
    energyGraph,
    powerGraph,
    prices,
    batteryGraph,
    EnergyGraphResponse,
} from './types';
import { loadSettings, loadPagePref, savePagePref, applyTheme } from './settings';
import {
    formatDate,
    showLoading,
    showError,
    getDefaultLayout,
    layoutSetXRange,
    layoutAddNowLine,
    makePlot,
    makeTrace,
    timeseriesExtendToNow,
    PlotlyData,
    PlotlyLayout,
} from './utils';

// Plotly for relayout (loaded globally from vendor)
declare const Plotly: {
    relayout(el: HTMLElement, update: Record<string, unknown>): void;
};

// Module state
let dashboardStart: Date | null = null;
let dashboardEnd: Date | null = null;
let currentFoR = 'multiplus';
let cachedEnergyData: EnergyGraphResponse | null = null;
let cachedBucketMinutes = 60;
let rangeOffset = 0;
let isRelayoutInProgress = false;

const chartIds = ['soc-chart', 'power-chart', 'energy-chart', 'prices-chart'];

function getAggregateMinutes(hours: number): number {
    if (hours <= 48) return 1;
    if (hours <= 168) return 5;
    return 15;
}

function getBucketMinutes(hours: number): number {
    if (hours <= 48) return 60;
    if (hours <= 168) return 120;
    if (hours <= 768) return 360;
    return 1440;
}

function getTimeRange(hours: number, offset = 0): { start: Date; end: Date } {
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() + 1 - offset)
    const start = new Date(end);
    start.setDate(start.getDate() - hours / 24)
    return { start, end };
}

function updateRangeLabel(): void {
    const hours = parseInt((document.getElementById('range-select') as HTMLSelectElement).value);
    const labelEl = document.getElementById('range-label');
    const nextBtn = document.getElementById('range-next') as HTMLButtonElement;

    nextBtn.disabled = rangeOffset <= -1;

    if (dashboardStart && dashboardEnd && labelEl) {
        const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
        const startStr = dashboardStart.toLocaleDateString(undefined, opts);
        const endStr = dashboardEnd.toLocaleDateString(undefined, opts);
        if (startStr === endStr || hours === 24) {
            labelEl.textContent = startStr;
        } else {
            labelEl.textContent = `${startStr} - ${endStr}`;
        }
    }
}

function setupZoomSync(): void {
    chartIds.forEach(chartId => {
        const chartEl = document.getElementById(chartId) as HTMLElement & {
            on?: (event: string, handler: (data: Record<string, unknown>) => void) => void;
            data?: unknown;
        };
        if (!chartEl || !chartEl.on) return;

        chartEl.on('plotly_relayout', (eventData: Record<string, unknown>) => {
            if (isRelayoutInProgress) return;

            const xRange = eventData['xaxis.range[0]'] !== undefined
                ? [eventData['xaxis.range[0]'], eventData['xaxis.range[1]']]
                : eventData['xaxis.range'] as [unknown, unknown] | undefined;

            if (!xRange) return;

            isRelayoutInProgress = true;

            chartIds.forEach(otherId => {
                if (otherId !== chartId) {
                    const otherEl = document.getElementById(otherId) as HTMLElement & { data?: unknown };
                    if (otherEl && otherEl.data) {
                        Plotly.relayout(otherEl, {
                            'xaxis.range[0]': xRange[0],
                            'xaxis.range[1]': xRange[1]
                        });
                    }
                }
            });

            setTimeout(() => {
                isRelayoutInProgress = false;
            }, 100);
        });
    });
}

function renderGridEnergyChart(elementId: string, data: EnergyGraphResponse, start: Date, end: Date): void {
    const settings = loadSettings();
    const useKw = settings.powerUnit === 'kw';
    const toDisplay = useKw ? (wh: number | null) => wh ? wh / 1000 : 0 : (wh: number | null) => wh ?? 0;

    const timestamps = (data.timestamps ?? []).map(t => new Date(t));

    const traces: PlotlyData[] = [
        {
            x: timestamps,
            y: (data.grid_export?.["From MP"] ?? []).map(v => toDisplay(v)),
            type: 'bar',
            name: 'From MP',
            marker: { color: '#278e60' },
            textposition: 'none',
        },
        {
            x: timestamps,
            y: (data.grid_import?.["Consumption"] ?? []).map(v => -toDisplay(v)),
            type: 'bar',
            name: 'Consumption',
            marker: { color: '#3498db' },
            textposition: 'none',
        },
        {
            x: timestamps,
            y: (data.grid_import?.["To MP"] ?? []).map(v => -toDisplay(v)),
            type: 'bar',
            name: 'To MP',
            marker: { color: '#3498ab' },
            textposition: 'none',
        },
    ];

    const layout = getDefaultLayout();
    layoutSetXRange(layout, start, end);
    layoutAddNowLine(layout, start, end);
    makePlot(elementId, traces, layout);
}

function renderBatteryEnergyChart(elementId: string, data: EnergyGraphResponse, start: Date, end: Date): void {
    const settings = loadSettings();
    const useKw = settings.powerUnit === 'kw';
    const toDisplay = useKw ? (wh: number | null) => wh ? wh / 1000 : 0 : (wh: number | null) => wh ?? 0;

    const timestamps = (data.timestamps ?? []).map(t => new Date(t));
    const mpData = data.battery_systems?.["MultiPlus"];

    const traces: PlotlyData[] = [
        {
            x: timestamps,
            y: (mpData?.energy_from_inverter ?? []).map(v => toDisplay(v)),
            type: 'bar',
            name: 'Inverter Output',
            marker: { color: '#f39c12' },
            textposition: 'none',
        },
        {
            x: timestamps,
            y: (mpData?.energy_to_charger ?? []).map(v => -toDisplay(v)),
            type: 'bar',
            name: 'Charger Input',
            marker: { color: '#3498db' },
            textposition: 'none',
        },
    ];

    const layout = getDefaultLayout();
    layoutSetXRange(layout, start, end);
    layoutAddNowLine(layout, start, end);
    makePlot(elementId, traces, layout);
}

function renderEnergyFlowChart(elementId: string, data: EnergyGraphResponse, start: Date, end: Date, frameOfReference = 'multiplus'): void {
    if (frameOfReference === 'grid') {
        renderGridEnergyChart(elementId, data, start, end);
    } else {
        renderBatteryEnergyChart(elementId, data, start, end);
    }
}

async function loadPowerChart(elementId: string, start: Date, end: Date, aggregateMinutes = 5): Promise<void> {
    showLoading(elementId);

    try {
        const data = await powerGraph({
            start: formatDate(start),
            end: formatDate(end),
            aggregate_minutes: aggregateMinutes,
        });

        const settings = loadSettings();
        const useKw = settings.powerUnit === 'kw';
        const unit = useKw ? 'kW' : 'W';

        const traces: PlotlyData[] = [];
        const sortedKeys = Object.keys(data.series ?? {}).sort();

        for (const key of sortedKeys) {
            const series = data.series![key];
            if (!series.timestamps || !series.values) continue;

            traces.push({
                x: series.timestamps.map(t => new Date(t)),
                y: series.values,
                type: 'scatter',
                mode: 'lines',
                name: key,
                line: { width: 1.5 },
                connectgaps: false,
                hovertemplate: `%{y:.1f} ${unit}<extra>${key}</extra>`,
            });
        }

        const layout = getDefaultLayout();
        layoutSetXRange(layout, start, end);
        layoutAddNowLine(layout, start, end);
        makePlot(elementId, traces, layout);
    } catch (error) {
        console.error('Error loading power data:', error);
        showError(elementId, 'Failed to load power data');
    }
}

async function loadPriceChart(elementId: string, start: Date, end: Date): Promise<void> {
    showLoading(elementId);

    const extendedEnd = new Date(end.getTime() + 2 * 24 * 60 * 60 * 1000);

    try {
        const data = await prices({
            start: formatDate(start),
            end: formatDate(extendedEnd),
        });

        if (!data.timeseries || data.timeseries.length === 0) {
            showError(elementId, 'No price data available');
            return;
        }

        const settings = loadSettings();
        const priceMultiplier = settings.priceUnit === 'cent' ? 100 : 1;
        const priceLabel = settings.priceUnit === 'cent' ? 'ct/kWh' : data.unit ?? '€/kWh';

        const timestamps = data.timeseries.map(d => new Date(d.time!));
        const marketPrices = data.timeseries.map(d => (d.market ?? 0) * priceMultiplier);
        const buyPrices = data.timeseries.map(d => (d.buy ?? 0) * priceMultiplier);
        const sellPrices = data.timeseries.map(d => (d.sell ?? 0) * priceMultiplier);

        const lastTime = timestamps[timestamps.length - 1];
        const extendedTime = new Date(lastTime.getTime() + (data.aggregate_minutes ?? 60) * 60 * 1000);
        timestamps.push(extendedTime);
        marketPrices.push(marketPrices[marketPrices.length - 1]);
        buyPrices.push(buyPrices[buyPrices.length - 1]);
        sellPrices.push(sellPrices[sellPrices.length - 1]);

        const traces: PlotlyData[] = [
            {
                name: 'Market',
                x: timestamps,
                y: marketPrices,
                type: 'scatter',
                mode: 'lines',
                line: { shape: 'hv', color: '#95a5a6', width: 1 },
                hovertemplate: `Market: %{y:.2f} ${priceLabel}<extra></extra>`,
            },
            {
                name: 'Buy',
                x: timestamps,
                y: buyPrices,
                type: 'scatter',
                mode: 'lines',
                line: { shape: 'hv', color: '#e74c3c', width: 1.5 },
                hovertemplate: `Buy: %{y:.2f} ${priceLabel}<extra></extra>`,
            },
            {
                name: 'Sell',
                x: timestamps,
                y: sellPrices,
                type: 'scatter',
                mode: 'lines',
                line: { shape: 'hv', color: '#2ecc71', width: 1.5 },
                hovertemplate: `Sell: %{y:.2f} ${priceLabel}<extra></extra>`,
            },
        ];

        const layout = getDefaultLayout();
        layoutSetXRange(layout, start, end);
        layoutAddNowLine(layout, start, end);
        layout.yaxis = layout.yaxis ?? {};
        layout.yaxis.title = { text: priceLabel };
        makePlot(elementId, traces, layout);
    } catch (error) {
        console.error('Error loading prices:', error);
        showError(elementId, 'Failed to load prices');
    }
}

async function loadSocChart(elementId: string, start: Date, end: Date): Promise<void> {
    showLoading(elementId);

    try {
        const data = await batteryGraph({
            start: formatDate(start),
            end: formatDate(end),
        });

        const multipleSystems = Object.keys(data).length > 1;
        const traces: PlotlyData[] = [];

        for (const [name, battery] of Object.entries(data)) {
            traces.push({
                ...makeTrace('SoC', timeseriesExtendToNow(battery.soc ?? { timestamps: [], values: [] })),
                ...(multipleSystems && {
                    legendgroup: name,
                    legendgrouptitle: { text: name },
                }),
                line: { color: '#3498db', width: 2 },
                hovertemplate: '%{y}%<extra>SoC</extra>',
            });
            traces.push({
                ...makeTrace('Scheduled', battery.schedule ?? { timestamps: [], values: [] }),
                ...(multipleSystems && {
                    legendgroup: name,
                    legendgrouptitle: { text: name },
                }),
                line: { color: '#2ecc71', width: 2, dash: 'dot' },
                hovertemplate: '%{y}%<extra>Scheduled</extra>',
            });
            traces.push({
                ...makeTrace('Voltage', battery.voltage ?? { timestamps: [], values: [] }),
                ...(multipleSystems && {
                    legendgroup: name,
                    legendgrouptitle: { text: name },
                }),
                line: { color: '#ff7171', width: 2 },
                hovertemplate: '%{y}V<extra>Voltage</extra>',
                yaxis: 'y2',
            });
        }

        const layout: PlotlyLayout = getDefaultLayout();
        layoutSetXRange(layout, start, end);
        layoutAddNowLine(layout, start, end);
        layout.yaxis = layout.yaxis ?? {};
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
        makePlot(elementId, traces, layout);
    } catch (error) {
        console.error('Error loading SoC data:', error);
        showError(elementId, 'Failed to load SoC data');
    }
}

async function loadAndCacheEnergyData(start: Date, end: Date, bucketMinutes: number): Promise<void> {
    try {
        cachedEnergyData = await energyGraph({
            start: formatDate(start),
            end: formatDate(end),
            bucket_minutes: bucketMinutes,
        });
    } catch (error) {
        console.error('Error fetching energy data:', error);
        cachedEnergyData = null;
    }
}

async function loadDashboard(): Promise<void> {
    const hours = parseInt((document.getElementById('range-select') as HTMLSelectElement).value);
    const aggregateMinutes = getAggregateMinutes(hours);
    const bucketMinutes = getBucketMinutes(hours);

    const range = getTimeRange(hours, rangeOffset);
    dashboardStart = range.start;
    dashboardEnd = range.end;

    updateRangeLabel();

    cachedEnergyData = null;
    cachedBucketMinutes = bucketMinutes;

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

function renderEnergyOnly(): void {
    if (dashboardStart && dashboardEnd && cachedEnergyData) {
        renderEnergyFlowChart('energy-chart', cachedEnergyData, dashboardStart, dashboardEnd, currentFoR);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const settings = loadSettings();
    applyTheme(settings.theme);

    const savedRange = loadPagePref('dashboard', 'range', '24');
    const savedFoR = loadPagePref('dashboard', 'for', 'multiplus');

    (document.getElementById('range-select') as HTMLSelectElement).value = savedRange;
    currentFoR = savedFoR;

    document.querySelectorAll<HTMLButtonElement>('#for-buttons .btn-toggle').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.value === savedFoR);
    });

    document.getElementById('range-select')!.addEventListener('change', (e) => {
        savePagePref('dashboard', 'range', (e.target as HTMLSelectElement).value);
        rangeOffset = 0;
        loadDashboard();
    });

    document.getElementById('range-prev')!.addEventListener('click', () => {
        rangeOffset++;
        loadDashboard();
    });

    document.getElementById('range-next')!.addEventListener('click', () => {
        if (rangeOffset > -1) {
            rangeOffset--;
            loadDashboard();
        }
    });

    document.querySelectorAll<HTMLButtonElement>('#for-buttons .btn-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#for-buttons .btn-toggle').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFoR = btn.dataset.value ?? 'multiplus';
            savePagePref('dashboard', 'for', currentFoR);
            renderEnergyOnly();
        });
    });

    loadDashboard();
});
