// ═══════════════ 取色器面板.js — 主题高级面板 ═══════════════
// 升级：色标位置可拖 + 每色标独立调色（曝光/对比/自然饱和/色温/色调）
// 依赖：PT_COLOR_ENGINE（取色器引擎.js）、PT_themeToCardPalette（颜色计算.js）

window.PT_PICKER_PANEL = (function() {
    var E = window.PT_COLOR_ENGINE || {};
    var _pickerActiveStop = 0;
    var _pickerCurrentHue = 0;
    var _sbDragCanvas = null;
    var _stopsArray = null;
    var _expandedStops = {};
    var _pickerRootStates = typeof WeakMap !== 'undefined' ? new WeakMap() : null;

    function _cloneStops(stops) {
        return stops ? JSON.parse(JSON.stringify(stops)) : null;
    }

    function _cloneExpanded(expanded) {
        var copy = {};
        Object.keys(expanded || {}).forEach(function(key) {
            copy[key] = expanded[key];
        });
        return copy;
    }

    function _loadStopsFromDom(root) {
        if (!root || !root.querySelector || !root.querySelector('#pt-theme-editor')) return false;
        var rows = root.querySelectorAll('.pt-color-stop-row');
        if (!rows.length) return false;
        _stopsArray = [];
        _expandedStops = {};
        rows.forEach(function(row, i) {
            var hexEl = root.querySelector('#pt-theme-c' + (i + 1));
            var alphaEl = root.querySelector('#pt-theme-a' + (i + 1));
            var posEl = root.querySelector('#pt-theme-p' + (i + 1));
            var expEl = root.querySelector('#pt-stop-exp-' + i);
            var ctrEl = root.querySelector('#pt-stop-ctr-' + i);
            var vibEl = root.querySelector('#pt-stop-vib-' + i);
            var tmpEl = root.querySelector('#pt-stop-tmp-' + i);
            var tntEl = root.querySelector('#pt-stop-tnt-' + i);
            _stopsArray.push({
                c: (hexEl && hexEl.value) || '#888888',
                a: alphaEl ? parseFloat(alphaEl.value || 100) / 100 : 1,
                pos: posEl ? parseFloat(posEl.value || 0) : Math.round((i / Math.max(1, rows.length - 1)) * 100),
                exposure: expEl ? parseFloat(expEl.value || 100) : 100,
                contrast: ctrEl ? parseFloat(ctrEl.value || 100) : 100,
                vibrance: vibEl ? parseFloat(vibEl.value || 100) : 100,
                temperature: tmpEl ? parseFloat(tmpEl.value || 100) : 100,
                tint: tntEl ? parseFloat(tntEl.value || 100) : 100
            });
            _expandedStops[i] = row.classList.contains('pt-color-stop-row--expanded');
            if (row.classList.contains('pt-color-stop-row--active')) _pickerActiveStop = i;
        });
        return true;
    }

    function _activateRootState(root) {
        if (!root || !_pickerRootStates) return;
        var state = _pickerRootStates.get(root);
        if (!state) {
            if (_loadStopsFromDom(root)) _rememberRootState(root);
            return;
        }
        _pickerActiveStop = state.activeStop || 0;
        _pickerCurrentHue = state.currentHue || 0;
        _stopsArray = _cloneStops(state.stops);
        _expandedStops = _cloneExpanded(state.expandedStops);
    }

    function _rememberRootState(root) {
        if (!root || !_pickerRootStates) return;
        _pickerRootStates.set(root, {
            activeStop: _pickerActiveStop,
            currentHue: _pickerCurrentHue,
            stops: _cloneStops(_stopsArray),
            expandedStops: _cloneExpanded(_expandedStops)
        });
    }

    function _ensureStops(theme) {
        if (_stopsArray && _stopsArray.length >= 2) return;
        _stopsArray = [];
        if (theme && theme.stops && theme.stops.length) {
            for (var i = 0; i < theme.stops.length; i++) {
                var s = theme.stops[i];
                _stopsArray.push({
                    c: s.c || '#888888',
                    a: s.a != null ? s.a : 0.7,
                    pos: s.pos != null ? s.pos : Math.round((i / Math.max(1, theme.stops.length - 1)) * 100),
                    exposure: s.exposure != null ? s.exposure : 100,
                    contrast: s.contrast != null ? s.contrast : 100,
                    vibrance: s.vibrance != null ? s.vibrance : 100,
                    temperature: s.temperature != null ? s.temperature : 100,
                    tint: s.tint != null ? s.tint : 100
                });
            }
        } else {
            _stopsArray = [
                { c: theme.c1 || '#061626', a: theme.a1 != null ? theme.a1 : 0.82, pos: 0, exposure: 100, contrast: 100, vibrance: 100, temperature: 100, tint: 100 },
                { c: theme.c2 || '#08101c', a: theme.a2 != null ? theme.a2 : 0.68, pos: 48, exposure: 100, contrast: 100, vibrance: 100, temperature: 100, tint: 100 },
                { c: theme.c3 || '#0c1622', a: theme.a3 != null ? theme.a3 : 0.72, pos: 100, exposure: 100, contrast: 100, vibrance: 100, temperature: 100, tint: 100 }
            ];
        }
    }

    function _recalcPositions() {
        for (var i = 0; i < _stopsArray.length; i++) {
            _stopsArray[i].pos = Math.round((i / Math.max(1, _stopsArray.length - 1)) * 100);
        }
    }

    function renderColorStopRow(label, stopIdx, colorId, alphaId, posId, defaultColor, defaultAlpha, defaultPos, canRemove) {
        var html = '<div class="pt-color-stop-row' + (_expandedStops[stopIdx] ? ' pt-color-stop-row--expanded' : '') + '" data-stop="' + stopIdx + '">';
        html += '<div class="pt-color-stop-row__main">';
        html += '<button type="button" class="pt-color-stop-toggle" data-stop-toggle="' + stopIdx + '">' + (_expandedStops[stopIdx] ? '▾' : '▸') + '</button>';
        html += '<label class="pt-color-stop-label">' + label + '</label>';
        html += '<div class="pt-color-swatch" id="pt-color-swatch-' + stopIdx + '" style="background:' + defaultColor + '"></div>';
        html += '<input type="text" class="pt-input pt-color-hex" id="' + colorId + '" value="' + defaultColor + '" maxlength="7">';
        html += '<span class="val" id="' + alphaId + '-v">' + Number(defaultAlpha).toFixed(2) + '</span>';
        html += '<input type="range" class="pt-range-input pt-cc-alpha" id="' + alphaId + '" min="0" max="100" value="' + Math.round(defaultAlpha * 100) + '">';
        html += '<span class="val" id="' + posId + '-v">' + defaultPos + '%</span>';
        html += '<input type="range" class="pt-range-input pt-cc-pos" id="' + posId + '" min="0" max="100" value="' + defaultPos + '">';
        if (canRemove) {
            html += '<button type="button" class="pt-color-stop-remove" title="删除色标">×</button>';
        }
        html += '</div>';
        if (_expandedStops[stopIdx]) {
            html += '<div class="pt-color-stop-row__tuning">';
            var s = _stopsArray[stopIdx] || {};
            html += _tuningSlider('曝光', 'pt-stop-exp-' + stopIdx, 0, 200, s.exposure != null ? s.exposure : 100);
            html += _tuningSlider('对比', 'pt-stop-ctr-' + stopIdx, 0, 200, s.contrast != null ? s.contrast : 100);
            html += _tuningSlider('自然饱和', 'pt-stop-vib-' + stopIdx, 0, 200, s.vibrance != null ? s.vibrance : 100);
            html += _tuningSlider('色温', 'pt-stop-tmp-' + stopIdx, 0, 200, s.temperature != null ? s.temperature : 100);
            html += _tuningSlider('色调', 'pt-stop-tnt-' + stopIdx, 0, 200, s.tint != null ? s.tint : 100);
            html += '</div>';
        }
        html += '</div>';
        return html;
    }

    function _tuningSlider(label, id, min, max, value) {
        return '<div class="pt-color-row pt-color-row--range pt-color-row--tuning"><label>' + label + '</label><input type="range" class="pt-range-input pt-cc-tuning" id="' + id + '" data-tuning-id="' + id + '" min="' + min + '" max="' + max + '" value="' + value + '"><span class="val" id="' + id + '-v">' + value + '</span></div>';
    }

    function renderThemeEditor(settings, renderThemeGridPanel, sliderRow) {
        var theme = renderThemeGridPanel ? getThemePalette(settings) : { c1: '#061626', a1: 0.82, c2: '#08101c', a2: 0.68, c3: '#0c1622', a3: 0.72, angle: 145, brightness: 1, sat: 1, highlight: 0, gradientType: 'linear', easing: 'linear', splitBalance: 50, splitHighlight: '#ffcc88', splitShadow: '#334466' };
        if (renderThemeGridPanel) {
            theme = getThemePalette(settings);
        }
        _ensureStops(theme);

        var html = '<div class="pt-style-editor" id="pt-theme-editor" data-dirty="0">';
        html += '<div class="pt-subpage__head"><button type="button" class="pt-btn pt-btn--ghost pt-subpage__back" id="pt-theme-editor-back">← 返回</button><h4 class="pt-subpage__title">主题</h4></div>';
        html += '<div class="pt-subpage__body pt-style-editor__body">';
        html += '<button type="button" class="pt-inline-action" id="pt-theme-load-btn" style="margin-bottom:8px">载入主题</button>';

        // ── 基础 ──
        html += '<div class="pt-theme-section-head" data-section="basic">基础</div><div class="pt-theme-section-body">';
        if (sliderRow) html += sliderRow('角度', 'pt-theme-angle', 0, 360, theme.angle || 145);

        var canRemoveOne = _stopsArray.length > 2;
        for (var i = 0; i < _stopsArray.length; i++) {
            var s = _stopsArray[i];
            html += renderColorStopRow('色标' + (i + 1), i, 'pt-theme-c' + (i + 1), 'pt-theme-a' + (i + 1), 'pt-theme-p' + (i + 1), s.c, s.a, s.pos, canRemoveOne);
        }
        html += '<button type="button" class="pt-inline-action pt-color-stop-add" id="pt-color-stop-add">+ 添加色标</button>';

        html += '<div class="pt-color-picker-panel" id="pt-color-picker-panel">';
        html += '<input type="range" class="pt-range-input pt-color-hue-slider" id="pt-color-hue-slider" min="0" max="359" value="200">';
        html += '<canvas class="pt-color-sb-canvas" id="pt-color-sb-canvas" width="400" height="200"></canvas>';
        html += '<button type="button" class="pt-inline-action" id="pt-eyedropper-btn">吸色笔</button>';
        html += '</div>';
        if (sliderRow) {
            html += sliderRow('主题色亮度', 'pt-theme-brightness', 0, 200, Math.round((theme.brightness != null ? theme.brightness : 1) * 100), '%');
            html += sliderRow('主题色饱和度', 'pt-theme-sat', 50, 200, Math.round((theme.sat || 1) * 100), '%');
        }
        html += '</div>';

        // ── 专家 ──
        html += '<div class="pt-theme-section-head" data-section="expert">专家</div><div class="pt-theme-section-body">';
        if (sliderRow) {
            html += '<div class="pt-field"><span>渐变类型</span><select class="pt-select" id="pt-theme-gradient-type"><option value="linear"' + (theme.gradientType !== 'radial' && theme.gradientType !== 'conic' ? ' selected' : '') + '>线性</option><option value="radial"' + (theme.gradientType === 'radial' ? ' selected' : '') + '>径向</option><option value="conic"' + (theme.gradientType === 'conic' ? ' selected' : '') + '>角度</option></select></div>';
            html += '<div class="pt-field"><span>缓动</span><select class="pt-select" id="pt-theme-easing"><option value="linear"' + ((theme.easing || 'linear') === 'linear' ? ' selected' : '') + '>线性</option><option value="ease-in"' + (theme.easing === 'ease-in' ? ' selected' : '') + '>缓入</option><option value="ease-out"' + (theme.easing === 'ease-out' ? ' selected' : '') + '>缓出</option><option value="ease-in-out"' + (theme.easing === 'ease-in-out' ? ' selected' : '') + '>缓入缓出</option></select></div>';
            html += sliderRow('高光', 'pt-theme-highlight', 0, 200, theme.highlight != null ? theme.highlight : 0, '');
            html += '<div class="pt-card-section"><span>色调分离</span></div>';
            html += '<div class="pt-color-row pt-color-row--range"><label>平衡</label><input type="range" class="pt-range-input pt-cc-common" id="pt-theme-split-balance" min="0" max="100" value="' + (theme.splitBalance != null ? theme.splitBalance : 50) + '"><span class="val" id="pt-theme-split-balance-v">' + (theme.splitBalance != null ? theme.splitBalance : 50) + '</span></div>';
            html += '<div style="display:flex;gap:6px;align-items:center"><span style="font-size:12px;color:var(--pt-text-sub)">高光色</span><div class="pt-color-swatch" id="pt-color-swatch-split-hi" style="background:' + (theme.splitHighlight || '#ffcc88') + '"></div><input type="text" class="pt-input pt-color-hex" id="pt-theme-split-hi" value="' + (theme.splitHighlight || '#ffcc88') + '" maxlength="7"><span style="font-size:12px;color:var(--pt-text-sub)">阴影色</span><div class="pt-color-swatch" id="pt-color-swatch-split-sh" style="background:' + (theme.splitShadow || '#334466') + '"></div><input type="text" class="pt-input pt-color-hex" id="pt-theme-split-sh" value="' + (theme.splitShadow || '#334466') + '" maxlength="7"></div>';
        }
        html += '</div>';

        html += '<div class="pt-style-save-row pt-style-action-row"><button type="button" class="pt-inline-action" id="pt-save-theme-preset">保存主题</button><button type="button" class="pt-inline-action" id="pt-manage-theme-presets">管理我的主题</button></div>';
        html += '</div>';
        html += '<div class="pt-load-modal pt-load-modal--save" id="pt-theme-save-modal" hidden>';
        html += '<div class="pt-load-modal__overlay" data-theme-save-close></div>';
        html += '<div class="pt-load-modal__box">';
        html += '<div class="pt-load-modal__title">保存主题</div>';
        html += '<div class="pt-load-modal__body"><input type="text" class="pt-input" id="pt-theme-preset-name" placeholder="主题预设名称"></div>';
        html += '<div class="pt-load-modal__foot">';
        html += '<button type="button" class="pt-inline-action" id="pt-theme-save-confirm">保存</button>';
        html += '<button type="button" class="pt-inline-action" data-theme-save-close>取消</button>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
        html += '<div class="pt-style-unsaved-modal" id="pt-theme-unsaved-modal" hidden><div class="pt-style-unsaved-modal__box"><strong>有未保存改动</strong><p>离开高级面板前要如何处理？</p><div><button type="button" class="pt-inline-action" data-theme-exit="save">保存</button><button type="button" class="pt-inline-action" data-theme-exit="discard">不保存返回</button><button type="button" class="pt-inline-action" data-theme-exit="cancel">取消</button></div></div></div>';
        if (renderThemeGridPanel) {
            html += '<div class="pt-load-modal" id="pt-theme-load-modal" hidden>';
            html += '<div class="pt-load-modal__overlay" data-theme-load-close></div>';
            html += '<div class="pt-load-modal__box">';
            html += '<div class="pt-load-modal__title">选择主题</div>';
            html += '<div class="pt-load-modal__body">' + renderThemeGridPanel('pt-theme-load-grid', '', settings, false) + '</div>';
            html += '<div class="pt-load-modal__foot">';
            html += '<button type="button" class="pt-inline-action" id="pt-theme-load-confirm">确定</button>';
            html += '<button type="button" class="pt-inline-action" data-theme-load-close>取消</button>';
            html += '</div>';
            html += '</div>';
            html += '</div>';
        }
        html += '</div>';
        return html;
    }

    function renderThemeEditorPage(settings, renderThemeGridPanel, sliderRow) {
        return '<section id="pt-theme-editor-wrap" class="pt-subpage pt-subpage--style-editor" style="display:none">' + renderThemeEditor(settings, renderThemeGridPanel, sliderRow) + '</section>';
    }

    function getThemePalette(settings) {
        var themes = window.PT_THEME_PRESETS || {};
        var selected = (settings && settings.cardBackgroundTheme) || 'theme:oceanic';
        var themeId = selected.indexOf('theme:') === 0 ? selected.slice(6) : selected;
        return window.PT_themeToCardPalette ? window.PT_themeToCardPalette(themes[themeId] || themes.oceanic) : { angle: 145, c1: '#061626', a1: 0.82, c2: '#08101c', a2: 0.68, c3: '#0c1622', a3: 0.72, sat: 1, brightness: 1, highlight: 0, gradientType: 'linear', easing: 'linear', splitBalance: 50, splitHighlight: '#ffcc88', splitShadow: '#334466' };
    }

    function readThemeEditor(root) {
        _activateRootState(root);
        _syncStopsFromDom(root);
        var stops = [];
        for (var i = 0; i < _stopsArray.length; i++) {
            var hexEl = root.querySelector('#pt-theme-c' + (i + 1));
            var alphaEl = root.querySelector('#pt-theme-a' + (i + 1));
            var posEl = root.querySelector('#pt-theme-p' + (i + 1));
            var expEl = root.querySelector('#pt-stop-exp-' + i);
            var ctrEl = root.querySelector('#pt-stop-ctr-' + i);
            var vibEl = root.querySelector('#pt-stop-vib-' + i);
            var tmpEl = root.querySelector('#pt-stop-tmp-' + i);
            var tntEl = root.querySelector('#pt-stop-tnt-' + i);
            stops.push({
                c: (hexEl || {}).value || '#888888',
                a: alphaEl ? parseFloat(alphaEl.value || 100) / 100 : 1,
                pos: posEl ? parseFloat(posEl.value) : _stopsArray[i].pos,
                exposure: expEl ? parseFloat(expEl.value) : (_stopsArray[i].exposure || 100),
                contrast: ctrEl ? parseFloat(ctrEl.value) : (_stopsArray[i].contrast || 100),
                vibrance: vibEl ? parseFloat(vibEl.value) : (_stopsArray[i].vibrance || 100),
                temperature: tmpEl ? parseFloat(tmpEl.value) : (_stopsArray[i].temperature || 100),
                tint: tntEl ? parseFloat(tntEl.value) : (_stopsArray[i].tint || 100)
            });
        }
        var result = {
            angle: parseFloat((root.querySelector('#pt-theme-angle') || {}).value) || 145,
            stops: stops,
            c1: stops[0] ? stops[0].c : '#061626', a1: stops[0] ? stops[0].a : 0.82,
            c2: stops[1] ? stops[1].c : '#08101c', a2: stops[1] ? stops[1].a : 0.68,
            c3: stops[2] ? stops[2].c : '#0c1622', a3: stops[2] ? stops[2].a : 0.72,
            brightness: parseFloat((root.querySelector('#pt-theme-brightness') || {}).value || 100) / 100,
            sat: parseFloat((root.querySelector('#pt-theme-sat') || {}).value || 100) / 100,
            highlight: parseFloat((root.querySelector('#pt-theme-highlight') || {}).value || 0) || 0,
            gradientType: (root.querySelector('#pt-theme-gradient-type') || {}).value || 'linear',
            splitBalance: parseFloat((root.querySelector('#pt-theme-split-balance') || {}).value || 50) || 50,
            splitHighlight: (root.querySelector('#pt-theme-split-hi') || {}).value || '#ffcc88',
            splitShadow: (root.querySelector('#pt-theme-split-sh') || {}).value || '#334466',
            easing: (root.querySelector('#pt-theme-easing') || {}).value || 'linear'
        };
        _rememberRootState(root);
        return result;
    }

    function setHueSlider(root, hue) {
        var hs = root.querySelector('#pt-color-hue-slider');
        if (hs) hs.value = Math.round(hue);
    }

    function syncPickerSwatches(root) {
        _activateRootState(root);
        for (var i = 0; i < _stopsArray.length; i++) {
            var hexEl = root.querySelector('#pt-theme-c' + (i + 1));
            var swatch = root.querySelector('#pt-color-swatch-' + i);
            var val = hexEl ? hexEl.value : '';
            if (swatch) swatch.style.background = val;
        }
        _rememberRootState(root);
    }

    function getActiveStopHex(root) {
        var el = root.querySelector('#pt-theme-c' + (_pickerActiveStop + 1));
        return el ? el.value || '#888888' : '#888888';
    }

    function setActiveStopHex(root, hex) {
        var i = _pickerActiveStop;
        var hexEl = root.querySelector('#pt-theme-c' + (i + 1));
        var swatch = root.querySelector('#pt-color-swatch-' + i);
        if (hexEl) hexEl.value = hex;
        if (swatch) swatch.style.background = hex;
    }

    function setActiveStop(root, idx) {
        _activateRootState(root);
        _pickerActiveStop = idx;
        root.querySelectorAll('.pt-color-stop-row').forEach(function(r, i) {
            r.classList.toggle('pt-color-stop-row--active', i === idx);
        });
        var hex = getActiveStopHex(root);
        var rgb = E.hexToRgb(hex);
        var hsv = E.rgbToHsv(rgb.r, rgb.g, rgb.b);
        _pickerCurrentHue = hsv.h;
        var canvas = root.querySelector('#pt-color-sb-canvas');
        E.updateSbCanvas(canvas, hsv.h, hsv.s, hsv.v);
        var hueSlider = root.querySelector('#pt-color-hue-slider');
        if (hueSlider) hueSlider.value = Math.round(hsv.h);
        _rememberRootState(root);
    }

    function handleSBPick(root, clientX, clientY) {
        _activateRootState(root);
        var canvas = root.querySelector('#pt-color-sb-canvas');
        if (!canvas) return;
        var rect = canvas.getBoundingClientRect();
        var sat = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        var val = 1 - Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
        var nrgb = E.hsvToRgb(_pickerCurrentHue, sat, val);
        setActiveStopHex(root, E.rgbToHex(nrgb.r, nrgb.g, nrgb.b));
        E.updateSbCanvas(canvas, _pickerCurrentHue, sat, val);
        syncPickerSwatches(root);
        if (typeof PT_PICKER_PANEL.onPreview === 'function') {
            PT_PICKER_PANEL.onPreview(root);
        }
        _rememberRootState(root);
    }

    function updatePickerValueLabels(root) {
        var editor = root.querySelector('#pt-theme-editor');
        if (!editor) return;
        editor.querySelectorAll('input[type="range"]').forEach(function(input) {
            var valSpan = root.querySelector('#' + input.id + '-v');
            if (valSpan) {
                var v = parseFloat(input.value);
                if (input.classList.contains('pt-cc-alpha')) {
                    valSpan.textContent = (v / 100).toFixed(2);
                } else if (input.classList.contains('pt-cc-pos')) {
                    valSpan.textContent = Math.round(v) + '%';
                } else if (input.classList.contains('pt-cc-tuning')) {
                    valSpan.textContent = Math.round(v);
                } else {
                    var isPercent = input.id.indexOf('brightness') >= 0 || input.id.indexOf('sat') >= 0 || input.id.indexOf('highlight') >= 0;
                    valSpan.textContent = isFinite(v) ? Math.round(v) + (isPercent ? '%' : '') : input.value;
                }
            }
        });
    }

    function averageHexColor(hex1, hex2) {
        var r1 = E.hexToRgb(hex1);
        var r2 = E.hexToRgb(hex2);
        return E.rgbToHex(
            Math.round((r1.r + r2.r) / 2),
            Math.round((r1.g + r2.g) / 2),
            Math.round((r1.b + r2.b) / 2)
        );
    }

    function _syncStopsFromDom(root) {
        if (!_stopsArray) return;
        for (var i = 0; i < _stopsArray.length; i++) {
            var hexEl = root.querySelector('#pt-theme-c' + (i + 1));
            var alphaEl = root.querySelector('#pt-theme-a' + (i + 1));
            var posEl = root.querySelector('#pt-theme-p' + (i + 1));
            if (hexEl) _stopsArray[i].c = hexEl.value || _stopsArray[i].c;
            if (alphaEl) _stopsArray[i].a = parseFloat(alphaEl.value || 100) / 100;
            if (posEl) _stopsArray[i].pos = parseFloat(posEl.value);
            var expEl = root.querySelector('#pt-stop-exp-' + i);
            var ctrEl = root.querySelector('#pt-stop-ctr-' + i);
            var vibEl = root.querySelector('#pt-stop-vib-' + i);
            var tmpEl = root.querySelector('#pt-stop-tmp-' + i);
            var tntEl = root.querySelector('#pt-stop-tnt-' + i);
            if (expEl) _stopsArray[i].exposure = parseFloat(expEl.value);
            if (ctrEl) _stopsArray[i].contrast = parseFloat(ctrEl.value);
            if (vibEl) _stopsArray[i].vibrance = parseFloat(vibEl.value);
            if (tmpEl) _stopsArray[i].temperature = parseFloat(tmpEl.value);
            if (tntEl) _stopsArray[i].tint = parseFloat(tntEl.value);
        }
    }

    function rebuildStopRows(root, skipDomSync) {
        _activateRootState(root);
        if (!skipDomSync) _syncStopsFromDom(root);
        var container = root.querySelector('#pt-theme-editor .pt-subpage__body .pt-theme-section-body');
        if (!container) container = root.querySelector('#pt-theme-editor .pt-subpage__body');
        var allRows = container.querySelectorAll('.pt-color-stop-row');
        var addBtn = container.querySelector('#pt-color-stop-add');
        allRows.forEach(function(r) { r.remove(); });
        if (addBtn) addBtn.remove();
        for (var i = 0; i < _stopsArray.length; i++) {
            var s = _stopsArray[i];
            var tmpEl = document.createElement('div');
            tmpEl.innerHTML = renderColorStopRow('色标' + (i + 1), i, 'pt-theme-c' + (i + 1), 'pt-theme-a' + (i + 1), 'pt-theme-p' + (i + 1), s.c, s.a, s.pos, _stopsArray.length > 2);
            container.insertBefore(tmpEl.firstElementChild, container.querySelector('#pt-color-picker-panel'));
        }
        var newAddBtn = document.createElement('button');
        newAddBtn.className = 'pt-inline-action pt-color-stop-add';
        newAddBtn.id = 'pt-color-stop-add';
        newAddBtn.textContent = '+ 添加色标';
        container.insertBefore(newAddBtn, container.querySelector('#pt-color-picker-panel'));
        setActiveStop(root, Math.min(_pickerActiveStop, _stopsArray.length - 1));
        if (typeof PT_PICKER_PANEL.onPreview === 'function') {
            PT_PICKER_PANEL.onPreview(root);
        }
        _rememberRootState(root);
    }

    function toggleStopExpand(root, idx) {
        _activateRootState(root);
        _expandedStops[idx] = !_expandedStops[idx];
        rebuildStopRows(root);
        _rememberRootState(root);
    }

    function bindPicker(root, callbacks) {
        var onOpen = callbacks && callbacks.onThemeEditorOpen;
        var onBack = callbacks && callbacks.onThemeEditorBack;

        root.addEventListener('click', function(e) {
            _activateRootState(root);
            var sectionHead = e.target.closest('.pt-theme-section-head');
            if (sectionHead) {
                var body = sectionHead.nextElementSibling;
                if (body && body.classList.contains('pt-theme-section-body')) {
                    body.classList.toggle('pt-theme-section-body--hidden');
                    sectionHead.classList.toggle('pt-theme-section-head--collapsed');
                }
                return;
            }

            if (e.target.closest('#pt-eyedropper-btn')) {
                e.preventDefault();
                if (window.EyeDropper) {
                    var dropper = new EyeDropper();
                    dropper.open().then(function(result) {
                        var hex = result.sRGBHex;
                        var hexEl = root.querySelector('#pt-theme-c' + (_pickerActiveStop + 1));
                        var swatch = root.querySelector('#pt-color-swatch-' + _pickerActiveStop);
                        if (hexEl) hexEl.value = hex;
                        if (swatch) swatch.style.background = hex;
                        var rgb = E.hexToRgb(hex);
                        var hsv = E.rgbToHsv(rgb.r, rgb.g, rgb.b);
                        _pickerCurrentHue = hsv.h;
                        E.updateSbCanvas(root.querySelector('#pt-color-sb-canvas'), hsv.h, hsv.s, hsv.v);
                        setHueSlider(root, hsv.h);
                        if (typeof PT_PICKER_PANEL.onPreview === 'function') {
                            PT_PICKER_PANEL.onPreview(root);
                        }
                    }).catch(function() {});
                }
                return;
            }

            if (e.target.closest('#pt-open-theme-editor')) {
                if (onOpen) onOpen();
                _pickerActiveStop = 0;
                var initHue = 200, initSat = 0.5, initVal = 0.5;
                var initHex = root.querySelector('#pt-theme-c1');
                if (initHex) {
                    var rgb = E.hexToRgb(initHex.value);
                    var hsv = E.rgbToHsv(rgb.r, rgb.g, rgb.b);
                    initHue = hsv.h; initSat = hsv.s; initVal = hsv.v;
                }
                requestAnimationFrame(function() {
                    var canvas = root.querySelector('#pt-color-sb-canvas');
                    E.updateSbCanvas(canvas, initHue, initSat, initVal);
                    setHueSlider(root, initHue);
                    setActiveStop(root, 0);
                });
                return;
            }

            if (e.target.closest('#pt-theme-editor-back')) {
                var themeWrap = root.querySelector('#pt-theme-editor-wrap');
                if (themeWrap && themeWrap.getAttribute('data-dirty') === '1') {
                    var unsaved = root.querySelector('#pt-theme-unsaved-modal');
                    if (unsaved) unsaved.hidden = false;
                } else if (onBack) {
                    onBack();
                }
                return;
            }

            var themeExit = e.target.closest('[data-theme-exit]');
            if (themeExit) {
                var themeAction = themeExit.getAttribute('data-theme-exit');
                var themeUnsaved = root.querySelector('#pt-theme-unsaved-modal');
                if (themeAction === 'cancel') {
                    if (themeUnsaved) themeUnsaved.hidden = true;
                    return;
                }
                if (themeAction === 'discard') {
                    if (themeUnsaved) themeUnsaved.hidden = true;
                    if (onBack) onBack();
                    return;
                }
                if (themeAction === 'save') {
                    if (themeUnsaved) themeUnsaved.hidden = true;
                    var themeSave = root.querySelector('#pt-theme-save-modal');
                    if (themeSave) themeSave.hidden = false;
                    return;
                }
                return;
            }

            var toggleBtn = e.target.closest('.pt-color-stop-toggle');
            if (toggleBtn) {
                e.preventDefault();
                e.stopPropagation();
                var toggleIdx = parseInt(toggleBtn.getAttribute('data-stop-toggle') || '0');
                toggleStopExpand(root, toggleIdx);
                return;
            }

            var removeBtn = e.target.closest('.pt-color-stop-remove');
            if (removeBtn) {
                e.preventDefault();
                e.stopPropagation();
                var row = removeBtn.closest('.pt-color-stop-row');
                var ri = parseInt(row.getAttribute('data-stop') || '0');
                if (_stopsArray.length > 2) {
                    _stopsArray.splice(ri, 1);
                    _recalcPositions();
                    if (_pickerActiveStop >= _stopsArray.length) _pickerActiveStop = _stopsArray.length - 1;
                    delete _expandedStops[ri];
                    rebuildStopRows(root);
                }
                return;
            }

            var stopRow = e.target.closest('.pt-color-stop-row');
            if (stopRow && !e.target.classList.contains('pt-range-input') && !e.target.classList.contains('pt-color-hex') && !e.target.classList.contains('pt-color-stop-toggle') && !e.target.classList.contains('pt-color-stop-remove')) {
                var idx = parseInt(stopRow.getAttribute('data-stop') || '0');
                setActiveStop(root, idx);
                return;
            }

            var addBtn = e.target.closest('#pt-color-stop-add');
            if (addBtn) {
                e.preventDefault();
                var lastIdx = _stopsArray.length - 1;
                var lastColor = _stopsArray[lastIdx];
                var prevColor = _stopsArray[lastIdx - 1] || lastColor;
                var avgHex = averageHexColor(prevColor.c, lastColor.c);
                _stopsArray.splice(lastIdx, 0, { c: avgHex, a: 0.7, pos: 0, exposure: 100, contrast: 100, vibrance: 100, temperature: 100, tint: 100 });
                _recalcPositions();
                _pickerActiveStop = lastIdx;
                rebuildStopRows(root);
                return;
            }
        });

        root.addEventListener('change', function(e) {
            _activateRootState(root);
            if (e.target.closest('#pt-theme-editor')) {
                if (e.target && e.target.classList && e.target.classList.contains('pt-color-hex')) {
                    var hexVal = e.target.value;
                    var swatchIdx = parseInt(e.target.id.replace('pt-theme-c', '')) - 1;
                    var sw = root.querySelector('#pt-color-swatch-' + swatchIdx);
                    if (sw) sw.style.background = hexVal;
                    if (swatchIdx === _pickerActiveStop) {
                        var rgb2 = E.hexToRgb(hexVal);
                        var hsv2 = E.rgbToHsv(rgb2.r, rgb2.g, rgb2.b);
                        _pickerCurrentHue = hsv2.h;
                        E.updateSbCanvas(root.querySelector('#pt-color-sb-canvas'), hsv2.h, hsv2.s, hsv2.v);
                        setHueSlider(root, hsv2.h);
                    }
                }
                syncPickerSwatches(root);
                updatePickerValueLabels(root);
                if (typeof PT_PICKER_PANEL.onPreview === 'function') {
                    PT_PICKER_PANEL.onPreview(root);
                }
                _rememberRootState(root);
            }
        });

        root.addEventListener('input', function(e) {
            _activateRootState(root);
            if (e.target.closest('#pt-theme-editor')) {
                if (e.target && e.target.id === 'pt-color-hue-slider') {
                    var hNew = parseFloat(e.target.value);
                    _pickerCurrentHue = hNew;
                    var hex1 = getActiveStopHex(root);
                    var rgb1 = E.hexToRgb(hex1);
                    var hsv1 = E.rgbToHsv(rgb1.r, rgb1.g, rgb1.b);
                    var nrgb1 = E.hsvToRgb(hNew, hsv1.s, hsv1.v);
                    setActiveStopHex(root, E.rgbToHex(nrgb1.r, nrgb1.g, nrgb1.b));
                    E.updateSbCanvas(root.querySelector('#pt-color-sb-canvas'), hNew, hsv1.s, hsv1.v);
                }
                // 位置滑块
                if (e.target.classList.contains('pt-cc-pos')) {
                    var posIdx = parseInt(e.target.id.replace('pt-theme-p', '')) - 1;
                    if (_stopsArray[posIdx]) _stopsArray[posIdx].pos = parseFloat(e.target.value);
                }
                // 每色标独立调色
                if (e.target.classList.contains('pt-cc-tuning')) {
                    var tuningId = e.target.getAttribute('data-tuning-id') || '';
                    var match = tuningId.match(/^pt-stop-(exp|ctr|vib|tmp|tnt)-(\d+)$/);
                    if (match) {
                        var tField = { exp: 'exposure', ctr: 'contrast', vib: 'vibrance', tmp: 'temperature', tnt: 'tint' }[match[1]];
                        var tIdx = parseInt(match[2]);
                        if (_stopsArray[tIdx]) _stopsArray[tIdx][tField] = parseFloat(e.target.value);
                    }
                }
                syncPickerSwatches(root);
                var ah3 = root.querySelector('#pt-theme-c' + (_pickerActiveStop + 1));
                if (ah3 && e.target.id !== 'pt-color-hue-slider') {
                    var agb3 = E.hexToRgb(ah3.value);
                    var ahsv3 = E.rgbToHsv(agb3.r, agb3.g, agb3.b);
                    E.updateSbCanvas(root.querySelector('#pt-color-sb-canvas'), _pickerCurrentHue, ahsv3.s, ahsv3.v);
                }
                updatePickerValueLabels(root);
                if (typeof PT_PICKER_PANEL.onPreview === 'function') {
                    PT_PICKER_PANEL.onPreview(root);
                }
                _rememberRootState(root);
            }
        });

        root.addEventListener('pointerdown', function(e) {
            _activateRootState(root);
            if (e.target && (e.target.id === 'pt-color-sb-canvas' || e.target.closest('#pt-color-sb-canvas'))) {
                e.preventDefault();
                e.stopPropagation();
                _sbDragCanvas = true;
                handleSBPick(root, e.clientX, e.clientY);
                _rememberRootState(root);
            }
        });
        document.addEventListener('pointermove', function(e) {
            if (_sbDragCanvas) {
                handleSBPick(root, e.clientX, e.clientY);
            }
        });
        document.addEventListener('pointerup', function() { _sbDragCanvas = null; });
        document.addEventListener('pointercancel', function() { _sbDragCanvas = null; });
    }

    function loadStopsFromPalette(palette) {
        _stopsArray = null;
        _expandedStops = {};
        _ensureStops(palette || {});
    }

    return {
        renderColorStopRow: renderColorStopRow,
        renderThemeEditor: renderThemeEditor,
        renderThemeEditorPage: renderThemeEditorPage,
        readThemeEditor: readThemeEditor,
        setActiveStop: setActiveStop,
        syncPickerSwatches: syncPickerSwatches,
        setHueSlider: setHueSlider,
        bindPicker: bindPicker,
        loadStopsFromPalette: loadStopsFromPalette,
        rebuildStopRows: rebuildStopRows,
        onPreview: null,
        get _pickerActiveStop() { return _pickerActiveStop; },
        set _pickerActiveStop(v) { _pickerActiveStop = v; }
    };

})();
