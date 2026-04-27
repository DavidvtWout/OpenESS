// Settings management with cookies

/**
 * @typedef {Object} Settings
 * @property {string} theme
 * @property {string} priceUnit
 * @property {string} powerUnit
 * @property {number} weekStartDay
 */

/** @type {Settings} */
const defaultSettings = {
    theme: 'dark',
    priceUnit: 'eur',
    powerUnit: 'w',
    weekStartDay: 1,
};

/**
 * @param {string} name
 * @returns {string | null}
 */
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        const val = parts.pop()?.split(';').shift();
        return val ?? null;
    }
    return null;
}

/**
 * @param {string} name
 * @param {string} value
 */
function setCookie(name, value) {
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 10);
    document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

/**
 * @returns {Settings}
 */
export function loadSettings() {
    const settings = { ...defaultSettings };

    const theme = getCookie('theme');
    if (theme) settings.theme = theme;

    const priceUnit = getCookie('priceUnit');
    if (priceUnit) settings.priceUnit = priceUnit;

    const powerUnit = getCookie('powerUnit');
    if (powerUnit) settings.powerUnit = powerUnit;

    const weekStartDay = getCookie('weekStartDay');
    if (weekStartDay !== null) settings.weekStartDay = parseInt(weekStartDay, 10);

    return settings;
}

/**
 * @param {string} name
 * @param {string} value
 */
export function saveSetting(name, value) {
    setCookie(name, value);
}

/**
 * @param {string} theme
 */
export function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
}

/**
 * @returns {number}
 */
export function getPriceMultiplier() {
    const settings = loadSettings();
    return settings.priceUnit === 'cent' ? 100 : 1;
}

/**
 * @returns {string}
 */
export function getPriceUnitLabel() {
    const settings = loadSettings();
    return settings.priceUnit === 'cent' ? 'ct/kWh' : 'EUR/kWh';
}

/**
 * @param {string} page
 * @param {string} key
 * @param {string} value
 */
export function savePagePref(page, key, value) {
    setCookie(`${page}_${key}`, value);
}

/**
 * @param {string} page
 * @param {string} key
 * @param {string} defaultValue
 * @returns {string}
 */
export function loadPagePref(page, key, defaultValue) {
    const value = getCookie(`${page}_${key}`);
    return value !== null ? value : defaultValue;
}

function initSettings() {
    const settings = loadSettings();

    // Theme
    const themeSelect = document.getElementById('theme-select');
    themeSelect.value = settings.theme;
    themeSelect.addEventListener('change', function() {
        saveSetting('theme', this.value);
        applyTheme(this.value);
    });

    // Price unit
    const priceUnitSelect = document.getElementById('price-unit-select');
    priceUnitSelect.value = settings.priceUnit;
    priceUnitSelect.addEventListener('change', function() {
        saveSetting('priceUnit', this.value);
    });

    // Power unit
    const powerUnitSelect = document.getElementById('power-unit-select');
    powerUnitSelect.value = settings.powerUnit;
    powerUnitSelect.addEventListener('change', function() {
        saveSetting('powerUnit', this.value);
    });

    // Week start day
    const weekStartSelect = document.getElementById('week-start-select');
    weekStartSelect.value = settings.weekStartDay;
    weekStartSelect.addEventListener('change', function() {
        saveSetting('weekStartDay', this.value);
    });

    applyTheme(settings.theme);
}

// Run on page load
document.addEventListener('DOMContentLoaded', initSettings);

// Also run immediately in case DOM is already loaded
if (document.readyState !== 'loading') {
    initSettings();
}
