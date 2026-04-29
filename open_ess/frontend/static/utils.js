// Utility functions for charts and formatting
(function() {
    'use strict';

    function isDarkTheme() {
        var settings = Settings.load();
        return settings.theme === 'dark';
    }

    function formatDate(date) {
        return date.toISOString();
    }

    function formatEnergy(kwh) {
        if (kwh == null) return '-';
        return kwh + ' kWh';
    }

    function formatDateTime(isoString) {
        var date = new Date(isoString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function formatDuration(hours) {
        if (hours < 1) {
            return Math.round(hours * 60) + ' min';
        } else if (hours < 24) {
            var h = Math.floor(hours);
            var m = Math.round((hours - h) * 60);
            return h + 'h ' + m + 'm';
        } else {
            var d = Math.floor(hours / 24);
            var hr = Math.round(hours % 24);
            return d + 'd ' + hr + 'h';
        }
    }

    function timeseriesExtendToNow(timeseries) {
        var timestamps = timeseries.timestamps || [];
        var values = timeseries.values || [];

        if (timestamps.length > 0 && values.length > 0) {
            var now = new Date();
            var lastTs = new Date(timestamps[timestamps.length - 1]);
            var lastValue = values[values.length - 1];
            if (now > lastTs) {
                return {
                    timestamps: timestamps.concat([now.toISOString()]),
                    values: values.concat([lastValue]),
                };
            }
        }
        return timeseries;
    }

    function makeTrace(name, timeseries) {
        return {
            name: name,
            x: (timeseries.timestamps || []).map(function(t) { return new Date(t); }),
            y: timeseries.values || [],
            type: 'scatter',
            mode: 'lines',
        };
    }

    function showLoading(elementId) {
        var el = document.getElementById(elementId);
        if (el) el.innerHTML = '<div class="loading">Loading...</div>';
    }

    function showError(elementId, message) {
        var el = document.getElementById(elementId);
        if (el) el.innerHTML = '<div class="error">' + message + '</div>';
    }

    function makePlot(elementId, traces, layout, config) {
        var el = document.getElementById(elementId);
        if (el) {
            el.innerHTML = '';
            Plotly.newPlot(elementId, traces, layout, config || { responsive: true, displayModeBar: false });
        }
    }

    function getDefaultLayout() {
        var isDark = isDarkTheme();
        var font = {
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

    function layoutSetXRange(layout, start, end) {
        if (layout.xaxis) {
            layout.xaxis.range = [start, end];
        }
    }

    function layoutAddNowLine(layout, start, end, color) {
        layout.shapes = getNowLineShape(start, end, null, color || '#e74c3c');
    }

    function getNowLineShape(start, end, now, color) {
        var nowTime = now ? now.getTime() : new Date().getTime();
        var startTime = start.getTime();
        var endTime = end.getTime();

        if (nowTime >= startTime && nowTime < endTime) {
            return [{
                type: 'line',
                x0: nowTime,
                y0: 0,
                x1: nowTime,
                y1: 1,
                yref: 'paper',
                line: { color: color || '#e74c3c', width: 2, dash: 'dash' },
            }];
        }
        return [];
    }

    // Export to global
    window.Utils = {
        isDarkTheme: isDarkTheme,
        formatDate: formatDate,
        formatEnergy: formatEnergy,
        formatDateTime: formatDateTime,
        formatDuration: formatDuration,
        timeseriesExtendToNow: timeseriesExtendToNow,
        makeTrace: makeTrace,
        showLoading: showLoading,
        showError: showError,
        makePlot: makePlot,
        getDefaultLayout: getDefaultLayout,
        layoutSetXRange: layoutSetXRange,
        layoutAddNowLine: layoutAddNowLine,
        getNowLineShape: getNowLineShape
    };
})();
