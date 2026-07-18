var PT_IMMERSIVE_PARTICLE_WALL = (function() {
    function createStarField(THREE, settings) {
        var count = Math.round((settings.particleDensity || 72) * 66);
        var positions = new Float32Array(count * 3);
        var colors = new Float32Array(count * 3);
        var radii = new Float32Array(count);
        for (var i = 0; i < count; i++) {
            var radius = 120 + Math.random() * 1220;
            var angle = Math.random() * Math.PI * 2;
            radii[i] = radius;
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = Math.sin(angle) * radius * 0.58;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 1180;
            colors[i * 3] = 0.22 + Math.random() * 0.42;
            colors[i * 3 + 1] = 0.72 + Math.random() * 0.26;
            colors[i * 3 + 2] = 1;
        }
        var geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.userData.radii = radii;
        var material = new THREE.PointsMaterial({
            size: settings.particleSize || 2.4,
            vertexColors: true,
            transparent: true,
            opacity: 0.82,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        return new THREE.Points(geometry, material);
    }

    function createImageField(THREE, imageData, settings) {
        var data = imageData || createDefaultImageData(settings);
        var geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(data.scatter), 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(data.colors), 3));
        geometry.userData.base = new Float32Array(data.positions);
        geometry.userData.scatter = new Float32Array(data.scatter);
        geometry.userData.phase = new Float32Array(data.phase);
        var material = new THREE.PointsMaterial({
            size: (settings.particleSize || 2.4) * 1.28,
            vertexColors: true,
            transparent: true,
            opacity: 0.96,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        var points = new THREE.Points(geometry, material);
        points.position.z = 120;
        points.userData.wallClock = 0;
        return points;
    }

    function createDefaultImageData(settings) {
        var count = Math.round((settings.particleDensity || 72) * 22);
        var positions = [];
        var scatter = [];
        var colors = [];
        var phase = [];
        for (var i = 0; i < count; i++) {
            var row = Math.floor(i / 46);
            var col = i % 46;
            var x = (col - 23) * 12 + Math.sin(row * 0.7) * 26;
            var y = (18 - row) * 11;
            var z = Math.sin(col * 0.44) * 36;
            positions.push(x, y, z);
            scatter.push((Math.random() - 0.5) * 980, (Math.random() - 0.5) * 620, (Math.random() - 0.5) * 760);
            colors.push(0.42 + Math.random() * 0.16, 0.86 + Math.random() * 0.12, 1);
            phase.push(Math.random() * Math.PI * 2);
        }
        return { positions: positions, scatter: scatter, colors: colors, phase: phase };
    }

    function sampleImage(image, settings) {
        var maxSide = 190;
        var ratio = Math.min(maxSide / image.width, maxSide / image.height, 1);
        var width = Math.max(1, Math.round(image.width * ratio));
        var height = Math.max(1, Math.round(image.height * ratio));
        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        var ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(image, 0, 0, width, height);
        var pixels = ctx.getImageData(0, 0, width, height).data;
        var step = Math.max(1, Math.round(9 - (settings.particleDensity || 72) / 18));
        var positions = [];
        var scatter = [];
        var colors = [];
        var phase = [];
        var scale = 640 / Math.max(width, height);
        for (var y = 0; y < height; y += step) {
            for (var x = 0; x < width; x += step) {
                var index = (y * width + x) * 4;
                var alpha = pixels[index + 3] / 255;
                var brightness = (pixels[index] + pixels[index + 1] + pixels[index + 2]) / 765;
                if (alpha < 0.14 || brightness < 0.05) continue;
                var baseX = (x - width / 2) * scale;
                var baseY = (height / 2 - y) * scale;
                var baseZ = (Math.random() - 0.5) * 64;
                positions.push(baseX, baseY, baseZ);
                scatter.push(baseX * 1.8 + (Math.random() - 0.5) * 780, baseY * 1.6 + (Math.random() - 0.5) * 520, (Math.random() - 0.5) * 900);
                colors.push(pixels[index] / 255, pixels[index + 1] / 255, pixels[index + 2] / 255);
                phase.push(Math.random() * Math.PI * 2);
            }
        }
        if (!positions.length) return createDefaultImageData(settings);
        return { positions: positions, scatter: scatter, colors: colors, phase: phase };
    }

    function smoothstep(value) {
        var t = Math.max(0, Math.min(1, value));
        return t * t * (3 - 2 * t);
    }

    function animateStarField(points, elapsed, settings) {
        if (!points) return;
        var speed = (settings.motionSpeed || 68) / 68;
        points.rotation.z = elapsed * 0.00012 * speed;
        points.rotation.y = Math.sin(elapsed * 0.00032 * speed) * 0.22;
        points.rotation.x = Math.cos(elapsed * 0.00024 * speed) * 0.08;
        if (points.material) {
            points.material.size = settings.particleSize || 2.4;
            points.material.opacity = Math.max(0.36, Math.min(1, (settings.glowStrength || 86) / 104));
        }
    }

    function animateImageField(points, elapsed, settings) {
        if (!points || !points.geometry) return;
        var positionAttr = points.geometry.getAttribute('position');
        var current = positionAttr.array;
        var base = points.geometry.userData.base;
        var scatter = points.geometry.userData.scatter;
        var phase = points.geometry.userData.phase;
        if (!base || !scatter || !phase) return;

        var speed = (settings.motionSpeed || 68) / 68;
        var cycle = (elapsed * 0.00014 * speed) % 1;
        var gather = cycle < 0.5 ? smoothstep(cycle / 0.5) : smoothstep((1 - cycle) / 0.5);
        var flip = Math.sin(elapsed * 0.00032 * speed) * 0.85;
        for (var i = 0; i < base.length / 3; i++) {
            var p = phase[i] || 0;
            var bx = base[i * 3];
            var by = base[i * 3 + 1];
            var bz = base[i * 3 + 2];
            var sx = scatter[i * 3];
            var sy = scatter[i * 3 + 1];
            var sz = scatter[i * 3 + 2];
            var wave = Math.sin(elapsed * 0.0021 * speed + p) * 18;
            var rotatedX = bx * Math.cos(flip) + bz * Math.sin(flip);
            var rotatedZ = bz * Math.cos(flip) - bx * Math.sin(flip);
            current[i * 3] = sx + (rotatedX - sx) * gather;
            current[i * 3 + 1] = sy + (by + wave - sy) * gather;
            current[i * 3 + 2] = sz + (rotatedZ - sz) * gather;
        }
        positionAttr.needsUpdate = true;
        points.rotation.y = Math.sin(elapsed * 0.00021 * speed) * 0.22;
        points.rotation.z = Math.cos(elapsed * 0.00017 * speed) * 0.045;
        if (points.material) {
            points.material.size = (settings.particleSize || 2.4) * 1.28;
            points.material.opacity = 0.72 + gather * 0.28;
        }
    }

    function replaceImageField(THREE, scene, previous, imageData, settings) {
        var next = createImageField(THREE, imageData, settings);
        if (previous) {
            scene.remove(previous);
            if (previous.geometry) previous.geometry.dispose();
            if (previous.material) previous.material.dispose();
        }
        scene.add(next);
        return next;
    }

    return {
        createStarField: createStarField,
        createImageField: createImageField,
        sampleImage: sampleImage,
        animateStarField: animateStarField,
        animateImageField: animateImageField,
        replaceImageField: replaceImageField
    };
})();

if (typeof window !== 'undefined') {
    window.PT_IMMERSIVE_PARTICLE_WALL = PT_IMMERSIVE_PARTICLE_WALL;
}
