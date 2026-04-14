import { loadSettings } from './settings';
import type { TimeSeries } from './types';

// Plotly is loaded globally from vendor
declare const Plotly: {
    newPlot(elementId: string, traces: PlotlyData[], layout: PlotlyLayout, config?: PlotlyConfig): void;
};

//-----------------------------//
//  Types                      //
//-----------------------------//

export interface PlotlyLayout {
    margin?: { t?: number; r?: number; b?: number; l?: number };
    paper_bgcolor?: string;
    plot_bgcolor?: string;
    font?: PlotlyFont;
    hoverlabel?: { bgcolor?: string; bordercolor?: string; font?: PlotlyFont };
    xaxis?: PlotlyAxis;
    yaxis?: PlotlyAxis & { zeroline?: boolean; zerolinecolor?: string; side?: string; title?: { text: string } };
    yaxis2?: Record<string, unknown>;
    legend?: { orientation?: string; y?: number; font?: PlotlyFont };
    hovermode?: string;
    barmode?: string;
    bargap?: number;
    shapes?: PlotlyShape[];
}

export interface PlotlyAxis {
    gridcolor?: string;
    linecolor?: string;
    range?: [Date | number, Date | number];
    rangemode?: string;
    title?: string | { text: string };
}

export interface PlotlyFont {
    family?: string;
    color?: string;
}

export interface PlotlyData {
    name?: string;
    x?: (Date | string)[];
    y?: (number | null)[];
    type?: string;
    mode?: string;
    line?: { color?: string; width?: number; dash?: string; shape?: string };
    marker?: { color?: string; size?: number };
    connectgaps?: boolean;
    hovertemplate?: string;
    hoverinfo?: string;
    text?: string[];
    textposition?: string;
    legendgroup?: string;
    legendgrouptitle?: { text: string };
    yaxis?: string;
}

export interface PlotlyShape {
    type: string;
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    yref: string;
    line: { color: string; width: number; dash: string };
}

export interface PlotlyConfig {
    responsive?: boolean;
    displayModeBar?: boolean;
}

//-----------------------------//
//  Generic utility functions  //
//-----------------------------//

export function isDarkTheme(): boolean {
    const settings = loadSettings();
    return settings.theme === 'dark';
}

export function formatDate(date: Date): string {
    return date.toISOString();
}

export function formatEnergy(kwh: number | null): string {
    if (kwh == null) return '-';
    return kwh + ' kWh';
}

export function formatDateTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDuration(hours: number): string {
    if (hours < 1) {
        return Math.round(hours * 60) + ' min';
    } else if (hours < 24) {
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        return h + 'h ' + m + 'm';
    } else {
        const d = Math.floor(hours / 24);
        const h = Math.round(hours % 24);
        return d + 'd ' + h + 'h';
    }
}

export function insertGapNulls(
    timestamps: Date[],
    values: (number | null)[],
    gapThresholdMs: number
): { timestamps: Date[]; values: (number | null)[] } {
    if (timestamps.length === 0) return { timestamps: [], values: [] };

    const newTimestamps: Date[] = [timestamps[0]];
    const newValues: (number | null)[] = [values[0]];

    for (let i = 1; i < timestamps.length; i++) {
        const timeDiff = timestamps[i].getTime() - timestamps[i - 1].getTime();
        if (timeDiff > gapThresholdMs) {
            newTimestamps.push(new Date(timestamps[i - 1].getTime() + 1));
            newValues.push(null);
        }
        newTimestamps.push(timestamps[i]);
        newValues.push(values[i]);
    }

    return { timestamps: newTimestamps, values: newValues };
}

//----------------------------//
//  Plotly utility functions  //
//----------------------------//

export function timeseriesExtendToNow(timeseries: TimeSeries): TimeSeries {
    const timestamps = timeseries.timestamps ?? [];
    const values = timeseries.values ?? [];

    if (timestamps.length > 0 && values.length > 0) {
        const now = new Date();
        const lastTs = new Date(timestamps[timestamps.length - 1]);
        const lastValue = values[values.length - 1];
        if (now > lastTs) {
            return {
                timestamps: [...timestamps, now.toISOString()],
                values: [...values, lastValue],
            };
        }
    }
    return timeseries;
}

export function makeTrace(name: string, timeseries: TimeSeries): PlotlyData {
    return {
        name: name,
        x: (timeseries.timestamps ?? []).map(t => new Date(t)),
        y: timeseries.values ?? [],
        type: 'scatter',
        mode: 'lines',
    };
}

const defaultConfig: PlotlyConfig = {
    responsive: true,
    displayModeBar: false,
};

export function showLoading(elementId: string): void {
    const el = document.getElementById(elementId);
    if (el) el.innerHTML = '<div class="loading">Loading...</div>';
}

export function showError(elementId: string, message: string): void {
    const el = document.getElementById(elementId);
    if (el) el.innerHTML = `<div class="error">${message}</div>`;
}

export function makePlot(elementId: string, traces: PlotlyData[], layout: PlotlyLayout, config: PlotlyConfig = defaultConfig): void {
    const el = document.getElementById(elementId);
    if (el) {
        el.innerHTML = '';
        Plotly.newPlot(elementId, traces, layout, config);
    }
}

export function getDefaultLayout(): PlotlyLayout {
    const isDark = isDarkTheme();
    const font: PlotlyFont = {
        family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: isDark ? '#e4e4e4' : '#333333',
    };

    return {
        margin: { t: 30, r: 60, b: 50, l: 60 },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        font: font,
        hoverlabel: {
            bgcolor: isDark ? '#2a2a4a' : '#ffffff',
            bordercolor: isDark ? '#4a4a6a' : '#cccccc',
            font: font,
        },
        xaxis: {
            gridcolor: isDark ? '#2a2a4a' : '#eeeeee',
            linecolor: isDark ? '#3a3a5a' : '#dddddd',
        },
        yaxis: {
            gridcolor: isDark ? '#2a2a4a' : '#eeeeee',
            linecolor: isDark ? '#3a3a5a' : '#dddddd',
            zeroline: true,
            zerolinecolor: isDark ? '#4a4a6a' : '#cccccc',
        },
        legend: {
            orientation: 'h',
            y: -0.15,
            font: font,
        },
        hovermode: 'x unified',
        barmode: 'relative',
        bargap: 0.02,
    };
}

export function layoutSetXRange(layout: PlotlyLayout, start: Date, end: Date): void {
    if (layout.xaxis) {
        layout.xaxis.range = [start, end];
    }
}

export function layoutAddNowLine(layout: PlotlyLayout, start: Date, end: Date, color = '#e74c3c'): void {
    layout.shapes = getNowLineShape(start, end, null, color);
}

export function getNowLineShape(start: Date, end: Date, now: Date | null = null, color = '#e74c3c'): PlotlyShape[] {
    const nowTime = now ? now.getTime() : new Date().getTime();
    const startTime = start.getTime();
    const endTime = end.getTime();

    if (nowTime >= startTime && nowTime < endTime) {
        return [{
            type: 'line',
            x0: nowTime,
            y0: 0,
            x1: nowTime,
            y1: 1,
            yref: 'paper',
            line: { color: color, width: 2, dash: 'dash' },
        }];
    }
    return [];
}
