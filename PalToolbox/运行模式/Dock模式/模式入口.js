window.PT_renderDockLauncher = function PT_renderDockLauncher() {
    var tools = window.PT_DOCK_TOOLS || {};
    return Object.keys(tools).map(function(toolId) {
        var tool = tools[toolId];
        var shortTitle = tool.shortTitle || tool.title;
        var icon = tool.iconText || '◆';
        return [
            '<button type="button" class="pt-dock-tool" data-tool-id="', tool.id, '" onclick="if(this._ptDockDragSuppressClick){this._ptDockDragSuppressClick=false;return;}PT_toggleDockTool(\'', tool.id, '\',this)" aria-label="', tool.title, '">',
            '<span class="pt-dock-tool__icon"><span class="pt-dock-tool__mix" aria-hidden="true"><svg class="pt-dock-tool__mix-svg" viewBox="0 0 50 50" preserveAspectRatio="none"><path class="pt-dock-tool__mix-fill pt-dock-tool__mix-fill--gold"></path><path class="pt-dock-tool__mix-fill pt-dock-tool__mix-fill--blue"></path></svg></span><span class="pt-dock-tool__icon-glyph">', icon, '</span></span>',
            '<span class="pt-dock-tool__label">', shortTitle, '</span>',
            '</button>'
        ].join('');
    }).join('');
};

window.PT_renderDockModeShell = function renderPTDockModeShell() {
    var root = document.getElementById('dock-mode-root');
    if (!root) return;

    root.innerHTML = [
        '<section class="pt-dock-desktop-shell">',
        '<div class="pt-desktop-stage" id="pt-desktop-stage"></div>',
        '<div class="pt-glass-layer" id="pt-glass-layer"></div>',
        '<svg class="pt-glass-mask-svg" id="pt-glass-mask-svg" width="0" height="0"><defs><mask id="pt-glass-mask"><rect x="0" y="0" width="1" height="1" fill="white"/></mask></defs></svg>',
        '<svg class="pt-mix-grad-defs" width="0" height="0" aria-hidden="true"><defs><radialGradient id="pt-mix-gold-grad" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="rgba(255,200,60,0.82)"/><stop offset="38%" stop-color="rgba(255,190,50,0.55)"/><stop offset="72%" stop-color="rgba(255,170,40,0.18)"/><stop offset="100%" stop-color="rgba(255,160,30,0.04)"/></radialGradient><radialGradient id="pt-mix-blue-grad" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="rgba(140,215,255,0.82)"/><stop offset="38%" stop-color="rgba(110,195,245,0.55)"/><stop offset="72%" stop-color="rgba(80,170,235,0.18)"/><stop offset="100%" stop-color="rgba(60,155,225,0.04)"/></radialGradient></defs></svg>',
        '<nav class="pt-dock-bar pt-dock-bar--desktop" aria-label="工具 Dock 栏">',
        '<div class="pt-dock-bar__tools">',
        window.PT_renderDockLauncher(),
        '</div>',
        '</nav>',
        '<div class="pt-dock-preview-bar" id="pt-dock-preview-bar"></div>',
        '</section>'
    ].join('');
    if (typeof window.PT_bindDockDragLaunchers === 'function') {
        window.PT_bindDockDragLaunchers();
    }
};

window.PT_openDockDragToolCard = function PT_openDockDragToolCard(toolId, sourceBtn, point) {
    var stage = document.getElementById('pt-desktop-stage');
    if (!stage || !toolId || !point || typeof window.PT_openToolCard !== 'function') return;

    var stageRect = stage.getBoundingClientRect();
    var stageStyle = window.getComputedStyle ? window.getComputedStyle(stage) : null;
    var paddingLeft = stageStyle ? parseFloat(stageStyle.paddingLeft) || 0 : 0;
    var paddingTop = stageStyle ? parseFloat(stageStyle.paddingTop) || 0 : 0;
    var paddingRight = stageStyle ? parseFloat(stageStyle.paddingRight) || 0 : 0;
    var paddingBottom = stageStyle ? parseFloat(stageStyle.paddingBottom) || 0 : 0;
    var cardWidth = 620;
    var cardHeight = Math.max(460, stageRect.height - 170);
    var maxLeft = Math.max(paddingLeft, stageRect.width - paddingRight - cardWidth);
    var maxTop = Math.max(paddingTop, stageRect.height - paddingBottom - cardHeight - 96);
    var left = point.clientX - stageRect.left - cardWidth / 2;
    var top = point.clientY - stageRect.top - cardHeight / 2;

    left = Math.max(paddingLeft, Math.min(maxLeft, left));
    top = Math.max(paddingTop, Math.min(maxTop, top));

    window.PT_openToolCard(toolId, {
        left: Math.round(left),
        top: Math.round(top)
    }, sourceBtn || null, {
        type: 'dock-drag-burst',
        originPoint: {
            clientX: point.clientX,
            clientY: point.clientY
        }
    });
};

window.PT_createDockDragGhost = function PT_createDockDragGhost(sourceBtn, point) {
    if (!sourceBtn || !point) return null;
    var icon = sourceBtn.querySelector('.pt-dock-tool__icon');
    if (!icon) return null;
    var rect = icon.getBoundingClientRect();
    var ghost = document.createElement('div');
    ghost.className = 'pt-dock-drag-ghost';
    ghost.style.width = Math.round(rect.width) + 'px';
    ghost.style.height = Math.round(rect.height) + 'px';
    ghost.innerHTML = icon.outerHTML;
    document.body.appendChild(ghost);
    window.PT_moveDockDragGhost(ghost, point);
    requestAnimationFrame(function() {
        ghost.classList.add('pt-dock-drag-ghost--active');
    });
    return ghost;
};

window.PT_moveDockDragGhost = function PT_moveDockDragGhost(ghost, point) {
    if (!ghost || !point) return;
    var width = ghost.offsetWidth || 54;
    var height = ghost.offsetHeight || 54;
    var startX = parseFloat(ghost.getAttribute('data-start-x')) || point.clientX;
    var tilt = Math.max(-8, Math.min(8, (point.clientX - startX) / 18));
    ghost.style.transform = 'translate3d(' + Math.round(point.clientX - width / 2) + 'px,' + Math.round(point.clientY - height / 2) + 'px,0) rotate(' + tilt.toFixed(2) + 'deg) scale(1.18)';
};

window.PT_destroyDockDragGhost = function PT_destroyDockDragGhost(ghost, shouldBurst) {
    if (!ghost) return;
    ghost.classList.remove('pt-dock-drag-ghost--active');
    ghost.classList.add(shouldBurst ? 'pt-dock-drag-ghost--burst' : 'pt-dock-drag-ghost--cancel');
    setTimeout(function() {
        if (ghost.parentNode) ghost.parentNode.removeChild(ghost);
    }, shouldBurst ? 180 : 220);
};

window.PT_playDockReleasePulse = function PT_playDockReleasePulse(point) {
    if (!point) return;
    var pulse = document.createElement('div');
    pulse.className = 'pt-dock-release-pulse';
    pulse.style.left = Math.round(point.clientX) + 'px';
    pulse.style.top = Math.round(point.clientY) + 'px';
    document.body.appendChild(pulse);
    setTimeout(function() {
        if (pulse.parentNode) pulse.parentNode.removeChild(pulse);
    }, 520);
};

window.PT_playDockOriginReaction = function PT_playDockOriginReaction(btn, type) {
    if (!btn) return;
    var className = type === 'release' ? 'pt-dock-tool--origin-release' : 'pt-dock-tool--origin-reaction';
    btn.classList.remove('pt-dock-tool--origin-reaction', 'pt-dock-tool--origin-release');
    btn.offsetHeight;
    btn.classList.add(className);
    setTimeout(function() {
        btn.classList.remove(className);
    }, type === 'release' ? 460 : 360);
};

window.PT_hideDockPreviewsForDrag = function PT_hideDockPreviewsForDrag() {
    clearTimeout(window.__PT_hoverTimer);
    var previewBar = document.getElementById('pt-dock-preview-bar');
    if (!previewBar) return;
    previewBar.classList.remove('pt-dock-preview-bar--visible');
    previewBar.innerHTML = '';
};

window.PT_bindDockDragLaunchers = function PT_bindDockDragLaunchers() {
    var dockBar = document.querySelector('.pt-dock-bar');
    if (!dockBar) return;

    document.querySelectorAll('.pt-dock-tool').forEach(function(btn) {
        if (btn._ptDockDragBound) return;
        btn._ptDockDragBound = true;

        var dragState = null;
        var cancelDrag = function(shouldBurst) {
            var ghost = dragState ? dragState.ghost : null;
            dragState = null;
            window._ptDockDragging = false;
            btn.classList.remove('pt-dock-tool--drag-open');
            if (ghost) window.PT_destroyDockDragGhost(ghost, !!shouldBurst);
        };

        btn.addEventListener('pointerdown', function(e) {
            if (e.button != null && e.button !== 0) return;
            var rect = btn.getBoundingClientRect();
            dragState = {
                pointerId: e.pointerId,
                startX: e.clientX,
                startY: e.clientY,
                active: false,
                dockTop: dockBar.getBoundingClientRect().top,
                buttonCenterX: rect.left + rect.width / 2,
                ghost: null
            };
            window._ptDockDragging = true;
            window.PT_hideDockPreviewsForDrag();
            if (btn.setPointerCapture) {
                try { btn.setPointerCapture(e.pointerId); } catch (err) {}
            }
        });

        btn.addEventListener('pointermove', function(e) {
            if (!dragState || dragState.pointerId !== e.pointerId) return;
            var movedUp = dragState.startY - e.clientY;
            var movedX = e.clientX - dragState.startX;
            var movedY = e.clientY - dragState.startY;
            var movedDistance = Math.sqrt(movedX * movedX + movedY * movedY);
            var outOfDock = e.clientY < dragState.dockTop - 8;
            dragState.active = dragState.active || movedDistance > 2;
            if (dragState.active && !dragState.ghost) {
                window.PT_playDockOriginReaction(btn, 'lift');
                dragState.ghost = window.PT_createDockDragGhost(btn, {
                    clientX: e.clientX,
                    clientY: e.clientY
                });
                if (dragState.ghost) {
                    dragState.ghost.setAttribute('data-start-x', String(dragState.startX));
                }
            }
            if (dragState.ghost) {
                window.PT_moveDockDragGhost(dragState.ghost, {
                    clientX: e.clientX,
                    clientY: e.clientY
                });
            }
            btn.classList.toggle('pt-dock-tool--drag-open', dragState.active);
            if (dragState.active) e.preventDefault();
        });

        btn.addEventListener('pointerup', function(e) {
            if (!dragState || dragState.pointerId !== e.pointerId) return;
            var wasDragging = !!dragState.active;
            var shouldOpen = dragState.active && e.clientY < dragState.dockTop - 8;
            var toolId = btn.getAttribute('data-tool-id');
            cancelDrag(shouldOpen);
            if (wasDragging) {
                btn._ptDockDragSuppressClick = true;
                setTimeout(function() { btn._ptDockDragSuppressClick = false; }, 120);
                e.preventDefault();
                e.stopPropagation();
            }
            if (!shouldOpen || !toolId) return;
            window.PT_playDockOriginReaction(btn, 'release');
            window.PT_playDockReleasePulse({
                clientX: e.clientX,
                clientY: e.clientY
            });
            window.PT_openDockDragToolCard(toolId, btn, {
                clientX: e.clientX,
                clientY: e.clientY
            });
        });

        btn.addEventListener('pointercancel', function() {
            cancelDrag(false);
        });
        btn.addEventListener('lostpointercapture', function(e) {
            if (dragState && dragState.pointerId === e.pointerId) cancelDrag(false);
        });
    });
};

window.PT_getDockInstanceVisualState = function PT_getDockInstanceVisualState(inst) {
    if (!inst) return 'closed';
    if (inst._closing) return 'closed';
    if (inst._targetMinimized === true) return 'minimized';
    if (inst._targetMinimized === false) return 'open';
    if (inst.minimized || inst.flownAway) return 'minimized';
    return 'open';
};

window.PT_updateDockToolStates = function PT_updateDockToolStates() {
    var state = window.PT_APP_STATE || {};
    var instances = state.instances || {};
    var hasMixed = false;

    document.querySelectorAll('.pt-dock-tool').forEach(function(btn) {
        var toolId = btn.getAttribute('data-tool-id');
        var openCount = 0;
        var minimizedCount = 0;

        Object.keys(instances).forEach(function(id) {
            var inst = instances[id];
            if (!inst || inst.toolId !== toolId) return;
            if (window.PT_isDockActionableCard && !window.PT_isDockActionableCard(inst)) return;
            if (window.PT_getDockInstanceVisualState(inst) === 'minimized') {
                minimizedCount += 1;
            } else {
                openCount += 1;
            }
        });

        var total = openCount + minimizedCount;
        btn.classList.remove('pt-dock-tool--open', 'pt-dock-tool--minimized', 'pt-dock-tool--mixed');
        btn.style.removeProperty('--pt-dock-open-ratio');
        btn.style.removeProperty('--pt-dock-split-pct');
        btn.setAttribute('data-open-count', String(openCount));
        btn.setAttribute('data-minimized-count', String(minimizedCount));

        if (total === 0) return;
        btn.style.setProperty('--pt-dock-open-ratio', String(openCount / total));
        btn.style.setProperty('--pt-dock-split-pct', String(openCount / total * 100) + '%');
        if (openCount > 0 && minimizedCount > 0) {
            btn.classList.add('pt-dock-tool--mixed');
            hasMixed = true;
        } else if (openCount > 0) {
            btn.classList.add('pt-dock-tool--open');
        } else {
            btn.classList.add('pt-dock-tool--minimized');
        }
    });
    if (hasMixed) {
        document.querySelectorAll('.pt-dock-tool--mixed').forEach(function(btn) {
            window.PT_renderDockMixedWave(btn, performance.now());
        });
    }
    window.PT_toggleDockMixedWaveLoop(hasMixed);
    if (typeof window.PT_refreshDockPreviewStates === 'function') {
        window.PT_refreshDockPreviewStates();
    }
};

window.PT_buildDockWavePath = function PT_buildDockWavePath(baseY, width, height, phase, amplitude, isTop) {
    var segments = 6;
    var points = [];
    var minY = 7;
    var maxY = height - 7;
    for (var i = 0; i <= segments; i += 1) {
        var x = width * i / segments;
        var y = baseY
            + Math.sin(phase + i * 0.92) * amplitude
            + Math.sin(phase * 0.53 + i * 1.18) * (amplitude * 0.34);
        y = Math.max(minY, Math.min(maxY, y));
        points.push({ x: x, y: y });
    }

    if (isTop) {
        var topPath = ['M0 0', 'H' + width.toFixed(2), 'V' + points[points.length - 1].y.toFixed(2)];
        for (var reverseIndex = points.length - 1; reverseIndex >= 0; reverseIndex -= 1) {
            topPath.push('L' + points[reverseIndex].x.toFixed(2) + ' ' + points[reverseIndex].y.toFixed(2));
        }
        topPath.push('L0 0 Z');
        return topPath.join(' ');
    }

    var bottomPath = ['M0 ' + points[0].y.toFixed(2)];
    for (var forwardIndex = 0; forwardIndex < points.length; forwardIndex += 1) {
        bottomPath.push('L' + points[forwardIndex].x.toFixed(2) + ' ' + points[forwardIndex].y.toFixed(2));
    }
    bottomPath.push('L' + width.toFixed(2) + ' ' + height.toFixed(2));
    bottomPath.push('L0 ' + height.toFixed(2) + ' Z');
    return bottomPath.join(' ');
};

window.PT_renderDockMixedWave = function PT_renderDockMixedWave(btn, now) {
    if (!btn) return;
    var svg = btn.querySelector('.pt-dock-tool__mix-svg');
    if (!svg) return;
    var gold = svg.querySelector('.pt-dock-tool__mix-fill--gold');
    var blue = svg.querySelector('.pt-dock-tool__mix-fill--blue');
    if (!gold || !blue) return;

    var ratio = parseFloat(btn.style.getPropertyValue('--pt-dock-open-ratio'));
    if (!isFinite(ratio)) ratio = 0.5;

    var width = 50;
    var height = 50;
    var baseY = ratio * height;
    var amplitude = 1.8 + Math.min(ratio, 1 - ratio) * 2.2;
    var phase = now * 0.0062;

    gold.setAttribute('d', window.PT_buildDockWavePath(baseY, width, height, phase, amplitude, true));
    blue.setAttribute('d', window.PT_buildDockWavePath(baseY, width, height, phase, amplitude, false));
};

window.PT_updateDockMixedWave = function PT_updateDockMixedWave(now) {
    var mixedButtons = Array.prototype.slice.call(document.querySelectorAll('.pt-dock-tool--mixed'));
    if (!mixedButtons.length) {
        if (window.PT_dockMixedWaveState) window.PT_dockMixedWaveState.rafId = 0;
        return;
    }

    var timestamp = typeof now === 'number' ? now : performance.now();
    mixedButtons.forEach(function(btn) {
        window.PT_renderDockMixedWave(btn, timestamp);
    });

    if (!window.PT_dockMixedWaveState) window.PT_dockMixedWaveState = { rafId: 0 };
    window.PT_dockMixedWaveState.rafId = requestAnimationFrame(window.PT_updateDockMixedWave);
};

window.PT_toggleDockMixedWaveLoop = function PT_toggleDockMixedWaveLoop(shouldRun) {
    if (!window.PT_dockMixedWaveState) window.PT_dockMixedWaveState = { rafId: 0 };
    var waveState = window.PT_dockMixedWaveState;
    if (shouldRun) {
        if (!waveState.rafId) {
            waveState.rafId = requestAnimationFrame(window.PT_updateDockMixedWave);
        }
        return;
    }

    if (waveState.rafId) {
        cancelAnimationFrame(waveState.rafId);
        waveState.rafId = 0;
    }
};

window.PT_refreshDockPreviewStates = function PT_refreshDockPreviewStates() {
    var instances = (window.PT_APP_STATE || {}).instances || {};
    document.querySelectorAll('.pt-dock-preview-item').forEach(function(item) {
        var instanceId = item.getAttribute('data-instance-id');
        var inst = instances[instanceId];
        item.classList.remove('pt-dock-preview-item--open', 'pt-dock-preview-item--minimized');
        if (!inst) return;
        var visualState = window.PT_getDockInstanceVisualState(inst);
        if (visualState === 'closed') return;
        if (visualState === 'minimized') {
            item.classList.add('pt-dock-preview-item--minimized');
        } else {
            item.classList.add('pt-dock-preview-item--open');
        }
    });
};

window.PT_bindDockPreviews = function() {
    var previewBar = document.getElementById('pt-dock-preview-bar');
    if (!previewBar) return;
    window.__PT_hoverTimer = null;

    document.querySelectorAll('.pt-dock-tool').forEach(function(btn) {
        btn.addEventListener('mouseenter', function() {
            if (window._ptDockDragging) return;
            var toolId = btn.getAttribute('data-tool-id');
            var state = window.PT_APP_STATE || {};
            var hasBlocked = Object.values(state.instances || {}).some(function(i) {
                return i.toolId === toolId && (!window.PT_isDockActionableCard || window.PT_isDockActionableCard(i)) && i._previewBlocked;
            });
            if (hasBlocked) return;
            clearTimeout(window.__PT_hoverTimer);
            window.__PT_hoverTimer = setTimeout(function() { showPreviews(toolId, btn); }, 400);
        });

        btn.addEventListener('mouseleave', function() {
            clearTimeout(window.__PT_hoverTimer);
            var state = window.PT_APP_STATE || {};
            Object.values(state.instances || {}).forEach(function(i) { if (i._previewBlocked) i._previewBlocked = false; });
            setTimeout(function() {
                if (!previewBar.matches(':hover')) {
                    previewBar.classList.remove('pt-dock-preview-bar--visible');
                    previewBar.innerHTML = '';
                }
            }, 150);
        });
    });

    previewBar.addEventListener('mouseleave', function() {
        previewBar.classList.remove('pt-dock-preview-bar--visible');
        previewBar.innerHTML = '';
    });

    function showPreviews(toolId, btn) {
        if (window._ptDockDragging) return;
        var state = window.PT_APP_STATE || {};
        var hasBlocked = Object.values(state.instances || {}).some(function(i) {
            return i.toolId === toolId && (!window.PT_isDockActionableCard || window.PT_isDockActionableCard(i)) && i._previewBlocked;
        });
        if (hasBlocked) return;
        var instances = [];
        Object.keys(state.instances).forEach(function(id) {
            var inst = state.instances[id];
            if (inst && inst.toolId === toolId && (!window.PT_isDockActionableCard || window.PT_isDockActionableCard(inst))) instances.push(inst);
        });

        if (instances.length === 0) return;

        var PREVIEW_H = 100;

        var bar = document.getElementById('pt-dock-preview-bar');
        bar.style.height = (PREVIEW_H + 40) + 'px';
        bar.innerHTML = instances.map(function(inst) {
            var num = inst.instanceId.split('-').pop();
            var toolMeta = (window.PT_DOCK_TOOLS || {})[inst.toolId] || {};
            var title = (toolMeta.title || inst.toolId) + ' #' + num;
            var stateClass = window.PT_getDockInstanceVisualState(inst) === 'minimized' ? 'pt-dock-preview-item--minimized' : 'pt-dock-preview-item--open';

            var ratio = 1.5;
            if (inst.element) {
                var w = inst.element.offsetWidth;
                var h = inst.element.offsetHeight;
                if (h > 0) ratio = w / h;
            }
            var thumbW = Math.round(PREVIEW_H * ratio);

            return '<div class="pt-dock-preview-item ' + stateClass + '" data-instance-id="' + inst.instanceId + '">' +
                '<div class="pt-dock-preview-thumb" style="width:' + thumbW + 'px;height:' + PREVIEW_H + 'px">' +
                '<div class="pt-dock-preview-content"></div>' +
                '</div>' +
                '<button class="pt-dock-preview-close" data-close-id="' + inst.instanceId + '">✕</button>' +
                '<span class="pt-dock-preview-title">' + title + '</span>' +
                '</div>';
        }).join('');

        var btnRect = btn.getBoundingClientRect();
        bar.style.left = (btnRect.left + btnRect.width / 2) + 'px';
        bar.style.bottom = (window.innerHeight - btnRect.top + 12) + 'px';
        bar.style.transform = 'translateX(-50%)';
        bar.classList.add('pt-dock-preview-bar--visible');

        bar.querySelectorAll('.pt-dock-preview-item').forEach(function(item) {
            var instanceId = item.getAttribute('data-instance-id');
            var inst = (window.PT_APP_STATE || {}).instances[instanceId];
            var contentDiv = item.querySelector('.pt-dock-preview-content');
            var thumbDiv = item.querySelector('.pt-dock-preview-thumb');

            if (inst && inst.element && contentDiv && thumbDiv) {
                var bodyEl = inst.element.querySelector('.pt-window-card__body');
                if (bodyEl) { contentDiv.innerHTML = bodyEl.innerHTML; }

                var cardW, cardH;
                if (inst.originalWidth && inst.originalHeight) {
                    cardW = parseInt(inst.originalWidth, 10);
                    cardH = parseInt(inst.originalHeight, 10);
                }
                if (!cardW || !cardH) {
                    cardW = inst.element.offsetWidth;
                    cardH = inst.element.offsetHeight;
                }
                var thumbH = PREVIEW_H;

                if (cardW && cardH) {
                    var scale = thumbH / cardH;
                    var contentW = Math.round(cardW * scale);
                    contentDiv.style.width = cardW + 'px';
                    contentDiv.style.height = cardH + 'px';
                    contentDiv.style.transform = 'scale(' + scale + ')';
                    thumbDiv.style.width = contentW + 'px';
                }
            }

            var wasMinimized = false;
            var previewFlownIds = [];
            var activated = false;

            item.addEventListener('mouseenter', function() {
                if (!inst || !inst.element) return;
                wasMinimized = inst.minimized;

                if (inst.minimized) { PT_landCard(instanceId); }

                previewFlownIds = [];
                var allInstances = (window.PT_APP_STATE || {}).instances || {};
                Object.keys(allInstances).forEach(function(id) {
                    if (id === instanceId) return;
                    var otherInst = allInstances[id];
                    if (otherInst && otherInst.element && !otherInst.flownAway && !otherInst.transitioning) {
                        PT_flyCard(id, 'pt-desktop-card--slide-down');
                        previewFlownIds.push(id);
                    }
                });
            });

            item.addEventListener('mouseleave', function() {
                if (activated) return;
                if (wasMinimized && inst && inst.element && !inst.flownAway) {
                    PT_flyCard(instanceId);
                    inst.minimized = true;
                }
                previewFlownIds.forEach(function(id) { PT_landCard(id); });
                previewFlownIds = [];
            });

            item.addEventListener('click', function(e) {
                if (e.target.closest('.pt-dock-preview-close')) return;
                activated = true;
                previewFlownIds.forEach(function(id) { PT_landCard(id); });
                previewFlownIds = [];
                if (inst && inst.element) {
                    PT_bringToFront(inst.element, instanceId);
                }
                bar.classList.remove('pt-dock-preview-bar--visible');
                bar.innerHTML = '';
            });

            var closeBtn = item.querySelector('.pt-dock-preview-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    PT_closeCard(instanceId);
                    bar.classList.remove('pt-dock-preview-bar--visible');
                    bar.innerHTML = '';
                });
            }
        });
    }
};

window.PT_updateGlassMask = function() {
    var mask = document.getElementById('pt-glass-mask');
    var stage = document.getElementById('pt-desktop-stage');
    if (!mask || !stage) return;

    var stageRect = stage.getBoundingClientRect();
    var instances = (window.PT_APP_STATE || {}).instances || {};
    var rects = '';

    Object.keys(instances).forEach(function(id) {
        var inst = instances[id];
        if (!window.PT_shouldMaskCard(inst)) return;
        var r = inst.element.getBoundingClientRect();
        var x = r.left - stageRect.left;
        var y = r.top - stageRect.top;
        rects += '<rect x="' + x + '" y="' + y + '" width="' + r.width + '" height="' + r.height + '" fill="white" rx="22"/>';
    });

    if (!rects) {
        rects = '<rect x="0" y="0" width="1" height="1" fill="white"/>';
    }

    mask.innerHTML = rects;
    var svg = document.getElementById('pt-glass-mask-svg');
    if (svg) { svg.style.display = 'none'; svg.offsetHeight; svg.style.display = ''; }
};

window.PT_shouldMaskCard = function PT_shouldMaskCard(inst) {
    if (!inst || !inst.element) return false;
    if (inst._skipGlassMask) return false;
    if (inst._closing) return false;
    if (inst.flownAway || inst.minimized) return false;
    if (inst._targetMinimized === true) return false;
    if (inst.element.style.visibility === 'hidden') return false;
    var rect = inst.element.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    if (rect.right < 0 || rect.bottom < 0) return false;
    return true;
};

window.addEventListener('DOMContentLoaded', function() {
    var mode = 'dock';
    try { var s = typeof window.readPTSettings === 'function' ? window.readPTSettings() : null; mode = (s && s.webMode) || 'dock'; } catch (e) {}
    if (mode !== 'dock') return;

    window.PT_renderDockModeShell();
    window.PT_bindDockPreviews();
    window.PT_updateGlassMask();
    window.PT_updateDockToolStates();
    document.addEventListener('mousemove', function(e) {
        document.querySelectorAll('.pt-input:hover, .pt-custom-select__trigger:hover').forEach(function(el) {
            var rect = el.getBoundingClientRect();
            var x = ((e.clientX - rect.left) / rect.width) * 100;
            var y = ((e.clientY - rect.top) / rect.height) * 100;
            el.style.setProperty('--pt-mx', x.toFixed(1) + '%');
            el.style.setProperty('--pt-my', y.toFixed(1) + '%');
        });
    });
    var settings = typeof window.readPTSettings === 'function' ? window.readPTSettings() : { theme: 'oceanic' };
    if (typeof window.PT_applyVisualPrefs === 'function') {
        window.PT_applyVisualPrefs(settings);
    }
    if (typeof window.PT_finishModeSwitchTransition === 'function') {
        window.PT_finishModeSwitchTransition();
    }
});
