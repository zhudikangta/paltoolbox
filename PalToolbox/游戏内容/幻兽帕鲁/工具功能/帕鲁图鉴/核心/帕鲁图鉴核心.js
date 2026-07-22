var PT_PALDEX_CORE = (function() {
    var pals = [];
    var byId = {};
    var bySpecies = {};
    var bySlug = {};
    var sortNoBySpecies = {};
    var skillDetailById = {};
    var partnerSkillByPalId = {};

    var ELEMENT_NAME = {
        Normal: '无属性',
        Neutral: '无属性',
        None: '',
        Fire: '火属性',
        Water: '水属性',
        Leaf: '草属性',
        Grass: '草属性',
        Electricity: '雷属性',
        Thunder: '雷属性',
        Ice: '冰属性',
        Ground: '地属性',
        Earth: '地属性',
        Dark: '暗属性',
        Dragon: '龙属性'
    };

    var WORK_NAME = {
        手工: '手工作业',
        Handcraft: '手工作业',
        Collection: '采集',
        Mining: '采矿',
        Deforest: '伐木',
        ProductMedicine: '制药',
        Transport: '搬运',
        EmitFlame: '生火',
        Watering: '浇水',
        Seeding: '播种',
        GenerateElectricity: '发电',
        Cool: '冷却',
        MonsterFarm: '牧场',
        OilExtraction: '采油'
    };

    var SKILL_CATEGORY_NAME = {
        Melee: '近战',
        Shot: '射击',
        None: ''
    };

    var ELEMENTS = ['无属性', '火属性', '水属性', '草属性', '雷属性', '冰属性', '地属性', '暗属性', '龙属性'];
    var ELEMENT_COLORS = {
        '无属性': '#b6bcc5',
        '火属性': '#ff7167',
        '水属性': '#53b8ff',
        '草属性': '#52d887',
        '雷属性': '#ffd84d',
        '冰属性': '#5ee8ff',
        '地属性': '#b6845d',
        '暗属性': '#b47cff',
        '龙属性': '#ff9b4d'
    };
    var EL_ICON_MAP = {
        '无属性': '00',
        '火属性': '01',
        '水属性': '02',
        '雷属性': '03',
        '草属性': '04',
        '暗属性': '05',
        '龙属性': '06',
        '地属性': '07',
        '冰属性': '08'
    };
    var WORK_ICON_MAP = {
        '点火': '00',
        '生火': '00',
        '浇水': '01',
        '播种': '02',
        '发电': '03',
        '手工作业': '04',
        '采集': '05',
        '伐木': '06',
        '采矿': '07',
        '制药': '08',
        '冷却': '10',
        '搬运': '11',
        '牧场': '12'
    };

    function isPlaceholderName(name) {
        var value = String(name || '').trim();
        return !value || value.indexOf('zh_Hans_Text') === 0 || value.indexOf('zh-Hans Text') === 0;
    }

    function displayName(raw) {
        return isPlaceholderName(raw && raw.中文名) ? String(raw && raw.id || '') : raw.中文名;
    }

    function displayId(raw) {
        if (!raw || !raw.图鉴编号 || raw.图鉴编号 <= 0) return '';
        return String(raw.图鉴编号) + String(raw.图鉴后缀 || '');
    }

    function rawDexNo(raw) {
        return Number(raw && raw.图鉴编号) || 0;
    }

    function sortNo(raw) {
        var ownNo = rawDexNo(raw);
        if (ownNo > 0) return ownNo;
        var species = String(raw && raw.种族 || raw && raw.id || '');
        return sortNoBySpecies[species] || 99999;
    }

    function normalizeElement(value) {
        var normalized = ELEMENT_NAME[value] || value || '';
        return normalized === 'None' ? '' : normalized;
    }

    function normalizeWorks(rawWorks) {
        var result = [];
        var source = rawWorks || {};
        Object.keys(source).forEach(function(key) {
            var level = Number(source[key]);
            if (!level) return;
            result.push({ name: WORK_NAME[key] || key, level: level });
        });
        return result;
    }

    function comparePal(a, b) {
        var ai = sortNo(a.raw);
        var bi = sortNo(b.raw);
        if (ai !== bi) return ai - bi;
        var suffix = String(a.raw && a.raw.图鉴后缀 || '').localeCompare(String(b.raw && b.raw.图鉴后缀 || ''));
        if (suffix !== 0) return suffix;
        var aIndex = Number(a.raw && a.raw.__ptSourceIndex);
        var bIndex = Number(b.raw && b.raw.__ptSourceIndex);
        if (aIndex !== bIndex) return aIndex - bIndex;
        return String(a.name || a.id).localeCompare(String(b.name || b.id));
    }

    function normalizePal(raw) {
        raw = raw || {};
        var id = String(raw.id || '');
        var species = String(raw.种族 || id);
        var name = displayName(raw);
        var elements = [normalizeElement(raw.属性1), normalizeElement(raw.属性2)].filter(function(item, index, list) {
            return item && list.indexOf(item) === index;
        });
        var icon = '';
        if (raw.头像文件 && (raw.头像状态 === '已存在' || raw.头像状态 === '已复制')) {
            icon = '../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/' + raw.头像文件;
        }
        return {
            id: id,
            species: species,
            slug: id,
            displayId: displayId(raw),
            name: name,
            nameStatus: raw.中文名状态 || '',
            category: raw.分类 || '',
            implementStatus: raw.实装状态 || '',
            dataStatus: raw.数据状态 || '',
            icon: icon,
            iconFile: raw.头像文件 || '',
            iconStatus: raw.头像状态 || '',
            iconSourceKey: raw.头像来源键 || '',
            elements: elements,
            works: normalizeWorks(raw.工作适性),
            stats: {
                HP: raw.HP,
                攻击: raw.远程攻击 || raw.近战攻击,
                近战攻击: raw.近战攻击,
                远程攻击: raw.远程攻击,
                防御: raw.防御,
                繁殖力: raw.繁殖力,
                稀有度: raw.稀有度,
                移动速度: raw.移动速度,
                骑乘冲刺: raw.骑乘冲刺,
                食物量: raw.食物量,
                雄性概率: raw.雄性概率,
                是否夜行: !!raw.是否夜行
            },
            breedPower: raw.繁殖力,
            canBreed: !!raw.可配种,
            partnerSkill: raw.伙伴技能 || '',
            partnerSkillDescription: raw.伙伴技能描述 || '',
            activeSkills: (raw.技能学习 || []).map(function(skill) { return skill.技能名 || skill.技能ID || ''; }).filter(Boolean),
            learnSkills: raw.技能学习 || [],
            drops: (raw.掉落列表 || []).map(function(item) { return item.物品名 || item.物品ID || ''; }).filter(Boolean),
            dropList: raw.掉落列表 || [],
            description: raw.描述 || '',
            shortDescription: raw.短描述 || '',
            raw: raw
        };
    }

    function rebuildIndexes() {
        byId = {};
        bySpecies = {};
        bySlug = {};
        pals.forEach(function(pal) {
            if (pal.id) byId[pal.id] = pal;
            if (pal.slug) bySlug[pal.slug] = pal;
            if (pal.species && !bySpecies[pal.species]) bySpecies[pal.species] = pal;
        });
    }

    function setData(rawList) {
        sortNoBySpecies = {};
        (rawList || []).forEach(function(raw, index) {
            raw.__ptSourceIndex = index;
            var no = rawDexNo(raw);
            if (no <= 0) return;
            var species = String(raw && raw.种族 || raw && raw.id || '');
            if (species && !sortNoBySpecies[species]) sortNoBySpecies[species] = no;
        });
        pals = (rawList || []).map(normalizePal).sort(comparePal);
        rebuildIndexes();
    }

    function setSkillData(data) {
        var cache = {};
        var palLearnSkills = data && data.palLearnSkills ? data.palLearnSkills : {};
        Object.keys(palLearnSkills).forEach(function(palId) {
            var pal = palLearnSkills[palId] || {};
            (pal.skills || []).forEach(function(skill) {
                if (!skill || !skill.wazaID || cache[skill.wazaID]) return;
                cache[skill.wazaID] = {
                    id: skill.wazaID,
                    name: skill.nameCN || skill.wazaID,
                    element: ELEMENT_NAME[skill.element] || skill.element || '',
                    category: SKILL_CATEGORY_NAME[skill.category] || skill.category || '',
                    power: skill.power
                };
            });
        });
        skillDetailById = cache;
    }

    function setPartnerSkillData(data) {
        partnerSkillByPalId = data && data.partnerSkills ? data.partnerSkills : {};
    }

    function getSkillDetail(skillId) {
        return skillDetailById[skillId] || null;
    }

    function getPartnerSkillDetail(palId) {
        return partnerSkillByPalId[palId] || null;
    }

    function getAll() {
        return pals.slice();
    }

    function getById(id) {
        return byId[id] || null;
    }

    function getBySpecies(species) {
        return bySpecies[species] || byId[species] || null;
    }

    function getBySlug(slug) {
        return bySlug[slug] || byId[slug] || null;
    }

    function search(query) {
        if (!query) return getAll();
        var q = String(query).toLowerCase();
        return pals.filter(function(pal) {
            if (pal.nameStatus !== '缺中文名' && String(pal.name || '').toLowerCase().indexOf(q) > -1) return true;
            if (String(pal.displayId || '').toLowerCase().indexOf(q) > -1) return true;
            return false;
        });
    }

    function filterByElement(element) {
        if (!element) return getAll();
        return pals.filter(function(pal) { return pal.elements.indexOf(element) > -1; });
    }

    function filterByWork(work) {
        if (!work) return getAll();
        return pals.filter(function(pal) {
            return pal.works.some(function(item) { return item.name === work; });
        });
    }

    function getElementColor(element) {
        return ELEMENT_COLORS[element] || '#b6bcc5';
    }

    function getWorkIcon(work) {
        var map = {
            '手工作业': '手',
            '采集': '采',
            '采矿': '矿',
            '伐木': '木',
            '制药': '药',
            '搬运': '搬',
            '生火': '火',
            '浇水': '水',
            '播种': '种',
            '发电': '电',
            '冷却': '冷',
            '牧场': '牧'
        };
        return map[work] || '项';
    }

    function getElementIconUrl(element) {
        var code = EL_ICON_MAP[element];
        return code ? '../游戏内容/幻兽帕鲁1.0/资源包/属性图标/T_Icon_element_s_' + code + '.webp' : '';
    }

    function getWorkIconUrl(work) {
        var code = WORK_ICON_MAP[work];
        return code ? '../游戏内容/幻兽帕鲁1.0/资源包/工作图标/T_icon_palwork_' + code + '.webp' : '';
    }

    function getPalHabitat(palId) {
        var mapData = typeof window !== 'undefined' && window.PT_MAP_DATA;
        if (!mapData) return null;

        var dist = mapData.paldexDistribution || [];
        for (var i = 0; i < dist.length; i++) {
            if (dist[i].palID === palId) {
                var d = dist[i];
                var points = [];
                (d.dayLocations || []).forEach(function(loc) {
                    points.push({pos: loc.pos, ipos: loc.ipos, type: 'day'});
                });
                (d.nightLocations || []).forEach(function(loc) {
                    points.push({pos: loc.pos, ipos: loc.ipos, type: 'night'});
                });
                if (points.length) return {palId: palId, source: 'habitat', points: points, totalPoints: points.length};
            }
        }

        var boss = mapData.bossSpawns || [];
        var bossPrefix = 'BOSS_' + palId;
        for (var j = 0; j < boss.length; j++) {
            if (boss[j].characterID === bossPrefix) {
                return {palId: palId, source: 'boss', points: [{pos: boss[j].pos, ipos: boss[j].ipos, type: 'boss', level: boss[j].level}], totalPoints: 1};
            }
        }

        return null;
    }

    return {
        ELEMENTS: ELEMENTS,
        setData: setData,
        setSkillData: setSkillData,
        setPartnerSkillData: setPartnerSkillData,
        getAll: getAll,
        getById: getById,
        getBySpecies: getBySpecies,
        getBySlug: getBySlug,
        getSkillDetail: getSkillDetail,
        getPartnerSkillDetail: getPartnerSkillDetail,
        search: search,
        filterByElement: filterByElement,
        filterByWork: filterByWork,
        getElementColor: getElementColor,
        getWorkIcon: getWorkIcon,
        getElementIconUrl: getElementIconUrl,
        getWorkIconUrl: getWorkIconUrl,
        getPalHabitat: getPalHabitat
    };
})();

if (typeof window !== 'undefined') window.PT_PALDEX_CORE = PT_PALDEX_CORE;
if (typeof module !== 'undefined' && module.exports) module.exports = { PT_PALDEX_CORE: PT_PALDEX_CORE };
