(function() {
    function getLaunchMode() {
        try {
            var settings = typeof window.readPTSettings === 'function' ? window.readPTSettings('dock') : {};
            return settings.webMode || 'portal';
        } catch (error) {
            return 'portal';
        }
    }

    function renderShell() {
        var app = document.getElementById('app');
        if (!app || !window.PT_STARCHART_CONFIG) return;
        document.body.classList.remove('pt-body--web-mode', 'pt-body--portal-mode', 'pt-body--immersive-mode', 'pt-body--space-mode');
        document.body.classList.add('pt-body--starchart-mode');
        app.innerHTML = [
            '<section class="pt-starchart-root" id="pt-starchart-root">',
            '<canvas class="pt-starchart-canvas" id="pt-starchart-canvas" aria-hidden="true"></canvas>',
            '<div class="pt-starchart-ui">',
            '<header class="pt-starchart-topbar">',
            '<div class="pt-starchart-brand"><strong>星图模式</strong><span>太阳系工具星图 / 行星节点 / 自由飞行</span></div>',
            '<div class="pt-starchart-actions">',
            '<button type="button" class="pt-starchart-btn" data-starchart-action="default-view">默认视角</button>',
            '<button type="button" class="pt-starchart-btn" data-starchart-action="open-settings">设置</button>',
            '<button type="button" class="pt-starchart-btn" data-starchart-action="open-portal">进入模式选择</button>',
            '</div>',
            '</header>',
            '</div>',
            '<aside class="pt-starchart-panel" id="pt-starchart-panel" aria-live="polite">',
            '<article class="pt-starchart-card pt-desktop-card">',
            '<div class="pt-desktop-card__body pt-starchart-panel__body" id="pt-starchart-panel-body"></div>',
            '<div class="pt-desktop-card__glow" aria-hidden="true"></div>',
            '</article>',
            '</aside>',
            '<div class="pt-starchart-hint">点击行星打开工具 · 拖拽旋转视角 · 滚轮缩放 · 点默认视角回到太阳俯视</div>',
            '</section>'
        ].join('');
    }

    function esc(text) {
        return String(text == null ? '' : text).replace(/[&<>"']/g, function(ch) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
        });
    }

    function renderWithSharedCardShell(tool, displayModule, instanceLabel) {
        var content = displayModule && typeof displayModule.render === 'function' ? displayModule.render() : '';
        if (!window.PT_renderToolCardShell) return content;
        return window.PT_renderToolCardShell({
            title: tool.title,
            icon: tool.iconText || '◆',
            instanceLabel: instanceLabel,
            showToolbar: false,
            bodyClassName: 'pt-window-card__body--starchart-' + tool.id,
            content: content
        });
    }

    function renderToolBody(tool, displayModule) {
        var instanceLabel = '#星图';
        if (displayModule && typeof displayModule.render === 'function') {
            if (tool.useCardShell) return renderWithSharedCardShell(tool, displayModule, instanceLabel);
            return displayModule.render({
                instanceId: 'starchart-' + tool.id,
                toolTitle: tool.title,
                toolIcon: tool.iconText || '◆',
                instanceLabel: instanceLabel,
                showToolbar: false
            });
        }
        if (window.PT_renderToolCard) return window.PT_renderToolCard(tool, { instanceLabel: instanceLabel, showToolbar: false });
        return '<div class="pt-starchart-placeholder"><div><span class="pt-starchart-kicker">工具 / 占位</span><h2>' + esc(tool.title) + '</h2><p>这个工具还没有接入星图模式，等工具完善后再搬进来。</p></div></div>';
    }

    function openTool(toolId) {
        var panel = document.getElementById('pt-starchart-panel');
        var body = document.getElementById('pt-starchart-panel-body');
        if (!panel || !body || !window.PT_STARCHART_CONFIG) return;
        var tool = window.PT_STARCHART_CONFIG.getTool(toolId) || window.PT_STARCHART_CONFIG.getTool('settings');
        var displayModule = tool && tool.moduleName ? window[tool.moduleName] : null;
        panel.classList.remove('pt-starchart-panel--open');
        void panel.offsetWidth;
        panel.classList.add('pt-starchart-panel--open');
        body.innerHTML = renderToolBody(tool, displayModule);
        if (displayModule && typeof displayModule.bind === 'function') displayModule.bind(body);
        if (window.PT_STARCHART_STAGE && window.PT_STARCHART_STAGE_INSTANCE) {
            window.PT_STARCHART_STAGE.focusTool(window.PT_STARCHART_STAGE_INSTANCE, toolId);
        }
    }

    function bindShell() {
        var root = document.querySelector('.pt-starchart-root');
        if (!root) return;
        root.addEventListener('click', function(event) {
            var action = event.target.closest('[data-starchart-action]');
            if (!action) return;
            var type = action.getAttribute('data-starchart-action');
            if (type === 'open-settings') {
                openTool('settings');
                return;
            }
            if (type === 'default-view') {
                if (window.PT_STARCHART_STAGE && window.PT_STARCHART_STAGE_INSTANCE) {
                    window.PT_STARCHART_STAGE.setDefaultView(window.PT_STARCHART_STAGE_INSTANCE);
                }
                return;
            }
            if (type === 'open-portal' && typeof window.PT_switchModeWithTransition === 'function') {
                window.PT_switchModeWithTransition('portal');
            }
        });
    }

    function startStage() {
        var canvas = document.getElementById('pt-starchart-canvas');
        if (!canvas || !window.PT_STARCHART_STAGE || !window.PT_STARCHART_CONFIG) return;
        var settings = window.PT_STARCHART_CONFIG.readSettings();
        window.PT_STARCHART_STAGE_INSTANCE = window.PT_STARCHART_STAGE.create(canvas, settings);
        if (window.PT_STARCHART_STAGE_INSTANCE) {
            window.PT_STARCHART_STAGE_INSTANCE.onToolSelect = function(toolId) {
                openTool(toolId);
            };
            window.PT_STARCHART_STAGE_INSTANCE.onOverview = function() {
                var panel = document.getElementById('pt-starchart-panel');
                if (panel) panel.classList.remove('pt-starchart-panel--open');
            };
        }
    }

    function start() {
        if (getLaunchMode() !== 'starchart') return;
        renderShell();
        bindShell();
        startStage();
        if (typeof window.PT_finishModeSwitchTransition === 'function') {
            window.PT_finishModeSwitchTransition();
        }
    }

    window.PT_renderStarchartModeShell = start;
    window.addEventListener('DOMContentLoaded', start);
})();
