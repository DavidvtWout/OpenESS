// Settings management with cookies

const defaultSettings = {
    theme: 'dark',
    priceUnit: 'eur',  // 'eur' or 'cent'
    weekStartDay: 1,   // 0 = Sunday, 1 = Monday
};

// Get a cookie value
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// Set a cookie value (expires in 10 years)
function setCookie(name, value) {
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 10);
    document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

// Load all settings from cookies
function loadSettings() {
    const settings = { ...defaultSettings };

    const theme = getCookie('theme');
    if (theme) settings.theme = theme;

    const priceUnit = getCookie('priceUnit');
    if (priceUnit) settings.priceUnit = priceUnit;

    const weekStartDay = getCookie('weekStartDay');
    if (weekStartDay !== null) settings.weekStartDay = parseInt(weekStartDay, 10);

    return settings;
}

// Save a single setting
function saveSetting(name, value) {
    setCookie(name, value);
}

// Apply theme to document
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
}

// Get price multiplier based on unit setting
function getPriceMultiplier() {
    const settings = loadSettings();
    return settings.priceUnit === 'cent' ? 100 : 1;
}

// Get price unit label
function getPriceUnitLabel() {
    const settings = loadSettings();
    return settings.priceUnit === 'cent' ? 'ct/kWh' : 'EUR/kWh';
}

// Initialize settings on page load
function initSettings() {
    const settings = loadSettings();
    applyTheme(settings.theme);
}

// Run on page load
document.addEventListener('DOMContentLoaded', initSettings);

// Also run immediately in case DOM is already loaded
if (document.readyState !== 'loading') {
    initSettings();
}
