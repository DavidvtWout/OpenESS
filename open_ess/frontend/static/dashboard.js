"use strict";
(() => {
  // open_ess/frontend/src/types.ts
  async function servicesStatus() {
    const response = await fetch(`/api/services-status`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  }
  async function systemLayout() {
    const response = await fetch(`/api/system-layout`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  }
  async function powerFlow() {
    const response = await fetch(`/api/power-flow`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  }

  // open_ess/frontend/src/settings.ts
  var defaultSettings = {
    theme: "dark",
    priceUnit: "eur",
    powerUnit: "w",
    weekStartDay: 1
  };
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const val = parts.pop()?.split(";").shift();
      return val ?? null;
    }
    return null;
  }
  function setCookie(name, value) {
    const expires = /* @__PURE__ */ new Date();
    expires.setFullYear(expires.getFullYear() + 10);
    document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  }
  function loadSettings() {
    const settings = { ...defaultSettings };
    const theme = getCookie("theme");
    if (theme) settings.theme = theme;
    const priceUnit = getCookie("priceUnit");
    if (priceUnit) settings.priceUnit = priceUnit;
    const powerUnit = getCookie("powerUnit");
    if (powerUnit) settings.powerUnit = powerUnit;
    const weekStartDay = getCookie("weekStartDay");
    if (weekStartDay !== null) settings.weekStartDay = parseInt(weekStartDay, 10);
    return settings;
  }
  function saveSetting(name, value) {
    setCookie(name, value);
  }
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
  }
  function initSettings() {
    const settings = loadSettings();
    const themeSelect = document.getElementById("theme-select");
    themeSelect.value = settings.theme;
    themeSelect.addEventListener("change", function() {
      saveSetting("theme", this.value);
      applyTheme(this.value);
    });
    const priceUnitSelect = document.getElementById("price-unit-select");
    priceUnitSelect.value = settings.priceUnit;
    priceUnitSelect.addEventListener("change", function() {
      saveSetting("priceUnit", this.value);
    });
    const powerUnitSelect = document.getElementById("power-unit-select");
    powerUnitSelect.value = settings.powerUnit;
    powerUnitSelect.addEventListener("change", function() {
      saveSetting("powerUnit", this.value);
    });
    const weekStartSelect = document.getElementById("week-start-select");
    weekStartSelect.value = settings.weekStartDay;
    weekStartSelect.addEventListener("change", function() {
      saveSetting("weekStartDay", this.value);
    });
    applyTheme(settings.theme);
  }
  document.addEventListener("DOMContentLoaded", initSettings);
  if (document.readyState !== "loading") {
    initSettings();
  }

  // open_ess/frontend/src/dashboard.ts
  function formatPower(watts) {
    const absWatts = Math.abs(watts);
    if (absWatts >= 1e3) {
      return `${(watts / 1e3).toFixed(2)} kW`;
    }
    return `${Math.round(watts)} W`;
  }
  function renderPowerFlowDiagram(container, layout) {
    const batteryCount = layout.battery_systems.length;
    let html = `
        <div class="power-flow-grid">
            <svg class="power-flow-lines" id="power-flow-svg"></svg>
            <div class="power-block grid-block" id="block-grid">
                <div class="block-label">Grid</div>
                <div class="block-values" id="grid-values">
                    ${layout.phases.map((p) => `<div class="phase-value" id="grid-L${p}">L${p}: -- W</div>`).join("")}
                </div>
                <div class="block-total" id="grid-total">-- W</div>
            </div>
    `;
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
    html += `
            <div class="power-block consumption-block" id="block-consumption">
                <div class="block-label">Consumption</div>
                <div class="block-values" id="consumption-values">
                    ${layout.phases.map((p) => `<div class="phase-value" id="consumption-L${p}">L${p}: -- W</div>`).join("")}
                </div>
                <div class="block-total" id="consumption-total">-- W</div>
            </div>
    `;
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
                    <div class="block-total" id="${battery.id}-power">-- W</div>
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
  function drawConnectingLines(layout) {
    const svg = document.getElementById("power-flow-svg");
    if (!svg) return;
    const container = svg.parentElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    svg.setAttribute("width", String(rect.width));
    svg.setAttribute("height", String(rect.height));
    svg.setAttribute("viewBox", `0 0 ${rect.width} ${rect.height}`);
    let paths = "";
    const hub = document.getElementById("power-hub");
    if (!hub) return;
    const hubRect = hub.getBoundingClientRect();
    const hubCenterX = hubRect.left - rect.left + hubRect.width / 2;
    const hubCenterY = hubRect.top - rect.top + hubRect.height / 2;
    const gridBlock = document.getElementById("block-grid");
    if (gridBlock) {
      const blockRect = gridBlock.getBoundingClientRect();
      const startX = blockRect.right - rect.left;
      const startY = blockRect.top - rect.top + blockRect.height / 2;
      paths += `<path class="flow-line" id="line-grid" d="M ${startX} ${startY} L ${hubCenterX} ${hubCenterY}" />`;
    }
    const consBlock = document.getElementById("block-consumption");
    if (consBlock) {
      const blockRect = consBlock.getBoundingClientRect();
      const endX = blockRect.left - rect.left;
      const endY = blockRect.top - rect.top + blockRect.height / 2;
      paths += `<path class="flow-line" id="line-consumption" d="M ${hubCenterX} ${hubCenterY} L ${endX} ${endY}" />`;
    }
    if (layout.has_solar) {
      const solarBlock = document.getElementById("block-solar");
      if (solarBlock) {
        const blockRect = solarBlock.getBoundingClientRect();
        const startX = blockRect.left - rect.left + blockRect.width / 2;
        const startY = blockRect.bottom - rect.top;
        paths += `<path class="flow-line" id="line-solar" d="M ${startX} ${startY} L ${hubCenterX} ${hubCenterY}" />`;
      }
    }
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
  function updatePowerFlowData(layout, data) {
    let gridTotal = 0;
    for (const phase of layout.phases) {
      const value = data.grid[`L${phase}`] ?? 0;
      gridTotal += value;
      const el = document.getElementById(`grid-L${phase}`);
      if (el) el.textContent = `L${phase}: ${formatPower(value)}`;
    }
    const gridTotalEl = document.getElementById("grid-total");
    if (gridTotalEl) {
      gridTotalEl.textContent = formatPower(gridTotal);
      gridTotalEl.className = `block-total ${gridTotal > 0 ? "importing" : gridTotal < 0 ? "exporting" : ""}`;
    }
    let consTotal = 0;
    for (const phase of layout.phases) {
      const value = data.consumption[`L${phase}`] ?? 0;
      consTotal += value;
      const el = document.getElementById(`consumption-L${phase}`);
      if (el) el.textContent = `L${phase}: ${formatPower(value)}`;
    }
    const consTotalEl = document.getElementById("consumption-total");
    if (consTotalEl) consTotalEl.textContent = formatPower(consTotal);
    if (layout.has_solar && data.solar !== null) {
      const solarEl = document.getElementById("solar-total");
      if (solarEl) solarEl.textContent = formatPower(data.solar);
    }
    for (const battery of layout.battery_systems) {
      const power = data.batteries[battery.id] ?? 0;
      const powerEl = document.getElementById(`${battery.id}-power`);
      const statusEl = document.getElementById(`${battery.id}-status`);
      if (powerEl) {
        powerEl.textContent = formatPower(Math.abs(power));
        powerEl.className = `block-total ${power > 0 ? "charging" : power < 0 ? "discharging" : ""}`;
      }
      if (statusEl) {
        statusEl.textContent = power > 0 ? "Charging" : power < 0 ? "Discharging" : "Idle";
        statusEl.className = `battery-status ${power > 0 ? "charging" : power < 0 ? "discharging" : "idle"}`;
      }
    }
    updateFlowLines(layout, data);
  }
  function updateFlowLines(layout, data) {
    const gridTotal = Object.values(data.grid).reduce((a, b) => a + b, 0);
    const gridLine = document.getElementById("line-grid");
    if (gridLine) {
      gridLine.classList.toggle("flow-importing", gridTotal > 50);
      gridLine.classList.toggle("flow-exporting", gridTotal < -50);
    }
    const consTotal = Object.values(data.consumption).reduce((a, b) => a + b, 0);
    const consLine = document.getElementById("line-consumption");
    if (consLine) {
      consLine.classList.toggle("flow-active", Math.abs(consTotal) > 50);
    }
    if (layout.has_solar && data.solar !== null) {
      const solarLine = document.getElementById("line-solar");
      if (solarLine) {
        solarLine.classList.toggle("flow-generating", data.solar > 50);
      }
    }
    for (const battery of layout.battery_systems) {
      const power = data.batteries[battery.id] ?? 0;
      const line = document.getElementById(`line-${battery.id}`);
      if (line) {
        line.classList.toggle("flow-charging", power > 50);
        line.classList.toggle("flow-discharging", power < -50);
      }
    }
  }
  function renderServicesStatus(container, data) {
    const services = [
      { key: "database", label: "Database" },
      { key: "optimizer", label: "Optimizer" }
    ];
    container.innerHTML = services.map((service) => {
      const status = data[service.key];
      if (!status) {
        return createServiceCard(service.label, "unknown", []);
      }
      return createServiceCard(service.label, status.status ?? "unknown", status.messages ?? []);
    }).join("");
  }
  function createServiceCard(label, status, messages) {
    const statusClass = getStatusClass(status);
    const statusIcon = getStatusIcon(status);
    const statusText = status.charAt(0).toUpperCase() + status.slice(1);
    let messagesHtml = "";
    if (messages.length > 0) {
      messagesHtml = `<div class="service-messages">
            ${messages.map((m) => `<div class="service-message">${m.message}</div>`).join("")}
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
      case "ok":
        return "status-ok";
      case "warning":
        return "status-warning";
      case "error":
        return "status-error";
      default:
        return "status-unknown";
    }
  }
  function getStatusIcon(status) {
    switch (status) {
      case "ok":
        return "&#10003;";
      case "warning":
        return "&#9888;";
      case "error":
        return "&#10007;";
      default:
        return "?";
    }
  }
  var currentLayout = null;
  var pollInterval = null;
  async function loadPowerFlow() {
    const container = document.getElementById("power-flow-container");
    if (!container) return;
    try {
      currentLayout = await systemLayout();
      renderPowerFlowDiagram(container, currentLayout);
      const data = await powerFlow();
      updatePowerFlowData(currentLayout, data);
      if (pollInterval) clearInterval(pollInterval);
      pollInterval = window.setInterval(async () => {
        if (!currentLayout) return;
        try {
          const newData = await powerFlow();
          updatePowerFlowData(currentLayout, newData);
        } catch (e) {
          console.error("Failed to update power flow:", e);
        }
      }, 2e3);
      window.addEventListener("resize", () => {
        if (currentLayout) drawConnectingLines(currentLayout);
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      container.innerHTML = `<div class="error">Failed to load power flow: ${message}</div>`;
    }
  }
  async function loadServicesStatus() {
    const container = document.getElementById("service-stats");
    if (!container) return;
    try {
      const data = await servicesStatus();
      renderServicesStatus(container, data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      container.innerHTML = `<div class="error">Failed to load services status: ${message}</div>`;
    }
  }
  document.addEventListener("DOMContentLoaded", () => {
    const settings = loadSettings();
    applyTheme(settings.theme);
    loadPowerFlow();
    loadServicesStatus();
  });
})();
