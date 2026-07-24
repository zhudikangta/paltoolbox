window.PT_VISUAL_SETTINGS_CARD = (function() {
    var root = null;
    var _styleEditorBaseline = null;
    var PP = window.PT_PICKER_PANEL || {};

    function getSettingsMode(targetRoot) {
        var node = targetRoot && targetRoot.closest ? targetRoot.closest('[data-settings-mode]') : targetRoot;
        return node && node.getAttribute ? node.getAttribute('data-settings-mode') || '' : '';
    }

    function readSettingsFor(targetRoot) {
        if (typeof window.readPTSettings !== 'function') return {};
        var mode = getSettingsMode(targetRoot);
        return mode ? window.readPTSettings(mode) : window.readPTSettings();
    }

    function writeSettingsFor(targetRoot, settings) {
        if (typeof window.writePTSettings !== 'function') return;
        var mode = getSettingsMode(targetRoot);
        window.writePTSettings(settings, mode || undefined);
    }

    function applySettingsFor(targetRoot, settings) {
        if (typeof window.PT_applyVisualPrefs !== 'function') return;
        var mode = getSettingsMode(targetRoot);
        var visualSettings = mode === 'web' && typeof window.PT_getWebVisualSettings === 'function'
            ? window.PT_getWebVisualSettings(settings)
            : settings;
        window.PT_applyVisualPrefs(visualSettings);
    }

    function renderSelect(field, optionsHtml, selectedValue) {
        return '<select class="pt-select" data-setting-field="' + field + '">' + optionsHtml + '</select>';
    }

    function option(value, label, selectedValue) {
        var sel = value === selectedValue ? ' selected' : '';
        return '<option value="' + value + '"' + sel + '>' + label + '</option>';
    }

    function themeColorGroups() {
        return {
            '默认推荐': ['oceanic'],
            '黑白灰阶': ['jetBlack'],
            '青绿自然': ['worldTree'],
            '暖金橙焰': ['dragonFlame'],
            '银蓝冷调': ['skyVault'],
            '金属色': ['metalTitanium','metalGold']
        };
    }

    function renderThemeOptions(selected, settings) {
        var current = selected || 'theme:oceanic';
        var html = '';
        var groups = themeColorGroups();
        for (var g in groups) {
            html += '<optgroup label="' + g + '">';
            for (var i = 0; i < groups[g].length; i++) {
                var id = groups[g][i];
                var theme = (window.PT_THEME_PRESETS || {})[id];
                if (!theme) continue;
                html += option('theme:' + id, theme.label, current);
            }
            html += '</optgroup>';
        }
        var custom = (settings && settings.cardThemePresets) || {};
        var keys = Object.keys(custom);
        if (keys.length) {
            html += '<optgroup label="自定义主题">';
            for (var k = 0; k < keys.length; k++) {
                html += option('custom:' + keys[k], keys[k], current);
            }
            html += '</optgroup>';
        }
        return html;
    }

    function renderThemeGridTriggerLabel(selected, settings) {
        var current = selected || 'theme:oceanic';
        if (current.indexOf('custom:') === 0) return current.slice(7);
        var id = current.indexOf('theme:') === 0 ? current.slice(6) : current;
        var theme = (window.PT_THEME_PRESETS || {})[id];
        return theme ? theme.label : id;
    }

    function renderThemeGridPanel(field, selected, settings, persistSetting) {
        var groups = themeColorGroups();
        var custom = (settings && settings.cardThemePresets) || {};
        var customKeys = Object.keys(custom);
        if (customKeys.length) groups['我的'] = customKeys.map(function(name) { return 'custom:' + name; });
        var settingAttr = persistSetting === false ? '' : ' data-setting-field="' + field + '"';
        var html = '<div class="pt-theme-grid-select" data-grid-lazy="1" data-target="' + field + '">';
        html += '<select class="pt-select pt-theme-grid-native"' + settingAttr + '>' + renderThemeOptions(selected, settings) + '</select>';
        html += '<button type="button" class="pt-theme-grid-trigger">' + renderThemeGridTriggerLabel(selected, settings) + '</button>';
        html += '<div class="pt-theme-grid-panel"></div>';
        html += '<template class="pt-theme-grid-template"><div class="pt-theme-grid-columns">';
        for (var g in groups) {
            html += '<div class="pt-theme-grid-column">';
            html += '<div class="pt-theme-grid-column-title">' + g + '</div>';
            for (var i = 0; i < groups[g].length; i++) {
                var raw = groups[g][i];
                var customTheme = raw.indexOf('custom:') === 0;
                var id = customTheme ? raw.slice(7) : raw;
                var theme = customTheme ? custom[id] : (window.PT_THEME_PRESETS || {})[id];
                if (!theme) continue;
                var value = customTheme ? 'custom:' + id : 'theme:' + id;
                var label = customTheme ? id : theme.label;
                var bg = theme.background || (window.PT_paletteToCssGradient ? window.PT_paletteToCssGradient(theme) : '#000');
                var isSel = selected === value;
                html += '<button type="button" class="pt-theme-grid-option' + (isSel ? ' pt-theme-grid-option--active' : '') + '" data-value="' + value + '" title="' + label + '">';
                html += '<span class="pt-theme-grid-swatch" style="background:' + bg + '"></span>';
                html += '<span class="pt-theme-grid-label">' + label + '</span>';
                html += '</button>';
            }
            html += '</div>';
        }
        html += '</div>';
        html += '</template>';
        html += '</div>';
        return html;
    }

    function renderMetalTypeOptions(selected) {
        var presets = window.PT_METAL_CARD_PRESETS || {};
        var ids = ['brushedMetal', 'mirrorMetal', 'matteMetal', 'oxidizedMetal', 'metalGlass'];
        var html = '';
        for (var i = 0; i < ids.length; i++) {
            html += option(ids[i], (presets[ids[i]] || {}).label || ids[i], selected || 'brushedMetal');
        }
        return html;
    }

    function renderMaterialOptions(selected, settings, field) {
        var builtins = window.PT_MATERIAL_PRESETS || {};
        var ids = ['gradient', 'frosted', 'smokedGlass', 'iceMistGlass', 'brushedMetal', 'mirrorMetal', 'matteMetal', 'oxidizedMetal', 'metalGlass', 'oakWood', 'walnutWood', 'mahoganyWood', 'ebonyWood', 'panel'];
        if (field === 'smallCardMaterial') ids.splice(1, 0, 'smallTranslucent');
        var html = '';
        for (var i = 0; i < ids.length; i++) {
            var m = builtins[ids[i]];
            if (m) {
                html += option(ids[i], m.label, selected || 'gradient');
            }
        }
        var custom = (settings && settings.cardMaterialPresets) || {};
        var keys = Object.keys(custom);
        if (keys.length) {
            html += '<optgroup label="自定义材质">';
            for (var k = 0; k < keys.length; k++) {
                html += option('custom:' + keys[k], keys[k], selected);
            }
            html += '</optgroup>';
        }
        return html;
    }

    function materialGroups(settings, field) {
        var groups = {
            '玻璃': ['gradient', 'frosted', 'smokedGlass', 'iceMistGlass'],
            '金属': ['brushedMetal', 'mirrorMetal', 'matteMetal', 'oxidizedMetal', 'metalGlass'],
            '木质': ['oakWood', 'walnutWood', 'mahoganyWood', 'ebonyWood'],
            '面板': ['panel']
        };
        if (field === 'smallCardMaterial') {
            groups = {
                '玻璃': ['gradient', 'smallTranslucent', 'frosted', 'smokedGlass', 'iceMistGlass'],
                '金属': ['brushedMetal', 'mirrorMetal', 'matteMetal', 'oxidizedMetal', 'metalGlass'],
                '木质': ['oakWood', 'walnutWood', 'mahoganyWood', 'ebonyWood'],
                '面板': ['panel']
            };
        }
        var custom = (settings && settings.cardMaterialPresets) || {};
        var keys = Object.keys(custom);
        if (keys.length) groups['我的'] = keys.map(function(name) { return 'custom:' + name; });
        return groups;
    }

    function getMaterialLabel(value, settings) {
        var current = value || 'gradient';
        if (current.indexOf('custom:') === 0) return current.slice(7);
        var material = (window.PT_MATERIAL_PRESETS || {})[current];
        return material ? material.label : current;
    }

    function materialSwatchBackground(value) {
        var id = value && value.indexOf('custom:') === 0 ? 'custom' : value;
        var map = {
            gradient: 'linear-gradient(135deg, rgba(255,255,255,.58), rgba(92,172,255,.18))',
            frosted: 'linear-gradient(135deg, rgba(238,248,255,.62), rgba(160,185,210,.26))',
            smokedGlass: 'linear-gradient(135deg, rgba(34,38,42,.68), rgba(5,8,10,.44))',
            iceMistGlass: 'linear-gradient(135deg, rgba(236,252,255,.7), rgba(126,190,220,.22))',
            smallTranslucent: 'linear-gradient(135deg, rgba(255,255,255,.42), rgba(100,170,220,.16))',
            brushedMetal: 'repeating-linear-gradient(102deg, #d6d9d6 0px, #6f777a 2px, #c8cbc8 5px, #5c6265 8px)',
            mirrorMetal: 'linear-gradient(135deg, #ffffff, #7d8790 38%, #f7fbff 52%, #505860)',
            matteMetal: 'linear-gradient(135deg, #a8aaa6, #626762 50%, #c4c6c0)',
            oxidizedMetal: 'linear-gradient(135deg, #656b62, #242a28 48%, #7a7466)',
            metalGlass: 'linear-gradient(135deg, rgba(245,248,255,.72), rgba(85,95,112,.34))',
            oakWood: 'linear-gradient(96deg, #f6bf70, #ab662a 34%, #542f13)',
            walnutWood: 'linear-gradient(96deg, #c47d3e, #673a1c 44%, #2b180e)',
            mahoganyWood: 'linear-gradient(96deg, #d87446, #742a1c 44%, #34100e)',
            ebonyWood: 'linear-gradient(96deg, #524130, #1c1816 44%, #080707)',
            panel: 'linear-gradient(135deg, rgba(72,84,96,.9), rgba(20,24,30,.9))',
            custom: 'linear-gradient(135deg, rgba(255,255,255,.5), rgba(120,160,220,.18))'
        };
        return map[id] || map.gradient;
    }

    function renderMaterialGridTriggerLabel(selected, settings) {
        return getMaterialLabel(selected || 'gradient', settings);
    }

    function renderMaterialGridPanel(field, selected, settings, persistSetting) {
        var groups = materialGroups(settings, field);
        var settingAttr = persistSetting === false ? '' : ' data-setting-field="' + field + '"';
        var current = selected || 'gradient';
        var html = '<div class="pt-theme-grid-select" data-grid-kind="material" data-grid-lazy="1" data-target="' + field + '">';
        html += '<select class="pt-select pt-theme-grid-native"' + settingAttr + '>' + renderMaterialOptions(current, settings, field) + '</select>';
        html += '<button type="button" class="pt-theme-grid-trigger">' + renderMaterialGridTriggerLabel(current, settings) + '</button>';
        html += '<div class="pt-theme-grid-panel"></div>';
        html += '<template class="pt-theme-grid-template"><div class="pt-theme-grid-columns">';
        for (var g in groups) {
            html += '<div class="pt-theme-grid-column">';
            html += '<div class="pt-theme-grid-column-title">' + g + '</div>';
            for (var i = 0; i < groups[g].length; i++) {
                var id = groups[g][i];
                var label = getMaterialLabel(id, settings);
                var isSel = current === id;
                html += '<button type="button" class="pt-theme-grid-option' + (isSel ? ' pt-theme-grid-option--active' : '') + '" data-value="' + id + '" title="' + label + '">';
                html += '<span class="pt-theme-grid-swatch" style="background:' + materialSwatchBackground(id) + '"></span>';
                html += '<span class="pt-theme-grid-label">' + label + '</span>';
                html += '</button>';
            }
            html += '</div>';
        }
        html += '</div>';
        html += '</template>';
        html += '</div>';
        return html;
    }

    function hydrateThemeGrid(wrapper) {
        if (!wrapper) return;
        var panel = wrapper.querySelector('.pt-theme-grid-panel');
        var template = wrapper.querySelector('.pt-theme-grid-template');
        if (!panel || !template) return;
        panel.appendChild(template.content);
        template.remove();
    }

    function positionThemeGridPanel(wrapper) {
        var trigger = wrapper && wrapper.querySelector('.pt-theme-grid-trigger');
        var panel = wrapper && (wrapper._ptFloatingGridPanel || wrapper.querySelector('.pt-theme-grid-panel'));
        if (!trigger || !panel) return;
        var rect = trigger.getBoundingClientRect();
        var edge = 10;
        var spaceBelow = window.innerHeight - rect.bottom - edge;
        var panelWidth = Math.min(rect.width, window.innerWidth - edge * 2);
        panel.style.left = Math.min(Math.max(edge, rect.left), window.innerWidth - panelWidth - edge) + 'px';
        panel.style.width = panelWidth + 'px';
        panel.style.top = rect.bottom + 'px';
        panel.style.maxHeight = Math.max(0, spaceBelow) + 'px';
    }

    function sliderRow(label, id, min, max, value, suffix) {
        return '<div class="pt-color-row pt-color-row--range"><label>' + label + '</label><input type="range" class="pt-range-input pt-cc-common" id="' + id + '" min="' + min + '" max="' + max + '" value="' + value + '"><span class="val" id="' + id + '-v">' + value + (suffix || '') + '</span></div>';
    }

    function settingSliderRow(label, field, min, max, value, suffix) {
        return '<div class="pt-color-row pt-color-row--range"><label>' + label + '</label><input type="range" class="pt-range-input pt-cc-common" data-setting-field="' + field + '" data-setting-ratio="1" min="' + min + '" max="' + max + '" value="' + value + '"><span class="val">' + value + (suffix || '') + '</span></div>';
    }

    function settingToggleRow(label, field, checked) {
        return '<label class="pt-toggle" style="margin-top:8px"><span class="pt-toggle__control"><input type="checkbox" class="pt-toggle__input" data-setting-field="' + field + '"' + (checked ? ' checked' : '') + '><span class="pt-toggle__track"></span></span><span class="pt-toggle__label">' + label + '</span></label>';
    }

    function metalSliderRow(label, field, min, max, storedValue, fallback, suffix) {
        var v = storedValue != null ? parseFloat(storedValue) : fallback;
        if (!isFinite(v)) v = fallback;
        var display = Math.round(v);
        return '<div class="pt-color-row pt-color-row--range"><label>' + label + '</label><input type="range" class="pt-range-input pt-cc-common" data-setting-field="' + field + '" min="' + min + '" max="' + max + '" value="' + display + '"><span class="val">' + display + (suffix || '') + '</span></div>';
    }

    function getThemePaletteFromSelection(settings, selection) {
        var themes = window.PT_THEME_PRESETS || {};
        var selected = selection || settings.cardBackgroundTheme || 'theme:oceanic';
        if (selected.indexOf('custom:') === 0) {
            var custom = (settings.cardThemePresets || {})[selected.slice(7)];
            if (custom) return custom;
        }
        var themeId = selected.indexOf('theme:') === 0 ? selected.slice(6) : selected;
        if (window.PT_themeToCardPalette) return window.PT_themeToCardPalette(themes[themeId] || themes.oceanic);
        return { angle: 145, c1: '#061626', a1: 0.82, c2: '#08101c', a2: 0.68, c3: '#0c1622', a3: 0.72, sat: 1, brightness: 1 };
    }

    function getMaterialFromSelection(settings, selection) {
        var selected = selection || settings.cardMaterial || settings.glassMode || 'gradient';
        if (selected.indexOf('custom:') === 0) {
            var custom = (settings.cardMaterialPresets || {})[selected.slice(7)];
            if (custom) return custom;
        }
        return (window.PT_MATERIAL_PRESETS || {})[selected] || (window.PT_MATERIAL_PRESETS || {}).gradient || { id: 'gradient', blur: 18, saturate: 1.22, bugBlur: 18, highlight: 0, innerShadow: 0, innerShadowThickness: 0, contrast: 50, grain: 0, vignette: 0, bloom: 0, glassOpacity: 100 };
    }

    function wallpaperBgStyle(src) {
        return src ? ' style="background-image:url(' + src + ')"' : '';
    }

    function renderPresetWallpaperCard(preset, settings) {
        var active = settings.wallpaper === preset.id ? ' pt-wallpaper-card--active' : '';
        var bg = preset.type === 'image' ? wallpaperBgStyle(preset.src) : ' style="background:' + preset.color + '"';
        return '<button type="button" class="pt-wallpaper-card' + active + '" data-wallpaper-id="' + preset.id + '"' + bg + '><span class="pt-wallpaper-card__label">' + preset.label + '</span></button>';
    }

    function renderThemeWallpaperEntry(settings) {
        var themeId = settings.wallpaperTheme || 'oceanic';
        var theme = (window.PT_THEME_PRESETS || {})[themeId] || (window.PT_THEME_PRESETS || {}).oceanic || {};
        var active = settings.wallpaper === 'theme-color' ? ' pt-wallpaper-card--active' : '';
        var bg = ' style="background:' + (theme.background || '#102338') + '"';
        return '<button type="button" class="pt-wallpaper-card pt-theme-wallpaper-entry' + active + '" id="pt-theme-wallpaper-open"' + bg + '><span class="pt-wallpaper-card__label">主题色壁纸</span></button>';
    }

    function renderThemeWallpaperCards(settings) {
        var groups = themeColorGroups();
        var themes = window.PT_THEME_PRESETS || {};
        var html = '';
        for (var g in groups) {
            for (var i = 0; i < groups[g].length; i++) {
                var id = groups[g][i];
                var theme = themes[id];
                if (!theme) continue;
                var active = settings.wallpaper === 'theme-color' && settings.wallpaperTheme === id ? ' pt-wallpaper-card--active' : '';
                var bg = ' style="background:' + (theme.background || '#102338') + '"';
                html += '<button type="button" class="pt-wallpaper-card' + active + '" data-wallpaper-theme="' + id + '"' + bg + '><span class="pt-wallpaper-card__label">' + theme.label + '</span></button>';
            }
        }
        return html;
    }

    function renderMyWallpaperEntry(settings) {
        var hasCustom = !!settings.wallpaperCustom;
        var active = settings.wallpaper === 'custom' && hasCustom ? ' pt-wallpaper-card--active' : '';
        var filled = hasCustom ? ' pt-wallpaper-my-card--filled' : '';
        var bg = hasCustom ? wallpaperBgStyle(settings.wallpaperCustom) : '';
        return '<button type="button" class="pt-wallpaper-card pt-wallpaper-my-card' + active + filled + '" id="pt-wallpaper-my-card"' + bg + '><span class="pt-wallpaper-entry-ring" id="pt-wallpaper-open-library"><span>+</span></span><span class="pt-wallpaper-card__label">我的壁纸</span></button>';
    }

    function renderWallpaperLibraryGrid(settings) {
        var lib = settings.wallpaperLibrary || [];
        if (!lib.length) return '<div class="pt-wallpaper-empty">还没有上传壁纸</div>';
        var html = '';
        for (var i = 0; i < lib.length; i++) {
            var active = settings.wallpaper === 'custom' && settings.wallpaperCustom === lib[i] ? ' pt-wallpaper-library-tile--active' : '';
            html += '<button type="button" class="pt-wallpaper-library-tile' + active + '" data-wallpaper-index="' + i + '" data-wallpaper-src="' + lib[i] + '"' + wallpaperBgStyle(lib[i]) + '><span class="pt-wallpaper-delete-ring"><span>×</span></span></button>';
        }
        return html;
    }

    function renderWallpaperCard(settings) {
        settings = settings || readSettingsFor(root);
        var html = '<section class="pt-card pt-wallpaper-system">';
        html += '<div id="pt-wallpaper-main-panel">';
        html += '<div class="pt-card__head"><h4 class="pt-card__title">壁纸</h4></div>';
        html += '<div class="pt-wallpaper-grid" id="pt-wallpaper-grid">';
        var presets = window.PT_WALLPAPER_PRESETS || [];
        for (var i = 0; i < presets.length; i++) html += renderPresetWallpaperCard(presets[i], settings);
        html += renderThemeWallpaperEntry(settings);
        html += renderMyWallpaperEntry(settings);
        html += '</div>';
        html += '</div>';
        html += '</section>';
        return html;
    }

    function renderWallpaperLibraryPanel(settings) {
        return '<section id="pt-wallpaper-library-panel" class="pt-subpage pt-subpage--wallpaper-library pt-wallpaper-library-panel" style="display:none">' +
            '<div class="pt-subpage__head"><button type="button" class="pt-btn pt-btn--ghost pt-subpage__back" id="pt-wallpaper-back">← 返回</button><h4 class="pt-subpage__title">我的壁纸</h4></div>' +
            '<div class="pt-subpage__body">' +
            '<div class="pt-wallpaper-actions"><button type="button" class="pt-inline-action" id="pt-wallpaper-upload-action">上传壁纸</button><button type="button" class="pt-inline-action" id="pt-wallpaper-delete-action">删除壁纸</button></div>' +
            '<input type="file" accept="image/*" id="pt-wallpaper-file" style="display:none">' +
            '<div class="pt-wallpaper-lib" id="pt-wallpaper-lib">' + renderWallpaperLibraryGrid(settings) + '</div>' +
            '</div>' +
            '</section>';
    }

    function renderThemeWallpaperPanel(settings) {
        return '<section id="pt-theme-wallpaper-panel" class="pt-subpage pt-subpage--theme-wallpaper pt-theme-wallpaper-panel" style="display:none">' +
            '<div class="pt-subpage__head"><button type="button" class="pt-btn pt-btn--ghost pt-subpage__back" id="pt-theme-wallpaper-back">← 返回</button><h4 class="pt-subpage__title">主题色壁纸</h4></div>' +
            '<div class="pt-subpage__body">' +
            '<div class="pt-theme-wallpaper-grid" id="pt-theme-wallpaper-grid">' + renderThemeWallpaperCards(settings) + '</div>' +
            '</div>' +
            '</section>';
    }

    function renderThemeManagerGrid(settings) {
        var custom = (settings && settings.cardThemePresets) || {};
        var keys = Object.keys(custom);
        if (!keys.length) return '<div class="pt-preset-manager-empty">还没有保存的主题</div>';
        var html = '';
        for (var i = 0; i < keys.length; i++) {
            var name = keys[i];
            var theme = custom[name] || {};
            var bg = theme.background || (window.PT_paletteToCssGradient ? window.PT_paletteToCssGradient(theme) : '#102338');
            html += '<div class="pt-preset-manager-item">';
            html += '<span class="pt-preset-manager-swatch" style="background:' + bg + '"></span>';
            html += '<span class="pt-preset-manager-name">' + name + '</span>';
            html += '<button type="button" class="pt-inline-action pt-preset-manager-delete" data-delete-theme-preset="' + name + '">删除</button>';
            html += '</div>';
        }
        return html;
    }

    function renderMaterialManagerGrid(settings) {
        var custom = (settings && settings.cardMaterialPresets) || {};
        var keys = Object.keys(custom);
        if (!keys.length) return '<div class="pt-preset-manager-empty">还没有保存的材质</div>';
        var html = '';
        for (var i = 0; i < keys.length; i++) {
            var name = keys[i];
            html += '<div class="pt-preset-manager-item">';
            html += '<span class="pt-preset-manager-swatch" style="background:' + materialSwatchBackground('custom:' + name) + '"></span>';
            html += '<span class="pt-preset-manager-name">' + name + '</span>';
            html += '<button type="button" class="pt-inline-action pt-preset-manager-delete" data-delete-material-preset="' + name + '">删除</button>';
            html += '</div>';
        }
        return html;
    }

    function renderThemeManagerPage(settings) {
        return '<section id="pt-manage-theme-page" class="pt-subpage pt-subpage--preset-manager pt-preset-manager-page" style="display:none">' +
            '<div class="pt-subpage__head"><button type="button" class="pt-btn pt-btn--ghost pt-subpage__back" id="pt-manage-theme-back">← 返回</button><h4 class="pt-subpage__title">管理我的主题</h4></div>' +
            '<div class="pt-subpage__body"><div class="pt-preset-manager-grid" id="pt-theme-preset-manager-grid">' + renderThemeManagerGrid(settings) + '</div></div>' +
            '</section>';
    }

    function renderMaterialManagerPage(settings) {
        return '<section id="pt-manage-material-page" class="pt-subpage pt-subpage--preset-manager pt-preset-manager-page" style="display:none">' +
            '<div class="pt-subpage__head"><button type="button" class="pt-btn pt-btn--ghost pt-subpage__back" id="pt-manage-material-back">← 返回</button><h4 class="pt-subpage__title">管理我的材质</h4></div>' +
            '<div class="pt-subpage__body"><div class="pt-preset-manager-grid" id="pt-material-preset-manager-grid">' + renderMaterialManagerGrid(settings) + '</div></div>' +
            '</section>';
    }

    function renderThemePresetCard() {
        var settings = readSettingsFor(root);
        var uiSel = settings.cardUiTheme || 'theme:oceanic';
        var html = '<section class="pt-card">';
        html += '<div class="pt-card__head"><h4 class="pt-card__title">主题</h4></div>';
        html += '<div class="pt-field"><span>UI 主题</span>' + renderThemeGridPanel('cardUiTheme', uiSel, settings) + '</div>';
        html += '<button type="button" class="pt-inline-action pt-style-editor-entry" id="pt-open-theme-editor">高级面板</button>';
        html += '</section>';
        return html;
    }

    function renderStyleCard() {
        var settings = readSettingsFor(root);
        var html = '';

        html += '<section class="pt-settings-card pt-settings-main-actions" style="margin-top:14px">';
        html += '<div style="padding:0">';
        html += '<div class="pt-settings-entry-grid">';
        html += '<button type="button" class="pt-card pt-settings-entry-btn" id="pt-open-appearance-subpage"><span>外观设置</span><small>主题、材质、小卡片</small></button>';
        html += '<button type="button" class="pt-card pt-settings-entry-btn" id="pt-open-magnet-subpage"><span>磁吸系统</span><small>吸附、贴边、预览</small></button>';
        html += '<button type="button" class="pt-card pt-settings-entry-btn" id="pt-open-profile-subpage"><span>本机档案</span><small>新建、切换、退出</small></button>';
        html += '</div>';
        var currentMode = (settings.webMode || 'dock');
        var modeLabel = currentMode === 'web' ? '切换至Dock模式' : '切换至网页模式';
        var modeTarget = currentMode === 'web' ? 'dock' : 'web';
        html += '<div class="pt-mode-switch-wrap"><button type="button" class="pt-btn pt-btn--primary pt-btn--block" id="pt-switch-mode-btn" data-mode-target="' + modeTarget + '">' + modeLabel + '</button></div>';
        html += '<div class="pt-mode-switch-wrap"><button type="button" class="pt-btn pt-btn--ghost pt-btn--block" id="pt-open-mode-portal-btn">进入模式选择</button></div>';
        html += '</div></section>';
        return html;
    }

    function renderAppearanceSubpage(settings) {
        var bgSel = settings.cardBackgroundTheme || 'theme:oceanic';
        var uiSel = settings.cardUiTheme || 'theme:oceanic';
        var smallCardEnabled = settings.smallCardAppearanceEnabled === true;
        var smallThemeSel = settings.smallCardTheme || 'theme:oceanic';
        var matSel = settings.cardMaterial || settings.glassMode || 'gradient';
        var smallMatSel = settings.smallCardMaterial || 'smallTranslucent';
        var editorActions = '<section class="pt-settings-card pt-appearance-editor-actions">' +
            '<div class="pt-settings-entry-grid">' +
            '<button type="button" class="pt-card pt-settings-entry-btn" id="pt-open-theme-editor"><span>主题高级面板</span><small>管理和微调界面主题</small></button>' +
            '<button type="button" class="pt-card pt-settings-entry-btn" id="pt-open-material-editor"><span>材质高级面板</span><small>管理和微调卡片材质</small></button>' +
            '</div>' +
            '</section>';
        var themeCard = '<section class="pt-card">' +
            '<div class="pt-card__head"><h4 class="pt-card__title">主题</h4></div>' +
            '<div class="pt-field"><span>界面主题</span>' + renderThemeGridPanel('cardUiTheme', uiSel, settings) + '</div>' +
            '<div class="pt-field"><span>大卡片背景主题</span>' + renderThemeGridPanel('cardBackgroundTheme', bgSel, settings) + '</div>' +
            '</section>';
        var materialCard = '<section class="pt-card">' +
            '<div class="pt-card__head"><h4 class="pt-card__title">卡片材质</h4></div>' +
            '<div class="pt-field"><span>大卡片材质</span>' + renderMaterialGridPanel('cardMaterial', matSel, settings) + '</div>' +
            '</section>';
        var smallCardControls = '<div class="pt-small-card-appearance-controls"' + (smallCardEnabled ? '' : ' hidden') + '>' +
            '<div class="pt-field"><span>小卡片主题</span>' + renderThemeGridPanel('smallCardTheme', smallThemeSel, settings) + '</div>' +
            '<div class="pt-field"><span>小卡片材质</span>' + renderMaterialGridPanel('smallCardMaterial', smallMatSel, settings) + '</div>' +
            '</div>';
        var smallCard = '<section class="pt-card">' +
            '<div class="pt-card__head"><h4 class="pt-card__title">小卡片外观</h4></div>' +
            settingToggleRow('启用小卡片外观', 'smallCardAppearanceEnabled', smallCardEnabled) +
            smallCardControls +
            '</section>';
        var btnStyle = settings.buttonStyle || 'modern';
        function btnStyleOpt(value, label) {
            return '<button type="button" class="pt-seg__opt' + (value === btnStyle ? ' pt-seg__opt--active' : '') + '" data-seg-value="' + value + '">' + label + '</button>';
        }
        var btnStyleCard = '<section class="pt-card">' +
            '<div class="pt-card__head"><h4 class="pt-card__title">按钮样式</h4></div>' +
            '<div class="pt-seg" id="pt-btn-style-seg" data-seg-active="' + btnStyle + '">' +
            '<span class="pt-seg__thumb" id="pt-btn-style-seg-thumb"></span>' +
            btnStyleOpt('modern', '立体按压') +
            btnStyleOpt('classic', '经典平面') +
            '</div>' +
            '</section>';
        return '<section id="pt-appearance-subpage-wrap" class="pt-subpage pt-subpage--appearance" style="display:none">' +
            '<div class="pt-subpage__head"><button type="button" class="pt-btn pt-btn--ghost pt-subpage__back" id="pt-appearance-back">← 返回</button><h4 class="pt-subpage__title">外观设置</h4></div>' +
            '<div class="pt-subpage__body">' + editorActions + themeCard + materialCard + smallCard + btnStyleCard + '</div>' +
            '</section>';
    }

    function renderStyleEditor(settings) {
        var material = getMaterialFromSelection(settings, settings.cardMaterial || settings.glassMode || 'gradient');
        var html = '<div class="pt-style-editor" id="pt-style-editor" data-dirty="0">';
        html += '<div class="pt-subpage__head"><button type="button" class="pt-btn pt-btn--ghost pt-subpage__back" id="pt-style-editor-back">← 返回</button><h4 class="pt-subpage__title">卡片材质</h4></div>';
        html += '<div class="pt-subpage__body pt-style-editor__body">';
        html += '<section class="pt-card pt-style-editor-card"><div class="pt-card__head"><h4 class="pt-card__title">卡片材质设计</h4></div>';
        html += '<button type="button" class="pt-inline-action" id="pt-material-load-btn" style="margin-bottom:8px">载入材质</button>';

        // ── 玻璃参数 ──
        html += '<div class="pt-theme-section-head" data-section="glass">玻璃参数</div><div class="pt-theme-section-body">';
        html += '<div class="pt-param-group-label">表面效果</div>';
        html += sliderRow('模糊度', 'pt-material-blur', 0, 50, material.blur != null ? material.blur : 18);
        html += sliderRow('玻璃反光强度', 'pt-material-sheen', 0, 100, material.sheen != null ? material.sheen : 0, '%');
        html += sliderRow('反光角度', 'pt-material-sheen-angle', 0, 360, material.sheenAngle != null ? material.sheenAngle : 135, 'deg');
        html += sliderRow('玻璃透明度', 'pt-material-glass-opacity', 0, 100, material.glassOpacity != null ? material.glassOpacity : 100, '%');
        html += sliderRow('玻璃内辉光', 'pt-material-glass-glow', 0, 100, material.glassGlow != null ? material.glassGlow : 0, '%');
        html += '<div class="pt-param-group-label" style="margin-top:10px">画面滤镜</div>';
        html += sliderRow('材质饱和度', 'pt-material-saturate', 50, 200, Math.round((material.saturate != null ? material.saturate : 1.22) * 100), '%');
        html += sliderRow('玻璃明度', 'pt-material-glass-brightness', 50, 200, material.glassBrightness != null ? material.glassBrightness : 100, '%');
        html += sliderRow('玻璃对比度', 'pt-material-glass-contrast', 50, 200, material.glassContrast != null ? material.glassContrast : 100, '%');
        html += sliderRow('色相偏移', 'pt-material-glass-hue-rotate', 0, 360, material.glassHueRotate != null ? material.glassHueRotate : 0, 'deg');
        html += sliderRow('底层防 bug 模糊度', 'pt-material-bug', 0, 50, material.bugBlur != null ? material.bugBlur : 18);

        html += '</div>';

        // ── 金属质感参数 ──
        html += '<div class="pt-theme-section-head" data-section="metal">金属质感参数</div><div class="pt-theme-section-body">';
        html += sliderRow('高光层强度', 'pt-material-highlight', 0, 100, material.highlight != null ? material.highlight : 0, '%');
        html += sliderRow('反差强度', 'pt-material-contrast', 0, 100, material.contrast != null ? material.contrast : 0, '%');
        html += sliderRow('内阴影强度', 'pt-material-inner-shadow', 0, 100, material.innerShadow != null ? material.innerShadow : 0, '%');
        html += sliderRow('内阴影厚度', 'pt-material-inner-shadow-thickness', 0, 100, material.innerShadowThickness != null ? material.innerShadowThickness : 0, '%');
        html += '</div>';

        // ── 金属纹理参数 ──
        html += '<div class="pt-theme-section-head" data-section="metal-texture">金属纹理参数</div><div class="pt-theme-section-body">';
        html += sliderRow('金属纹理强度', 'pt-material-metal-texture-strength', 0, 100, material.metalTextureStrength != null ? material.metalTextureStrength : 0, '%');
        html += sliderRow('金属纹理密度', 'pt-material-metal-texture-density', 0, 100, material.metalTextureDensity != null ? material.metalTextureDensity : 50, '%');
        html += sliderRow('金属纹理角度', 'pt-material-metal-texture-angle', 0, 180, material.metalTextureAngle != null ? material.metalTextureAngle : 100, 'deg');
        html += sliderRow('反射锐度', 'pt-material-metal-reflection-sharpness', 0, 100, material.metalReflectionSharpness != null ? material.metalReflectionSharpness : 0, '%');
        html += '</div>';

        // ── 木质参数 ──
        html += '<div class="pt-theme-section-head" data-section="wood">木质参数</div><div class="pt-theme-section-body">';
        html += sliderRow('木纹强度', 'pt-material-wood-strength', 0, 100, material.woodStrength != null ? material.woodStrength : 0, '%');
        html += sliderRow('木纹密度', 'pt-material-wood-density', 0, 100, material.woodDensity != null ? material.woodDensity : 50, '%');
        html += sliderRow('木纹角度', 'pt-material-wood-angle', 0, 180, material.woodAngle != null ? material.woodAngle : 96, 'deg');
        html += sliderRow('年轮强度', 'pt-material-wood-ring', 0, 100, material.woodRing != null ? material.woodRing : 0, '%');
        html += sliderRow('木结强度', 'pt-material-wood-knot', 0, 100, material.woodKnot != null ? material.woodKnot : 0, '%');
        html += '</div>';

        // ── 通用质感 ──
        html += '<div class="pt-theme-section-head" data-section="texture">通用质感</div><div class="pt-theme-section-body">';
        html += sliderRow('颗粒强度', 'pt-material-grain', 0, 100, material.grain != null ? material.grain : 0, '%');
        html += sliderRow('暗角强度', 'pt-material-vignette', 0, 100, material.vignette != null ? material.vignette : 0, '%');
        html += sliderRow('辉光强度', 'pt-material-bloom', 0, 100, material.bloom != null ? material.bloom : 0, '%');
        html += '</div>';

        html += '<div class="pt-style-save-row pt-style-action-row"><button type="button" class="pt-inline-action" id="pt-save-material-preset">保存材质</button><button type="button" class="pt-inline-action" id="pt-manage-material-presets">管理我的材质</button></div>';
        html += '</section>';
        html += '</div>';
        html += '<div class="pt-load-modal pt-load-modal--save" id="pt-material-save-modal" hidden>';
        html += '<div class="pt-load-modal__overlay" data-material-save-close></div>';
        html += '<div class="pt-load-modal__box">';
        html += '<div class="pt-load-modal__title">保存材质</div>';
        html += '<div class="pt-load-modal__body"><input type="text" class="pt-input" id="pt-material-preset-name" placeholder="材质预设名称"></div>';
        html += '<div class="pt-load-modal__foot">';
        html += '<button type="button" class="pt-inline-action" id="pt-material-save-confirm">保存</button>';
        html += '<button type="button" class="pt-inline-action" data-material-save-close>取消</button>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
        html += '<div class="pt-load-modal" id="pt-material-load-modal" hidden>';
        html += '<div class="pt-load-modal__overlay" data-material-load-close></div>';
        html += '<div class="pt-load-modal__box">';
        html += '<div class="pt-load-modal__title">选择材质</div>';
        html += '<div class="pt-load-modal__body">' + renderMaterialGridPanel('pt-material-load-grid', settings.cardMaterial || settings.glassMode || 'gradient', settings, false) + '</div>';
        html += '<div class="pt-load-modal__foot">';
        html += '<button type="button" class="pt-inline-action" id="pt-material-load-confirm">确定</button>';
        html += '<button type="button" class="pt-inline-action" data-material-load-close>取消</button>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
        html += '<div class="pt-style-unsaved-modal" id="pt-style-unsaved-modal" hidden><div class="pt-style-unsaved-modal__box"><strong>有未保存改动</strong><p>离开高级面板前要如何处理？</p><div><button type="button" class="pt-inline-action" data-style-exit="save">保存</button><button type="button" class="pt-inline-action" data-style-exit="discard">不保存返回</button><button type="button" class="pt-inline-action" data-style-exit="cancel">取消</button></div></div></div>';
        html += '</div>';
        return html;
    }

    function escapeProfileText(value) {
        return String(value || '').replace(/[&<>"']/g, function(ch) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
        });
    }

    function renderProfileLoadList(profiles, activeId) {
        if (!profiles.length) return '<p class="pt-subtext">还没有本机档案</p>';
        return '<div class="pt-profile-load-list">' + profiles.map(function(profile) {
            var selected = profile.id === activeId ? ' pt-profile-load-item--active' : '';
            return '<button type="button" class="pt-profile-load-item' + selected + '" data-profile-load-id="' + profile.id + '">' +
                '<span>' + escapeProfileText(profile.name) + '</span>' +
                '<small>编号：' + profile.id + '</small>' +
                '</button>';
        }).join('') + '</div>';
    }

    function renderAuthSection() {
        if (typeof window.PT_AUTH === 'undefined') return '<p class="pt-subtext">本机用户档案系统未加载</p>';
        var activeId = window.PT_AUTH.getProfileID();
        var html = '<div class="pt-profile-panel">';
        if (window.PT_AUTH.isLoggedIn()) {
            html += '<p class="pt-profile-user">当前档案：' + escapeProfileText(window.PT_AUTH.getProfileName()) + '（编号：' + activeId + '）</p>';
        } else {
            html += '<button type="button" class="pt-btn pt-btn--primary pt-btn--block" data-action="open-profile-load">载入本机档案</button>';
        }
        html += '<div class="pt-profile-form">';
        if (window.PT_AUTH.isLoggedIn()) {
            html += '<button type="button" class="pt-btn pt-btn--ghost pt-btn--block" data-action="open-profile-load">载入本机档案</button>';
        }
        html += '<div class="pt-profile-buttons"><button type="button" class="pt-btn pt-btn--primary" data-action="open-profile-create">新建本机档案</button><button type="button" class="pt-btn pt-btn--ghost" data-action="logout">退出当前档案</button></div>';
        html += '</div></div>';
        return html;
    }

    function renderProfileSubpage() {
        var profiles = typeof window.PT_AUTH !== 'undefined' ? window.PT_AUTH.listProfiles() : [];
        var activeId = typeof window.PT_AUTH !== 'undefined' ? window.PT_AUTH.getProfileID() : null;
        return '<section id="pt-profile-subpage-wrap" class="pt-subpage pt-subpage--profile" style="display:none">' +
            '<div class="pt-subpage__head"><button type="button" class="pt-btn pt-btn--ghost pt-subpage__back" id="pt-profile-back">← 返回</button><h4 class="pt-subpage__title">本机档案</h4></div>' +
            '<div class="pt-subpage__body"><section class="pt-card"><div class="pt-auth-section">' + renderAuthSection() + '</div></section></div>' +
            '<div class="pt-load-modal" id="pt-profile-load-modal" hidden>' +
            '<div class="pt-load-modal__overlay" data-profile-load-close></div>' +
            '<div class="pt-load-modal__box">' +
            '<div class="pt-load-modal__title">载入本机档案</div>' +
            '<div class="pt-load-modal__body" id="pt-profile-load-list">' + renderProfileLoadList(profiles, activeId) + '</div>' +
            '<div class="pt-load-modal__foot"><button type="button" class="pt-inline-action" data-action="confirm-profile-load">载入</button><button type="button" class="pt-inline-action" data-profile-load-close>取消</button></div>' +
            '</div></div>' +
            '<div class="pt-load-modal pt-load-modal--save" id="pt-profile-create-modal" hidden>' +
            '<div class="pt-load-modal__overlay" data-profile-create-close></div>' +
            '<div class="pt-load-modal__box">' +
            '<div class="pt-load-modal__title">新建本机档案</div>' +
            '<div class="pt-load-modal__body"><input type="text" class="pt-input" data-profile-create-name placeholder="档案名称"></div>' +
            '<div class="pt-load-modal__foot"><button type="button" class="pt-inline-action" data-action="save-profile-create">保存</button><button type="button" class="pt-inline-action" data-profile-create-close>取消</button></div>' +
            '</div></div>' +
            '</section>';
    }

    function refreshProfilePanel(root) {
        var authSection = root.querySelector('.pt-auth-section');
        if (authSection) authSection.innerHTML = renderAuthSection();
        var list = root.querySelector('#pt-profile-load-list');
        if (list && typeof window.PT_AUTH !== 'undefined') {
            list.innerHTML = renderProfileLoadList(window.PT_AUTH.listProfiles(), window.PT_AUTH.getProfileID());
        }
    }

    function renderMaterialEditorPage(settings) {
        return '<section id="pt-style-editor-wrap" class="pt-subpage pt-subpage--style-editor" style="display:none">' + renderStyleEditor(settings) + '</section>';
    }

    function ensureSettingsPage(root, selector, html) {
        var page = root.querySelector(selector);
        if (page) return page;
        var pageRoot = getSettingsSubpageRoot(root);
        pageRoot.insertAdjacentHTML('beforeend', html);
        page = root.querySelector(selector);
        bindSettingFields(page, root);
        return page;
    }

    function replaceSettingsPage(root, selector, html) {
        var page = root.querySelector(selector);
        if (page && page.parentNode) page.parentNode.removeChild(page);
        return ensureSettingsPage(root, selector, html);
    }

    function renderMagnetSubpage(settings) {
        var snapOn = (settings.screenSnapMode || settings.cardSnapMode || 'codex') !== 'off';
        var snapPreview = settings.screenSnapPreview !== false;
        var magnetMode = settings.cardMagnetMode || 'physics';
        var magnetPreview = settings.magnetPreview !== false;
        var magnetAlign = settings.magnetAlign !== false;
        var breakForce = settings.magnetBreakForce != null ? settings.magnetBreakForce : 2.5;
        var snapSpeed = settings.magnetSnapSpeed != null ? settings.magnetSnapSpeed : 0.8;

        function toggleRow(label, field, checked) {
            return '<label class="pt-toggle" style="margin-top:8px"><span class="pt-toggle__control"><input type="checkbox" class="pt-toggle__input" data-setting-field="' + field + '"' + (checked ? ' checked' : '') + '><span class="pt-toggle__track"></span></span><span class="pt-toggle__label">' + label + '</span></label>';
        }
        function segOpt(value, label, current) {
            return '<button type="button" class="pt-seg__opt' + (value === current ? ' pt-seg__opt--active' : '') + '" data-seg-value="' + value + '">' + label + '</button>';
        }

        var snapCard =
            '<section class="pt-card" style="margin-bottom:14px">' +
                '<div class="pt-card__head"><h4 class="pt-card__title">屏幕辅助吸附</h4>' +
                    '<label class="pt-toggle"><span class="pt-toggle__control"><input type="checkbox" class="pt-toggle__input" id="pt-snap-master"' + (snapOn ? ' checked' : '') + '><span class="pt-toggle__track"></span></span></label>' +
                '</div>' +
                '<div id="pt-snap-body"' + (snapOn ? '' : ' hidden') + ' style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.06)">' +
                    toggleRow('预览框', 'screenSnapPreview', snapPreview) +
                '</div>' +
            '</section>';

        var magnetCard =
            '<section class="pt-card">' +
                '<div class="pt-card__head"><h4 class="pt-card__title">卡片磁吸</h4>' +
                    '<div class="pt-seg" id="pt-magnet-seg" data-seg-active="' + magnetMode + '">' +
                        '<span class="pt-seg__thumb" id="pt-magnet-seg-thumb"></span>' +
                        segOpt('off', '关闭', magnetMode) +
                        segOpt('normal', '普通', magnetMode) +
                        segOpt('physics', '拟真', magnetMode) +
                    '</div>' +
                '</div>' +
                '<div id="pt-magnet-body" style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.06)">' +
                    '<div data-magnet-mode="off"' + (magnetMode === 'off' ? '' : ' hidden') + '></div>' +
                    '<div data-magnet-mode="normal"' + (magnetMode === 'normal' ? '' : ' hidden') + '>' +
                        toggleRow('预览框', 'magnetPreview', magnetPreview) +
                        toggleRow('吸附对齐', 'magnetAlign', magnetAlign) +
                    '</div>' +
                    '<div data-magnet-mode="physics"' + (magnetMode === 'physics' ? '' : ' hidden') + '>' +
                        toggleRow('吸附对齐', 'magnetAlign', magnetAlign) +
                        '<div class="pt-color-row pt-color-row--range" style="margin-top:10px"><label>吸附阈值</label><input type="range" class="pt-range-input pt-cc-common" data-setting-field="magnetSnapSpeed" data-setting-suffix="" min="0.1" max="3" step="0.1" value="' + snapSpeed + '"><span class="val">' + snapSpeed + '</span></div>' +
                        '<div class="pt-color-row pt-color-row--range" style="margin-top:10px"><label>脱离力度</label><input type="range" class="pt-range-input pt-cc-common" data-setting-field="magnetBreakForce" data-setting-suffix="" min="0.5" max="10" step="0.1" value="' + breakForce + '"><span class="val">' + breakForce + '</span></div>' +
                    '</div>' +
                '</div>' +
            '</section>';

        return '<section id="pt-magnet-subpage-wrap" class="pt-subpage pt-subpage--magnet" style="display:none">' +
            '<div class="pt-subpage__head"><button type="button" class="pt-btn pt-btn--ghost pt-subpage__back" id="pt-magnet-back">← 返回</button><h4 class="pt-subpage__title">磁吸系统</h4></div>' +
            '<div class="pt-subpage__body">' + snapCard + magnetCard + '</div>' +
            '</section>';
    }

    function render() {
        var settings = readSettingsFor(root);
        return '<div class="pt-settings-root pt-mainpage">' + renderWallpaperCard() + renderStyleCard() + '</div>';
    }

    function readMaterialEditor(root) {
        var editor = root.querySelector('#pt-style-editor');
        var metalTexture = editor ? editor.getAttribute('data-metal-texture') : '';
        var woodStyle = editor ? editor.getAttribute('data-wood-style') : '';
        var woodLight = editor ? editor.getAttribute('data-wood-light') : '';
        var woodMid = editor ? editor.getAttribute('data-wood-mid') : '';
        var woodDark = editor ? editor.getAttribute('data-wood-dark') : '';
        var metalAngleInput = root.querySelector('#pt-material-metal-texture-angle');
        var metalAngleValue = metalAngleInput ? parseFloat(metalAngleInput.value) : NaN;
        var woodAngleInput = root.querySelector('#pt-material-wood-angle');
        var woodAngleValue = woodAngleInput ? parseFloat(woodAngleInput.value) : NaN;
        return {
            id: 'custom',
            label: '自定义材质',
            blur: parseFloat((root.querySelector('#pt-material-blur') || {}).value) || 0,
            saturate: parseFloat((root.querySelector('#pt-material-saturate') || {}).value || 100) / 100,
            bugBlur: parseFloat((root.querySelector('#pt-material-bug') || {}).value) || 0,
            glassBrightness: parseFloat((root.querySelector('#pt-material-glass-brightness') || {}).value) || 100,
            glassContrast: parseFloat((root.querySelector('#pt-material-glass-contrast') || {}).value) || 100,
            glassHueRotate: parseFloat((root.querySelector('#pt-material-glass-hue-rotate') || {}).value) || 0,
            sheen: parseFloat((root.querySelector('#pt-material-sheen') || {}).value) || 0,
            sheenAngle: parseFloat((root.querySelector('#pt-material-sheen-angle') || {}).value) || 135,
            glassGlow: parseFloat((root.querySelector('#pt-material-glass-glow') || {}).value) || 0,
            glassOpacity: parseFloat((root.querySelector('#pt-material-glass-opacity') || {}).value) || 100,
            highlight: parseFloat((root.querySelector('#pt-material-highlight') || {}).value) || 0,
            contrast: parseFloat((root.querySelector('#pt-material-contrast') || {}).value) || 0,
            innerShadow: parseFloat((root.querySelector('#pt-material-inner-shadow') || {}).value) || 0,
            innerShadowThickness: parseFloat((root.querySelector('#pt-material-inner-shadow-thickness') || {}).value) || 0,
            metalTexture: metalTexture || null,
            metalTextureStrength: parseFloat((root.querySelector('#pt-material-metal-texture-strength') || {}).value) || 0,
            metalTextureDensity: parseFloat((root.querySelector('#pt-material-metal-texture-density') || {}).value) || 0,
            metalTextureAngle: isFinite(metalAngleValue) ? metalAngleValue : 100,
            metalReflectionSharpness: parseFloat((root.querySelector('#pt-material-metal-reflection-sharpness') || {}).value) || 0,
            grain: parseFloat((root.querySelector('#pt-material-grain') || {}).value) || 0,
            vignette: parseFloat((root.querySelector('#pt-material-vignette') || {}).value) || 0,
            bloom: parseFloat((root.querySelector('#pt-material-bloom') || {}).value) || 0,
            woodStrength: parseFloat((root.querySelector('#pt-material-wood-strength') || {}).value) || 0,
            woodDensity: parseFloat((root.querySelector('#pt-material-wood-density') || {}).value) || 0,
            woodAngle: isFinite(woodAngleValue) ? woodAngleValue : 96,
            woodRing: parseFloat((root.querySelector('#pt-material-wood-ring') || {}).value) || 0,
            woodKnot: parseFloat((root.querySelector('#pt-material-wood-knot') || {}).value) || 0,
            woodStyle: woodStyle || null,
            woodLight: woodLight || null,
            woodMid: woodMid || null,
            woodDark: woodDark || null
        };
    }

    function updateValueLabels(root) {
        root.querySelectorAll('.pt-cc-alpha').forEach(function(input) {
            var label = root.querySelector('#' + input.id + '-v');
            if (label) label.textContent = (parseFloat(input.value) / 100).toFixed(2);
        });
        root.querySelectorAll('.pt-cc-common').forEach(function(input) {
            var label = root.querySelector('#' + input.id + '-v');
            if (label) {
                var suffix = '';
                if (input.id.indexOf('sat') >= 0 || input.id.indexOf('brightness') >= 0 || input.id.indexOf('highlight') >= 0 || input.id.indexOf('grain') >= 0 || input.id.indexOf('vignette') >= 0 || input.id.indexOf('bloom') >= 0 || input.id.indexOf('sheen') >= 0 || input.id.indexOf('glass-glow') >= 0 || input.id.indexOf('glass-opacity') >= 0 || input.id.indexOf('wood-strength') >= 0 || input.id.indexOf('wood-density') >= 0 || input.id.indexOf('wood-ring') >= 0 || input.id.indexOf('wood-knot') >= 0 || input.id.indexOf('metal-texture-strength') >= 0 || input.id.indexOf('metal-texture-density') >= 0 || input.id.indexOf('metal-reflection-sharpness') >= 0) {
                    suffix = '%';
                } else if (input.id.indexOf('blur') >= 0 || input.id.indexOf('bug') >= 0) {
                    suffix = 'px';
                } else if (input.id.indexOf('hue-rotate') >= 0 || input.id.indexOf('sheen-angle') >= 0 || input.id.indexOf('metal-texture-angle') >= 0) {
                    suffix = 'deg';
                }
                label.textContent = input.value + suffix;
            }
        });
        updateRangeVisuals(root);
    }

    function updateRangeVisual(input) {
        if (!input) return;
        var min = parseFloat(input.min);
        var max = parseFloat(input.max);
        var value = parseFloat(input.value);
        if (!isFinite(min)) min = 0;
        if (!isFinite(max) || max <= min) max = 100;
        if (!isFinite(value)) value = min;
        var progress = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
        input.style.setProperty('--pt-range-progress', progress + '%');
        if (min < 100 && max > 100) {
            var mid = Math.max(0, Math.min(100, ((100 - min) / (max - min)) * 100));
            input.style.setProperty('--pt-range-mid', mid + '%');
            input.style.setProperty('--pt-range-mid-color', 'rgba(255,255,255,0.28)');
        } else {
            input.style.setProperty('--pt-range-mid-color', 'transparent');
        }
    }

    function updateRangeVisuals(root) {
        root.querySelectorAll('.pt-range-input').forEach(updateRangeVisual);
    }

    function updateSettingRangeLabel(field) {
        var wrap = field ? field.closest('.pt-color-row') : null;
        var label = wrap ? wrap.querySelector('.val') : null;
        if (label) {
            var suffix = field.dataset.settingSuffix != null ? field.dataset.settingSuffix : '%';
            label.textContent = field.value + suffix;
        }
    }

    function readSettingFieldValue(field) {
        if (field.type === 'checkbox') return field.checked;
        if (field.dataset.settingRatio === '1') {
            var ratioValue = parseFloat(field.value);
            if (!isFinite(ratioValue)) ratioValue = 100;
            return ratioValue / 100;
        }
        return field.value;
    }

    function applyThemePresetPreview(root) {
        var themeWrap = root.querySelector('#pt-theme-editor-wrap');
        var next = readSettingsFor(root);
        var previewName = '__preview__';
        next.cardThemePresets = Object.assign({}, next.cardThemePresets || {});
        next.cardThemePresets[previewName] = PP.readThemeEditor(root);
        next.cardBackgroundTheme = 'custom:' + previewName;
        applySettingsFor(root, next);
        if (themeWrap && themeWrap.getAttribute('data-silent-fill') !== '1') markThemeEditorDirty(root, true);
    }

    function applyMaterialPreview(root) {
        var editor = root.querySelector('#pt-style-editor');
        var next = readSettingsFor(root);
        var previewName = '__preview__';
        next.cardMaterialPresets = Object.assign({}, next.cardMaterialPresets || {});
        var preset = readMaterialEditor(root);
        next.cardMaterialPresets[previewName] = preset;
        next.cardMaterial = 'custom:' + previewName;
        next.glassMode = 'gradient';
        applySettingsFor(root, next);
        if (!editor || editor.getAttribute('data-silent-fill') !== '1') markEditorDirty(root, true);
    }

    function markEditorDirty(root, dirty) {
        var editor = root.querySelector('#pt-style-editor');
        if (editor) editor.setAttribute('data-dirty', dirty ? '1' : '0');
    }

    function markThemeEditorDirty(root, dirty) {
        var wrap = root.querySelector('#pt-theme-editor-wrap');
        if (wrap) wrap.setAttribute('data-dirty', dirty ? '1' : '0');
    }

    function saveThemePreset(root, fallbackName) {
        var input = root.querySelector('#pt-theme-preset-name');
        var name = input && input.value.trim() ? input.value.trim() : fallbackName;
        if (!name) return false;
        var next = readSettingsFor(root);
        if (!next.cardThemePresets) next.cardThemePresets = {};
        next.cardThemePresets[name] = PP.readThemeEditor(root);
        next.cardBackgroundTheme = 'custom:' + name;
        writeSettingsFor(root, next);
        applySettingsFor(root, next);
        if (input) input.value = '';
        refreshThemePresetViews(root, next);
        return true;
    }

    function refreshThemePresetViews(root, settings) {
        var bgGrid = root.querySelector('.pt-theme-grid-select[data-target="cardBackgroundTheme"]');
        if (bgGrid) bgGrid.outerHTML = renderThemeGridPanel('cardBackgroundTheme', settings.cardBackgroundTheme || 'theme:oceanic', settings);
        var uiGrid = root.querySelector('.pt-theme-grid-select[data-target="cardUiTheme"]');
        if (uiGrid) uiGrid.outerHTML = renderThemeGridPanel('cardUiTheme', settings.cardUiTheme || 'theme:oceanic', settings);
        var smallGrid = root.querySelector('.pt-theme-grid-select[data-target="smallCardTheme"]');
        if (smallGrid) smallGrid.outerHTML = renderThemeGridPanel('smallCardTheme', settings.smallCardTheme || 'theme:oceanic', settings);
        syncThemeLoadGridSelection(root, settings);
        var manager = root.querySelector('#pt-theme-preset-manager-grid');
        if (manager) manager.innerHTML = renderThemeManagerGrid(settings);
    }

    function refreshMaterialPresetViews(root, settings) {
        var wrapper = root.querySelector('.pt-theme-grid-select[data-target="cardMaterial"]');
        if (wrapper) wrapper.outerHTML = renderMaterialGridPanel('cardMaterial', settings.cardMaterial || settings.glassMode || 'gradient', settings);
        var smallWrapper = root.querySelector('.pt-theme-grid-select[data-target="smallCardMaterial"]');
        if (smallWrapper) smallWrapper.outerHTML = renderMaterialGridPanel('smallCardMaterial', settings.smallCardMaterial || 'smallTranslucent', settings);
        syncMaterialLoadGridSelection(root, settings);
        var manager = root.querySelector('#pt-material-preset-manager-grid');
        if (manager) manager.innerHTML = renderMaterialManagerGrid(settings);
    }

    function getLoadedThemeSelection(root, settings) {
        var themeWrap = root.querySelector('#pt-theme-editor-wrap');
        return (themeWrap && themeWrap.getAttribute('data-loaded-theme-selection')) || (settings && settings.cardBackgroundTheme) || 'theme:oceanic';
    }

    function getLoadedMaterialSelection(root, settings) {
        var editor = root.querySelector('#pt-style-editor');
        return (editor && editor.getAttribute('data-loaded-material-selection')) || (settings && (settings.cardMaterial || settings.glassMode)) || 'gradient';
    }

    function syncThemeLoadGridSelection(root, settings) {
        var next = settings || (readSettingsFor(root));
        var loadGrid = root.querySelector('.pt-theme-grid-select[data-target="pt-theme-load-grid"]');
        if (loadGrid) loadGrid.outerHTML = renderThemeGridPanel('pt-theme-load-grid', getLoadedThemeSelection(root, next), next, false);
    }

    function syncMaterialLoadGridSelection(root, settings) {
        var next = settings || (readSettingsFor(root));
        var loadGrid = root.querySelector('.pt-theme-grid-select[data-target="pt-material-load-grid"]');
        if (loadGrid) loadGrid.outerHTML = renderMaterialGridPanel('pt-material-load-grid', getLoadedMaterialSelection(root, next), next, false);
    }

    function saveMaterialPreset(root, fallbackName) {
        var input = root.querySelector('#pt-material-preset-name');
        var name = input && input.value.trim() ? input.value.trim() : fallbackName;
        if (!name) return false;
        var next = readSettingsFor(root);
        if (!next.cardMaterialPresets) next.cardMaterialPresets = {};
        var preset = readMaterialEditor(root);
        next.cardMaterialPresets[name] = preset;
        next.cardMaterial = 'custom:' + name;
        next.glassMode = 'gradient';
        writeSettingsFor(root, next);
        applySettingsFor(root, next);
        if (input) input.value = '';
        refreshMaterialPresetViews(root, next);
        return true;
    }

    function closeStyleEditor(root, restoreBaseline) {
        if (restoreBaseline && _styleEditorBaseline) {
            writeSettingsFor(root, JSON.parse(_styleEditorBaseline));
            applySettingsFor(root, readSettingsFor(root));
        }
        var pageRoot = getSettingsSubpageRoot(root);
        var wrap = root.querySelector('#pt-style-editor-wrap');
        var returnTarget = wrap ? wrap.getAttribute('data-return-target') : null;
        if (wrap) wrap.style.display = 'none';
        var returnPage = returnTarget ? root.querySelector(returnTarget) : null;
        if (returnPage || root.querySelector('#pt-appearance-subpage-wrap')) {
            if (!returnPage && wrap) wrap.setAttribute('data-return-target', '#pt-appearance-subpage-wrap');
            PT_returnToAppearanceSettings(root, wrap);
        } else {
            PT_closeSettingsToMain(root);
        }
        var modal = root.querySelector('#pt-style-unsaved-modal');
        if (modal) modal.hidden = true;
        _styleEditorBaseline = null;
    }

    function fillThemeEditor(root, selection, silent) {
        var settings = readSettingsFor(root);
        var themeWrap = root.querySelector('#pt-theme-editor-wrap');
        if (themeWrap) themeWrap.setAttribute('data-loaded-theme-selection', selection || 'none');
        var p;
        if (selection === 'none' || !selection) {
            p = { angle: 145, stops: [
                { c: '#061626', a: 0.82, pos: 0, exposure: 100, contrast: 100, vibrance: 100, temperature: 100, tint: 100 },
                { c: '#08101c', a: 0.68, pos: 48, exposure: 100, contrast: 100, vibrance: 100, temperature: 100, tint: 100 },
                { c: '#0c1622', a: 0.72, pos: 100, exposure: 100, contrast: 100, vibrance: 100, temperature: 100, tint: 100 }
            ], c1: '#061626', a1: 0.82, c2: '#08101c', a2: 0.68, c3: '#0c1622', a3: 0.72, brightness: 1, sat: 1, highlight: 0, gradientType: 'linear', easing: 'linear', splitBalance: 50, splitHighlight: '#ffcc88', splitShadow: '#334466' };
        } else {
            p = getThemePaletteFromSelection(settings, selection);
        }
        if (typeof PP.loadStopsFromPalette === 'function') {
            PP.loadStopsFromPalette(p);
        }
        var map = { '#pt-theme-angle': p.angle || 145, '#pt-theme-brightness': Math.round((p.brightness != null ? p.brightness : 1) * 100), '#pt-theme-sat': Math.round((p.sat || 1) * 100), '#pt-theme-highlight': p.highlight != null ? p.highlight : 0, '#pt-theme-split-balance': p.splitBalance != null ? p.splitBalance : 50, '#pt-theme-split-hi': p.splitHighlight || '#ffcc88', '#pt-theme-split-sh': p.splitShadow || '#334466' };
        if (p.gradientType) { var gs = root.querySelector('#pt-theme-gradient-type'); if (gs) gs.value = p.gradientType; }
        if (p.easing) { var es = root.querySelector('#pt-theme-easing'); if (es) es.value = p.easing; }
        Object.keys(map).forEach(function(sel) { var el = root.querySelector(sel); if (el) el.value = map[sel]; });
        if (typeof PP.rebuildStopRows === 'function') PP.rebuildStopRows(root, true);
        updateValueLabels(root);
        if (typeof PP.syncPickerSwatches === 'function') PP.syncPickerSwatches(root);
        if (typeof PP.setActiveStop === 'function') PP.setActiveStop(root, 0);
        if (silent && themeWrap) themeWrap.setAttribute('data-silent-fill', '1');
        applyThemePresetPreview(root);
        if (silent && themeWrap) {
            themeWrap.removeAttribute('data-silent-fill');
            markThemeEditorDirty(root, false);
        }
    }

    function fillMaterialEditor(root, selection, silent) {
        var settings = readSettingsFor(root);
        var editor = root.querySelector('#pt-style-editor');
        if (editor) editor.setAttribute('data-loaded-material-selection', selection || 'none');
        var m;
        if (selection === 'none' || !selection) {
            m = { blur: 0, saturate: 1, bugBlur: 0, glassBrightness: 100, glassContrast: 100, glassHueRotate: 0, glassOpacity: 100, glassGlow: 0, sheen: 0, sheenAngle: 135, highlight: 0, innerShadow: 0, innerShadowThickness: 0, contrast: 50, grain: 0, vignette: 0, bloom: 0 };
        } else {
            m = getMaterialFromSelection(settings, selection);
        }
        if (editor) {
            if (m.metalTexture) editor.setAttribute('data-metal-texture', m.metalTexture); else editor.removeAttribute('data-metal-texture');
            if (m.woodStyle) editor.setAttribute('data-wood-style', m.woodStyle); else editor.removeAttribute('data-wood-style');
            if (m.woodLight) editor.setAttribute('data-wood-light', m.woodLight); else editor.removeAttribute('data-wood-light');
            if (m.woodMid) editor.setAttribute('data-wood-mid', m.woodMid); else editor.removeAttribute('data-wood-mid');
            if (m.woodDark) editor.setAttribute('data-wood-dark', m.woodDark); else editor.removeAttribute('data-wood-dark');
        }
        var map = {
            '#pt-material-blur': m.blur != null ? m.blur : 0,
            '#pt-material-saturate': Math.round((m.saturate != null ? m.saturate : 1) * 100),
            '#pt-material-bug': m.bugBlur != null ? m.bugBlur : 0,
            '#pt-material-glass-brightness': m.glassBrightness != null ? m.glassBrightness : 100,
            '#pt-material-glass-contrast': m.glassContrast != null ? m.glassContrast : 100,
            '#pt-material-glass-hue-rotate': m.glassHueRotate != null ? m.glassHueRotate : 0,
            '#pt-material-sheen': m.sheen != null ? m.sheen : 0,
            '#pt-material-sheen-angle': m.sheenAngle != null ? m.sheenAngle : 135,
            '#pt-material-glass-glow': m.glassGlow != null ? m.glassGlow : 0,
            '#pt-material-glass-opacity': m.glassOpacity != null ? m.glassOpacity : 100,
            '#pt-material-highlight': m.highlight != null ? m.highlight : 0,
            '#pt-material-contrast': m.contrast != null ? m.contrast : 0,
            '#pt-material-inner-shadow': m.innerShadow != null ? m.innerShadow : 0,
            '#pt-material-inner-shadow-thickness': m.innerShadowThickness != null ? m.innerShadowThickness : 0,
            '#pt-material-metal-texture-strength': m.metalTextureStrength != null ? m.metalTextureStrength : 0,
            '#pt-material-metal-texture-density': m.metalTextureDensity != null ? m.metalTextureDensity : 50,
            '#pt-material-metal-texture-angle': m.metalTextureAngle != null ? m.metalTextureAngle : 100,
            '#pt-material-metal-reflection-sharpness': m.metalReflectionSharpness != null ? m.metalReflectionSharpness : 0,
            '#pt-material-grain': m.grain != null ? m.grain : 0,
            '#pt-material-vignette': m.vignette != null ? m.vignette : 0,
            '#pt-material-bloom': m.bloom != null ? m.bloom : 0,
            '#pt-material-wood-strength': m.woodStrength != null ? m.woodStrength : 0,
            '#pt-material-wood-density': m.woodDensity != null ? m.woodDensity : 50,
            '#pt-material-wood-angle': m.woodAngle != null ? m.woodAngle : 96,
            '#pt-material-wood-ring': m.woodRing != null ? m.woodRing : 0,
            '#pt-material-wood-knot': m.woodKnot != null ? m.woodKnot : 0
        };
        Object.keys(map).forEach(function(sel) { var el = root.querySelector(sel); if (el) el.value = map[sel]; });
        updateValueLabels(root);
        if (silent && editor) editor.setAttribute('data-silent-fill', '1');
        applyMaterialPreview(root);
        if (silent && editor) {
            editor.removeAttribute('data-silent-fill');
            markEditorDirty(root, false);
        }
    }

    function refreshWallpaperViews(root) {
        var settings = readSettingsFor(root);
        var grid = root.querySelector('#pt-wallpaper-grid');
        if (grid) {
            var html = '';
            var presets = window.PT_WALLPAPER_PRESETS || [];
            for (var i = 0; i < presets.length; i++) html += renderPresetWallpaperCard(presets[i], settings);
            html += renderThemeWallpaperEntry(settings);
            html += renderMyWallpaperEntry(settings);
            grid.innerHTML = html;
        }
        var themeGrid = root.querySelector('#pt-theme-wallpaper-grid');
        if (themeGrid) themeGrid.innerHTML = renderThemeWallpaperCards(settings);
        var lib = root.querySelector('#pt-wallpaper-lib');
        if (lib) lib.innerHTML = renderWallpaperLibraryGrid(settings);
    }

    function getSettingsSubpageRoot(root) {
        return root.querySelector('.pt-window-card__body--settings') || root;
    }

    function PT_closeSettingsToMain(root) {
        var pageRoot = getSettingsSubpageRoot(root);
        pageRoot.classList.remove('pt-subpage-active');
        pageRoot.classList.remove('pt-settings-subpage-active');
        Array.prototype.slice.call(pageRoot.classList).forEach(function(className) {
            if (className.indexOf('pt-settings-subpage--') === 0) {
                pageRoot.classList.remove(className);
            }
        });
        pageRoot.querySelectorAll('.pt-subpage').forEach(function(page) {
            page.style.display = 'none';
        });
    }

    function PT_returnToAppearanceSettings(root, currentWrap) {
        var pageRoot = getSettingsSubpageRoot(root);
        var appearanceWrap = root.querySelector('#pt-appearance-subpage-wrap');
        if (!appearanceWrap) return false;
        pageRoot.classList.remove('pt-settings-subpage--style-editor');
        pageRoot.classList.remove('pt-settings-subpage--preset-manager');
        pageRoot.classList.add('pt-subpage-active');
        pageRoot.classList.add('pt-settings-subpage-active');
        pageRoot.classList.add('pt-settings-subpage--appearance');
        if (currentWrap) {
            currentWrap.style.display = 'none';
            currentWrap.removeAttribute('data-return-target');
        }
        appearanceWrap.style.display = 'flex';
        return true;
    }

    function openWallpaperLibrary(root) {
        var main = root.querySelector('#pt-wallpaper-main-panel');
        var panel = root.querySelector('#pt-wallpaper-library-panel');
        var pageRoot = getSettingsSubpageRoot(root);
        pageRoot.classList.add('pt-subpage-active');
        pageRoot.classList.add('pt-settings-subpage-active');
        pageRoot.classList.add('pt-settings-subpage--wallpaper-library');
        if (main) main.style.display = 'none';
        if (panel) panel.style.display = '';
        refreshWallpaperViews(root);
    }

    function closeWallpaperLibrary(root) {
        var main = root.querySelector('#pt-wallpaper-main-panel');
        var panel = root.querySelector('#pt-wallpaper-library-panel');
        var pageRoot = getSettingsSubpageRoot(root);
        pageRoot.classList.remove('pt-subpage-active');
        pageRoot.classList.remove('pt-settings-subpage-active');
        pageRoot.classList.remove('pt-settings-subpage--wallpaper-library');
        pageRoot.classList.remove('pt-settings-subpage--wallpaper-delete');
        if (main) main.style.display = '';
        if (panel) {
            panel.style.display = 'none';
            panel.classList.remove('pt-wallpaper-delete-mode');
        }
        var btn = root.querySelector('#pt-wallpaper-delete-action');
        if (btn) btn.textContent = '删除壁纸';
        refreshWallpaperViews(root);
    }

    function openThemeWallpaperPanel(root) {
        var main = root.querySelector('#pt-wallpaper-main-panel');
        var panel = root.querySelector('#pt-theme-wallpaper-panel');
        var pageRoot = getSettingsSubpageRoot(root);
        pageRoot.classList.add('pt-subpage-active');
        pageRoot.classList.add('pt-settings-subpage-active');
        pageRoot.classList.add('pt-settings-subpage--theme-wallpaper');
        if (main) main.style.display = 'none';
        if (panel) panel.style.display = '';
        refreshWallpaperViews(root);
    }

    function closeThemeWallpaperPanel(root) {
        var main = root.querySelector('#pt-wallpaper-main-panel');
        var panel = root.querySelector('#pt-theme-wallpaper-panel');
        var pageRoot = getSettingsSubpageRoot(root);
        pageRoot.classList.remove('pt-subpage-active');
        pageRoot.classList.remove('pt-settings-subpage-active');
        pageRoot.classList.remove('pt-settings-subpage--theme-wallpaper');
        if (main) main.style.display = '';
        if (panel) panel.style.display = 'none';
        refreshWallpaperViews(root);
    }

    function openPresetManager(root, kind) {
        var pageRoot = getSettingsSubpageRoot(root);
        var page = root.querySelector(kind === 'theme' ? '#pt-manage-theme-page' : '#pt-manage-material-page');
        var sourceSelector = kind === 'theme' ? '#pt-theme-editor-wrap' : '#pt-style-editor-wrap';
        var source = root.querySelector(sourceSelector);
        pageRoot.classList.add('pt-subpage-active');
        pageRoot.classList.add('pt-settings-subpage-active');
        pageRoot.classList.add('pt-settings-subpage--preset-manager');
        if (source) source.style.display = 'none';
        if (page) {
            page.setAttribute('data-return-target', sourceSelector);
            page.style.display = '';
        }
        var settings = readSettingsFor(root);
        if (kind === 'theme') refreshThemePresetViews(root, settings);
        else refreshMaterialPresetViews(root, settings);
    }

    function closePresetManager(root) {
        var pageRoot = getSettingsSubpageRoot(root);
        pageRoot.classList.remove('pt-settings-subpage--preset-manager');
        var themePage = root.querySelector('#pt-manage-theme-page');
        var materialPage = root.querySelector('#pt-manage-material-page');
        var returnTarget = (themePage && themePage.style.display !== 'none' ? themePage : materialPage) || themePage || materialPage;
        var sourceSelector = returnTarget ? returnTarget.getAttribute('data-return-target') : null;
        if (themePage) themePage.style.display = 'none';
        if (materialPage) materialPage.style.display = 'none';
        var source = sourceSelector ? root.querySelector(sourceSelector) : null;
        if (source) source.style.display = 'flex';
    }

    function deleteThemePreset(root, name) {
        if (!name) return;
        var next = readSettingsFor(root);
        if (!next.cardThemePresets || !next.cardThemePresets[name]) return;
        delete next.cardThemePresets[name];
        if (next.cardBackgroundTheme === 'custom:' + name) next.cardBackgroundTheme = 'theme:oceanic';
        if (next.cardUiTheme === 'custom:' + name) next.cardUiTheme = 'theme:oceanic';
        if (next.smallCardTheme === 'custom:' + name) next.smallCardTheme = 'theme:oceanic';
        writeSettingsFor(root, next);
        applySettingsFor(root, next);
        refreshThemePresetViews(root, next);
    }

    function deleteMaterialPreset(root, name) {
        if (!name) return;
        var next = readSettingsFor(root);
        if (!next.cardMaterialPresets || !next.cardMaterialPresets[name]) return;
        delete next.cardMaterialPresets[name];
        if (next.cardMaterial === 'custom:' + name) {
            next.cardMaterial = 'gradient';
            next.glassMode = 'gradient';
        }
        if (next.smallCardMaterial === 'custom:' + name) next.smallCardMaterial = 'smallTranslucent';
        writeSettingsFor(root, next);
        applySettingsFor(root, next);
        refreshMaterialPresetViews(root, next);
    }

    function setWallpaperDeleteMode(root, enabled) {
        var panel = root.querySelector('#pt-wallpaper-library-panel');
        var btn = root.querySelector('#pt-wallpaper-delete-action');
        getSettingsSubpageRoot(root).classList.toggle('pt-settings-subpage--wallpaper-delete', enabled);
        if (panel) panel.classList.toggle('pt-wallpaper-delete-mode', enabled);
        if (btn) btn.textContent = enabled ? '退出删除' : '删除壁纸';
    }

    function applyCustomWallpaper(src, root) {
        if (!src) return;
        var next = readSettingsFor(root);
        next.wallpaper = 'custom';
        next.wallpaperCustom = src;
        next.wallpaperTheme = null;
        writeSettingsFor(root, next);
        applySettingsFor(root, next);
        refreshWallpaperViews(root);
    }

    function deleteCustomWallpaper(tile, root) {
        if (!tile) return;
        tile.classList.add('pt-wallpaper-library-tile--breaking');
        setTimeout(function() {
            var src = tile.getAttribute('data-wallpaper-src');
            var next = readSettingsFor(root);
            var lib = next.wallpaperLibrary || [];
            next.wallpaperLibrary = lib.filter(function(item) { return item !== src; });
            if (next.wallpaperCustom === src) {
                next.wallpaperCustom = null;
                if (next.wallpaper === 'custom') next.wallpaper = 'image-bg';
            }
            writeSettingsFor(root, next);
            applySettingsFor(root, next);
            refreshWallpaperViews(root);
        }, 260);
    }

    var wallpaperDrag = null;
    var suppressWallpaperClickUntil = 0;
    var wallpaperDocumentDragBound = false;

    function startWallpaperDrag(root, tile, event) {
        if (!tile || !root) return;
        if (event.button != null && event.button !== 0) return;
        event.preventDefault();
        var lib = root.querySelector('#pt-wallpaper-lib');
        if (!lib) return;
        var rect = tile.getBoundingClientRect();
        var placeholder = document.createElement('div');
        placeholder.className = 'pt-wallpaper-library-placeholder';
        lib.insertBefore(placeholder, tile);
        wallpaperDrag = {
            root: root,
            tile: tile,
            placeholder: placeholder,
            pointerId: event.pointerId,
            offsetX: event.clientX - rect.left,
            offsetY: event.clientY - rect.top,
            startX: event.clientX,
            startY: event.clientY,
            moved: false
        };
        lib.classList.add('pt-wallpaper-lib--sorting');
        tile.classList.add('pt-wallpaper-library-tile--dragging');
        tile.style.position = 'fixed';
        tile.style.left = rect.left + 'px';
        tile.style.top = rect.top + 'px';
        tile.style.width = rect.width + 'px';
        tile.style.height = rect.height + 'px';
        tile.style.margin = '0';
        tile.style.zIndex = '9999';
        tile.style.pointerEvents = 'none';
        tile.style.transform = 'scale(1.04)';
        tile.style.cursor = 'grabbing';
        if (tile.setPointerCapture && event.pointerId != null) tile.setPointerCapture(event.pointerId);
    }

    function moveWallpaperDrag(event) {
        if (!wallpaperDrag) return;
        event.preventDefault();
        var drag = wallpaperDrag;
        var dx = event.clientX - drag.startX;
        var dy = event.clientY - drag.startY;
        if (Math.abs(dx) + Math.abs(dy) > 6) drag.moved = true;
        drag.tile.style.left = (event.clientX - drag.offsetX) + 'px';
        drag.tile.style.top = (event.clientY - drag.offsetY) + 'px';
        var target = document.elementFromPoint(event.clientX, event.clientY);
        var over = target && target.closest ? target.closest('.pt-wallpaper-library-tile') : null;
        if (over && over !== drag.tile) {
            var lib = drag.root.querySelector('#pt-wallpaper-lib');
            var overRect = over.getBoundingClientRect();
            var sameRow = event.clientY >= overRect.top && event.clientY <= overRect.bottom;
            var before = sameRow ? event.clientX < overRect.left + overRect.width / 2 : event.clientY < overRect.top + overRect.height / 2;
            lib.insertBefore(drag.placeholder, before ? over : over.nextSibling);
        }
    }

    function finishWallpaperDrag() {
        if (!wallpaperDrag) return;
        var drag = wallpaperDrag;
        var lib = drag.root.querySelector('#pt-wallpaper-lib');
        if (drag.tile.releasePointerCapture && drag.pointerId != null) {
            try { drag.tile.releasePointerCapture(drag.pointerId); } catch (err) {}
        }
        if (drag.placeholder && drag.placeholder.parentNode) drag.placeholder.parentNode.insertBefore(drag.tile, drag.placeholder);
        if (drag.placeholder && drag.placeholder.parentNode) drag.placeholder.parentNode.removeChild(drag.placeholder);
        drag.tile.classList.remove('pt-wallpaper-library-tile--dragging');
        drag.tile.style.position = '';
        drag.tile.style.left = '';
        drag.tile.style.top = '';
        drag.tile.style.width = '';
        drag.tile.style.height = '';
        drag.tile.style.margin = '';
        drag.tile.style.pointerEvents = '';
        drag.tile.style.transform = '';
        drag.tile.style.zIndex = '';
        drag.tile.style.cursor = '';
        if (lib) lib.classList.remove('pt-wallpaper-lib--sorting');
        if (!drag.moved) {
            applyCustomWallpaper(drag.tile.getAttribute('data-wallpaper-src'), drag.root);
        } else if (lib) {
            var next = readSettingsFor(root);
            next.wallpaperLibrary = Array.prototype.map.call(lib.querySelectorAll('.pt-wallpaper-library-tile'), function(tile) {
                return tile.getAttribute('data-wallpaper-src');
            }).filter(Boolean);
            writeSettingsFor(root, next);
        }
        wallpaperDrag = null;
        suppressWallpaperClickUntil = Date.now() + 300;
    }

    function handleWallpaperDocumentPointerMove(event) {
        if (wallpaperDrag) moveWallpaperDrag(event);
    }

    function handleWallpaperDocumentPointerEnd() {
        finishWallpaperDrag();
    }

    function bindWallpaperDocumentDrag() {
        if (wallpaperDocumentDragBound) return;
        wallpaperDocumentDragBound = true;
        document.addEventListener('pointermove', handleWallpaperDocumentPointerMove);
        document.addEventListener('pointerup', handleWallpaperDocumentPointerEnd);
        document.addEventListener('pointercancel', handleWallpaperDocumentPointerEnd);
    }

    function PT_normalizeWallpaperImage(file, done) {
        var reader = new FileReader();
        reader.onload = function() {
            var raw = reader.result;
            var img = new Image();
            img.onload = function() {
                var maxSide = 1920;
                var scale = Math.min(1, maxSide / Math.max(img.width, img.height));
                var canvas = document.createElement('canvas');
                canvas.width = Math.max(1, Math.round(img.width * scale));
                canvas.height = Math.max(1, Math.round(img.height * scale));
                var ctx = canvas.getContext('2d');
                if (!ctx) {
                    done(raw);
                    return;
                }
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                done(canvas.toDataURL('image/jpeg', 0.86));
            };
            img.onerror = function() { done(raw); };
            img.src = raw;
        };
        reader.readAsDataURL(file);
    }

    function handleWallpaperFile(file, root) {
        if (!file) return;
        PT_normalizeWallpaperImage(file, function(dataUrl) {
            var next = readSettingsFor(root);
            var lib = next.wallpaperLibrary || [];
            lib.push(dataUrl);
            if (lib.length > 20) lib = lib.slice(-20);
            next.wallpaperLibrary = lib;
            writeSettingsFor(root, next);
            if (root) refreshWallpaperViews(root);
        });
    }

    function PT_updateSegThumb(root, activeValue, instant, segId) {
        var id = segId || 'pt-magnet-seg';
        var thumbId = id.replace(/-seg$/, '-seg-thumb');
        var seg = root.querySelector('#' + id);
        var thumb = root.querySelector('#' + thumbId);
        if (!seg || !thumb) return;
        var opts = seg.querySelectorAll('.pt-seg__opt');
        var targetOpt = null;
        opts.forEach(function(o) {
            if (o.getAttribute('data-seg-value') === activeValue) targetOpt = o;
        });
        if (!targetOpt) return;
        if (instant) thumb.classList.add('pt-seg__thumb--no-transition');
        var offsetLeft = targetOpt.offsetLeft;
        thumb.style.width = targetOpt.offsetWidth + 'px';
        thumb.style.transform = 'translateX(' + offsetLeft + 'px)';
        if (instant) {
            void thumb.offsetWidth;
            thumb.classList.remove('pt-seg__thumb--no-transition');
        }
    }

    function bindSettingFields(scope, root) {
        if (!scope) return;
        scope.querySelectorAll('[data-setting-field]').forEach(function(field) {
            if (field.dataset.ptSettingBound === '1') return;
            field.dataset.ptSettingBound = '1';
            field.addEventListener('change', function() {
                if (field.classList && field.classList.contains('pt-theme-grid-native')) return;
                var next = readSettingsFor(root);
                next[field.dataset.settingField] = readSettingFieldValue(field);
                if (field.dataset.settingField === 'cardMaterial') next.glassMode = field.value.indexOf('custom:') === 0 ? 'gradient' : field.value;
                writeSettingsFor(root, next);
                applySettingsFor(root, next);
                if (field.dataset.settingField === 'smallCardAppearanceEnabled') {
                    var smallControls = root.querySelector('.pt-small-card-appearance-controls');
                    if (smallControls) smallControls.hidden = !field.checked;
                }
            });
        });
    }

    function bindWallpaperFileInput(scope, root) {
        var fileInput = scope && scope.querySelector('#pt-wallpaper-file');
        if (!fileInput || fileInput.dataset.ptFileBound === '1') return;
        fileInput.dataset.ptFileBound = '1';
        fileInput.addEventListener('change', function() {
            if (fileInput.files && fileInput.files[0]) handleWallpaperFile(fileInput.files[0], root);
            fileInput.value = '';
        });
    }

    function bind(root) {
        if (!root) return;

        var segInit = root.querySelector('#pt-magnet-seg');
        if (segInit) {
            requestAnimationFrame(function() {
                requestAnimationFrame(function() {
                    PT_updateSegThumb(root, segInit.getAttribute('data-seg-active') || 'physics', true);
                });
            });
        }

        var cardSysSeg = root.querySelector('#pt-card-system-seg');
        if (cardSysSeg) {
            requestAnimationFrame(function() {
                requestAnimationFrame(function() {
                    PT_updateSegThumb(root, cardSysSeg.getAttribute('data-seg-active') || 'glass', true, 'pt-card-system-seg');
                });
            });
        }

        var btnStyleSeg = root.querySelector('#pt-btn-style-seg');
        if (btnStyleSeg) {
            requestAnimationFrame(function() {
                requestAnimationFrame(function() {
                    PT_updateSegThumb(root, btnStyleSeg.getAttribute('data-seg-active') || 'modern', true, 'pt-btn-style-seg');
                });
            });
        }

        bindSettingFields(root, root);

        root.addEventListener('click', function(e) {
            if (e.target.closest('#pt-wallpaper-open-library')) {
                var wallpaperSettings = readSettingsFor(root);
                var wallpaperPage = ensureSettingsPage(root, '#pt-wallpaper-library-panel', renderWallpaperLibraryPanel(wallpaperSettings));
                bindWallpaperFileInput(wallpaperPage, root);
                openWallpaperLibrary(root);
                return;
            }

            if (e.target.closest('#pt-theme-wallpaper-open')) {
                var themeWallpaperSettings = readSettingsFor(root);
                ensureSettingsPage(root, '#pt-theme-wallpaper-panel', renderThemeWallpaperPanel(themeWallpaperSettings));
                openThemeWallpaperPanel(root);
                return;
            }

            if (e.target.closest('#pt-wallpaper-back')) {
                closeWallpaperLibrary(root);
                return;
            }

            if (e.target.closest('#pt-theme-wallpaper-back')) {
                closeThemeWallpaperPanel(root);
                return;
            }

            if (e.target.closest('#pt-wallpaper-upload-action')) {
                var uploadInput = root.querySelector('#pt-wallpaper-file');
                if (uploadInput) uploadInput.click();
                return;
            }

            if (e.target.closest('#pt-wallpaper-delete-action')) {
                var panel = root.querySelector('#pt-wallpaper-library-panel');
                setWallpaperDeleteMode(root, !(panel && panel.classList.contains('pt-wallpaper-delete-mode')));
                return;
            }

            var presetCard = e.target.closest('[data-wallpaper-id]');
            if (presetCard) {
                var id = presetCard.getAttribute('data-wallpaper-id');
                var next = readSettingsFor(root);
                next.wallpaper = id;
                next.wallpaperTheme = null;
                writeSettingsFor(root, next);
                applySettingsFor(root, next);
                refreshWallpaperViews(root);
                return;
            }

            var themeWallpaperCard = e.target.closest('[data-wallpaper-theme]');
            if (themeWallpaperCard) {
                var themeId = themeWallpaperCard.getAttribute('data-wallpaper-theme');
                var nextThemeWallpaper = readSettingsFor(root);
                nextThemeWallpaper.wallpaper = 'theme-color';
                nextThemeWallpaper.wallpaperTheme = themeId;
                writeSettingsFor(root, nextThemeWallpaper);
                applySettingsFor(root, nextThemeWallpaper);
                refreshWallpaperViews(root);
                return;
            }

            var myCard = e.target.closest('#pt-wallpaper-my-card');
            if (myCard) {
                var cur = readSettingsFor(root);
                if (cur.wallpaperCustom) applyCustomWallpaper(cur.wallpaperCustom, root);
                return;
            }

            var libraryTile = e.target.closest('.pt-wallpaper-library-tile');
            if (libraryTile) {
                if (Date.now() < suppressWallpaperClickUntil) return;
                var libraryPanel = root.querySelector('#pt-wallpaper-library-panel');
                var deleteMode = libraryPanel && libraryPanel.classList.contains('pt-wallpaper-delete-mode');
                if (deleteMode) {
                    if (e.target.closest('.pt-wallpaper-delete-ring')) deleteCustomWallpaper(libraryTile, root);
                } else {
                    applyCustomWallpaper(libraryTile.getAttribute('data-wallpaper-src'), root);
                }
                return;
            }

            if (e.target.closest('#pt-open-material-editor')) {
                _styleEditorBaseline = JSON.stringify(readSettingsFor(root));
                var materialSettings = readSettingsFor(root);
                ensureSettingsPage(root, '#pt-style-editor-wrap', renderMaterialEditorPage(materialSettings));
                var pageRoot = getSettingsSubpageRoot(root);
                pageRoot.classList.add('pt-subpage-active');
                pageRoot.classList.add('pt-settings-subpage-active');
                pageRoot.classList.add('pt-settings-subpage--style-editor');
                var wrap = root.querySelector('#pt-style-editor-wrap');
                var materialAppearanceWrap = root.querySelector('#pt-appearance-subpage-wrap');
                if (wrap) {
                    if (materialAppearanceWrap && materialAppearanceWrap.style.display !== 'none') {
                        wrap.setAttribute('data-return-target', '#pt-appearance-subpage-wrap');
                        materialAppearanceWrap.style.display = 'none';
                    } else {
                        wrap.removeAttribute('data-return-target');
                    }
                    wrap.style.display = 'flex';
                }
                markEditorDirty(root, false);
                var currentSettings = readSettingsFor(root);
                fillMaterialEditor(root, currentSettings.cardMaterial || currentSettings.glassMode || 'gradient', true);
                return;
            }

            if (e.target.closest('#pt-theme-load-btn')) {
                syncThemeLoadGridSelection(root);
                var themeModal = root.querySelector('#pt-theme-load-modal');
                if (themeModal) {
                    hydrateThemeGrid(themeModal.querySelector('.pt-theme-grid-select'));
                    themeModal.hidden = false;
                }
                return;
            }
            if (e.target.closest('[data-theme-load-close]')) {
                var themeModalClose = root.querySelector('#pt-theme-load-modal');
                if (themeModalClose) themeModalClose.hidden = true;
                return;
            }
            if (e.target.closest('#pt-theme-load-confirm')) {
                var themeLoadGrid = root.querySelector('.pt-theme-grid-select[data-target="pt-theme-load-grid"]');
                var themeNative = themeLoadGrid ? themeLoadGrid.querySelector('.pt-theme-grid-native') : null;
                if (themeNative && themeNative.value) {
                    fillThemeEditor(root, themeNative.value);
                }
                var themeModalConfirm = root.querySelector('#pt-theme-load-modal');
                if (themeModalConfirm) themeModalConfirm.hidden = true;
                return;
            }
            if (e.target.closest('#pt-save-theme-preset')) {
                var themeSaveModal = root.querySelector('#pt-theme-save-modal');
                if (themeSaveModal) themeSaveModal.hidden = false;
                return;
            }
            if (e.target.closest('[data-theme-save-close]')) {
                var themeSaveModalClose = root.querySelector('#pt-theme-save-modal');
                if (themeSaveModalClose) themeSaveModalClose.hidden = true;
                return;
            }
            if (e.target.closest('#pt-theme-save-confirm')) {
                if (saveThemePreset(root, null)) {
                    markThemeEditorDirty(root, false);
                    var themeSaveModalConfirm = root.querySelector('#pt-theme-save-modal');
                    if (themeSaveModalConfirm) themeSaveModalConfirm.hidden = true;
                }
                return;
            }
            if (e.target.closest('#pt-manage-theme-presets')) {
                var themeManagerSettings = readSettingsFor(root);
                ensureSettingsPage(root, '#pt-manage-theme-page', renderThemeManagerPage(themeManagerSettings));
                openPresetManager(root, 'theme');
                return;
            }
            if (e.target.closest('#pt-manage-theme-back')) {
                closePresetManager(root);
                return;
            }
            var deleteThemeBtn = e.target.closest('[data-delete-theme-preset]');
            if (deleteThemeBtn) {
                deleteThemePreset(root, deleteThemeBtn.getAttribute('data-delete-theme-preset'));
                return;
            }

            if (e.target.closest('#pt-material-load-btn')) {
                syncMaterialLoadGridSelection(root);
                var matModal = root.querySelector('#pt-material-load-modal');
                if (matModal) {
                    hydrateThemeGrid(matModal.querySelector('.pt-theme-grid-select'));
                    matModal.hidden = false;
                }
                return;
            }
            if (e.target.closest('[data-material-load-close]')) {
                var matModalClose = root.querySelector('#pt-material-load-modal');
                if (matModalClose) matModalClose.hidden = true;
                return;
            }
            if (e.target.closest('#pt-material-load-confirm')) {
                var matLoadGrid = root.querySelector('.pt-theme-grid-select[data-target="pt-material-load-grid"]');
                var matLoadNative = matLoadGrid ? matLoadGrid.querySelector('.pt-theme-grid-native') : null;
                if (matLoadNative && matLoadNative.value) {
                    fillMaterialEditor(root, matLoadNative.value);
                }
                var matModalConfirm = root.querySelector('#pt-material-load-modal');
                if (matModalConfirm) matModalConfirm.hidden = true;
                return;
            }
            if (e.target.closest('#pt-save-material-preset')) {
                var matSaveModal = root.querySelector('#pt-material-save-modal');
                if (matSaveModal) matSaveModal.hidden = false;
                return;
            }
            if (e.target.closest('[data-material-save-close]')) {
                var matSaveModalClose = root.querySelector('#pt-material-save-modal');
                if (matSaveModalClose) matSaveModalClose.hidden = true;
                return;
            }
            if (e.target.closest('#pt-material-save-confirm')) {
                if (saveMaterialPreset(root, null)) {
                    markEditorDirty(root, false);
                    var matSaveModalConfirm = root.querySelector('#pt-material-save-modal');
                    if (matSaveModalConfirm) matSaveModalConfirm.hidden = true;
                }
                return;
            }
            if (e.target.closest('#pt-manage-material-presets')) {
                var materialManagerSettings = readSettingsFor(root);
                ensureSettingsPage(root, '#pt-manage-material-page', renderMaterialManagerPage(materialManagerSettings));
                openPresetManager(root, 'material');
                return;
            }
            if (e.target.closest('#pt-manage-material-back')) {
                closePresetManager(root);
                return;
            }
            var deleteMaterialBtn = e.target.closest('[data-delete-material-preset]');
            if (deleteMaterialBtn) {
                deleteMaterialPreset(root, deleteMaterialBtn.getAttribute('data-delete-material-preset'));
                return;
            }

            if (e.target.closest('#pt-open-appearance-subpage')) {
                var appearanceSettings = readSettingsFor(root);
                replaceSettingsPage(root, '#pt-appearance-subpage-wrap', renderAppearanceSubpage(appearanceSettings));
                var appearanceRoot = getSettingsSubpageRoot(root);
                appearanceRoot.classList.add('pt-subpage-active');
                appearanceRoot.classList.add('pt-settings-subpage-active');
                appearanceRoot.classList.add('pt-settings-subpage--appearance');
                var appearanceWrap = root.querySelector('#pt-appearance-subpage-wrap');
                if (appearanceWrap) appearanceWrap.style.display = 'flex';
                var btnStyleSegOpen = appearanceWrap ? appearanceWrap.querySelector('#pt-btn-style-seg') : null;
                var btnStyleActive = btnStyleSegOpen ? btnStyleSegOpen.getAttribute('data-seg-active') : null;
                requestAnimationFrame(function() {
                    requestAnimationFrame(function() {
                        PT_updateSegThumb(root, btnStyleActive || 'modern', true, 'pt-btn-style-seg');
                    });
                });
                return;
            }

            if (e.target.closest('#pt-appearance-back')) {
                PT_closeSettingsToMain(root);
                return;
            }

            if (e.target.closest('#pt-open-profile-subpage')) {
                ensureSettingsPage(root, '#pt-profile-subpage-wrap', renderProfileSubpage());
                var profileRoot = getSettingsSubpageRoot(root);
                profileRoot.classList.add('pt-subpage-active');
                profileRoot.classList.add('pt-settings-subpage-active');
                profileRoot.classList.add('pt-settings-subpage--profile');
                var profileWrap = root.querySelector('#pt-profile-subpage-wrap');
                if (profileWrap) {
                    var profileSection = profileWrap.querySelector('.pt-auth-section');
                    if (profileSection) profileSection.innerHTML = renderAuthSection();
                    profileWrap.style.display = 'flex';
                }
                return;
            }

            if (e.target.closest('#pt-profile-back')) {
                PT_closeSettingsToMain(root);
                return;
            }

            if (e.target.closest('#pt-open-magnet-subpage')) {
                var magnetSettings = readSettingsFor(root);
                ensureSettingsPage(root, '#pt-magnet-subpage-wrap', renderMagnetSubpage(magnetSettings));
                var magnetRoot = getSettingsSubpageRoot(root);
                magnetRoot.classList.add('pt-subpage-active');
                magnetRoot.classList.add('pt-settings-subpage-active');
                magnetRoot.classList.add('pt-settings-subpage--magnet');
                var magnetWrap = root.querySelector('#pt-magnet-subpage-wrap');
                if (magnetWrap) magnetWrap.style.display = 'flex';
                updateRangeVisuals(root);
                var segActive = magnetWrap ? (magnetWrap.querySelector('#pt-magnet-seg') || {}).getAttribute('data-seg-active') : null;
                requestAnimationFrame(function() {
                    requestAnimationFrame(function() {
                        PT_updateSegThumb(root, segActive || 'physics', true);
                    });
                });
                return;
            }

            if (e.target.closest('#pt-magnet-back')) {
                PT_closeSettingsToMain(root);
                return;
            }

            var segOpt = e.target.closest('#pt-magnet-seg .pt-seg__opt');
            if (segOpt) {
                var segVal = segOpt.getAttribute('data-seg-value');
                var segNext = readSettingsFor(root);
                segNext.cardMagnetMode = segVal;
                writeSettingsFor(root, segNext);
                applySettingsFor(root, segNext);
                if (segVal === 'off' && window.PT_magnetLinks) {
                    window.PT_magnetLinks = [];
                }
                if (typeof window.PT_renderMagnetLinks === 'function') {
                    window.PT_renderMagnetLinks();
                }
                var segContainer = root.querySelector('#pt-magnet-seg');
                if (segContainer) {
                    segContainer.querySelectorAll('.pt-seg__opt').forEach(function(o) {
                        o.classList.toggle('pt-seg__opt--active', o.getAttribute('data-seg-value') === segVal);
                    });
                    PT_updateSegThumb(root, segVal);
                }
                root.querySelectorAll('[data-magnet-mode]').forEach(function(panel) {
                    panel.hidden = panel.getAttribute('data-magnet-mode') !== segVal;
                });
                var curSettings = readSettingsFor(root);
                root.querySelectorAll('#pt-magnet-body [data-setting-field]').forEach(function(field) {
                    if (field.type === 'checkbox') {
                        field.checked = curSettings[field.dataset.settingField] !== false;
                    } else if (field.type === 'range') {
                        field.value = curSettings[field.dataset.settingField] != null ? curSettings[field.dataset.settingField] : 2.5;
                        updateSettingRangeLabel(field);
                        updateRangeVisual(field);
                    }
                });
                return;
            }

            var cardSysOpt = e.target.closest('#pt-card-system-seg .pt-seg__opt');
            if (cardSysOpt) {
                var sysVal = cardSysOpt.getAttribute('data-seg-value');
                var sysNext = readSettingsFor(root);
                sysNext.cardSystem = sysVal;
                writeSettingsFor(root, sysNext);
                applySettingsFor(root, sysNext);
                var sysContainer = root.querySelector('#pt-card-system-seg');
                if (sysContainer) {
                    sysContainer.querySelectorAll('.pt-seg__opt').forEach(function(o) {
                        o.classList.toggle('pt-seg__opt--active', o.getAttribute('data-seg-value') === sysVal);
                    });
                    PT_updateSegThumb(root, sysVal, false, 'pt-card-system-seg');
                }
                var glassCard = root.querySelector('#pt-glass-card-style');
                var metalCard = root.querySelector('#pt-metal-card-style');
                if (glassCard) glassCard.style.display = sysVal === 'metal' ? 'none' : '';
                if (metalCard) metalCard.style.display = sysVal === 'glass' ? 'none' : '';
                return;
            }

            if (e.target.closest('#pt-btn-style-seg .pt-seg__opt')) {
                var btnVal = e.target.closest('#pt-btn-style-seg .pt-seg__opt').getAttribute('data-seg-value');
                var btnNext = readSettingsFor(root);
                btnNext.buttonStyle = btnVal;
                writeSettingsFor(root, btnNext);
                applySettingsFor(root, btnNext);
                var btnSeg = root.querySelector('#pt-btn-style-seg');
                if (btnSeg) {
                    btnSeg.querySelectorAll('.pt-seg__opt').forEach(function(o) {
                        o.classList.toggle('pt-seg__opt--active', o.getAttribute('data-seg-value') === btnVal);
                    });
                    if (typeof PT_updateSegThumb === 'function') PT_updateSegThumb(root, btnVal, false, 'pt-btn-style-seg');
                }
                return;
            }

            if (e.target.closest('#pt-style-editor-back')) {
                var editor = root.querySelector('#pt-style-editor');
                if (editor && editor.getAttribute('data-dirty') === '1') {
                    var modal = root.querySelector('#pt-style-unsaved-modal');
                    if (modal) modal.hidden = false;
                } else {
                    closeStyleEditor(root, false);
                }
                return;
            }

            var exit = e.target.closest('[data-style-exit]');
            if (exit) {
                var action = exit.getAttribute('data-style-exit');
                if (action === 'cancel') {
                    var modal = root.querySelector('#pt-style-unsaved-modal');
                    if (modal) modal.hidden = true;
                    return;
                }
                if (action === 'discard') {
                    closeStyleEditor(root, true);
                    return;
                }
                if (action === 'save') {
                    var modalSave = root.querySelector('#pt-style-unsaved-modal');
                    if (modalSave) modalSave.hidden = true;
                    var materialSaveModal = root.querySelector('#pt-material-save-modal');
                    if (materialSaveModal) materialSaveModal.hidden = false;
                    return;
                }
            }

            var modeBtn = e.target.closest('#pt-switch-mode-btn');
            if (modeBtn) {
                var targetMode = modeBtn.getAttribute('data-mode-target') || 'web';
                if (typeof window.PT_switchModeWithTransition === 'function') {
                    window.PT_switchModeWithTransition(targetMode);
                } else {
                    var next = readSettingsFor(root);
                    next.webMode = targetMode;
                    writeSettingsFor(root, next);
                    location.reload();
                }
                return;
            }

            if (e.target.closest('#pt-open-mode-portal-btn')) {
                if (typeof window.PT_switchModeWithTransition === 'function') {
                    window.PT_switchModeWithTransition('portal');
                } else {
                    var portalNext = readSettingsFor(root);
                    portalNext.webMode = 'portal';
                    window.writePTSettings(portalNext, 'dock');
                    location.reload();
                }
                return;
            }

            var btn = e.target.closest('[data-action]');
            if (btn) {
                var action = btn.getAttribute('data-action');
                if (action === 'open-profile-load') {
                    var loadList = root.querySelector('#pt-profile-load-list');
                    if (loadList) loadList.innerHTML = renderProfileLoadList(window.PT_AUTH.listProfiles(), window.PT_AUTH.getProfileID());
                    var loadModal = root.querySelector('#pt-profile-load-modal');
                    if (loadModal) loadModal.hidden = false;
                }
                if (action === 'confirm-profile-load') {
                    var selectedProfile = root.querySelector('.pt-profile-load-item--selected');
                    if (!selectedProfile) selectedProfile = root.querySelector('.pt-profile-load-item--active');
                    if (!selectedProfile) return;
                    var loaded = window.PT_AUTH.switchProfile(selectedProfile.getAttribute('data-profile-load-id'));
                    if (loaded.ok) {
                        window.PT_applyVisualPrefs(window.PT_AUTH.readSettings());
                        refreshProfilePanel(root);
                        var loadModalConfirm = root.querySelector('#pt-profile-load-modal');
                        if (loadModalConfirm) loadModalConfirm.hidden = true;
                    }
                }
                if (action === 'open-profile-create') {
                    var createInput = root.querySelector('[data-profile-create-name]');
                    if (createInput) createInput.value = '';
                    var createModal = root.querySelector('#pt-profile-create-modal');
                    if (createModal) createModal.hidden = false;
                    if (createInput) createInput.focus();
                }
                if (action === 'save-profile-create') {
                    var nameInput = root.querySelector('[data-profile-create-name]');
                    if (!nameInput || !nameInput.value.trim()) return;
                    var created = window.PT_AUTH.createProfile(nameInput.value.trim());
                    if (created.ok) {
                        window.PT_applyVisualPrefs(window.PT_AUTH.readSettings());
                        refreshProfilePanel(root);
                        var createModalConfirm = root.querySelector('#pt-profile-create-modal');
                        if (createModalConfirm) createModalConfirm.hidden = true;
                    }
                }
                if (action === 'logout') {
                    window.PT_AUTH.logout();
                    applySettingsFor(root, readSettingsFor(root));
                    refreshProfilePanel(root);
                }
            }

            var loadChoice = e.target.closest('[data-profile-load-id]');
            if (loadChoice) {
                root.querySelectorAll('.pt-profile-load-item').forEach(function(item) {
                    item.classList.toggle('pt-profile-load-item--selected', item === loadChoice);
                });
                return;
            }

            if (e.target.closest('[data-profile-load-close]')) {
                var profileLoadClose = root.querySelector('#pt-profile-load-modal');
                if (profileLoadClose) profileLoadClose.hidden = true;
                return;
            }

            if (e.target.closest('[data-profile-create-close]')) {
                var profileCreateClose = root.querySelector('#pt-profile-create-modal');
                if (profileCreateClose) profileCreateClose.hidden = true;
                return;
            }
        });

        root.addEventListener('change', function(e) {
            if (e.target && e.target.id === 'pt-snap-master') {
                var snapNext = readSettingsFor(root);
                snapNext.screenSnapMode = e.target.checked ? 'codex' : 'off';
                writeSettingsFor(root, snapNext);
                applySettingsFor(root, snapNext);
                var snapBody = root.querySelector('#pt-snap-body');
                if (snapBody) snapBody.hidden = !e.target.checked;
                return;
            }

            var themeGridNative = e.target.closest('.pt-theme-grid-native');
            if (themeGridNative) {
                var wrapper = themeGridNative.closest('.pt-theme-grid-select');
                var target = wrapper ? wrapper.getAttribute('data-target') : null;
                var kind = wrapper ? wrapper.getAttribute('data-grid-kind') : 'theme';
                var val = themeGridNative.value;
                var gridSettings = readSettingsFor(root);
                var trigger = wrapper ? wrapper.querySelector('.pt-theme-grid-trigger') : null;
                if (trigger) trigger.textContent = kind === 'material' ? renderMaterialGridTriggerLabel(val, gridSettings) : renderThemeGridTriggerLabel(val, gridSettings);
                if (wrapper) {
                    wrapper.querySelectorAll('.pt-theme-grid-option').forEach(function(btn) {
                        btn.classList.toggle('pt-theme-grid-option--active', btn.getAttribute('data-value') === val);
                    });
                }
                if (themeGridNative.dataset.settingField) {
                    gridSettings[themeGridNative.dataset.settingField] = readSettingFieldValue(themeGridNative);
                    if (themeGridNative.dataset.settingField === 'cardMaterial') gridSettings.glassMode = val.indexOf('custom:') === 0 ? 'gradient' : val;
                    writeSettingsFor(root, gridSettings);
                    applySettingsFor(root, gridSettings);
                }
                if (target === 'pt-theme-source') {
                    fillThemeEditor(root, val);
                    return;
                }
            }

            if (e.target && e.target.id === 'pt-material-source') {
                fillMaterialEditor(root, e.target.value);
                return;
            }
            if (e.target.closest('#pt-style-editor')) {
                updateValueLabels(root);
                applyMaterialPreview(root);
            }
        });

        root.addEventListener('input', function(e) {
            if (e.target && e.target.classList && e.target.classList.contains('pt-range-input')) updateRangeVisual(e.target);
            var settingRange = e.target && e.target.closest ? e.target.closest('[data-setting-field][type="range"]') : null;
            if (settingRange) {
                updateSettingRangeLabel(settingRange);
                var next = readSettingsFor(root);
                next[settingRange.dataset.settingField] = readSettingFieldValue(settingRange);
                writeSettingsFor(root, next);
                applySettingsFor(root, next);
                return;
            }
            if (e.target.closest('#pt-style-editor')) {
                updateValueLabels(root);
                applyMaterialPreview(root);
            }
        });

        bindWallpaperFileInput(root, root);
        updateRangeVisuals(root);

        root.addEventListener('pointerdown', function(e) {
            var tile = e.target.closest('.pt-wallpaper-library-tile');
            var panel = root.querySelector('#pt-wallpaper-library-panel');
            var deleteMode = panel && panel.classList.contains('pt-wallpaper-delete-mode');
            if (!tile || deleteMode) return;
            startWallpaperDrag(root, tile, e);
        });
        bindWallpaperDocumentDrag();

        // Theme grid panel interactions
        function closeAllThemeGridPanels() {
            root.querySelectorAll('.pt-theme-grid-select--open').forEach(function(el) {
                el.classList.remove('pt-theme-grid-select--open');
                var panel = el._ptFloatingGridPanel || el.querySelector('.pt-theme-grid-panel');
                if (panel) {
                    panel.classList.remove('pt-theme-grid-panel--floating');
                    panel.removeAttribute('style');
                    el.appendChild(panel);
                    panel._ptGridOwner = null;
                }
                el._ptFloatingGridPanel = null;
            });
            root.querySelectorAll('.pt-card--dropdown-open').forEach(function(card) {
                card.classList.remove('pt-card--dropdown-open');
            });
        }
        function repositionOpenThemeGridPanels() {
            root.querySelectorAll('.pt-theme-grid-select--open').forEach(function(wrapper) {
                if (!document.body.contains(wrapper)) {
                    closeAllThemeGridPanels();
                    return;
                }
                positionThemeGridPanel(wrapper);
            });
        }
        document.addEventListener('mousemove', repositionOpenThemeGridPanels);
        window.addEventListener('resize', repositionOpenThemeGridPanels);
        root.addEventListener('scroll', repositionOpenThemeGridPanels, true);
        root.addEventListener('click', function(e) {
            var trigger = e.target.closest('.pt-theme-grid-trigger');
            if (trigger) {
                var wrapper = trigger.closest('.pt-theme-grid-select');
                var wasOpen = wrapper && wrapper.classList.contains('pt-theme-grid-select--open');
                closeAllThemeGridPanels();
                if (wrapper && !wasOpen) {
                    hydrateThemeGrid(wrapper);
                    wrapper.classList.add('pt-theme-grid-select--open');
                    var floatingPanel = wrapper.querySelector('.pt-theme-grid-panel');
                    if (floatingPanel) {
                        wrapper._ptFloatingGridPanel = floatingPanel;
                        floatingPanel._ptGridOwner = wrapper;
                        floatingPanel.classList.add('pt-theme-grid-panel--floating');
                        document.body.appendChild(floatingPanel);
                    }
                    positionThemeGridPanel(wrapper);
                    var card = wrapper.closest('.pt-card');
                    if (card) card.classList.add('pt-card--dropdown-open');
                }
                return;
            }
            var option = e.target.closest('.pt-theme-grid-option');
            if (option) {
                var wrapper = option.closest('.pt-theme-grid-select');
                if (!wrapper) return;
                var target = wrapper.getAttribute('data-target');
                var val = option.getAttribute('data-value');
                var nativeSelect = wrapper.querySelector('.pt-theme-grid-native');
                if (nativeSelect) {
                    var oldVal = nativeSelect.value;
                    nativeSelect.value = val;
                    if (nativeSelect.value !== oldVal) {
                        closeAllThemeGridPanels();
                        nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
                closeAllThemeGridPanels();
                return;
            }
            if (!e.target.closest('.pt-theme-grid-select')) {
                closeAllThemeGridPanels();
            }
        });

        document.addEventListener('click', function(e) {
            var floatingPanel = e.target.closest && e.target.closest('.pt-theme-grid-panel--floating');
            if (floatingPanel) {
                var option = e.target.closest('.pt-theme-grid-option');
                var wrapper = floatingPanel._ptGridOwner;
                if (!option || !wrapper) return;
                var nativeSelect = wrapper.querySelector('.pt-theme-grid-native');
                if (nativeSelect) {
                    var oldVal = nativeSelect.value;
                    nativeSelect.value = option.getAttribute('data-value');
                    if (nativeSelect.value !== oldVal) {
                        closeAllThemeGridPanels();
                        nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
                closeAllThemeGridPanels();
                return;
            }
            if (!root.contains(e.target)) closeAllThemeGridPanels();
        });

        if (typeof window.PT_initCustomSelects === 'function') {
            setTimeout(function() { window.PT_initCustomSelects(root); }, 100);
        }

        if (typeof PP.bindPicker === 'function') {
            PP.bindPicker(root, {
                onThemeEditorOpen: function() {
                    var themeEditorSettings = readSettingsFor(root);
                    ensureSettingsPage(root, '#pt-theme-editor-wrap', PP.renderThemeEditorPage(themeEditorSettings, renderThemeGridPanel, sliderRow));
                    var pageRoot = getSettingsSubpageRoot(root);
                    pageRoot.classList.add('pt-subpage-active');
                    pageRoot.classList.add('pt-settings-subpage-active');
                    pageRoot.classList.add('pt-settings-subpage--style-editor');
                    var themeWrap = root.querySelector('#pt-theme-editor-wrap');
                    var themeAppearanceWrap = root.querySelector('#pt-appearance-subpage-wrap');
                    if (themeWrap) {
                        if (themeAppearanceWrap && themeAppearanceWrap.style.display !== 'none') {
                            themeWrap.setAttribute('data-return-target', '#pt-appearance-subpage-wrap');
                            themeAppearanceWrap.style.display = 'none';
                        } else {
                            themeWrap.removeAttribute('data-return-target');
                        }
                        themeWrap.style.display = 'flex';
                    }
                    var currentSettings = readSettingsFor(root);
                    fillThemeEditor(root, currentSettings.cardBackgroundTheme || 'theme:oceanic', true);
                },
                onThemeEditorBack: function() {
                    if (typeof window.readPTSettings === 'function' && typeof window.PT_applyVisualPrefs === 'function') {
                        applySettingsFor(root, readSettingsFor(root));
                    }
                    var tRoot = getSettingsSubpageRoot(root);
                    var tWrap = root.querySelector('#pt-theme-editor-wrap');
                    var themeReturnTarget = tWrap ? tWrap.getAttribute('data-return-target') : null;
                    if (tWrap) {
                        tWrap.style.display = 'none';
                        tWrap.setAttribute('data-dirty', '0');
                    }
                    var themeReturnPage = themeReturnTarget ? root.querySelector(themeReturnTarget) : null;
                    if (themeReturnPage || root.querySelector('#pt-appearance-subpage-wrap')) {
                        if (!themeReturnPage && tWrap) tWrap.setAttribute('data-return-target', '#pt-appearance-subpage-wrap');
                        PT_returnToAppearanceSettings(root, tWrap);
                    } else {
                        PT_closeSettingsToMain(root);
                    }
                }
            });
            PP.onPreview = function(pRoot) { applyThemePresetPreview(pRoot || root); };
        }
    }
    return {
        render: render,
        bind: bind,
        renderWallpaperCard: renderWallpaperCard,
        renderAppearanceSubpage: renderAppearanceSubpage
    };
})();
