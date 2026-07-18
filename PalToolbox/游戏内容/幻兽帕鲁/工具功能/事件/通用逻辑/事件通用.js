var PT_INCIDENT_COMMON = (function() {
    var state = { loaded: false, loading: false, cat: '', status: '', search: '', selected: null };
    var listeners = [];

    function notify() { listeners.forEach(function(listener) { listener(); }); }
    function onUpdate(listener) { listeners.push(listener); }

    function load() {
        if (state.loading) return;
        state.loading = true;
        state.loaded = false;
        notify();
        var core = window.PT_INCIDENT_CORE;
        if (core) {
            core.load(function() {
                state.loading = false;
                state.loaded = true;
                notify();
            });
        }
    }

    function setCat(cat) { state.cat = cat; state.selected = null; notify(); }
    function setStatus(status) { state.status = status; state.selected = null; notify(); }
    function setSearch(search) { state.search = search || ''; state.selected = null; notify(); }
    function selectItem(id) { state.selected = id; notify(); }
    function deselectItem() { state.selected = null; notify(); }
    function getState() { return state; }

    return {
        load: load,
        setCat: setCat,
        setStatus: setStatus,
        setSearch: setSearch,
        selectItem: selectItem,
        deselectItem: deselectItem,
        getState: getState,
        onUpdate: onUpdate
    };
})();
if (typeof window !== 'undefined') window.PT_INCIDENT_COMMON = PT_INCIDENT_COMMON;
