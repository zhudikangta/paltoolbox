// ═══════════════ 材质预设表.js ═══════════════
// 10 种材质预设，每种带完整参数（玻璃参数 + 金属质感参数 + 通用质感参数）
// 三类参数可叠加，不是二选一

window.PT_MATERIAL_PRESETS = {
    // ── 玻璃类 ──
    gradient: {
        id: 'gradient', label: '均衡玻璃',
        blur: 16, saturate: 1.12,
        bugBlur: 14,
        glassBrightness: 100, glassContrast: 96, glassHueRotate: 0,
        glassOpacity: 42, glassGlow: 12,
        sheen: 18, sheenAngle: 132,
        highlight: 0, innerShadow: 0, innerShadowThickness: 0, contrast: 50,
        grain: 4, vignette: 0, bloom: 0
    },
    smallTranslucent: {
        id: 'smallTranslucent', label: '半透明玻璃',
        blur: 0, saturate: 1.22,
        bugBlur: 0,
        glassBrightness: 100, glassContrast: 100, glassHueRotate: 0,
        glassOpacity: 42, glassGlow: 0,
        sheen: 0, sheenAngle: 135,
        highlight: 0, innerShadow: 0, innerShadowThickness: 0, contrast: 50,
        grain: 0, vignette: 0, bloom: 0
    },
    frosted: {
        id: 'frosted', label: '磨砂玻璃',
        blur: 30, saturate: 1.0,
        bugBlur: 30,
        glassBrightness: 85, glassContrast: 80, glassHueRotate: 0,
        glassOpacity: 45, glassGlow: 0,
        sheen: 0, sheenAngle: 135,
        highlight: 0, innerShadow: 0, innerShadowThickness: 0, contrast: 50,
        grain: 30, vignette: 0, bloom: 0
    },
    smokedGlass: {
        id: 'smokedGlass', label: '烟熏玻璃',
        blur: 10, saturate: 0.82,
        bugBlur: 8,
        glassBrightness: 72, glassContrast: 118, glassHueRotate: 0,
        glassOpacity: 58, glassGlow: 0,
        sheen: 12, sheenAngle: 128,
        highlight: 0, innerShadow: 0, innerShadowThickness: 0, contrast: 50,
        grain: 10, vignette: 16, bloom: 0
    },
    iceMistGlass: {
        id: 'iceMistGlass', label: '冰雾玻璃',
        blur: 34, saturate: 0.9,
        bugBlur: 32,
        glassBrightness: 116, glassContrast: 88, glassHueRotate: 190,
        glassOpacity: 36, glassGlow: 34,
        sheen: 22, sheenAngle: 118,
        highlight: 0, innerShadow: 0, innerShadowThickness: 0, contrast: 50,
        grain: 18, vignette: 0, bloom: 6
    },

    // ── 金属类（颜色部分已拆给主题，这里只保留质感参数） ──
    brushedMetal: {
        id: 'brushedMetal', label: '拉丝金属',
        blur: 0, saturate: 1,
        bugBlur: 0,
        glassBrightness: 96, glassContrast: 110, glassHueRotate: 0,
        glassOpacity: 100, glassGlow: 0,
        sheen: 8, sheenAngle: 105,
        highlight: 48, innerShadow: 78, innerShadowThickness: 48, contrast: 58,
        grain: 34, vignette: 0, bloom: 0,
        metalTexture: 'brushed', metalTextureStrength: 72, metalTextureDensity: 78, metalTextureAngle: 102, metalReflectionSharpness: 42
    },
    mirrorMetal: {
        id: 'mirrorMetal', label: '镜面金属',
        blur: 0, saturate: 1,
        bugBlur: 0,
        glassBrightness: 112, glassContrast: 132, glassHueRotate: 0,
        glassOpacity: 100, glassGlow: 0,
        sheen: 0, sheenAngle: 128,
        highlight: 88, innerShadow: 72, innerShadowThickness: 30, contrast: 68,
        grain: 6, vignette: 0, bloom: 0,
        metalTexture: 'mirror', metalTextureStrength: 34, metalTextureDensity: 28, metalTextureAngle: 128, metalReflectionSharpness: 90
    },
    matteMetal: {
        id: 'matteMetal', label: '哑光金属',
        blur: 0, saturate: 1,
        bugBlur: 0,
        glassBrightness: 92, glassContrast: 96, glassHueRotate: 0,
        glassOpacity: 100, glassGlow: 0,
        sheen: 0, sheenAngle: 135,
        highlight: 26, innerShadow: 74, innerShadowThickness: 46, contrast: 48,
        grain: 52, vignette: 2, bloom: 0,
        metalTexture: 'matte', metalTextureStrength: 58, metalTextureDensity: 86, metalTextureAngle: 90, metalReflectionSharpness: 18
    },
    oxidizedMetal: {
        id: 'oxidizedMetal', label: '氧化金属',
        blur: 0, saturate: 0.9,
        bugBlur: 0,
        glassBrightness: 78, glassContrast: 126, glassHueRotate: 0,
        glassOpacity: 100, glassGlow: 0,
        sheen: 0, sheenAngle: 135,
        highlight: 20, innerShadow: 78, innerShadowThickness: 58, contrast: 72,
        grain: 70, vignette: 10, bloom: 0,
        metalTexture: 'oxidized', metalTextureStrength: 76, metalTextureDensity: 62, metalTextureAngle: 74, metalReflectionSharpness: 12
    },
    metalGlass: {
        id: 'metalGlass', label: '半透金属',
        blur: 20, saturate: 1.2,
        bugBlur: 18,
        glassBrightness: 100, glassContrast: 100, glassHueRotate: 0,
        glassOpacity: 25, glassGlow: 25,
        sheen: 50, sheenAngle: 135,
        highlight: 75, innerShadow: 80, innerShadowThickness: 50, contrast: 50,
        grain: 38, vignette: 0, bloom: 0,
        metalTexture: 'soft', metalTextureStrength: 42, metalTextureDensity: 46, metalTextureAngle: 124, metalReflectionSharpness: 44
    },

    // ── 木质类 ──
    oakWood: {
        id: 'oakWood', label: '浅橡木',
        blur: 0, saturate: 1.08,
        bugBlur: 0,
        glassBrightness: 104, glassContrast: 112, glassHueRotate: 6,
        glassOpacity: 100, glassGlow: 0,
        sheen: 8, sheenAngle: 94,
        highlight: 0, innerShadow: 18, innerShadowThickness: 16, contrast: 55,
        grain: 24, vignette: 5, bloom: 0,
        woodStyle: 'straight', woodStrength: 70, woodDensity: 38, woodAngle: 92, woodRing: 18, woodKnot: 16,
        woodLight: '246,191,112', woodMid: '171,102,42', woodDark: '84,47,19'
    },
    walnutWood: {
        id: 'walnutWood', label: '胡桃木',
        blur: 0, saturate: 1.12,
        bugBlur: 0,
        glassBrightness: 96, glassContrast: 118, glassHueRotate: 2,
        glassOpacity: 100, glassGlow: 0,
        sheen: 10, sheenAngle: 98,
        highlight: 0, innerShadow: 26, innerShadowThickness: 20, contrast: 62,
        grain: 30, vignette: 10, bloom: 0,
        woodStyle: 'wave', woodStrength: 86, woodDensity: 66, woodAngle: 104, woodRing: 56, woodKnot: 46,
        woodLight: '196,125,62', woodMid: '103,58,28', woodDark: '43,24,14'
    },
    mahoganyWood: {
        id: 'mahoganyWood', label: '红木',
        blur: 0, saturate: 1.18,
        bugBlur: 0,
        glassBrightness: 98, glassContrast: 120, glassHueRotate: 14,
        glassOpacity: 100, glassGlow: 0,
        sheen: 14, sheenAngle: 88,
        highlight: 0, innerShadow: 24, innerShadowThickness: 18, contrast: 64,
        grain: 26, vignette: 8, bloom: 0,
        woodStyle: 'fine', woodStrength: 80, woodDensity: 82, woodAngle: 86, woodRing: 22, woodKnot: 18,
        woodLight: '216,116,70', woodMid: '116,42,28', woodDark: '52,16,14'
    },
    ebonyWood: {
        id: 'ebonyWood', label: '乌木',
        blur: 0, saturate: 1,
        bugBlur: 0,
        glassBrightness: 88, glassContrast: 128, glassHueRotate: 0,
        glassOpacity: 100, glassGlow: 0,
        sheen: 16, sheenAngle: 102,
        highlight: 0, innerShadow: 32, innerShadowThickness: 24, contrast: 70,
        grain: 35, vignette: 14, bloom: 0,
        woodStyle: 'dark', woodStrength: 92, woodDensity: 88, woodAngle: 100, woodRing: 8, woodKnot: 10,
        woodLight: '82,65,48', woodMid: '28,24,22', woodDark: '8,7,7'
    },

    // ── 面板类 ──
    panel: {
        id: 'panel', label: '纯色面板',
        blur: 0, saturate: 1,
        bugBlur: 0,
        glassBrightness: 100, glassContrast: 100, glassHueRotate: 0,
        glassOpacity: 100, glassGlow: 0,
        sheen: 0, sheenAngle: 135,
        highlight: 0, innerShadow: 0, innerShadowThickness: 0, contrast: 50,
        grain: 0, vignette: 0, bloom: 0
    }
};
