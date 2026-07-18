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
        if (!app || !window.PT_IMMERSIVE_CONFIG) return;
        var tools = window.PT_IMMERSIVE_CONFIG.getTools();
        document.body.classList.remove('pt-body--web-mode', 'pt-body--portal-mode');
        document.body.classList.add('pt-body--immersive-mode');
        app.innerHTML = [
            '<section class="pt-immersive-root">',
            '<canvas class="pt-immersive-canvas" id="pt-immersive-canvas" aria-hidden="true"></canvas>',
            '<div class="pt-immersive-vignette"></div>',
            '<div class="pt-immersive-shell">',
            '<header class="pt-immersive-topbar">',
            '<div class="pt-immersive-brand"><strong>沉浸模式</strong><span>工具星图 / 粒子幕墙 / 全息面板</span></div>',
            '<div class="pt-immersive-actions">',
            '<button type="button" class="pt-immersive-btn pt-immersive-btn--scene" data-immersive-action="enter-space">空间场景</button>',
            '<button type="button" class="pt-immersive-btn pt-immersive-btn--scene" data-immersive-action="enter-starchart">星图场景</button>',
            '<button type="button" class="pt-immersive-btn" data-immersive-action="open-settings">设置</button>',
            '<button type="button" class="pt-immersive-btn" data-immersive-action="open-portal">进入模式选择</button>',
            '</div>',
            '</header>',
            '<main class="pt-immersive-space">',
            '<section class="pt-immersive-tool-orbit" aria-label="沉浸模式工具星图">',
            '<div class="pt-immersive-orbit-ring"></div>',
            tools.map(function(tool, index) {
                if (window.PT_IMMERSIVE_TOOL_ORBIT) return window.PT_IMMERSIVE_TOOL_ORBIT.renderToolNode(tool, index, tools.length);
                return '';
            }).join(''),
            '</section>',
            '<section class="pt-immersive-panel-zone"><div class="pt-immersive-panel" id="pt-immersive-panel"></div></section>',
            '</main>',
            '</div>',
            '</section>'
        ].join('');
    }

    function renderPlaceholder(tool) {
        return '<div class="pt-immersive-placeholder"><div><span class="pt-immersive-kicker">工具 / 占位</span><h2>' + tool.title + '</h2><p>这个工具还没有接入沉浸模式，等工具完善后再搬进来。</p></div></div>';
    }

    function openTool(toolId) {
        var panel = document.getElementById('pt-immersive-panel');
        if (!panel || !window.PT_IMMERSIVE_CONFIG) return;
        var tool = window.PT_IMMERSIVE_CONFIG.getTool(toolId) || window.PT_IMMERSIVE_CONFIG.getTool('settings');
        var displayModule = tool && tool.moduleName ? window[tool.moduleName] : null;
        panel.classList.remove('pt-immersive-panel--opening');
        void panel.offsetWidth;
        panel.classList.add('pt-immersive-panel--opening');
        if (displayModule && typeof displayModule.render === 'function') {
            panel.innerHTML = displayModule.render();
            if (typeof displayModule.bind === 'function') displayModule.bind(panel);
        } else {
            panel.innerHTML = renderPlaceholder(tool);
        }
        if (window.PT_IMMERSIVE_TOOL_ORBIT) window.PT_IMMERSIVE_TOOL_ORBIT.markActive(tool.id);
        var toolIndex = window.PT_IMMERSIVE_TOOL_ORBIT ? window.PT_IMMERSIVE_TOOL_ORBIT.getToolIndex(tool.id) : -1;
        var tools = window.PT_IMMERSIVE_CONFIG.getTools();
        if (toolIndex >= 0 && window.PT_IMMERSIVE_STAGE && window.PT_IMMERSIVE_STAGE_INSTANCE) {
            window.PT_IMMERSIVE_STAGE.focusTool(window.PT_IMMERSIVE_STAGE_INSTANCE, toolIndex, tools.length);
        }
    }

    function bindShell() {
        var root = document.querySelector('.pt-immersive-root');
        if (!root) return;
        root.addEventListener('click', function(event) {
            var toolNode = event.target.closest('[data-immersive-tool]');
            if (toolNode) {
                openTool(toolNode.getAttribute('data-immersive-tool'));
                return;
            }
            var action = event.target.closest('[data-immersive-action]');
            if (!action) return;
            var type = action.getAttribute('data-immersive-action');
            if (type === 'open-settings') {
                openTool('settings');
                return;
            }
            if (type === 'enter-space' && typeof window.PT_switchModeWithTransition === 'function') {
                window.PT_switchModeWithTransition('space');
                return;
            }
            if (type === 'enter-starchart' && typeof window.PT_switchModeWithTransition === 'function') {
                window.PT_switchModeWithTransition('starchart');
                return;
            }
            if (type === 'open-portal' && typeof window.PT_switchModeWithTransition === 'function') {
                window.PT_switchModeWithTransition('portal');
            }
        });
    }

    function startStage() {
        var canvas = document.getElementById('pt-immersive-canvas');
        if (!canvas || !window.PT_IMMERSIVE_STAGE || !window.PT_IMMERSIVE_CONFIG) return;
        var settings = window.PT_IMMERSIVE_CONFIG.readSettings();
        window.PT_IMMERSIVE_STAGE_INSTANCE = window.PT_IMMERSIVE_STAGE.create(canvas, settings);
        if (settings.particleImage && window.PT_IMMERSIVE_STAGE_INSTANCE) {
            window.PT_IMMERSIVE_STAGE.setImage(window.PT_IMMERSIVE_STAGE_INSTANCE, settings.particleImage);
        }
    }

    function start() {
        if (getLaunchMode() !== 'immersive') return;
        renderShell();
        bindShell();
        startStage();
        openTool('calculator');
        if (typeof window.PT_finishModeSwitchTransition === 'function') {
            window.PT_finishModeSwitchTransition();
        }
    }

    window.PT_renderImmersiveModeShell = start;
    window.addEventListener('DOMContentLoaded', start);
})();
