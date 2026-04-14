// Settings management with cookies

export interface Settings {
    theme: string;
    priceUnit: string;
    powerUnit: string;
    weekStartDay: number;
}

const defaultSettings: Settings = {
    theme: 'dark',
    priceUnit: 'eur',
    powerUnit: 'w',
    weekStartDay: 1,
};

function getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        const val = parts.pop()?.split(';').shift();
        return val ?? null;
    }
    return null;
}

function setCookie(name: string, value: string): void {
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 10);
    document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

export function loadSettings(): Settings {
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

export function saveSetting(name: string, value: string): void {
    setCookie(name, value);
}

export function applyTheme(theme: string): void {
    document.documentElement.setAttribute('data-theme', theme);
}

export function getPriceMultiplier(): number {
    const settings = loadSettings();
    return settings.priceUnit === 'cent' ? 100 : 1;
}

export function getPriceUnitLabel(): string {
    const settings = loadSettings();
    return settings.priceUnit === 'cent' ? 'ct/kWh' : 'EUR/kWh';
}

export function savePagePref(page: string, key: string, value: string): void {
    setCookie(`${page}_${key}`, value);
}

export function loadPagePref(page: string, key: string, defaultValue: string): string {
    const value = getCookie(`${page}_${key}`);
    return value !== null ? value : defaultValue;
}

function initSettings(): void {
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
