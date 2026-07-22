(function() {
    var TRANSITION_MS = 1000;
    var ENTER_FADE_MS = 560;
    var STORAGE_KEY = 'PT_MODE_SWITCH_TRANSITION';
    var STYLE_ID = 'pt-mode-transition-style';
    var LOGO_SRC = '../游戏内容/幻兽帕鲁/界面资源/壁纸/T_Palworld_Logo_Small_White.png';
    var running = false;
    var activeOverlay = null;
    var finishTimer = null;

    function ensureStyle() {
        if (!document.head || document.getElementById(STYLE_ID)) return;

        var style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = [
            '.pt-mode-transition{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;overflow:hidden;pointer-events:all;background:radial-gradient(circle at 50% 44%,rgba(255,245,195,0.38),rgba(120,222,255,0.24) 26%,rgba(58,126,210,0.30) 50%,rgba(16,46,98,0.54) 82%),linear-gradient(180deg,rgba(162,225,255,0.22),rgba(255,220,150,0.16));backdrop-filter:blur(16px) saturate(1.35) brightness(1.12);opacity:1;transition:opacity 560ms cubic-bezier(0.22,0.86,0.24,1)}',
            '.pt-mode-transition::before{content:"";position:absolute;left:50%;top:48%;width:min(720px,86vw);aspect-ratio:1;border-radius:50%;background:conic-gradient(from 26deg,rgba(255,255,255,0),rgba(255,250,202,0.42),rgba(90,224,255,0.36),rgba(153,128,255,0.22),rgba(255,255,255,0));box-shadow:0 0 70px rgba(121,225,255,0.28),0 0 130px rgba(255,215,132,0.22),inset 0 0 78px rgba(255,255,255,0.2);transform:translate(-50%,-50%) scale(0.8);opacity:0.82;animation:pt-mode-transition-portal 1000ms cubic-bezier(0.18,0.86,0.2,1) both}',
            '.pt-mode-transition::after{content:"";position:absolute;inset:-12%;background:linear-gradient(112deg,transparent 31%,rgba(255,255,255,0.26) 46%,rgba(255,232,164,0.24) 50%,transparent 62%),radial-gradient(circle at 50% 50%,rgba(255,255,255,0.28),transparent 31%);mix-blend-mode:screen;transform:translateX(-36%) rotate(-2deg);animation:pt-mode-transition-sheen 1000ms cubic-bezier(0.2,0.88,0.18,1) both}',
            '.pt-mode-transition__logo{position:relative;z-index:1;display:grid;justify-items:center;gap:0;width:min(680px,82vw);filter:drop-shadow(0 18px 24px rgba(10,26,58,0.44));animation:pt-mode-transition-logo 1000ms cubic-bezier(0.16,0.9,0.2,1) both}',
            '.pt-mode-transition__portal{position:absolute;left:50%;top:50%;width:min(520px,64vw);aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,0.24),rgba(101,221,255,0.16) 34%,transparent 68%);box-shadow:0 0 42px rgba(255,255,255,0.28),0 0 84px rgba(91,218,255,0.26);transform:translate(-50%,-50%);pointer-events:none}',
            '.pt-mode-transition__mark{position:relative;z-index:1;display:block;width:min(560px,78vw);height:auto;object-fit:contain;filter:drop-shadow(0 4px 0 rgba(40,65,88,0.95)) drop-shadow(0 10px 12px rgba(10,24,52,0.44)) drop-shadow(0 0 18px rgba(255,255,255,0.32))}',
            '.pt-mode-transition__subtitle{position:relative;z-index:1;margin-top:-8px;font-family:Georgia,"Times New Roman",serif;font-size:clamp(21px,3vw,42px);font-weight:800;line-height:1;letter-spacing:0.28em;text-indent:0.28em;color:#f9fcff;text-transform:uppercase;text-shadow:0 2px 0 rgba(55,79,98,0.98),0 5px 8px rgba(12,28,60,0.38),0 0 22px rgba(255,255,255,0.38),0 0 30px rgba(255,225,142,0.22)}',
            '.pt-mode-transition--handoff .pt-mode-transition__logo{animation:none;transform:scale(1);opacity:1;filter:blur(0) drop-shadow(0 18px 24px rgba(10,26,58,0.44))}',
            '.pt-mode-transition--handoff::before{animation:none;transform:translate(-50%,-50%) scale(1);opacity:0.78}',
            '.pt-mode-transition--leave{opacity:0}',
            '.pt-mode-transition--leave .pt-mode-transition__logo{transition:transform 560ms cubic-bezier(0.22,0.86,0.24,1),filter 560ms cubic-bezier(0.22,0.86,0.24,1);transform:scale(1.08);filter:blur(5px) drop-shadow(0 18px 24px rgba(10,26,58,0.44))}',
            '@keyframes pt-mode-transition-portal{0%{opacity:0;transform:translate(-50%,-50%) scale(0.48) rotate(-34deg);filter:blur(10px)}24%{opacity:0.9;transform:translate(-50%,-50%) scale(1.04) rotate(0deg);filter:blur(0)}72%{opacity:0.82;transform:translate(-50%,-50%) scale(1) rotate(16deg)}100%{opacity:0.72;transform:translate(-50%,-50%) scale(1.12) rotate(28deg)}}',
            '@keyframes pt-mode-transition-sheen{0%{opacity:0;transform:translateX(-38%) rotate(-2deg)}24%{opacity:1}100%{opacity:0.16;transform:translateX(34%) rotate(2deg)}}',
            '@keyframes pt-mode-transition-logo{0%{opacity:0;transform:translateY(18px) scale(0.72);filter:blur(9px) drop-shadow(0 18px 24px rgba(10,26,58,0.44))}26%{opacity:1;transform:translateY(0) scale(1.08);filter:blur(0) drop-shadow(0 18px 24px rgba(10,26,58,0.44))}68%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:1;transform:translateY(-3px) scale(0.98)}}'
        ].join('');
        document.head.appendChild(style);
    }

    function readMode(targetMode) {
        var allowed = { portal: true, web: true, dock: true, immersive: true, space: true, starchart: true };
        return allowed[targetMode] ? targetMode : 'portal';
    }

    function writeMode(targetMode) {
        var mode = readMode(targetMode);
        var settings = typeof window.readPTSettings === 'function' ? window.readPTSettings() : {};
        settings.webMode = mode;
        if (typeof window.writePTSettings === 'function') window.writePTSettings(settings, 'dock');
        return mode;
    }

    function setPending(mode) {
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ mode: mode, time: Date.now() }));
        } catch (e) {}
    }

    function getPending() {
        try {
            var raw = sessionStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function clearPending() {
        try { sessionStorage.removeItem(STORAGE_KEY); } catch (e) {}
    }

    function createOverlay(mode, handoff) {
        var overlay = document.createElement('div');
        overlay.className = 'pt-mode-transition' + (handoff ? ' pt-mode-transition--handoff' : '');
        overlay.setAttribute('aria-hidden', 'true');
        overlay.setAttribute('data-mode-target', mode);
        overlay.innerHTML = '<div class="pt-mode-transition__logo"><div class="pt-mode-transition__portal"></div><img class="pt-mode-transition__mark" src="' + LOGO_SRC + '" alt="PALWORLD"><div class="pt-mode-transition__subtitle">TOOLBOX</div></div>';
        return overlay;
    }

    function mountOverlay(mode, handoff) {
        if (!document.body) return null;
        ensureStyle();
        if (activeOverlay && activeOverlay.parentNode) activeOverlay.parentNode.removeChild(activeOverlay);
        activeOverlay = createOverlay(mode, handoff);
        document.body.appendChild(activeOverlay);
        return activeOverlay;
    }

    function reloadPage() {
        location.reload();
    }

    function finishOverlay() {
        if (!activeOverlay || !activeOverlay.parentNode) return;
        var overlay = activeOverlay;
        window.clearTimeout(finishTimer);
        window.requestAnimationFrame(function() {
            window.requestAnimationFrame(function() {
                overlay.classList.add('pt-mode-transition--leave');
                finishTimer = window.setTimeout(function() {
                    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                    if (activeOverlay === overlay) activeOverlay = null;
                    running = false;
                }, ENTER_FADE_MS + 80);
            });
        });
    }

    function restorePendingOverlay() {
        var pending = getPending();
        if (!pending || !pending.mode || !document.body) return;
        clearPending();
        running = true;
        mountOverlay(pending.mode, true);
        finishTimer = window.setTimeout(finishOverlay, 1200);
    }

    window.PT_switchModeWithTransition = function PT_switchModeWithTransition(targetMode) {
        if (running) return;
        running = true;

        var mode = writeMode(targetMode);
        setPending(mode);
        if (!document.body) {
            reloadPage();
            return;
        }

        mountOverlay(mode, false);
        window.setTimeout(reloadPage, TRANSITION_MS);
    };

    window.PT_finishModeSwitchTransition = function PT_finishModeSwitchTransition() {
        if (!activeOverlay) return;
        finishOverlay();
    };

    restorePendingOverlay();
})();
