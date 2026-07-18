window.PT_WALLPAPER_PRESETS = [
    { id: 'image-bg', label: '默认壁纸', type: 'image', src: '../游戏内容/幻兽帕鲁/资源包/壁纸/bg.jpg' },
    { id: 'image-01', label: '帕鲁蓝天', type: 'image', src: '../游戏内容/幻兽帕鲁/资源包/壁纸/palworld-wallpaper-01.png' },
    { id: 'image-02', label: '森林据点', type: 'image', src: '../游戏内容/幻兽帕鲁/资源包/壁纸/palworld-wallpaper-02.png' },
    { id: 'title-bg', label: '标题背景', type: 'image', src: '../游戏内容/幻兽帕鲁/资源包/壁纸/T_title_BG.png' }
];

window.PT_applyWallpaper = function applyPTWallpaper(settings) {
    var next = settings || {};
    var body = document.body;
    var themes = window.PT_THEME_PRESETS || {};
    var brightness = parseFloat(next.wallpaperBrightness);
    if (!isFinite(brightness)) brightness = 1;
    brightness = Math.max(0, Math.min(2, brightness));

    body.style.backgroundImage = '';
    body.style.backgroundColor = '';
    body.style.setProperty('--pt-wallpaper-brightness-overlay', brightness >= 1 ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 0, 0, 1)');
    body.style.setProperty('--pt-wallpaper-brightness-opacity', String(Math.abs(brightness - 1)));

    if (next.wallpaper === 'theme-color' && next.wallpaperTheme) {
        var themeObj = themes[next.wallpaperTheme];
        if (themeObj) {
            body.style.backgroundImage = themeObj.background;
        }
        return;
    }

    if (next.wallpaper === 'custom' && next.wallpaperCustom) {
        body.style.backgroundImage = 'url(' + next.wallpaperCustom + ')';
        body.style.backgroundSize = 'cover';
        body.style.backgroundPosition = 'center';
        return;
    }

    var presets = window.PT_WALLPAPER_PRESETS || [];
    var match = presets.find(function(p) { return p.id === next.wallpaper; });
    if (!match) return;

    if (match.type === 'image') {
        body.style.backgroundImage = 'url(' + match.src + ')';
        body.style.backgroundSize = 'cover';
        body.style.backgroundPosition = 'center';
    } else if (match.type === 'color') {
        body.style.backgroundColor = match.color;
        body.style.backgroundImage = 'none';
    }
};
