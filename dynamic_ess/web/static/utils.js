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
