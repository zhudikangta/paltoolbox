window.PT_openToolCard = function PT_openToolCard(toolId, position, sourceBtn, openOptions) {
    var tools = window.PT_DOCK_TOOLS || {};
    var toolMeta = tools[toolId];
    var mount = document.getElementById('pt-desktop-stage');
    if (!toolMeta || !mount) return;

    var state = window.PT_APP_STATE || {};
    if (!state.toolCounters[toolId]) state.toolCounters[toolId] = 0;
    state.toolCounters[toolId] += 1;
    var instanceNum = state.toolCounters[toolId];
    var instanceId = toolId + '-' + instanceNum;

    var cardShell = document.createElement('article');
    cardShell.className = 'pt-desktop-card';
    cardShell.setAttribute('data-instance-id', instanceId);
    cardShell.setAttribute('data-tool-id', toolId);
    cardShell.style.width = toolMeta.defaultWidth || '620px';
    cardShell.style.height = toolMeta.defaultHeight || 'calc(100vh - 170px)';
    cardShell.style.zIndex = state.nextZIndex;
    state.nextZIndex += 1;

    if (position) {
        cardShell.style.left = position.left + 'px';
        cardShell.style.top = position.top + 'px';
    } else if (!cardShell.style.left || cardShell.style.left === 'auto') {
        var btn = document.querySelector('.pt-dock-tool[data-tool-id="' + toolId + '"]');
        var dockBar = document.querySelector('.pt-dock-bar');
        var stgEl = document.getElementById('pt-desktop-stage');
        if (btn && dockBar && stgEl) {
            var br = btn.getBoundingClientRect();
            var sr2 = stgEl.getBoundingClientRect();
            var dbr = dockBar.getBoundingClientRect();
            var pl2 = parseFloat(getComputedStyle(stgEl).paddingLeft) || 0;
            var pt2 = parseFloat(getComputedStyle(stgEl).paddingTop) || 0;
            var cardW = 620;
            var cardH = window.innerHeight - 170;
            var vl = br.left + br.width / 2 - cardW / 2;
            var vt = dbr.top - 20 - cardH;
            cardShell.style.left = Math.round(vl - sr2.left - pl2) + 'px';
            cardShell.style.top = Math.round(vt - sr2.top - pt2) + 'px';
        } else {
            cardShell.style.left = '24px';
            cardShell.style.top = '24px';
        }
    }

    var cardBody = document.createElement('div');
    cardBody.className = 'pt-desktop-card__body';
    cardShell.appendChild(cardBody);

    var glowLayer = document.createElement('div');
    glowLayer.className = 'pt-desktop-card__glow';
    cardShell.appendChild(glowLayer);

    var grainLayer = document.createElement('div');
    grainLayer.className = 'pt-desktop-card__grain';
    cardShell.appendChild(grainLayer);

    var bloomLayer = document.createElement('div');
    bloomLayer.className = 'pt-desktop-card__bloom';
    cardShell.appendChild(bloomLayer);

    mount.appendChild(cardShell);

    var resizeHandle = document.createElement('div');
    resizeHandle.className = 'pt-resize-handle';
    resizeHandle.setAttribute('data-for-instance', instanceId);
    mount.appendChild(resizeHandle);
    PT_enableCardResize(cardShell, resizeHandle);
    resizeHandle.addEventListener('mouseenter', function() {
        resizeHandle.classList.add('pt-resize-handle--visible');
    });
    resizeHandle.addEventListener('mouseleave', function() {
        resizeHandle.classList.remove('pt-resize-handle--visible');
    });

    var displayModule = toolMeta.displayModule ? (window[toolMeta.displayModule] || null) : null;
    var instanceLabel = '#' + instanceNum;

    if (displayModule && typeof displayModule.render === 'function') {
        if (toolMeta.useCardShell) {
            cardBody.innerHTML = window.PT_renderToolCardShell({
                title: toolMeta.title,
                icon: toolMeta.iconText,
                instanceLabel: instanceLabel,
                bodyClassName: 'pt-window-card__body--' + toolId,
                content: displayModule.render()
            });
        } else {
            cardBody.innerHTML = displayModule.render({
                instanceId: instanceId,
                toolTitle: toolMeta.title,
                toolIcon: toolMeta.iconText,
                instanceLabel: instanceLabel
            });
        }
        if (typeof displayModule.bind === 'function') {
            displayModule.bind(cardBody);
        }
    } else {
        cardBody.innerHTML = window.PT_renderToolCard(toolMeta, { instanceLabel: instanceLabel });
    }

    PT_bindCardControls(cardShell, instanceId);
    window.PT_enableCardDrag(cardShell);
    if (window.PT_initCustomScrollbars) window.PT_initCustomScrollbars(cardShell);
    PT_bringToFront(cardShell, instanceId);

    state.instances[instanceId] = {
        instanceId: instanceId,
        toolId: toolId,
        element: cardShell,
        minimized: false,
        originalWidth: cardShell.style.width,
        originalHeight: cardShell.offsetHeight + 'px',
        originalLeft: cardShell.style.left,
        originalTop: cardShell.style.top,
        flownAway: false,
        openOptions: openOptions || null
    };

    if (sourceBtn) {
        PT_storeDockAnchorRect(instanceId, sourceBtn);
    }

    PT_refreshWindowVisualState();
    PT_runCinematicOpenTransition(instanceId);

    cardShell.addEventListener('mouseenter', function() {
        var h = document.querySelector('.pt-resize-handle[data-for-instance="' + instanceId + '"]');
        if (h) h.classList.add('pt-resize-handle--visible');
    });
    cardShell.addEventListener('mouseleave', function() {
        var h = document.querySelector('.pt-resize-handle[data-for-instance="' + instanceId + '"]');
        if (h) h.classList.remove('pt-resize-handle--visible');
    });
    window.PT_syncResizeHandle(instanceId);
    return instanceId;
};

window.PT_isDockActionableCard = function PT_isDockActionableCard(inst) {
    return !!(inst && !inst._closing);
};

window.PT_toggleDockTool = function PT_toggleDockTool(toolId, sourceBtn) {
    var state = window.PT_APP_STATE || {};
    var instances = [];
    Object.keys(state.instances).forEach(function(id) {
        var inst = state.instances[id];
        if (inst && inst.toolId === toolId && window.PT_isDockActionableCard(inst)) instances.push(inst);
    });

    if (instances.length === 0) {
        var position = null;
        if (sourceBtn) {
            var btnRect = sourceBtn.getBoundingClientRect();
            var stage = document.getElementById('pt-desktop-stage');
            var stageRect = stage ? stage.getBoundingClientRect() : null;
            if (stageRect) {
                var dockBar = document.querySelector('.pt-dock-bar');
                var dockBarRect = dockBar ? dockBar.getBoundingClientRect() : { top: window.innerHeight };
                var pl = parseFloat(getComputedStyle(stage).paddingLeft) || 0;
                var pTop = parseFloat(getComputedStyle(stage).paddingTop) || 0;
                var cW = 620;
                var cH = stageRect.height - 170;
                var vL = btnRect.left + btnRect.width / 2 - cW / 2;
                var vT = dockBarRect.top - 20 - cH;
                var left = vL - stageRect.left - pl;
                var top = vT - stageRect.top - pTop;
                position = { left: Math.round(left), top: Math.round(top) };
            }
        }
        window.PT_openToolCard(toolId, position, sourceBtn);
        return;
    }

    if (sourceBtn) {
        instances.forEach(function(i) { PT_storeDockAnchorRect(i.instanceId, sourceBtn); });
    }

    var minimized = instances.filter(function(i) { return i.minimized; });

    if (minimized.length > 0) {
        minimized.forEach(function(i) { PT_minimizeCard(i.instanceId); });
    } else {
        instances.forEach(function(i) { PT_minimizeCard(i.instanceId); });
    }
};

function PT_bringToFront(cardShell, instanceId) {
    var state = window.PT_APP_STATE || {};
    var layer = state.nextZIndex;
    state.nextZIndex += 1;
    if (instanceId && typeof PT_setMagnetGroupLayer === 'function') {
        PT_setMagnetGroupLayer(instanceId, layer);
    } else {
        cardShell.style.zIndex = layer;
    }
    if (instanceId && typeof window.PT_syncResizeHandle === 'function') {
        window.PT_syncResizeHandle(instanceId);
    }
    if (typeof PT_renderMagnetLinks === 'function') {
        requestAnimationFrame(PT_renderMagnetLinks);
    }
}

function PT_refreshWindowVisualState() {
    if (typeof window.PT_updateGlassMask === 'function') {
        window.PT_updateGlassMask();
    }
    if (typeof PT_renderMagnetLinks === 'function') {
        PT_renderMagnetLinks();
    }
    if (typeof window.PT_updateDockToolStates === 'function') {
        window.PT_updateDockToolStates();
    }
}

var PT_glassMaskMotionRaf = 0;
function PT_syncGlassMaskDuringMotion(duration) {
    if (typeof window.PT_updateGlassMask !== 'function') return;
    if (PT_glassMaskMotionRaf) cancelAnimationFrame(PT_glassMaskMotionRaf);
    var start = performance.now();
    var runFor = duration || 260;

    function tick(now) {
        window.PT_updateGlassMask();
        if (typeof PT_renderMagnetLinks === 'function') PT_renderMagnetLinks();
        if (now - start < runFor) {
            PT_glassMaskMotionRaf = requestAnimationFrame(tick);
            return;
        }
        PT_glassMaskMotionRaf = 0;
        window.PT_updateGlassMask();
        if (typeof PT_renderMagnetLinks === 'function') PT_renderMagnetLinks();
        requestAnimationFrame(function() {
            window.PT_updateGlassMask();
            if (typeof PT_renderMagnetLinks === 'function') PT_renderMagnetLinks();
        });
    }

    PT_glassMaskMotionRaf = requestAnimationFrame(tick);
}

var PT_CINEMATIC_OPEN_DURATION = 760;
var PT_CINEMATIC_CARD_DURATION = 520;
var PT_CINEMATIC_CLOSE_DURATION = 720;

function PT_clearMagnetRevealTimer(inst) {
    if (!inst) return;
    if (inst._magnetRevealTimer) {
        clearTimeout(inst._magnetRevealTimer);
        inst._magnetRevealTimer = null;
    }
}

function PT_revealMagnetLinksDuringRestore(instanceId) {
    var state = window.PT_APP_STATE || {};
    var inst = state.instances && state.instances[instanceId];
    if (!inst) return;
    PT_clearMagnetRevealTimer(inst);
    inst._magnetLinksHidden = true;
    inst._magnetRevealTimer = setTimeout(function() {
        inst._magnetRevealTimer = null;
        if (!state.instances || state.instances[instanceId] !== inst) return;
        if (inst._targetMinimized === true || inst.minimized || inst.flownAway) return;
        inst._magnetLinksHidden = false;
        PT_renderMagnetLinks();
    }, Math.round(PT_CINEMATIC_CARD_DURATION * 0.5));
}

function PT_removeCardInstance(instanceId) {
    var handle = document.querySelector('.pt-resize-handle[data-for-instance="' + instanceId + '"]');
    if (handle && handle.parentNode) handle.parentNode.removeChild(handle);

    var state = window.PT_APP_STATE || {};
    var inst = state.instances[instanceId];
    if (!inst) return;
    if (inst.element && inst.element.parentNode) {
        inst.element.parentNode.removeChild(inst.element);
    }
    delete state.instances[instanceId];
    PT_refreshWindowVisualState();
}

function PT_closeCard(instanceId) {
    var state = window.PT_APP_STATE || {};
    var inst = state.instances[instanceId];
    if (!inst) return;
    if (inst._closing) return;
    PT_clearMagnetRevealTimer(inst);
    inst._magnetLinksHidden = true;

    var oldLinks = (window.PT_magnetLinks || []).filter(function(link) {
        return link.a === instanceId || link.b === instanceId;
    });
    var stageEl = document.getElementById('pt-desktop-stage');
    var stageRectClose = stageEl ? stageEl.getBoundingClientRect() : null;
    var closeRect = stageRectClose ? PT_getStageCardRect(inst.element, stageRectClose) : null;

    if (oldLinks.length >= 2 && stageRectClose) {
        setTimeout(function() {
            PT_removeMagnetLinksFor(instanceId);
            PT_closeGapAfterMinimize(instanceId, oldLinks, closeRect, stageRectClose);
        }, Math.round(PT_CINEMATIC_CLOSE_DURATION * 0.5));
    }

    if (PT_runCinematicCloseTransition(instanceId, function() {
        PT_removeCardInstance(instanceId);
    })) {
        return;
    }

    PT_cancelCinematicTransition(inst);
    PT_removeCardInstance(instanceId);
}

function PT_saveCardPosition(inst) {
    var cardShell = inst.element;
    if (!cardShell) return;
    inst.originalLeft = cardShell.style.left;
    inst.originalTop = cardShell.style.top;
    inst.originalWidth = PT_getStableCardSizeValue(cardShell, 'width');
    inst.originalHeight = PT_getStableCardSizeValue(cardShell, 'height');
    inst._normalHasScrollbar = PT_measureCardHasScrollbar(cardShell);
    inst._hadScrollbar = inst._normalHasScrollbar;
}

function PT_getStableCardSizeValue(cardShell, prop) {
    var value = cardShell.style[prop] || '';
    if (value.indexOf('px') > -1 && parseFloat(value) > 0) {
        return Math.round(parseFloat(value)) + 'px';
    }
    var measured = prop === 'width' ? cardShell.offsetWidth : cardShell.offsetHeight;
    return Math.round(measured) + 'px';
}

function PT_measureCardHasScrollbar(cardShell) {
    if (!cardShell) return false;
    var scrollEls = cardShell.querySelectorAll('.pt-window-card__body');
    for (var i = 0; i < scrollEls.length; i++) {
        if (scrollEls[i].scrollHeight > scrollEls[i].clientHeight || scrollEls[i].scrollWidth > scrollEls[i].clientWidth) {
            return true;
        }
    }
    return false;
}

function PT_prepareCinematicScrollbars(inst, cardShell) {
    if (!inst || !cardShell) return;
    if (typeof inst._normalHasScrollbar !== 'boolean') {
        inst._normalHasScrollbar = PT_measureCardHasScrollbar(cardShell);
    }
    inst._hadScrollbar = inst._normalHasScrollbar;
    if (inst._hadScrollbar) return;
    var scrollEls = cardShell.querySelectorAll('.pt-window-card__body');
    for (var i = 0; i < scrollEls.length; i++) {
        scrollEls[i].style.overflow = 'hidden';
    }
    var customBars = cardShell.querySelectorAll('.pt-scrollbar');
    for (var j = 0; j < customBars.length; j++) {
        customBars[j].style.display = 'none';
    }
}

function PT_restoreCinematicScrollbars(inst, cardShell) {
    if (!inst || !cardShell || inst._hadScrollbar) return;
    var scrollEls = cardShell.querySelectorAll('.pt-window-card__body');
    for (var i = 0; i < scrollEls.length; i++) {
        scrollEls[i].style.overflow = '';
    }
    var customBars = cardShell.querySelectorAll('.pt-scrollbar');
    for (var j = 0; j < customBars.length; j++) {
        customBars[j].style.display = '';
    }
    if (window.PT_initCustomScrollbars) window.PT_initCustomScrollbars(cardShell);
}

function PT_storeDockAnchorRect(instanceId, sourceBtn) {
    var state = window.PT_APP_STATE || {};
    var inst = state.instances[instanceId];
    if (!inst || !sourceBtn || typeof sourceBtn.getBoundingClientRect !== 'function') return;
    var anchorEl = sourceBtn.querySelector ? (sourceBtn.querySelector('.pt-dock-tool__icon') || sourceBtn) : sourceBtn;
    var rect = anchorEl.getBoundingClientRect();
    inst.dockAnchorRect = {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height
    };
    inst.dockToolId = sourceBtn.getAttribute('data-tool-id') || inst.toolId;
}

function PT_getDockAnchorRect(inst) {
    if (!inst) return null;
    if (inst.dockAnchorRect) return inst.dockAnchorRect;
    var btn = document.querySelector('.pt-dock-tool[data-tool-id="' + inst.toolId + '"]');
    if (!btn || typeof btn.getBoundingClientRect !== 'function') return null;
    var anchorEl = btn.querySelector ? (btn.querySelector('.pt-dock-tool__icon') || btn) : btn;
    var rect = anchorEl.getBoundingClientRect();
    return {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height
    };
}

function PT_getDockToolElement(inst) {
    if (!inst) return null;
    var toolId = inst.dockToolId || inst.toolId;
    return document.querySelector('.pt-dock-tool[data-tool-id="' + toolId + '"]');
}

function PT_markDockCinematicHit(inst) {
    var btn = PT_getDockToolElement(inst);
    if (!btn) return;
    btn.classList.remove('pt-dock-tool--cinematic-hit');
    void btn.offsetWidth;
    btn.classList.add('pt-dock-tool--cinematic-hit');
    setTimeout(function() {
        btn.classList.remove('pt-dock-tool--cinematic-hit');
    }, 430);
}

function PT_clearCinematicInlineStyles(cardShell) {
    if (!cardShell) return;
    cardShell.style.opacity = '';
    cardShell.style.filter = '';
    cardShell.style.transform = '';
    cardShell.style.transformOrigin = '';
    cardShell.style.willChange = '';
    cardShell.style.clipPath = '';
    cardShell.style.boxShadow = '';
    cardShell.style.pointerEvents = '';
}

function PT_cancelCinematicTransition(inst, keepCardHidden) {
    if (!inst || !inst._cinematicTransition) return null;
    var running = inst._cinematicTransition;
    var visualRect = inst.element ? inst.element.getBoundingClientRect() : null;
    running.cancelled = true;
    if (running.maskRafId) cancelAnimationFrame(running.maskRafId);
    if (running.animation && typeof running.animation.cancel === 'function') {
        running.animation.onfinish = null;
        running.animation.oncancel = null;
        running.animation.cancel();
    }
    if (running.timer) clearTimeout(running.timer);
    PT_restoreCinematicScrollbars(inst, inst.element);
    PT_clearCinematicInlineStyles(inst.element);
    inst._cinematicTransition = null;
    inst.transitioning = false;
    inst._skipGlassMask = false;
    if (inst.element && !keepCardHidden) {
        inst.element.style.visibility = '';
    }
    PT_refreshWindowVisualState();
    var result = visualRect ? { left: visualRect.left, top: visualRect.top, width: visualRect.width, height: visualRect.height } : null;
    return result;
}

function PT_commitCinematicFinalRect(cardShell, rect) {
    if (!cardShell || !rect) return;
    cardShell.style.left = Math.round(rect.left) + 'px';
    cardShell.style.top = Math.round(rect.top) + 'px';
    cardShell.style.width = Math.round(rect.width) + 'px';
    cardShell.style.height = Math.round(rect.height) + 'px';
}

function PT_makeCenteredCinematicRect(centerX, centerY, width, height) {
    return {
        left: centerX - width / 2,
        top: centerY - height / 2,
        width: width,
        height: height
    };
}

function PT_makeCinematicRectFrame(rect, opacity, filter, boxShadow) {
    return {
        left: Math.round(rect.left) + 'px',
        top: Math.round(rect.top) + 'px',
        width: Math.round(rect.width) + 'px',
        height: Math.round(rect.height) + 'px',
        opacity: opacity,
        filter: filter,
        boxShadow: boxShadow
    };
}

function PT_makeCinematicTransformFrame(dx, dy, scaleX, scaleY, opacity, filter, boxShadow) {
    return {
        transform: 'translate(' + Math.round(dx) + 'px, ' + Math.round(dy) + 'px) scale(' + scaleX.toFixed(4) + ', ' + scaleY.toFixed(4) + ')',
        opacity: opacity,
        filter: filter,
        boxShadow: boxShadow
    };
}

function PT_runCinematicRectOpenFrames(instanceId, frames, duration, easing) {
    var state = window.PT_APP_STATE || {};
    var inst = state.instances[instanceId];
    var cardShell = inst ? inst.element : null;
    if (!inst || !cardShell || !frames || !frames.length) return false;

    PT_prepareCinematicScrollbars(inst, cardShell);
    var first = frames[0];
    cardShell.style.left = first.left;
    cardShell.style.top = first.top;
    cardShell.style.width = first.width;
    cardShell.style.height = first.height;
    cardShell.style.opacity = first.opacity;
    cardShell.style.filter = first.filter;
    cardShell.style.boxShadow = first.boxShadow || '';
    cardShell.style.visibility = '';
    cardShell.style.pointerEvents = 'none';
    cardShell.style.willChange = 'left, top, width, height, opacity, filter, box-shadow';

    inst.transitioning = true;
    inst._skipGlassMask = false;
    PT_markDockCinematicHit(inst);
    PT_refreshWindowVisualState();

    var transition = { animation: null, timer: null, type: 'cinematic-open-special', cancelled: false, done: false, maskRafId: 0 };
    inst._cinematicTransition = transition;

    function updateMaskLoop() {
        transition.maskRafId = requestAnimationFrame(updateMaskLoop);
        if (typeof window.PT_updateGlassMask === 'function') window.PT_updateGlassMask();
    }
    transition.maskRafId = requestAnimationFrame(updateMaskLoop);

    function finish() {
        if (transition.cancelled || transition.done) return;
        transition.done = true;
        if (transition.maskRafId) cancelAnimationFrame(transition.maskRafId);
        transition.maskRafId = 0;
        if (transition.timer) {
            clearTimeout(transition.timer);
            transition.timer = null;
        }
        PT_commitCinematicFinalRect(cardShell, {
            left: parseFloat(frames[frames.length - 1].left) || 0,
            top: parseFloat(frames[frames.length - 1].top) || 0,
            width: parseFloat(frames[frames.length - 1].width) || cardShell.offsetWidth,
            height: parseFloat(frames[frames.length - 1].height) || cardShell.offsetHeight
        });
        if (transition.animation) {
            var animation = transition.animation;
            transition.animation = null;
            animation.onfinish = null;
            animation.oncancel = null;
            if (typeof animation.cancel === 'function') animation.cancel();
        }
        PT_clearCinematicInlineStyles(cardShell);
        inst.transitioning = false;
        inst._skipGlassMask = false;
        inst.openOptions = null;
        if (inst._cinematicTransition === transition) {
            inst._cinematicTransition = null;
        }
        PT_restoreCinematicScrollbars(inst, cardShell);
        PT_refreshWindowVisualState();
        if (typeof window.PT_syncResizeHandle === 'function') window.PT_syncResizeHandle(instanceId);
    }

    if (typeof cardShell.animate === 'function') {
        try {
            var animation = cardShell.animate(frames, {
                duration: duration,
                easing: easing,
                fill: 'forwards'
            });
            transition.animation = animation;
            animation.onfinish = finish;
            animation.oncancel = function() {
                if (!transition.cancelled) finish();
            };
        } catch (e) {
            transition.timer = setTimeout(finish, duration);
        }
    } else {
        transition.timer = setTimeout(finish, duration);
    }
    return true;
}

function PT_runDockDragOpenTransition(instanceId) {
    var state = window.PT_APP_STATE || {};
    var inst = state.instances[instanceId];
    var cardShell = inst ? inst.element : null;
    var stage = document.getElementById('pt-desktop-stage');
    if (!inst || !cardShell || !stage) return false;
    var options = inst.openOptions || {};
    var origin = options.originPoint || null;
    if (!origin) return false;
    var stageRect = stage.getBoundingClientRect();
    var stagePaddingTop = parseFloat(getComputedStyle(stage).paddingTop) || 0;
    var endRect = {
        left: parseFloat(cardShell.style.left) || 0,
        top: parseFloat(cardShell.style.top) || 0,
        width: cardShell.offsetWidth,
        height: cardShell.offsetHeight
    };
    var originX = origin.clientX != null ? origin.clientX : origin.x;
    var originY = origin.clientY != null ? origin.clientY : origin.y;
    var centerX = originX - stageRect.left;
    var centerY = originY - stageRect.top - stagePaddingTop;
    var startRect = PT_makeCenteredCinematicRect(centerX, centerY, Math.max(72, endRect.width * 0.16), Math.max(54, endRect.height * 0.16));
    var midRect = PT_makeCenteredCinematicRect(centerX, centerY, endRect.width * 0.62, endRect.height * 0.62);
    var settleRect = PT_makeCenteredCinematicRect(endRect.left + endRect.width / 2, endRect.top + endRect.height / 2, endRect.width * 0.97, endRect.height * 0.97);
    var frames = [
        Object.assign({ offset: 0 }, PT_makeCinematicRectFrame(startRect, 0.92, 'brightness(1)', '')),
        Object.assign({ offset: 0.34 }, PT_makeCinematicRectFrame(midRect, 1, 'brightness(1)', '')),
        Object.assign({ offset: 0.78 }, PT_makeCinematicRectFrame(settleRect, 1, 'brightness(1)', '')),
        Object.assign({ offset: 1 }, PT_makeCinematicRectFrame(endRect, 1, 'brightness(1)', ''))
    ];
    return PT_runCinematicRectOpenFrames(instanceId, frames, 620, 'cubic-bezier(0.18, 0.92, 0.18, 1)');
}

function PT_runCopyCardTransition(instanceId) {
    var state = window.PT_APP_STATE || {};
    var inst = state.instances[instanceId];
    var cardShell = inst ? inst.element : null;
    var stage = document.getElementById('pt-desktop-stage');
    if (!inst || !cardShell || !stage) return false;
    var options = inst.openOptions || {};
    var source = options.sourceRect || null;
    if (!source) return false;
    var stageRect = stage.getBoundingClientRect();
    var stagePaddingTop = parseFloat(getComputedStyle(stage).paddingTop) || 0;
    var endRect = {
        left: parseFloat(cardShell.style.left) || 0,
        top: parseFloat(cardShell.style.top) || 0,
        width: cardShell.offsetWidth,
        height: cardShell.offsetHeight
    };
    var sourceCenterX = source.left + source.width / 2 - stageRect.left;
    var sourceCenterY = source.top + source.height / 2 - stageRect.top - stagePaddingTop;
    var startRect = PT_makeCenteredCinematicRect(sourceCenterX, sourceCenterY, endRect.width * 0.86, endRect.height * 0.86);
    var driftRect = PT_makeCenteredCinematicRect((sourceCenterX + endRect.left + endRect.width / 2) / 2, (sourceCenterY + endRect.top + endRect.height / 2) / 2 - 10, endRect.width * 0.95, endRect.height * 0.95);
    var frames = [
        Object.assign({ offset: 0 }, PT_makeCinematicRectFrame(startRect, 0.78, 'brightness(1)', '')),
        Object.assign({ offset: 0.46 }, PT_makeCinematicRectFrame(driftRect, 0.96, 'brightness(1)', '')),
        Object.assign({ offset: 1 }, PT_makeCinematicRectFrame(endRect, 1, 'brightness(1)', ''))
    ];
    return PT_runCinematicRectOpenFrames(instanceId, frames, 440, 'cubic-bezier(0.2, 0.86, 0.18, 1)');
}

function PT_runCinematicOpenTransition(instanceId) {
    var state = window.PT_APP_STATE || {};
    var inst = state.instances[instanceId];
    var cardShell = inst ? inst.element : null;
    var stage = document.getElementById('pt-desktop-stage');
    if (!inst || !cardShell || !stage) return false;
    if (inst.openOptions && inst.openOptions.type === 'dock-drag-burst') return PT_runDockDragOpenTransition(instanceId);
    if (inst.openOptions && inst.openOptions.type === 'copy-bloom') return PT_runCopyCardTransition(instanceId);

    var interruptedRect = PT_cancelCinematicTransition(inst, true);
    var stageRect = stage.getBoundingClientRect();
    var stagePaddingTop = parseFloat(getComputedStyle(stage).paddingTop) || 0;
    var dockRect = PT_getDockAnchorRect(inst);

    function vpToStage(vp) {
        return {
            left: vp.left - stageRect.left,
            top: vp.top - stageRect.top - stagePaddingTop,
            width: vp.width,
            height: vp.height
        };
    }

    var endRect = {
        left: parseFloat(cardShell.style.left) || 0,
        top: parseFloat(cardShell.style.top) || 0,
        width: cardShell.offsetWidth,
        height: cardShell.offsetHeight
    };

    var startRect;
    if (interruptedRect) {
        startRect = vpToStage(interruptedRect);
    } else if (dockRect) {
        startRect = vpToStage(dockRect);
    } else {
        startRect = {
            left: endRect.left + endRect.width / 2 - 56,
            top: endRect.top + endRect.height / 2 - 40,
            width: 112,
            height: 80
        };
    }

    PT_prepareCinematicScrollbars(inst, cardShell);
    cardShell.style.left = startRect.left + 'px';
    cardShell.style.top = startRect.top + 'px';
    cardShell.style.width = startRect.width + 'px';
    cardShell.style.height = startRect.height + 'px';
    cardShell.style.opacity = '1';
    cardShell.style.pointerEvents = 'none';
    cardShell.style.willChange = 'left, top, width, height, box-shadow, filter';

    inst.transitioning = true;
    inst._targetMinimized = false;
    inst._skipGlassMask = false;
    PT_markDockCinematicHit(inst);
    PT_refreshWindowVisualState();

    var transition = { animation: null, timer: null, type: 'cinematic-open', cancelled: false, done: false, maskRafId: 0 };
    inst._cinematicTransition = transition;

    var maskRafId = 0;
    function updateMaskLoop() {
        maskRafId = requestAnimationFrame(updateMaskLoop);
        transition.maskRafId = maskRafId;
        if (typeof window.PT_updateGlassMask === 'function') window.PT_updateGlassMask();
    }
    maskRafId = requestAnimationFrame(updateMaskLoop);
    transition.maskRafId = maskRafId;

    function finish() {
        if (transition.cancelled || transition.done) return;
        transition.done = true;
        if (maskRafId) cancelAnimationFrame(maskRafId);
        transition.maskRafId = 0;
        if (transition.timer) {
            clearTimeout(transition.timer);
            transition.timer = null;
        }
        if (transition.animation) {
            var animation = transition.animation;
            transition.animation = null;
            animation.onfinish = null;
            animation.oncancel = null;
            cardShell.style.boxShadow = '';
            PT_commitCinematicFinalRect(cardShell, endRect);
            if (typeof animation.cancel === 'function') animation.cancel();
        } else {
            PT_commitCinematicFinalRect(cardShell, endRect);
        }
        PT_clearCinematicInlineStyles(cardShell);
        inst.transitioning = false;
        inst._targetMinimized = null;
        inst._skipGlassMask = false;
        if (inst._cinematicTransition === transition) {
            inst._cinematicTransition = null;
        }
        PT_restoreCinematicScrollbars(inst, cardShell);
        PT_refreshWindowVisualState();
        if (typeof window.PT_syncResizeHandle === 'function') window.PT_syncResizeHandle(instanceId);
    }

    var endCenterX = endRect.left + endRect.width / 2;
    var endCenterY = endRect.top + endRect.height / 2;
    var startCenterX = startRect.left + startRect.width / 2;
    var startCenterY = startRect.top + startRect.height / 2;
    var openMidRect = PT_makeCenteredCinematicRect(endCenterX, endCenterY, Math.max(1, endRect.width * 0.5), Math.max(1, endRect.height * 0.5));
    var openTravelRect = PT_makeCenteredCinematicRect(
        startCenterX * 0.45 + endCenterX * 0.55,
        startCenterY * 0.45 + endCenterY * 0.55 - 12,
        startRect.width * 0.58 + openMidRect.width * 0.42,
        startRect.height * 0.58 + openMidRect.height * 0.42
    );
    var openGrowRect = PT_makeCenteredCinematicRect(endCenterX, endCenterY, endRect.width * 0.76, endRect.height * 0.76);
    var openSettleRect = PT_makeCenteredCinematicRect(endCenterX, endCenterY, endRect.width * 0.955, endRect.height * 0.955);
    var frames = [
        Object.assign({ offset: 0 }, PT_makeCinematicRectFrame(startRect, 0.10, '', '')),
        Object.assign({ offset: 0.26 }, PT_makeCinematicRectFrame(openTravelRect, 0.48, '', '')),
        Object.assign({ offset: 0.72 }, PT_makeCinematicRectFrame(openMidRect, 0.72, '', '')),
        Object.assign({ offset: 0.84 }, PT_makeCinematicRectFrame(openGrowRect, 0.94, '', '')),
        Object.assign({ offset: 0.96 }, PT_makeCinematicRectFrame(openSettleRect, 1, '', '')),
        Object.assign({ offset: 1 }, PT_makeCinematicRectFrame(endRect, 1, '', ''))
    ];

    if (typeof cardShell.animate === 'function') {
        try {
            var animation = cardShell.animate(frames, {
                duration: PT_CINEMATIC_OPEN_DURATION,
                easing: 'cubic-bezier(0.22, 0.78, 0.18, 1)',
                fill: 'forwards'
            });
            transition.animation = animation;
            animation.onfinish = finish;
            animation.oncancel = function() {
                if (!transition.cancelled) finish();
            };
        } catch (e) {
            transition.timer = setTimeout(finish, PT_CINEMATIC_OPEN_DURATION);
        }
    } else {
        transition.timer = setTimeout(finish, PT_CINEMATIC_OPEN_DURATION);
    }
    return true;
}

function PT_runCinematicCloseTransition(instanceId, onDone) {
    var state = window.PT_APP_STATE || {};
    var inst = state.instances[instanceId];
    var cardShell = inst ? inst.element : null;
    var stage = document.getElementById('pt-desktop-stage');
    if (!inst || !cardShell || !stage) {
        if (typeof onDone === 'function') onDone();
        return false;
    }

    var interruptedRect = PT_cancelCinematicTransition(inst, true);
    var stageRect = stage.getBoundingClientRect();
    var stagePaddingTop = parseFloat(getComputedStyle(stage).paddingTop) || 0;
    var dockRect = PT_getDockAnchorRect(inst);
    var cardRect = interruptedRect || cardShell.getBoundingClientRect();
    var endRect = dockRect || {
        left: cardRect.left + cardRect.width / 2 - 34,
        top: cardRect.top + cardRect.height / 2 - 24,
        width: 68,
        height: 48
    };

    function vpToStage(vp) {
        return {
            left: vp.left - stageRect.left,
            top: vp.top - stageRect.top - stagePaddingTop,
            width: vp.width,
            height: vp.height
        };
    }

    var startRect = vpToStage(cardRect);
    var targetRect = vpToStage(endRect);
    var startCenterX = startRect.left + startRect.width / 2;
    var startCenterY = startRect.top + startRect.height / 2;
    var endCenterX = targetRect.left + targetRect.width / 2;
    var endCenterY = targetRect.top + targetRect.height / 2;
    var closeMidRect = PT_makeCenteredCinematicRect(startCenterX, startCenterY, Math.max(1, startRect.width * 0.5), Math.max(1, startRect.height * 0.5));
    var endDx = endCenterX - startCenterX;
    var endDy = endCenterY - startCenterY;
    var endScaleX = Math.max(0.01, targetRect.width / Math.max(startRect.width, 1));
    var endScaleY = Math.max(0.01, targetRect.height / Math.max(startRect.height, 1));
    var travelScaleX = closeMidRect.width * 0.54 / Math.max(startRect.width, 1) + endScaleX * 0.46;
    var travelScaleY = closeMidRect.height * 0.54 / Math.max(startRect.height, 1) + endScaleY * 0.46;

    PT_prepareCinematicScrollbars(inst, cardShell);
    cardShell.style.left = startRect.left + 'px';
    cardShell.style.top = startRect.top + 'px';
    cardShell.style.width = startRect.width + 'px';
    cardShell.style.height = startRect.height + 'px';
    cardShell.style.visibility = '';
    cardShell.style.pointerEvents = 'none';
    cardShell.style.transformOrigin = '50% 50%';
    cardShell.style.willChange = 'transform, opacity, filter, box-shadow';

    inst.transitioning = true;
    inst._closing = true;
    inst._skipGlassMask = true;
    PT_markDockCinematicHit(inst);
    PT_refreshWindowVisualState();

    var transition = { animation: null, timer: null, type: 'cinematic-close', cancelled: false, done: false, maskRafId: 0 };
    inst._cinematicTransition = transition;

    var maskRafId = 0;
    function updateMaskLoop() {
        maskRafId = requestAnimationFrame(updateMaskLoop);
        transition.maskRafId = maskRafId;
        if (typeof window.PT_updateGlassMask === 'function') window.PT_updateGlassMask();
    }
    maskRafId = requestAnimationFrame(updateMaskLoop);
    transition.maskRafId = maskRafId;

    function finish() {
        if (transition.cancelled || transition.done) return;
        transition.done = true;
        if (maskRafId) cancelAnimationFrame(maskRafId);
        transition.maskRafId = 0;
        if (transition.timer) {
            clearTimeout(transition.timer);
            transition.timer = null;
        }
        if (transition.animation) {
            var animation = transition.animation;
            transition.animation = null;
            animation.onfinish = null;
            animation.oncancel = null;
            if (typeof animation.cancel === 'function') animation.cancel();
        }
        PT_clearCinematicInlineStyles(cardShell);
        PT_restoreCinematicScrollbars(inst, cardShell);
        inst.transitioning = false;
        inst._closing = false;
        inst._skipGlassMask = false;
        if (inst._cinematicTransition === transition) {
            inst._cinematicTransition = null;
        }
        if (typeof onDone === 'function') onDone();
    }

    var frames = [
        Object.assign({ offset: 0 }, PT_makeCinematicTransformFrame(0, 0, 1, 1, 1, 'brightness(1)', '')),
        Object.assign({ offset: 0.36 }, PT_makeCinematicTransformFrame(0, 0, 0.5, 0.5, 1, 'brightness(1.10)', '0 0 28px rgba(120, 220, 255, 0.18), 0 0 58px rgba(120, 150, 255, 0.12)')),
        Object.assign({ offset: 0.70 }, PT_makeCinematicTransformFrame(endDx * 0.58, endDy * 0.58 - 12, travelScaleX, travelScaleY, 0.82, 'brightness(1.20)', '0 0 30px rgba(120, 220, 255, 0.20), 0 0 62px rgba(120, 150, 255, 0.14)')),
        Object.assign({ offset: 1 }, PT_makeCinematicTransformFrame(endDx, endDy, endScaleX, endScaleY, 0.16, 'brightness(1.28)', ''))
    ];

    if (typeof cardShell.animate === 'function') {
        try {
            var animation = cardShell.animate(frames, {
                duration: PT_CINEMATIC_CLOSE_DURATION,
                easing: 'cubic-bezier(0.2, 0.86, 0.18, 1)',
                fill: 'forwards'
            });
            transition.animation = animation;
            animation.onfinish = finish;
            animation.oncancel = function() {
                if (!transition.cancelled) finish();
            };
        } catch (e) {
            transition.timer = setTimeout(finish, PT_CINEMATIC_CLOSE_DURATION);
        }
    } else {
        transition.timer = setTimeout(finish, PT_CINEMATIC_CLOSE_DURATION);
    }
    return true;
}

function PT_flyCard(instanceId, animClass, skipSave) {
    var state = window.PT_APP_STATE || {};
    var inst = state.instances[instanceId];
    if (!inst || !inst.element) return;
    if (inst.flownAway) return;

    var cardShell = inst.element;
    if (!skipSave && !inst.transitioning) PT_saveCardPosition(inst);

    if (inst._flyTimer) {
        clearTimeout(inst._flyTimer);
        inst._flyTimer = null;
    }

    function doFly() {
        cardShell.classList.remove('pt-desktop-card--slide-down');
        cardShell.style.left = '-9999px';
        cardShell.style.top = '-9999px';
        cardShell.style.pointerEvents = 'none';
        inst.flownAway = true;
        inst._flyTimer = null;
        PT_refreshWindowVisualState();
        requestAnimationFrame(PT_refreshWindowVisualState);
    }

    if (animClass) {
        cardShell.classList.add(animClass);
        inst._flyTimer = setTimeout(doFly, 150);
    } else {
        doFly();
    }
}

function PT_landCard(instanceId) {
    var state = window.PT_APP_STATE || {};
    var inst = state.instances[instanceId];
    if (!inst || !inst.element) return;
    if (!inst.flownAway && !inst._flyTimer) return;

    var cardShell = inst.element;

    if (inst._flyTimer) {
        clearTimeout(inst._flyTimer);
        inst._flyTimer = null;
        cardShell.classList.remove('pt-desktop-card--slide-down');
    }

    cardShell.style.left = inst.originalLeft || '';
    cardShell.style.top = inst.originalTop || '';
    cardShell.style.width = inst.originalWidth || '';
    cardShell.style.height = inst.originalHeight || '';
    cardShell.style.pointerEvents = '';
    cardShell.style.opacity = '';
    cardShell.style.visibility = '';
    inst.flownAway = false;
    inst.minimized = false;

    var body = cardShell.querySelector('.pt-window-card__body');
    if (body) { body.style.display = ''; }

    PT_refreshWindowVisualState();
}

function PT_runCinematicCardTransition(instanceId, type, onDone) {
    var state = window.PT_APP_STATE || {};
    var inst = state.instances[instanceId];
    var cardShell = inst ? inst.element : null;
    var stage = document.getElementById('pt-desktop-stage');
    if (!inst || !cardShell || !stage) {
        if (typeof onDone === 'function') onDone();
        return false;
    }

    var interruptedRect = PT_cancelCinematicTransition(inst, true);
    var dockRect = PT_getDockAnchorRect(inst);
    if (!dockRect) {
        cardShell.style.visibility = '';
        if (typeof onDone === 'function') onDone();
        return false;
    }

    var stageRect = stage.getBoundingClientRect();

    var stagePaddingTop = parseFloat(getComputedStyle(stage).paddingTop) || 0;

    function vpToStage(vp) {
        return {
            left: vp.left - stageRect.left,
            top: vp.top - stageRect.top - stagePaddingTop,
            width: vp.width,
            height: vp.height
        };
    }

    var dockStage = vpToStage(dockRect);
    var startRect, endRect, startOpacity, endOpacity, midTopOffset, f0B, f1B, f2B, frames;

    if (type === 'cinematic-minimize') {
        var curLeft = parseFloat(cardShell.style.left) || 0;
        var curTop = parseFloat(cardShell.style.top) || 0;
        var curW = cardShell.offsetWidth;
        var curH = cardShell.offsetHeight;
        startRect = interruptedRect ? vpToStage(interruptedRect) : { left: curLeft, top: curTop, width: curW, height: curH };
        endRect = dockStage;
        startOpacity = interruptedRect ? 0.72 : 1;
        endOpacity = 0.08;
        midTopOffset = -12;
        f0B = interruptedRect ? 'brightness(1.18)' : 'brightness(1)';
        f1B = 'brightness(1.18)';
        f2B = 'brightness(1.35)';
    } else if (type === 'cinematic-restore') {
        startRect = interruptedRect ? vpToStage(interruptedRect) : dockStage;
        var tLeft = parseFloat(inst.originalLeft) || 0;
        var tTop = parseFloat(inst.originalTop) || 0;
        var tW = parseFloat(inst.originalWidth) || cardShell.offsetWidth;
        var tH = parseFloat(inst.originalHeight) || cardShell.offsetHeight;
        endRect = { left: tLeft, top: tTop, width: tW, height: tH };
        startOpacity = interruptedRect ? 0.72 : 0.08;
        endOpacity = 1;
        midTopOffset = interruptedRect ? 0 : -12;
        f0B = interruptedRect ? 'brightness(1.18)' : 'brightness(1.35)';
        f1B = 'brightness(1.18)';
        f2B = 'brightness(1)';
    } else {
        cardShell.style.visibility = '';
        if (typeof onDone === 'function') onDone();
        return false;
    }

    PT_prepareCinematicScrollbars(inst, cardShell);
    cardShell.style.left = startRect.left + 'px';
    cardShell.style.top = startRect.top + 'px';
    cardShell.style.width = startRect.width + 'px';
    cardShell.style.height = startRect.height + 'px';
    cardShell.style.visibility = '';
    cardShell.style.pointerEvents = 'none';

    if (type === 'cinematic-minimize') {
        var startCenterX = startRect.left + startRect.width / 2;
        var startCenterY = startRect.top + startRect.height / 2;
        var endCenterX = endRect.left + endRect.width / 2;
        var endCenterY = endRect.top + endRect.height / 2;
        var endDx = endCenterX - startCenterX;
        var endDy = endCenterY - startCenterY;
        var endScaleX = Math.max(0.01, endRect.width / Math.max(startRect.width, 1));
        var endScaleY = Math.max(0.01, endRect.height / Math.max(startRect.height, 1));
        var midScaleX = 0.5;
        var midScaleY = 0.5;
        var travelScaleX = midScaleX * 0.54 + endScaleX * 0.46;
        var travelScaleY = midScaleY * 0.54 + endScaleY * 0.46;
        cardShell.style.transformOrigin = '50% 50%';
        cardShell.style.willChange = 'transform, opacity, filter';
        frames = [
            Object.assign({ offset: 0 }, PT_makeCinematicTransformFrame(0, 0, 1, 1, startOpacity, f0B, '')),
            Object.assign({ offset: 0.36 }, PT_makeCinematicTransformFrame(0, 0, midScaleX, midScaleY, 0.86, f1B, '')),
            Object.assign({ offset: 0.70 }, PT_makeCinematicTransformFrame(endDx * 0.58, endDy * 0.58 + midTopOffset, travelScaleX, travelScaleY, 0.42, f1B, '')),
            Object.assign({ offset: 1 }, PT_makeCinematicTransformFrame(endDx, endDy, endScaleX, endScaleY, endOpacity, f2B, ''))
        ];
    } else if (type === 'cinematic-restore') {
        var midLeft = (startRect.left + endRect.left) / 2;
        var midTop = (startRect.top + endRect.top) / 2 + midTopOffset;
        var midW = (startRect.width + endRect.width) / 2;
        var midH = (startRect.height + endRect.height) / 2;
        var midOpacity = (startOpacity + endOpacity) / 2;
        cardShell.style.willChange = 'left, top, width, height, opacity, filter';
        frames = [
            Object.assign({ offset: 0 }, PT_makeCinematicRectFrame(startRect, startOpacity, f0B, '')),
            Object.assign({ offset: 0.5 }, PT_makeCinematicRectFrame({ left: midLeft, top: midTop, width: midW, height: midH }, midOpacity, f1B, '')),
            Object.assign({ offset: 1 }, PT_makeCinematicRectFrame(endRect, endOpacity, f2B, ''))
        ];
    }

    inst.transitioning = true;
    inst._targetMinimized = type === 'cinematic-minimize';
    PT_markDockCinematicHit(inst);
    PT_refreshWindowVisualState();

    var transition = { animation: null, timer: null, type: type, cancelled: false, done: false, maskRafId: 0 };
    inst._cinematicTransition = transition;

    var maskRafId = 0;
    function updateMaskLoop() {
        maskRafId = requestAnimationFrame(updateMaskLoop);
        transition.maskRafId = maskRafId;
        if (typeof window.PT_updateGlassMask === 'function') window.PT_updateGlassMask();
    }
    maskRafId = requestAnimationFrame(updateMaskLoop);
    transition.maskRafId = maskRafId;

    function finish() {
        if (transition.cancelled || transition.done) return;
        transition.done = true;
        if (maskRafId) cancelAnimationFrame(maskRafId);
        transition.maskRafId = 0;
        if (transition.timer) {
            clearTimeout(transition.timer);
            transition.timer = null;
        }
        if (transition.animation) {
            var animation = transition.animation;
            transition.animation = null;
            animation.onfinish = null;
            animation.oncancel = null;
            if (type === 'cinematic-minimize') {
                var finalTransform = frames[frames.length - 1].transform || '';
                cardShell.style.transform = finalTransform;
                cardShell.style.opacity = String(endOpacity);
            } else {
                PT_commitCinematicFinalRect(cardShell, endRect);
                cardShell.style.opacity = '';
            }
            if (typeof animation.cancel === 'function') animation.cancel();
        } else {
            if (type === 'cinematic-minimize') {
                cardShell.style.transform = frames[frames.length - 1].transform || '';
                cardShell.style.opacity = String(endOpacity);
            } else {
                PT_commitCinematicFinalRect(cardShell, endRect);
                cardShell.style.opacity = '';
            }
        }
        cardShell.style.pointerEvents = '';
        cardShell.style.filter = '';
        PT_restoreCinematicScrollbars(inst, cardShell);
        inst.transitioning = false;
        if (inst._cinematicTransition === transition) {
            inst._cinematicTransition = null;
        }
        if (typeof onDone === 'function') onDone();
        if (type === 'cinematic-minimize') {
            cardShell.style.transform = '';
        }
        PT_refreshWindowVisualState();
    }

    if (typeof cardShell.animate === 'function') {
        try {
            var animation = cardShell.animate(frames, {
                duration: PT_CINEMATIC_CARD_DURATION,
                easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
                fill: 'forwards'
            });
            transition.animation = animation;
            animation.onfinish = finish;
            animation.oncancel = function() {
                if (!transition.cancelled) finish();
            };
        } catch (e) {
            transition.timer = setTimeout(finish, PT_CINEMATIC_CARD_DURATION);
        }
    } else {
        transition.timer = setTimeout(finish, PT_CINEMATIC_CARD_DURATION);
    }
    return true;
}

function PT_minimizeCard(instanceId) {
    var state = window.PT_APP_STATE || {};
    var inst = state.instances[instanceId];
    if (!inst || !inst.element) return;
    if (inst._closing) return;

    var shouldRestore = inst.minimized || inst._targetMinimized === true;
    inst._previewBlocked = true;
    var previewBar = document.getElementById('pt-dock-preview-bar');
    if (previewBar) {
        previewBar.classList.remove('pt-dock-preview-bar--visible');
        previewBar.innerHTML = '';
    }
    if (window.__PT_hoverTimer) clearTimeout(window.__PT_hoverTimer);

    if (shouldRestore) {
        PT_clearMagnetRevealTimer(inst);
        inst._magnetLinksHidden = true;
        PT_landCard(instanceId);
        inst.minimized = false;
        inst._targetMinimized = false;
        PT_bringToFront(inst.element, instanceId);
        if (PT_runCinematicCardTransition(instanceId, 'cinematic-restore', function() {
            PT_clearMagnetRevealTimer(inst);
            inst._targetMinimized = null;
            inst.minimized = false;
            inst.flownAway = false;
            inst._magnetLinksHidden = false;
            window.PT_syncResizeHandle(instanceId);
            if (typeof window.PT_updateGlassMask === 'function') window.PT_updateGlassMask();
            if (typeof PT_renderMagnetLinks === 'function') PT_renderMagnetLinks();
        })) {

        } else {
            inst.element.style.visibility = '';
            inst._targetMinimized = null;
            inst._magnetLinksHidden = false;
            if (typeof window.PT_updateGlassMask === 'function') window.PT_updateGlassMask();
            if (typeof PT_renderMagnetLinks === 'function') PT_renderMagnetLinks();
        }
        return;
    } else {
        PT_clearMagnetRevealTimer(inst);
        inst._magnetLinksHidden = true;
        var oldLinks = (window.PT_magnetLinks || []).filter(function(link) {
            return link.a === instanceId || link.b === instanceId;
        });
        var stageEl = document.getElementById('pt-desktop-stage');
        var stageRectMin = stageEl ? stageEl.getBoundingClientRect() : null;
        var minRect = stageRectMin ? PT_getStageCardRect(inst.element, stageRectMin) : null;
        PT_removeMagnetLinksFor(instanceId);
        if (oldLinks.length >= 2 && stageRectMin) {
            setTimeout(function() {
                PT_closeGapAfterMinimize(instanceId, oldLinks, minRect, stageRectMin);
            }, Math.round(PT_CINEMATIC_CARD_DURATION * 0.5));
        }
        inst._targetMinimized = true;
        if (!inst.transitioning) {
            PT_saveCardPosition(inst);
        }
        if (!PT_runCinematicCardTransition(instanceId, 'cinematic-minimize', function() {
            PT_flyCard(instanceId, null, true);
            inst.minimized = true;
            inst._targetMinimized = null;
        })) {
            inst._targetMinimized = null;
            PT_flyCard(instanceId);
            inst.minimized = true;
        }
        return;
    }
}

function PT_copyCard(instanceId) {
    var state = window.PT_APP_STATE || {};
    var inst = state.instances[instanceId];
    if (!inst) return;
    if (inst._closing) return;
    var card = inst.element;
    var stage = document.getElementById('pt-desktop-stage');
    var stageRect = stage ? stage.getBoundingClientRect() : null;
    var cardRect = card.getBoundingClientRect();
    var newLeft = cardRect.left - (stageRect ? stageRect.left : 0) + cardRect.width;
    var newTop = cardRect.top - (stageRect ? stageRect.top : 0);
    var copiedInstanceId = window.PT_openToolCard(inst.toolId, { left: Math.round(newLeft), top: Math.round(newTop) }, null, {
        type: 'copy-bloom',
        sourceRect: {
            left: cardRect.left,
            top: cardRect.top,
            width: cardRect.width,
            height: cardRect.height
        }
    });
    if (copiedInstanceId && state.instances && state.instances[copiedInstanceId]) {
        PT_cloneCopiedCardContent(inst, state.instances[copiedInstanceId]);
    }
}

function PT_getCopyContentRoot(cardShell) {
    if (!cardShell) return null;
    return cardShell.querySelector('.pt-window-card__body') || cardShell.querySelector('.pt-desktop-card__body');
}

function PT_collectCopiedCardContentState(contentRoot) {
    var state = {
        controls: [],
        details: [],
        editables: [],
        scrolls: []
    };
    if (!contentRoot) return state;

    contentRoot.querySelectorAll('input, textarea, select').forEach(function(control) {
        var item = {
            tagName: control.tagName,
            type: control.type || '',
            value: control.value,
            checked: !!control.checked,
            selectedIndex: typeof control.selectedIndex === 'number' ? control.selectedIndex : -1,
            selectedValues: []
        };
        if (control.tagName === 'SELECT') {
            Array.prototype.forEach.call(control.options || [], function(option) {
                if (option.selected) item.selectedValues.push(option.value);
            });
        }
        state.controls.push(item);
    });

    contentRoot.querySelectorAll('details').forEach(function(detailsEl) {
        state.details.push(!!detailsEl.open);
    });

    contentRoot.querySelectorAll('[contenteditable]').forEach(function(editableEl) {
        state.editables.push(editableEl.innerHTML);
    });

    [contentRoot].concat(Array.prototype.slice.call(contentRoot.querySelectorAll('*'))).forEach(function(scrollEl) {
        state.scrolls.push({
            top: scrollEl.scrollTop || 0,
            left: scrollEl.scrollLeft || 0
        });
    });

    return state;
}

function PT_applyCopiedCardContentState(contentRoot, copiedState) {
    if (!contentRoot || !copiedState) return;

    contentRoot.querySelectorAll('input, textarea, select').forEach(function(control, index) {
        var item = copiedState.controls[index];
        if (!item) return;
        if (control.tagName === 'SELECT') {
            if (control.multiple) {
                Array.prototype.forEach.call(control.options || [], function(option) {
                    option.selected = item.selectedValues.indexOf(option.value) !== -1;
                });
            } else {
                control.value = item.value;
                if (control.value !== item.value && item.selectedIndex >= 0) {
                    control.selectedIndex = item.selectedIndex;
                }
            }
            return;
        }
        if (control.type === 'checkbox' || control.type === 'radio') {
            control.checked = item.checked;
        }
        if (control.type !== 'file') {
            control.value = item.value;
        }
    });

    contentRoot.querySelectorAll('details').forEach(function(detailsEl, index) {
        if (index >= copiedState.details.length) return;
        detailsEl.open = copiedState.details[index];
    });

    contentRoot.querySelectorAll('[contenteditable]').forEach(function(editableEl, index) {
        if (typeof copiedState.editables[index] === 'undefined') return;
        editableEl.innerHTML = copiedState.editables[index];
    });

    [contentRoot].concat(Array.prototype.slice.call(contentRoot.querySelectorAll('*'))).forEach(function(scrollEl, index) {
        var item = copiedState.scrolls[index];
        if (!item) return;
        scrollEl.scrollTop = item.top;
        scrollEl.scrollLeft = item.left;
    });
}

function PT_syncCopiedCardContentRootState(sourceRoot, targetRoot) {
    if (!sourceRoot || !targetRoot) return;
    targetRoot.className = sourceRoot.className;
    Array.prototype.forEach.call(sourceRoot.attributes || [], function(attr) {
        if (attr && attr.name && attr.name.indexOf('data-') === 0) {
            targetRoot.setAttribute(attr.name, attr.value);
        }
    });
}

function PT_prepareCopiedInteractiveContent(targetRoot) {
    if (!targetRoot) return;
    targetRoot.querySelectorAll('.pt-custom-select').forEach(function(wrapper) {
        var nativeSelect = wrapper.querySelector('select.pt-select');
        if (nativeSelect && wrapper.parentNode) {
            wrapper.parentNode.insertBefore(nativeSelect, wrapper);
            wrapper.parentNode.removeChild(wrapper);
        }
    });
    targetRoot.querySelectorAll('[data-pt-setting-bound], [data-pt-paldex-appearance-bound], [data-pt-file-bound]').forEach(function(el) {
        el.removeAttribute('data-pt-setting-bound');
        el.removeAttribute('data-pt-paldex-appearance-bound');
        el.removeAttribute('data-pt-file-bound');
    });
    targetRoot.querySelectorAll('.pt-scrollbar').forEach(function(bar) {
        if (bar.parentNode) bar.parentNode.removeChild(bar);
    });
    [targetRoot].concat(Array.prototype.slice.call(targetRoot.querySelectorAll('[data-pt-custom-scrollbar]'))).forEach(function(scrollEl) {
        if (!scrollEl || !scrollEl.removeAttribute) return;
        scrollEl.removeAttribute('data-pt-custom-scrollbar');
        scrollEl._ptCustomScrollbarState = null;
    });
}

function PT_refreshCopiedThemePicker(targetRoot) {
    if (!targetRoot || !targetRoot.querySelector('#pt-theme-editor')) return;
    var picker = window.PT_PICKER_PANEL || null;
    if (!picker || typeof picker.setActiveStop !== 'function') return;
    var activeRow = targetRoot.querySelector('.pt-color-stop-row--active');
    var index = activeRow ? parseInt(activeRow.getAttribute('data-stop') || '0', 10) : 0;
    if (!isFinite(index)) index = 0;
    picker.setActiveStop(targetRoot, index);
    if (typeof picker.syncPickerSwatches === 'function') {
        picker.syncPickerSwatches(targetRoot);
    }
}

function PT_refreshCopiedInteractiveContent(targetInst, targetRoot, copiedState) {
    if (!targetRoot) return;
    PT_refreshCopiedThemePicker(targetRoot);
    if (targetInst && targetInst.element && window.PT_initCustomScrollbars) {
        window.PT_initCustomScrollbars(targetInst.element);
    }
    PT_applyCopiedCardContentState(targetRoot, copiedState);
    if (targetInst && targetInst.instanceId && window.PT_syncResizeHandle) {
        window.PT_syncResizeHandle(targetInst.instanceId);
    }
}

function PT_rebindCopiedCardContent(targetInst) {
    var tools = window.PT_DOCK_TOOLS || {};
    var toolMeta = targetInst && targetInst.toolId ? tools[targetInst.toolId] : null;
    var displayModule = toolMeta && toolMeta.displayModule ? (window[toolMeta.displayModule] || null) : null;
    var cardBody = targetInst && targetInst.element ? targetInst.element.querySelector('.pt-desktop-card__body') : null;
    if (displayModule && typeof displayModule.bind === 'function' && cardBody) {
        displayModule.bind(cardBody);
    }
    if (targetInst && targetInst.element && window.PT_initCustomScrollbars) {
        window.PT_initCustomScrollbars(targetInst.element);
    }
    if (targetInst && targetInst.instanceId && window.PT_syncResizeHandle) {
        window.PT_syncResizeHandle(targetInst.instanceId);
    }
}

function PT_cloneCopiedCardContent(sourceInst, targetInst) {
    if (!sourceInst || !sourceInst.element || !targetInst || !targetInst.element) return;

    var sourceRoot = PT_getCopyContentRoot(sourceInst.element);
    var targetRoot = PT_getCopyContentRoot(targetInst.element);
    if (!sourceRoot || !targetRoot) return;

    var copiedState = PT_collectCopiedCardContentState(sourceRoot);
    targetRoot.innerHTML = sourceRoot.innerHTML;
    PT_prepareCopiedInteractiveContent(targetRoot);
    PT_syncCopiedCardContentRootState(sourceRoot, targetRoot);
    PT_applyCopiedCardContentState(targetRoot, copiedState);
    PT_rebindCopiedCardContent(targetInst);
    PT_refreshCopiedInteractiveContent(targetInst, targetRoot, copiedState);
    PT_syncCopiedCardContentRootState(sourceRoot, targetRoot);
    PT_applyCopiedCardContentState(targetRoot, copiedState);
    setTimeout(function() {
        PT_syncCopiedCardContentRootState(sourceRoot, targetRoot);
        PT_refreshCopiedInteractiveContent(targetInst, targetRoot, copiedState);
    }, 0);
    if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(function() {
            PT_syncCopiedCardContentRootState(sourceRoot, targetRoot);
            PT_refreshCopiedInteractiveContent(targetInst, targetRoot, copiedState);
        });
    }
}

function PT_findActionButton(target) {
    var el = target;
    while (el && el !== document) {
        if (el.hasAttribute && el.hasAttribute('data-action')) return el;
        el = el.parentElement;
    }
    return null;
}

function PT_isFormElement(target) {
    var el = target;
    while (el && el !== document) {
        if (el.nodeType !== 1) { el = el.parentElement; continue; }
        var tag = el.tagName;
        if (tag === 'BUTTON' || tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || tag === 'LABEL') return true;
        el = el.parentElement;
    }
    return false;
}

function PT_enableCardResize(cardShell, handle) {
    if (!cardShell || !handle) return;

    handle.addEventListener('mousedown', function(e) {
        e.stopPropagation();
        e.preventDefault();

        var startX = e.clientX;
        var startY = e.clientY;
        var startWidth = cardShell.offsetWidth;
        var startHeight = cardShell.offsetHeight;

        function onMouseMove(me) {
            var w = Math.max(100, startWidth + me.clientX - startX);
            var h = Math.max(100, startHeight + me.clientY - startY);
            cardShell.style.width = w + 'px';
            cardShell.style.height = h + 'px';
            if (typeof window.PT_updateGlassMask === 'function') window.PT_updateGlassMask();
            var iid = cardShell.getAttribute('data-instance-id');
            if (iid && typeof window.PT_syncResizeHandle === 'function') window.PT_syncResizeHandle(iid);
            if (iid && typeof PT_normalizeMagnetLayout === 'function') PT_normalizeMagnetLayout(iid);
            if (typeof PT_renderMagnetLinks === 'function') PT_renderMagnetLinks();
        }

        function onMouseUp() {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            var iid = cardShell.getAttribute('data-instance-id');
            var state = window.PT_APP_STATE || {};
            var inst = iid ? state.instances[iid] : null;
            if (inst) PT_saveCardPosition(inst);
            if (iid && typeof PT_saveMagnetGroupPositions === 'function') PT_saveMagnetGroupPositions(iid);
            if (iid && typeof PT_scheduleMagnetNormalize === 'function') PT_scheduleMagnetNormalize(iid);
            if (window.PT_initCustomScrollbars) window.PT_initCustomScrollbars(cardShell);
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
}

window.PT_syncResizeHandle = function PT_syncResizeHandle(instanceId) {
    var handle = document.querySelector('.pt-resize-handle[data-for-instance="' + instanceId + '"]');
    var state = window.PT_APP_STATE || {};
    var inst = state.instances[instanceId];
    if (!handle || !inst || !inst.element) return;
    var card = inst.element;
    var stage = document.getElementById('pt-desktop-stage');
    if (!stage) return;
    var cr = card.getBoundingClientRect();
    var sr = stage.getBoundingClientRect();
    handle.style.left = (cr.right - sr.left - 18) + 'px';
    handle.style.top = (cr.bottom - sr.top - 18) + 'px';
    handle.style.width = '18px';
    handle.style.height = '18px';
    handle.style.zIndex = card.style.zIndex;
};

window.PT_magnetLinks = window.PT_magnetLinks || [];

function PT_getStageCardRect(cardShell, stageRect) {
    var rect = cardShell.getBoundingClientRect();
    return {
        id: cardShell.getAttribute('data-instance-id'),
        left: rect.left - stageRect.left,
        top: rect.top - stageRect.top,
        right: rect.right - stageRect.left,
        bottom: rect.bottom - stageRect.top,
        width: rect.width,
        height: rect.height,
        element: cardShell
    };
}

function PT_magnetOverlap(a1, a2, b1, b2) {
    return Math.max(0, Math.min(a2, b2) - Math.max(a1, b1));
}

function PT_getMagnetGroup(instanceId) {
    var links = window.PT_magnetLinks || [];
    var seen = {};
    var queue = [instanceId];
    seen[instanceId] = true;
    for (var i = 0; i < queue.length; i++) {
        var id = queue[i];
        links.forEach(function(link) {
            var next = null;
            if (link.a === id) next = link.b;
            else if (link.b === id) next = link.a;
            if (next && !seen[next]) {
                seen[next] = true;
                queue.push(next);
            }
        });
    }
    return Object.keys(seen);
}

function PT_setMagnetGroupLayer(instanceId, layer) {
    var state = window.PT_APP_STATE || {};
    var groupIds = PT_getMagnetGroup(instanceId);
    groupIds.forEach(function(id) {
        var inst = state.instances && state.instances[id];
        if (!inst || !inst.element) return;
        inst.element.style.zIndex = layer;
        if (typeof window.PT_syncResizeHandle === 'function') window.PT_syncResizeHandle(id);
    });
    return groupIds;
}

function PT_magnetContactSide(edge, isA) {
    if (edge === 'right-left') return isA ? 'right' : 'left';
    if (edge === 'left-right') return isA ? 'left' : 'right';
    if (edge === 'bottom-top') return isA ? 'bottom' : 'top';
    if (edge === 'top-bottom') return isA ? 'top' : 'bottom';
    return null;
}

function PT_getMagnetEdgeOccupancy(cardId, side, state, stageRect) {
    var ranges = [];
    (window.PT_magnetLinks || []).forEach(function(link) {
        var isA = link.a === cardId;
        var isB = link.b === cardId;
        if (!isA && !isB) return;
        var linkSide = PT_magnetContactSide(link.edge, isA);
        if (linkSide !== side) return;
        var otherId = isA ? link.b : link.a;
        var otherInst = state.instances && state.instances[otherId];
        var cardInst = state.instances && state.instances[cardId];
        if (!otherInst || !otherInst.element || !cardInst || !cardInst.element) return;
        var cr = PT_getStageCardRect(cardInst.element, stageRect);
        var or = PT_getStageCardRect(otherInst.element, stageRect);
        if (side === 'left' || side === 'right') {
            var s = Math.max(cr.top, or.top);
            var e = Math.min(cr.bottom, or.bottom);
            if (e > s) ranges.push([ (s - cr.top) / cr.height, (e - cr.top) / cr.height ]);
        } else {
            var sx = Math.max(cr.left, or.left);
            var ex = Math.min(cr.right, or.right);
            if (ex > sx) ranges.push([ (sx - cr.left) / cr.width, (ex - cr.left) / cr.width ]);
        }
    });
    return ranges;
}

function PT_findCardMagnetSnap(cardShell, stageRect) {
    if (!cardShell || !stageRect) return null;
    var magnetMode = window.PT_getCardMagnetMode ? window.PT_getCardMagnetMode() : 'off';
    if (magnetMode === 'off') return null;
    var alignEnabled = window.PT_getMagnetAlign ? window.PT_getMagnetAlign() : true;
    var state = window.PT_APP_STATE || {};
    var selfId = cardShell.getAttribute('data-instance-id');
    var groupIds = {};
    PT_getMagnetGroup(selfId).forEach(function(id) { groupIds[id] = true; });
    var threshold = window.PT_getMagnetSnapDistance ? window.PT_getMagnetSnapDistance() : 26;
    var minOverlap = Math.max(8, Math.round(threshold * 0.9));
    var best = null;

    Object.keys(groupIds).forEach(function(contactId) {
        var contactInst = state.instances[contactId];
        if (!contactInst || !contactInst.element) return;
        var active = PT_getStageCardRect(contactInst.element, stageRect);

        Object.keys(state.instances || {}).forEach(function(id) {
            var inst = state.instances[id];
            if (!inst || !inst.element || inst.minimized || inst.flownAway || groupIds[id]) return;
            var target = PT_getStageCardRect(inst.element, stageRect);
            var verticalOverlap = PT_magnetOverlap(active.top, active.bottom, target.top, target.bottom);
            var horizontalOverlap = PT_magnetOverlap(active.left, active.right, target.left, target.right);

            var topDiff = Math.abs(active.top - target.top);
            var bottomDiff = Math.abs(active.bottom - target.bottom);
            var centerTop = target.top + (target.height - active.height) / 2;
            var centerVDiff = Math.abs(active.top - centerTop);
            var vAlign = '', vAlignTop = active.top, vAlignDist = Infinity;
            if (alignEnabled) {
                if (topDiff <= threshold && topDiff <= bottomDiff && topDiff <= centerVDiff) { vAlign = 'top'; vAlignTop = target.top; vAlignDist = topDiff; }
                else if (bottomDiff <= threshold && bottomDiff <= centerVDiff) { vAlign = 'bottom'; vAlignTop = target.bottom - active.height; vAlignDist = bottomDiff; }
                else if (centerVDiff <= threshold) { vAlign = 'center'; vAlignTop = centerTop; vAlignDist = centerVDiff; }
            }

            var leftDiff = Math.abs(active.left - target.left);
            var rightDiff = Math.abs(active.right - target.right);
            var centerLeft = target.left + (target.width - active.width) / 2;
            var centerHDiff = Math.abs(active.left - centerLeft);
            var hAlign = '', hAlignLeft = active.left, hAlignDist = Infinity;
            if (alignEnabled) {
                if (leftDiff <= threshold && leftDiff <= rightDiff && leftDiff <= centerHDiff) { hAlign = 'left'; hAlignLeft = target.left; hAlignDist = leftDiff; }
                else if (rightDiff <= threshold && rightDiff <= centerHDiff) { hAlign = 'right'; hAlignLeft = target.right - active.width; hAlignDist = rightDiff; }
                else if (centerHDiff <= threshold) { hAlign = 'center'; hAlignLeft = centerLeft; hAlignDist = centerHDiff; }
            }

            var candidates = [
                { edge: 'right-left', dist: target.left - active.right, left: target.left - active.width, top: vAlignTop, overlap: verticalOverlap, target: target, align: vAlign, alignDist: vAlignDist },
                { edge: 'left-right', dist: active.left - target.right, left: target.right, top: vAlignTop, overlap: verticalOverlap, target: target, align: vAlign, alignDist: vAlignDist },
                { edge: 'bottom-top', dist: target.top - active.bottom, left: hAlignLeft, top: target.top - active.height, overlap: horizontalOverlap, target: target, align: hAlign, alignDist: hAlignDist },
                { edge: 'top-bottom', dist: active.top - target.bottom, left: hAlignLeft, top: target.bottom, overlap: horizontalOverlap, target: target, align: hAlign, alignDist: hAlignDist }
            ];
            candidates.forEach(function(candidate) {
                if (candidate.dist < 0 || candidate.dist > threshold || candidate.overlap < minOverlap) return;
                var contactSide = PT_magnetContactSide(candidate.edge, true);
                var occupied = PT_getMagnetEdgeOccupancy(contactId, contactSide, state, stageRect);
                if (occupied.length > 0) return;
                var targetSide = PT_magnetContactSide(candidate.edge, false);
                var targetOccupied = PT_getMagnetEdgeOccupancy(target.id, targetSide, state, stageRect);
                if (targetOccupied.length > 0) return;
                candidate.score = candidate.dist + (candidate.align ? Math.min(candidate.alignDist, threshold) * 0.15 : threshold * 0.35);
                candidate.contactId = contactId;
                candidate.contactRect = active;
                if (!best || candidate.score < best.score) best = candidate;
            });
        });
    });
    return best;
}

function PT_setMagnetSettling(groupIds, settling) {
    var state = window.PT_APP_STATE || {};
    (groupIds || []).forEach(function(id) {
        var inst = state.instances && state.instances[id];
        if (!inst || !inst.element) return;
        inst._magnetSettling = !!settling;
        inst.element.classList.toggle('pt-desktop-card--magnet-settling', !!settling);
    });
}

function PT_runMagnetSnapPulse(targetInst, edge) {
    if (!targetInst || !targetInst.element) return;
    var el = targetInst.element;
    var dx = 0, dy = 0;
    if (edge === 'right-left') dx = -5;
    else if (edge === 'left-right') dx = 5;
    else if (edge === 'bottom-top') dy = -5;
    else if (edge === 'top-bottom') dy = 5;
    if (!dx && !dy) return;
    if (el.animate) {
        el.animate([
            { transform: 'translate(0,0)' },
            { transform: 'translate(' + dx + 'px,' + dy + 'px)' },
            { transform: 'translate(0,0)' }
        ], { duration: 180, easing: 'cubic-bezier(0.3,0.9,0.3,1.2)' });
    }
}

function PT_addMagnetLink(a, b, edge, align) {
    if (!a || !b || a === b) return;
    var links = window.PT_magnetLinks || [];
    for (var i = 0; i < links.length; i++) {
        var link = links[i];
        if ((link.a === a && link.b === b) || (link.a === b && link.b === a)) {
            link.edge = edge;
            link.align = align || '';
            window.PT_magnetLinks = links;
            PT_setMagnetGroupLayer(a, PT_getMagnetGroupMaxLayer(PT_getMagnetGroup(a)));
            return;
        }
    }
    links.push({ a: a, b: b, edge: edge, align: align || '' });
    window.PT_magnetLinks = links;
    PT_setMagnetGroupLayer(a, PT_getMagnetGroupMaxLayer(PT_getMagnetGroup(a)));
}

function PT_removeMagnetLinksFor(instanceId) {
    window.PT_magnetLinks = (window.PT_magnetLinks || []).filter(function(link) {
        return link.a !== instanceId && link.b !== instanceId;
    });
    PT_renderMagnetLinks();
}

function PT_closeGapAfterMinimize(minimizedId, oldLinks, minRect, stageRect) {
    if (!oldLinks || oldLinks.length < 2 || !minRect) return;
    var state = window.PT_APP_STATE || {};
    var neighbors = [];
    oldLinks.forEach(function(link) {
        var other = PT_magnetOtherSide(link, minimizedId);
        if (other && state.instances[other.id] && state.instances[other.id].element) {
            neighbors.push({ id: other.id, side: other.side, edge: link.edge, align: link.align });
        }
    });
    if (neighbors.length < 2) return;

    var bySide = {};
    neighbors.forEach(function(n) {
        if (!bySide[n.side]) bySide[n.side] = [];
        bySide[n.side].push(n);
    });

    var pairs = [['left','right'], ['top','bottom']];
    pairs.forEach(function(pair) {
        var sideA = pair[0], sideB = pair[1];
        var groupA = bySide[sideA] || [];
        var groupB = bySide[sideB] || [];
        if (groupA.length === 0 || groupB.length === 0) return;

        var subA = {}, subB = {};
        groupA.forEach(function(n) { PT_getMagnetGroup(n.id).forEach(function(id) { subA[id] = true; }); });
        groupB.forEach(function(n) { PT_getMagnetGroup(n.id).forEach(function(id) { subB[id] = true; }); });
        var idsA = Object.keys(subA), idsB = Object.keys(subB);
        var countA = idsA.length, countB = idsB.length;
        var gap = (sideA === 'left' || sideA === 'right') ? minRect.width : minRect.height;
        var shiftA = 0, shiftB = 0;
        if (countA > countB) {
            shiftB = (sideB === 'right' || sideB === 'bottom') ? -gap : gap;
        } else if (countB > countA) {
            shiftA = (sideA === 'left' || sideA === 'top') ? gap : -gap;
        } else {
            shiftA = (sideA === 'left' || sideA === 'top') ? gap / 2 : -gap / 2;
            shiftB = (sideB === 'right' || sideB === 'bottom') ? -gap / 2 : gap / 2;
        }
        var dxA = (sideA === 'left' || sideA === 'right') ? shiftA : 0;
        var dyA = (sideA === 'top' || sideA === 'bottom') ? shiftA : 0;
        var dxB = (sideB === 'left' || sideB === 'right') ? shiftB : 0;
        var dyB = (sideB === 'top' || sideB === 'bottom') ? shiftB : 0;

        idsA.forEach(function(id) {
            var inst = state.instances[id];
            if (!inst || !inst.element) return;
            inst.element.style.transition = 'left 220ms cubic-bezier(0.22,0.61,0.36,1), top 220ms cubic-bezier(0.22,0.61,0.36,1)';
            inst.element.style.left = (parseFloat(inst.element.style.left) + dxA) + 'px';
            inst.element.style.top = (parseFloat(inst.element.style.top) + dyA) + 'px';
            if (typeof window.PT_syncResizeHandle === 'function') window.PT_syncResizeHandle(id);
            setTimeout(function() { inst.element.style.transition = ''; PT_saveCardPosition(inst); }, 230);
        });
        idsB.forEach(function(id) {
            var inst = state.instances[id];
            if (!inst || !inst.element) return;
            inst.element.style.transition = 'left 220ms cubic-bezier(0.22,0.61,0.36,1), top 220ms cubic-bezier(0.22,0.61,0.36,1)';
            inst.element.style.left = (parseFloat(inst.element.style.left) + dxB) + 'px';
            inst.element.style.top = (parseFloat(inst.element.style.top) + dyB) + 'px';
            if (typeof window.PT_syncResizeHandle === 'function') window.PT_syncResizeHandle(id);
            setTimeout(function() { inst.element.style.transition = ''; PT_saveCardPosition(inst); }, 230);
        });

        var linkA = groupA[0], linkB = groupB[0];
        setTimeout(function() {
            var newEdge = PT_computeMagnetEdgeFromPositions(linkA.id, linkB.id, stageRect) || linkA.edge;
            PT_addMagnetLink(linkA.id, linkB.id, newEdge, linkA.align);
            if (typeof window.PT_enforceMagnetLinkEdges === 'function') window.PT_enforceMagnetLinkEdges(linkA.id);
            PT_renderMagnetLinks();
            if (typeof window.PT_updateGlassMask === 'function') window.PT_updateGlassMask();
        }, 240);
    });
}

function PT_removeMagnetLink(index) {
    var links = window.PT_magnetLinks || [];
    links.splice(index, 1);
    window.PT_magnetLinks = links;
    PT_renderMagnetLinks();
}

var PT_MAGNET_SLOW_SPEED = 0.8;
var PT_MAGNET_BREAK_SPEED = 2.5;
var PT_MAGNET_SNAP_PULSE_MS = 120;

function PT_createDragSpeedTracker() {
    return { lastX: 0, lastY: 0, lastT: 0, samples: [], lastDx: 0, lastDy: 0 };
}
function PT_trackDragSample(tracker, x, y) {
    if (!tracker) return;
    var t = performance.now();
    if (tracker.lastT) {
        var dt = t - tracker.lastT;
        if (dt > 0) {
            var dx = x - tracker.lastX;
            var dy = y - tracker.lastY;
            var dist = Math.hypot(dx, dy);
            tracker.samples.push({ t: t, v: dist / dt, dx: dx, dy: dy });
            tracker.lastDx = dx;
            tracker.lastDy = dy;
        }
    }
    tracker.lastX = x; tracker.lastY = y; tracker.lastT = t;
    var cutoff = t - 40;
    while (tracker.samples.length > 1 && tracker.samples[0].t < cutoff) tracker.samples.shift();
}
function PT_getDragDirection(tracker) {
    if (!tracker || !tracker.samples.length) return { dx: 0, dy: 0 };
    var sumDx = 0, sumDy = 0;
    for (var i = 0; i < tracker.samples.length; i++) {
        sumDx += tracker.samples[i].dx;
        sumDy += tracker.samples[i].dy;
    }
    return { dx: sumDx, dy: sumDy };
}
function PT_getDragSpeed(tracker) {
    if (!tracker || !tracker.samples.length) return 0;
    var sum = 0;
    for (var i = 0; i < tracker.samples.length; i++) sum += tracker.samples[i].v;
    return sum / tracker.samples.length;
}

function PT_getMagnetGroupMaxLayer(groupIds) {
    var state = window.PT_APP_STATE || {};
    var maxLayer = 1;
    (groupIds || []).forEach(function(id) {
        var inst = state.instances && state.instances[id];
        if (!inst || !inst.element) return;
        maxLayer = Math.max(maxLayer, parseInt(inst.element.style.zIndex, 10) || 1);
    });
    return maxLayer;
}

function PT_invertMagnetEdge(edge) {
    if (edge === 'right-left') return 'left-right';
    if (edge === 'left-right') return 'right-left';
    if (edge === 'bottom-top') return 'top-bottom';
    if (edge === 'top-bottom') return 'bottom-top';
    return edge;
}

function PT_getLinkedMagnetLayout(anchorRect, targetRect, link, anchorIsB) {
    if (!anchorRect || !targetRect || !link) return null;
    var edge = anchorIsB ? PT_invertMagnetEdge(link.edge) : link.edge;
    var left = targetRect.left;
    var top = targetRect.top;
    if (edge === 'right-left') left = anchorRect.right;
    else if (edge === 'left-right') left = anchorRect.left - targetRect.width;
    else if (edge === 'bottom-top') top = anchorRect.bottom;
    else if (edge === 'top-bottom') top = anchorRect.top - targetRect.height;
    if (edge === 'right-left' || edge === 'left-right') {
        if (link.align === 'top') top = anchorRect.top;
        else if (link.align === 'bottom') top = anchorRect.bottom - targetRect.height;
        else if (link.align === 'center') top = anchorRect.top + Math.round((anchorRect.height - targetRect.height) / 2);
    }
    if (edge === 'bottom-top' || edge === 'top-bottom') {
        if (link.align === 'left') left = anchorRect.left;
        else if (link.align === 'right') left = anchorRect.right - targetRect.width;
        else if (link.align === 'center') left = anchorRect.left + Math.round((anchorRect.width - targetRect.width) / 2);
    }
    return { left: Math.round(left), top: Math.round(top) };
}

function PT_setMagnetCardPosition(instanceId, left, top) {
    var state = window.PT_APP_STATE || {};
    var inst = state.instances && state.instances[instanceId];
    if (!inst || !inst.element || inst.minimized || inst.flownAway) return;
    inst.element.style.left = Math.round(left) + 'px';
    inst.element.style.top = Math.round(top) + 'px';
    if (typeof window.PT_syncResizeHandle === 'function') window.PT_syncResizeHandle(instanceId);
}

function PT_enforceMagnetLinkEdges(anchorId) {
    var state = window.PT_APP_STATE || {};
    var stage = document.getElementById('pt-desktop-stage');
    if (!stage) return;
    var links = window.PT_magnetLinks || [];
    var stageRect = stage.getBoundingClientRect();
    var anchors = anchorId ? [anchorId] : Object.keys(state.instances || {});
    var handled = {};

    anchors.forEach(function(startId) {
        if (handled[startId]) return;
        var startInst = state.instances && state.instances[startId];
        if (!startInst || !startInst.element || startInst.minimized || startInst.flownAway) return;
        var queue = [startId];
        var seen = {};
        seen[startId] = true;
        handled[startId] = true;

        for (var i = 0; i < queue.length; i++) {
            var currentId = queue[i];
            var currentInst = state.instances && state.instances[currentId];
            if (!currentInst || !currentInst.element || currentInst.minimized || currentInst.flownAway) continue;
            var anchorRect = PT_getStageCardRect(currentInst.element, stageRect);

            links.forEach(function(link) {
                var nextId = null;
                var anchorIsB = false;
                if (link.a === currentId) nextId = link.b;
                else if (link.b === currentId) { nextId = link.a; anchorIsB = true; }
                if (!nextId || seen[nextId]) return;
                var nextInst = state.instances && state.instances[nextId];
                if (!nextInst || !nextInst.element || nextInst.minimized || nextInst.flownAway) return;
                var nextRect = PT_getStageCardRect(nextInst.element, stageRect);
                var layout = PT_getLinkedMagnetLayout(anchorRect, nextRect, link, anchorIsB);
                if (!layout) return;
                PT_setMagnetCardPosition(nextId, layout.left, layout.top);
                seen[nextId] = true;
                handled[nextId] = true;
                queue.push(nextId);
            });
        }
    });
}

function PT_saveMagnetGroupPositions(instanceId) {
    var state = window.PT_APP_STATE || {};
    PT_getMagnetGroup(instanceId).forEach(function(id) {
        var inst = state.instances && state.instances[id];
        if (inst && inst.element) PT_saveCardPosition(inst);
    });
}

function PT_normalizeMagnetLayout(anchorId) {
    PT_enforceMagnetLinkEdges(anchorId);
    PT_renderMagnetLinks();
}

var PT_magnetNormalizeTimer = null;
function PT_scheduleMagnetNormalize(anchorId) {
    clearTimeout(PT_magnetNormalizeTimer);
    PT_magnetNormalizeTimer = setTimeout(function() {
        PT_normalizeMagnetLayout(anchorId);
    }, 80);
}

function PT_scheduleMagnetNormalizeAfterLayout(anchorId) {
    requestAnimationFrame(function() {
        requestAnimationFrame(function() {
            PT_scheduleMagnetNormalize(anchorId);
        });
    });
}

window.addEventListener('resize', function() {
    PT_scheduleMagnetNormalize();
});

function PT_magnetEdgeDirections(edge) {
    if (edge === 'right-left') return { a: 'right', b: 'left' };
    if (edge === 'left-right') return { a: 'left', b: 'right' };
    if (edge === 'bottom-top') return { a: 'bottom', b: 'top' };
    if (edge === 'top-bottom') return { a: 'top', b: 'bottom' };
    return null;
}

function PT_computeMagnetEdgeFromPositions(aId, bId, stageRect) {
    var state = window.PT_APP_STATE || {};
    var aInst = state.instances && state.instances[aId];
    var bInst = state.instances && state.instances[bId];
    if (!aInst || !aInst.element || !bInst || !bInst.element) return null;
    var aRect = PT_getStageCardRect(aInst.element, stageRect);
    var bRect = PT_getStageCardRect(bInst.element, stageRect);
    if (!aRect || !bRect) return null;
    var hOverlap = PT_magnetOverlap(aRect.top, aRect.bottom, bRect.top, bRect.bottom);
    var vOverlap = PT_magnetOverlap(aRect.left, aRect.right, bRect.left, bRect.right);
    if (hOverlap >= vOverlap) {
        if (aRect.right <= bRect.left + 1) return 'right-left';
        if (aRect.left + 1 >= bRect.right) return 'left-right';
    } else {
        if (aRect.bottom <= bRect.top + 1) return 'bottom-top';
        if (aRect.top + 1 >= bRect.bottom) return 'top-bottom';
    }
    return null;
}

function PT_magnetOtherSide(link, activeId) {
    if (!link) return null;
    var activeIsA = link.a === activeId;
    if (!activeIsA && link.b !== activeId) return null;
    var other = activeIsA ? link.b : link.a;
    var edge = link.edge;
    if (activeIsA) {
        if (edge === 'right-left') return { id: other, side: 'right' };
        if (edge === 'left-right') return { id: other, side: 'left' };
        if (edge === 'bottom-top') return { id: other, side: 'bottom' };
        if (edge === 'top-bottom') return { id: other, side: 'top' };
    } else {
        if (edge === 'right-left') return { id: other, side: 'left' };
        if (edge === 'left-right') return { id: other, side: 'right' };
        if (edge === 'bottom-top') return { id: other, side: 'top' };
        if (edge === 'top-bottom') return { id: other, side: 'bottom' };
    }
    return null;
}

function PT_getPhysicsSeamInset(aEl, bEl, aRect, bRect, edgeValue, side) {
    var tolerance = 1.5;
    var inset = 0;
    [
        { element: aEl, rect: aRect },
        { element: bEl, rect: bRect }
    ].forEach(function(item) {
        if (!item.element || !item.rect) return;
        var matchesSide = false;
        if (side === 'top') matchesSide = Math.abs(edgeValue - item.rect.top) <= tolerance;
        else if (side === 'bottom') matchesSide = Math.abs(edgeValue - item.rect.bottom) <= tolerance;
        else if (side === 'left') matchesSide = Math.abs(edgeValue - item.rect.left) <= tolerance;
        else if (side === 'right') matchesSide = Math.abs(edgeValue - item.rect.right) <= tolerance;
        if (!matchesSide) return;
        var radius = window.getComputedStyle ? parseFloat(window.getComputedStyle(item.element).borderTopLeftRadius) || 0 : 0;
        inset = Math.max(inset, Math.min(radius, side === 'top' || side === 'bottom' ? item.rect.height / 2 : item.rect.width / 2));
    });
    return inset;
}

function PT_showMagnetPreviewBox(snap, activeRect, stageRect) {
    var stage = document.getElementById('pt-desktop-stage');
    if (!stage) return;
    stage.querySelectorAll('.pt-magnet-preview-box').forEach(function(el) { el.remove(); });
    if (!snap) return;
    var state = window.PT_APP_STATE || {};
    var selfId = snap.contactId || (activeRect && activeRect.id);
    if (!selfId) return;
    var groupIds = PT_getMagnetGroup(selfId);
    var rects = {};
    groupIds.forEach(function(id) {
        var inst = state.instances[id];
        if (inst && inst.element) rects[id] = PT_getStageCardRect(inst.element, stageRect);
    });
    var contactRect = snap.contactRect || activeRect;
    var dx = snap.left - (contactRect ? contactRect.left : 0);
    var dy = snap.top - (contactRect ? contactRect.top : 0);
    groupIds.forEach(function(id) {
        var r = rects[id];
        if (!r) return;
        var el = document.createElement('div');
        el.className = 'pt-magnet-preview-box';
        el.style.left = Math.round(r.left + dx) + 'px';
        el.style.top = Math.round(r.top + dy) + 'px';
        el.style.width = Math.round(r.width) + 'px';
        el.style.height = Math.round(r.height) + 'px';
        el.classList.add('is-visible');
        stage.appendChild(el);
    });
}

function PT_hideMagnetPreviewBox() {
    var stage = document.getElementById('pt-desktop-stage');
    if (!stage) return;
    stage.querySelectorAll('.pt-magnet-preview-box').forEach(function(el) { el.remove(); });
}

function PT_showScreenSnapPreviewGroup(cardShell, snapTarget, stageRect) {
    var stage = document.getElementById('pt-desktop-stage');
    if (!stage || !snapTarget) return;
    stage.querySelectorAll('.pt-magnet-preview-box').forEach(function(el) { el.remove(); });
    var state = window.PT_APP_STATE || {};
    var selfId = cardShell.getAttribute('data-instance-id');
    var groupIds = PT_getMagnetGroup(selfId);
    var dx = snapTarget.groupDx != null ? snapTarget.groupDx : (snapTarget.left - (parseFloat(cardShell.style.left) || 0));
    var dy = snapTarget.groupDy != null ? snapTarget.groupDy : (snapTarget.top - (parseFloat(cardShell.style.top) || 0));
    groupIds.forEach(function(id) {
        var inst = state.instances[id];
        if (!inst || !inst.element) return;
        var r = PT_getStageCardRect(inst.element, stageRect);
        var el = document.createElement('div');
        el.className = 'pt-magnet-preview-box';
        el.style.left = Math.round(r.left + dx) + 'px';
        el.style.top = Math.round(r.top + dy) + 'px';
        el.style.width = Math.round(r.width) + 'px';
        el.style.height = Math.round(r.height) + 'px';
        el.classList.add('is-visible');
        stage.appendChild(el);
    });
}

function PT_renderMagnetLinks() {
    var state = window.PT_APP_STATE || {};
    var links = (window.PT_magnetLinks || []).filter(function(link) {
        return state.instances[link.a] && state.instances[link.b];
    });
    window.PT_magnetLinks = links;
    var magnetMode = window.PT_getCardMagnetMode ? window.PT_getCardMagnetMode() : 'off';
    var isNormal = magnetMode === 'normal';
    var isPhysics = magnetMode === 'physics';
    var stage = document.getElementById('pt-desktop-stage');
    var stageRect = stage ? stage.getBoundingClientRect() : null;

    var SNAPPED_DIRS = ['right', 'left', 'bottom', 'top'];
    Object.keys(state.instances).forEach(function(id) {
        var inst = state.instances[id];
        if (!inst || !inst.element) return;
        SNAPPED_DIRS.forEach(function(dir) {
            inst.element.classList.remove('pt-desktop-card--snapped-' + dir);
        });
    });

    if ((isNormal || isPhysics) && stage && stageRect) {
        var activeKeys = {};
        links.forEach(function(link, index) {
            var aInst = state.instances[link.a];
            var bInst = state.instances[link.b];
            if (!aInst || !bInst || aInst.minimized || bInst.minimized || aInst.flownAway || bInst.flownAway || aInst._targetMinimized === true || bInst._targetMinimized === true || aInst._magnetLinksHidden || bInst._magnetLinksHidden) return;
            var aRect = PT_getStageCardRect(aInst.element, stageRect);
            var bRect = PT_getStageCardRect(bInst.element, stageRect);
            var vertical = link.edge === 'right-left' || link.edge === 'left-right';
            var x, y, seamW, seamH;
            if (vertical) {
                var overlapTop = Math.max(aRect.top, bRect.top);
                var overlapBottom = Math.min(aRect.bottom, bRect.bottom);
                var seamTop = overlapTop;
                var seamBottom = overlapBottom;
                if (isPhysics) {
                    seamTop += PT_getPhysicsSeamInset(aInst.element, bInst.element, aRect, bRect, overlapTop, 'top');
                    seamBottom -= PT_getPhysicsSeamInset(aInst.element, bInst.element, aRect, bRect, overlapBottom, 'bottom');
                }
                x = link.edge === 'right-left' ? (aRect.right + bRect.left) / 2 : (aRect.left + bRect.right) / 2;
                y = (seamTop + seamBottom) / 2;
                seamW = isPhysics ? 1 : 14;
                seamH = isPhysics ? Math.max(2, Math.round(seamBottom - seamTop)) : Math.max(20, Math.round((overlapBottom - overlapTop) / 4));
            } else {
                var overlapLeft = Math.max(aRect.left, bRect.left);
                var overlapRight = Math.min(aRect.right, bRect.right);
                var seamLeft = overlapLeft;
                var seamRight = overlapRight;
                if (isPhysics) {
                    seamLeft += PT_getPhysicsSeamInset(aInst.element, bInst.element, aRect, bRect, overlapLeft, 'left');
                    seamRight -= PT_getPhysicsSeamInset(aInst.element, bInst.element, aRect, bRect, overlapRight, 'right');
                }
                y = link.edge === 'bottom-top' ? (aRect.bottom + bRect.top) / 2 : (aRect.top + bRect.bottom) / 2;
                x = (seamLeft + seamRight) / 2;
                seamW = isPhysics ? Math.max(2, Math.round(seamRight - seamLeft)) : Math.max(20, Math.round((overlapRight - overlapLeft) / 4));
                seamH = isPhysics ? 1 : 14;
            }
            var aZ = parseInt(aInst.element.style.zIndex, 10) || 1;
            var bZ = parseInt(bInst.element.style.zIndex, 10) || 1;
            var key = link.a + '__' + link.b;
            activeKeys[key] = true;
            var seam = stage.querySelector('.pt-magnet-seam[data-magnet-key="' + key + '"]');
            if (!seam) {
                seam = document.createElement('button');
                seam.type = 'button';
                seam.className = 'pt-magnet-seam pt-magnet-seam--' + (vertical ? 'vertical' : 'horizontal') + (isPhysics ? ' pt-magnet-seam--physics' : '');
                seam.setAttribute('data-magnet-key', key);
                seam.setAttribute('aria-label', '解除吸附');
                seam.addEventListener('click', function(event) {
                    event.stopPropagation();
                    var currentLinks = window.PT_magnetLinks || [];
                    for (var ci = 0; ci < currentLinks.length; ci++) {
                        if ((currentLinks[ci].a === link.a && currentLinks[ci].b === link.b) || (currentLinks[ci].a === link.b && currentLinks[ci].b === link.a)) {
                            PT_removeMagnetLink(ci);
                            break;
                        }
                    }
                });
                stage.appendChild(seam);
            }
            var orientClass = 'pt-magnet-seam--' + (vertical ? 'vertical' : 'horizontal');
            if (!seam.classList.contains(orientClass)) {
                seam.classList.remove('pt-magnet-seam--vertical', 'pt-magnet-seam--horizontal');
                seam.classList.add(orientClass);
            }
            seam.classList.toggle('pt-magnet-seam--physics', isPhysics);
            seam.style.left = Math.round(x) + 'px';
            seam.style.top = Math.round(y) + 'px';
            seam.style.width = seamW + 'px';
            seam.style.height = seamH + 'px';
            seam.style.zIndex = String(Math.max(aZ, bZ) + (isPhysics ? 1 : 0));
            if (!seam.classList.contains('pt-magnet-seam--visible')) {
                requestAnimationFrame(function() {
                    requestAnimationFrame(function() {
                        seam.classList.add('pt-magnet-seam--visible');
                    });
                });
            }
        });
        stage.querySelectorAll('.pt-magnet-seam').forEach(function(el) {
            var key = el.getAttribute('data-magnet-key');
            if (!activeKeys[key] && el.classList.contains('pt-magnet-seam--visible')) {
                el.classList.remove('pt-magnet-seam--visible');
                setTimeout(function() {
                    if (!el.classList.contains('pt-magnet-seam--visible') && el.parentNode) el.parentNode.removeChild(el);
                }, 240);
            }
        });
    } else if (stage && !isNormal && !isPhysics) {
        stage.querySelectorAll('.pt-magnet-seam').forEach(function(el) {
            el.classList.remove('pt-magnet-seam--visible');
            setTimeout(function() {
                if (el.parentNode) el.parentNode.removeChild(el);
            }, 240);
        });
    }

    if (isPhysics) {
        links.forEach(function(link) {
            var aInst = state.instances[link.a];
            var bInst = state.instances[link.b];
            if (!aInst || !bInst || aInst.minimized || bInst.minimized || aInst.flownAway || bInst.flownAway || aInst._targetMinimized === true || bInst._targetMinimized === true || aInst._magnetLinksHidden || bInst._magnetLinksHidden) return;
            var dirs = PT_magnetEdgeDirections(link.edge);
            if (!dirs) return;
            aInst.element.classList.add('pt-desktop-card--snapped-' + dirs.a);
            bInst.element.classList.add('pt-desktop-card--snapped-' + dirs.b);
        });
    }
}

function PT_getCardSnapTarget(cardShell, stageRect, nextLeft, nextTop) {
    if (!cardShell || !stageRect) return null;
    var snapMode = window.PT_getScreenSnapMode ? window.PT_getScreenSnapMode() : (window.PT_getCardSnapMode ? window.PT_getCardSnapMode() : 'off');
    if (snapMode === 'off') return null;

    var w = cardShell.offsetWidth;
    var h = cardShell.offsetHeight;
    var threshold = 22;
    var xTargets = [
        { value: 0, type: 'left-edge' },
        { value: Math.max(0, stageRect.width - w), type: 'right-edge' }
    ];
    var yTargets = [
        { value: 0, type: 'top-edge' }
    ];

    function closestTarget(targets, value) {
        var best = null;
        for (var i = 0; i < targets.length; i++) {
            var delta = Math.abs(targets[i].value - value);
            if (delta <= threshold && (!best || delta < best.delta)) {
                best = { value: targets[i].value, delta: delta, type: targets[i].type };
            }
        }
        return best;
    }

    var x = closestTarget(xTargets, nextLeft);
    var y = closestTarget(yTargets, nextTop);
    if (!x && !y) return null;

    return {
        left: x ? Math.round(x.value) : Math.round(nextLeft),
        top: y ? Math.round(y.value) : Math.round(nextTop),
        axisX: x ? x.type : '',
        axisY: y ? y.type : ''
    };
}

function PT_getGroupSnapTarget(cardShell, stageRect, nextLeft, nextTop) {
    var selfId = cardShell.getAttribute('data-instance-id');
    var groupIds = PT_getMagnetGroup(selfId);
    if (groupIds.length <= 1) return PT_getCardSnapTarget(cardShell, stageRect, nextLeft, nextTop);
    var best = null;
    groupIds.forEach(function(id) {
        var inst = (window.PT_APP_STATE || {}).instances[id];
        if (!inst || !inst.element) return;
        var r = PT_getStageCardRect(inst.element, stageRect);
        var el = inst.element;
        var candidateLeft = id === selfId ? nextLeft : (parseFloat(el.style.left) || 0);
        var candidateTop = id === selfId ? nextTop : (parseFloat(el.style.top) || 0);
        var snap = PT_getCardSnapTarget(el, stageRect, candidateLeft, candidateTop);
        if (snap) {
            var snapDelta = Math.abs((snap.left - candidateLeft) + (snap.top - candidateTop));
            if (!best || snapDelta < best.snapDelta) {
                best = { snap: snap, snapDelta: snapDelta, contactId: id };
            }
        }
    });
    if (!best) return null;
    var dx = best.snap.left - (parseFloat((window.PT_APP_STATE || {}).instances[best.contactId].element.style.left) || 0);
    var dy = best.snap.top - (parseFloat((window.PT_APP_STATE || {}).instances[best.contactId].element.style.top) || 0);
    return {
        left: Math.round(nextLeft + dx),
        top: Math.round(nextTop + dy),
        axisX: best.snap.axisX,
        axisY: best.snap.axisY,
        groupDx: Math.round(dx),
        groupDy: Math.round(dy)
    };
}

function PT_applyCardSnap(cardShell, snapTarget) {
    if (!cardShell || !snapTarget) return false;
    var iid = cardShell.getAttribute('data-instance-id');
    var state = window.PT_APP_STATE || {};
    var currentLeft = parseFloat(cardShell.style.left) || 0;
    var currentTop = parseFloat(cardShell.style.top) || 0;
    var dx = snapTarget.left - currentLeft;
    var dy = snapTarget.top - currentTop;
    var groupIds = iid && typeof PT_getMagnetGroup === 'function' ? PT_getMagnetGroup(iid) : [iid];
    var snapItems = [];

    groupIds.forEach(function(id) {
        var inst = state.instances && state.instances[id];
        if (!inst || !inst.element || inst.minimized || inst.flownAway || inst._targetMinimized === true) return;
        snapItems.push({ id: id, element: inst.element });
    });
    if (!snapItems.length) snapItems.push({ id: iid, element: cardShell });

    snapItems.forEach(function(item) {
        var el = item.element;
        el.classList.remove('pt-desktop-card--snap-ready');
        el.classList.add('pt-desktop-card--snapping');
        el.style.left = ((parseFloat(el.style.left) || 0) + dx) + 'px';
        el.style.top = ((parseFloat(el.style.top) || 0) + dy) + 'px';
        if (item.id && typeof window.PT_syncResizeHandle === 'function') window.PT_syncResizeHandle(item.id);
    });

    if (typeof PT_renderMagnetLinks === 'function') PT_renderMagnetLinks();
    if (typeof window.PT_updateGlassMask === 'function') window.PT_updateGlassMask();
    PT_syncGlassMaskDuringMotion(260);

    setTimeout(function() {
        snapItems.forEach(function(item) {
            item.element.classList.remove('pt-desktop-card--snapping');
            if (item.id && typeof window.PT_syncResizeHandle === 'function') window.PT_syncResizeHandle(item.id);
        });
        if (iid && typeof PT_saveMagnetGroupPositions === 'function') PT_saveMagnetGroupPositions(iid);
        if (typeof PT_renderMagnetLinks === 'function') PT_renderMagnetLinks();
        if (typeof window.PT_updateGlassMask === 'function') window.PT_updateGlassMask();
    }, 240);
    return true;
}

window.PT_enableCardDrag = function PT_enableCardDrag(cardShell) {
    if (!cardShell) return;
    var header = cardShell.querySelector('.pt-window-card__header');
    var stage = document.getElementById('pt-desktop-stage');
    if (!header || !stage) return;

    header.addEventListener('mousedown', function(event) {
        if (event.button !== 0) return;
        if (PT_findActionButton(event.target)) return;
        if (PT_isFormElement(event.target)) return;
        var stateAtDown = window.PT_APP_STATE || {};
        var downInstanceId = cardShell.getAttribute('data-instance-id');
        var downInst = downInstanceId ? stateAtDown.instances[downInstanceId] : null;
        if (downInst && downInst._magnetSettling) {
            event.preventDefault();
            event.stopPropagation();
            return;
        }

        var cardRect = cardShell.getBoundingClientRect();
        var stageRect = stage.getBoundingClientRect();
        var offsetX = event.clientX - cardRect.left;
        var offsetY = event.clientY - cardRect.top;

        cardShell.classList.add('pt-desktop-card--dragging');

        var lastSnapTarget = null;
        var lastMagnetTarget = null;
        var activeId = cardShell.getAttribute('data-instance-id');
        var magnetMode = window.PT_getCardMagnetMode ? window.PT_getCardMagnetMode() : 'off';
        var isPhysicsMagnet = magnetMode === 'physics';
        var isNormalMagnet = magnetMode === 'normal';
        var magnetEnabled = magnetMode !== 'off';
        var magnetGroupIds = magnetEnabled ? PT_getMagnetGroup(activeId) : [activeId];
        var magnetStarts = {};
        var speedTracker = PT_createDragSpeedTracker();
        if (magnetEnabled && magnetGroupIds.length > 1) {
            PT_enforceMagnetLinkEdges(activeId);
        }
        magnetGroupIds.forEach(function(id) {
            var inst = (window.PT_APP_STATE || {}).instances[id];
            if (!inst || !inst.element) return;
            magnetStarts[id] = {
                left: parseFloat(inst.element.style.left) || 0,
                top: parseFloat(inst.element.style.top) || 0
            };
            inst.element.classList.add('pt-desktop-card--dragging');
            inst.element.style.transition = 'none';
        });

        function applyGroupMove(dx, dy) {
            magnetGroupIds.forEach(function(id) {
                var inst = (window.PT_APP_STATE || {}).instances[id];
                var start = magnetStarts[id];
                if (!inst || !inst.element || !start) return;
                inst.element.style.left = (start.left + dx) + 'px';
                inst.element.style.top = (start.top + dy) + 'px';
                if (typeof window.PT_syncResizeHandle === 'function') window.PT_syncResizeHandle(id);
            });
        }

        function breakMagnetLinksToNeighbors() {
            if (magnetGroupIds.length <= 1) return false;
            var dir = PT_getDragDirection(speedTracker);
            if (Math.abs(dir.dx) < 3 && Math.abs(dir.dy) < 3) return false;
            var isHorizontal = Math.abs(dir.dx) >= Math.abs(dir.dy);
            var breakSide;
            if (isHorizontal) {
                breakSide = dir.dx > 0 ? 'left' : 'right';
            } else {
                breakSide = dir.dy > 0 ? 'top' : 'bottom';
            }
            var broken = false;
            (window.PT_magnetLinks || []).slice().forEach(function(link) {
                if (link.a !== activeId && link.b !== activeId) return;
                var other = PT_magnetOtherSide(link, activeId);
                if (!other) return;
                if (other.side === breakSide) {
                    var idx = (window.PT_magnetLinks || []).indexOf(link);
                    if (idx >= 0) PT_removeMagnetLink(idx);
                    broken = true;
                }
            });
            if (!broken) return false;
            var newGroupIds = PT_getMagnetGroup(activeId);
            magnetGroupIds.forEach(function(id) {
                if (id === activeId || newGroupIds.indexOf(id) >= 0) return;
                var inst = (window.PT_APP_STATE || {}).instances[id];
                if (!inst || !inst.element) return;
                inst.element.classList.remove('pt-desktop-card--dragging');
                inst.element.style.transition = '';
                PT_saveCardPosition(inst);
                if (typeof window.PT_syncResizeHandle === 'function') window.PT_syncResizeHandle(id);
            });
            magnetGroupIds = newGroupIds;
            PT_renderMagnetLinks();
            return true;
        }

        function performMagnetSnap(snap) {
            if (!snap || !snap.target || !snap.target.id) return;
            var targetId = snap.target.id;
            var targetInst = (window.PT_APP_STATE || {}).instances[targetId];
            if (!targetInst || !targetInst.element) return;
            var contactId = snap.contactId || activeId;
            var contactInst = (window.PT_APP_STATE || {}).instances[contactId];
            if (!contactInst || !contactInst.element) return;
            var contactRect = PT_getStageCardRect(contactInst.element, stageRect);
            var layout = PT_getLinkedMagnetLayout(contactRect, { width: targetInst.element.offsetWidth, height: targetInst.element.offsetHeight }, { edge: snap.edge, align: snap.align }, false);
            if (!layout) return;
            var targetGroupIds = PT_getMagnetGroup(targetId);
            var targetCurrentRect = PT_getStageCardRect(targetInst.element, stageRect);
            var dxFromAnchor = parseFloat(cardShell.style.left) - magnetStarts[activeId].left;
            var dyFromAnchor = parseFloat(cardShell.style.top) - magnetStarts[activeId].top;
            var settleDx = layout.left - targetCurrentRect.left;
            var settleDy = layout.top - targetCurrentRect.top;

            targetGroupIds.forEach(function(id) {
                var inst = (window.PT_APP_STATE || {}).instances[id];
                if (!inst || !inst.element) return;
                var r = (id === targetId) ? targetCurrentRect : PT_getStageCardRect(inst.element, stageRect);
                var finalLeft = r.left + settleDx;
                var finalTop = r.top + settleDy;
                inst.element.style.transition = 'none';
                inst.element.style.left = finalLeft + 'px';
                inst.element.style.top = finalTop + 'px';
                if (typeof window.PT_syncResizeHandle === 'function') window.PT_syncResizeHandle(id);
                if (magnetGroupIds.indexOf(id) < 0) magnetGroupIds.push(id);
                magnetStarts[id] = { left: finalLeft - dxFromAnchor, top: finalTop - dyFromAnchor };
            });

            PT_addMagnetLink(contactId, targetId, snap.edge, snap.align);
            PT_enforceMagnetLinkEdges(activeId);

            magnetGroupIds.forEach(function(id) {
                var inst = (window.PT_APP_STATE || {}).instances[id];
                if (!inst || !inst.element) return;
                var correctedLeft = parseFloat(inst.element.style.left) || 0;
                var correctedTop = parseFloat(inst.element.style.top) || 0;
                magnetStarts[id] = { left: correctedLeft - dxFromAnchor, top: correctedTop - dyFromAnchor };
            });

            PT_syncGlassMaskDuringMotion(PT_MAGNET_SNAP_PULSE_MS + 40);
            speedTracker = PT_createDragSpeedTracker();
            PT_renderMagnetLinks();
        }

        function moveAt(clientX, clientY) {
            PT_trackDragSample(speedTracker, clientX, clientY);
            var speed = PT_getDragSpeed(speedTracker);

            if (isPhysicsMagnet && magnetGroupIds.length > 1) {
                var breakForce = window.PT_getMagnetBreakForce ? window.PT_getMagnetBreakForce() : PT_MAGNET_BREAK_SPEED;
                if (speed > breakForce) {
                    breakMagnetLinksToNeighbors();
                }
            }

            var nextLeft = clientX - stageRect.left - offsetX;
            var nextTop = clientY - stageRect.top - offsetY;
            var w = cardShell.offsetWidth;
            var h = cardShell.offsetHeight;
            var keep = 100;

            var viewportLeft = stageRect.left + nextLeft;
            var viewportTop = stageRect.top + nextTop;
            viewportLeft = Math.max(keep - w, Math.min(viewportLeft, window.innerWidth - keep));
            viewportTop = Math.max(keep - h, Math.min(viewportTop, window.innerHeight - keep));

            nextLeft = viewportLeft - stageRect.left;
            nextTop = viewportTop - stageRect.top;
            var dx = nextLeft - (magnetStarts[activeId] ? magnetStarts[activeId].left : (parseFloat(cardShell.style.left) || 0));
            var dy = nextTop - (magnetStarts[activeId] ? magnetStarts[activeId].top : (parseFloat(cardShell.style.top) || 0));
            applyGroupMove(dx, dy);
            if (magnetGroupIds.length > 1) {
                PT_enforceMagnetLinkEdges(activeId);
            }

            if (isPhysicsMagnet) {
                var snapSpeedThreshold = window.PT_getMagnetSnapSpeed ? window.PT_getMagnetSnapSpeed() : PT_MAGNET_SLOW_SPEED;
                if (speed < snapSpeedThreshold) {
                    var snap = PT_findCardMagnetSnap(cardShell, stageRect);
                    if (snap) {
                        performMagnetSnap(snap);
                        lastSnapTarget = null;
                        cardShell.classList.remove('pt-desktop-card--snap-ready');
                        if (typeof window.PT_updateGlassMask === 'function') window.PT_updateGlassMask();
                        return;
                    }
                }
            }

            if (isNormalMagnet) {
                lastMagnetTarget = PT_findCardMagnetSnap(cardShell, stageRect);
                if (lastMagnetTarget) {
                    if (window.PT_getMagnetPreview ? window.PT_getMagnetPreview() : true) {
                        PT_showMagnetPreviewBox(lastMagnetTarget, null, stageRect);
                    }
                    lastSnapTarget = null;
                    cardShell.classList.remove('pt-desktop-card--snap-ready');
                    PT_renderMagnetLinks();
                    return;
                }
            }
            PT_hideMagnetPreviewBox();
            lastMagnetTarget = null;

            lastSnapTarget = PT_getGroupSnapTarget(cardShell, stageRect, nextLeft, nextTop);
            var snapPreviewOn = window.PT_getScreenSnapPreview ? window.PT_getScreenSnapPreview() : true;
            if (lastSnapTarget && snapPreviewOn) {
                PT_showScreenSnapPreviewGroup(cardShell, lastSnapTarget, stageRect);
            }
            cardShell.classList.toggle('pt-desktop-card--snap-ready', !!lastSnapTarget && snapPreviewOn);
            PT_renderMagnetLinks();
        }

        function onMouseMove(moveEvent) {
            moveAt(moveEvent.clientX, moveEvent.clientY);
            if (typeof window.PT_updateGlassMask === 'function') window.PT_updateGlassMask();
            var iid = cardShell.getAttribute('data-instance-id');
            if (iid && typeof window.PT_syncResizeHandle === 'function') window.PT_syncResizeHandle(iid);
        }

        function onMouseUp() {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            PT_hideMagnetPreviewBox();
            if (isNormalMagnet && lastMagnetTarget) {
                var contactId = lastMagnetTarget.contactId || activeId;
                var contactInst = (window.PT_APP_STATE || {}).instances[contactId];
                var contactCurrentLeft = contactInst ? (parseFloat(contactInst.element.style.left) || 0) : (parseFloat(cardShell.style.left) || 0);
                var contactCurrentTop = contactInst ? (parseFloat(contactInst.element.style.top) || 0) : (parseFloat(cardShell.style.top) || 0);
                var settleDx = lastMagnetTarget.left - contactCurrentLeft;
                var settleDy = lastMagnetTarget.top - contactCurrentTop;
                magnetGroupIds.forEach(function(id) {
                    var inst = (window.PT_APP_STATE || {}).instances[id];
                    if (!inst || !inst.element) return;
                    inst.element.classList.remove('pt-desktop-card--dragging');
                    inst.element.style.transition = 'left 140ms cubic-bezier(0.18, 0.92, 0.18, 1), top 140ms cubic-bezier(0.18, 0.92, 0.18, 1)';
                    inst.element.style.left = (parseFloat(inst.element.style.left) + settleDx) + 'px';
                    inst.element.style.top = (parseFloat(inst.element.style.top) + settleDy) + 'px';
                    if (typeof window.PT_syncResizeHandle === 'function') window.PT_syncResizeHandle(id);
                    (function(el) { setTimeout(function() { el.style.transition = ''; }, 160); })(inst.element);
                });
                PT_addMagnetLink(contactId, lastMagnetTarget.target.id, lastMagnetTarget.edge, lastMagnetTarget.align);
                PT_syncGlassMaskDuringMotion(200);
                setTimeout(function() {
                    magnetGroupIds.forEach(function(id) {
                        var inst = (window.PT_APP_STATE || {}).instances[id];
                        if (inst) PT_saveCardPosition(inst);
                    });
                    PT_renderMagnetLinks();
                    if (typeof window.PT_updateGlassMask === 'function') window.PT_updateGlassMask();
                }, 170);
                lastMagnetTarget = null;
                return;
            }
            lastMagnetTarget = null;
            magnetGroupIds.forEach(function(id) {
                var inst = (window.PT_APP_STATE || {}).instances[id];
                if (!inst || !inst.element) return;
                inst.element.classList.remove('pt-desktop-card--dragging');
                inst.element.style.transition = '';
                PT_saveCardPosition(inst);
            });
            if (!PT_applyCardSnap(cardShell, lastSnapTarget)) {
                cardShell.classList.remove('pt-desktop-card--snap-ready');
            }
            PT_renderMagnetLinks();
            if (typeof window.PT_updateGlassMask === 'function') window.PT_updateGlassMask();
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
};

function PT_bindCardControls(cardShell, instanceId) {
    cardShell.addEventListener('mousedown', function(e) {
        var state = window.PT_APP_STATE || {};
        var inst = state.instances && state.instances[instanceId];
        if (inst && inst._magnetSettling) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        var btn = PT_findActionButton(e.target);
        if (btn) {
            e.stopPropagation();
            var action = btn.getAttribute('data-action');
            if (action === 'close') { PT_closeCard(instanceId); return; }
            if (action === 'minimize') { PT_minimizeCard(instanceId); return; }
            if (action === 'copy') { PT_copyCard(instanceId); return; }
        }
        PT_bringToFront(cardShell, instanceId);
    });
}
