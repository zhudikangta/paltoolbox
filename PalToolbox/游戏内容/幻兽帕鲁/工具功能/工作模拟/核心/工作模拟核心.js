var PT_WORKSIM_CORE = (function() {
    var pals = [];
    var workTypes = ['生火', '浇水', '播种', '发电', '手工', '采集', '伐木', '采矿', '采油', '制药', '冷却', '搬运', '牧场'];

    function load(callback) {
        fetch('../游戏内容/幻兽帕鲁1.0/数据包/帕鲁.json')
            .then(function(response) { return response.json(); })
            .then(function(data) {
                pals = (Array.isArray(data) ? data : Object.values(data || {})).filter(function(pal) {
                    return pal && pal.工作适性 && Object.keys(pal.工作适性).length;
                });
                if (callback) callback(pals);
            })
            .catch(function() {
                pals = [];
                if (callback) callback(null);
            });
    }

    function getWorkTypes() { return workTypes.slice(); }

    function getCounts() {
        var counts = {};
        workTypes.forEach(function(type) { counts[type] = 0; });
        pals.forEach(function(pal) {
            workTypes.forEach(function(type) {
                if (pal.工作适性 && pal.工作适性[type]) counts[type] += 1;
            });
        });
        return counts;
    }

    function getPalsByWork(type) {
        return pals.filter(function(pal) {
            return pal.工作适性 && pal.工作适性[type];
        }).sort(function(a, b) {
            return (b.工作适性[type] || 0) - (a.工作适性[type] || 0) || (a.图鉴编号 || 0) - (b.图鉴编号 || 0);
        });
    }

    return {
        load: load,
        getWorkTypes: getWorkTypes,
        getCounts: getCounts,
        getPalsByWork: getPalsByWork
    };
})();
if (typeof window !== 'undefined') window.PT_WORKSIM_CORE = PT_WORKSIM_CORE;
