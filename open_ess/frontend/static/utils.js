import { loadSettings } from './settings.js';

// Plotly is loaded globally from vendor
/** @type {{ newPlot(elementId: string, traces: PlotlyData[], layout: PlotlyLayout, config?: PlotlyConfig): void }} */
const Plotly = /** @type {any} */ (window).Plotly;

//-----------------------------//
//  Types                      //
//-----------------------------//

/**
 * @typedef {Object} PlotlyLayout
 * @property {{ t?: number; r?: number; b?: number; l?: number }} [margin]
 * @property {string} [paper_bgcolor]
 * @property {string} [plot_bgcolor]
 * @property {PlotlyFont} [font]
 * @property {{ bgcolor?: string; bordercolor?: string; font?: PlotlyFont }} [hoverlabel]
 * @property {PlotlyAxis} [xaxis]
 * @property {PlotlyAxis & { zeroline?: boolean; zerolinecolor?: string; side?: string; title?: { text: string }; range?: [number, number] }} [yaxis]
 * @property {Object.<string, unknown>} [yaxis2]
 * @property {{ orientation?: string; y?: number; font?: PlotlyFont }} [legend]
 * @property {string} [hovermode]
 * @property {string} [barmode]
 * @property {number} [bargap]
 * @property {PlotlyShape[]} [shapes]
 */

/**
 * @typedef {Object} PlotlyAxis
 * @property {string} [gridcolor]
 * @property {string} [linecolor]
 * @property {[Date | number, Date | number]} [range]
 * @property {string} [rangemode]
 * @property {string | { text: string }} [title]
 */

/**
 * @typedef {Object} PlotlyFont
 * @property {string} [family]
 * @property {string} [color]
 */

/**
 * @typedef {Object} PlotlyData
 * @property {string} [name]
 * @property {(Date | string)[]} [x]
 * @property {(number | null)[]} [y]
 * @property {string} [type]
 * @property {string} [mode]
 * @property {{ color?: string; width?: number; dash?: string; shape?: string }} [line]
 * @property {{ color?: string; size?: number }} [marker]
 * @property {boolean} [connectgaps]
 * @property {string} [hovertemplate]
 * @property {string} [hoverinfo]
 * @property {string[]} [text]
 * @property {string} [textposition]
 * @property {string} [legendgroup]
 * @property {{ text: string }} [legendgrouptitle]
 * @property {string} [yaxis]
 */

/**
 * @typedef {Object} PlotlyShape
 * @property {string} type
 * @property {number} x0
 * @property {number} y0
 * @property {number} x1
 * @property {number} y1
 * @property {string} yref
 * @property {{ color: string; width: number; dash: string }} line
 */

/**
 * @typedef {Object} PlotlyConfig
 * @property {boolean} [responsive]
 * @property {boolean} [displayModeBar]
 */

/**
 * @typedef {Object} TimeSeries
 * @property {string[]} [timestamps]
 * @property {number[]} [values]
 */

//-----------------------------//
//  Generic utility functions  //
//-----------------------------//

/**
 * @returns {boolean}
 */
export function isDarkTheme() {
    const settings = loadSettings();
    return settings.theme === 'dark';
}

/**
 * @param {Date} date
 * @returns {string}
 */
export function formatDate(date) {
    return date.toISOString();
}

/**
 * @param {number | null} kwh
 * @returns {string}
 */
export function formatEnergy(kwh) {
    if (kwh == null) return '-';
    return kwh + ' kWh';
}

/**
 * @param {string} isoString
 * @returns {string}
 */
export function formatDateTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * @param {number} hours
 * @returns {string}
 */
export function formatDuration(hours) {
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

/**
 * @param {Date[]} timestamps
 * @param {(number | null)[]} values
 * @param {number} gapThresholdMs
 * @returns {{ timestamps: Date[]; values: (number | null)[] }}
 */
export function insertGapNulls(timestamps, values, gapThresholdMs) {
    if (timestamps.length === 0) return { timestamps: [], values: [] };

    /** @type {Date[]} */
    const newTimestamps = [timestamps[0]];
    /** @type {(number | null)[]} */
    const newValues = [values[0]];

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

/**
 * @param {TimeSeries} timeseries
 * @returns {TimeSeries}
 */
export function timeseriesExtendToNow(timeseries) {
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

/**
 * @param {string} name
 * @param {TimeSeries} timeseries
 * @returns {PlotlyData}
 */
export function makeTrace(name, timeseries) {
    return {
        name: name,
        x: (timeseries.timestamps ?? []).map(t => new Date(t)),
        y: timeseries.values ?? [],
        type: 'scatter',
        mode: 'lines',
    };
}

/** @type {PlotlyConfig} */
const defaultConfig = {
    responsive: true,
    displayModeBar: false,
};

/**
 * @param {string} elementId
 */
export function showLoading(elementId) {
    const el = document.getElementById(elementId);
    if (el) el.innerHTML = '<div class="loading">Loading...</div>';
}

/**
 * @param {string} elementId
 * @param {string} message
 */
export function showError(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) el.innerHTML = `<div class="error">${message}</div>`;
}

/**
 * @param {string} elementId
 * @param {PlotlyData[]} traces
 * @param {PlotlyLayout} layout
 * @param {PlotlyConfig} [config]
 */
export function makePlot(elementId, traces, layout, config = defaultConfig) {
    const el = document.getElementById(elementId);
    if (el) {
        el.innerHTML = '';
        Plotly.newPlot(elementId, traces, layout, config);
    }
}

/**
 * @returns {PlotlyLayout}
 */
export function getDefaultLayout() {
    const isDark = isDarkTheme();
    /** @type {PlotlyFont} */
    const font = {
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

/**
 * @param {PlotlyLayout} layout
 * @param {Date} start
 * @param {Date} end
 */
export function layoutSetXRange(layout, start, end) {
    if (layout.xaxis) {
        layout.xaxis.range = [start, end];
    }
}

/**
 * @param {PlotlyLayout} layout
 * @param {Date} start
 * @param {Date} end
 * @param {string} [color]
 */
export function layoutAddNowLine(layout, start, end, color = '#e74c3c') {
    layout.shapes = getNowLineShape(start, end, null, color);
}

/**
 * @param {Date} start
 * @param {Date} end
 * @param {Date | null} [now]
 * @param {string} [color]
 * @returns {PlotlyShape[]}
 */
export function getNowLineShape(start, end, now = null, color = '#e74c3c') {
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
