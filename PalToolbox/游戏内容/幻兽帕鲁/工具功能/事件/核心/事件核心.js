var PT_INCIDENT_CORE = (function() {
    var rawData = null;

    function load(callback) {
        fetch('../游戏内容/幻兽帕鲁1.0/数据包/事件.json')
            .then(function(response) { return response.json(); })
            .then(function(data) {
                rawData = data;
                if (callback) callback(data);
            })
            .catch(function() {
                if (callback) callback(null);
            });
    }

    function getIncidents() { return (rawData && rawData.incidents) || []; }
    function getIncidentSettings() { return (rawData && rawData.incidentSettings) || []; }
    function getCategories() {
        var map = {};
        getIncidents().forEach(function(incident) {
            var key = incident.categoryLabel || incident.category;
            if (key) map[key] = true;
        });
        return Object.keys(map).sort();
    }

    return {
        load: load,
        getIncidents: getIncidents,
        getIncidentSettings: getIncidentSettings,
        getCategories: getCategories
    };
})();
if (typeof window !== 'undefined') window.PT_INCIDENT_CORE = PT_INCIDENT_CORE;
