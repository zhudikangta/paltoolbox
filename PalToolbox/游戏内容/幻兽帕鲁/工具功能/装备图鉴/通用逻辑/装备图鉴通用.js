var PT_EQUIP_COMMON = (function() {
    var state = {
        mainCategory: '武器',
        subCategory: '',
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
        state.subCategory = '';
        state.searchQ = '';
        state.selectedItem = null;
        notify();
    }

    function setSubCategory(sub) {
        state.subCategory = sub;
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
        return core.getFiltered(state.mainCategory, state.subCategory, state.searchQ);
    }

    function getState() {
        return {
            mainCategory: state.mainCategory,
            subCategory: state.subCategory,
            searchQ: state.searchQ,
            selectedItem: state.selectedItem
        };
    }

    return {
        onStateChange: onStateChange,
        setMainCategory: setMainCategory,
        setSubCategory: setSubCategory,
        setSearch: setSearch,
        selectItem: selectItem,
        deselectItem: deselectItem,
        getFilteredItems: getFilteredItems,
        getState: getState
    };
})();

if (typeof window !== 'undefined') window.PT_EQUIP_COMMON = PT_EQUIP_COMMON;
