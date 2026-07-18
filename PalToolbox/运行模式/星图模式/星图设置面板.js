var PT_STARCHART_SETTINGS_PANEL = (function() {
    var tuningTimer = 0;

    function slider(label, field, min, max, value, suffix) {
        return [
            '<label class="pt-immersive-setting-row">',
            '<span>', label, '</span>',
            '<input type="range" min="', min, '" max="', max, '" value="', value, '" data-starchart-setting="', field, '">',
            '<b data-starchart-value="', field, '">', value, suffix || '', '</b>',
            '</label>'
        ].join('');
    }

    function render() {
        var settings = window.PT_STARCHART_CONFIG ? window.PT_STARCHART_CONFIG.readSettings() : {};
        var html = '<div class="pt-immersive-settings">';
        html += '<div class="pt-immersive-settings-grid">';
        html += '<button type="button" class="pt-immersive-btn" data-starchart-action="open-portal">进入模式选择</button>';
        html += slider('星场密度', 'starDensity', 16, 160, Math.round(settings.starDensity || 72), '');
        html += slider('轨道速度', 'orbitSpeed', 10, 140, Math.round(settings.orbitSpeed || 62), '%');
        html += slider('行星尺寸', 'planetSize', 60, 160, Math.round(settings.planetSize || 100), '%');
        html += slider('轨道间距', 'orbitSpacing', 72, 140, Math.round(settings.orbitSpacing || 100), '%');
        html += slider('发光强度', 'glowIntensity', 0, 140, Math.round(settings.glowIntensity || 88), '%');
        html += slider('拟真光照', 'sunlightIntensity', 20, 160, Math.round(settings.sunlightIntensity || 96), '%');
        html += slider('镜头幅度', 'cameraMotion', 0, 140, Math.round(settings.cameraMotion || 70), '%');
        html += '<label class="pt-immersive-setting-row"><span>显示标签</span><input type="checkbox" data-starchart-setting="labelVisible"' + (settings.labelVisible !== false ? ' checked' : '') + '></label>';
        html += '<label class="pt-immersive-setting-row"><span>显示轨道</span><input type="checkbox" data-starchart-setting="orbitVisible"' + (settings.orbitVisible !== false ? ' checked' : '') + '></label>';
        html += '<label class="pt-immersive-setting-row"><span>减少动效</span><input type="checkbox" data-starchart-setting="reduceMotion"' + (settings.reduceMotion ? ' checked' : '') + '></label>';
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
        var next = window.PT_STARCHART_CONFIG.writeSettings(settings);
        if (window.PT_STARCHART_STAGE_INSTANCE && window.PT_STARCHART_STAGE) {
            window.PT_STARCHART_STAGE.updateSettings(window.PT_STARCHART_STAGE_INSTANCE, next);
        }
        pulseTuningFeedback(next);
    }

    function pulseTuningFeedback(settings) {
        var root = document.querySelector('.pt-starchart-root');
        if (!root) return;
        root.classList.add('pt-starchart-root--tuning');
        clearTimeout(tuningTimer);
        tuningTimer = setTimeout(function() {
            root.classList.remove('pt-starchart-root--tuning');
        }, 260);
    }

    function bind(root) {
        if (!root || !window.PT_STARCHART_CONFIG) return;
        root.addEventListener('input', function(event) {
            var field = event.target.closest('[data-starchart-setting]');
            if (!field) return;
            var settings = window.PT_STARCHART_CONFIG.readSettings();
            var key = field.getAttribute('data-starchart-setting');
            settings[key] = readFieldValue(field);
            applySettings(settings);
            var valueNode = root.querySelector('[data-starchart-value="' + key + '"]');
            if (valueNode) valueNode.textContent = field.value + (key === 'orbitSpeed' || key === 'planetSize' || key === 'orbitSpacing' || key === 'glowIntensity' || key === 'sunlightIntensity' || key === 'cameraMotion' ? '%' : '');
        });
        root.addEventListener('change', function(event) {
            var field = event.target.closest('[data-starchart-setting]');
            if (!field) return;
            var settings = window.PT_STARCHART_CONFIG.readSettings();
            settings[field.getAttribute('data-starchart-setting')] = readFieldValue(field);
            applySettings(settings);
        });
        root.addEventListener('click', function(event) {
            var action = event.target.closest('[data-starchart-action]');
            if (!action) return;
            var type = action.getAttribute('data-starchart-action');
            if (type === 'open-portal') {
                if (typeof window.PT_switchModeWithTransition === 'function') {
                    window.PT_switchModeWithTransition('portal');
                }
            }
        });
    }

    return { render: render, bind: bind };
})();

if (typeof window !== 'undefined') {
    window.PT_STARCHART_SETTINGS_PANEL = PT_STARCHART_SETTINGS_PANEL;
}
