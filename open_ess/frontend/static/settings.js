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
  function getPriceMultiplier() {
    const settings = loadSettings();
    return settings.priceUnit === "cent" ? 100 : 1;
  }
  function getPriceUnitLabel() {
    const settings = loadSettings();
    return settings.priceUnit === "cent" ? "ct/kWh" : "EUR/kWh";
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
})();
