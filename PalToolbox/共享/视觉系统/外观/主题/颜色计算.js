// ═══════════════ 颜色计算.js — 颜色计算引擎 ═══════════════
// 色彩空间转换 + 渐变生成 + 每色标独立调色
// 依赖：PT_COLOR_ENGINE（取色器引擎.js）必须在此之前加载

function PT_hexToRgb(hex) {
    var clean = String(hex || '#061626').replace('#', '');
    if (clean.length !== 6) clean = '061626';
    return {
        r: parseInt(clean.slice(0, 2), 16) || 0,
        g: parseInt(clean.slice(2, 4), 16) || 0,
        b: parseInt(clean.slice(4, 6), 16) || 0
    };
}

function PT_rgbToHex(rgb) {
    function part(v) {
        var n = Math.max(0, Math.min(255, Math.round(v)));
        return n.toString(16).padStart(2, '0');
    }
    return '#' + part(rgb.r) + part(rgb.g) + part(rgb.b);
}

function PT_saturateRgb(rgb, sat) {
    var s = sat == null ? 1 : sat;
    var gray = rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114;
    return {
        r: gray + (rgb.r - gray) * s,
        g: gray + (rgb.g - gray) * s,
        b: gray + (rgb.b - gray) * s
    };
}

function PT_brightenRgb(rgb, brightness) {
    var b = brightness == null ? 1 : brightness;
    return {
        r: Math.max(0, Math.min(255, rgb.r * b)),
        g: Math.max(0, Math.min(255, rgb.g * b)),
        b: Math.max(0, Math.min(255, rgb.b * b))
    };
}

// ═══ 渐变解析器：从渐变字符串提取角度、色标颜色、透明度、位置 ═══
function PT_parseGradient(gradientStr) {
    if (!gradientStr) return null;
    var gradMatch = gradientStr.match(/^(linear|radial|conic)-gradient\((.+)\)$/i);
    if (!gradMatch) return null;
    var type = gradMatch[1].toLowerCase();
    var inner = gradMatch[2];

    var firstColorIdx = inner.search(/rgba?\(/i);
    if (firstColorIdx < 0) return null;
    var prefix = inner.substring(0, firstColorIdx).replace(/,\s*$/, '').trim();
    var angle = 145;
    var degMatch = prefix.match(/(\d+)deg/);
    if (degMatch) angle = parseInt(degMatch[1]);

    var stopsStr = inner.substring(firstColorIdx);
    var stops = [];
    var colorRegex = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([0-9.]+))?\)/g;
    var m;
    while ((m = colorRegex.exec(stopsStr)) !== null) {
        var colorEnd = m.index + m[0].length;
        var remaining = stopsStr.substring(colorEnd);
        var nextColorIdx = remaining.search(/rgba?\(/i);
        var posStr = nextColorIdx >= 0 ? remaining.substring(0, nextColorIdx) : remaining;
        posStr = posStr.replace(/^[,\s]+/, '').replace(/[,\s]+$/, '').trim();
        var pos = posStr ? parseFloat(posStr) : null;
        stops.push({
            r: Number(m[1]), g: Number(m[2]), b: Number(m[3]),
            a: m[4] != null ? Number(m[4]) : 1,
            pos: pos
        });
    }
    return { type: type, angle: angle, stops: stops };
}

window.PT_themeToCardPalette = function PT_themeToCardPalette(theme) {
    var gradientStr = theme && theme.cardBgGlass;
    var parsed = PT_parseGradient(gradientStr) || PT_parseGradient(theme && theme.cardBgGlass) || PT_parseGradient(theme && theme.cardBgSolid);
    if (!parsed || !parsed.stops.length) {
        return { angle: 145, sat: 1, brightness: 1, sourceTheme: theme && theme.id ? theme.id : '',
            stops: [
                { c: '#061626', a: 0.82, pos: 0, exposure: 100, contrast: 100, vibrance: 100, temperature: 100, tint: 100 },
                { c: '#08101c', a: 0.68, pos: 48, exposure: 100, contrast: 100, vibrance: 100, temperature: 100, tint: 100 },
                { c: '#0c1622', a: 0.72, pos: 100, exposure: 100, contrast: 100, vibrance: 100, temperature: 100, tint: 100 }
            ], c1: '#061626', a1: 0.82, c2: '#08101c', a2: 0.68, c3: '#0c1622', a3: 0.72 };
    }
    var result = {
        angle: parsed.angle,
        sat: 1,
        brightness: 1,
        sourceTheme: theme && theme.id ? theme.id : '',
        stops: []
    };
    for (var i = 0; i < parsed.stops.length; i++) {
        var s = parsed.stops[i];
        result.stops.push({
            c: PT_rgbToHex({ r: s.r, g: s.g, b: s.b }),
            a: s.a,
            pos: s.pos != null ? s.pos : Math.round((i / Math.max(1, parsed.stops.length - 1)) * 100),
            exposure: 100, contrast: 100, vibrance: 100, temperature: 100, tint: 100
        });
    }
    if (result.stops.length >= 3) {
        result.c1 = result.stops[0].c; result.a1 = result.stops[0].a;
        result.c2 = result.stops[1].c; result.a2 = result.stops[1].a;
        result.c3 = result.stops[2].c; result.a3 = result.stops[2].a;
    } else if (result.stops.length > 0) {
        result.c1 = result.stops[0].c; result.a1 = result.stops[0].a;
        result.c2 = result.stops[0].c; result.a2 = result.stops[0].a;
        result.c3 = result.stops[0].c; result.a3 = result.stops[0].a;
    }
    return result;
};

// ═══ 渐变生成（支持任意数量色标 + 每色标独立调色） ═══
window.PT_buildCardPaletteGradient = function PT_buildCardPaletteGradient(palette, solidMode) {
    var p = palette || {};
    var E = window.PT_COLOR_ENGINE || {};

    function correctRgb(rgb, stop) {
        // 每色标独立调色：优先读色标上的参数，没有则读全局参数
        var exposure = stop.exposure != null ? stop.exposure : p.exposure;
        var contrast = stop.contrast != null ? stop.contrast : p.contrast;
        var vibrance = stop.vibrance != null ? stop.vibrance : p.vibrance;
        var temperature = stop.temperature != null ? stop.temperature : p.temperature;
        var tint = stop.tint != null ? stop.tint : p.tint;

        if (exposure != null && E.applyExposure) {
            rgb = E.applyExposure(rgb, exposure);
        }
        if (contrast != null && E.applyContrast) {
            rgb = E.applyContrast(rgb, contrast, 128, 128, 128);
        }
        if (vibrance != null && E.rgbToHsv && E.applyVibrance) {
            var hsv = E.rgbToHsv(rgb.r, rgb.g, rgb.b);
            rgb = E.applyVibrance(rgb, hsv, vibrance);
        }
        if (temperature != null && E.applyTemperature) {
            rgb = E.applyTemperature(rgb, temperature);
        }
        if (tint != null && E.applyTint) {
            rgb = E.applyTint(rgb, tint);
        }
        return rgb;
    }

    if (p.stops && p.stops.length) {
        var stopsToUse = E.applyHighlight ? E.applyHighlight(p.stops, p.highlight || 0) : p.stops;
        stopsToUse = E.applyEasing ? E.applyEasing(stopsToUse, p.easing || 'linear') : stopsToUse;
        var parts = stopsToUse.map(function(s, i) {
            var a = s.a != null ? s.a : 1;
            var rgb = PT_brightenRgb(PT_saturateRgb(PT_hexToRgb(s.c || '#888888'), p.sat == null ? 1 : p.sat), p.brightness == null ? 1 : p.brightness);
            rgb = correctRgb(rgb, s);
            return 'rgba(' + Math.round(rgb.r) + ', ' + Math.round(rgb.g) + ', ' + Math.round(rgb.b) + ', ' + a + ') ' + (s.pos != null ? s.pos : Math.round(i / Math.max(1, p.stops.length - 1) * 100)) + '%';
        });
        if (p.splitHighlight && p.splitShadow && p.splitBalance != null) {
            var hiRgb = PT_hexToRgb(p.splitHighlight);
            var shRgb = PT_hexToRgb(p.splitShadow);
            parts.unshift('rgba(' + shRgb.r + ',' + shRgb.g + ',' + shRgb.b + ',0.5) 0%');
            parts.push('rgba(' + hiRgb.r + ',' + hiRgb.g + ',' + hiRgb.b + ',0.5) 100%');
        }
        var gradType = p.gradientType || 'linear';
        if (gradType === 'radial') {
            return 'radial-gradient(circle at 50% 50%, ' + parts.join(', ') + ')';
        } else if (gradType === 'conic') {
            return 'conic-gradient(from ' + (p.angle || 0) + 'deg, ' + parts.join(', ') + ')';
        }
        return 'linear-gradient(' + (p.angle || 145) + 'deg, ' + parts.join(', ') + ')';
    }
    var a1 = p.a1 != null ? p.a1 : 0.82;
    var a2 = p.a2 != null ? p.a2 : 0.68;
    var a3 = p.a3 != null ? p.a3 : 0.72;
    function rgba(hex, alpha) {
        var rgb = PT_brightenRgb(PT_saturateRgb(PT_hexToRgb(hex || '#061626'), p.sat == null ? 1 : p.sat), p.brightness == null ? 1 : p.brightness);
        rgb = correctRgb(rgb, { c: hex });
        var r = Math.round(rgb.r);
        var g = Math.round(rgb.g);
        var b = Math.round(rgb.b);
        return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
    }
    return 'linear-gradient(' + (p.angle || 145) + 'deg, ' + rgba(p.c1, a1) + ', ' + rgba(p.c2, a2) + ' 48%, ' + rgba(p.c3, a3) + ')';
};

window.PT_buildThemeFromCardPalette = function PT_buildThemeFromCardPalette(baseTheme, palette) {
    var base = baseTheme || {};
    var p = palette || {};
    var accent = PT_brightenRgb(PT_saturateRgb(PT_hexToRgb(p.c2 || p.c1 || '#5ad6ff'), p.sat == null ? 1 : p.sat), p.brightness == null ? 1 : p.brightness);
    var accentText = Math.round(accent.r) + ', ' + Math.round(accent.g) + ', ' + Math.round(accent.b);
    var accentHex = PT_rgbToHex(accent);
    var bg = window.PT_buildCardPaletteGradient(p, false);
    var solid = window.PT_buildCardPaletteGradient(p, true);
    return Object.assign({}, base, {
        cardBgGlass: bg,
        cardBgSolid: solid,
        cardBorder: 'rgba(' + accentText + ', 0.18)',
        cardGlow: 'rgba(' + accentText + ', 0.08)',
        cardBeam: 'linear-gradient(90deg, transparent, rgba(' + accentText + ', 0.78), rgba(255, 255, 255, 0.20), transparent)',
        cardBeamGlow: 'rgba(' + accentText + ', 0.30)',
        headerBg: 'linear-gradient(180deg, rgba(' + accentText + ', 0.075), rgba(255, 255, 255, 0.014)), linear-gradient(90deg, rgba(' + accentText + ', 0.07), rgba(255,255,255,0.02))',
        headerBorder: 'rgba(' + accentText + ', 0.14)',
        panelBg: 'rgba(' + accentText + ', 0.055)',
        panelBorder: 'rgba(' + accentText + ', 0.095)',
        inputBg: 'rgba(6, 12, 20, 0.70)',
        inputFocus: 'rgba(' + accentText + ', 0.60)',
        inputAccent: accentText,
        badgeBg: 'linear-gradient(135deg, ' + accentHex + ', rgba(' + accentText + ', 0.72))',
        toggleChecked: 'linear-gradient(135deg, ' + accentHex + ', rgba(' + accentText + ', 0.66))',
        toggleCheckedBorder: 'rgba(' + accentText + ', 0.34)',
        toggleGlow: 'rgba(' + accentText + ', 0.22)'
    });
};

// ═══ 给现成渐变字符串施加反差调整 ═══
// contrast: 0-100，50=不变，<50 扁平，>50 拉大反差
window.PT_applyContrastToGradient = function PT_applyContrastToGradient(gradientStr, contrast) {
    if (!gradientStr || contrast == null || contrast === 50) return gradientStr;
    var E = window.PT_COLOR_ENGINE || {};
    if (!E.applyContrast) return gradientStr;

    var gradMatch = gradientStr.match(/^(linear|radial|conic)-gradient\((.+)\)$/i);
    if (!gradMatch) return gradientStr;
    var type = gradMatch[1].toLowerCase();
    var inner = gradMatch[2];

    var firstColorIdx = inner.search(/rgba?\(/i);
    if (firstColorIdx < 0) return gradientStr;
    var prefix = inner.substring(0, firstColorIdx).replace(/,\s*$/, '').trim();
    var stopsStr = inner.substring(firstColorIdx);

    var stops = [];
    var colorRegex = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([0-9.]+))?\)/g;
    var m;
    while ((m = colorRegex.exec(stopsStr)) !== null) {
        var colorEnd = m.index + m[0].length;
        var remaining = stopsStr.substring(colorEnd);
        var nextColorIdx = remaining.search(/rgba?\(/i);
        var posStr = nextColorIdx >= 0 ? remaining.substring(0, nextColorIdx) : remaining;
        posStr = posStr.replace(/^[,\s]+/, '').replace(/[,\s]+$/, '').trim();
        stops.push({
            r: Number(m[1]), g: Number(m[2]), b: Number(m[3]),
            a: m[4] != null ? Number(m[4]) : 1,
            pos: posStr
        });
    }
    if (stops.length === 0) return gradientStr;

    var midR = 0, midG = 0, midB = 0;
    for (var i = 0; i < stops.length; i++) {
        midR += stops[i].r; midG += stops[i].g; midB += stops[i].b;
    }
    midR /= stops.length; midG /= stops.length; midB /= stops.length;

    var ceContrast = contrast * 2;

    var parts = [];
    for (var j = 0; j < stops.length; j++) {
        var s = stops[j];
        var adjusted = E.applyContrast({ r: s.r, g: s.g, b: s.b }, ceContrast, midR, midG, midB);
        var colorStr = s.a < 1
            ? 'rgba(' + Math.round(adjusted.r) + ', ' + Math.round(adjusted.g) + ', ' + Math.round(adjusted.b) + ', ' + s.a + ')'
            : 'rgb(' + Math.round(adjusted.r) + ', ' + Math.round(adjusted.g) + ', ' + Math.round(adjusted.b) + ')';
        parts.push(colorStr + (s.pos ? ' ' + s.pos : ''));
    }

    return type + '-gradient(' + prefix + ', ' + parts.join(', ') + ')';
};

// ═══ 给渐变字符串施加整体透明度乘数 ═══
// opacity: 0-100，每个色标的 alpha 乘以 opacity/100
window.PT_applyOpacityToGradient = function PT_applyOpacityToGradient(gradientStr, opacity) {
    if (!gradientStr || opacity == null || opacity >= 100) return gradientStr;
    var factor = opacity / 100;
    return gradientStr
        .replace(/rgba\((\d+,\s*\d+,\s*\d+,\s*)([\d.]+)\)/g, function(m, prefix, alpha) {
            return 'rgba(' + prefix + (parseFloat(alpha) * factor).toFixed(3) + ')';
        })
        .replace(/rgb\((\d+,\s*\d+,\s*\d+)\)/g, function(m, rgb) {
            return 'rgba(' + rgb + ', ' + factor.toFixed(3) + ')';
        });
};
