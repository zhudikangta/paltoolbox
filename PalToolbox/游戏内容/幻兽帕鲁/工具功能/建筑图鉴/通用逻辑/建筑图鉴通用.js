var PT_BUILD_COMMON = (function() {
    var state = {
        mainCategory: '生产',
        searchQ: '',
        selectedItem: null
    };
    var listeners = [];

    function notify() {
        listeners.forEach(function(fn) { fn(); });
    }

    function onStateChange(fn) {
        listeners.push(fn);
    }

    function setMainCategory(cat) {
        state.mainCategory = cat;
        state.searchQ = '';
        state.selectedItem = null;
        notify();
    }

    function setSearch(q) {
        state.searchQ = q;
        state.selectedItem = null;
        notify();
    }

    function selectItem(item) {
        state.selectedItem = item;
        notify();
    }

    function deselectItem() {
        state.selectedItem = null;
        notify();
    }

    function getFilteredItems(core) {
        if (!core) return [];
        if (state.selectedItem) return [state.selectedItem];
        return core.getFiltered(state.mainCategory, state.searchQ);
    }

    function getState() {
        return {
            mainCategory: state.mainCategory,
            searchQ: state.searchQ,
            selectedItem: state.selectedItem
        };
    }

    return {
        onStateChange: onStateChange,
        setMainCategory: setMainCategory,
        setSearch: setSearch,
        selectItem: selectItem,
        deselectItem: deselectItem,
        getFilteredItems: getFilteredItems,
        getState: getState
    };
})();

if (typeof window !== 'undefined') window.PT_BUILD_COMMON = PT_BUILD_COMMON;
