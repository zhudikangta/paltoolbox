var PT_SPACE_TOOL_SHELF = (function() {
    var CARD_WIDTH = 2.05;
    var CARD_HEIGHT = 1.025;
    var CANVAS_W = 720;
    var CANVAS_H = 360;
    var VISIBLE_RADIUS = 5;

    function drawCard(tool) {
        var canvas = document.createElement('canvas');
        canvas.width = CANVAS_W;
        canvas.height = CANVAS_H;
        var ctx = canvas.getContext('2d');
        var w = CANVAS_W, h = CANVAS_H;
        ctx.fillStyle = 'rgba(6,12,28,0.92)';
        roundRect(ctx, 0, 0, w, h, 22);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.07)';
        ctx.lineWidth = 1.5;
        roundRect(ctx, 0.5, 0.5, w - 1, h - 1, 22);
        ctx.stroke();
        var accent = tool.accent || '#9df7ff';
        var ag = ctx.createLinearGradient(0, 0, w * 0.5, 0);
        ag.addColorStop(0, accent);
        ag.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = ag;
        ctx.globalAlpha = 0.12;
        roundRect(ctx, 0, 0, w, h, 22);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = accent;
        ctx.globalAlpha = 0.30;
        ctx.beginPath();
        ctx.arc(w * 0.18, h * 0.5, h * 0.34, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = accent;
        ctx.globalAlpha = 0.62;
        ctx.beginPath();
        ctx.arc(w * 0.18, h * 0.5, h * 0.24, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.font = 'bold 34px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tool.shortTitle || tool.title, w * 0.51, h * 0.38);
        ctx.font = '15px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.52)';
        ctx.fillText(tool.title, w * 0.51, h * 0.6);
        if (tool.status === 'placeholder') {
            ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.22)';
            ctx.fillText('即将推出', w * 0.51, h * 0.78);
        }
        var st = ctx.createLinearGradient(0, 0, w, 0);
        st.addColorStop(0, 'rgba(255,255,255,0)');
        st.addColorStop(0.04, 'rgba(255,255,255,0.05)');
        st.addColorStop(0.06, 'rgba(255,255,255,0)');
        st.addColorStop(0.94, 'rgba(255,255,255,0)');
        st.addColorStop(0.96, 'rgba(255,255,255,0.05)');
        st.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = st;
        ctx.fillRect(0, 0, w, h);
        return canvas;
    }

    function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    function createShelf(THREE, tools) {
        var cards = [];
        for (var i = 0; i < tools.length; i++) {
            var canvas = drawCard(tools[i]);
            var texture = new THREE.CanvasTexture(canvas);
            texture.generateMipmaps = false;
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            var material = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                opacity: 0.96,
                depthWrite: false,
                depthTest: true,
                side: THREE.DoubleSide
            });
            var geometry = new THREE.PlaneGeometry(CARD_WIDTH, CARD_HEIGHT, 1, 1);
            var mesh = new THREE.Mesh(geometry, material);
            mesh.renderOrder = 10 + i;
            cards.push({
                mesh: mesh, texture: texture, material: material,
                geometry: geometry, canvas: canvas,
                tool: tools[i], index: i
            });
        }
        return {
            cards: cards,
            centerTarget: 0,
            centerSmooth: 0,
            total: cards.length,
            visible: true,
            openAnimAt: performance.now() * 0.001
        };
    }

    function placeCards(shelf, pointerX, pointerY) {
        if (!shelf || !shelf.cards) return;
        var nowT = performance.now() * 0.001;
        var center = shelf.centerSmooth;
        var parX = pointerX || 0;
        var parY = pointerY || 0;
        var sideX = 3.18;
        var sideY = 0;
        var sideZ = 0.86;
        var sideXStep = 0.04;
        var sideYStep = 0.68;
        var sideZStep = 0.17;
        var sideRotY = 0.28;
        var sideRotX = 0.042;
        var openAt = shelf.openAnimAt || nowT;
        for (var i = 0; i < shelf.cards.length; i++) {
            var card = shelf.cards[i];
            var delta = card.index - center;
            var absD = Math.abs(delta);
            if (absD > VISIBLE_RADIUS + 0.5) {
                card.mesh.visible = false;
                continue;
            }
            card.mesh.visible = true;
            var revealRaw = Math.max(0, Math.min(1, (nowT - openAt - absD * 0.035) / 0.62));
            var reveal = revealRaw * revealRaw * (3 - 2 * revealRaw);
            var px = sideX + absD * sideXStep + (1 - reveal) * (0.82 + absD * 0.075);
            var py = sideY - delta * sideYStep + (1 - reveal) * (delta < 0 ? -0.18 : 0.18);
            var pz = sideZ - absD * sideZStep - (1 - reveal) * 0.2;
            var scale = (absD < 0.5 ? 1.12 : Math.max(0.55, 1.04 - absD * 0.14)) * (0.88 + reveal * 0.12);
            var parWeight = Math.max(0, 1 - absD * 0.16) * reveal;
            px += parX * 0.06 * parWeight;
            py += parY * 0.046 * parWeight;
            var rotY = sideRotY + delta * sideRotX + parX * 0.02 * parWeight;
            var rotX = -delta * sideRotX - parY * 0.015 * parWeight;
            card.mesh.position.set(px, py, pz);
            card.mesh.rotation.set(rotX, rotY, 0);
            card.mesh.scale.setScalar(scale);
            card.mesh.material.opacity = 0.96 * (0.3 + reveal * 0.7);
        }
    }

    function updateCenter(shelf, delta) {
        if (!shelf) return;
        shelf.centerTarget += delta;
        shelf.centerTarget = Math.max(0, Math.min(shelf.total - 1, shelf.centerTarget));
    }

    function smoothCenter(shelf) {
        if (!shelf) return;
        shelf.centerSmooth += (shelf.centerTarget - shelf.centerSmooth) * 0.16;
    }

    function getSelectedTool(shelf) {
        if (!shelf) return null;
        var idx = Math.round(shelf.centerSmooth);
        idx = Math.max(0, Math.min(shelf.cards.length - 1, idx));
        return shelf.cards[idx] ? shelf.cards[idx].tool : null;
    }

    function setVisible(shelf, visible) {
        if (!shelf) return;
        shelf.visible = visible;
        for (var i = 0; i < shelf.cards.length; i++) {
            shelf.cards[i].mesh.visible = visible;
        }
    }

    function dispose(shelf) {
        if (!shelf) return;
        for (var i = 0; i < shelf.cards.length; i++) {
            var c = shelf.cards[i];
            if (c.geometry) c.geometry.dispose();
            if (c.texture) c.texture.dispose();
            if (c.material) c.material.dispose();
        }
    }

    return {
        createShelf: createShelf,
        placeCards: placeCards,
        updateCenter: updateCenter,
        smoothCenter: smoothCenter,
        getSelectedTool: getSelectedTool,
        setVisible: setVisible,
        dispose: dispose
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PT_SPACE_TOOL_SHELF: PT_SPACE_TOOL_SHELF };
}
if (typeof window !== 'undefined') {
    window.PT_SPACE_TOOL_SHELF = PT_SPACE_TOOL_SHELF;
}
