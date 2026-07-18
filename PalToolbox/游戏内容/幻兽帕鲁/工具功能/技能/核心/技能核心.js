var PT_SKILL_CORE = (function() {
    var activeSkills = [];
    var partnerSkills = [];

    var ELEMENT_NAME = {
        Normal: '无属性',
        Fire: '火属性',
        Water: '水属性',
        Leaf: '草属性',
        Grass: '草属性',
        Electricity: '雷属性',
        Thunder: '雷属性',
        Ice: '冰属性',
        Earth: '地属性',
        Ground: '地属性',
        Dark: '暗属性',
        Dragon: '龙属性'
    };

    function normalizeElement(value) {
        return ELEMENT_NAME[value] || value || '';
    }

    function setActiveSkillData(raw) {
        var map = {};
        var palMap = raw && raw.palLearnSkills ? raw.palLearnSkills : {};
        Object.keys(palMap).forEach(function(palId) {
            var pal = palMap[palId] || {};
            (pal.skills || []).forEach(function(skill) {
                var id = skill.wazaID || skill.id || '';
                if (!id) return;
                if (!map[id]) {
                    map[id] = {
                        id: id,
                        name: skill.nameCN || id,
                        element: normalizeElement(skill.element),
                        category: skill.category || '',
                        power: skill.power,
                        learnedBy: []
                    };
                }
                map[id].learnedBy.push({
                    palId: palId,
                    palName: pal.nameCN || palId,
                    level: skill.level
                });
            });
        });
        activeSkills = Object.keys(map).map(function(id) {
            var item = map[id];
            item.learnedBy.sort(function(a, b) {
                return (Number(a.level) || 0) - (Number(b.level) || 0) || String(a.palName).localeCompare(String(b.palName));
            });
            return item;
        }).sort(function(a, b) {
            return String(a.name).localeCompare(String(b.name));
        });
    }

    function setPartnerSkillData(raw) {
        var source = raw && raw.partnerSkills ? raw.partnerSkills : {};
        partnerSkills = Object.keys(source).map(function(id) {
            var item = source[id] || {};
            return {
                id: item.id || id,
                name: item.nameCN || item.id || id,
                type: item.typeLabel || item.skillType || '',
                trigger: item.trigger || '',
                cooldown: item.coolDown,
                description: item.description || '',
                values: item.values || []
            };
        }).sort(function(a, b) {
            return String(a.name).localeCompare(String(b.name));
        });
    }

    function getActiveSkills() {
        return activeSkills.slice();
    }

    function getPartnerSkills() {
        return partnerSkills.slice();
    }

    function search(kind, query) {
        var list = kind === 'partner' ? partnerSkills : activeSkills;
        var q = String(query || '').toLowerCase();
        if (!q) return list.slice();
        return list.filter(function(item) {
            return String(item.name || '').toLowerCase().indexOf(q) > -1 ||
                String(item.id || '').toLowerCase().indexOf(q) > -1 ||
                String(item.element || '').toLowerCase().indexOf(q) > -1 ||
                String(item.type || '').toLowerCase().indexOf(q) > -1 ||
                String(item.description || '').toLowerCase().indexOf(q) > -1;
        });
    }

    return {
        setActiveSkillData: setActiveSkillData,
        setPartnerSkillData: setPartnerSkillData,
        getActiveSkills: getActiveSkills,
        getPartnerSkills: getPartnerSkills,
        search: search
    };
})();

if (typeof window !== 'undefined') {
    window.PT_SKILL_CORE = PT_SKILL_CORE;
}
