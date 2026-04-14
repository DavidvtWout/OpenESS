import { servicesStatus, ServicesStatusResponse, ServiceStatus, Status } from './types';
import { loadSettings, applyTheme } from './settings';


interface ServiceDefinition {
    key: keyof ServicesStatusResponse;
    label: string;
}

function renderServicesStatus(container: HTMLElement, data: ServicesStatusResponse): void {
    const services: ServiceDefinition[] = [
        { key: 'database', label: 'Database' },
        { key: 'optimizer', label: 'Optimizer' },
    ];

    container.innerHTML = services.map(service => {
        const status = data[service.key];
        if (!status) {
            return createServiceCard(service.label, 'unknown', []);
        }
        return createServiceCard(service.label, status.status ?? 'unknown', status.messages ?? []);
    }).join('');
}

function createServiceCard(label: string, status: Status | 'unknown', messages: NonNullable<ServiceStatus['messages']>): string {
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

function getStatusClass(status: Status | 'unknown'): string {
    switch (status) {
        case 'ok': return 'status-ok';
        case 'warning': return 'status-warning';
        case 'error': return 'status-error';
        default: return 'status-unknown';
    }
}

function getStatusIcon(status: Status | 'unknown'): string {
    switch (status) {
        case 'ok': return '&#10003;';
        case 'warning': return '&#9888;';
        case 'error': return '&#10007;';
        default: return '?';
    }
}

async function loadServicesStatus(): Promise<void> {
    const settings = loadSettings();
    applyTheme(settings.theme);

    const container = document.getElementById('service-stats');
    if (!container) return;

    try {
        const data = await servicesStatus();
        renderServicesStatus(container, data);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        container.innerHTML = `<div class="error">Failed to load services status: ${message}</div>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadServicesStatus();
});
