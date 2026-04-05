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
function insertGapNulls(times, values, gapThresholdMs) {
    if (times.length === 0) return { times: [], values: [] };

    const newTimes = [times[0]];
    const newValues = [values[0]];

    for (let i = 1; i < times.length; i++) {
        const timeDiff = times[i].getTime() - times[i - 1].getTime();
        if (timeDiff > gapThresholdMs) {
            // Insert a null point to break the line
            newTimes.push(new Date(times[i - 1].getTime() + 1));
            newValues.push(null);
        }
        newTimes.push(times[i]);
        newValues.push(values[i]);
    }

    return { times: newTimes, values: newValues };
}
