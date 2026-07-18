var PT_EQUIP_CORE = (function() {
    var crossRef = null;

    var PRIMARY_ORDER = ['武器', '防具', '饰品', '弹药', '滑翔伞', '特殊武器', '帕鲁球改造', '帕鲁装备'];

    var PRIMARY_LABEL = {
        '武器': '武器', '防具': '防具', '饰品': '饰品', '弹药': '弹药',
        'Glider': '滑翔伞', 'SpecialWeapon': '特殊武器',
        'CaptureItemModifier': '帕鲁球改造', 'MonsterEquipWeapon': '帕鲁装备'
    };

    var RARITY_LABEL = { 1: '常见', 2: '少见', 3: '稀有', 4: '史诗', 5: '传奇' };

    function getCrossref() {
        if (crossRef) return crossRef;
        if (typeof window !== 'undefined' && window.PT_CROSS_REF) {
            crossRef = window.PT_CROSS_REF;
        }
        return crossRef;
    }

    function getPrimaryCategories() {
        return PRIMARY_ORDER.filter(function(p) {
            var ref = getCrossref();
            return ref && ref.getEquipmentByCategory(p).length > 0;
        });
    }

    function getItemsByPrimary(primary) {
        var ref = getCrossref();
        if (!ref) return [];
        if (primary === '滑翔伞') return ref.getEquipmentByCategory('Glider');
        if (primary === '特殊武器') return ref.getEquipmentByCategory('SpecialWeapon');
        if (primary === '帕鲁球改造') return ref.getEquipmentByCategory('CaptureItemModifier');
        if (primary === '帕鲁装备') return ref.getEquipmentByCategory('MonsterEquipWeapon');
        return ref.getEquipmentByCategory(primary);
    }

    function getSubCategories(primary) {
        var ref = getCrossref();
        if (!ref) return [];
        var rawPrimary = primary;
        if (primary === '滑翔伞') rawPrimary = 'Glider';
        else if (primary === '特殊武器') rawPrimary = 'SpecialWeapon';
        return ref.getSubCategories(rawPrimary);
    }

    function getSubLabel(primary, sub) {
        var ref = getCrossref();
        if (!ref) return sub;
        var rawPrimary = primary;
        if (primary === '滑翔伞') rawPrimary = 'Glider';
        return ref.getSubCategoryLabel(rawPrimary, sub);
    }

    function getFiltered(primary, sub, query) {
        var ref = getCrossref();
        if (!ref) return [];
        var list = getItemsByPrimary(primary);
        if (sub) {
            var rawPrimary = primary;
            if (primary === '滑翔伞') rawPrimary = 'Glider';
            list = list.filter(function(item) {
                return ref.getItemSecondaryCategory(item) === sub;
            });
        }
        if (query) {
            var q = query.toLowerCase();
            list = list.filter(function(item) {
                var name = ref.getDisplayName(item).toLowerCase();
                var id = (item.id || '').toLowerCase();
                return name.indexOf(q) > -1 || id.indexOf(q) > -1;
            });
        }
        return list;
    }

    function getRarityItems(primary, rarity) {
        return getItemsByPrimary(primary).filter(function(item) {
            return item.稀有度 === rarity;
        });
    }

    function getDisplayName(item) {
        var ref = getCrossref();
        return ref ? ref.getDisplayName(item) : (item.中文名 || item.id || '未命名');
    }

    function getIconUrl(item) {
        var ref = getCrossref();
        return ref ? ref.getIconUrl(item) : '';
    }

    return {
        getPrimaryCategories: getPrimaryCategories,
        getItemsByPrimary: getItemsByPrimary,
        getSubCategories: getSubCategories,
        getSubLabel: getSubLabel,
        getFiltered: getFiltered,
        getDisplayName: getDisplayName,
        getIconUrl: getIconUrl,
        PRIMARY_LABEL: PRIMARY_LABEL,
        PRIMARY_ORDER: PRIMARY_ORDER,
        RARITY_LABEL: RARITY_LABEL
    };
})();

if (typeof window !== 'undefined') window.PT_EQUIP_CORE = PT_EQUIP_CORE;
