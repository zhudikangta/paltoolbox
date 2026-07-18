var PT_STARCHART_STAGE = (function() {
    var rafId = 0;

    function create(canvas, settings) {
        if (!canvas || !window.THREE || !window.PT_STARCHART_CELESTIAL || !window.PT_STARCHART_CAMERA) return null;
        var THREE = window.THREE;
        var celestial = window.PT_STARCHART_CELESTIAL;
        var width = window.innerWidth || 1920;
        var height = window.innerHeight || 1080;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(width, height, false);
        renderer.setClearColor(0x000000, 0);
        var scene = new THREE.Scene();
        var camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 260);
        camera.position.set(0, 42, 1.3);
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();
        var ambientLight = new THREE.AmbientLight(0x334466, 0.5);
        scene.add(ambientLight);
        var sunLight = new THREE.PointLight(0xffcc66, (settings.sunlightIntensity || 96) / 40, 90);
        sunLight.position.set(0, 0, 0);
        scene.add(sunLight);
        var stars = celestial.createStarBackground(THREE, settings);
        scene.add(stars);
        var tools = window.PT_STARCHART_CONFIG ? window.PT_STARCHART_CONFIG.getTools() : [];
        var systemData = celestial.createSystem(THREE, settings, tools);
        scene.add(systemData.system);
        var camState = window.PT_STARCHART_CAMERA.create(camera);
        var mouseNormX = 0;
        var mouseNormY = 0;
        var startedAt = performance.now();
        var lastClickX = 0;
        var lastClickY = 0;
        var raycaster = new THREE.Raycaster();
        var mouse = new THREE.Vector2();
        var state = {
            renderer: renderer,
            scene: scene,
            camera: camera,
            camState: camState,
            stars: stars,
            systemData: systemData,
            settings: settings,
            mouseNormX: 0,
            mouseNormY: 0,
            startedAt: startedAt,
            onToolSelect: null,
            onOverview: null
        };
        canvas.addEventListener('pointermove', function(event) {
            var r = canvas.getBoundingClientRect();
            state.mouseNormX = (event.clientX - r.left) / r.width - 0.5;
            state.mouseNormY = (event.clientY - r.top) / r.height - 0.5;
            mouse.x = (event.clientX - r.left) / r.width * 2 - 1;
            mouse.y = -(event.clientY - r.top) / r.height * 2 + 1;
            window.PT_STARCHART_CAMERA.onMouseMove(camState, event.clientX, event.clientY);
        });
        canvas.addEventListener('pointerdown', function(event) {
            lastClickX = event.clientX;
            lastClickY = event.clientY;
            window.PT_STARCHART_CAMERA.onMouseDown(camState, event.clientX, event.clientY);
        });
        canvas.addEventListener('pointerup', function(event) {
            var dx = event.clientX - lastClickX;
            var dy = event.clientY - lastClickY;
            var dist = Math.sqrt(dx * dx + dy * dy);
            window.PT_STARCHART_CAMERA.onMouseUp(camState);
            if (dist < 4) {
                raycaster.setFromCamera(mouse, camera);
                var meshes = [];
                for (var i = 0; i < systemData.planets.length; i++) {
                    if (systemData.planets[i].mesh) meshes.push(systemData.planets[i].mesh);
                }
                var intersects = raycaster.intersectObjects(meshes);
                if (intersects.length > 0) {
                    for (var i = 0; i < systemData.planets.length; i++) {
                        if (systemData.planets[i].mesh === intersects[0].object) {
                            var planet = systemData.planets[i];
                            window.PT_STARCHART_CAMERA.lockPlanet(camState, planet, planet.pivot);
                            if (state.onToolSelect && planet.tool) {
                                state.onToolSelect(planet.tool.id);
                            }
                            break;
                        }
                    }
                } else {
                    window.PT_STARCHART_CAMERA.resetLock(camState);
                    if (state.onOverview) state.onOverview();
                }
            }
        });
        canvas.addEventListener('pointerleave', function() {
            window.PT_STARCHART_CAMERA.onMouseUp(camState);
        });
        canvas.addEventListener('wheel', function(event) {
            event.preventDefault();
            window.PT_STARCHART_CAMERA.onWheel(camState, event.deltaY);
        }, { passive: false });
        window.addEventListener('resize', function() {
            var w = window.innerWidth || 1920;
            var h = window.innerHeight || 1080;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h, false);
        });
        tick(state);
        return state;
    }

    function tick(state) {
        if (!state) return;
        var now = performance.now();
        var elapsed = now - state.startedAt;
        window.PT_STARCHART_CELESTIAL.updateSystem(state.systemData, elapsed, state.settings);
        window.PT_STARCHART_CAMERA.applyPosition(state.camState, state.mouseNormX, state.mouseNormY, state.settings);
        state.stars.rotation.y += 0.00004 * (state.settings.orbitSpeed || 62) / 100;
        var t = elapsed * 0.0005;
        var sunLight = state.scene.children[1];
        if (sunLight && sunLight.isPointLight) {
            sunLight.intensity = (state.settings.sunlightIntensity || 96) / 40 + Math.sin(t) * 0.22;
        }
        state.renderer.render(state.scene, state.camera);
        rafId = requestAnimationFrame(function() { tick(state); });
    }

    function updateSettings(state, settings) {
        if (!state) return;
        state.settings = settings;
        if (state.systemData && state.systemData.sun && state.systemData.sun.glowMaterial) {
            state.systemData.sun.glowMaterial.uniforms.uIntensity.value = (settings.glowIntensity || 88) / 140 * 1.2;
        }
    }

    function focusTool(state, toolId) {
        if (!state || !state.systemData) return;
        for (var i = 0; i < state.systemData.planets.length; i++) {
            var p = state.systemData.planets[i];
            if (p.tool && p.tool.id === toolId) {
                window.PT_STARCHART_CAMERA.lockPlanet(state.camState, p, p.pivot);
                return;
            }
        }
    }

    function setDefaultView(state) {
        if (!state || !window.PT_STARCHART_CAMERA) return;
        window.PT_STARCHART_CAMERA.setDefaultView(state.camState, true);
        if (state.onOverview) state.onOverview();
    }

    function destroy(state) {
        if (!state) return;
        cancelAnimationFrame(rafId);
        if (state.renderer) state.renderer.dispose();
    }

    return {
        create: create,
        updateSettings: updateSettings,
        focusTool: focusTool,
        setDefaultView: setDefaultView,
        destroy: destroy
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PT_STARCHART_STAGE: PT_STARCHART_STAGE };
}
if (typeof window !== 'undefined') {
    window.PT_STARCHART_STAGE = PT_STARCHART_STAGE;
}
