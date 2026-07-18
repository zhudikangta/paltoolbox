var PT_STARCHART_CELESTIAL = (function() {
    var textureCache = {};

    function getTextureBase() {
        if (typeof window !== 'undefined' && window.PT_STARCHART_CONFIG && window.PT_STARCHART_CONFIG.TEXTURE_BASE) {
            return window.PT_STARCHART_CONFIG.TEXTURE_BASE;
        }
        return '../运行模式/星图模式/资源/贴图/';
    }

    function loadTexture(THREE, path, onLoad, onError) {
        if (!path) return null;
        if (textureCache[path]) {
            if (textureCache[path].userData && textureCache[path].userData.loaded && typeof onLoad === 'function') {
                setTimeout(function() { onLoad(textureCache[path]); }, 0);
            }
            return textureCache[path];
        }
        var loader = new THREE.TextureLoader();
        if (typeof loader.setCrossOrigin === 'function') loader.setCrossOrigin(undefined);
        var texture = loader.load(path, function(loadedTexture) {
            loadedTexture.userData = loadedTexture.userData || {};
            loadedTexture.userData.loaded = true;
            if (typeof onLoad === 'function') onLoad(loadedTexture);
        }, undefined, function(error) {
            if (typeof onError === 'function') onError(error);
        });
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.anisotropy = 8;
        textureCache[path] = texture;
        return texture;
    }

    function applyTextureWhenReady(THREE, material, path) {
        if (!material || !path) return null;
        return loadTexture(THREE, path, function(texture) {
            material.map = texture;
            if (material.color && typeof material.color.setHex === 'function') material.color.setHex(0xffffff);
            material.needsUpdate = true;
        });
    }

    function createStarBackground(THREE, settings) {
        var density = Math.round(settings.starDensity || 72);
        var count = density * 54;
        var positions = new Float32Array(count * 3);
        var colors = new Float32Array(count * 3);
        for (var i = 0; i < count; i++) {
            var i3 = i * 3;
            var theta = Math.random() * Math.PI * 2;
            var phi = Math.acos(2 * Math.random() - 1);
            var radius = 64 + Math.random() * 130;
            positions[i3] = Math.sin(phi) * Math.cos(theta) * radius;
            positions[i3 + 1] = Math.sin(phi) * Math.sin(theta) * radius;
            positions[i3 + 2] = Math.cos(phi) * radius;
            var temp = 0.42 + Math.random() * 0.58;
            colors[i3] = 0.62 + temp * 0.38;
            colors[i3 + 1] = 0.68 + temp * 0.28;
            colors[i3 + 2] = 0.82 + temp * 0.18;
        }
        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        var mat = new THREE.PointsMaterial({
            size: 0.28,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true,
            opacity: 0.78
        });
        var points = new THREE.Points(geo, mat);
        points.frustumCulled = false;
        return points;
    }

    function createSun(THREE, settings) {
        var group = new THREE.Group();
        var sunGeo = new THREE.SphereGeometry(2.9, 96, 64);
        var sunMat = new THREE.MeshBasicMaterial({
            color: 0xffd276,
            map: createSunTexture(THREE)
        });
        applyTextureWhenReady(THREE, sunMat, getTextureBase() + 'sun.jpg');
        var sun = new THREE.Mesh(sunGeo, sunMat);
        group.add(sun);

        var glow = createGlowSphere(THREE, new THREE.Color(1, 0.68, 0.25), 5.2, 0.28, settings);
        var outerGlow = createGlowSphere(THREE, new THREE.Color(1, 0.42, 0.12), 8.8, 0.12, settings);
        group.add(glow);
        group.add(outerGlow);
        return { group: group, mesh: sun, glow: glow, outerGlow: outerGlow };
    }

    function createSunTexture(THREE) {
        var canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        var ctx = canvas.getContext('2d');
        var base = ctx.createLinearGradient(0, 0, 512, 256);
        base.addColorStop(0, '#ffb233');
        base.addColorStop(0.35, '#fff08a');
        base.addColorStop(0.7, '#ff7a1f');
        base.addColorStop(1, '#ffcf5d');
        ctx.fillStyle = base;
        ctx.fillRect(0, 0, 512, 256);
        for (var i = 0; i < 160; i++) {
            ctx.fillStyle = 'rgba(255,255,255,' + (0.03 + Math.random() * 0.08) + ')';
            ctx.beginPath();
            ctx.arc(Math.random() * 512, Math.random() * 256, 4 + Math.random() * 18, 0, Math.PI * 2);
            ctx.fill();
        }
        var texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    function createGlowSphere(THREE, color, radius, opacity, settings) {
        var geo = new THREE.SphereGeometry(radius, 48, 32);
        var mat = new THREE.ShaderMaterial({
            uniforms: {
                uColor: { value: color },
                uOpacity: { value: opacity * ((settings.glowIntensity || 88) / 88) }
            },
            vertexShader: [
                'varying vec3 vNormal;',
                'void main(){',
                '  vNormal = normalize(normalMatrix * normal);',
                '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
                '}'
            ].join('\n'),
            fragmentShader: [
                'varying vec3 vNormal;',
                'uniform vec3 uColor;',
                'uniform float uOpacity;',
                'void main(){',
                '  float edge = pow(0.74 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.4);',
                '  gl_FragColor = vec4(uColor, max(0.0, edge) * uOpacity);',
                '}'
            ].join('\n'),
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        return new THREE.Mesh(geo, mat);
    }

    function createPlanetTexture(THREE, type) {
        var canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        var ctx = canvas.getContext('2d');
        drawPlanetTexture(ctx, type, canvas.width, canvas.height);
        var texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.anisotropy = 4;
        return texture;
    }

    function resolvePlanetTexture(THREE, tool) {
        return loadTexture(THREE, tool.texturePath) || createPlanetTexture(THREE, tool.planetTexture);
    }

    function drawPlanetTexture(ctx, type, width, height) {
        var palette = getPlanetPalette(type);
        var grad = ctx.createLinearGradient(0, 0, width, height);
        for (var i = 0; i < palette.length; i++) {
            grad.addColorStop(palette[i][0], palette[i][1]);
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        if (type === 'jupiter' || type === 'saturn') {
            drawBands(ctx, width, height, type);
        } else if (type === 'earth') {
            drawEarth(ctx, width, height);
        } else if (type === 'venus') {
            drawClouds(ctx, width, height, '#fff0ba', '#c98e42', 42);
        } else if (type === 'mars') {
            drawClouds(ctx, width, height, '#f0a06a', '#6f2e20', 34);
        } else if (type === 'mercury') {
            drawCraters(ctx, width, height);
        } else if (type === 'uranus' || type === 'neptune') {
            drawSoftStorms(ctx, width, height, type);
        }
    }

    function getPlanetPalette(type) {
        var palettes = {
            mercury: [[0, '#5a5a58'], [0.45, '#9b978d'], [1, '#353532']],
            venus: [[0, '#b47933'], [0.5, '#f4d389'], [1, '#8e5f2b']],
            earth: [[0, '#0d4272'], [0.5, '#1b8fc5'], [1, '#0b2e52']],
            mars: [[0, '#5d2118'], [0.45, '#c76338'], [1, '#7a2f1e']],
            jupiter: [[0, '#7a5437'], [0.5, '#d9bb86'], [1, '#8a6045']],
            saturn: [[0, '#7b6a45'], [0.5, '#d7c38b'], [1, '#8f7a52']],
            uranus: [[0, '#6dc9d8'], [0.55, '#a8f0f2'], [1, '#3b94a8']],
            neptune: [[0, '#183a8a'], [0.5, '#2b65dc'], [1, '#0d1e5f']]
        };
        return palettes[type] || palettes.earth;
    }

    function drawBands(ctx, width, height, type) {
        for (var y = 0; y < height; y += 8 + Math.random() * 12) {
            var alpha = type === 'jupiter' ? 0.12 + Math.random() * 0.18 : 0.08 + Math.random() * 0.12;
            ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,246,210,' + alpha + ')' : 'rgba(90,55,35,' + alpha + ')';
            ctx.fillRect(0, y, width, 3 + Math.random() * 9);
        }
        if (type === 'jupiter') {
            ctx.fillStyle = 'rgba(150,62,38,0.48)';
            ctx.beginPath();
            ctx.ellipse(width * 0.68, height * 0.55, 34, 15, -0.18, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawEarth(ctx, width, height) {
        ctx.fillStyle = 'rgba(38,132,79,0.72)';
        for (var i = 0; i < 12; i++) {
            ctx.beginPath();
            var x = Math.random() * width;
            var y = Math.random() * height;
            ctx.ellipse(x, y, 30 + Math.random() * 54, 10 + Math.random() * 26, Math.random() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }
        drawClouds(ctx, width, height, '#ffffff', '#d7f2ff', 24);
    }

    function drawClouds(ctx, width, height, a, b, count) {
        for (var i = 0; i < count; i++) {
            ctx.fillStyle = i % 2 ? hexToRgba(a, 0.18 + Math.random() * 0.18) : hexToRgba(b, 0.12 + Math.random() * 0.16);
            ctx.beginPath();
            ctx.ellipse(Math.random() * width, Math.random() * height, 32 + Math.random() * 86, 4 + Math.random() * 16, Math.random() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawCraters(ctx, width, height) {
        for (var i = 0; i < 70; i++) {
            var r = 2 + Math.random() * 8;
            ctx.strokeStyle = 'rgba(20,20,20,0.22)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(Math.random() * width, Math.random() * height, r, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    function drawSoftStorms(ctx, width, height, type) {
        var color = type === 'neptune' ? '#b9d2ff' : '#e1ffff';
        for (var i = 0; i < 16; i++) {
            ctx.fillStyle = hexToRgba(color, 0.08 + Math.random() * 0.1);
            ctx.beginPath();
            ctx.ellipse(Math.random() * width, Math.random() * height, 40 + Math.random() * 90, 5 + Math.random() * 16, Math.random() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function hexToRgba(hex, alpha) {
        var clean = hex.replace('#', '');
        var num = parseInt(clean, 16);
        var r = (num >> 16) & 255;
        var g = (num >> 8) & 255;
        var b = num & 255;
        return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
    }

    function createSolarPlanet(THREE, tool, settings) {
        var group = new THREE.Group();
        var scale = (settings.planetSize || 100) / 100;
        var radius = tool.visualRadius * scale;
        var geo = new THREE.SphereGeometry(radius, 72, 48);
        var texture = resolvePlanetTexture(THREE, tool);
        var mat = new THREE.MeshStandardMaterial({
            map: texture,
            color: 0xffffff,
            roughness: tool.planetTexture === 'earth' ? 0.62 : 0.78,
            metalness: 0.02,
            emissive: new THREE.Color(0xffffff),
            emissiveMap: texture,
            emissiveIntensity: 0.34
        });
        var mesh = new THREE.Mesh(geo, mat);
        group.add(mesh);

        if (tool.ringSystem) addPlanetRing(THREE, group, radius, tool.ringSystem, tool.ringTexturePath);
        var moons = createMoons(THREE, group, tool, radius);
        var label = createPlanetLabel(THREE, tool, radius);
        group.add(label);
        return {
            group: group,
            mesh: mesh,
            label: label,
            tool: tool,
            orbitDistance: tool.orbitDistance,
            orbitAngle: typeof tool.startAngle === 'number' ? tool.startAngle : Math.random() * Math.PI * 2,
            orbitSpeed: tool.orbitSpeedFactor || 1,
            orbitTilt: tool.orbitTilt || 0,
            texture: texture,
            moons: moons
        };
    }

    function addPlanetRing(THREE, group, radius, type, texturePath) {
        var inner = type === 'saturn' ? radius * 1.45 : radius * 1.22;
        var outer = type === 'saturn' ? radius * 2.35 : radius * 1.55;
        var geo = new THREE.RingGeometry(inner, outer, 160);
        var ringTexture = loadTexture(THREE, texturePath);
        var mat = new THREE.MeshBasicMaterial({
            color: type === 'saturn' ? 0xd8c58d : 0x9bdff0,
            map: ringTexture || null,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: type === 'saturn' ? 0.56 : 0.18,
            depthWrite: false
        });
        var ring = new THREE.Mesh(geo, mat);
        ring.rotation.x = Math.PI / 2.25;
        ring.rotation.z = -0.18;
        group.add(ring);
    }

    function createMoons(THREE, group, tool, radius) {
        var moons = [];
        if (!tool.moons || !tool.moons.length) return moons;
        for (var i = 0; i < tool.moons.length; i++) {
            var moonData = tool.moons[i];
            var pivot = new THREE.Group();
            var moonGeo = new THREE.SphereGeometry(moonData.radius || radius * 0.18, 32, 20);
            var moonTexture = loadTexture(THREE, moonData.texturePath);
            var moonMat = new THREE.MeshStandardMaterial({
                map: moonTexture || null,
                emissiveMap: moonTexture || null,
                color: moonTexture ? 0xffffff : 0xb7b7ad,
                emissive: new THREE.Color(moonTexture ? 0xffffff : 0x777777),
                emissiveIntensity: moonTexture ? 0.28 : 0.16,
                roughness: 0.9
            });
            var moon = new THREE.Mesh(moonGeo, moonMat);
            moon.position.set(moonData.distance || radius * 1.9, 0, 0);
            pivot.rotation.y = moonData.startAngle || i * 1.7;
            pivot.add(moon);
            group.add(pivot);
            moons.push({ pivot: pivot, mesh: moon, speed: moonData.speed || 0.012 });
        }
        return moons;
    }

    function createPlanetLabel(THREE, tool, radius) {
        var canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 96;
        var ctx = canvas.getContext('2d');
        ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(255,255,255,0.94)';
        ctx.fillText(tool.solarName, 160, 30);
        ctx.font = '18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.fillStyle = tool.status === 'placeholder' ? 'rgba(255,255,255,0.42)' : 'rgba(185,238,255,0.70)';
        ctx.fillText(tool.shortTitle + (tool.status === 'placeholder' ? ' / 待接入' : ''), 160, 66);
        var tex = new THREE.CanvasTexture(canvas);
        tex.minFilter = THREE.LinearFilter;
        var geo = new THREE.PlaneGeometry(2.1, 0.63);
        var mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false });
        var label = new THREE.Mesh(geo, mat);
        label.position.set(0, radius + 0.62, 0);
        return label;
    }

    function createOrbitLine(THREE, radius, tilt) {
        var segments = 220;
        var points = [];
        for (var i = 0; i <= segments; i++) {
            var angle = (i / segments) * Math.PI * 2;
            points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
        }
        var geo = new THREE.BufferGeometry().setFromPoints(points);
        var mat = new THREE.LineBasicMaterial({ color: 0x4d6478, transparent: true, opacity: 0.22, depthWrite: false });
        var line = new THREE.Line(geo, mat);
        line.rotation.x = tilt || 0;
        return line;
    }

    function createAsteroidBelt(THREE, radius) {
        var count = 360;
        var positions = new Float32Array(count * 3);
        for (var i = 0; i < count; i++) {
            var angle = Math.random() * Math.PI * 2;
            var dist = radius + (Math.random() - 0.5) * 0.9;
            var i3 = i * 3;
            positions[i3] = Math.cos(angle) * dist;
            positions[i3 + 1] = (Math.random() - 0.5) * 0.12;
            positions[i3 + 2] = Math.sin(angle) * dist;
        }
        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        var mat = new THREE.PointsMaterial({ size: 0.035, color: 0xb7aa8a, transparent: true, opacity: 0.42, depthWrite: false });
        return new THREE.Points(geo, mat);
    }

    function createSolarSystem(THREE, settings, tools) {
        var system = new THREE.Group();
        var sun = createSun(THREE, settings);
        system.add(sun.group);
        var orbitGroup = new THREE.Group();
        var planets = [];
        var spacing = (settings.orbitSpacing || 100) / 100;
        for (var i = 0; i < tools.length; i++) {
            var tool = tools[i];
            var orbitDistance = tool.orbitDistance * spacing;
            var orbitLine = createOrbitLine(THREE, orbitDistance, tool.orbitTilt || 0);
            orbitGroup.add(orbitLine);

            var planet = createSolarPlanet(THREE, tool, settings);
            planet.orbitDistance = orbitDistance;
            planet.orbitLine = orbitLine;
            var pivot = new THREE.Group();
            pivot.rotation.x = tool.orbitTilt || 0;
            pivot.position.set(Math.cos(planet.orbitAngle) * orbitDistance, 0, Math.sin(planet.orbitAngle) * orbitDistance);
            pivot.add(planet.group);
            system.add(pivot);
            planet.pivot = pivot;
            planets.push(planet);
        }
        var asteroidBelt = createAsteroidBelt(THREE, 9.45 * spacing);
        system.add(orbitGroup);
        system.add(asteroidBelt);
        return { system: system, sun: sun, planets: planets, orbitGroup: orbitGroup, asteroidBelt: asteroidBelt };
    }

    function updateSystem(systemData, elapsed, settings) {
        if (!systemData || !systemData.planets) return;
        var speed = (settings.orbitSpeed || 62) / 100;
        if (settings.reduceMotion) speed = 0.08;
        var spacing = (settings.orbitSpacing || 100) / 100;
        var glowVal = (settings.glowIntensity || 88) / 88;
        if (systemData.sun) {
            systemData.sun.group.rotation.y += 0.0016 * speed;
            if (systemData.sun.glow && systemData.sun.glow.material.uniforms) {
                systemData.sun.glow.material.uniforms.uOpacity.value = 0.34 * glowVal;
            }
            if (systemData.sun.outerGlow && systemData.sun.outerGlow.material.uniforms) {
                systemData.sun.outerGlow.material.uniforms.uOpacity.value = 0.16 * glowVal;
            }
        }
        if (systemData.orbitGroup) systemData.orbitGroup.visible = settings.orbitVisible !== false;
        if (systemData.asteroidBelt) {
            systemData.asteroidBelt.visible = settings.orbitVisible !== false;
            systemData.asteroidBelt.rotation.y += 0.00025 * speed;
        }
        for (var i = 0; i < systemData.planets.length; i++) {
            var planet = systemData.planets[i];
            var tool = planet.tool || {};
            planet.orbitDistance = tool.orbitDistance * spacing;
            planet.orbitAngle += (planet.orbitSpeed || 1) * speed * 0.006;
            planet.pivot.rotation.x = tool.orbitTilt || 0;
            planet.pivot.position.set(Math.cos(planet.orbitAngle) * planet.orbitDistance, 0, Math.sin(planet.orbitAngle) * planet.orbitDistance);
            planet.group.rotation.y += 0.0028 * speed * (tool.planetTexture === 'venus' ? -0.4 : 1);
            if (planet.label) planet.label.visible = settings.labelVisible !== false;
            if (planet.orbitLine) {
                planet.orbitLine.visible = settings.orbitVisible !== false;
                planet.orbitLine.scale.setScalar(spacing);
            }
            if (planet.texture) planet.texture.offset.x += 0.00005 * speed;
            if (planet.moons) {
                for (var m = 0; m < planet.moons.length; m++) {
                    planet.moons[m].pivot.rotation.y += planet.moons[m].speed * speed;
                }
            }
        }
    }

    return {
        createStarBackground: createStarBackground,
        createSolarPlanet: createSolarPlanet,
        createPlanetTexture: createPlanetTexture,
        createSolarSystem: createSolarSystem,
        createSystem: createSolarSystem,
        updateSystem: updateSystem
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PT_STARCHART_CELESTIAL: PT_STARCHART_CELESTIAL };
}
if (typeof window !== 'undefined') {
    window.PT_STARCHART_CELESTIAL = PT_STARCHART_CELESTIAL;
}
