"use strict";
(() => {
  // open_ess/frontend/src/types.ts
  async function power(params) {
    const searchParams = new URLSearchParams();
    if (params.start !== void 0) searchParams.set("start", String(params.start));
    if (params.end !== void 0) searchParams.set("end", String(params.end));
    if (params.aggregate_minutes !== void 0) searchParams.set("aggregate_minutes", String(params.aggregate_minutes));
    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
    const response = await fetch(`/api/power${query}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  }
  async function energy(params) {
    const searchParams = new URLSearchParams();
    if (params.start !== void 0) searchParams.set("start", String(params.start));
    if (params.end !== void 0) searchParams.set("end", String(params.end));
    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
    const response = await fetch(`/api/energy${query}`);
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

  // open_ess/frontend/src/debug.ts
  function getHoursSelect() {
    return document.getElementById("hours-select");
  }
  function getAggregateSelect() {
    return document.getElementById("aggregate-select");
  }
  async function loadPowerChart() {
    const elementId = "power-chart";
    showLoading(elementId);
    const hours = parseInt(getHoursSelect().value);
    const aggregateMinutes = parseInt(getAggregateSelect().value);
    const now = /* @__PURE__ */ new Date();
    const start = new Date(now.getTime() - hours * 60 * 60 * 1e3);
    try {
      const data = await power({
        start: formatDate(start),
        end: formatDate(now),
        aggregate_minutes: aggregateMinutes
      });
      if (!data.series || Object.keys(data.series).length === 0) {
        showError(elementId, "No power flow data available");
        return;
      }
      const settings = loadSettings();
      const useKw = settings.powerUnit === "kw";
      const powerUnit = useKw ? "kW" : "W";
      const traces = [];
      const sortedKeys = Object.keys(data.series).sort();
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
          hovertemplate: `%{y:.1f} ${powerUnit}<extra>${key}</extra>`
        });
      }
      const layout = getDefaultLayout();
      layoutSetXRange(layout, start, now);
      layout.hovermode = "x unified";
      makePlot(elementId, traces, layout);
    } catch (error) {
      console.error("Error loading power flows:", error);
      showError(elementId, "Failed to load power flows");
    }
  }
  async function loadEnergyChart() {
    const elementId = "energy-chart";
    showLoading(elementId);
    const hours = parseInt(getHoursSelect().value);
    const now = /* @__PURE__ */ new Date();
    const start = new Date(now.getTime() - hours * 60 * 60 * 1e3);
    try {
      const data = await energy({
        start: formatDate(start),
        end: formatDate(now)
      });
      if (!data.series || Object.keys(data.series).length === 0) {
        showError(elementId, "No energy flow data available");
        return;
      }
      const settings = loadSettings();
      const useKw = settings.powerUnit === "kw";
      const energyUnit = useKw ? "kWh" : "Wh";
      const traces = [];
      const sortedKeys = Object.keys(data.series).sort();
      for (const key of sortedKeys) {
        const series = data.series[key];
        if (!series.timestamps || !series.values) continue;
        const timestamps = [...series.timestamps.map((t) => new Date(t)), /* @__PURE__ */ new Date()];
        const lastValue = series.values[series.values.length - 1];
        const values = [...series.values, lastValue];
        const isIntegrated = key.includes("[integrated]");
        traces.push({
          x: timestamps,
          y: values,
          type: "scatter",
          mode: "lines",
          name: key,
          line: {
            width: isIntegrated ? 1.5 : 2,
            dash: isIntegrated ? "dot" : "solid"
          },
          hovertemplate: `%{y:.2f} ${energyUnit}<extra>${key}</extra>`
        });
      }
      const layout = getDefaultLayout();
      layoutSetXRange(layout, start, now);
      layout.hovermode = "x unified";
      makePlot(elementId, traces, layout);
    } catch (error) {
      console.error("Error loading energy flows:", error);
      showError(elementId, "Failed to load energy flows");
    }
  }
  function loadAllCharts() {
    loadPowerChart();
    loadEnergyChart();
  }
  document.addEventListener("DOMContentLoaded", () => {
    const settings = loadSettings();
    applyTheme(settings.theme);
    getHoursSelect().value = loadPagePref("debug", "hours", "24");
    getAggregateSelect().value = loadPagePref("debug", "aggregate", "1");
    getHoursSelect().addEventListener("change", (e) => {
      savePagePref("debug", "hours", e.target.value);
      loadAllCharts();
    });
    getAggregateSelect().addEventListener("change", (e) => {
      savePagePref("debug", "aggregate", e.target.value);
      loadAllCharts();
    });
    loadAllCharts();
  });
})();
