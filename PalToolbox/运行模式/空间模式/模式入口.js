(function() {
    var DEFAULT_SPACE_VIEW = {
        yaw: 0,
        pitch: 0,
        depth: 0
    };
    var SHELF_TOP_DEPTH = 420;
    var SHELF_LAYER_GAP = 48;
    var spaceViewController = null;
    var spaceShelfState = {
        activeIndex: 0,
        wheelLocked: false
    };

    function getLaunchMode() {
        try {
            var settings = typeof window.readPTSettings === 'function' ? window.readPTSettings('dock') : {};
            return settings.webMode || 'portal';
        } catch (error) { return 'portal'; }
    }

    function renderShell() {
        var app = document.getElementById('app');
        if (!app || !window.PT_SPACE_CONFIG) return;
        var tools = window.PT_SPACE_CONFIG.getTools();
        document.body.classList.remove('pt-body--web-mode', 'pt-body--portal-mode', 'pt-body--immersive-mode', 'pt-body--starchart-mode');
        document.body.classList.add('pt-body--space-mode');
        app.innerHTML = [
            '<section class="pt-space-root" id="pt-space-root">',
            '<canvas class="pt-space-canvas" id="pt-space-canvas"></canvas>',
            '<div class="pt-space-ui">',
            '<header class="pt-space-topbar">',
            '<div class="pt-space-brand"><strong>空间模式</strong><span>粒子舞台 / 3D工具架</span></div>',
            '<div class="pt-space-actions">',
            '<button type="button" class="pt-space-btn pt-space-btn--accent" data-space-action="reset-view">默认视角</button>',
            '<button type="button" class="pt-space-btn" data-space-action="open-settings">设置</button>',
            '<button type="button" class="pt-space-btn" data-space-action="open-portal">进入模式选择</button>',
            '</div>',
            '</header>',
            '</div>',
            '<main class="pt-space-workspace">',
            '<div class="pt-space-depth-stage" id="pt-space-depth-stage">',
            '<section class="pt-space-tool-bay" id="pt-space-tool-bay" aria-live="polite">',
            '<article class="pt-space-desktop-card pt-desktop-card" id="pt-space-desktop-card">',
            '<div class="pt-desktop-card__body pt-space-desktop-card__body pt-space-tool-bay__body" id="pt-space-tool-bay-body"></div>',
            '<div class="pt-desktop-card__glow" aria-hidden="true"></div>',
            '</article>',
            '</section>',
            '<nav class="pt-space-tool-wheel" aria-label="空间模式工具轮盘">',
            '<div class="pt-space-tool-wheel__rail" aria-hidden="true"></div>',
            '<div class="pt-space-tool-switcher">',
            tools.map(renderToolSwitch).join(''),
            '</div>',
            '</nav>',
            '</div>',
            '</main>',
            '<div class="pt-space-hint">拖拽空白处旋转空间 · 工具位于中央 · 右侧切换工具</div>',
            '</section>'
        ].join('');
    }

    function esc(text) {
        return String(text == null ? '' : text).replace(/[&<>"']/g, function(ch) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
        });
    }

    function renderToolSwitch(tool, index) {
        var statusText = tool.status === 'placeholder' ? '待接入' : '可使用';
        var coverText = (tool.shortTitle || tool.title || '?').slice(0, 2);
        return [
            '<button type="button" class="pt-space-tool-switch" data-space-tool="', esc(tool.id), '" data-space-index="', index, '" style="--pt-space-tool-accent:', esc(tool.accent || '#9df7ff'), '">',
            '<span class="pt-space-tool-switch__cover"><i>', esc(coverText), '</i></span>',
            '<span class="pt-space-tool-switch__panel">',
            '<span class="pt-space-tool-switch__meta">', statusText, '</span>',
            '<b>', esc(tool.shortTitle || tool.title), '</b>',
            '<em>NE · ', String(index + 1).padStart(2, '0'), ' · ', statusText, '</em>',
            '<span class="pt-space-tool-switch__bar"></span>',
            '</span>',
            '</button>'
        ].join('');
    }

    function markActiveTool(toolId) {
        if (!window.PT_SPACE_CONFIG) return;
        var tools = window.PT_SPACE_CONFIG.getTools();
        for (var i = 0; i < tools.length; i++) {
            if (tools[i].id === toolId) {
                setShelfActiveIndex(i, { visualOnly: true });
                return;
            }
        }
        syncShelfVisuals(-1);
    }

    function syncShelfVisuals(activeIndex) {
        var switches = document.querySelectorAll('.pt-space-tool-switch');
        for (var i = 0; i < switches.length; i++) {
            var offset = activeIndex < 0 ? i : i - activeIndex;
            var absOffset = Math.abs(offset);
            switches[i].style.setProperty('--pt-shelf-offset', offset.toFixed(2));
            switches[i].style.setProperty('--pt-shelf-abs', absOffset.toFixed(2));
            switches[i].style.setProperty('--pt-shelf-depth', String(SHELF_TOP_DEPTH - absOffset * SHELF_LAYER_GAP));
            switches[i].style.setProperty('--pt-shelf-scale', String(Math.max(0.72, 1.08 - absOffset * 0.055)));
            switches[i].style.setProperty('--pt-shelf-opacity', String(Math.max(0.16, 1 - absOffset * 0.17)));
            switches[i].classList.toggle('pt-space-tool-switch--center', offset === 0);
            switches[i].classList.toggle('pt-space-tool-switch--far', absOffset > 3);
            switches[i].classList.toggle('pt-space-tool-switch--active', offset === 0);
        }
    }

    function setShelfActiveIndex(index, options) {
        if (!window.PT_SPACE_CONFIG) return;
        var tools = window.PT_SPACE_CONFIG.getTools();
        var nextIndex = Math.max(0, Math.min(tools.length - 1, index || 0));
        spaceShelfState.activeIndex = nextIndex;
        syncShelfVisuals(nextIndex);
        if (!options || !options.visualOnly) {
            openTool(tools[nextIndex].id, { fromShelf: true });
        }
    }

    function getSpaceInstanceLabel(toolId) {
        if (!window.PT_SPACE_INSTANCE_COUNTERS) window.PT_SPACE_INSTANCE_COUNTERS = {};
        if (!window.PT_SPACE_INSTANCE_COUNTERS[toolId]) window.PT_SPACE_INSTANCE_COUNTERS[toolId] = 0;
        window.PT_SPACE_INSTANCE_COUNTERS[toolId] += 1;
        return '#' + window.PT_SPACE_INSTANCE_COUNTERS[toolId];
    }

    function renderWithSharedCardShell(tool, mod, instanceLabel) {
        var content = mod && typeof mod.render === 'function' ? mod.render() : '';
        if (window.PT_renderToolCardShell) {
            return window.PT_renderToolCardShell({
                title: tool.title,
                icon: tool.iconText || '◆',
                instanceLabel: instanceLabel,
                showToolbar: false,
                bodyClassName: 'pt-window-card__body--space-' + tool.id,
                content: content
            });
        }
        return content;
    }

    function renderToolBody(tool, mod, instanceLabel) {
        if (mod && typeof mod.render === 'function') {
            if (tool.useCardShell) return renderWithSharedCardShell(tool, mod, instanceLabel);
            return mod.render({
                instanceId: 'space-' + tool.id,
                toolTitle: tool.title,
                toolIcon: tool.iconText || '◆',
                instanceLabel: instanceLabel,
                showToolbar: false
            });
        }
        if (window.PT_renderToolCard) return window.PT_renderToolCard(tool, { instanceLabel: instanceLabel, showToolbar: false });
        return '<div class="pt-space-placeholder"><div><span class="pt-space-kicker">工具 / 占位</span><h2>' + esc(tool.title) + '</h2><p>尚未接入空间模式</p></div></div>';
    }

    function openTool(toolId, options) {
        var bay = document.getElementById('pt-space-tool-bay');
        var body = document.getElementById('pt-space-tool-bay-body');
        if (!bay || !body || !window.PT_SPACE_CONFIG) return;
        var tool = window.PT_SPACE_CONFIG.getTool(toolId) || window.PT_SPACE_CONFIG.getTool('settings');
        var mod = tool && tool.moduleName ? window[tool.moduleName] : null;
        var instanceLabel = getSpaceInstanceLabel(tool.id);
        if (bay.classList.contains('pt-space-tool-bay--open')) {
            emitSwitchBurst(bay, tool);
        }
        bay.setAttribute('data-active-space-tool', tool.id);
        bay.classList.remove('pt-space-tool-bay--open', 'pt-space-tool-bay--swap', 'pt-space-tool-bay--minimized');
        bay.classList.add('pt-space-tool-bay--swap');
        void bay.offsetWidth;
        bay.classList.add('pt-space-tool-bay--open');
        body.innerHTML = renderToolBody(tool, mod, instanceLabel);
        if (mod && typeof mod.bind === 'function') mod.bind(body);
        window.setTimeout(function() {
            bay.classList.remove('pt-space-tool-bay--swap');
        }, 520);
        if (window.PT_SPACE_STAGE && window.PT_SPACE_STAGE_INSTANCE) {
            var tools = window.PT_SPACE_CONFIG.getTools();
            for (var i = 0; i < tools.length; i++) {
                if (tools[i].id === tool.id) {
                    setShelfActiveIndex(i, { visualOnly: true });
                    window.PT_SPACE_STAGE.focusTool(window.PT_SPACE_STAGE_INSTANCE, i, tools.length);
                    if (typeof window.PT_SPACE_STAGE.emitSwitchBurst === 'function') {
                        window.PT_SPACE_STAGE.emitSwitchBurst(window.PT_SPACE_STAGE_INSTANCE, i, tools.length);
                    }
                    break;
                }
            }
        }
    }

    function emitSwitchBurst(bay, tool) {
        var root = document.getElementById('pt-space-root');
        var card = document.getElementById('pt-space-desktop-card');
        if (!root || !card) return;
        var rect = card.getBoundingClientRect();
        var rootRect = root.getBoundingClientRect();
        var burst = document.createElement('div');
        burst.className = 'pt-space-switch-burst';
        burst.style.setProperty('--pt-burst-accent', tool.accent || '#9df7ff');
        for (var i = 0; i < 28; i++) {
            var dot = document.createElement('span');
            var edge = i % 4;
            var px = edge === 0 ? 0 : edge === 1 ? rect.width : Math.random() * rect.width;
            var py = edge === 2 ? 0 : edge === 3 ? rect.height : Math.random() * rect.height;
            var angle = Math.atan2(py - rect.height / 2, px - rect.width / 2);
            var distance = 80 + Math.random() * 170;
            dot.style.left = Math.round(rect.left - rootRect.left + px) + 'px';
            dot.style.top = Math.round(rect.top - rootRect.top + py) + 'px';
            dot.style.setProperty('--pt-burst-x', Math.cos(angle) * distance + 'px');
            dot.style.setProperty('--pt-burst-y', Math.sin(angle) * distance + 'px');
            dot.style.setProperty('--pt-burst-delay', (Math.random() * 120).toFixed(0) + 'ms');
            burst.appendChild(dot);
        }
        root.appendChild(burst);
        window.setTimeout(function() {
            if (burst.parentNode) burst.parentNode.removeChild(burst);
        }, 980);
    }

    function bindShell() {
        var root = document.querySelector('.pt-space-root');
        if (!root) return;
        bindSpaceView(root);
        bindToolShelfWheel(root);
        root.addEventListener('click', function(event) {
            var toolButton = event.target.closest('[data-space-tool]');
            if (toolButton) {
                var toolIndex = parseInt(toolButton.getAttribute('data-space-index'), 10);
                setShelfActiveIndex(isFinite(toolIndex) ? toolIndex : 0);
                return;
            }
            var action = event.target.closest('[data-space-action]');
            if (!action) return;
            var type = action.getAttribute('data-space-action');
            if (type === 'reset-view' && spaceViewController) { spaceViewController.reset(); return; }
            if (type === 'open-settings') { openTool('settings'); return; }
            if (type === 'open-portal' && typeof window.PT_switchModeWithTransition === 'function') {
                window.PT_switchModeWithTransition('portal');
            }
        });
    }

    function bindToolShelfWheel(root) {
        var shelf = root.querySelector('.pt-space-tool-wheel');
        if (!shelf || !window.PT_SPACE_CONFIG) return;
        shelf.addEventListener('wheel', function(event) {
            event.preventDefault();
            event.stopPropagation();
            if (spaceShelfState.wheelLocked) return;
            var tools = window.PT_SPACE_CONFIG.getTools();
            var direction = event.deltaY > 0 ? 1 : -1;
            var nextIndex = Math.max(0, Math.min(tools.length - 1, spaceShelfState.activeIndex + direction));
            if (nextIndex === spaceShelfState.activeIndex) return;
            spaceShelfState.wheelLocked = true;
            setShelfActiveIndex(nextIndex);
            window.setTimeout(function() {
                spaceShelfState.wheelLocked = false;
            }, 180);
        }, { passive: false });
    }

    function bindSpaceView(root) {
        var view = {
            yaw: DEFAULT_SPACE_VIEW.yaw,
            pitch: DEFAULT_SPACE_VIEW.pitch,
            depth: DEFAULT_SPACE_VIEW.depth,
            dragging: false,
            lastX: 0,
            lastY: 0
        };

        function clamp(value, min, max) {
            return Math.max(min, Math.min(max, value));
        }

        function isInteractive(target) {
            return !!(target && target.closest && target.closest('input, select, textarea, button, .pt-space-desktop-card'));
        }

        function setSpaceView() {
            root.style.setProperty('--pt-space-rot-y', view.yaw.toFixed(2) + 'deg');
            root.style.setProperty('--pt-space-rot-x', view.pitch.toFixed(2) + 'deg');
            root.style.setProperty('--pt-space-depth', view.depth.toFixed(2) + 'px');
            if (window.PT_SPACE_STAGE && window.PT_SPACE_STAGE_INSTANCE && typeof window.PT_SPACE_STAGE.setView === 'function') {
                window.PT_SPACE_STAGE.setView(window.PT_SPACE_STAGE_INSTANCE, {
                    yaw: view.yaw,
                    pitch: view.pitch,
                    depth: view.depth
                });
            }
        }

        function resetSpaceView() {
            view.yaw = DEFAULT_SPACE_VIEW.yaw;
            view.pitch = DEFAULT_SPACE_VIEW.pitch;
            view.depth = DEFAULT_SPACE_VIEW.depth;
            setSpaceView();
        }

        spaceViewController = {
            reset: resetSpaceView
        };
        setSpaceView();

        root.addEventListener('pointerdown', function(event) {
            if (event.button !== 0 || isInteractive(event.target)) return;
            view.dragging = true;
            view.lastX = event.clientX;
            view.lastY = event.clientY;
            root.classList.add('pt-space-root--rotating');
        });

        window.addEventListener('pointermove', function(event) {
            if (!view.dragging) return;
            var dx = event.clientX - view.lastX;
            var dy = event.clientY - view.lastY;
            view.lastX = event.clientX;
            view.lastY = event.clientY;
            view.yaw += dx * 0.22;
            view.pitch -= dy * 0.16;
            setSpaceView();
        });

        window.addEventListener('pointerup', function() {
            if (!view.dragging) return;
            view.dragging = false;
            root.classList.remove('pt-space-root--rotating');
        });

        root.addEventListener('wheel', function(event) {
            if (isInteractive(event.target)) return;
            event.preventDefault();
            view.depth = clamp(view.depth - event.deltaY * 0.18, -420, 360);
            setSpaceView();
        }, { passive: false });
    }

    function startStage() {
        var canvas = document.getElementById('pt-space-canvas');
        if (!canvas || !window.PT_SPACE_STAGE || !window.PT_SPACE_CONFIG) return;
        var settings = window.PT_SPACE_CONFIG.readSettings();
        var state = window.PT_SPACE_STAGE.create(canvas, settings);
        if (!state) return;
        window.PT_SPACE_STAGE_INSTANCE = state;
        if (settings.coverImage) {
            window.PT_SPACE_STAGE.setCoverImage(state, settings.coverImage);
        }
    }

    function start() {
        if (getLaunchMode() !== 'space') return;
        renderShell();
        bindShell();
        startStage();
        openTool('calculator');
        if (typeof window.PT_finishModeSwitchTransition === 'function') {
            window.PT_finishModeSwitchTransition();
        }
    }

    window.PT_renderSpaceModeShell = start;
    window.addEventListener('DOMContentLoaded', start);
})();
