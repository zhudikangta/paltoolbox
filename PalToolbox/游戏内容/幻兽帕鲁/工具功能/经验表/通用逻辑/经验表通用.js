var PT_EXP_COMMON = (function() {
    var state = { loaded: false, loading: false, tab: 'player', selectedItem: null };
    var listeners = [];
    function notify() { listeners.forEach(function(f) { f(); }); }
    function onUpdate(f) { listeners.push(f); }
    function load() {
        if (state.loading) return;
        state.loading = true; state.loaded = false; notify();
        var core = window.PT_EXP_CORE;
        if (core) core.loadData(function() { state.loading = false; state.loaded = true; notify(); });
    }
    function setTab(t) { state.tab = t; state.selectedItem = null; notify(); }
    function selectItem(i) { state.selectedItem = i; notify(); }
    function deselectItem() { state.selectedItem = null; notify(); }
    function getState() { return state; }
    return { load: load, setTab: setTab, selectItem: selectItem, deselectItem: deselectItem, getState: getState, onUpdate: onUpdate };
})();
if (typeof window !== 'undefined') window.PT_EXP_COMMON = PT_EXP_COMMON;
