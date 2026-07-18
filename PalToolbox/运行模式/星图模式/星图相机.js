var PT_STARCHART_CAMERA = (function() {
    var DEFAULT_YAW = 0;
    var DEFAULT_PITCH = 1.54;
    var DEFAULT_DISTANCE = 42;

    function create(camera) {
        return {
            camera: camera,
            target: { x: 0, y: 42, z: 1.3 },
            lookTarget: { x: 0, y: 0, z: 0 },
            center: { x: 0, y: 0, z: 0 },
            currentX: 0,
            currentY: 42,
            currentZ: 1.3,
            lookX: 0,
            lookY: 0,
            lookZ: 0,
            upX: 0,
            upY: 0,
            upZ: 1,
            rotating: false,
            lastX: 0,
            lastY: 0,
            lockedPlanet: null,
            lockedPivot: null,
            enabled: true,
            zoomLevel: 1,
            yaw: DEFAULT_YAW,
            pitch: DEFAULT_PITCH,
            distance: DEFAULT_DISTANCE
        };
    }

    function applyPosition(state, mouseX, mouseY, settings) {
        if (!state || !state.camera || !state.enabled) return;
        if (state.lockedPlanet && state.lockedPivot) {
            var lockedPos = new THREE.Vector3();
            state.lockedPivot.getWorldPosition(lockedPos);
            state.center.x = lockedPos.x;
            state.center.y = lockedPos.y;
            state.center.z = lockedPos.z;
        }
        var motion = settings.cameraMotion || 70;
        var speed = (settings.orbitSpeed || 62) / 100;
        if (settings.reduceMotion) motion = 0;
        var autoScale = motion / 140;
        var driftX = state.lockedPlanet ? 0 : (mouseX || 0) * 1.4 * autoScale;
        var driftY = state.lockedPlanet ? 0 : (mouseY || 0) * 0.9 * autoScale;
        var view = getViewFrame(state);
        state.target.x = view.position.x + driftX;
        state.target.y = view.position.y + driftY;
        state.target.z = view.position.z;
        state.lookTarget.x = state.center.x;
        state.lookTarget.y = state.center.y;
        state.lookTarget.z = state.center.z;
        state.currentX += (state.target.x - state.currentX) * 0.06;
        state.currentY += (state.target.y - state.currentY) * 0.06;
        state.currentZ += (state.target.z - state.currentZ) * 0.05;
        state.lookX += (state.lookTarget.x - state.lookX) * 0.07;
        state.lookY += (state.lookTarget.y - state.lookY) * 0.07;
        state.lookZ += (state.lookTarget.z - state.lookZ) * 0.07;
        state.upX += (view.up.x - state.upX) * 0.18;
        state.upY += (view.up.y - state.upY) * 0.18;
        state.upZ += (view.up.z - state.upZ) * 0.18;
        state.camera.position.set(state.currentX, state.currentY, state.currentZ);
        state.camera.up.set(state.upX, state.upY, state.upZ).normalize();
        state.camera.lookAt(state.lookX, state.lookY, state.lookZ);
    }

    function getViewFrame(state) {
        var yawQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), state.yaw);
        var pitchAxis = new THREE.Vector3(1, 0, 0).applyQuaternion(yawQuat).normalize();
        var pitchQuat = new THREE.Quaternion().setFromAxisAngle(pitchAxis, -state.pitch);
        var viewQuat = pitchQuat.multiply(yawQuat);
        var position = new THREE.Vector3(0, 0, state.distance).applyQuaternion(viewQuat);
        var up = new THREE.Vector3(0, 1, 0).applyQuaternion(viewQuat).normalize();
        position.x += state.center.x;
        position.y += state.center.y;
        position.z += state.center.z;
        return {
            position: position,
            up: up
        };
    }

    function snapToView(state) {
        if (!state || !state.camera) return;
        var next = getViewFrame(state);
        state.target.x = next.position.x;
        state.target.y = next.position.y;
        state.target.z = next.position.z;
        state.lookTarget.x = state.center.x;
        state.lookTarget.y = state.center.y;
        state.lookTarget.z = state.center.z;
        state.currentX = next.position.x;
        state.currentY = next.position.y;
        state.currentZ = next.position.z;
        state.lookX = state.center.x;
        state.lookY = state.center.y;
        state.lookZ = state.center.z;
        state.upX = next.up.x;
        state.upY = next.up.y;
        state.upZ = next.up.z;
        state.camera.position.set(state.currentX, state.currentY, state.currentZ);
        state.camera.up.copy(next.up);
        state.camera.lookAt(state.lookX, state.lookY, state.lookZ);
    }

    function lockPlanet(state, planet, planetPivot) {
        if (!state) return;
        state.lockedPlanet = planet;
        state.lockedPivot = planetPivot || null;
        if (planet && planetPivot) {
            var pos = new THREE.Vector3();
            planetPivot.getWorldPosition(pos);
            state.center.x = pos.x;
            state.center.y = pos.y;
            state.center.z = pos.z;
            state.distance = 6.8;
        }
    }

    function resetLock(state) {
        if (!state) return;
        setDefaultView(state);
    }

    function setDefaultView(state, snap) {
        if (!state) return;
        state.lockedPlanet = null;
        state.lockedPivot = null;
        state.center.x = 0;
        state.center.y = 0;
        state.center.z = 0;
        state.yaw = DEFAULT_YAW;
        state.pitch = DEFAULT_PITCH;
        state.distance = DEFAULT_DISTANCE;
        if (snap) snapToView(state);
    }

    function onMouseDown(state, x, y) {
        if (!state || !state.enabled) return;
        state.rotating = true;
        state.lastX = x;
        state.lastY = y;
    }

    function onMouseMove(state, x, y) {
        if (!state || !state.enabled || !state.rotating) return;
        var dx = x - state.lastX;
        var dy = y - state.lastY;
        state.lastX = x;
        state.lastY = y;
        state.yaw -= dx * 0.006;
        state.pitch += dy * 0.004;
    }

    function onMouseUp(state) {
        if (!state) return;
        state.rotating = false;
    }

    function onWheel(state, delta) {
        if (!state || !state.enabled) return;
        state.distance += delta * 0.018;
        state.distance = Math.max(4.8, Math.min(58, state.distance));
    }

    return {
        create: create,
        applyPosition: applyPosition,
        lockPlanet: lockPlanet,
        resetLock: resetLock,
        setDefaultView: setDefaultView,
        onMouseDown: onMouseDown,
        onMouseMove: onMouseMove,
        onMouseUp: onMouseUp,
        onWheel: onWheel
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PT_STARCHART_CAMERA: PT_STARCHART_CAMERA };
}
if (typeof window !== 'undefined') {
    window.PT_STARCHART_CAMERA = PT_STARCHART_CAMERA;
}
