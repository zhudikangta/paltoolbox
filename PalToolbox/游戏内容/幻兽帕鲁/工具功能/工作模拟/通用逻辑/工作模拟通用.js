var PT_WORKSIM_COMMON = (function() {
    var state = { loaded: false, loading: false, workType: '手工', selected: {} };
    var listeners = [];

    function notify() { listeners.forEach(function(listener) { listener(); }); }
    function onUpdate(listener) { listeners.push(listener); }

    function load() {
        if (state.loading) return;
        state.loading = true;
        state.loaded = false;
        notify();
        var core = window.PT_WORKSIM_CORE;
        if (core) {
            core.load(function() {
                state.loading = false;
                state.loaded = true;
                notify();
            });
        }
    }

    function setWorkType(type) {
        state.workType = type;
        state.selected = {};
        notify();
    }

    function togglePal(id) {
        state.selected[id] = !state.selected[id];
        if (!state.selected[id]) delete state.selected[id];
        notify();
    }

    function selectMany(ids) {
        state.selected = {};
        ids.forEach(function(id) { state.selected[id] = true; });
        notify();
    }

    function clearSelected() {
        state.selected = {};
        notify();
    }

    function getState() { return state; }

    return {
        load: load,
        setWorkType: setWorkType,
        togglePal: togglePal,
        selectMany: selectMany,
        clearSelected: clearSelected,
        getState: getState,
        onUpdate: onUpdate
    };
})();
if (typeof window !== 'undefined') window.PT_WORKSIM_COMMON = PT_WORKSIM_COMMON;
