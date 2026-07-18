var PT_SPACE_SETTINGS_PANEL = (function() {
    var tuningTimer = 0;

    function slider(label, field, min, max, value, suffix) {
        return [
            '<label class="pt-immersive-setting-row">',
            '<span>', label, '</span>',
            '<input type="range" min="', min, '" max="', max, '" value="', value, '" data-space-setting="', field, '">',
            '<b data-space-value="', field, '">', value, suffix || '', '</b>',
            '</label>'
        ].join('');
    }

    function render() {
        var settings = window.PT_SPACE_CONFIG ? window.PT_SPACE_CONFIG.readSettings() : {};
        var html = '<div class="pt-immersive-settings">';
        html += '<div class="pt-immersive-settings-grid">';
        html += '<button type="button" class="pt-immersive-btn pt-space-settings-portal" data-space-action="open-portal">进入模式选择</button>';
        html += slider('氛围密度', 'particleDensity', 16, 160, Math.round(settings.particleDensity || 88), '');
        html += slider('星尘尺寸', 'particleSize', 1, 6, Math.round(settings.particleSize || 2.6), '');
        html += slider('环绕辉光', 'glowStrength', 0, 140, Math.round(settings.glowStrength || 104), '%');
        html += slider('镜头幅度', 'cameraMotion', 0, 140, Math.round(settings.cameraMotion || 78), '%');
        html += slider('动效速度', 'motionSpeed', 10, 140, Math.round(settings.motionSpeed || 72), '%');
        html += '<label class="pt-immersive-setting-row"><span>减少动效</span><input type="checkbox" data-space-setting="reduceMotion"' + (settings.reduceMotion ? ' checked' : '') + '></label>';
        html += '</div>';
        html += '</div>';
        return html;
    }

    function readFieldValue(field) {
        if (field.type === 'checkbox') return field.checked;
        if (field.type === 'range') {
            var num = parseFloat(field.value);
            return isFinite(num) ? num : 0;
        }
        return field.value;
    }

    function applySettings(settings) {
        var next = window.PT_SPACE_CONFIG.writeSettings(settings);
        if (window.PT_SPACE_STAGE_INSTANCE && window.PT_SPACE_STAGE) {
            window.PT_SPACE_STAGE.updateSettings(window.PT_SPACE_STAGE_INSTANCE, next);
        }
        pulseTuningFeedback(next);
    }

    function pulseTuningFeedback(settings) {
        var root = document.querySelector('.pt-space-root');
        if (!root) return;
        root.classList.add('pt-space-root--tuning');
        clearTimeout(tuningTimer);
        tuningTimer = setTimeout(function() {
            root.classList.remove('pt-space-root--tuning');
        }, 260);
    }

    function bind(root) {
        if (!root || !window.PT_SPACE_CONFIG) return;
        root.addEventListener('input', function(event) {
            var field = event.target.closest('[data-space-setting]');
            if (!field) return;
            var settings = window.PT_SPACE_CONFIG.readSettings();
            var key = field.getAttribute('data-space-setting');
            settings[key] = readFieldValue(field);
            applySettings(settings);
            var valueNode = root.querySelector('[data-space-value="' + key + '"]');
            if (valueNode) valueNode.textContent = field.value + (key === 'glowStrength' || key === 'cameraMotion' || key === 'motionSpeed' ? '%' : '');
        });
        root.addEventListener('change', function(event) {
            var field = event.target.closest('[data-space-setting]');
            if (!field) return;
            var settings = window.PT_SPACE_CONFIG.readSettings();
            settings[field.getAttribute('data-space-setting')] = readFieldValue(field);
            applySettings(settings);
        });
        root.addEventListener('click', function(event) {
            var action = event.target.closest('[data-space-action]');
            if (!action) return;
            var type = action.getAttribute('data-space-action');
            if (type === 'open-portal') {
                if (typeof window.PT_switchModeWithTransition === 'function') {
                    window.PT_switchModeWithTransition('portal');
                }
                return;
            }
        });
    }

    return { render: render, bind: bind };
})();

if (typeof window !== 'undefined') {
    window.PT_SPACE_SETTINGS_PANEL = PT_SPACE_SETTINGS_PANEL;
}
