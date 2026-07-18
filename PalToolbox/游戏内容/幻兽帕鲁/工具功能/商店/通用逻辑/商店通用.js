var PT_SHOP_COMMON = (function() {
    var state = { loaded: false, loading: false, tab: 'shops', shopId: '', search: '', selected: null };
    var listeners = [];

    function notify() { listeners.forEach(function(listener) { listener(); }); }
    function onUpdate(listener) { listeners.push(listener); }

    function load() {
        if (state.loading) return;
        state.loading = true;
        state.loaded = false;
        notify();
        var core = window.PT_SHOP_CORE;
        if (core) {
            core.load(function() {
                state.loading = false;
                state.loaded = true;
                notify();
            });
        }
    }

    function setTab(tab) {
        state.tab = tab;
        state.selected = null;
        notify();
    }

    function setShop(id) {
        state.shopId = id;
        state.selected = null;
        notify();
    }

    function setSearch(value) {
        state.search = value || '';
        state.selected = null;
        notify();
    }

    function selectItem(id) {
        state.selected = id;
        notify();
    }

    function deselectItem() {
        state.selected = null;
        notify();
    }

    function getState() { return state; }

    return {
        load: load,
        setTab: setTab,
        setShop: setShop,
        setSearch: setSearch,
        selectItem: selectItem,
        deselectItem: deselectItem,
        getState: getState,
        onUpdate: onUpdate
    };
})();
if (typeof window !== 'undefined') window.PT_SHOP_COMMON = PT_SHOP_COMMON;
