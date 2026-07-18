var PT_DROP_COMMON = (function() {
    var state = { loaded: false, loading: false, type: '', status: '', search: '', selected: null };
    var listeners = [];

    function notify() {
        listeners.forEach(function(listener) { listener(); });
    }

    function onUpdate(listener) {
        listeners.push(listener);
    }

    function load() {
        if (state.loading || state.loaded) return;
        state.loading = true;
        notify();
        var core = window.PT_DROP_CORE;
        if (!core) return;
        core.load(function(data) {
            state.loading = false;
            state.loaded = !!data;
            notify();
        });
    }

    function setType(type) { state.type = type || ''; state.selected = null; notify(); }
    function setStatus(status) { state.status = status || ''; state.selected = null; notify(); }
    function setSearch(search) { state.search = search || ''; state.selected = null; notify(); }
    function select(id) { state.selected = id || null; notify(); }
    function clearSelection() { state.selected = null; notify(); }
    function getState() { return state; }

    return {
        load: load,
        setType: setType,
        setStatus: setStatus,
        setSearch: setSearch,
        select: select,
        clearSelection: clearSelection,
        getState: getState,
        onUpdate: onUpdate
    };
})();
if (typeof window !== 'undefined') window.PT_DROP_COMMON = PT_DROP_COMMON;
