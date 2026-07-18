var PT_SPACE_CONFIG = (function() {
    var SETTINGS_KEY = 'pt-space-settings-v1';

    var DEFAULT_SETTINGS = {
        particleDensity: 88,
        particleSize: 2.6,
        glowStrength: 104,
        cameraMotion: 70,
        motionSpeed: 72,
        visualPreset: 0,
        bloomEnabled: true,
        shelfAutoHide: false,
        reduceMotion: false,
        coverImage: null
    };

    var TOOLS = [
        { id: 'calculator', title: '工作速度计算器', shortTitle: '工作速度', status: 'ready', moduleName: 'PT_WORK_SPEED_DOCK', accent: '#9df7ff', useDockCard: true },
        { id: 'settings', title: '设置', shortTitle: '设置', status: 'ready', moduleName: 'PT_SPACE_SETTINGS_PANEL', accent: '#ffe8a6', useCardShell: true },
        { id: 'breeding', title: '配种查询', shortTitle: '配种', status: 'placeholder', accent: '#ffb8da' },
        { id: 'skill', title: '技能', shortTitle: '技能', status: 'placeholder', accent: '#b7ffbd' },
        { id: 'capture', title: '捕获概率', shortTitle: '捕获', status: 'placeholder', accent: '#ffd08a' },
        { id: 'paldex', title: '帕鲁图鉴', shortTitle: '图鉴', status: 'placeholder', accent: '#b6c6ff' },
        { id: 'items', title: '物品图鉴', shortTitle: '物品', status: 'placeholder', accent: '#d7b6ff' },
        { id: 'map', title: '地图指南', shortTitle: '地图', status: 'placeholder', accent: '#8dffd7' }
    ];

    var VISUAL_PRESETS = [
        { id: 0, name: '丝绸', description: 'Perlin噪声驱动的柔和涟漪波动' },
        { id: 1, name: '隧道', description: '环形扭曲，粒子沿螺旋轨道运动' },
        { id: 2, name: '虚空', description: '空间膨胀效果，粒子向外扩散' },
        { id: 3, name: '银河', description: '多层轨道旋转，模拟星系运动' },
        { id: 4, name: '脉冲', description: '节拍响应式跳动，粒子随能量起伏' }
    ];

    function clampNumber(value, fallback, min, max) {
        var num = parseFloat(value);
        if (!isFinite(num)) num = fallback;
        return Math.min(max, Math.max(min, num));
    }

    function normalizeSettings(settings) {
        var next = Object.assign({}, DEFAULT_SETTINGS, settings || {});
        next.particleDensity = clampNumber(next.particleDensity, DEFAULT_SETTINGS.particleDensity, 16, 160);
        next.particleSize = clampNumber(next.particleSize, DEFAULT_SETTINGS.particleSize, 0.8, 6);
        next.glowStrength = clampNumber(next.glowStrength, DEFAULT_SETTINGS.glowStrength, 0, 140);
        next.cameraMotion = clampNumber(next.cameraMotion, DEFAULT_SETTINGS.cameraMotion, 0, 140);
        next.motionSpeed = clampNumber(next.motionSpeed, DEFAULT_SETTINGS.motionSpeed, 10, 140);
        next.visualPreset = clampNumber(next.visualPreset, DEFAULT_SETTINGS.visualPreset, 0, 4);
        next.bloomEnabled = next.bloomEnabled !== false;
        next.floatEnabled = next.floatEnabled !== false;
        next.shelfAutoHide = next.shelfAutoHide === true;
        next.reduceMotion = next.reduceMotion === true;
        next.coverImage = next.coverImage || null;
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

    function getPresets() {
        return VISUAL_PRESETS.map(function(p) { return Object.assign({}, p); });
    }

    return {
        SETTINGS_KEY: SETTINGS_KEY,
        DEFAULT_SETTINGS: DEFAULT_SETTINGS,
        normalizeSettings: normalizeSettings,
        readSettings: readSettings,
        writeSettings: writeSettings,
        getTools: getTools,
        getTool: getTool,
        getPresets: getPresets
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PT_SPACE_CONFIG: PT_SPACE_CONFIG };
}
if (typeof window !== 'undefined') {
    window.PT_SPACE_CONFIG = PT_SPACE_CONFIG;
}
