var PT_MISSION_CORE = (function() {
    var questData = null;
    var missionData = null;

    function load(callback) {
        Promise.all([
            fetch('../游戏内容/幻兽帕鲁1.0/数据包/任务.json').then(function(response) { return response.json(); }),
            fetch('../游戏内容/幻兽帕鲁1.0/数据包/任务与人物.json').then(function(response) { return response.json(); })
        ]).then(function(result) {
            questData = result[0];
            missionData = result[1];
            if (callback) callback({ quests: questData, missions: missionData });
        }).catch(function() {
            if (callback) callback(null);
        });
    }

    function getMainQuests() { return (questData && questData.main) || []; }
    function getSubQuests() { return (questData && questData.sub) || []; }
    function getMissions() { return (missionData && missionData.missions) || []; }
    function getGeneratedQuests() { return (missionData && missionData.quests) || []; }
    function getShops() { return (missionData && missionData.shops) || []; }

    return {
        load: load,
        getMainQuests: getMainQuests,
        getSubQuests: getSubQuests,
        getMissions: getMissions,
        getGeneratedQuests: getGeneratedQuests,
        getShops: getShops
    };
})();
if (typeof window !== 'undefined') window.PT_MISSION_CORE = PT_MISSION_CORE;
