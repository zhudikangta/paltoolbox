var PT_IMMERSIVE_STAGE = (function() {
    function create(canvas, settings) {
        if (!canvas || !window.THREE || !window.PT_IMMERSIVE_PARTICLE_WALL) return null;
        var normalized = window.PT_IMMERSIVE_CONFIG ? window.PT_IMMERSIVE_CONFIG.normalizeSettings(settings) : (settings || {});
        var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setClearColor(0x000000, 0);

        var scene = new THREE.Scene();
        var camera = new THREE.PerspectiveCamera(58, 1, 0.1, 2600);
        camera.position.set(0, 0, 680);

        scene.add(new THREE.AmbientLight(0x7cecff, 0.82));
        var keyLight = new THREE.PointLight(0x8ff4ff, 1.5, 1600);
        keyLight.position.set(160, 120, 420);
        scene.add(keyLight);

        var starField = window.PT_IMMERSIVE_PARTICLE_WALL.createStarField(THREE, normalized);
        var imageField = window.PT_IMMERSIVE_PARTICLE_WALL.createImageField(THREE, null, normalized);
        scene.add(starField);
        scene.add(imageField);

        var state = {
            canvas: canvas,
            root: canvas.closest('.pt-immersive-root'),
            renderer: renderer,
            scene: scene,
            camera: camera,
            keyLight: keyLight,
            starField: starField,
            imageField: imageField,
            settings: normalized,
            cameraDirector: window.PT_IMMERSIVE_CAMERA_DIRECTOR ? window.PT_IMMERSIVE_CAMERA_DIRECTOR.create() : null,
            rafId: 0,
            startedAt: performance.now(),
            pointerX: 0,
            pointerY: 0
        };

        if (window.PT_IMMERSIVE_POST_EFFECTS && state.root) {
            window.PT_IMMERSIVE_POST_EFFECTS.mount(state.root);
            window.PT_IMMERSIVE_POST_EFFECTS.update(state.root, normalized, 0);
        }

        bindPointer(state);
        resize(state);
        window.addEventListener('resize', function() { resize(state); });
        tick(state);
        return state;
    }

    function bindPointer(state) {
        state.canvas.addEventListener('pointermove', function(event) {
            var rect = state.canvas.getBoundingClientRect();
            state.pointerX = ((event.clientX - rect.left) / rect.width - 0.5) || 0;
            state.pointerY = ((event.clientY - rect.top) / rect.height - 0.5) || 0;
        });
    }

    function resize(state) {
        if (!state || !state.canvas) return;
        var rect = state.canvas.getBoundingClientRect();
        var width = Math.max(1, rect.width);
        var height = Math.max(1, rect.height);
        state.camera.aspect = width / height;
        state.camera.updateProjectionMatrix();
        state.renderer.setSize(width, height, false);
    }

    function tick(state) {
        if (!state) return;
        var elapsed = performance.now() - state.startedAt;
        window.PT_IMMERSIVE_PARTICLE_WALL.animateStarField(state.starField, elapsed, state.settings);
        window.PT_IMMERSIVE_PARTICLE_WALL.animateImageField(state.imageField, elapsed, state.settings);
        if (state.cameraDirector && window.PT_IMMERSIVE_CAMERA_DIRECTOR) {
            window.PT_IMMERSIVE_CAMERA_DIRECTOR.update(state.cameraDirector, state.camera, elapsed, state.pointerX, state.pointerY, state.settings);
        }
        state.keyLight.position.x = Math.sin(elapsed * 0.0004) * 240;
        state.keyLight.position.y = 140 + Math.cos(elapsed * 0.00032) * 80;
        state.renderer.render(state.scene, state.camera);
        if (window.PT_IMMERSIVE_POST_EFFECTS && state.root) {
            var pulse = state.cameraDirector && window.PT_IMMERSIVE_CAMERA_DIRECTOR ? window.PT_IMMERSIVE_CAMERA_DIRECTOR.getPulse(state.cameraDirector) : 0;
            window.PT_IMMERSIVE_POST_EFFECTS.update(state.root, state.settings, pulse);
        }
        state.rafId = requestAnimationFrame(function() { tick(state); });
    }

    function updateSettings(state, settings) {
        if (!state) return;
        state.settings = window.PT_IMMERSIVE_CONFIG ? window.PT_IMMERSIVE_CONFIG.normalizeSettings(settings) : settings;
        if (state.starField && state.starField.material) {
            state.starField.material.size = state.settings.particleSize || 2.4;
        }
        if (state.imageField && state.imageField.material) {
            state.imageField.material.size = (state.settings.particleSize || 2.4) * 1.28;
        }
    }

    function setImage(state, dataUrl) {
        if (!state || !dataUrl || !window.PT_IMMERSIVE_PARTICLE_WALL) return;
        var image = new Image();
        image.onload = function() {
            var imageData = window.PT_IMMERSIVE_PARTICLE_WALL.sampleImage(image, state.settings);
            state.imageField = window.PT_IMMERSIVE_PARTICLE_WALL.replaceImageField(THREE, state.scene, state.imageField, imageData, state.settings);
        };
        image.src = dataUrl;
    }

    function focusTool(state, toolIndex, total) {
        if (!state || !state.cameraDirector || !window.PT_IMMERSIVE_CAMERA_DIRECTOR) return;
        window.PT_IMMERSIVE_CAMERA_DIRECTOR.focusTool(state.cameraDirector, toolIndex, total, performance.now());
    }

    function destroy(state) {
        if (!state) return;
        cancelAnimationFrame(state.rafId);
        [state.starField, state.imageField].forEach(function(points) {
            if (!points) return;
            if (points.geometry) points.geometry.dispose();
            if (points.material) points.material.dispose();
        });
        state.renderer.dispose();
    }

    return {
        create: create,
        updateSettings: updateSettings,
        setImage: setImage,
        focusTool: focusTool,
        destroy: destroy
    };
})();

if (typeof window !== 'undefined') {
    window.PT_IMMERSIVE_STAGE = PT_IMMERSIVE_STAGE;
}
