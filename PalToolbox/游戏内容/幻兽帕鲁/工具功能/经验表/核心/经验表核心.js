var PT_EXP_CORE = (function() {
    var rawData = null;

    function loadData(callback) {
        fetch('../游戏内容/幻兽帕鲁1.0/数据包/经验表.json')
            .then(function(response) { return response.json(); })
            .then(function(data) {
                rawData = data;
                if (callback) callback(data);
            })
            .catch(function() {
                if (callback) callback(null);
            });
    }

    function getData() { return rawData; }
    function getPlayerExp() { return (rawData && rawData.playerExp) || []; }
    function getPalExp() { return (rawData && rawData.palExp) || []; }
    function getExpRatios() { return (rawData && rawData.expRatios) || []; }
    function getCaptureBonus() { return (rawData && rawData.captureBonus) || []; }
    function getDropBuildExp() { return (rawData && rawData.dropBuildExp) || []; }
    function getAreaFind() { return (rawData && rawData.areaFind) || {}; }

    return {
        loadData: loadData,
        getData: getData,
        getPlayerExp: getPlayerExp,
        getPalExp: getPalExp,
        getExpRatios: getExpRatios,
        getCaptureBonus: getCaptureBonus,
        getDropBuildExp: getDropBuildExp,
        getAreaFind: getAreaFind
    };
})();
if (typeof window !== 'undefined') window.PT_EXP_CORE = PT_EXP_CORE;
