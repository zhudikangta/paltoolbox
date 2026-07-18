var PT_CROSS_REF = (function() {
    var itemData = [];
    var buildingData = [];
    var recipeData = [];
    var dropData = [];
    var skillData = null;

    var ITEM_DATA_URL = '../游戏内容/幻兽帕鲁1.0/数据包/物品.json';
    var BUILDING_DATA_URL = '../游戏内容/幻兽帕鲁1.0/数据包/建筑.json';
    var RECIPE_DATA_URL = '../游戏内容/幻兽帕鲁1.0/数据包/配方.json';
    var DROP_DATA_URL = '../游戏内容/幻兽帕鲁1.0/数据包/掉落.json';
    var SKILL_DATA_URL = '../游戏内容/幻兽帕鲁1.0/数据包/技能.json';
    var PAL_DATA_URL = '../游戏内容/幻兽帕鲁1.0/数据包/帕鲁.json';

    var itemById = {};
    var itemCategoryCache = {};
    var equipmentCache = null;
    var buildingByCategory = {};
    var recipeByResult = {};
    var recipeByMaterial = {};
    var dropBySource = {};
    var passiveSources = {};
    var passiveCategoryMap = {};
    var palNumberById = {};
    var palReady = false;

    var EQUIP_CAT_TO_PASSIVE_CAT = {
        '武器': 'weapon',
        '防具': 'armor',
        '饰品': 'accessory',
        '弹药': 'weapon',
        'Glider': 'accessory',
        'SpecialWeapon': 'weapon',
        'CaptureItemModifier': 'other',
        'MonsterEquipWeapon': 'pal'
    };

    var PASSIVE_CAT_FALLBACK = {
        '帕鲁被动': 'pal',
        '稀有帕鲁被动': 'pal',
        '变异帕鲁被动': 'pal',
        '变异帕鲁额外被动': 'pal',
        '骑乘被动': 'pal',
        '传说Boss被动': 'pal',
        '世界树帕鲁被动': 'pal',
        '世界树被动': 'pal',
        '近战武器被动': 'weapon',
        '饰品被动/防具被动': 'accessory',
        '饰品被动/防具被动/近战武器被动': 'weapon',
        '装备强化被动': 'general',
        '工作改造被动': 'general',
        '环境抗性被动': 'general',
        '属性强化被动': 'general',
        '装备技能': 'general',
        '测试占位': 'other',
        '其他': 'other'
    };

    var EQUIPMENT_CATEGORIES = {
        '武器': { label: '武器', subKey: 1 },
        '防具': { label: '防具', subKey: 1 },
        '饰品': { label: '饰品', subKey: 0 },
        '弹药': { label: '弹药', subKey: 1 },
        'Glider': { label: '滑翔伞', subKey: 0 },
        'MonsterEquipWeapon': { label: '帕鲁装备', subKey: 0 }
    };

    var ITEM_CATEGORY_LABELS = {
        '材料': '材料',
        '消耗品': '消耗品',
        '关键道具': '关键道具',
        '食物': '食物',
        '技能果实': '技能果实',
        '药水': '药水',
        'SpecialWeapon': '帕鲁球',
        'CaptureItemModifier': '帕鲁球改造'
    };

    var ITEM_LABEL_TO_KEY = {
        '材料': '材料', '消耗品': '消耗品', '关键道具': '关键道具',
        '食物': '食物', '技能果实': '技能果实', '药水': '药水',
        '帕鲁球': 'SpecialWeapon', '帕鲁球改造': 'CaptureItemModifier'
    };

    var WEAPON_SUB_LABELS = {
        'WeaponMelee': '近战武器',
        'WeaponAssaultRifle': '突击步枪',
        'WeaponRocketLauncher': '火箭发射器',
        'WeaponHandgun': '手枪',
        'WeaponShotgun': '霰弹枪',
        'WeaponBow': '弓',
        'WeaponCrossbow': '弩',
        'WeaponThrowObject': '投掷武器',
        'WeaponGatlingGun': '加特林',
        'WeaponFlameThrower': '火焰喷射器',
        'WeaponFishingRod': '钓鱼竿',
        'WeaponGrapplingGun': '钩爪枪',
        'WeaponMetalDetector': '金属探测器',
        'WeaponSniperRifle': '狙击枪',
        'SPWeaponCaptureRope': '捕获绳索'
    };

    var ARMOR_SUB_LABELS = {
        'ArmorHead': '头盔',
        'ArmorBody': '衣服',
        'Shield': '护盾'
    };

    var WEAPON_GROUPING = {
        '近战武器': ['WeaponMelee'],
        '枪械': ['WeaponAssaultRifle', 'WeaponHandgun', 'WeaponShotgun', 'WeaponGatlingGun', 'WeaponFlameThrower', 'WeaponSniperRifle'],
        '发射器': ['WeaponRocketLauncher', 'WeaponThrowObject'],
        '弓弩': ['WeaponBow', 'WeaponCrossbow'],
        '工具': ['WeaponFishingRod', 'WeaponGrapplingGun', 'WeaponMetalDetector', 'SPWeaponCaptureRope']
    };

    var RARITY_LABEL = {
        1: '常见', 2: '少见', 3: '稀有', 4: '史诗', 5: '传奇'
    };

    var loadAllPromise = null;
    var dataReady = false;
    var itemReady = false;
    var buildingReady = false;

    function getLoader() {
        return (typeof window !== 'undefined' && window.PT_DATA_LOADER) ? window.PT_DATA_LOADER : null;
    }

    function loadAll() {
        if (dataReady) return Promise.resolve();
        if (loadAllPromise) return loadAllPromise;
        var loader = getLoader();
        if (!loader) return Promise.reject(new Error('PT_DATA_LOADER not available'));
        loadAllPromise = Promise.all([
            loader.loadJson(ITEM_DATA_URL).then(function(d) { itemData = d || []; indexItemData(); }).catch(function(){}).then(function(){ itemReady = true; }),
            loader.loadJson(BUILDING_DATA_URL).then(function(d) { buildingData = d || []; indexBuildingData(); }).catch(function(){}).then(function(){ buildingReady = true; }),
            loader.loadJson(RECIPE_DATA_URL).then(function(d) { recipeData = d || null; indexRecipeData(); }).catch(function(){}),
            loader.loadJson(DROP_DATA_URL).then(function(d) { dropData = d || null; indexDropData(); }).catch(function(){}),
            loader.loadJson(SKILL_DATA_URL).then(function(d) { skillData = d || null; indexPassiveSources(); }).catch(function(){})
        ]).then(function() {
            indexPassiveEquipmentCategories();
            dataReady = true;
        });
        return loadAllPromise;
    }

    function loadPalData() {
        if (palReady) return Promise.resolve();
        var loader = getLoader();
        if (!loader) return Promise.reject(new Error('PT_DATA_LOADER not available'));
        return loader.loadJson(PAL_DATA_URL).then(function(d) {
            palData = d || [];
            indexPalData();
            palReady = true;
        }).catch(function(err) {
            palData = [];
            indexPalData();
            palReady = true;
            throw err;
        });
    }

    function indexItemData() {
        itemById = {};
        itemCategoryCache = {};
        equipmentCache = null;
        itemData.forEach(function(item) {
            var id = item.id || '';
            if (id) itemById[id] = item;
            var cat = item.类别 || '';
            var primary = cat.split('/')[0];
            if (ITEM_CATEGORY_LABELS[primary]) {
                if (!itemCategoryCache[primary]) itemCategoryCache[primary] = [];
                itemCategoryCache[primary].push(item);
            }
        });
    }

    function indexBuildingData() {
        buildingByCategory = {};
        buildingData.forEach(function(b) {
            var cat = b.类别 || '其他';
            if (!buildingByCategory[cat]) buildingByCategory[cat] = [];
            buildingByCategory[cat].push(b);
        });
    }

    function indexRecipeData() {
        recipeByResult = {};
        recipeByMaterial = {};
        var rList = (recipeData && recipeData.recipes) ? recipeData.recipes : [];
        rList.forEach(function(r) {
            var resultId = r.productID || '';
            if (resultId) {
                if (!recipeByResult[resultId]) recipeByResult[resultId] = [];
                recipeByResult[resultId].push(r);
            }
            var materials = r.materials || [];
            materials.forEach(function(m) {
                var mid = m.itemID || '';
                if (mid) {
                    if (!recipeByMaterial[mid]) recipeByMaterial[mid] = [];
                    recipeByMaterial[mid].push(r);
                }
            });
        });
    }

    function indexPalData() {
        palNumberById = {};
        if (!Array.isArray(palData)) return;
        palData.forEach(function(p) {
            var id = p.id || '';
            var num = p['图鉴编号'];
            if (id && num != null) {
                palNumberById[id] = num;
            }
        });
    }

    function indexDropData() {
        dropBySource = {};
        if (!dropData) return;
        var pDrops = dropData.palDrops || {};
        Object.keys(pDrops).forEach(function(palId) {
            (pDrops[palId] || []).forEach(function(d) {
                if (!dropBySource[palId]) dropBySource[palId] = [];
                dropBySource[palId].push(d);
            });
        });
    }

    function indexPassiveSources() {
        if (!skillData || !skillData.passive) return;
        passiveSources = {};
        var groups = skillData.passive['已实装'] || {};
        Object.keys(groups).forEach(function(groupKey) {
            groups[groupKey].forEach(function(p) {
                if (!p.来源装备 || !p.来源装备.length) return;
                p.来源装备.forEach(function(equipId) {
                    if (!passiveSources[equipId]) passiveSources[equipId] = [];
                    passiveSources[equipId].push(p);
                });
            });
        });
        var uc = skillData.passive['未实装'] || [];
        uc.forEach(function(p) {
            if (!p.来源装备 || !p.来源装备.length) return;
            p.来源装备.forEach(function(equipId) {
                if (!passiveSources[equipId]) passiveSources[equipId] = [];
                passiveSources[equipId].push(p);
            });
        });
    }

    function indexPassiveEquipmentCategories() {
        passiveCategoryMap = {};
        if (!skillData || !skillData.passive) return;
        var groups = skillData.passive['已实装'] || {};
        var uc = skillData.passive['未实装'] || [];
        function classify(p) {
            var id = p.id || '';
            if (!id) return;
            var equipIds = p.来源装备 || [];
            if (!equipIds.length) {
                if (id.indexOf('_PAL') > -1 || id.indexOf('_Pal') > -1 || id.indexOf('_pal') > -1) {
                    passiveCategoryMap[id] = 'pal'; return;
                }
                var src = p.来源 || '';
                passiveCategoryMap[id] = PASSIVE_CAT_FALLBACK[src] || 'other';
                return;
            }
            var counts = {};
            equipIds.forEach(function(eid) {
                var item = itemById[eid];
                if (!item) return;
                var primary = (item.类别 || '').split('/')[0];
                var mapped = EQUIP_CAT_TO_PASSIVE_CAT[primary];
                if (mapped) counts[mapped] = (counts[mapped] || 0) + 1;
            });
            var best = 'other', bestN = 0;
            Object.keys(counts).forEach(function(c) {
                if (counts[c] > bestN) { best = c; bestN = counts[c]; }
            });
            if (bestN === 0) {
                var src = p.来源 || '';
                best = PASSIVE_CAT_FALLBACK[src] || 'other';
            }
            passiveCategoryMap[id] = best;
        }
        Object.keys(groups).forEach(function(k) { groups[k].forEach(classify); });
        uc.forEach(classify);
    }

    function getPassiveCategory(id) {
        return passiveCategoryMap[id] || 'other';
    }

    function getItem(id) {
        return itemById[id] || null;
    }

    function getItemsByPrimaryCategory(primary) {
        return itemCategoryCache[primary] || [];
    }

    function getItemsByLabel(label) {
        var key = ITEM_LABEL_TO_KEY[label];
        return key ? (itemCategoryCache[key] || []) : [];
    }

    function getEquipment() {
        if (equipmentCache) return equipmentCache;
        equipmentCache = [];
        itemData.forEach(function(item) {
            if (EQUIPMENT_CATEGORIES[(item.类别 || '').split('/')[0]]) {
                equipmentCache.push(item);
            }
        });
        return equipmentCache;
    }

    function getEquipmentByCategory(primary) {
        return getEquipment().filter(function(item) {
            return (item.类别 || '').split('/')[0] === primary;
        });
    }

    function getSubCategories(primary) {
        if (primary === '武器') return Object.keys(WEAPON_SUB_LABELS);
        if (primary === '防具') return Object.keys(ARMOR_SUB_LABELS);
        return [];
    }

    function getSubCategoryLabel(primary, sub) {
        if (primary === '武器') return WEAPON_SUB_LABELS[sub] || sub;
        if (primary === '防具') return ARMOR_SUB_LABELS[sub] || sub;
        return sub;
    }

    function getWeaponGroups() {
        return Object.keys(WEAPON_GROUPING);
    }

    function getWeaponSubsByGroup(group) {
        return WEAPON_GROUPING[group] || [];
    }

    function getRarityLabel(rarity) {
        return RARITY_LABEL[rarity] || ('稀有度' + rarity);
    }

    function getRecipesByResult(resultId) {
        return recipeByResult[resultId] || [];
    }

    function getRecipesByMaterial(materialId) {
        return recipeByMaterial[materialId] || [];
    }

    function getPassiveSourcesByEquipId(equipId) {
        return passiveSources[equipId] || [];
    }

    function getDropsBySource(sourceId) {
        return dropBySource[sourceId] || [];
    }

    function isEquipment(item) {
        return !!EQUIPMENT_CATEGORIES[(item.类别 || '').split('/')[0]];
    }

    function getItemPrimaryCategory(item) {
        return (item.类别 || '').split('/')[0];
    }

    function getItemSecondaryCategory(item) {
        var parts = (item.类别 || '').split('/');
        return parts.length > 1 ? parts[1] : '';
    }

    function getIconUrl(item) {
        var file = item.图标文件 || '';
        if (!file) return '';
        return '../游戏内容/幻兽帕鲁1.0/资源包/物品图标/' + file;
    }

    function getBuildingIconUrl(building) {
        var file = building.图标文件 || '';
        if (!file) return '';
        return '../游戏内容/幻兽帕鲁1.0/资源包/建筑图标/' + file;
    }

    function getDisplayName(item) {
        var name = item.中文名 || '';
        if (!name || name === 'zh-hans text' || name.indexOf('zh-Hans') > -1 || name.indexOf('zh-hans') > -1) {
            return item.id || '未命名';
        }
        return name;
    }

    function getPalNumberById(id) {
        return palNumberById[id];
    }

    return {
        loadAll: loadAll,
        loadPalData: loadPalData,
        isItemReady: function() { return itemReady; },
        isBuildingReady: function() { return buildingReady; },
        isDataReady: function() { return dataReady; },
        isPalReady: function() { return palReady; },
        getItem: getItem,
        getItemsByPrimaryCategory: getItemsByPrimaryCategory,
        getItemsByLabel: getItemsByLabel,
        getEquipment: getEquipment,
        getEquipmentByCategory: getEquipmentByCategory,
        getWeaponGroups: getWeaponGroups,
        getWeaponSubsByGroup: getWeaponSubsByGroup,
        getSubCategories: getSubCategories,
        getSubCategoryLabel: getSubCategoryLabel,
        getRarityLabel: getRarityLabel,
        getRecipesByResult: getRecipesByResult,
        getRecipesByMaterial: getRecipesByMaterial,
        getPassiveSourcesByEquipId: getPassiveSourcesByEquipId,
        getPassiveCategory: getPassiveCategory,
        getDropsBySource: getDropsBySource,
        isEquipment: isEquipment,
        getItemPrimaryCategory: getItemPrimaryCategory,
        getItemSecondaryCategory: getItemSecondaryCategory,
        getIconUrl: getIconUrl,
        getBuildingIconUrl: getBuildingIconUrl,
        getDisplayName: getDisplayName,
        getPalNumberById: getPalNumberById,
        EQUIPMENT_CATEGORIES: EQUIPMENT_CATEGORIES,
        ITEM_CATEGORY_LABELS: ITEM_CATEGORY_LABELS,
        ITEM_LABEL_TO_KEY: ITEM_LABEL_TO_KEY,
        get buildingData() { return buildingData; },
        get dropData() { return dropData; },
        get recipeData() { return recipeData; },
        get skillData() { return skillData; }
    };
})();

if (typeof window !== 'undefined') window.PT_CROSS_REF = PT_CROSS_REF;
if (typeof module !== 'undefined' && module.exports) module.exports = { PT_CROSS_REF: PT_CROSS_REF };
