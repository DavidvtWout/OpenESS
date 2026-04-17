"use strict";
(() => {
  // open_ess/frontend/src/types.ts
  async function energyGraph(params) {
    const searchParams = new URLSearchParams();
    if (params.battery_id !== void 0) searchParams.set("battery_id", String(params.battery_id));
    if (params.start !== void 0) searchParams.set("start", String(params.start));
    if (params.end !== void 0) searchParams.set("end", String(params.end));
    if (params.bucket_minutes !== void 0) searchParams.set("bucket_minutes", String(params.bucket_minutes));
    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
    const response = await fetch(`/api/energy-graph${query}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  }
  async function powerGraph(params) {
    const searchParams = new URLSearchParams();
    if (params.battery_id !== void 0) searchParams.set("battery_id", String(params.battery_id));
    if (params.start !== void 0) searchParams.set("start", String(params.start));
    if (params.end !== void 0) searchParams.set("end", String(params.end));
    if (params.aggregate_minutes !== void 0) searchParams.set("aggregate_minutes", String(params.aggregate_minutes));
    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
    const response = await fetch(`/api/power-graph${query}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  }
  async function prices(params) {
    const searchParams = new URLSearchParams();
    if (params.area !== void 0) searchParams.set("area", String(params.area));
    if (params.start !== void 0) searchParams.set("start", String(params.start));
    if (params.end !== void 0) searchParams.set("end", String(params.end));
    if (params.aggregate_minutes !== void 0) searchParams.set("aggregate_minutes", String(params.aggregate_minutes));
    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
    const response = await fetch(`/api/prices${query}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  }
  async function batteryGraph(params) {
    const searchParams = new URLSearchParams();
    if (params.battery_id !== void 0) searchParams.set("battery_id", String(params.battery_id));
    if (params.start !== void 0) searchParams.set("start", String(params.start));
    if (params.end !== void 0) searchParams.set("end", String(params.end));
    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
    const response = await fetch(`/api/battery-graph${query}`);
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
  function savePagePref(page, key, value) {
    setCookie(`${page}_${key}`, value);
  }
  function loadPagePref(page, key, defaultValue) {
    const value = getCookie(`${page}_${key}`);
    return value !== null ? value : defaultValue;
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

  // open_ess/frontend/src/utils.ts
  function isDarkTheme() {
    const settings = loadSettings();
    return settings.theme === "dark";
  }
  function formatDate(date) {
    return date.toISOString();
  }
  function timeseriesExtendToNow(timeseries) {
    const timestamps = timeseries.timestamps ?? [];
    const values = timeseries.values ?? [];
    if (timestamps.length > 0 && values.length > 0) {
      const now = /* @__PURE__ */ new Date();
      const lastTs = new Date(timestamps[timestamps.length - 1]);
      const lastValue = values[values.length - 1];
      if (now > lastTs) {
        return {
          timestamps: [...timestamps, now.toISOString()],
          values: [...values, lastValue]
        };
      }
    }
    return timeseries;
  }
  function makeTrace(name, timeseries) {
    return {
      name,
      x: (timeseries.timestamps ?? []).map((t) => new Date(t)),
      y: timeseries.values ?? [],
      type: "scatter",
      mode: "lines"
    };
  }
  var defaultConfig = {
    responsive: true,
    displayModeBar: false
  };
  function showLoading(elementId) {
    const el = document.getElementById(elementId);
    if (el) el.innerHTML = '<div class="loading">Loading...</div>';
  }
  function showError(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) el.innerHTML = `<div class="error">${message}</div>`;
  }
  function makePlot(elementId, traces, layout, config = defaultConfig) {
    const el = document.getElementById(elementId);
    if (el) {
      el.innerHTML = "";
      Plotly.newPlot(elementId, traces, layout, config);
    }
  }
  function getDefaultLayout() {
    const isDark = isDarkTheme();
    const font = {
      family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: isDark ? "#e4e4e4" : "#333333"
    };
    return {
      margin: { t: 30, r: 60, b: 50, l: 60 },
      paper_bgcolor: "transparent",
      plot_bgcolor: "transparent",
      font,
      hoverlabel: {
        bgcolor: isDark ? "#2a2a4a" : "#ffffff",
        bordercolor: isDark ? "#4a4a6a" : "#cccccc",
        font
      },
      xaxis: {
        gridcolor: isDark ? "#2a2a4a" : "#eeeeee",
        linecolor: isDark ? "#3a3a5a" : "#dddddd"
      },
      yaxis: {
        gridcolor: isDark ? "#2a2a4a" : "#eeeeee",
        linecolor: isDark ? "#3a3a5a" : "#dddddd",
        zeroline: true,
        zerolinecolor: isDark ? "#4a4a6a" : "#cccccc"
      },
      legend: {
        orientation: "h",
        y: -0.15,
        font
      },
      hovermode: "x unified",
      barmode: "relative",
      bargap: 0.02
    };
  }
  function layoutSetXRange(layout, start, end) {
    if (layout.xaxis) {
      layout.xaxis.range = [start, end];
    }
  }
  function layoutAddNowLine(layout, start, end, color = "#e74c3c") {
    layout.shapes = getNowLineShape(start, end, null, color);
  }
  function getNowLineShape(start, end, now = null, color = "#e74c3c") {
    const nowTime = now ? now.getTime() : (/* @__PURE__ */ new Date()).getTime();
    const startTime = start.getTime();
    const endTime = end.getTime();
    if (nowTime >= startTime && nowTime < endTime) {
      return [{
        type: "line",
        x0: nowTime,
        y0: 0,
        x1: nowTime,
        y1: 1,
        yref: "paper",
        line: { color, width: 2, dash: "dash" }
      }];
    }
    return [];
  }

  // open_ess/frontend/src/metrics.ts
  var dashboardStart = null;
  var dashboardEnd = null;
  var currentFoR = "multiplus";
  var cachedEnergyData = null;
  var cachedBucketMinutes = 60;
  var rangeOffset = 0;
  var isRelayoutInProgress = false;
  var chartIds = ["soc-chart", "power-chart", "energy-chart", "prices-chart"];
  function getAggregateMinutes(hours) {
    if (hours <= 48) return 1;
    if (hours <= 168) return 5;
    return 15;
  }
  function getBucketMinutes(hours) {
    if (hours <= 48) return 60;
    if (hours <= 168) return 120;
    if (hours <= 768) return 360;
    return 1440;
  }
  function getTimeRange(hours, offset = 0) {
    const end = /* @__PURE__ */ new Date();
    end.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() + 1 - offset);
    const start = new Date(end);
    start.setDate(start.getDate() - hours / 24);
    return { start, end };
  }
  function updateRangeLabel() {
    const hours = parseInt(document.getElementById("range-select").value);
    const labelEl = document.getElementById("range-label");
    const nextBtn = document.getElementById("range-next");
    nextBtn.disabled = rangeOffset <= -1;
    if (dashboardStart && dashboardEnd && labelEl) {
      const opts = { month: "short", day: "numeric" };
      const startStr = dashboardStart.toLocaleDateString(void 0, opts);
      const endStr = dashboardEnd.toLocaleDateString(void 0, opts);
      if (startStr === endStr || hours === 24) {
        labelEl.textContent = startStr;
      } else {
        labelEl.textContent = `${startStr} - ${endStr}`;
      }
    }
  }
  function setupZoomSync() {
    chartIds.forEach((chartId) => {
      const chartEl = document.getElementById(chartId);
      if (!chartEl || !chartEl.on) return;
      chartEl.on("plotly_relayout", (eventData) => {
        if (isRelayoutInProgress) return;
        const xRange = eventData["xaxis.range[0]"] !== void 0 ? [eventData["xaxis.range[0]"], eventData["xaxis.range[1]"]] : eventData["xaxis.range"];
        if (!xRange) return;
        isRelayoutInProgress = true;
        chartIds.forEach((otherId) => {
          if (otherId !== chartId) {
            const otherEl = document.getElementById(otherId);
            if (otherEl && otherEl.data) {
              Plotly.relayout(otherEl, {
                "xaxis.range[0]": xRange[0],
                "xaxis.range[1]": xRange[1]
              });
            }
          }
        });
        setTimeout(() => {
          isRelayoutInProgress = false;
        }, 100);
      });
    });
  }
  function renderGridEnergyChart(elementId, data, start, end) {
    const settings = loadSettings();
    const useKw = settings.powerUnit === "kw";
    const toDisplay = useKw ? (wh) => wh ? wh / 1e3 : 0 : (wh) => wh ?? 0;
    const timestamps = (data.timestamps ?? []).map((t) => new Date(t));
    const traces = [
      {
        x: timestamps,
        y: (data.grid_export?.["From MP"] ?? []).map((v) => toDisplay(v)),
        type: "bar",
        name: "From MP",
        marker: { color: "#278e60" },
        textposition: "none"
      },
      {
        x: timestamps,
        y: (data.grid_import?.["Consumption"] ?? []).map((v) => -toDisplay(v)),
        type: "bar",
        name: "Consumption",
        marker: { color: "#3498db" },
        textposition: "none"
      },
      {
        x: timestamps,
        y: (data.grid_import?.["To MP"] ?? []).map((v) => -toDisplay(v)),
        type: "bar",
        name: "To MP",
        marker: { color: "#3498ab" },
        textposition: "none"
      }
    ];
    const layout = getDefaultLayout();
    layoutSetXRange(layout, start, end);
    layoutAddNowLine(layout, start, end);
    makePlot(elementId, traces, layout);
  }
  function renderBatteryEnergyChart(elementId, data, start, end) {
    const settings = loadSettings();
    const useKw = settings.powerUnit === "kw";
    const toDisplay = useKw ? (wh) => wh ? wh / 1e3 : 0 : (wh) => wh ?? 0;
    const timestamps = (data.timestamps ?? []).map((t) => new Date(t));
    const mpData = data.battery_systems?.["MultiPlus"];
    const traces = [
      {
        x: timestamps,
        y: (mpData?.energy_from_inverter ?? []).map((v) => toDisplay(v)),
        type: "bar",
        name: "Inverter Output",
        marker: { color: "#f39c12" },
        textposition: "none"
      },
      {
        x: timestamps,
        y: (mpData?.energy_to_charger ?? []).map((v) => -toDisplay(v)),
        type: "bar",
        name: "Charger Input",
        marker: { color: "#3498db" },
        textposition: "none"
      }
    ];
    const layout = getDefaultLayout();
    layoutSetXRange(layout, start, end);
    layoutAddNowLine(layout, start, end);
    makePlot(elementId, traces, layout);
  }
  function renderEnergyFlowChart(elementId, data, start, end, frameOfReference = "multiplus") {
    if (frameOfReference === "grid") {
      renderGridEnergyChart(elementId, data, start, end);
    } else {
      renderBatteryEnergyChart(elementId, data, start, end);
    }
  }
  async function loadPowerChart(elementId, start, end, aggregateMinutes = 5) {
    showLoading(elementId);
    try {
      const data = await powerGraph({
        start: formatDate(start),
        end: formatDate(end),
        aggregate_minutes: aggregateMinutes
      });
      const settings = loadSettings();
      const useKw = settings.powerUnit === "kw";
      const unit = useKw ? "kW" : "W";
      const traces = [];
      const sortedKeys = Object.keys(data.series ?? {}).sort();
      for (const key of sortedKeys) {
        const series = data.series[key];
        if (!series.timestamps || !series.values) continue;
        traces.push({
          x: series.timestamps.map((t) => new Date(t)),
          y: series.values,
          type: "scatter",
          mode: "lines",
          name: key,
          line: { width: 1.5 },
          connectgaps: false,
          hovertemplate: `%{y:.1f} ${unit}<extra>${key}</extra>`
        });
      }
      const layout = getDefaultLayout();
      layoutSetXRange(layout, start, end);
      layoutAddNowLine(layout, start, end);
      makePlot(elementId, traces, layout);
    } catch (error) {
      console.error("Error loading power data:", error);
      showError(elementId, "Failed to load power data");
    }
  }
  async function loadPriceChart(elementId, start, end) {
    showLoading(elementId);
    const extendedEnd = new Date(end.getTime() + 2 * 24 * 60 * 60 * 1e3);
    try {
      const data = await prices({
        start: formatDate(start),
        end: formatDate(extendedEnd)
      });
      if (!data.timeseries || data.timeseries.length === 0) {
        showError(elementId, "No price data available");
        return;
      }
      const settings = loadSettings();
      const priceMultiplier = settings.priceUnit === "cent" ? 100 : 1;
      const priceLabel = settings.priceUnit === "cent" ? "ct/kWh" : data.unit ?? "\u20AC/kWh";
      const timestamps = data.timeseries.map((d) => new Date(d.time));
      const marketPrices = data.timeseries.map((d) => (d.market ?? 0) * priceMultiplier);
      const buyPrices = data.timeseries.map((d) => (d.buy ?? 0) * priceMultiplier);
      const sellPrices = data.timeseries.map((d) => (d.sell ?? 0) * priceMultiplier);
      const lastTime = timestamps[timestamps.length - 1];
      const extendedTime = new Date(lastTime.getTime() + (data.aggregate_minutes ?? 60) * 60 * 1e3);
      timestamps.push(extendedTime);
      marketPrices.push(marketPrices[marketPrices.length - 1]);
      buyPrices.push(buyPrices[buyPrices.length - 1]);
      sellPrices.push(sellPrices[sellPrices.length - 1]);
      const traces = [
        {
          name: "Market",
          x: timestamps,
          y: marketPrices,
          type: "scatter",
          mode: "lines",
          line: { shape: "hv", color: "#95a5a6", width: 1 },
          hovertemplate: `Market: %{y:.2f} ${priceLabel}<extra></extra>`
        },
        {
          name: "Buy",
          x: timestamps,
          y: buyPrices,
          type: "scatter",
          mode: "lines",
          line: { shape: "hv", color: "#e74c3c", width: 1.5 },
          hovertemplate: `Buy: %{y:.2f} ${priceLabel}<extra></extra>`
        },
        {
          name: "Sell",
          x: timestamps,
          y: sellPrices,
          type: "scatter",
          mode: "lines",
          line: { shape: "hv", color: "#2ecc71", width: 1.5 },
          hovertemplate: `Sell: %{y:.2f} ${priceLabel}<extra></extra>`
        }
      ];
      const layout = getDefaultLayout();
      layoutSetXRange(layout, start, end);
      layoutAddNowLine(layout, start, end);
      layout.yaxis = layout.yaxis ?? {};
      layout.yaxis.title = { text: priceLabel };
      makePlot(elementId, traces, layout);
    } catch (error) {
      console.error("Error loading prices:", error);
      showError(elementId, "Failed to load prices");
    }
  }
  async function loadSocChart(elementId, start, end) {
    showLoading(elementId);
    try {
      const data = await batteryGraph({
        start: formatDate(start),
        end: formatDate(end)
      });
      const multipleSystems = Object.keys(data).length > 1;
      const traces = [];
      for (const [name, battery] of Object.entries(data)) {
        traces.push({
          ...makeTrace("SoC", timeseriesExtendToNow(battery.soc ?? { timestamps: [], values: [] })),
          ...multipleSystems && {
            legendgroup: name,
            legendgrouptitle: { text: name }
          },
          line: { color: "#3498db", width: 2 },
          hovertemplate: "%{y}%<extra>SoC</extra>"
        });
        traces.push({
          ...makeTrace("Scheduled", battery.schedule ?? { timestamps: [], values: [] }),
          ...multipleSystems && {
            legendgroup: name,
            legendgrouptitle: { text: name }
          },
          line: { color: "#2ecc71", width: 2, dash: "dot" },
          hovertemplate: "%{y}%<extra>Scheduled</extra>"
        });
        traces.push({
          ...makeTrace("Voltage", battery.voltage ?? { timestamps: [], values: [] }),
          ...multipleSystems && {
            legendgroup: name,
            legendgrouptitle: { text: name }
          },
          line: { color: "#ff7171", width: 2 },
          hovertemplate: "%{y}V<extra>Voltage</extra>",
          yaxis: "y2"
        });
      }
      const layout = getDefaultLayout();
      layoutSetXRange(layout, start, end);
      layoutAddNowLine(layout, start, end);
      layout.yaxis = layout.yaxis ?? {};
      layout.yaxis.side = "left";
      layout.yaxis.range = [0, 100];
      layout.yaxis.title = { text: "SoC (%)" };
      layout.yaxis2 = {
        overlaying: "y",
        side: "right",
        gridcolor: "transparent",
        title: { text: "Voltage (V)" }
      };
      if (multipleSystems && layout.legend) {
        layout.legend.y = -0.25;
      }
      makePlot(elementId, traces, layout);
    } catch (error) {
      console.error("Error loading SoC data:", error);
      showError(elementId, "Failed to load SoC data");
    }
  }
  async function loadAndCacheEnergyData(start, end, bucketMinutes) {
    try {
      cachedEnergyData = await energyGraph({
        start: formatDate(start),
        end: formatDate(end),
        bucket_minutes: bucketMinutes
      });
    } catch (error) {
      console.error("Error fetching energy data:", error);
      cachedEnergyData = null;
    }
  }
  async function loadDashboard() {
    const hours = parseInt(document.getElementById("range-select").value);
    const aggregateMinutes = getAggregateMinutes(hours);
    const bucketMinutes = getBucketMinutes(hours);
    const range = getTimeRange(hours, rangeOffset);
    dashboardStart = range.start;
    dashboardEnd = range.end;
    updateRangeLabel();
    cachedEnergyData = null;
    cachedBucketMinutes = bucketMinutes;
    await Promise.all([
      loadAndCacheEnergyData(dashboardStart, dashboardEnd, bucketMinutes),
      loadPowerChart("power-chart", dashboardStart, dashboardEnd, aggregateMinutes),
      loadPriceChart("prices-chart", dashboardStart, dashboardEnd),
      loadSocChart("soc-chart", dashboardStart, dashboardEnd)
    ]);
    if (cachedEnergyData) {
      renderEnergyFlowChart("energy-chart", cachedEnergyData, dashboardStart, dashboardEnd, currentFoR);
    }
    setupZoomSync();
  }
  function renderEnergyOnly() {
    if (dashboardStart && dashboardEnd && cachedEnergyData) {
      renderEnergyFlowChart("energy-chart", cachedEnergyData, dashboardStart, dashboardEnd, currentFoR);
    }
  }
  document.addEventListener("DOMContentLoaded", () => {
    const settings = loadSettings();
    applyTheme(settings.theme);
    const savedRange = loadPagePref("dashboard", "range", "24");
    const savedFoR = loadPagePref("dashboard", "for", "multiplus");
    document.getElementById("range-select").value = savedRange;
    currentFoR = savedFoR;
    document.querySelectorAll("#for-buttons .btn-toggle").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.value === savedFoR);
    });
    document.getElementById("range-select").addEventListener("change", (e) => {
      savePagePref("dashboard", "range", e.target.value);
      rangeOffset = 0;
      loadDashboard();
    });
    document.getElementById("range-prev").addEventListener("click", () => {
      rangeOffset++;
      loadDashboard();
    });
    document.getElementById("range-next").addEventListener("click", () => {
      if (rangeOffset > -1) {
        rangeOffset--;
        loadDashboard();
      }
    });
    document.querySelectorAll("#for-buttons .btn-toggle").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("#for-buttons .btn-toggle").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        currentFoR = btn.dataset.value ?? "multiplus";
        savePagePref("dashboard", "for", currentFoR);
        renderEnergyOnly();
      });
    });
    loadDashboard();
  });
})();
