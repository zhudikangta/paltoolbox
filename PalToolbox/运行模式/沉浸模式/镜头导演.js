var PT_IMMERSIVE_CAMERA_DIRECTOR = (function() {
    function create() {
        return {
            focusX: 0,
            focusY: 0,
            focusZ: 0,
            targetX: 0,
            targetY: 0,
            targetZ: 680,
            currentX: 0,
            currentY: 0,
            currentZ: 680,
            pulseUntil: 0
        };
    }

    function focusTool(state, toolIndex, total, now) {
        if (!state || !total) return;
        var angle = toolIndex * Math.PI * 2 / total;
        state.targetX = Math.cos(angle) * 96;
        state.targetY = Math.sin(angle) * 46;
        state.targetZ = 530;
        state.focusX = Math.cos(angle) * 110;
        state.focusY = Math.sin(angle) * 62;
        state.focusZ = 0;
        state.pulseUntil = (now || performance.now()) + 760;
    }

    function resetFocus(state) {
        if (!state) return;
        state.targetX = 0;
        state.targetY = 0;
        state.targetZ = 680;
        state.focusX = 0;
        state.focusY = 0;
        state.focusZ = 0;
    }

    function update(state, camera, elapsed, pointerX, pointerY, settings) {
        if (!state || !camera) return;
        var motion = settings && settings.reduceMotion ? 0 : ((settings && settings.cameraMotion) || 74) / 74;
        var idleX = Math.sin(elapsed * 0.00024) * 46 * motion;
        var idleY = Math.cos(elapsed * 0.00027) * 24 * motion;
        var desiredX = state.targetX + idleX + (pointerX || 0) * 72 * motion;
        var desiredY = state.targetY + idleY - (pointerY || 0) * 56 * motion;
        var desiredZ = state.targetZ;
        state.currentX += (desiredX - state.currentX) * 0.065;
        state.currentY += (desiredY - state.currentY) * 0.065;
        state.currentZ += (desiredZ - state.currentZ) * 0.055;
        camera.position.set(state.currentX, state.currentY, state.currentZ);
        camera.lookAt(state.focusX, state.focusY, state.focusZ);
    }

    function getPulse(state) {
        if (!state) return 0;
        var left = state.pulseUntil - performance.now();
        if (left <= 0) return 0;
        return left / 760;
    }

    return {
        create: create,
        focusTool: focusTool,
        resetFocus: resetFocus,
        update: update,
        getPulse: getPulse
    };
})();

if (typeof window !== 'undefined') {
    window.PT_IMMERSIVE_CAMERA_DIRECTOR = PT_IMMERSIVE_CAMERA_DIRECTOR;
}
