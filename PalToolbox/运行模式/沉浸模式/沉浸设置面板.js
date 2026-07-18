var PT_IMMERSIVE_SETTINGS_PANEL = (function() {
    var tuningTimer = 0;

    function slider(label, field, min, max, value, suffix) {
        return [
            '<label class="pt-immersive-setting-row">',
            '<span>', label, '</span>',
            '<input type="range" min="', min, '" max="', max, '" value="', value, '" data-immersive-setting="', field, '">',
            '<b data-immersive-value="', field, '">', value, suffix || '', '</b>',
            '</label>'
        ].join('');
    }

    function render() {
        var settings = window.PT_IMMERSIVE_CONFIG ? window.PT_IMMERSIVE_CONFIG.readSettings() : {};
        var html = '<div class="pt-immersive-settings">';
        html += '<div class="pt-immersive-panel__head"><div><span class="pt-immersive-kicker">沉浸 / 效果</span><h1>设置</h1></div><button type="button" class="pt-immersive-btn" data-immersive-action="open-portal">进入模式选择</button></div>';
        html += '<div class="pt-immersive-settings-grid">';
        html += slider('粒子密度', 'particleDensity', 16, 160, Math.round(settings.particleDensity || 72), '');
        html += slider('粒子尺寸', 'particleSize', 1, 6, Math.round(settings.particleSize || 2), '');
        html += slider('辉光强度', 'glowStrength', 0, 140, Math.round(settings.glowStrength || 86), '%');
        html += slider('镜头幅度', 'cameraMotion', 0, 140, Math.round(settings.cameraMotion || 74), '%');
        html += slider('动效速度', 'motionSpeed', 10, 140, Math.round(settings.motionSpeed || 68), '%');
        html += '<label class="pt-immersive-setting-row"><span>背景风格</span><select class="pt-immersive-select" data-immersive-setting="backgroundStyle"><option value="particle-wall"' + (settings.backgroundStyle === 'particle-wall' ? ' selected' : '') + '>粒子幕墙</option><option value="black-hole"' + (settings.backgroundStyle === 'black-hole' ? ' selected' : '') + '>放射线黑洞</option><option value="stardust"' + (settings.backgroundStyle === 'stardust' ? ' selected' : '') + '>星尘空间</option></select></label>';
        html += '<label class="pt-immersive-setting-row"><span>减少动效</span><input type="checkbox" data-immersive-setting="reduceMotion"' + (settings.reduceMotion ? ' checked' : '') + '></label>';
        html += '<div class="pt-immersive-setting-row"><span>图片粒子幕墙</span><button type="button" class="pt-immersive-btn" data-immersive-action="upload-particle-image">上传图片</button><input type="file" accept="image/*" id="pt-immersive-image-upload" style="display:none"></div>';
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
        var next = window.PT_IMMERSIVE_CONFIG.writeSettings(settings);
        if (window.PT_IMMERSIVE_STAGE_INSTANCE && window.PT_IMMERSIVE_STAGE) {
            window.PT_IMMERSIVE_STAGE.updateSettings(window.PT_IMMERSIVE_STAGE_INSTANCE, next);
        }
        pulseTuningFeedback(next);
    }

    function pulseTuningFeedback(settings) {
        var root = document.querySelector('.pt-immersive-root');
        if (!root) return;
        root.setAttribute('data-immersive-background', settings.backgroundStyle || 'particle-wall');
        root.classList.add('pt-immersive-root--tuning');
        clearTimeout(tuningTimer);
        tuningTimer = setTimeout(function() {
            root.classList.remove('pt-immersive-root--tuning');
        }, 260);
    }

    function bind(root) {
        if (!root || !window.PT_IMMERSIVE_CONFIG) return;

        root.addEventListener('input', function(event) {
            var field = event.target.closest('[data-immersive-setting]');
            if (!field) return;
            var settings = window.PT_IMMERSIVE_CONFIG.readSettings();
            var key = field.getAttribute('data-immersive-setting');
            settings[key] = readFieldValue(field);
            applySettings(settings);
            var valueNode = root.querySelector('[data-immersive-value="' + key + '"]');
            if (valueNode) valueNode.textContent = field.value + (key === 'glowStrength' || key === 'cameraMotion' || key === 'motionSpeed' ? '%' : '');
        });

        root.addEventListener('change', function(event) {
            var field = event.target.closest('[data-immersive-setting]');
            if (!field) return;
            var settings = window.PT_IMMERSIVE_CONFIG.readSettings();
            settings[field.getAttribute('data-immersive-setting')] = readFieldValue(field);
            applySettings(settings);
        });

        root.addEventListener('click', function(event) {
            var action = event.target.closest('[data-immersive-action]');
            if (!action) return;
            var type = action.getAttribute('data-immersive-action');
            if (type === 'open-portal') {
                if (typeof window.PT_switchModeWithTransition === 'function') {
                    window.PT_switchModeWithTransition('portal');
                }
                return;
            }
            if (type === 'upload-particle-image') {
                var fileInput = root.querySelector('#pt-immersive-image-upload');
                if (fileInput) fileInput.click();
            }
        });

        var fileInput = root.querySelector('#pt-immersive-image-upload');
        if (fileInput) {
            fileInput.addEventListener('change', function() {
                if (!fileInput.files || !fileInput.files[0]) return;
                var reader = new FileReader();
                reader.onload = function() {
                    var settings = window.PT_IMMERSIVE_CONFIG.readSettings();
                    settings.particleImage = reader.result;
                    applySettings(settings);
                    if (window.PT_IMMERSIVE_STAGE_INSTANCE && window.PT_IMMERSIVE_STAGE) {
                        window.PT_IMMERSIVE_STAGE.setImage(window.PT_IMMERSIVE_STAGE_INSTANCE, reader.result);
                    }
                };
                reader.readAsDataURL(fileInput.files[0]);
                fileInput.value = '';
            });
        }
    }

    return { render: render, bind: bind };
})();

if (typeof window !== 'undefined') {
    window.PT_IMMERSIVE_SETTINGS_PANEL = PT_IMMERSIVE_SETTINGS_PANEL;
}
