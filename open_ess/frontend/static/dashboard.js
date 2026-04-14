document.addEventListener('DOMContentLoaded', () => {
    loadServicesStatus();
});

async function loadServicesStatus() {
    const container = document.getElementById('service-stats');

    try {
        const response = await fetch('/api/services-status');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        renderServicesStatus(container, data);
    } catch (error) {
        container.innerHTML = `<div class="error">Failed to load services status: ${error.message}</div>`;
    }
}

function renderServicesStatus(container, data) {
    const services = [
        { key: 'database', label: 'Database' },
        { key: 'optimizer', label: 'Optimizer' },
    ];

    container.innerHTML = services.map(service => {
        const status = data[service.key];
        if (!status) {
            return createServiceCard(service.label, 'unknown', []);
        }
        return createServiceCard(service.label, status.status, status.messages || []);
    }).join('');
}

function createServiceCard(label, status, messages) {
    const statusClass = getStatusClass(status);
    const statusIcon = getStatusIcon(status);
    const statusText = status.charAt(0).toUpperCase() + status.slice(1);

    let messagesHtml = '';
    if (messages.length > 0) {
        messagesHtml = `<div class="service-messages">
            ${messages.map(m => `<div class="service-message">${m.message}</div>`).join('')}
        </div>`;
    }

    return `
        <div class="stat-card service-card">
            <div class="service-status ${statusClass}">
                <span class="status-icon">${statusIcon}</span>
                <span class="status-text">${statusText}</span>
            </div>
            <div class="stat-label">${label}</div>
            ${messagesHtml}
        </div>
    `;
}

function getStatusClass(status) {
    switch (status) {
        case 'ok': return 'status-ok';
        case 'warning': return 'status-warning';
        case 'error': return 'status-error';
        default: return 'status-unknown';
    }
}

function getStatusIcon(status) {
    switch (status) {
        case 'ok': return '&#10003;';      // checkmark
        case 'warning': return '&#9888;';   // warning triangle
        case 'error': return '&#10007;';    // x mark
        default: return '?';
    }
}