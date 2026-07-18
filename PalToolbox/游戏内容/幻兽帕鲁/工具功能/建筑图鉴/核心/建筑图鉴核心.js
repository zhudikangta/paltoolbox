var PT_BUILD_CORE = (function() {
    var crossRef = null;

    var CATEGORY_ORDER = ['生产', '帕鲁', '存储', '食物', '基础设施', '结构', '防御', '照明', '家具', '其他'];

    var CATEGORY_LABEL = {
        '生产': '生产', '帕鲁': '帕鲁', '存储': '存储', '食物': '食物',
        '基础设施': '基础设施', '结构': '结构', '防御': '防御',
        '照明': '照明', '家具': '家具', '其他': '其他'
    };

    function getCrossref() {
        if (crossRef) return crossRef;
        if (typeof window !== 'undefined' && window.PT_CROSS_REF) {
            crossRef = window.PT_CROSS_REF;
        }
        return crossRef;
    }

    function getCategories() {
        return CATEGORY_ORDER.filter(function(cat) {
            var ref = getCrossref();
            if (!ref) return false;
            var buildings = ref.buildingData || [];
            return buildings.some(function(b) { return (b.类别 || '其他') === cat; });
        });
    }

    function getByCategory(cat) {
        var ref = getCrossref();
        if (!ref) return [];
        var buildings = ref.buildingData || [];
        if (cat) return buildings.filter(function(b) { return (b.类别 || '其他') === cat; });
        return buildings;
    }

    function getFiltered(cat, query) {
        var list = getByCategory(cat);
        if (query) {
            var q = query.toLowerCase();
            list = list.filter(function(b) {
                var name = getDisplayName(b).toLowerCase();
                var id = (b.id || '').toLowerCase();
                return name.indexOf(q) > -1 || id.indexOf(q) > -1;
            });
        }
        list.sort(function(a, b) {
            return (a.等级 || 0) - (b.等级 || 0);
        });
        return list;
    }

    function getDisplayName(b) {
        var name = b.中文名 || '';
        if (!name || name === 'zh-hans text' || name.indexOf('zh-Hans') > -1) {
            var id = b.id || '';
            return id.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
        }
        return name;
    }

    function getIconUrl(b) {
        var ref = getCrossref();
        return ref ? ref.getBuildingIconUrl(b) : '';
    }

    return {
        getCategories: getCategories,
        getByCategory: getByCategory,
        getFiltered: getFiltered,
        getDisplayName: getDisplayName,
        getIconUrl: getIconUrl,
        CATEGORY_ORDER: CATEGORY_ORDER,
        CATEGORY_LABEL: CATEGORY_LABEL
    };
})();

if (typeof window !== 'undefined') window.PT_BUILD_CORE = PT_BUILD_CORE;
