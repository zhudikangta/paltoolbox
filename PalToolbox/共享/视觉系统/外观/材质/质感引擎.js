// ═══════════════ 质感引擎.js — 颗粒/暗角/辉光 ═══════════════
// 将材质参数中的质感值写入 CSS 变量

window.PT_applyTextureEngine = function PT_applyTextureEngine(params) {
    var p = params || {};
    var root = document.documentElement.style;
    root.setProperty('--pt-grain-opacity', String((p.grain != null ? p.grain : 0) / 100));
    root.setProperty('--pt-vignette-opacity', String((p.vignette != null ? p.vignette : 0) / 100));
    root.setProperty('--pt-bloom-opacity', String((p.bloom != null ? p.bloom : 0) / 100));
};
