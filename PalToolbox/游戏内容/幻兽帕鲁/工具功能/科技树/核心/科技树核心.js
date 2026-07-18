var PT_TECH_CORE = (function() {
    var techList = [];
    var oldLevelMap = null;
    var buildingMap = {};

    var RENAME_MAP = {
        '铁制大门': '金属大门',
        '野莓农园': '野莓园',
        '小麦农园': '小麦园',
        '番茄农园': '番茄园',
        '生菜农园': '生菜园',
        '帕鲁装置制作台': '帕鲁装备制作台'
    };

    function normalizeUnlock(list) {
        return (list || []).map(function(item) {
            return {
                id: item && item.id ? item.id : '',
                name: item && item.中文名 ? item.中文名 : (item && item.id ? item.id : '')
            };
        }).filter(function(item) {
            return item.id || item.name;
        });
    }

    function normalizeTech(raw) {
        raw = raw || {};
        return {
            id: raw.id || '',
            name: raw.中文名 || raw.id || '',
            description: raw.描述 || '',
            level: Number(raw.等级要求) || 0,
            points: Number(raw.科技点数) || 0,
            stage: Number(raw.阶段) || 0,
            prerequisite: raw.前置科技 || '',
            boss: raw.所需BOSS || '',
            research: raw.所需研究 || '',
            ancient: raw.古代科技 === true,
            iconFile: raw.图标文件 || '',
            buildings: normalizeUnlock(raw.解锁建筑),
            items: normalizeUnlock(raw.解锁物品)
        };
    }

    function sortTech(a, b) {
        return a.level - b.level ||
            a.stage - b.stage ||
            a.points - b.points ||
            String(a.name).localeCompare(String(b.name), 'zh-CN');
    }

    function setData(rawList) {
        techList = (rawList || []).map(normalizeTech).filter(function(item) {
            return !!item.id;
        }).sort(sortTech);
    }

    function setOldLevelMap(data) {
        oldLevelMap = data || null;
    }

    function setBuildings(data) {
        buildingMap = {};
        (data || []).forEach(function(b) {
            var bid = b.id || b.建筑ID || '';
            if (bid) buildingMap[bid] = b;
        });
    }

    function getBuildingById(id) {
        return buildingMap[id] || null;
    }

    function getAll() {
        return techList.slice();
    }

    function getLevels() {
        var map = {};
        techList.forEach(function(item) {
            if (item.level > 0) map[item.level] = true;
        });
        return Object.keys(map).map(function(level) {
            return Number(level);
        }).sort(function(a, b) {
            return a - b;
        });
    }

    function search(query, type, level) {
        var q = String(query || '').toLowerCase();
        var selectedLevel = Number(level) || 0;
        return techList.filter(function(item) {
            if (type === 'normal' && item.ancient) return false;
            if (type === 'ancient' && !item.ancient) return false;
            if (selectedLevel && item.level !== selectedLevel) return false;
            if (!q) return true;
            return String(item.name || '').toLowerCase().indexOf(q) > -1 ||
                String(item.id || '').toLowerCase().indexOf(q) > -1 ||
                String(item.description || '').toLowerCase().indexOf(q) > -1;
        });
    }

    function getIconUrl(item) {
        if (!item || !item.iconFile) return '';
        return '../游戏内容/幻兽帕鲁1.0/资源包/' + item.iconFile;
    }

    function getChangeDetail(item) {
        if (!oldLevelMap) return { changed: false };
        var name = item.name || '';
        var oldLevel = oldLevelMap[name];
        if (oldLevel === undefined) {
            for (var oldName in RENAME_MAP) {
                if (RENAME_MAP[oldName] === name) {
                    oldLevel = oldLevelMap[oldName];
                    break;
                }
            }
        }
        if (oldLevel === undefined) {
            return { changed: true, badge: '全新', oldLevel: null };
        }
        if (oldLevel === item.level) {
            return { changed: false };
        }
        return { changed: true, badge: '原本Lv.' + oldLevel, oldLevel: oldLevel };
    }

    return {
        setData: setData,
        setOldLevelMap: setOldLevelMap,
        setBuildings: setBuildings,
        getBuildingById: getBuildingById,
        getAll: getAll,
        getLevels: getLevels,
        search: search,
        getIconUrl: getIconUrl,
        getChangeDetail: getChangeDetail
    };
})();

if (typeof window !== 'undefined') {
    window.PT_TECH_CORE = PT_TECH_CORE;
}
