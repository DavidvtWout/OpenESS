// Settings management with cookies
(function() {
    'use strict';

    var defaultSettings = {
        theme: 'dark',
        priceUnit: 'eur',
        powerUnit: 'w',
        weekStartDay: 1,
    };

    function getCookie(name) {
        var value = '; ' + document.cookie;
        var parts = value.split('; ' + name + '=');
        if (parts.length === 2) {
            var val = parts.pop().split(';').shift();
            return val || null;
        }
        return null;
    }

    function setCookie(name, value) {
        var expires = new Date();
        expires.setFullYear(expires.getFullYear() + 10);
        document.cookie = name + '=' + value + '; expires=' + expires.toUTCString() + '; path=/; SameSite=Lax';
    }

    function loadSettings() {
        var settings = Object.assign({}, defaultSettings);

        var theme = getCookie('theme');
        if (theme) settings.theme = theme;

        var priceUnit = getCookie('priceUnit');
        if (priceUnit) settings.priceUnit = priceUnit;

        var powerUnit = getCookie('powerUnit');
        if (powerUnit) settings.powerUnit = powerUnit;

        var weekStartDay = getCookie('weekStartDay');
        if (weekStartDay !== null) settings.weekStartDay = parseInt(weekStartDay, 10);

        return settings;
    }

    function saveSetting(name, value) {
        setCookie(name, value);
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
    }

    function savePagePref(page, key, value) {
        setCookie(page + '_' + key, value);
    }

    function loadPagePref(page, key, defaultValue) {
        var value = getCookie(page + '_' + key);
        return value !== null ? value : defaultValue;
    }

    // Export to global
    window.Settings = {
        load: loadSettings,
        save: saveSetting,
        applyTheme: applyTheme,
        savePagePref: savePagePref,
        loadPagePref: loadPagePref
    };

    // Apply theme immediately
    applyTheme(loadSettings().theme);
})();
