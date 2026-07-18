var PT_COMBAT_COMMON = (function() {
    var s = { loaded: false, loading: false, tab: 'camp', selected: null };
    var ls = []; function n() { ls.forEach(function(f){f()}); }
    function on(f) { ls.push(f); }
    function load() { if(s.loading)return; s.loading=true; s.loaded=false; n(); var c=window.PT_COMBAT_CORE; if(c)c.load(function(){s.loading=false;s.loaded=true;n()}); }
    function setTab(t) { s.tab=t; s.selected=null; n(); }
    function sel(i) { s.selected=i; n(); }
    function desel() { s.selected=null; n(); }
    function state() { return s; }
    return { load:load, setTab:setTab, selectItem:sel, deselectItem:desel, getState:state, onUpdate:on };
})();
if (typeof window !== 'undefined') window.PT_COMBAT_COMMON = PT_COMBAT_COMMON;
