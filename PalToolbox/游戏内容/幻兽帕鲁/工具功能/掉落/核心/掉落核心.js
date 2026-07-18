var PT_DROP_CORE = (function() {
    var rawData = null;
    var typeOrder = ['pal', 'boss', 'raid', 'npc', 'human', 'tower', 'predator', 'quest', 'arena'];

    function load(callback) {
        fetch('../游戏内容/幻兽帕鲁1.0/数据包/掉落.json')
            .then(function(response) {
                if (!response.ok) throw new Error('掉落数据读取失败');
                return response.json();
            })
            .then(function(data) {
                setData(data);
                if (callback) callback(data);
            })
            .catch(function() {
                if (callback) callback(null);
            });
    }

    function setData(data) {
        rawData = data || null;
    }

    function getAll() {
        var drops = rawData && rawData.palDrops ? rawData.palDrops : {};
        return Object.keys(drops).map(function(id) {
            return drops[id];
        }).sort(function(left, right) {
            var leftOrder = typeOrder.indexOf(left.type);
            var rightOrder = typeOrder.indexOf(right.type);
            leftOrder = leftOrder < 0 ? typeOrder.length : leftOrder;
            rightOrder = rightOrder < 0 ? typeOrder.length : rightOrder;
            if (leftOrder !== rightOrder) return leftOrder - rightOrder;
            var leftName = left.nameCN || left.characterID || '';
            var rightName = right.nameCN || right.characterID || '';
            return leftName.localeCompare(rightName, 'zh-CN');
        });
    }

    function getById(id) {
        var drops = rawData && rawData.palDrops ? rawData.palDrops : {};
        return drops[id] || null;
    }

    function getTypeCounts() {
        return getAll().reduce(function(counts, entry) {
            counts[entry.type] = (counts[entry.type] || 0) + 1;
            return counts;
        }, {});
    }

    function filter(filters) {
        filters = filters || {};
        var search = String(filters.search || '').trim().toLowerCase();
        return getAll().filter(function(entry) {
            if (filters.type && entry.type !== filters.type) return false;
            if (filters.status === 'missing' && entry.nameStatus !== 'missing') return false;
            if (!search) return true;
            var itemText = (entry.items || []).map(function(item) {
                return [item.nameCN, item.itemID].join(' ');
            }).join(' ');
            var entryText = [entry.nameCN, entry.characterID, itemText].join(' ').toLowerCase();
            return entryText.indexOf(search) >= 0;
        });
    }

    return {
        load: load,
        setData: setData,
        getAll: getAll,
        getById: getById,
        getTypeCounts: getTypeCounts,
        filter: filter
    };
})();
if (typeof window !== 'undefined') window.PT_DROP_CORE = PT_DROP_CORE;
