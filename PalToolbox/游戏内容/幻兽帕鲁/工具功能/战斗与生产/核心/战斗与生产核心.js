var PT_COMBAT_CORE = (function() {
    var rawData = null;

    function load(callback) {
        fetch('../游戏内容/幻兽帕鲁1.0/数据包/战斗与生产.json')
            .then(function(response) { return response.json(); })
            .then(function(data) {
                rawData = data;
                if (callback) callback(data);
            })
            .catch(function() {
                if (callback) callback(null);
            });
    }

    function data() { return rawData; }
    function getCampLevels() { return (rawData && rawData.campLevels) || []; }
    function getCampTasks() { return (rawData && rawData.campTasks) || []; }
    function getWorkerEvents() { return (rawData && rawData.workerEvents) || []; }
    function getCrops() { return (rawData && rawData.crops) || []; }
    function getNpc() { return (rawData && rawData.npcs) || []; }
    function getFishPals() { return (rawData && rawData.fishPals) || []; }
    function getBait() { return (rawData && rawData.baits) || []; }
    function getDungeonAreas() {
        var dungeons = (rawData && rawData.dungeons) || {};
        return Object.keys(dungeons).map(function(name) {
            var source = dungeons[name] || {};
            var item = {};
            Object.keys(source).forEach(function(key) {
                item[key] = source[key];
            });
            item.areaName = name;
            return item;
        });
    }

    return {
        load: load,
        data: data,
        getCampLevels: getCampLevels,
        getCampTasks: getCampTasks,
        getWorkerEvents: getWorkerEvents,
        getCrops: getCrops,
        getNpc: getNpc,
        getFishPals: getFishPals,
        getBait: getBait,
        getDungeonAreas: getDungeonAreas
    };
})();
if (typeof window !== 'undefined') window.PT_COMBAT_CORE = PT_COMBAT_CORE;
