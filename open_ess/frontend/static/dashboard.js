// Dashboard - Power Flow and Services Status
(function() {
    'use strict';

    var currentLayout = null;
    var pollInterval = null;

    function formatPower(watts) {
        var absWatts = Math.abs(watts);
        if (absWatts >= 1000) {
            return (watts / 1000).toFixed(2) + ' kW';
        }
        return Math.round(watts) + ' W';
    }

    function renderPowerFlowDiagram(container, layout) {
        var batteryCount = layout.battery_systems.length;

        var html = '<div class="power-flow-grid">' +
            '<svg class="power-flow-lines" id="power-flow-svg"></svg>' +
            '<div class="power-block grid-block" id="block-grid">' +
                '<div class="block-arrows">' +
                    '<svg class="arrow-icon arrow-green" viewBox="0 0 24 24" fill="currentColor" title="Exporting">' +
                        '<path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>' +
                    '</svg>' +
                    '<svg class="arrow-icon arrow-red" viewBox="0 0 24 24" fill="currentColor" title="Importing">' +
                        '<path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>' +
                    '</svg>' +
                '</div>' +
                '<div class="block-label">Grid</div>' +
                '<div class="block-values" id="grid-values">' +
                    layout.phases.map(function(p) { return '<div class="phase-value" id="grid-L' + p + '">L' + p + ': -- W</div>'; }).join('') +
                '</div>' +
                '<div class="block-total" id="grid-total">-- W</div>' +
            '</div>';

        if (layout.has_solar) {
            html += '<div class="power-block solar-block" id="block-solar">' +
                '<div class="block-icon">' +
                    '<svg viewBox="0 0 24 24" fill="currentColor">' +
                        '<path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>' +
                    '</svg>' +
                '</div>' +
                '<div class="block-label">Solar</div>' +
                '<div class="block-total" id="solar-total">-- W</div>' +
            '</div>';
        }

        html += '<div class="power-block consumption-block" id="block-consumption">' +
            '<div class="block-arrows">' +
                '<svg class="arrow-icon arrow-red" viewBox="0 0 24 24" fill="currentColor" title="Consuming">' +
                    '<path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>' +
                '</svg>' +
            '</div>' +
            '<div class="block-label">Consumption</div>' +
            '<div class="block-values" id="consumption-values">' +
                layout.phases.map(function(p) { return '<div class="phase-value" id="consumption-L' + p + '">L' + p + ': -- W</div>'; }).join('') +
            '</div>' +
            '<div class="block-total" id="consumption-total">-- W</div>' +
        '</div>';

        html += '<div class="battery-row" id="battery-row" style="--battery-count: ' + batteryCount + '">';

        for (var i = 0; i < layout.battery_systems.length; i++) {
            var battery = layout.battery_systems[i];
            html += '<div class="power-block battery-block" id="block-' + battery.id + '">' +
                '<div class="block-icon">' +
                    '<svg viewBox="0 0 24 24" fill="currentColor">' +
                        '<path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4zM11 20v-5.5H9L13 7v5.5h2L11 20z"/>' +
                    '</svg>' +
                '</div>' +
                '<div class="block-label">' + battery.name + '</div>' +
                '<div class="block-values">' +
                    '<div class="phase-value" id="' + battery.id + '-charger-power">Charger:</div>' +
                    '<div class="phase-value" id="' + battery.id + '-inverter-power">Inverter:</div>' +
                    '<div class="phase-value" id="' + battery.id + '-battery-power">Battery:</div>' +
                    '<div class="phase-value" id="' + battery.id + '-power-losses">Losses:</div>' +
                '</div>' +
                '<div class="battery-status" id="' + battery.id + '-status">--</div>' +
            '</div>';
        }

        html += '</div><div class="power-hub" id="power-hub"></div></div>';

        container.innerHTML = html;
        requestAnimationFrame(function() { drawConnectingLines(layout); });
    }

    function drawConnectingLines(layout) {
        var svg = document.getElementById('power-flow-svg');
        if (!svg) return;

        var container = svg.parentElement;
        if (!container) return;

        var rect = container.getBoundingClientRect();
        svg.setAttribute('width', String(rect.width));
        svg.setAttribute('height', String(rect.height));
        svg.setAttribute('viewBox', '0 0 ' + rect.width + ' ' + rect.height);

        var paths = '';

        var hub = document.getElementById('power-hub');
        if (!hub) return;

        var hubRect = hub.getBoundingClientRect();
        var hubCenterX = hubRect.left - rect.left + hubRect.width / 2;
        var hubCenterY = hubRect.top - rect.top + hubRect.height / 2;

        var gridBlock = document.getElementById('block-grid');
        if (gridBlock) {
            var blockRect = gridBlock.getBoundingClientRect();
            var startX = blockRect.right - rect.left;
            var startY = blockRect.top - rect.top + blockRect.height / 2;
            paths += '<path class="flow-line" id="line-grid" d="M ' + startX + ' ' + startY + ' L ' + hubCenterX + ' ' + hubCenterY + '" />';
        }

        var consBlock = document.getElementById('block-consumption');
        if (consBlock) {
            var consRect = consBlock.getBoundingClientRect();
            var endX = consRect.left - rect.left;
            var endY = consRect.top - rect.top + consRect.height / 2;
            paths += '<path class="flow-line" id="line-consumption" d="M ' + hubCenterX + ' ' + hubCenterY + ' L ' + endX + ' ' + endY + '" />';
        }

        if (layout.has_solar) {
            var solarBlock = document.getElementById('block-solar');
            if (solarBlock) {
                var solarRect = solarBlock.getBoundingClientRect();
                var solarX = solarRect.left - rect.left + solarRect.width / 2;
                var solarY = solarRect.bottom - rect.top;
                paths += '<path class="flow-line" id="line-solar" d="M ' + solarX + ' ' + solarY + ' L ' + hubCenterX + ' ' + hubCenterY + '" />';
            }
        }

        for (var i = 0; i < layout.battery_systems.length; i++) {
            var battery = layout.battery_systems[i];
            var batteryBlock = document.getElementById('block-' + battery.id);
            if (batteryBlock) {
                var battRect = batteryBlock.getBoundingClientRect();
                var battX = battRect.left - rect.left + battRect.width / 2;
                var battY = battRect.top - rect.top;
                paths += '<path class="flow-line" id="line-' + battery.id + '" d="M ' + hubCenterX + ' ' + hubCenterY + ' L ' + battX + ' ' + battY + '" />';
            }
        }

        svg.innerHTML = paths;
    }

    function updatePowerFlowData(layout, data) {
        var gridTotal = 0;
        for (var i = 0; i < layout.phases.length; i++) {
            var phase = layout.phases[i];
            var value = data.grid['L' + phase] || 0;
            gridTotal += value;
            var el = document.getElementById('grid-L' + phase);
            if (el) el.textContent = 'L' + phase + ': ' + formatPower(value);
        }
        var gridTotalEl = document.getElementById('grid-total');
        if (gridTotalEl) {
            gridTotalEl.textContent = formatPower(gridTotal);
            gridTotalEl.className = 'block-total ' + (gridTotal > 0 ? 'importing' : gridTotal < 0 ? 'exporting' : '');
        }

        var consTotal = 0;
        for (var j = 0; j < layout.phases.length; j++) {
            var p = layout.phases[j];
            var v = data.consumption['L' + p] || 0;
            consTotal += v;
            var cel = document.getElementById('consumption-L' + p);
            if (cel) cel.textContent = 'L' + p + ': ' + formatPower(v);
        }
        var consTotalEl = document.getElementById('consumption-total');
        if (consTotalEl) consTotalEl.textContent = formatPower(consTotal);

        if (layout.has_solar && data.solar !== null) {
            var solarEl = document.getElementById('solar-total');
            if (solarEl) solarEl.textContent = formatPower(data.solar);
        }

        for (var k = 0; k < layout.battery_systems.length; k++) {
            var battery = layout.battery_systems[k];
            var battData = data.batteries[battery.id];
            var chargerPwr = battData.charger || 0;
            var inverterPwr = battData.inverter || 0;
            var batteryPwr = battData.battery || 0;
            var lossesPwr = battData.losses || 0;

            var chargerEl = document.getElementById(battery.id + '-charger-power');
            if (chargerEl) chargerEl.textContent = 'Charger: ' + formatPower(chargerPwr);

            var inverterEl = document.getElementById(battery.id + '-inverter-power');
            if (inverterEl) inverterEl.textContent = 'Inverter: ' + formatPower(inverterPwr);

            var batteryEl = document.getElementById(battery.id + '-battery-power');
            if (batteryEl) batteryEl.textContent = 'Battery: ' + formatPower(batteryPwr);

            var lossesEl = document.getElementById(battery.id + '-power-losses');
            if (lossesEl) lossesEl.textContent = 'Losses: ' + formatPower(lossesPwr);

            var statusEl = document.getElementById(battery.id + '-status');
            if (statusEl) {
                statusEl.textContent = chargerPwr > 0 ? 'Charging' : inverterPwr > 100 ? 'Discharging' : 'Idle';
                statusEl.className = 'battery-status ' + (chargerPwr > 0 ? 'charging' : inverterPwr > 100 ? 'discharging' : 'idle');
            }
        }

        updateFlowLines(layout, data);
    }

    function updateFlowLines(layout, data) {
        var gridTotal = Object.values(data.grid).reduce(function(a, b) { return a + b; }, 0);
        var gridLine = document.getElementById('line-grid');
        if (gridLine) {
            gridLine.classList.toggle('flow-importing', gridTotal > 50);
            gridLine.classList.toggle('flow-exporting', gridTotal < -50);
        }

        var consTotal = Object.values(data.consumption).reduce(function(a, b) { return a + b; }, 0);
        var consLine = document.getElementById('line-consumption');
        if (consLine) {
            consLine.classList.toggle('flow-active', Math.abs(consTotal) > 50);
        }

        if (layout.has_solar && data.solar !== null) {
            var solarLine = document.getElementById('line-solar');
            if (solarLine) {
                solarLine.classList.toggle('flow-generating', data.solar > 50);
            }
        }

        for (var i = 0; i < layout.battery_systems.length; i++) {
            var battery = layout.battery_systems[i];
            var power = data.batteries[battery.id] || 0;
            var line = document.getElementById('line-' + battery.id);
            if (line) {
                line.classList.toggle('flow-charging', power > 50);
                line.classList.toggle('flow-discharging', power < -50);
            }
        }
    }

    function renderServicesStatus(container, data) {
        var services = [
            { key: 'database', label: 'Database' },
            { key: 'optimizer', label: 'Optimizer' },
        ];

        container.innerHTML = services.map(function(service) {
            var status = data[service.key];
            if (!status) {
                return createServiceCard(service.label, 'unknown', []);
            }
            return createServiceCard(service.label, status.status || 'unknown', status.messages || []);
        }).join('');
    }

    function createServiceCard(label, status, messages) {
        var statusClass = getStatusClass(status);
        var statusIcon = getStatusIcon(status);
        var statusText = status.charAt(0).toUpperCase() + status.slice(1);

        var messagesHtml = '';
        if (messages.length > 0) {
            messagesHtml = '<div class="service-messages">' +
                messages.map(function(m) { return '<div class="service-message">' + m.message + '</div>'; }).join('') +
            '</div>';
        }

        return '<div class="stat-card service-card">' +
            '<div class="service-status ' + statusClass + '">' +
                '<span class="status-icon">' + statusIcon + '</span>' +
                '<span class="status-text">' + statusText + '</span>' +
            '</div>' +
            '<div class="stat-label">' + label + '</div>' +
            messagesHtml +
        '</div>';
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
            case 'ok': return '&#10003;';
            case 'warning': return '&#9888;';
            case 'error': return '&#10007;';
            default: return '?';
        }
    }

    async function loadPowerFlow() {
        var container = document.getElementById('power-flow-container');
        if (!container) return;

        try {
            currentLayout = await Api.systemLayout();
            renderPowerFlowDiagram(container, currentLayout);

            var data = await Api.powerFlow();
            updatePowerFlowData(currentLayout, data);

            if (pollInterval) clearInterval(pollInterval);
            pollInterval = window.setInterval(async function() {
                if (!currentLayout) return;
                try {
                    var newData = await Api.powerFlow();
                    updatePowerFlowData(currentLayout, newData);
                } catch (e) {
                    console.error('Failed to update power flow:', e);
                }
            }, 1000);

            window.addEventListener('resize', function() {
                if (currentLayout) drawConnectingLines(currentLayout);
            });

        } catch (error) {
            var message = error instanceof Error ? error.message : 'Unknown error';
            container.innerHTML = '<div class="error">Failed to load power flow: ' + message + '</div>';
        }
    }

    async function loadServicesStatus() {
        var container = document.getElementById('service-stats');
        if (!container) return;

        try {
            var data = await Api.servicesStatus();
            renderServicesStatus(container, data);
        } catch (error) {
            var message = error instanceof Error ? error.message : 'Unknown error';
            container.innerHTML = '<div class="error">Failed to load services status: ' + message + '</div>';
        }
    }

    document.addEventListener('DOMContentLoaded', function() {
        loadPowerFlow();
        loadServicesStatus();
    });
})();
