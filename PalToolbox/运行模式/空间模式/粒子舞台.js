var PT_SPACE_STAGE = (function() {
    var THREE = typeof window !== 'undefined' ? window.THREE : null;
    if (!THREE) return { create: function() { return null; } };

    var STAR_COUNT = 160;
    var STREAM_COUNT = 32;
    var DPR_CAP = 1.6;

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function randomRange(min, max) {
        return min + Math.random() * (max - min);
    }

    function createDotTexture() {
        var canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        var ctx = canvas.getContext('2d');
        var gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.22, 'rgba(255,255,255,0.86)');
        gradient.addColorStop(0.54, 'rgba(255,255,255,0.18)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
        var texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    function createAtmosphere(settings) {
        var count = Math.round(STAR_COUNT * clamp((settings.particleDensity || 88) / 88, 0.45, 1.65));
        var positions = new Float32Array(count * 3);
        var colors = new Float32Array(count * 3);
        var phases = new Float32Array(count);
        var radii = new Float32Array(count);
        for (var i = 0; i < count; i++) {
            var angle = Math.random() * Math.PI * 2;
            var radius = randomRange(13, 26);
            var height = randomRange(-3.2, 3.2);
            var i3 = i * 3;
            positions[i3] = Math.cos(angle) * radius;
            positions[i3 + 1] = height;
            positions[i3 + 2] = Math.sin(angle) * radius;
            var warmth = Math.random();
            colors[i3] = 0.42 + warmth * 0.12;
            colors[i3 + 1] = 0.70 + warmth * 0.16;
            colors[i3 + 2] = 0.92;
            phases[i] = Math.random() * Math.PI * 2;
            radii[i] = radius;
        }
        var geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
        geometry.userData.base = positions.slice(0);
        geometry.userData.radii = radii;
        var material = new THREE.PointsMaterial({
            size: (settings.particleSize || 2.6) * 0.18,
            map: createDotTexture(),
            vertexColors: true,
            transparent: true,
            opacity: 0.1,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        var points = new THREE.Points(geometry, material);
        points.frustumCulled = false;
        points.renderOrder = 0;
        return points;
    }

    function createStreams(settings) {
        var count = Math.round(STREAM_COUNT * clamp((settings.particleDensity || 88) / 88, 0.45, 1.55));
        var positions = new Float32Array(count * 3);
        var colors = new Float32Array(count * 3);
        for (var i = 0; i < count; i++) {
            var lane = i / count;
            var angle = lane * Math.PI * 2 * 3.2 + Math.random() * 0.28;
            var radius = 8.2 + Math.sin(lane * Math.PI * 2) * 0.9 + Math.random() * 0.7;
            var i3 = i * 3;
            positions[i3] = Math.cos(angle) * radius;
            positions[i3 + 1] = (lane - 0.5) * 5.2 + Math.sin(angle) * 0.45;
            positions[i3 + 2] = Math.sin(angle) * radius - 2.2;
            colors[i3] = 0.48;
            colors[i3 + 1] = 0.72;
            colors[i3 + 2] = 0.92;
        }
        var geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.userData.base = positions.slice(0);
        var material = new THREE.PointsMaterial({
            size: (settings.particleSize || 2.6) * 0.34,
            map: createDotTexture(),
            vertexColors: true,
            transparent: true,
            opacity: 0.08,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        var points = new THREE.Points(geometry, material);
        points.frustumCulled = false;
        points.renderOrder = 1;
        return points;
    }

    function createGlowRing() {
        var group = new THREE.Group();
        for (var i = 0; i < 3; i++) {
            var geo = new THREE.RingGeometry(4.6 + i * 1.2, 4.63 + i * 1.2, 160);
            var mat = new THREE.MeshBasicMaterial({
                color: i === 0 ? 0x78ecff : i === 1 ? 0x9df7ff : 0x7b8cff,
                transparent: true,
                opacity: 0.018 - i * 0.004,
                side: THREE.DoubleSide,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });
            var ring = new THREE.Mesh(geo, mat);
            ring.rotation.x = Math.PI / 2 + i * 0.12;
            ring.rotation.z = i * 0.8;
            group.add(ring);
        }
        return group;
    }

    function create(canvas, settings) {
        if (!canvas) return null;
        settings = settings || {};
        var width = window.innerWidth || 1920;
        var height = window.innerHeight || 1080;
        var dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
        var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
        renderer.setPixelRatio(dpr);
        renderer.setSize(width, height, false);
        renderer.setClearColor(0x000000, 0);
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'block';

        var scene = new THREE.Scene();
        var camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 90);
        camera.position.set(0, 1.2, 13);
        camera.lookAt(0, 0, 0);

        var atmosphere = createAtmosphere(settings);
        var streams = createStreams(settings);
        var glowRing = createGlowRing();
        scene.add(atmosphere);
        scene.add(streams);
        scene.add(glowRing);

        var state = {
            canvas: canvas,
            renderer: renderer,
            scene: scene,
            camera: camera,
            atmosphere: atmosphere,
            streams: streams,
            glowRing: glowRing,
            settings: settings,
            pointerX: 0,
            pointerY: 0,
            focusIndex: 0,
            focusTotal: 1,
            switchPulse: 0,
            viewTheta: -18 * Math.PI / 180,
            viewPhi: 7 * Math.PI / 180,
            viewDepth: 0,
            startedAt: performance.now(),
            rafId: 0
        };

        canvas.addEventListener('pointermove', function(event) {
            var rect = canvas.getBoundingClientRect();
            state.pointerX = (event.clientX - rect.left) / rect.width - 0.5;
            state.pointerY = (event.clientY - rect.top) / rect.height - 0.5;
        });

        window.addEventListener('resize', function() {
            var nextW = window.innerWidth || 1920;
            var nextH = window.innerHeight || 1080;
            state.camera.aspect = nextW / nextH;
            state.camera.updateProjectionMatrix();
            state.renderer.setSize(nextW, nextH, false);
        });

        tick(state);
        return state;
    }

    function animatePoints(points, elapsed, settings, focusIndex, focusTotal, kind) {
        if (!points || !points.geometry) return;
        var base = points.geometry.userData.base;
        var pos = points.geometry.getAttribute('position');
        var phase = points.geometry.getAttribute('aPhase');
        if (!base || !pos) return;
        var speed = (settings.motionSpeed || 72) / 100;
        if (settings.reduceMotion) speed = 0.08;
        var focus = focusTotal > 0 ? focusIndex / focusTotal * Math.PI * 2 : 0;
        var drift = elapsed * 0.00008 * speed;
        for (var i = 0; i < pos.count; i++) {
            var i3 = i * 3;
            var p = phase ? phase.getX(i) : i * 0.017;
            var angle = drift + p + focus * 0.12;
            var pulse = Math.sin(elapsed * 0.00038 * speed + p) * 0.32;
            var orbit = kind === 'stream' ? 0.42 : 0.74;
            pos.array[i3] = base[i3] + Math.cos(angle) * orbit + pulse * 0.18;
            pos.array[i3 + 1] = base[i3 + 1] + Math.sin(angle * 0.7) * (kind === 'stream' ? 0.18 : 0.42);
            pos.array[i3 + 2] = base[i3 + 2] + Math.sin(angle) * orbit;
        }
        pos.needsUpdate = true;
    }

    function tick(state) {
        if (!state) return;
        var elapsed = performance.now() - state.startedAt;
        var settings = state.settings || {};
        animatePoints(state.atmosphere, elapsed, settings, state.focusIndex, state.focusTotal, 'atmosphere');
        animatePoints(state.streams, elapsed, settings, state.focusIndex, state.focusTotal, 'stream');
        var motion = (settings.cameraMotion || 70) / 140;
        if (settings.reduceMotion) motion = 0;
        var radius = clamp(13 - state.viewDepth / 95, 8, 18);
        var yaw = state.viewTheta + state.pointerX * 0.16 * motion;
        var pitch = state.viewPhi - state.pointerY * 0.12 * motion;
        var targetX = Math.sin(yaw) * Math.cos(pitch) * radius;
        var targetY = 1.2 + Math.sin(pitch) * radius * 0.52;
        var targetZ = Math.cos(yaw) * Math.cos(pitch) * radius;
        state.camera.position.x += (targetX - state.camera.position.x) * 0.06;
        state.camera.position.y += (targetY - state.camera.position.y) * 0.06;
        state.camera.position.z += (targetZ - state.camera.position.z) * 0.06;
        state.camera.lookAt(0, 0, 0);
        state.glowRing.rotation.z += 0.0007 * ((settings.motionSpeed || 72) / 100);
        state.switchPulse *= 0.92;
        state.glowRing.scale.setScalar(1 + state.switchPulse * 0.18);
        state.atmosphere.material.size = (settings.particleSize || 2.6) * (0.18 + state.switchPulse * 0.04);
        state.streams.material.size = (settings.particleSize || 2.6) * (0.24 + state.switchPulse * 0.05);
        state.atmosphere.material.opacity = clamp((settings.glowStrength || 104) / 140 * (0.1 + state.switchPulse * 0.08), 0.025, 0.16);
        state.streams.material.opacity = clamp((settings.glowStrength || 104) / 140 * (0.08 + state.switchPulse * 0.06), 0.02, 0.13);
        state.renderer.render(state.scene, state.camera);
        state.rafId = requestAnimationFrame(function() { tick(state); });
    }

    function focusTool(state, toolIndex, total) {
        if (!state) return;
        state.focusIndex = Math.max(0, toolIndex || 0);
        state.focusTotal = Math.max(1, total || 1);
        state.glowRing.scale.setScalar(1.04);
        setTimeout(function() {
            if (state && state.glowRing) state.glowRing.scale.setScalar(1);
        }, 180);
    }

    function updateSettings(state, settings) {
        if (!state) return;
        state.settings = settings || {};
    }

    function emitSwitchBurst(state, toolIndex, total) {
        if (!state) return;
        state.focusIndex = Math.max(0, toolIndex || 0);
        state.focusTotal = Math.max(1, total || 1);
        state.switchPulse = 1;
    }

    function setView(state, view) {
        if (!state || !view) return;
        state.viewTheta = ((view.yaw || 0) * Math.PI) / 180;
        state.viewPhi = ((view.pitch || 0) * Math.PI) / 180;
        state.viewDepth = view.depth || 0;
    }

    function setCoverImage(state, dataUrl) {
        if (!state || !dataUrl) return;
        state.settings.coverImage = dataUrl;
        if (window.PT_SPACE_CONFIG) window.PT_SPACE_CONFIG.writeSettings(state.settings);
    }

    function destroy(state) {
        if (!state) return;
        cancelAnimationFrame(state.rafId);
        [state.atmosphere, state.streams].forEach(function(points) {
            if (!points) return;
            if (points.geometry) points.geometry.dispose();
            if (points.material) {
                if (points.material.map) points.material.map.dispose();
                points.material.dispose();
            }
        });
        if (state.glowRing) {
            state.glowRing.children.forEach(function(child) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        }
        if (state.renderer) state.renderer.dispose();
    }

    return {
        create: create,
        focusTool: focusTool,
        updateSettings: updateSettings,
        emitSwitchBurst: emitSwitchBurst,
        setView: setView,
        setCoverImage: setCoverImage,
        destroy: destroy
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PT_SPACE_STAGE: PT_SPACE_STAGE };
}
if (typeof window !== 'undefined') {
    window.PT_SPACE_STAGE = PT_SPACE_STAGE;
}
