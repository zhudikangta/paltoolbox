window.PT_SETTINGS_KEY = 'pt-migration-settings-v1';
window.PT_DOCK_SETTINGS_KEY = 'pt-dock-settings-v1';
window.PT_WEB_SETTINGS_KEY = 'pt-web-settings-v1';
window.PT_IMMERSIVE_SETTINGS_KEY = 'pt-immersive-shell-settings-v1';
window.PT_SPACE_SETTINGS_KEY = 'pt-space-settings-v1';
window.PT_STARCHART_SETTINGS_KEY = 'pt-starchart-settings-v1';
window.PT_LOCAL_WALLPAPER_KEY = 'pt-local-wallpaper-v1';

window.PT_GET_DEFAULT_SETTINGS = function GET_DEFAULT_SETTINGS() {
    return {
        theme: 'oceanic', glassMode: 'gradient',
        cardSnapMode: 'codex',
        screenSnapMode: 'codex',
        cardMagnetMode: 'physics',
        screenSnapPreview: true,
        magnetPreview: true,
        magnetAlign: true,
        magnetBreakForce: 2.5,
        magnetSnapSpeed: 0.8,
        wallpaper: 'image-bg', wallpaperCustom: null, wallpaperBrightness: 1,
        wallpaperTheme: null, wallpaperLibrary: [],
        cardBackgroundTheme: 'theme:oceanic',
        cardUiTheme: 'theme:oceanic',
        smallCardAppearanceEnabled: false,
        smallCardTheme: 'theme:oceanic',
        cardMaterial: 'gradient',
        smallCardMaterial: 'smallTranslucent',
        cardMaterialBrightness: 1,
        cardThemePresets: {},
        cardMaterialPresets: {},
        cardStylePreset: null,
        cardStyleCustom: null,
        cardStylePresets: {},
        buttonStyle: 'modern',
        webMode: 'portal',
        webToolLayouts: {}
    };
};

window.PT_isKnownThemeSelection = function PT_isKnownThemeSelection(value, settings) {
    var selected = String(value || '');
    var themes = window.PT_THEME_PRESETS || {};
    if (selected.indexOf('theme:') === 0) return !!themes[selected.slice(6)];
    if (selected.indexOf('custom:') === 0) return !!((settings || {}).cardThemePresets || {})[selected.slice(7)];
    return !!themes[selected];
};

window.PT_normalizeThemeSelection = function PT_normalizeThemeSelection(value, fallbackTheme, settings) {
    var fallback = 'theme:' + (fallbackTheme && window.PT_isKnownThemeSelection(fallbackTheme) ? fallbackTheme : 'oceanic');
    if (!value || value === 'global' || String(value).indexOf('__') === 0) return fallback;
    if (!window.PT_isKnownThemeSelection(value, settings)) return fallback;
    return String(value).indexOf('theme:') === 0 || String(value).indexOf('custom:') === 0 ? value : 'theme:' + value;
};

window.PT_normalizeMaterialSelection = function PT_normalizeMaterialSelection(value, settings, fallback) {
    var selected = String(value || '');
    var defaultValue = fallback || 'gradient';
    if ((window.PT_MATERIAL_PRESETS || {})[selected]) return selected;
    if (selected.indexOf('custom:') === 0 && ((settings || {}).cardMaterialPresets || {})[selected.slice(7)]) return selected;
    return defaultValue;
};

window.PT_normalizeRatioSetting = function PT_normalizeRatioSetting(value, fallback, min, max) {
    var num = parseFloat(value);
    if (!isFinite(num)) num = fallback;
    return Math.max(min, Math.min(max, num));
};

window.PT_normalizeSettings = function PT_normalizeSettings(settings) {
    var next = Object.assign({}, window.PT_GET_DEFAULT_SETTINGS(), settings || {});
    if (!window.PT_isKnownThemeSelection(next.theme, next)) next.theme = 'oceanic';
    next.cardBackgroundTheme = window.PT_normalizeThemeSelection(next.cardBackgroundTheme, next.theme, next);
    next.cardUiTheme = window.PT_normalizeThemeSelection(next.cardUiTheme, next.theme, next);
    next.smallCardAppearanceEnabled = next.smallCardAppearanceEnabled === true;
    next.smallCardTheme = window.PT_normalizeThemeSelection(next.smallCardTheme, next.theme, next);
    next.cardMaterial = window.PT_normalizeMaterialSelection(next.cardMaterial || next.glassMode, next, 'gradient');
    next.smallCardMaterial = window.PT_normalizeMaterialSelection(next.smallCardMaterial, next, 'smallTranslucent');
    next.wallpaperBrightness = window.PT_normalizeRatioSetting(next.wallpaperBrightness, 1, 0, 2);
    next.cardMaterialBrightness = window.PT_normalizeRatioSetting(next.cardMaterialBrightness, 1, 0, 2);
    if (!next.webToolLayouts || typeof next.webToolLayouts !== 'object' || Array.isArray(next.webToolLayouts)) {
        next.webToolLayouts = {};
    }
    if (next.wallpaper === 'theme-color') {
        next.wallpaperTheme = window.PT_isKnownThemeSelection(next.wallpaperTheme) ? next.wallpaperTheme : 'oceanic';
    } else {
        next.wallpaperTheme = null;
    }
    delete next['card' + 'Theme' + 'Draft'];
    delete next['card' + 'Material' + 'Draft'];
    return next;
};

window.PT_readLocalWallpaperSettings = function PT_readLocalWallpaperSettings(fallback) {
    var base = fallback || {};
    try {
        var raw = localStorage.getItem(window.PT_LOCAL_WALLPAPER_KEY);
        if (raw) {
            var parsed = JSON.parse(raw);
            return {
                wallpaper: parsed.wallpaper === 'custom' ? 'custom' : null,
                wallpaperCustom: parsed.wallpaperCustom || null,
                wallpaperLibrary: Array.isArray(parsed.wallpaperLibrary) ? parsed.wallpaperLibrary : []
            };
        }
    } catch (error) {}
    return {
        wallpaper: base.wallpaper === 'custom' ? 'custom' : null,
        wallpaperCustom: base.wallpaperCustom || null,
        wallpaperLibrary: Array.isArray(base.wallpaperLibrary) ? base.wallpaperLibrary : []
    };
};

window.PT_writeLocalWallpaperSettings = function PT_writeLocalWallpaperSettings(settings) {
    var next = settings || {};
    var local = {
        wallpaper: next.wallpaper === 'custom' ? 'custom' : null,
        wallpaperCustom: next.wallpaperCustom || null,
        wallpaperLibrary: Array.isArray(next.wallpaperLibrary) ? next.wallpaperLibrary : []
    };
    while (local.wallpaperLibrary.length >= 0) {
        try {
            localStorage.setItem(window.PT_LOCAL_WALLPAPER_KEY, JSON.stringify(local));
            return;
        } catch (error) {
            if (!local.wallpaperLibrary.length) return;
            local.wallpaperLibrary = local.wallpaperLibrary.slice(1);
            if (local.wallpaperCustom && local.wallpaperLibrary.indexOf(local.wallpaperCustom) < 0) {
                local.wallpaperCustom = local.wallpaperLibrary[local.wallpaperLibrary.length - 1] || null;
                local.wallpaper = local.wallpaperCustom ? 'custom' : null;
            }
        }
    }
};

window.PT_mergeLocalWallpaperSettings = function PT_mergeLocalWallpaperSettings(settings) {
    var merged = window.PT_normalizeSettings(settings);
    var local = window.PT_readLocalWallpaperSettings(merged);
    merged.wallpaperCustom = local.wallpaperCustom;
    merged.wallpaperLibrary = local.wallpaperLibrary;
    if (local.wallpaper === 'custom' && local.wallpaperCustom) {
        merged.wallpaper = 'custom';
        merged.wallpaperTheme = null;
    }
    return merged;
};

window.PT_stripLocalWallpaperSettings = function PT_stripLocalWallpaperSettings(settings) {
    var stripped = window.PT_normalizeSettings(settings);
    if (stripped.wallpaper === 'custom') stripped.wallpaper = 'image-bg';
    stripped.wallpaperCustom = null;
    stripped.wallpaperLibrary = [];
    return stripped;
};

window.PT_getSettingsKey = function PT_getSettingsKey(mode) {
    if (mode === 'web') return window.PT_WEB_SETTINGS_KEY;
    if (mode === 'immersive') return window.PT_IMMERSIVE_SETTINGS_KEY;
    if (mode === 'space') return window.PT_SPACE_SETTINGS_KEY;
    if (mode === 'starchart') return window.PT_STARCHART_SETTINGS_KEY;
    return window.PT_DOCK_SETTINGS_KEY;
};

window.PT_migrateSettingsIfNeeded = function PT_migrateSettingsIfNeeded(mode) {
    var oldRaw;
    try { oldRaw = localStorage.getItem(window.PT_SETTINGS_KEY); } catch (e) {}
    if (!oldRaw) return;
    var dockKey = window.PT_DOCK_SETTINGS_KEY;
    var webKey = window.PT_WEB_SETTINGS_KEY;
    var dockRaw; try { dockRaw = localStorage.getItem(dockKey); } catch (e) {}
    var webRaw; try { webRaw = localStorage.getItem(webKey); } catch (e) {}
    if (dockRaw && webRaw) return;
    var old; try { old = JSON.parse(oldRaw); } catch (e) { old = null; }
    if (!old) return;
    if (!dockRaw) {
        var dockSettings = Object.assign({}, window.PT_GET_DEFAULT_SETTINGS(), old);
        delete dockSettings.webToolLayouts;
        try { localStorage.setItem(dockKey, JSON.stringify(dockSettings)); } catch (e) {}
    }
    if (!webRaw) {
        var webSettings = Object.assign({}, window.PT_GET_DEFAULT_SETTINGS(), old);
        delete webSettings.webTheme;
        delete webSettings.webWallpaper;
        delete webSettings.webWallpaperTheme;
        delete webSettings.webWallpaperCustom;
        if (old.webToolLayouts !== undefined) webSettings.webToolLayouts = old.webToolLayouts;
        try { localStorage.setItem(webKey, JSON.stringify(webSettings)); } catch (e) {}
    }
    try { localStorage.removeItem(window.PT_SETTINGS_KEY); } catch (e) {}
};

window.readPTSettings = function readPTSettings(mode) {
    mode = mode || 'dock';
    window.PT_migrateSettingsIfNeeded(mode);
    var key = window.PT_getSettingsKey(mode);
    var settings;
    if (window.PT_AUTH && window.PT_AUTH.isLoggedIn()) {
        settings = window.PT_AUTH.readSettings();
    } else {
        try {
            var raw = localStorage.getItem(key);
            settings = raw ? JSON.parse(raw) : window.PT_GET_DEFAULT_SETTINGS();
        } catch (error) {
            settings = window.PT_GET_DEFAULT_SETTINGS();
        }
    }
    return window.PT_mergeLocalWallpaperSettings(settings);
};

window.writePTSettings = function writePTSettings(nextSettings, mode) {
    mode = mode || 'dock';
    var key = window.PT_getSettingsKey(mode);
    window.PT_writeLocalWallpaperSettings(nextSettings);
    var accountSettings = window.PT_stripLocalWallpaperSettings(nextSettings);
    if (window.PT_AUTH && window.PT_AUTH.isLoggedIn()) {
        window.PT_AUTH.writeSettings(accountSettings);
    } else {
        localStorage.setItem(key, JSON.stringify(accountSettings));
    }
};
