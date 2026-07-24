// ═══════════════ 视觉总调度.js — 主题 + 材质 统一应用入口 ═══════════════
// 读设置 → 解析主题和材质 → 写 CSS 变量 → 所有材质走同一条路（无 metal 分支）

window.PT_getLayeredCardAppearanceSettings = function PT_getLayeredCardAppearanceSettings(settings) {
    var next = settings || {};
    var frameTheme = next.cardBackgroundTheme || 'theme:oceanic';
    var frameMaterial = next.cardMaterial || next.glassMode || 'gradient';
    var useSmallCardAppearance = next.smallCardAppearanceEnabled === true;
    return {
        frameTheme: frameTheme,
        frameMaterial: frameMaterial,
        cubeTheme: useSmallCardAppearance ? (next.smallCardTheme || 'theme:oceanic') : frameTheme,
        cubeMaterial: useSmallCardAppearance ? (next.smallCardMaterial || 'smallTranslucent') : frameMaterial
    };
};

// ── 磁吸/吸附辅助函数（保留，其他模块依赖） ──
window.PT_getCardSnapMode = function PT_getCardSnapMode(settings) {
    return window.PT_getScreenSnapMode(settings);
};

window.PT_getScreenSnapMode = function PT_getScreenSnapMode(settings) {
    var next = settings || (typeof window.readPTSettings === 'function' ? window.readPTSettings() : {});
    var value = next.screenSnapMode != null ? next.screenSnapMode : next.cardSnapMode;
    return value === 'off' ? 'off' : 'codex';
};

window.PT_getCardMagnetMode = function PT_getCardMagnetMode(settings) {
    var next = settings || (typeof window.readPTSettings === 'function' ? window.readPTSettings() : {});
    var v = next.cardMagnetMode;
    if (v === 'off') return 'off';
    if (v === 'normal') return 'normal';
    return 'physics';
};

window.PT_getScreenSnapPreview = function PT_getScreenSnapPreview(settings) {
    var next = settings || (typeof window.readPTSettings === 'function' ? window.readPTSettings() : {});
    return next.screenSnapPreview !== false;
};

window.PT_getMagnetPreview = function PT_getMagnetPreview(settings) {
    var next = settings || (typeof window.readPTSettings === 'function' ? window.readPTSettings() : {});
    return next.magnetPreview !== false;
};

window.PT_getMagnetAlign = function PT_getMagnetAlign(settings) {
    var next = settings || (typeof window.readPTSettings === 'function' ? window.readPTSettings() : {});
    return next.magnetAlign !== false;
};

window.PT_getMagnetBreakForce = function PT_getMagnetBreakForce(settings) {
    var next = settings || (typeof window.readPTSettings === 'function' ? window.readPTSettings() : {});
    var v = parseFloat(next.magnetBreakForce);
    if (!isFinite(v) || v < 0.5) v = 2.5;
    if (v > 10) v = 10;
    return v;
};

window.PT_getMagnetSnapSpeed = function PT_getMagnetSnapSpeed(settings) {
    var next = settings || (typeof window.readPTSettings === 'function' ? window.readPTSettings() : {});
    var v = parseFloat(next.magnetSnapSpeed);
    if (!isFinite(v) || v < 0.1) v = 0.8;
    if (v > 3) v = 3;
    return v;
};

window.PT_getMagnetSnapDistance = function PT_getMagnetSnapDistance(settings) {
    var v = window.PT_getMagnetSnapSpeed(settings);
    var d = Math.round(v * 32);
    if (d < 8) d = 8;
    if (d > 80) d = 80;
    return d;
};

// ── 主题解析：把选择值解析成主题对象 ──
window.PT_resolveCardThemePreset = function PT_resolveCardThemePreset(settings, value, fallbackTheme) {
    var next = settings || {};
    var themes = window.PT_THEME_PRESETS || {};
    var fallback = fallbackTheme || themes.oceanic || {};
    var selected = value && value !== 'global' ? value : 'theme:' + ((fallback && fallback.id) || next.theme || 'oceanic');
    if (selected.indexOf('custom:') === 0) {
        var name = selected.slice(7);
        var preset = (next.cardThemePresets || {})[name];
        if (preset) return { type: 'custom', id: selected, label: name, palette: preset, theme: window.PT_buildThemeFromCardPalette(fallback, preset) };
    }
    if (selected.indexOf('theme:') === 0) {
        var themeId = selected.slice(6);
        return { type: 'theme', id: selected, label: (themes[themeId] || fallback).label || themeId, theme: themes[themeId] || fallback };
    }
    return { type: 'theme', id: 'theme:oceanic', label: (themes.oceanic || fallback).label || '默认主题', theme: themes.oceanic || fallback };
};

// ── 材质解析：把选择值解析成材质对象 ──
window.PT_resolveCardMaterialPreset = function PT_resolveCardMaterialPreset(settings, value) {
    var next = settings || {};
    var builtins = window.PT_MATERIAL_PRESETS || {};
    var selected = value || next.cardMaterial || next.glassMode || 'gradient';
    if (selected.indexOf && selected.indexOf('custom:') === 0) {
        var name = selected.slice(7);
        var preset = (next.cardMaterialPresets || {})[name];
        if (preset) return preset;
    }
    return builtins[selected] || builtins.gradient;
};

function PT_buildWoodTexture(material) {
    var m = material || {};
    var strength = Math.max(0, Math.min(100, m.woodStrength != null ? m.woodStrength : 0));
    if (strength <= 0) return 'none';
    var style = m.woodStyle || 'straight';
    var density = Math.max(0, Math.min(100, m.woodDensity != null ? m.woodDensity : 50));
    var ring = Math.max(0, Math.min(100, m.woodRing != null ? m.woodRing : 0));
    var knot = Math.max(0, Math.min(100, m.woodKnot != null ? m.woodKnot : 0));
    var angle = Math.max(0, Math.min(180, m.woodAngle != null ? m.woodAngle : 96));
    var light = m.woodLight || '216,150,78';
    var mid = m.woodMid || '116,64,30';
    var dark = m.woodDark || '52,28,14';
    var s = strength / 100;
    var fineGap = Math.max(4, Math.round(14 - density / 10));
    var broadGap = Math.max(18, Math.round(44 - density / 3));
    var ringAlpha = (0.18 * s * ring / 100).toFixed(3);
    var knotAlpha = (0.24 * s * knot / 100).toFixed(3);
    var fineAlpha = (0.12 * s).toFixed(3);
    var broadAlpha = (0.18 * s).toFixed(3);
    var warmAlpha = (0.16 * s).toFixed(3);
    var base = [
        'linear-gradient(' + (angle - 90) + 'deg, rgba(' + light + ',' + warmAlpha + '), rgba(' + mid + ',' + (0.22 * s).toFixed(3) + ') 42%, rgba(' + dark + ',' + (0.18 * s).toFixed(3) + '))'
    ];
    if (style === 'wave') {
        return [
            'radial-gradient(ellipse at 26% 34%, rgba(' + light + ',' + knotAlpha + ') 0%, rgba(' + mid + ',' + (0.18 * s * knot / 100).toFixed(3) + ') 22%, transparent 42%)',
            'radial-gradient(ellipse at 78% 58%, rgba(' + dark + ',' + knotAlpha + ') 0%, rgba(' + mid + ',' + (0.16 * s * knot / 100).toFixed(3) + ') 18%, transparent 38%)',
            'repeating-radial-gradient(ellipse at 42% 50%, transparent 0px, transparent ' + Math.round(8 + ring / 3) + 'px, rgba(' + dark + ',' + (0.24 * s * ring / 100).toFixed(3) + ') ' + Math.round(11 + ring / 3) + 'px, transparent ' + Math.round(18 + ring / 2) + 'px)',
            'repeating-linear-gradient(' + (angle - 9) + 'deg, rgba(' + dark + ',' + (0.16 * s).toFixed(3) + ') 0px, rgba(' + dark + ',' + (0.16 * s).toFixed(3) + ') 2px, transparent 8px, rgba(' + light + ',' + (0.09 * s).toFixed(3) + ') 14px, transparent ' + Math.max(24, broadGap + 8) + 'px)',
            'repeating-linear-gradient(' + (angle + 13) + 'deg, transparent 0px, transparent 12px, rgba(' + mid + ',' + (0.20 * s).toFixed(3) + ') 18px, transparent ' + Math.max(30, broadGap + 14) + 'px)'
        ].concat(base).join(', ');
    }
    if (style === 'fine') {
        return [
            'repeating-linear-gradient(' + angle + 'deg, rgba(' + dark + ',' + (0.18 * s).toFixed(3) + ') 0px, rgba(' + dark + ',' + (0.18 * s).toFixed(3) + ') 1px, transparent 2px, transparent ' + Math.max(3, fineGap - 2) + 'px)',
            'repeating-linear-gradient(' + (angle + 2) + 'deg, rgba(' + light + ',' + (0.10 * s).toFixed(3) + ') 0px, transparent 1px, transparent ' + Math.max(5, fineGap + 1) + 'px)',
            'radial-gradient(ellipse at 64% 40%, rgba(' + dark + ',' + (0.12 * s * knot / 100).toFixed(3) + ') 0%, transparent 28%)',
            'linear-gradient(' + (angle + 90) + 'deg, rgba(' + light + ',' + (0.14 * s).toFixed(3) + '), transparent 34%, rgba(' + dark + ',' + (0.16 * s).toFixed(3) + ') 72%)'
        ].concat(base).join(', ');
    }
    if (style === 'dark') {
        return [
            'repeating-linear-gradient(' + angle + 'deg, rgba(' + light + ',' + (0.13 * s).toFixed(3) + ') 0px, transparent 1px, transparent ' + Math.max(3, fineGap - 3) + 'px)',
            'repeating-linear-gradient(' + (angle + 6) + 'deg, rgba(' + dark + ',' + (0.34 * s).toFixed(3) + ') 0px, rgba(' + dark + ',' + (0.34 * s).toFixed(3) + ') 4px, rgba(' + mid + ',' + (0.18 * s).toFixed(3) + ') 8px, transparent ' + Math.max(14, broadGap - 8) + 'px)',
            'radial-gradient(ellipse at 46% 56%, rgba(' + light + ',' + (0.08 * s * knot / 100).toFixed(3) + ') 0%, transparent 22%)',
            'linear-gradient(' + (angle - 90) + 'deg, rgba(' + dark + ',' + (0.36 * s).toFixed(3) + '), rgba(' + mid + ',' + (0.12 * s).toFixed(3) + ') 48%, rgba(' + dark + ',' + (0.42 * s).toFixed(3) + '))'
        ].concat(base).join(', ');
    }
    return [
        'radial-gradient(ellipse at 26% 34%, rgba(' + light + ',' + knotAlpha + ') 0%, rgba(' + mid + ',' + (0.14 * s * knot / 100).toFixed(3) + ') 18%, transparent 34%)',
        'repeating-linear-gradient(' + angle + 'deg, rgba(' + dark + ',' + fineAlpha + ') 0px, rgba(' + dark + ',' + fineAlpha + ') 1px, transparent 2px, transparent ' + Math.max(8, fineGap + 4) + 'px)',
        'repeating-linear-gradient(' + (angle + 1) + 'deg, rgba(' + light + ',' + (0.12 * s).toFixed(3) + ') 0px, rgba(' + light + ',' + (0.12 * s).toFixed(3) + ') 3px, rgba(' + mid + ',' + broadAlpha + ') 9px, transparent ' + Math.max(34, broadGap + 12) + 'px)'
    ].concat(base).join(', ');
}

function PT_buildMetalTexture(material) {
    var m = material || {};
    var type = m.metalTexture || '';
    var strength = Math.max(0, Math.min(100, m.metalTextureStrength != null ? m.metalTextureStrength : 0));
    if (!type || strength <= 0) return 'none';
    var density = Math.max(0, Math.min(100, m.metalTextureDensity != null ? m.metalTextureDensity : 50));
    var angle = Math.max(0, Math.min(180, m.metalTextureAngle != null ? m.metalTextureAngle : 100));
    var sharp = Math.max(0, Math.min(100, m.metalReflectionSharpness != null ? m.metalReflectionSharpness : 0));
    var s = strength / 100;
    var gap = Math.max(3, Math.round(14 - density / 9));
    var fine = (0.16 * s).toFixed(3);
    var bright = (0.18 * s * (0.35 + sharp / 120)).toFixed(3);
    var dark = (0.20 * s).toFixed(3);
    if (type === 'mirror') {
        return [
            'linear-gradient(' + angle + 'deg, transparent 0%, rgba(255,255,255,' + bright + ') 34%, transparent 42%, rgba(0,0,0,' + (0.12 * s).toFixed(3) + ') 58%, transparent 72%)',
            'linear-gradient(' + (angle + 90) + 'deg, rgba(255,255,255,' + (0.10 * s).toFixed(3) + '), transparent 22%, rgba(0,0,0,' + (0.08 * s).toFixed(3) + ') 82%)'
        ].join(', ');
    }
    if (type === 'matte') {
        return [
            'repeating-linear-gradient(' + angle + 'deg, rgba(255,255,255,' + (0.08 * s).toFixed(3) + ') 0px, transparent 1px, transparent ' + gap + 'px)',
            'radial-gradient(ellipse at 42% 44%, rgba(255,255,255,' + (0.08 * s).toFixed(3) + '), transparent 46%)'
        ].join(', ');
    }
    if (type === 'oxidized') {
        return [
            'radial-gradient(circle at 24% 32%, rgba(0,0,0,' + (0.20 * s).toFixed(3) + ') 0%, transparent 18%)',
            'radial-gradient(circle at 72% 64%, rgba(255,255,255,' + (0.08 * s).toFixed(3) + ') 0%, transparent 16%)',
            'repeating-linear-gradient(' + (angle + 11) + 'deg, rgba(0,0,0,' + dark + ') 0px, transparent 3px, transparent ' + Math.max(8, gap + 6) + 'px)'
        ].join(', ');
    }
    if (type === 'soft') {
        return [
            'repeating-linear-gradient(' + angle + 'deg, rgba(255,255,255,' + (0.10 * s).toFixed(3) + ') 0px, transparent 2px, transparent ' + Math.max(8, gap + 5) + 'px)',
            'linear-gradient(' + (angle - 90) + 'deg, transparent, rgba(255,255,255,' + (0.08 * s).toFixed(3) + ') 48%, transparent)'
        ].join(', ');
    }
    return [
        'repeating-linear-gradient(' + angle + 'deg, rgba(255,255,255,' + fine + ') 0px, rgba(255,255,255,' + fine + ') 1px, transparent 2px, transparent ' + gap + 'px)',
        'repeating-linear-gradient(' + (angle + 2) + 'deg, rgba(0,0,0,' + (0.12 * s).toFixed(3) + ') 0px, transparent 1px, transparent ' + Math.max(5, gap + 3) + 'px)',
        'linear-gradient(' + (angle - 90) + 'deg, rgba(255,255,255,' + bright + '), transparent 38%, rgba(0,0,0,' + (0.10 * s).toFixed(3) + '))'
    ].join(', ');
}

// ── 主应用函数：统一流程，所有材质走同一条路 ──
window.PT_buildCardVisualVars = function PT_buildCardVisualVars(settings, themeSelection, materialSelection, fallbackTheme) {
    var next = settings || {};
    var themes = window.PT_THEME_PRESETS || {};
    var fallback = fallbackTheme || themes[next.theme] || themes.oceanic || {};
    var cardTheme = window.PT_resolveCardThemePreset(next, themeSelection, fallback);
    var cardMaterial = window.PT_resolveCardMaterialPreset(next, materialSelection || 'gradient');
    var themeObj = cardTheme.theme || fallback;
    var cardBg = cardTheme.type === 'custom'
        ? window.PT_buildCardPaletteGradient(cardTheme.palette)
        : themeObj.cardBgGlass;
    var contrastVal = cardMaterial.contrast != null ? cardMaterial.contrast : 50;
    if (contrastVal !== 50 && typeof window.PT_applyContrastToGradient === 'function') {
        cardBg = window.PT_applyContrastToGradient(cardBg, contrastVal);
    }
    var glassOpacity = cardMaterial.glassOpacity != null ? cardMaterial.glassOpacity : 100;
    if (glassOpacity < 100 && typeof window.PT_applyOpacityToGradient === 'function') {
        cardBg = window.PT_applyOpacityToGradient(cardBg, glassOpacity);
    }
    var highlight = cardMaterial.highlight != null ? cardMaterial.highlight : 0;
    var beforeBackground = 'none';
    var beforeOpacity = '0';
    if (highlight > 0) {
        beforeBackground = 'linear-gradient(120deg, transparent 0%, rgba(255,255,255,' + (highlight / 100).toFixed(3) + ') 36%, transparent 48%)';
        beforeOpacity = '0.75';
    }
    var glassGlow = cardMaterial.glassGlow != null ? cardMaterial.glassGlow : 0;
    var glassGlowShadow = 'none';
    if (glassGlow > 0) {
        var glowScale = glassGlow / 100;
        glassGlowShadow = 'inset 0 0 ' + Math.round(30 * glowScale) + 'px ' + Math.round(12 * glowScale) + 'px rgba(255,255,255,' + (0.06 * glowScale).toFixed(3) + ')';
    }
    var innerShadow = cardMaterial.innerShadow != null ? cardMaterial.innerShadow : 0;
    var metalShadow = 'none';
    if (innerShadow > 0) {
        var innerScale = innerShadow / 100;
        var thickness = cardMaterial.innerShadowThickness != null ? cardMaterial.innerShadowThickness : 0;
        var t = Math.max(0, Math.min(1, thickness / 100));
        var shOffset = Math.round(t * 36);
        var shBlur = Math.round(t * 48);
        var innerRingWidth = Math.round(t * 12);
        var innerTop = 'inset 0 ' + shOffset + 'px ' + shBlur + 'px 0px rgba(255,255,255,' + (0.65 * innerScale).toFixed(3) + ')';
        var innerBottom = 'inset 0 -' + shOffset + 'px ' + shBlur + 'px 0px rgba(0,0,0,' + (0.45 * innerScale).toFixed(3) + ')';
        var innerRing = innerRingWidth > 0 ? (', inset 0 0 0 ' + innerRingWidth + 'px rgba(255,255,255,' + (0.25 * innerScale).toFixed(3) + ')') : '';
        metalShadow = innerTop + ', ' + innerBottom + innerRing;
    }
    return {
        bg: cardBg,
        solidBg: themeObj.cardBgSolid,
        border: themeObj.cardBorder || themeObj.panelBorder,
        glow: themeObj.cardGlow || themeObj.cardBeamGlow,
        beam: themeObj.cardBeam,
        beamGlow: themeObj.cardBeamGlow,
        metalTexture: PT_buildMetalTexture(cardMaterial),
        woodTexture: PT_buildWoodTexture(cardMaterial),
        blur: (cardMaterial.blur != null ? cardMaterial.blur : 18) + 'px',
        saturate: String(cardMaterial.saturate != null ? cardMaterial.saturate : 1.22),
        brightness: String((cardMaterial.glassBrightness != null ? cardMaterial.glassBrightness : 100) / 100),
        contrast: String((cardMaterial.glassContrast != null ? cardMaterial.glassContrast : 100) / 100),
        hueRotate: (cardMaterial.glassHueRotate != null ? cardMaterial.glassHueRotate : 0) + 'deg',
        sheenOpacity: String((cardMaterial.sheen != null ? cardMaterial.sheen : 0) / 100),
        sheenAngle: (cardMaterial.sheenAngle != null ? cardMaterial.sheenAngle : 135) + 'deg',
        beforeBackground: beforeBackground,
        beforeOpacity: beforeOpacity,
        glassGlowShadow: glassGlowShadow,
        metalShadow: metalShadow,
        bugBlur: (cardMaterial.bugBlur != null ? cardMaterial.bugBlur : 18) + 'px'
    };
};

window.PT_applyVisualPrefs = function applyPTVisualPrefs(settings) {
    var next = settings || {};
    var themes = window.PT_THEME_PRESETS || {};
    var theme = themes[next.theme] || themes.oceanic;
    var cardTheme = window.PT_resolveCardThemePreset(next, next.cardBackgroundTheme, theme);
    var cardUiTheme = window.PT_resolveCardThemePreset(next, next.cardUiTheme, theme);
    var cardMaterial = window.PT_resolveCardMaterialPreset(next, next.cardMaterial || next.glassMode || 'gradient');
    var smallCardTheme = window.PT_resolveCardThemePreset(next, next.smallCardTheme || 'theme:oceanic', theme);
    var smallCardMaterial = window.PT_resolveCardMaterialPreset(next, next.smallCardMaterial || 'smallTranslucent');
    var cardThemeObj = cardTheme.theme || theme;
    var cardUiThemeObj = cardUiTheme.theme || theme;
    var smallCardThemeObj = smallCardTheme.theme || cardUiThemeObj;
    var cardVisual = window.PT_buildCardVisualVars(next, next.cardBackgroundTheme, next.cardMaterial || next.glassMode || 'gradient', theme);
    var root = document.documentElement.style;

    // ═══ 公共：背景 + UI 配色 CSS 变量 ═══
    root.setProperty('--pt-bg', theme.background);
    document.body.classList.toggle('pt-small-card-appearance-enabled', next.smallCardAppearanceEnabled === true);
    document.body.classList.toggle('pt-btn-style--classic', next.buttonStyle === 'classic');
    root.setProperty('--pt-scrollbar-thumb', cardUiThemeObj.scrollbarThumb);
    root.setProperty('--pt-scrollbar-thumb-hover', cardUiThemeObj.scrollbarThumbHover);
    root.setProperty('--pt-badge-bg', cardUiThemeObj.badgeBg);
    root.setProperty('--pt-badge-color', cardUiThemeObj.badgeColor);
    root.setProperty('--pt-badge-shadow', cardUiThemeObj.badgeShadow);
    root.setProperty('--pt-title-color', cardUiThemeObj.titleColor);
    root.setProperty('--pt-title-shadow', cardUiThemeObj.titleShadow);
    root.setProperty('--pt-instance-color', cardUiThemeObj.instanceColor);
    root.setProperty('--pt-input-color', cardUiThemeObj.inputColor);
    root.setProperty('--pt-input-focus', cardUiThemeObj.inputFocus);
    root.setProperty('--pt-input-accent', cardUiThemeObj.inputAccent);
    root.setProperty('--pt-toggle-track', cardUiThemeObj.toggleTrack);
    root.setProperty('--pt-toggle-track-border', cardUiThemeObj.toggleTrackBorder);
    root.setProperty('--pt-toggle-checked', cardUiThemeObj.toggleChecked);
    root.setProperty('--pt-toggle-checked-border', cardUiThemeObj.toggleCheckedBorder);
    root.setProperty('--pt-toggle-glow', cardUiThemeObj.toggleGlow);
    root.setProperty('--pt-result-value-color', cardUiThemeObj.resultValueColor);
    root.setProperty('--pt-header-bg', cardThemeObj.headerBg);
    root.setProperty('--pt-header-border', cardThemeObj.headerBorder);
    root.setProperty('--pt-panel-bg', cardUiThemeObj.panelBg);
    root.setProperty('--pt-panel-border', cardUiThemeObj.panelBorder);
    root.setProperty('--pt-input-bg', cardUiThemeObj.inputBg);

    // ═══ 玻璃参数 → CSS 变量 ═══
    var glassBlur = cardVisual.blur;
    var glassSat = cardVisual.saturate;
    root.setProperty('--pt-glass-blur', glassBlur);
    root.setProperty('--pt-glass-saturate', glassSat);
    root.setProperty('--pt-card-surface-blur', glassBlur);
    root.setProperty('--pt-card-surface-saturate', glassSat);

    // ═══ 卡片背景（永远来自主题，材质只做叠加调整） ═══
    var cardBg = cardVisual.bg;
    var cardSolidBg = cardVisual.solidBg;
    root.setProperty('--pt-card-metal-texture', cardVisual.metalTexture);
    root.setProperty('--pt-card-material-bg', cardBg);
    root.setProperty('--pt-card-bg-glass', cardBg);
    root.setProperty('--pt-card-bg-solid', cardSolidBg);
    root.setProperty('--pt-card-wood-texture', cardVisual.woodTexture);
    root.setProperty('--pt-card-border', cardUiThemeObj.cardBorder);
    root.setProperty('--pt-card-glow', cardUiThemeObj.cardGlow);

    var smallCardBg = smallCardTheme.type === 'custom'
        ? window.PT_buildCardPaletteGradient(smallCardTheme.palette)
        : (smallCardThemeObj.cardBgGlass || smallCardThemeObj.panelBg || cardUiThemeObj.panelBg);
    var smallContrastVal = smallCardMaterial.contrast != null ? smallCardMaterial.contrast : 50;
    if (smallContrastVal !== 50 && typeof window.PT_applyContrastToGradient === 'function') {
        smallCardBg = window.PT_applyContrastToGradient(smallCardBg, smallContrastVal);
    }
    var smallGlassOpacity = smallCardMaterial.glassOpacity != null ? smallCardMaterial.glassOpacity : 100;
    if (smallGlassOpacity < 100 && typeof window.PT_applyOpacityToGradient === 'function') {
        smallCardBg = window.PT_applyOpacityToGradient(smallCardBg, smallGlassOpacity);
    }
    root.setProperty('--pt-small-card-bg', smallCardBg);
    root.setProperty('--pt-small-card-border', smallCardThemeObj.panelBorder || smallCardThemeObj.cardBorder || cardUiThemeObj.panelBorder);
    root.setProperty('--pt-small-card-metal-texture', PT_buildMetalTexture(smallCardMaterial));
    root.setProperty('--pt-small-card-wood-texture', PT_buildWoodTexture(smallCardMaterial));
    root.setProperty('--pt-small-card-surface-blur', (smallCardMaterial.blur != null ? smallCardMaterial.blur : 18) + 'px');
    root.setProperty('--pt-small-card-surface-saturate', String(smallCardMaterial.saturate != null ? smallCardMaterial.saturate : 1.22));
    root.setProperty('--pt-small-card-glass-brightness', String((smallCardMaterial.glassBrightness != null ? smallCardMaterial.glassBrightness : 100) / 100));
    root.setProperty('--pt-small-card-glass-contrast', String((smallCardMaterial.glassContrast != null ? smallCardMaterial.glassContrast : 100) / 100));
    root.setProperty('--pt-small-card-glass-hue-rotate', (smallCardMaterial.glassHueRotate != null ? smallCardMaterial.glassHueRotate : 0) + 'deg');

    // ═══ 玻璃参数 → CSS 变量 ═══
    var glassBlur = cardVisual.blur;
    var glassSat = cardVisual.saturate;
    root.setProperty('--pt-glass-blur', glassBlur);
    root.setProperty('--pt-glass-saturate', glassSat);
    root.setProperty('--pt-card-surface-blur', glassBlur);
    root.setProperty('--pt-card-surface-saturate', glassSat);
    root.setProperty('--pt-glass-brightness', cardVisual.brightness);
    root.setProperty('--pt-glass-contrast', cardVisual.contrast);
    root.setProperty('--pt-glass-hue-rotate', cardVisual.hueRotate);
    root.setProperty('--pt-card-sheen-opacity', cardVisual.sheenOpacity);
    root.setProperty('--pt-card-sheen-angle', cardVisual.sheenAngle);
    root.setProperty('--pt-card-glass-glow', cardVisual.glassGlowShadow);
    root.setProperty('--pt-custom-bug-blur', cardVisual.bugBlur);

    // ═══ 金属质感参数 → CSS 变量 ═══
    // 高光层（::before）：highlight > 0 时显示扫光，否则显示亮度叠加层
    var materialBrightness = parseFloat(next.cardMaterialBrightness);
    if (!isFinite(materialBrightness)) materialBrightness = 1;
    materialBrightness = Math.max(0, Math.min(2, materialBrightness));
    var materialBrightnessOpacity = Math.min(0.72, Math.abs(materialBrightness - 1) / 1.2);
    var materialBrightnessColor = materialBrightness >= 1 ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 0, 0, 1)';

    if (cardVisual.beforeOpacity !== '0') {
        root.setProperty('--pt-card-before-background', cardVisual.beforeBackground);
        root.setProperty('--pt-card-before-opacity', cardVisual.beforeOpacity);
    } else if (materialBrightnessOpacity > 0) {
        root.setProperty('--pt-card-before-background', materialBrightnessColor);
        root.setProperty('--pt-card-before-opacity', String(materialBrightnessOpacity));
    } else {
        root.setProperty('--pt-card-before-background', 'none');
        root.setProperty('--pt-card-before-opacity', '0');
    }
    // 兼容旧变量名
    root.setProperty('--pt-card-material-brightness-color', materialBrightnessColor);
    root.setProperty('--pt-card-material-brightness-opacity', String(materialBrightnessOpacity));

    // 内阴影+内环（金属质感）：innerShadow > 0 时计算阴影字符串
    if (cardVisual.metalShadow !== 'none') {
        root.setProperty('--pt-card-metal-shadow', cardVisual.metalShadow);
        root.setProperty('--pt-card-metal-inner-overlay', cardVisual.metalShadow);
    } else {
        root.setProperty('--pt-card-metal-shadow', 'none');
        root.setProperty('--pt-card-metal-inner-overlay', 'none');
    }
    root.setProperty('--pt-card-outer-shadow', '0 0 0 1px rgba(7, 20, 34, 0.18)');

    // ═══ 玻璃层显隐（一直显示，模糊度由 bugBlur 滑条控制） ═══
    var glassLayer = document.getElementById('pt-glass-layer');
    if (glassLayer) {
        glassLayer.style.display = '';
    }

    // ═══ 通用质感（颗粒/暗角/辉光） ═══
    var textureParams = {
        grain: cardMaterial.grain != null ? cardMaterial.grain : 0,
        vignette: cardMaterial.vignette != null ? cardMaterial.vignette : 0,
        bloom: cardMaterial.bloom != null ? cardMaterial.bloom : 0
    };
    if (typeof window.PT_applyTextureEngine === 'function') {
        window.PT_applyTextureEngine(textureParams);
    }

    // ═══ 壁纸 ═══
    if (typeof window.PT_applyWallpaper === 'function') {
        window.PT_applyWallpaper(next);
    }
};
