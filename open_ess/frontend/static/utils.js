"use strict";
(() => {
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

  // open_ess/frontend/src/utils.ts
  function isDarkTheme() {
    const settings = loadSettings();
    return settings.theme === "dark";
  }
  function formatDate(date) {
    return date.toISOString();
  }
  function formatEnergy(kwh) {
    if (kwh == null) return "-";
    return kwh + " kWh";
  }
  function formatDateTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  function formatDuration(hours) {
    if (hours < 1) {
      return Math.round(hours * 60) + " min";
    } else if (hours < 24) {
      const h = Math.floor(hours);
      const m = Math.round((hours - h) * 60);
      return h + "h " + m + "m";
    } else {
      const d = Math.floor(hours / 24);
      const h = Math.round(hours % 24);
      return d + "d " + h + "h";
    }
  }
  function insertGapNulls(timestamps, values, gapThresholdMs) {
    if (timestamps.length === 0) return { timestamps: [], values: [] };
    const newTimestamps = [timestamps[0]];
    const newValues = [values[0]];
    for (let i = 1; i < timestamps.length; i++) {
      const timeDiff = timestamps[i].getTime() - timestamps[i - 1].getTime();
      if (timeDiff > gapThresholdMs) {
        newTimestamps.push(new Date(timestamps[i - 1].getTime() + 1));
        newValues.push(null);
      }
      newTimestamps.push(timestamps[i]);
      newValues.push(values[i]);
    }
    return { timestamps: newTimestamps, values: newValues };
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
})();
