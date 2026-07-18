(function() {
    var SCROLL_SELECTOR = '.pt-window-card__body, .pt-custom-select__panel, .pt-web-tool-scroll, .map-layer-scroll';
    var MIN_THUMB = 28;
    var EDGE_GAP = 8;
    var WINDOW_CARD_SCROLLBAR_RIGHT = 2;
    var autoScanRaf = 0;

    function schedule(state) {
        if (state.rafId) return;
        state.rafId = requestAnimationFrame(function() {
            state.rafId = 0;
            update(state);
        });
    }

    function getHost(scrollEl) {
        return scrollEl.closest('.pt-custom-select') || scrollEl.closest('.pt-window-card') || scrollEl.closest('.pt-web-tool-frame') || scrollEl.parentElement;
    }

    function isExplicitScrollTarget(el) {
        return !!(el.matches && el.matches(SCROLL_SELECTOR));
    }

    function canAutoAttach(el) {
        if (!el || el.nodeType !== 1) return false;
        if (el === document.documentElement || el === document.body) return false;
        if (el.closest && el.closest('.pt-scrollbar')) return false;
        if (isExplicitScrollTarget(el)) return true;

        var style = getComputedStyle(el);
        var overflowY = style.overflowY;
        var overflowX = style.overflowX;
        return overflowY === 'auto' || overflowY === 'scroll' || overflowX === 'auto' || overflowX === 'scroll';
    }

    function collectScrollTargets(scope) {
        var targets = [];
        if (canAutoAttach(scope)) targets.push(scope);
        if (scope && scope.querySelectorAll) {
            scope.querySelectorAll('*').forEach(function(el) {
                if (canAutoAttach(el)) targets.push(el);
            });
        }
        return targets;
    }

    function canShow(scrollEl) {
        if (!scrollEl.classList.contains('pt-custom-select__panel')) return true;
        var wrapper = scrollEl.closest('.pt-custom-select');
        return !!(wrapper && wrapper.classList.contains('pt-custom-select--open'));
    }

    function getRightOffset(host, scrollRect) {
        if (host.classList && host.classList.contains('pt-window-card')) {
            return WINDOW_CARD_SCROLLBAR_RIGHT;
        }
        var hostRect = host.getBoundingClientRect();
        return Math.max(2, hostRect.right - scrollRect.right);
    }

    function update(state) {
        var scrollEl = state.scrollEl;
        var host = state.host;
        if (!scrollEl.isConnected || !host || !host.isConnected) {
            if (state.bar.parentNode) state.bar.parentNode.removeChild(state.bar);
            return;
        }

        if (!canShow(scrollEl)) {
            state.bar.classList.remove('pt-scrollbar--visible');
            return;
        }

        var maxScroll = scrollEl.scrollHeight - scrollEl.clientHeight;
        if (maxScroll <= 1 || scrollEl.clientHeight <= 0) {
            state.bar.classList.remove('pt-scrollbar--visible');
            return;
        }

        var scrollRect = scrollEl.getBoundingClientRect();
        var hostRect = host.getBoundingClientRect();
        var trackHeight = Math.max(0, scrollRect.height - EDGE_GAP * 2);
        var right = getRightOffset(host, scrollRect);
        var top = scrollRect.top - hostRect.top + EDGE_GAP;
        var thumbHeight = Math.max(MIN_THUMB, Math.round(trackHeight * scrollEl.clientHeight / scrollEl.scrollHeight));
        var maxThumbTop = Math.max(0, trackHeight - thumbHeight);
        var thumbTop = maxScroll > 0 ? Math.round(maxThumbTop * scrollEl.scrollTop / maxScroll) : 0;

        state.bar.style.top = Math.round(top) + 'px';
        state.bar.style.right = Math.round(right) + 'px';
        state.bar.style.height = Math.round(trackHeight) + 'px';
        state.thumb.style.height = thumbHeight + 'px';
        state.thumb.style.transform = 'translateY(' + thumbTop + 'px)';
        state.bar.classList.add('pt-scrollbar--visible');
    }

    function setScrollFromPointer(state, clientY, keepOffset) {
        var scrollEl = state.scrollEl;
        var trackRect = state.bar.getBoundingClientRect();
        var thumbHeight = state.thumb.offsetHeight;
        var maxThumbTop = Math.max(1, trackRect.height - thumbHeight);
        var localY = clientY - trackRect.top - (keepOffset ? state.dragOffset : thumbHeight / 2);
        var thumbTop = Math.max(0, Math.min(maxThumbTop, localY));
        var maxScroll = scrollEl.scrollHeight - scrollEl.clientHeight;
        scrollEl.scrollTop = Math.round(maxScroll * thumbTop / maxThumbTop);
        schedule(state);
    }

    function attach(scrollEl) {
        if (!scrollEl) return;
        if (!canAutoAttach(scrollEl)) return;
        if (scrollEl.dataset.ptCustomScrollbar === '1') {
            if (scrollEl._ptCustomScrollbarState) schedule(scrollEl._ptCustomScrollbarState);
            return;
        }
        var host = getHost(scrollEl);
        if (!host) return;

        scrollEl.dataset.ptCustomScrollbar = '1';
        host.classList.add('pt-scrollbar-host');

        var bar = document.createElement('div');
        bar.className = 'pt-scrollbar';
        bar.setAttribute('aria-hidden', 'true');

        var track = document.createElement('div');
        track.className = 'pt-scrollbar__track';

        var thumb = document.createElement('div');
        thumb.className = 'pt-scrollbar__thumb';

        bar.appendChild(track);
        bar.appendChild(thumb);
        host.appendChild(bar);

        var state = {
            scrollEl: scrollEl,
            host: host,
            bar: bar,
            thumb: thumb,
            rafId: 0,
            dragOffset: 0
        };
        scrollEl._ptCustomScrollbarState = state;

        scrollEl.addEventListener('scroll', function() { schedule(state); }, { passive: true });
        window.addEventListener('resize', function() { schedule(state); });

        if (window.ResizeObserver) {
            var resizeObserver = new ResizeObserver(function() { schedule(state); });
            resizeObserver.observe(scrollEl);
            resizeObserver.observe(host);
        }

        if (window.MutationObserver) {
            var mutationObserver = new MutationObserver(function() { schedule(state); });
            mutationObserver.observe(scrollEl, {
                childList: true,
                subtree: true,
                characterData: true,
                attributes: true,
                attributeFilter: ['style', 'class', 'hidden']
            });
        }

        bar.addEventListener('pointerdown', function(event) {
            event.preventDefault();
            event.stopPropagation();
            if (event.target === thumb) {
                state.dragOffset = event.clientY - thumb.getBoundingClientRect().top;
            } else {
                state.dragOffset = thumb.offsetHeight / 2;
            }
            bar.setPointerCapture(event.pointerId);
            setScrollFromPointer(state, event.clientY, event.target === thumb);
        });

        bar.addEventListener('pointermove', function(event) {
            if (!bar.hasPointerCapture(event.pointerId)) return;
            event.preventDefault();
            setScrollFromPointer(state, event.clientY, true);
        });

        bar.addEventListener('pointerup', function(event) {
            if (bar.hasPointerCapture(event.pointerId)) bar.releasePointerCapture(event.pointerId);
        });

        requestAnimationFrame(function() { update(state); });
    }

    window.PT_initCustomScrollbars = function PT_initCustomScrollbars(root) {
        var scope = root || document;
        collectScrollTargets(scope).forEach(attach);
    };

    function scheduleAutoScan(root) {
        if (autoScanRaf) return;
        autoScanRaf = requestAnimationFrame(function() {
            autoScanRaf = 0;
            window.PT_initCustomScrollbars(root || document);
        });
    }

    function hasTransitioningCard() {
        var state = window.PT_APP_STATE || {};
        var instances = state.instances || {};
        return Object.keys(instances).some(function(id) {
            return !!(instances[id] && instances[id].transitioning);
        });
    }

    function shouldIgnoreAutoScanMutation(record) {
        var target = record && record.target;
        var element = target && target.nodeType === 1 ? target : (target && target.parentElement);
        if (element && element.closest && element.closest('.pt-scrollbar')) return true;
        if (hasTransitioningCard()) return true;
        var card = element && element.closest ? element.closest('.pt-desktop-card[data-instance-id]') : null;
        if (!card) return false;
        var state = window.PT_APP_STATE || {};
        var instances = state.instances || {};
        var instance = instances[card.getAttribute('data-instance-id')];
        return !!(instance && instance.transitioning);
    }

    if (window.MutationObserver) {
        new MutationObserver(function(records) {
            for (var i = 0; i < records.length; i++) {
                if (!shouldIgnoreAutoScanMutation(records[i])) {
                    scheduleAutoScan(document);
                    return;
                }
            }
        }).observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style', 'hidden']
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() { scheduleAutoScan(document); });
    } else {
        scheduleAutoScan(document);
    }
})();
