//-----------------------------//
//  Generic utility functions  //
//-----------------------------//

function isDarkTheme() {
    const settings = loadSettings();
    return settings.theme === 'dark';
}

function formatDate(date) {
    return date.toISOString();
}

function formatEnergy(kwh) {
    return kwh + ' kWh';
}

function formatDateTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
}

function formatDuration(hours) {
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

// Helper to insert nulls in time series data where gaps exceed threshold
// Returns { times: [], values: [] } with nulls inserted at gap positions
function insertGapNulls(timestamps, values, gapThresholdMs) {
    if (timestamps.length === 0) return { timestamps: [], values: [] };

    const newTimestamps = [timestamps[0]];
    const newValues = [values[0]];

    for (let i = 1; i < timestamps.length; i++) {
        const timeDiff = timestamps[i].getTime() - timestamps[i - 1].getTime();
        if (timeDiff > gapThresholdMs) {
            // Insert a null point to break the line
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

function makeTrace(name, timeseries) {
  return {
    name: name,
    x: timeseries.timestamps.map(t => new Date(t)),
    y: timeseries.values,
    type: 'scatter',
    mode: 'lines',
  }
}


const defaultConfig = {
    responsive: true,
    displayModeBar: false,
};

function showLoading(elementId) {
    document.getElementById(elementId).innerHTML = '<div class="loading">Loading...</div>';
}

function showError(elementId, message) {
    document.getElementById(elementId).innerHTML = `<div class="error">${message}</div>`;
}

function makePlot(elementId, traces, layout, config = defaultConfig) {
    document.getElementById(elementId).innerHTML = '';  // Remove 'Loading...'

    Plotly.newPlot(elementId, traces, layout, config);
}

// TODO: use colours from style.css
function getDefaultLayout() {
    const isDark = isDarkTheme();
    const font = {
       family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
       color: isDark ? '#e4e4e4' : '#333333',
    }

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
        // Only relevant for bar charts
        barmode: 'relative',
        bargap: 0.02,
    };
}

function layoutSetXRange(layout, start, end) {
    layout.xaxis.range = [start, end];
}

function layoutAddNowLine(layout, now, start, end, color = '#e74c3c') {
    layout.shapes = getNowLineShape(now, start, end);
}

function getNowLineShape(start, end, now = null, color = '#e74c3c') {
    if (now == null) {
        now = new Date().getTime();
    }

    if (now >= start && now < end) {
        return [{
            type: 'line',
            x0: now, y0: 0,
            x1: now, y1: 1,
            yref: 'paper',
            line: { color: color, width: 2, dash: 'dash' },
        }];
    }
    return [];
}

//-----------------//
//  API endpoints  //
//-----------------//

function getEnergyGraphUrl(start, end, bucketMinutes) {
    return `/api/energy-graph?start=${formatDate(start)}&end=${formatDate(end)}&bucket_minutes=${bucketMinutes}`;
}

function getPowerGraphUrl(start, end, aggregateMinutes) {
    return `/api/power-graph?start=${formatDate(start)}&end=${formatDate(end)}&aggregate_minutes=${aggregateMinutes}`;
}

function getBatteryGraphUrl(start, end) {
    return `/api/battery-graph?start=${formatDate(start)}&end=${formatDate(end)}`;
}
