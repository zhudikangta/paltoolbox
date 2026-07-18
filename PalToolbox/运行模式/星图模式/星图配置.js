var PT_STARCHART_CONFIG = (function() {
    var SETTINGS_KEY = 'pt-starchart-settings-v1';

    var DEFAULT_SETTINGS = {
        starDensity: 72,
        orbitSpeed: 62,
        planetSize: 100,
        orbitSpacing: 100,
        glowIntensity: 88,
        sunlightIntensity: 96,
        cameraMotion: 70,
        labelVisible: true,
        orbitVisible: true,
        reduceMotion: false
    };

    var TEXTURE_BASE = '../运行模式/星图模式/资源/贴图/';

    var TOOLS = [
        { id: 'calculator', title: '工作速度计算器', shortTitle: '工作速度', status: 'ready', moduleName: 'PT_WORK_SPEED_DOCK', accent: '#9df7ff', solarName: '水星', planetTexture: 'mercury', texturePath: TEXTURE_BASE + 'mercury.jpg', orbitDistance: 5.0, visualRadius: 0.18, orbitTilt: 0.01, orbitSpeedFactor: 1.58, startAngle: 0.68 },
        { id: 'settings', title: '设置', shortTitle: '设置', status: 'ready', moduleName: 'PT_STARCHART_SETTINGS_PANEL', accent: '#ffe8a6', solarName: '金星', planetTexture: 'venus', texturePath: TEXTURE_BASE + 'venus.jpg', orbitDistance: 7.1, visualRadius: 0.31, orbitTilt: 0.02, orbitSpeedFactor: 1.22, startAngle: 2.12, useCardShell: true },
        { id: 'breeding', title: '配种查询', shortTitle: '配种', status: 'placeholder', accent: '#ffb8da', solarName: '地球', planetTexture: 'earth', texturePath: TEXTURE_BASE + 'earth.jpg', orbitDistance: 9.5, visualRadius: 0.33, orbitTilt: 0, orbitSpeedFactor: 1.0, startAngle: 3.48, moons: [{ name: '月球', texturePath: TEXTURE_BASE + 'moon.jpg', radius: 0.09, distance: 0.78, speed: 0.018 }] },
        { id: 'skill', title: '技能', shortTitle: '技能', status: 'placeholder', accent: '#b7ffbd', solarName: '火星', planetTexture: 'mars', texturePath: TEXTURE_BASE + 'mars.jpg', orbitDistance: 12.2, visualRadius: 0.22, orbitTilt: 0.03, orbitSpeedFactor: 0.8, startAngle: 5.25 },
        { id: 'capture', title: '捕获概率', shortTitle: '捕获', status: 'placeholder', accent: '#ffd08a', solarName: '木星', planetTexture: 'jupiter', texturePath: TEXTURE_BASE + 'jupiter.jpg', orbitDistance: 17.2, visualRadius: 0.86, orbitTilt: 0.02, orbitSpeedFactor: 0.43, startAngle: 0.1, moons: [
            { name: '木卫一', texturePath: TEXTURE_BASE + 'io.jpg', radius: 0.075, distance: 1.25, speed: 0.024, startAngle: 0.4 },
            { name: '木卫二', texturePath: TEXTURE_BASE + 'europa.jpg', radius: 0.068, distance: 1.52, speed: 0.018, startAngle: 1.7 },
            { name: '木卫三', texturePath: TEXTURE_BASE + 'ganymede.jpg', radius: 0.108, distance: 1.88, speed: 0.013, startAngle: 2.8 },
            { name: '木卫四', texturePath: TEXTURE_BASE + 'callisto.jpg', radius: 0.1, distance: 2.22, speed: 0.01, startAngle: 4.1 }
        ] },
        { id: 'paldex', title: '帕鲁图鉴', shortTitle: '图鉴', status: 'placeholder', accent: '#b6c6ff', solarName: '土星', planetTexture: 'saturn', texturePath: TEXTURE_BASE + 'saturn.jpg', orbitDistance: 22.6, visualRadius: 0.74, orbitTilt: 0.04, orbitSpeedFactor: 0.32, startAngle: 2.78, ringSystem: 'saturn', ringTexturePath: TEXTURE_BASE + 'saturn-ring.png', moons: [
            { name: '泰坦', texturePath: TEXTURE_BASE + 'titan.jpg', radius: 0.105, distance: 1.95, speed: 0.011, startAngle: 1.25 }
        ] },
        { id: 'items', title: '物品图鉴', shortTitle: '物品', status: 'placeholder', accent: '#d7b6ff', solarName: '天王星', planetTexture: 'uranus', texturePath: TEXTURE_BASE + 'uranus.jpg', orbitDistance: 27.8, visualRadius: 0.46, orbitTilt: 0.06, orbitSpeedFactor: 0.23, startAngle: 4.1, ringSystem: 'thin' },
        { id: 'map', title: '地图指南', shortTitle: '地图', status: 'placeholder', accent: '#8dffd7', solarName: '海王星', planetTexture: 'neptune', texturePath: TEXTURE_BASE + 'neptune.jpg', orbitDistance: 32.8, visualRadius: 0.45, orbitTilt: 0.05, orbitSpeedFactor: 0.18, startAngle: 5.82 }
    ];

    function clampNumber(value, fallback, min, max) {
        var num = parseFloat(value);
        if (!isFinite(num)) num = fallback;
        return Math.max(min, Math.min(max, num));
    }

    function normalizeSettings(settings) {
        var next = Object.assign({}, DEFAULT_SETTINGS, settings || {});
        next.starDensity = clampNumber(next.starDensity, DEFAULT_SETTINGS.starDensity, 16, 160);
        next.orbitSpeed = clampNumber(next.orbitSpeed, DEFAULT_SETTINGS.orbitSpeed, 10, 140);
        next.planetSize = clampNumber(next.planetSize, DEFAULT_SETTINGS.planetSize, 60, 160);
        next.orbitSpacing = clampNumber(next.orbitSpacing, DEFAULT_SETTINGS.orbitSpacing, 72, 140);
        next.glowIntensity = clampNumber(next.glowIntensity, DEFAULT_SETTINGS.glowIntensity, 0, 140);
        next.sunlightIntensity = clampNumber(next.sunlightIntensity, DEFAULT_SETTINGS.sunlightIntensity, 20, 160);
        next.cameraMotion = clampNumber(next.cameraMotion, DEFAULT_SETTINGS.cameraMotion, 0, 140);
        next.labelVisible = next.labelVisible !== false;
        next.orbitVisible = next.orbitVisible !== false;
        next.reduceMotion = next.reduceMotion === true;
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
        TEXTURE_BASE: TEXTURE_BASE,
        normalizeSettings: normalizeSettings,
        readSettings: readSettings,
        writeSettings: writeSettings,
        getTools: getTools,
        getTool: getTool
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PT_STARCHART_CONFIG: PT_STARCHART_CONFIG };
}
if (typeof window !== 'undefined') {
    window.PT_STARCHART_CONFIG = PT_STARCHART_CONFIG;
}
