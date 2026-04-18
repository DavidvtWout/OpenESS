import { servicesStatus, ServicesStatusResponse, ServiceStatus, Status, SystemLayoutData, systemLayout, powerFlow, PowerFlowData, BatterySystemInfo } from './types';
import { loadSettings, applyTheme } from './settings';

// Power Flow Rendering
function formatPower(watts: number): string {
    const absWatts = Math.abs(watts);
    if (absWatts >= 1000) {
        return `${(watts / 1000).toFixed(2)} kW`;
    }
    return `${Math.round(watts)} W`;
}

function renderPowerFlowDiagram(container: HTMLElement, layout: SystemLayoutData): void {
    const batteryCount = layout.battery_systems.length;

    // Build the HTML structure
    let html = `
        <div class="power-flow-grid">
            <svg class="power-flow-lines" id="power-flow-svg"></svg>
            <div class="power-block grid-block" id="block-grid">
                <div class="block-arrows">
                    <svg class="arrow-icon arrow-green" viewBox="0 0 24 24" fill="currentColor" title="Exporting">
                        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                    </svg>
                    <svg class="arrow-icon arrow-red" viewBox="0 0 24 24" fill="currentColor" title="Importing">
                        <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                    </svg>
                </div>
                <div class="block-label">Grid</div>
                <div class="block-values" id="grid-values">
                    ${layout.phases.map(p => `<div class="phase-value" id="grid-L${p}">L${p}: -- W</div>`).join('')}
                </div>
                <div class="block-total" id="grid-total">-- W</div>
            </div>
    `;

    // Solar Block
    if (layout.has_solar) {
        html += `
            <div class="power-block solar-block" id="block-solar">
                <div class="block-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>
                    </svg>
                </div>
                <div class="block-label">Solar</div>
                <div class="block-total" id="solar-total">-- W</div>
            </div>
        `;
    }

    // Consumption Block
    html += `
        <div class="power-block consumption-block" id="block-consumption">
            <div class="block-arrows">
                <svg class="arrow-icon arrow-red" viewBox="0 0 24 24" fill="currentColor" title="Consuming">
                    <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                </svg>
            </div>
            <div class="block-label">Consumption</div>
            <div class="block-values" id="consumption-values">
                ${layout.phases.map(p => `<div class="phase-value" id="consumption-L${p}">L${p}: -- W</div>`).join('')}
            </div>
            <div class="block-total" id="consumption-total">-- W</div>
        </div>
    `;

    // Battery Systems
    html += `
            <div class="battery-row" id="battery-row" style="--battery-count: ${batteryCount}">
    `;

    for (const battery of layout.battery_systems) {
        html += `
            <div class="power-block battery-block" id="block-${battery.id}">
                <div class="block-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4zM11 20v-5.5H9L13 7v5.5h2L11 20z"/>
                    </svg>
                </div>
                <div class="block-label">${battery.name}</div>
                <div class="block-values">
                    <div class="phase-value" id="${battery.id}-charger-power">Charger:</div>
                    <div class="phase-value" id="${battery.id}-inverter-power">Inverter:</div>
                    <div class="phase-value" id="${battery.id}-battery-power">Battery:</div>
                    <div class="phase-value" id="${battery.id}-power-losses">Losses:</div>
                </div>
                <div class="battery-status" id="${battery.id}-status">--</div>
            </div>
        `;
    }

    html += `
            </div>

            <!-- Central Hub -->
            <div class="power-hub" id="power-hub"></div>
        </div>
    `;

    container.innerHTML = html;

    requestAnimationFrame(() => drawConnectingLines(layout));
}

function drawConnectingLines(layout: SystemLayoutData): void {
    const svg = document.getElementById('power-flow-svg');
    if (!svg) return;

    const container = svg.parentElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    svg.setAttribute('width', String(rect.width));
    svg.setAttribute('height', String(rect.height));
    svg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);

    let paths = '';

    const hub = document.getElementById('power-hub');
    if (!hub) return;

    const hubRect = hub.getBoundingClientRect();
    const hubCenterX = hubRect.left - rect.left + hubRect.width / 2;
    const hubCenterY = hubRect.top - rect.top + hubRect.height / 2;

    // Grid to hub
    const gridBlock = document.getElementById('block-grid');
    if (gridBlock) {
        const blockRect = gridBlock.getBoundingClientRect();
        const startX = blockRect.right - rect.left;
        const startY = blockRect.top - rect.top + blockRect.height / 2;
        paths += `<path class="flow-line" id="line-grid" d="M ${startX} ${startY} L ${hubCenterX} ${hubCenterY}" />`;
    }

    // Hub to consumption
    const consBlock = document.getElementById('block-consumption');
    if (consBlock) {
        const blockRect = consBlock.getBoundingClientRect();
        const endX = blockRect.left - rect.left;
        const endY = blockRect.top - rect.top + blockRect.height / 2;
        paths += `<path class="flow-line" id="line-consumption" d="M ${hubCenterX} ${hubCenterY} L ${endX} ${endY}" />`;
    }

    // Solar to hub (if present)
    if (layout.has_solar) {
        const solarBlock = document.getElementById('block-solar');
        if (solarBlock) {
            const blockRect = solarBlock.getBoundingClientRect();
            const startX = blockRect.left - rect.left + blockRect.width / 2;
            const startY = blockRect.bottom - rect.top;
            paths += `<path class="flow-line" id="line-solar" d="M ${startX} ${startY} L ${hubCenterX} ${hubCenterY}" />`;
        }
    }

    // Hub to each battery
    for (const battery of layout.battery_systems) {
        const batteryBlock = document.getElementById(`block-${battery.id}`);
        if (batteryBlock) {
            const blockRect = batteryBlock.getBoundingClientRect();
            const endX = blockRect.left - rect.left + blockRect.width / 2;
            const endY = blockRect.top - rect.top;
            paths += `<path class="flow-line" id="line-${battery.id}" d="M ${hubCenterX} ${hubCenterY} L ${endX} ${endY}" />`;
        }
    }

    svg.innerHTML = paths;
}

function updatePowerFlowData(layout: SystemLayoutData, data: PowerFlowData): void {
    // Update grid values
    let gridTotal = 0;
    for (const phase of layout.phases) {
        const value = data.grid[`L${phase}`] ?? 0;
        gridTotal += value;
        const el = document.getElementById(`grid-L${phase}`);
        if (el) el.textContent = `L${phase}: ${formatPower(value)}`;
    }
    const gridTotalEl = document.getElementById('grid-total');
    if (gridTotalEl) {
        gridTotalEl.textContent = formatPower(gridTotal);
        gridTotalEl.className = `block-total ${gridTotal > 0 ? 'importing' : gridTotal < 0 ? 'exporting' : ''}`;
    }

    // Update consumption values
    let consTotal = 0;
    for (const phase of layout.phases) {
        const value = data.consumption[`L${phase}`] ?? 0;
        consTotal += value;
        const el = document.getElementById(`consumption-L${phase}`);
        if (el) el.textContent = `L${phase}: ${formatPower(value)}`;
    }
    const consTotalEl = document.getElementById('consumption-total');
    if (consTotalEl) consTotalEl.textContent = formatPower(consTotal);

    // Update solar
    if (layout.has_solar && data.solar !== null) {
        const solarEl = document.getElementById('solar-total');
        if (solarEl) solarEl.textContent = formatPower(data.solar);
    }

    // Update batteries
    for (const battery of layout.battery_systems) {
        const chargerPwr = data.batteries[battery.id].charger ?? 0;
        const chargerEl = document.getElementById(`${battery.id}-charger-power`);
        if (chargerEl) chargerEl.textContent = `Charger: ${formatPower(chargerPwr)}`;

        const inverterPwr = data.batteries[battery.id].inverter ?? 0;
        const inverterEl = document.getElementById(`${battery.id}-inverter-power`);
        if (inverterEl) inverterEl.textContent = `Inverter: ${formatPower(inverterPwr)}`;

        const batteryPwr = data.batteries[battery.id].battery ?? 0;
        const batteryEl = document.getElementById(`${battery.id}-battery-power`);
        if (batteryEl) batteryEl.textContent = `Battery: ${formatPower(batteryPwr)}`;

        const lossesPwr = data.batteries[battery.id].losses ?? 0;
        const lossesEl = document.getElementById(`${battery.id}-power-losses`);
        if (lossesEl) lossesEl.textContent = `Losses: ${formatPower(lossesPwr)}`;

        const statusEl = document.getElementById(`${battery.id}-status`);

        if (statusEl) {
            statusEl.textContent = chargerPwr > 0 ? 'Charging' : inverterPwr > 100 ? 'Discharging' : 'Idle';
            statusEl.className = `battery-status ${chargerPwr > 0 ? 'charging' : inverterPwr > 100 ? 'discharging' : 'idle'}`;
        }
    }

    // Update line animations based on power flow direction
    updateFlowLines(layout, data);
}

function updateFlowLines(layout: SystemLayoutData, data: PowerFlowData): void {
    // Grid line
    const gridTotal = Object.values(data.grid).reduce((a, b) => a + b, 0);
    const gridLine = document.getElementById('line-grid');
    if (gridLine) {
        gridLine.classList.toggle('flow-importing', gridTotal > 50);
        gridLine.classList.toggle('flow-exporting', gridTotal < -50);
    }

    // Consumption line
    const consTotal = Object.values(data.consumption).reduce((a, b) => a + b, 0);
    const consLine = document.getElementById('line-consumption');
    if (consLine) {
        consLine.classList.toggle('flow-active', Math.abs(consTotal) > 50);
    }

    // Solar line
    if (layout.has_solar && data.solar !== null) {
        const solarLine = document.getElementById('line-solar');
        if (solarLine) {
            solarLine.classList.toggle('flow-generating', data.solar > 50);
        }
    }

    // Battery lines
    for (const battery of layout.battery_systems) {
        const power = data.batteries[battery.id] ?? 0;
        const line = document.getElementById(`line-${battery.id}`);
        if (line) {
            line.classList.toggle('flow-charging', power > 50);
            line.classList.toggle('flow-discharging', power < -50);
        }
    }
}

// Services Status (existing code)
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

// Main initialization
let currentLayout: SystemLayoutData | null = null;
let pollInterval: number | null = null;

async function loadPowerFlow(): Promise<void> {
    const container = document.getElementById('power-flow-container');
    if (!container) return;

    try {
        currentLayout = await systemLayout();
        renderPowerFlowDiagram(container, currentLayout);

        // Initial data load
        const data = await powerFlow();
        updatePowerFlowData(currentLayout, data);

        // Start polling for updates
        if (pollInterval) clearInterval(pollInterval);
        pollInterval = window.setInterval(async () => {
            if (!currentLayout) return;
            try {
                const newData = await powerFlow();
                updatePowerFlowData(currentLayout, newData);
            } catch (e) {
                console.error('Failed to update power flow:', e);
            }
        }, 1000);

        // Redraw lines on resize
        window.addEventListener('resize', () => {
            if (currentLayout) drawConnectingLines(currentLayout);
        });

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        container.innerHTML = `<div class="error">Failed to load power flow: ${message}</div>`;
    }
}

async function loadServicesStatus(): Promise<void> {
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
    const settings = loadSettings();
    applyTheme(settings.theme);

    loadPowerFlow();
    loadServicesStatus();
});
