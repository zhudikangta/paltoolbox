var PT_ITEM_CORE = (function() {
    var crossRef = null;

    var CATEGORY_ORDER = ['材料', '帕鲁蛋', '植入体', '证明', '鞍具', '食物', '技能果实', '药水', '帕鲁球', '帕鲁球改造', '消耗品', '关键道具'];

    var CATEGORY_LABEL = {
        '材料': '材料', '帕鲁蛋': '帕鲁蛋', '植入体': '植入体', '证明': '证明', '鞍具': '鞍具',
        '消耗品': '消耗品', '关键道具': '关键道具', '食物': '食物', '技能果实': '技能果实',
        '药水': '药水', '帕鲁球': '帕鲁球', '帕鲁球改造': '帕鲁球改造'
    };

    var SUB_CATEGORY_LABEL = {
        '普通植入体': '普通植入体',
        '耗材植入体': '耗材植入体',
        '鞍具': '鞍具',
        '背带': '背带',
        '手套': '手套',
        '功率转换器': '功率转换器',
        '其他': '其他'
    };

    var EGG_SECONDARY_CATEGORY = 'MaterialPalEgg';

    function getCrossref() {
        if (crossRef) return crossRef;
        if (typeof window !== 'undefined' && window.PT_CROSS_REF) {
            crossRef = window.PT_CROSS_REF;
        }
        return crossRef;
    }

    function isEggItem(item) {
        var parts = (item.类别 || '').split('/');
        return parts.length > 1 && parts[1] === EGG_SECONDARY_CATEGORY;
    }

    function isImplantItem(item) {
        var id = item.id || '';
        return id.indexOf('PalPassiveSkillChange_') === 0;
    }

    function isConsumableImplantItem(item) {
        var id = item.id || '';
        return id.indexOf('PalPassiveSkillChange_Consumable_') === 0;
    }

    function isProofItem(item) {
        return (item.中文名 || '').indexOf('证明') > -1;
    }

    function isSaddleItem(item) {
        return (item.id || '').indexOf('SkillUnlock_') === 0;
    }

    function getSaddleSubCategory(item) {
        var name = item.中文名 || '';
        if (name.indexOf('马鞍') > -1 || name.indexOf('鞍具') > -1) return '鞍具';
        if (name.indexOf('背带') > -1) return '背带';
        if (name.indexOf('手套') > -1) return '手套';
        if (name.indexOf('功率转换器') > -1) return '功率转换器';
        return '其他';
    }

    function sortByPalNumber(items) {
        var ref = getCrossref();
        if (!ref) return items.slice();
        return items.slice().sort(function(a, b) {
            var aId = (a.id || '').replace('BossDefeatReward_', '').replace('SkillUnlock_', '');
            var bId = (b.id || '').replace('BossDefeatReward_', '').replace('SkillUnlock_', '');
            var aNum = ref.getPalNumberById(aId);
            var bNum = ref.getPalNumberById(bId);
            if (aNum == null && bNum == null) return 0;
            if (aNum == null) return 1;
            if (bNum == null) return -1;
            return aNum - bNum;
        });
    }

    function getCategories() {
        var ref = getCrossref();
        if (!ref) return [];
        return CATEGORY_ORDER.filter(function(c) {
            return getByCategory(c).length > 0;
        });
    }

    function getSubCategories(cat) {
        if (cat === '植入体') return ['普通植入体', '耗材植入体'];
        if (cat === '鞍具') return ['鞍具', '背带', '手套', '功率转换器', '其他'];
        return [];
    }

    function getByCategory(cat, subCat) {
        var ref = getCrossref();
        if (!ref) return [];
        if (cat === '帕鲁蛋') {
            return (ref.getItemsByPrimaryCategory('材料') || []).filter(isEggItem);
        }
        if (cat === '植入体') {
            var consume = ref.getItemsByPrimaryCategory('消耗品') || [];
            var essential = ref.getItemsByPrimaryCategory('关键道具') || [];
            var all = consume.concat(essential).filter(isImplantItem);
            if (subCat === '普通植入体') return all.filter(function(item) { return !isConsumableImplantItem(item); });
            if (subCat === '耗材植入体') return all.filter(isConsumableImplantItem);
            return all;
        }
        if (cat === '证明') {
            var proofs = (ref.getItemsByPrimaryCategory('关键道具') || []).filter(isProofItem);
            return sortByPalNumber(proofs);
        }
        if (cat === '鞍具') {
            var saddles = (ref.getItemsByPrimaryCategory('关键道具') || []).filter(isSaddleItem);
            if (subCat) saddles = saddles.filter(function(item) { return getSaddleSubCategory(item) === subCat; });
            return sortByPalNumber(saddles);
        }
        var items = ref.getItemsByPrimaryCategory(cat) || ref.getItemsByLabel(cat) || [];
        if (cat === '材料') {
            items = items.filter(function(item) { return !isEggItem(item); });
        }
        if (cat === '消耗品') {
            items = items.filter(function(item) { return !isImplantItem(item); });
        }
        if (cat === '关键道具') {
            items = items.filter(function(item) { return !isImplantItem(item) && !isProofItem(item) && !isSaddleItem(item); });
        }
        return items;
    }

    function getFiltered(cat, subCat, query) {
        var list = getByCategory(cat, subCat);
        if (query) {
            var q = query.toLowerCase();
            list = list.filter(function(item) {
                var name = getDisplayName(item).toLowerCase();
                var id = (item.id || '').toLowerCase();
                return name.indexOf(q) > -1 || id.indexOf(q) > -1;
            });
        }
        return list;
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
        getCategories: getCategories,
        getSubCategories: getSubCategories,
        getByCategory: getByCategory,
        getFiltered: getFiltered,
        getDisplayName: getDisplayName,
        getIconUrl: getIconUrl,
        CATEGORY_ORDER: CATEGORY_ORDER,
        CATEGORY_LABEL: CATEGORY_LABEL,
        SUB_CATEGORY_LABEL: SUB_CATEGORY_LABEL
    };
})();

if (typeof window !== 'undefined') window.PT_ITEM_CORE = PT_ITEM_CORE;
