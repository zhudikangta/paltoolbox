var PT_IMMERSIVE_POST_EFFECTS = (function() {
    function mount(root) {
        if (!root || root.querySelector('.pt-immersive-effects')) return;
        var effects = document.createElement('div');
        effects.className = 'pt-immersive-effects';
        effects.innerHTML = '<span class="pt-immersive-effects__beam pt-immersive-effects__beam--a"></span><span class="pt-immersive-effects__beam pt-immersive-effects__beam--b"></span><span class="pt-immersive-effects__scan"></span>';
        root.appendChild(effects);
    }

    function update(root, settings, pulse) {
        if (!root) return;
        var glow = ((settings && settings.glowStrength) || 86) / 100;
        var speed = ((settings && settings.motionSpeed) || 68) / 68;
        root.style.setProperty('--pt-immersive-glow', glow.toFixed(3));
        root.style.setProperty('--pt-immersive-speed', speed.toFixed(3));
        root.style.setProperty('--pt-immersive-pulse', (pulse || 0).toFixed(3));
        root.setAttribute('data-immersive-background', (settings && settings.backgroundStyle) || 'particle-wall');
    }

    return {
        mount: mount,
        update: update
    };
})();

if (typeof window !== 'undefined') {
    window.PT_IMMERSIVE_POST_EFFECTS = PT_IMMERSIVE_POST_EFFECTS;
}
