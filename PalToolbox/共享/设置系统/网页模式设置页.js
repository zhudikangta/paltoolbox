window.PT_getWebVisualSettings = function PT_getWebVisualSettings(settings) {
    var base = Object.assign({}, settings || {});
    var visual = Object.assign({}, base);
    visual.theme = base.theme || 'oceanic';
    visual.wallpaper = base.wallpaper || 'image-bg';
    visual.wallpaperTheme = base.wallpaperTheme || visual.theme;
    visual.wallpaperCustom = base.wallpaperCustom || null;
    return visual;
};

window.PT_WEB_SETTINGS_PAGE = (function() {
    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function getLayoutTools() {
        var tools = window.PT_WEB_TOOLS || {};
        var order = [];
        (window.PT_WEB_GROUPS || []).forEach(function(group) {
            order = order.concat(group.tools || []);
        });
        order = order.concat(window.PT_WEB_STANDALONE || []);
        return order.map(function(id) {
            return tools[id];
        }).filter(function(tool) {
            return tool && tool.id !== 'map' && tool.id !== 'settings' && tool.layout !== 'immersive';
        });
    }

    function getToolLayout(tool, settings) {
        var selected = settings && settings.webToolLayouts ? settings.webToolLayouts[tool.id] : null;
        if (selected === 'bounded' || selected === 'grid-fluid') return selected;
        return tool.layout === 'grid-fluid' ? 'grid-fluid' : 'bounded';
    }

    function renderLayoutChip(tool, settings) {
        var layout = getToolLayout(tool, settings);
        return '<button type="button" class="pt-web-layout-chip" draggable="true" data-web-layout-tool="' + escapeHtml(tool.id) + '">' +
            '<span>' + escapeHtml(tool.title) + '</span><b>' + (layout === 'grid-fluid' ? '流式' : '受限') + '</b>' +
            '</button>';
    }

    function renderLayoutZone(layout, title, settings) {
        var chips = getLayoutTools().filter(function(tool) {
            return getToolLayout(tool, settings) === layout;
        }).map(function(tool) {
            return renderLayoutChip(tool, settings);
        }).join('');
        return '<div class="pt-web-layout-zone" data-web-layout-zone="' + layout + '">' +
            '<div class="pt-web-layout-zone__head"><strong>' + title + '</strong><span>拖到这里</span></div>' +
            '<div class="pt-web-layout-zone__body">' + (chips || '<em>暂无工具</em>') + '</div>' +
            '</div>';
    }

    function renderToolLayoutSettings(settings) {
        return '<div class="pt-web-layout-board">' +
            '<div class="pt-web-layout-zones">' +
            renderLayoutZone('bounded', '受限宽度', settings) +
            renderLayoutZone('grid-fluid', '流式铺满', settings) +
            '</div>' +
            '<div class="pt-web-layout-actions"><button type="button" class="pt-btn pt-btn--ghost" data-web-action="reset-tool-layouts">恢复默认</button></div>' +
            '</div>';
    }

    function applyWebSettings(settings) {
        window.writePTSettings(settings, 'web');
        if (typeof window.PT_applyVisualPrefs === 'function') {
            window.PT_applyVisualPrefs(window.PT_getWebVisualSettings(settings));
        }
    }

    function render() {
        var settings = typeof window.readPTSettings === 'function' ? window.readPTSettings('web') : {};
        var html = '<div class="pt-web-tool-page pt-web-settings-page" data-settings-mode="web">';
        html += '<header class="pt-web-tool-heading">';
        html += '<div><span class="pt-web-tool-kicker">系统 / 外观</span><h1>设置</h1></div>';
        html += '<button type="button" class="pt-btn pt-btn--primary pt-btn--pill" data-web-action="enter-dock">进入Dock桌面模式</button>';
        html += '</header>';
        html += '<section class="pt-web-section"><div class="pt-web-section__head"><h2>外观</h2></div>';
        html += '<button type="button" class="pt-card pt-settings-entry-btn" id="pt-open-appearance-subpage"><span>外观设置</span><small>主题、材质、小卡片</small></button>';
        html += '</section>';
        html += '<section class="pt-web-section"><div class="pt-web-section__head"><h2>壁纸</h2></div>';
        if (window.PT_VISUAL_SETTINGS_CARD && typeof window.PT_VISUAL_SETTINGS_CARD.renderWallpaperCard === 'function') {
            html += window.PT_VISUAL_SETTINGS_CARD.renderWallpaperCard(settings);
        }
        html += '</section>';
        html += '<section class="pt-web-section"><div class="pt-web-section__head"><h2>工具布局</h2></div>';
        html += renderToolLayoutSettings(settings);
        html += '</section>';
        html += '<section class="pt-web-section"><div class="pt-web-section__head"><h2>模式</h2></div>';
        html += '<div class="pt-web-settings-row"><span>当前为网页工具模式</span><button type="button" class="pt-btn pt-btn--ghost" data-web-action="enter-dock">切换至Dock桌面模式</button></div>';
        html += '<div class="pt-web-settings-row"><span>回到开屏门面</span><button type="button" class="pt-btn pt-btn--ghost" data-web-action="enter-portal">进入模式选择</button></div>';
        html += '</section>';
        if (window.PT_VISUAL_SETTINGS_CARD && typeof window.PT_VISUAL_SETTINGS_CARD.renderAppearanceSubpage === 'function') {
            html += window.PT_VISUAL_SETTINGS_CARD.renderAppearanceSubpage(settings);
        }
        html += '</div>';
        return html;
    }

    function refresh(root) {
        var page = root.querySelector('.pt-web-settings-page');
        if (!page) return;
        page.outerHTML = render();
        bindVisualAppearance(root);
        if (typeof window.PT_initCustomSelects === 'function') window.PT_initCustomSelects(root);
    }

    function bindVisualAppearance(root) {
        var visualSettingsRoot = root.querySelector('.pt-web-settings-page');
        if (visualSettingsRoot && window.PT_VISUAL_SETTINGS_CARD && typeof window.PT_VISUAL_SETTINGS_CARD.bind === 'function') {
            window.PT_VISUAL_SETTINGS_CARD.bind(visualSettingsRoot);
        }
    }

    function bind(root) {
        if (!root) return;
        bindVisualAppearance(root);
        var draggingToolId = null;

        root.addEventListener('change', function(event) {
            var field = event.target.closest('[data-web-setting-field]');
            if (!field) return;
            var settings = typeof window.readPTSettings === 'function' ? window.readPTSettings('web') : {};
            var key = field.getAttribute('data-web-setting-field');
            settings[key] = field.value;
            applyWebSettings(settings);
            refresh(root);
        });

        root.addEventListener('click', function(event) {
            var action = event.target.closest('[data-web-action]');
            if (!action) return;
            if (action.getAttribute('data-web-action') === 'reset-tool-layouts') {
                var resetSettings = typeof window.readPTSettings === 'function' ? window.readPTSettings('web') : {};
                resetSettings.webToolLayouts = {};
                applyWebSettings(resetSettings);
                refresh(root);
                return;
            }
            if (action.getAttribute('data-web-action') === 'enter-dock') {
                if (typeof window.PT_switchModeWithTransition === 'function') {
                    window.PT_switchModeWithTransition('dock');
                } else {
                    var next = typeof window.readPTSettings === 'function' ? window.readPTSettings('web') : {};
                    next.webMode = 'dock';
                    window.writePTSettings(next, 'dock');
                    location.reload();
                }
            }
            if (action.getAttribute('data-web-action') === 'enter-portal') {
                if (typeof window.PT_switchModeWithTransition === 'function') {
                    window.PT_switchModeWithTransition('portal');
                } else {
                    var portalNext = typeof window.readPTSettings === 'function' ? window.readPTSettings() : {};
                    portalNext.webMode = 'portal';
                    window.writePTSettings(portalNext, 'dock');
                    location.reload();
                }
            }
        });

        root.addEventListener('dragstart', function(event) {
            var chip = event.target.closest('[data-web-layout-tool]');
            if (!chip) return;
            draggingToolId = chip.getAttribute('data-web-layout-tool');
            chip.classList.add('pt-web-layout-chip--dragging');
            if (event.dataTransfer) {
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', draggingToolId);
            }
        });

        root.addEventListener('dragend', function(event) {
            var chip = event.target.closest('[data-web-layout-tool]');
            if (chip) chip.classList.remove('pt-web-layout-chip--dragging');
            draggingToolId = null;
            var zones = root.querySelectorAll('.pt-web-layout-zone--over');
            for (var i = 0; i < zones.length; i++) zones[i].classList.remove('pt-web-layout-zone--over');
        });

        root.addEventListener('dragover', function(event) {
            var zone = event.target.closest('[data-web-layout-zone]');
            if (!zone) return;
            event.preventDefault();
            zone.classList.add('pt-web-layout-zone--over');
            if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
        });

        root.addEventListener('dragleave', function(event) {
            var zone = event.target.closest('[data-web-layout-zone]');
            if (zone) zone.classList.remove('pt-web-layout-zone--over');
        });

        root.addEventListener('drop', function(event) {
            var zone = event.target.closest('[data-web-layout-zone]');
            if (!zone) return;
            event.preventDefault();
            zone.classList.remove('pt-web-layout-zone--over');
            var toolId = draggingToolId || (event.dataTransfer ? event.dataTransfer.getData('text/plain') : '');
            var layout = zone.getAttribute('data-web-layout-zone');
            if (!toolId || (layout !== 'bounded' && layout !== 'grid-fluid')) return;
            var settings = typeof window.readPTSettings === 'function' ? window.readPTSettings('web') : {};
            settings.webToolLayouts = settings.webToolLayouts || {};
            settings.webToolLayouts[toolId] = layout;
            applyWebSettings(settings);
            refresh(root);
        });

        if (typeof window.PT_initCustomSelects === 'function') window.PT_initCustomSelects(root);
    }

    return { render: render, bind: bind };
})();
