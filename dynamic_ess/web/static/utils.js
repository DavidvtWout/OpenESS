// Generic utility functions

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


// Shared chart utilities for Plotly charts

const defaultConfig = {
    responsive: true,
    displayModeBar: false,
};

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
        hoverlabel: {
            bgcolor: isDark ? '#2a2a4a' : '#ffffff',
            bordercolor: isDark ? '#4a4a6a' : '#cccccc',
            font: {
                family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                color: isDark ? '#e4e4e4' : '#333333',
            },
        },
        xaxis: {
            gridcolor: isDark ? '#2a2a4a' : '#eeeeee',
            linecolor: isDark ? '#3a3a5a' : '#dddddd',
            // type: 'date',
        },
        yaxis: {
            gridcolor: isDark ? '#2a2a4a' : '#eeeeee',
            linecolor: isDark ? '#3a3a5a' : '#dddddd',
        },
    };
}

// Get "now" line shape for charts (vertical dashed line at current time)
function getNowLineShape(now, start, end, color = '#e74c3c') {
    if (now >= start && now <= end) {
        return [{
            type: 'line',
            x0: now,
            x1: now,
            y0: 0,
            y1: 1,
            yref: 'paper',
            line: { color: color, width: 2, dash: 'dash' },
        }];
    }
    return [];
}

// Get standard horizontal legend config
function getHorizontalLegend(yOffset = -0.15) {
    const settings = loadSettings();
    const isDark = settings.theme === 'dark';
    return {
        orientation: 'h',
        y: yOffset,
        font: { color: isDark ? '#e4e4e4' : '#333333' },
    };
}

// Check if dark theme is active
function isDarkTheme() {
    const settings = loadSettings();
    return settings.theme === 'dark';
}

// Get zeroline color based on theme
function getZerolineColor() {
    return isDarkTheme() ? '#4a4a6a' : '#cccccc';
}
