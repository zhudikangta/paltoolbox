var PT_IMMERSIVE_CONFIG = (function() {
    var SETTINGS_KEY = 'pt-immersive-settings-v1';

    var DEFAULT_SETTINGS = {
        particleDensity: 72,
        particleSize: 2.4,
        glowStrength: 86,
        cameraMotion: 74,
        motionSpeed: 68,
        backgroundStyle: 'particle-wall',
        reduceMotion: false,
        particleImage: null
    };

    var TOOLS = [
        { id: 'calculator', title: '工作速度计算器', shortTitle: '工作速度', status: 'ready', moduleName: 'PT_WORK_SPEED_IMMERSIVE', accent: '#9df7ff' },
        { id: 'settings', title: '设置', shortTitle: '设置', status: 'ready', moduleName: 'PT_IMMERSIVE_SETTINGS_PANEL', accent: '#ffe8a6' },
        { id: 'breeding', title: '配种查询', shortTitle: '配种', status: 'placeholder', accent: '#ffb8da' },
        { id: 'skill', title: '技能', shortTitle: '技能', status: 'placeholder', accent: '#b7ffbd' },
        { id: 'capture', title: '捕获概率', shortTitle: '捕获', status: 'placeholder', accent: '#ffd08a' },
        { id: 'paldex', title: '帕鲁图鉴', shortTitle: '图鉴', status: 'placeholder', accent: '#b6c6ff' },
        { id: 'items', title: '物品图鉴', shortTitle: '物品', status: 'placeholder', accent: '#d7b6ff' },
        { id: 'map', title: '地图指南', shortTitle: '地图', status: 'placeholder', accent: '#8dffd7' }
    ];

    function clampNumber(value, fallback, min, max) {
        var num = parseFloat(value);
        if (!isFinite(num)) num = fallback;
        return Math.max(min, Math.min(max, num));
    }

    function normalizeSettings(settings) {
        var next = Object.assign({}, DEFAULT_SETTINGS, settings || {});
        next.particleDensity = clampNumber(next.particleDensity, DEFAULT_SETTINGS.particleDensity, 16, 160);
        next.particleSize = clampNumber(next.particleSize, DEFAULT_SETTINGS.particleSize, 0.8, 6);
        next.glowStrength = clampNumber(next.glowStrength, DEFAULT_SETTINGS.glowStrength, 0, 140);
        next.cameraMotion = clampNumber(next.cameraMotion, DEFAULT_SETTINGS.cameraMotion, 0, 140);
        next.motionSpeed = clampNumber(next.motionSpeed, DEFAULT_SETTINGS.motionSpeed, 10, 140);
        if (['particle-wall', 'black-hole', 'stardust'].indexOf(next.backgroundStyle) < 0) {
            next.backgroundStyle = DEFAULT_SETTINGS.backgroundStyle;
        }
        next.reduceMotion = next.reduceMotion === true;
        next.particleImage = next.particleImage || null;
        return next;
    }

    function readSettings() {
        try {
            var raw = localStorage.getItem(SETTINGS_KEY);
            return normalizeSettings(raw ? JSON.parse(raw) : null);
        } catch (error) {
            return normalizeSettings(null);
        }
    }

    function writeSettings(settings) {
        var next = normalizeSettings(settings);
        try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)); } catch (error) {}
        return next;
    }

    function getTools() {
        return TOOLS.map(function(tool) {
            return Object.assign({}, tool);
        });
    }

    function getTool(toolId) {
        var tools = getTools();
        for (var i = 0; i < tools.length; i++) {
            if (tools[i].id === toolId) return tools[i];
        }
        return null;
    }

    return {
        SETTINGS_KEY: SETTINGS_KEY,
        DEFAULT_SETTINGS: DEFAULT_SETTINGS,
        normalizeSettings: normalizeSettings,
        readSettings: readSettings,
        writeSettings: writeSettings,
        getTools: getTools,
        getTool: getTool
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PT_IMMERSIVE_CONFIG: PT_IMMERSIVE_CONFIG };
}
if (typeof window !== 'undefined') {
    window.PT_IMMERSIVE_CONFIG = PT_IMMERSIVE_CONFIG;
}
