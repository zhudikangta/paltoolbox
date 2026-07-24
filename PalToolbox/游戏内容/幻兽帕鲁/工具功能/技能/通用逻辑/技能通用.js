var PT_SKILL_COMMON = (function() {
    var state = {
        searchQ: '',
        category: '全部',
        subCategory: '全部',
        source: '全部',
        showUnreleased: false,
        sortByLevel: false,
        onlyNew: false,
        excludeHidden: true,
        onlyNewActive: false
    };

    var OLD_ACTIVE_SKILL_NAMES = new Set([
        '毒雾', '剧毒射击', '暗黑球', '黑暗霰射', '暗能弹', '黑暗弹',
        '召唤仆从', '史莱姆重压（暗）', '暗影波动', '幻影突袭', '飞跃爪击', '眼球突击',
        '黑暗箭', '鬼火', '火阴山雷', '暗焰冲撞', '蜘蛛猛袭', '毒雨',
        '心灵冲刺', '恶之爪', '恶梦球', '窃魂', '凝视突击', '启示录',
        '升虫拳', '双枪一闪', '烈焰华尔兹', '怨念连击', '噩梦射线', '致命舞步',
        '暗黑雷射', '神圣灾祸', '黑暗之拥', '噩梦绽放', '神圣灾祸Ⅱ', '星幽炮',
        '龙息弹', '火箭冲撞', '龙之波动', '龙息', '神秘旋风', '唤星',
        '绽裂龙息', '陨星', '光连斩', '切割龙息', '魔龙焚炎', '光束彗星',
        '龙息炮', '龙彗星', '龙陨震击', '陨星雨', '圣盾冲锋', '苍穹落星',
        '欧米伽雷射', '泥浆投掷', '猪突猛进', '碎石霰弹', '甲壳回旋', '投石',
        '终极角击', '沙尘旋风', '碎岩爪', '回旋踢', '地震', '地之冲锋',
        '跳跃重刺', '巨力冲锋', '碎岩冲锋', '岩爆', '粉碎大地', '回旋岩锯',
        '岩石锐矛', '沙尘暴', '震岩', '电火花', '雷矛', '冲击波',
        '闪电球', '疾风雷击', '等离子浮游砲', '召雷', '锁定雷射', '雷击',
        '闪电俯冲', '爆裂拳击', '霹雳连爪', '三重雷击', '雷云之岚', '雷神之枪',
        '三相火花', '闪电冲击', '雷动八方', '广域雷击', '王者闪击', '闪电伏特',
        '雷击的重型战车', '雷霆飓风', '雷神之怒', '并联雷光', '风驰电掣', '烈焰射击',
        '烈焰溅射', '炽热角击', '史莱姆重压（火）', '烈焰箭', '居合斩', '烈焰放射',
        '狱火爪', '风林火山', '烈焰风暴', '烈焰冲撞', '燧火连击', '炽焰掠空',
        '炽灯横扫', '火山爆发', '爆烈火墙', '地狱火', '流火', '火山獠牙',
        '熔岩爆发', '凤凰翔波', '炎凰烈波', '腾龙奔炎', '烈焰球', '焚天爆炎',
        '冰雪飞弹', '冰刃', '吹雪爪击', '霜角猛攻', '冰刺', '王者滑击',
        '暴雪爪', '凛冬之息', '寒霜掠空', '烈冻爪', '妙玉连珠', '霜冻爆裂',
        '滚雪球', '寒冰之壁', '冰晶之翼', '冰霜连弹', '冰锋之路', '钻石星辰',
        '冰极冻域', '晶钻之雨', '冰鲸跃', '冰川碎击', '极寒双星', '丰饶加护',
        '风刃', '种子机关枪', '史莱姆重压（草）', '针刺长矛', '花龙摆尾', '三重风刃',
        '种子地雷', '精准狙击', '回旋杖击', '铁山靠', '绿野飓风', '筋肉重拳',
        '烈风切', '回旋猛踢', '缠绕地刺', '滚草球', '叶返', '缠根牢狱',
        '冲锋踢', '连锁叶刃', '花粉吐息', '十字风切', '太阳光束', '蜂！蜂！蜂！',
        '空气弹', '皮皮冲鸡', '能量射击', '滚滚毛球', '喵喵拳', '绒毛冲撞',
        '狂野獠牙', '尖角顶击', '史莱姆重压（无）', '滑空爪', '喵咪扑击', '龙卷风',
        '元气弹', '蝙蝠袭击', '剑舞冲锋', '猩猩连打', '真空刃', '阴云之岚',
        '泰山压顶', '史莱姆重压（彩虹）', '诡雷繁星', '青月刃', '闪枪冲锋', '光击阵',
        '辉耀弹', '流光翼彩', '帕鲁光束', '皎月射线', '气合返', '神圣新星',
        '光之雨', '自爆', '神光尽灭', '超自爆', '水流射击', '水枪',
        '史莱姆重压（水）', '泡泡射击', '酸雨', '墨沫头槌', '瀑流击', '漩涡回旋',
        '提灯横扫', '爆裂水球', '分流水炮', '午时已到', '间隙潮', '水刀切割',
        '凤凰浪涛', '断海覆潮', '高压水炮', '漩涡新星', '潮涌迸发', '风暴潮'
    ]);

    var OLD_PAL_PASSIVE_NAMES = new Set([
        '卓绝技艺','金刚之躯','稀有','传说','魔女','永炎','侵略者','鬼神','极限绝食',
        '明镜止水','神速','永动机','吸血鬼','湖之主','破浪王者','救世主','工匠精神',
        '顽强肉体','凶猛','突袭指挥官','铁壁军师','啦啦队','矿山首领','采伐领袖',
        '节食大师','工作狂','圣天','炎帝','海皇','雷帝','精灵王','冰帝','岩帝','冥王',
        '神龙','运动健将','博爱主义者','沉着冷静','无限精力','高贵','游泳健将','脑筋',
        '认真','坚硬皮肤','勇敢','粗暴','自恋狂','虐待狂','受虐狂','社畜','强势',
        '一反常态','拥抱烈日','防水性能','绝缘体','除草效果','高温体质','抗震结构',
        '阳光开朗','屠龙者','禅境','喜欢玩火','喜欢戏水','电容','草木馨香','冷血',
        '大地之力','夜幕','龙之血脉','小胃','积极思维','灵活','夜行性','急性子',
        '健康宝宝','贵族','未知生物细胞','悠然泳姿','笨手笨脚','弱不禁风','胆小',
        '贪吃','情绪不稳','手下留情','慢性子','家里蹲','寒酸','无底之胃','毁灭欲望',
        '偷懒成瘾','骨质疏松','消极主义者'
    ]);
    var listeners = [];

    var CATEGORY_MAP = {
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

    var CATEGORY_LABEL = {
        'pal': '帕鲁词条',
        'weapon': '武器词条',
        'armor': '防具词条',
        'accessory': '饰品词条',
        'general': '通用词条',
        'other': '其他'
    };

    var CATEGORY_ORDER = ['pal', 'weapon', 'armor', 'accessory', 'general', 'other'];

    var SUB_CAT_LABEL = {
        'work': '工作词条',
        'combat': '战斗词条',
        'moveSpeed': '移动速度',
        'swimSpeed': '水中速度',
        'san': 'SAN值词条',
        'other': '其他'
    };
    var SUB_CAT_ORDER = ['work', 'combat', 'moveSpeed', 'swimSpeed', 'san', 'other'];

    function getSubCategory(raw) {
        var types = [];
        if (raw.效果类型) types.push(raw.效果类型);
        (raw.效果组 || []).forEach(function(g) { if (g.类型) types.push(g.类型); });
        var isWork = types.some(function(t) {
            return t.indexOf('Logging') > -1 || t.indexOf('Mining') > -1 || t.indexOf('CraftSpeed') > -1 ||
                t.indexOf('WorkSuitability') > -1 || t.indexOf('EggHatching') > -1 ||
                t.indexOf('Nocturnal') > -1 || t.indexOf('NightOwl') > -1 || t === 'Collection';
        });
        if (isWork) return 'work';
        var isCombat = types.some(function(t) {
            return t.indexOf('ElementBoost') > -1 || t.indexOf('ElementResist') > -1 || t.indexOf('Attack') > -1 ||
                t.indexOf('Defense') > -1 || t.indexOf('LifeSteal') > -1 || t.indexOf('CaptureLevel') > -1 ||
                t.indexOf('Bullet') > -1 || t.indexOf('Reload') > -1 || t.indexOf('Recoil') > -1 ||
                t.indexOf('Homing') > -1 || t.indexOf('Explosive') > -1 ||
                t.indexOf('DamageUpIfEquipped') > -1 || t.indexOf('ActiveSkillCoolTime') > -1 ||
                t.indexOf('PalSP') > -1 || t.indexOf('AttackRate') > -1 || t.indexOf('Critical') > -1 ||
                t.indexOf('NonKilling') > -1 || t.indexOf('Mute') > -1;
        });
        if (isCombat) return 'combat';
        if (types.some(function(t) { return t.indexOf('SwimSpeed') > -1; })) return 'swimSpeed';
        if (types.some(function(t) { return t.indexOf('MoveSpeed') > -1 || t.indexOf('Jump') > -1 || t.indexOf('AirDash') > -1 || t.indexOf('AvoidDuration') > -1 || t.indexOf('PlayerSP') > -1 || t.indexOf('RideJump') > -1; })) return 'moveSpeed';
        if (types.some(function(t) { return t.indexOf('AutoHPRegene') > -1 || t.indexOf('Sanity') > -1; })) return 'san';
        return 'other';
    }

    function notify() {
        listeners.forEach(function(fn) { fn(); });
    }

    function onChange(fn) {
        listeners.push(fn);
    }

    function setCategory(c) {
        state.category = c;
        state.subCategory = '全部';
        state.source = '全部';
        state.searchQ = '';
        notify();
    }

    function setSubCategory(s) {
        state.subCategory = s;
        state.searchQ = '';
        notify();
    }

    function setSource(s) {
        state.source = s;
        state.searchQ = '';
        notify();
    }

    function setSearch(q) {
        state.searchQ = q;
        notify();
    }

    function toggleUnreleased() {
        state.showUnreleased = !state.showUnreleased;
        notify();
    }

    function toggleSortByLevel() {
        state.sortByLevel = !state.sortByLevel;
        notify();
    }

    function toggleOnlyNew() {
        state.onlyNew = !state.onlyNew;
        notify();
    }

    function toggleExcludeHidden() {
        state.excludeHidden = !state.excludeHidden;
        notify();
    }

    function toggleOnlyNewActive() {
        state.onlyNewActive = !state.onlyNewActive;
        notify();
    }

    function isNewPalPassive(name) {
        return !OLD_PAL_PASSIVE_NAMES.has(name || '');
    }

    function getFiltered(raw) {
        if (!raw) return [];
        var groups = (raw.passive || {})['已实装'] || {};
        var uc = raw.passive['未实装'] || [];
        var ref = (typeof window !== 'undefined' && window.PT_CROSS_REF) ? window.PT_CROSS_REF : null;
        function getCat(id) { return ref ? ref.getPassiveCategory(id) : 'other'; }
        var all = [];
        function isPalId(id) { return id && (id.indexOf('_PAL') > -1 || id.indexOf('_Pal') > -1 || id.indexOf('_pal') > -1); }
        function displaySrc(item, id) {
            var src = item.来源 || '';
            if (src === '伙伴技能') return src;
            if (src === '其他' && isPalId(id)) return '传说Boss被动';
            if (src === '变异帕鲁额外被动') return '屋久岛变异帕鲁';
            return src;
        }
        Object.keys(groups).forEach(function(key) {
            groups[key].forEach(function(item) {
                var src = item.来源 || '';
                if (src === '伙伴技能') return;
                all.push({ _group: key, _unreleased: false, _raw: item, _equipCat: getCat(item.id || ''), _subCat: getSubCategory(item), _displaySrc: displaySrc(item, item.id || '') });
            });
        });
        uc.forEach(function(item) {
            var src = item.来源 || '';
            if (src === '伙伴技能') return;
            all.push({ _group: '', _unreleased: true, _raw: item, 来源: src, _equipCat: getCat(item.id || ''), _subCat: getSubCategory(item), _displaySrc: displaySrc(item, item.id || '') });
        });
        if (!state.showUnreleased) all = all.filter(function(i) { return !i._unreleased; });
        if (state.source !== '全部') {
            all = all.filter(function(i) {
                return (i._displaySrc || i.来源 || i._raw.来源 || '') === state.source;
            });
        }
        if (state.searchQ) {
            var q = state.searchQ.toLowerCase();
            all = all.filter(function(i) {
                var item = i._raw || i;
                var name = item.中文名 || '';
                var eid = item.id || '';
                var src = item.来源 || '';
                var equipNames = (item.来源装备名 || []).join(' ');
                return name.toLowerCase().indexOf(q) > -1 || eid.toLowerCase().indexOf(q) > -1 ||
                    src.toLowerCase().indexOf(q) > -1 || equipNames.toLowerCase().indexOf(q) > -1 ||
                    (item.效果描述 || []).some(function(d) { return d.toLowerCase().indexOf(q) > -1; });
            });
        }
        return all;
    }

    function getCategorizedFiltered(raw) {
        var all = getFiltered(raw);
        var result = {};
        CATEGORY_ORDER.forEach(function(c) { result[c] = {}; });
        all.forEach(function(i) {
            var cat = i._equipCat || 'other';
            if (!result[cat]) result[cat] = {};
            var src = i._displaySrc || (i._raw || i).来源 || '其他';
            if (!result[cat][src]) result[cat][src] = [];
            result[cat][src].push(i);
        });
        CATEGORY_ORDER.forEach(function(cat) {
            var sorted = {};
            Object.keys(result[cat]).sort(function(a, b) {
                return a.localeCompare(b, 'zh-Hans-CN') || result[cat][b].length - result[cat][a].length;
            }).forEach(function(k) { sorted[k] = result[cat][k]; });
            result[cat] = sorted;
        });
        return result;
    }

    function getActiveFiltered(raw) {
        if (!raw || !raw.active) return [];
        var list = raw.active;
        if (state.excludeHidden) {
            list = list.filter(function(s) {
                var name = s.中文名 || '';
                if (!name) return false;
                if (name.indexOf('zh-Hans') > -1 || name.indexOf('zh-hans') > -1) return false;
                if (s.禁用) return false;
                return true;
            });
        }
        if (state.onlyNewActive) {
            list = list.filter(function(s) {
                return !OLD_ACTIVE_SKILL_NAMES.has(s.中文名 || s.id);
            });
        }
        if (!state.searchQ) return list;
        var q = state.searchQ.toLowerCase();
        return list.filter(function(i) {
            return (i.中文名 || '').toLowerCase().indexOf(q) > -1 || (i.id || '').toLowerCase().indexOf(q) > -1 ||
                (i.属性 || '').toLowerCase().indexOf(q) > -1 || (i.类别 || '').toLowerCase().indexOf(q) > -1;
        });
    }

    function getState() {
        return state;
    }

    function getSourcesForCategory(raw, catKey) {
        var sources = {};
        var groups = (raw.passive || {})['已实装'] || {};
        Object.keys(groups).forEach(function(key) {
            groups[key].forEach(function(item) {
                var src = item.来源 || '';
                if (src === '伙伴技能') return;
                var mapped = CATEGORY_MAP[src] || 'other';
                if (catKey && catKey !== '全部' && mapped !== catKey) return;
                if (!sources[src]) sources[src] = { count: 0, label: src };
                sources[src].count++;
            });
        });
        return sources;
    }

    function partnerTableText(value, showEmptyPlaceholder) {
        var normalized = value;
        if (normalized === undefined || normalized === null || (showEmptyPlaceholder && normalized === '')) normalized = '--';
        return String(normalized)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function renderPartnerRankTable(rankTable) {
        if (!rankTable || !Array.isArray(rankTable.columns) || !rankTable.columns.length ||
            !Array.isArray(rankTable.rows) || !rankTable.rows.length) return '';
        var columns = rankTable.columns;
        var heading = '<th>' + partnerTableText(rankTable.rankLabel || (rankTable.type === 'stars' ? '星级' : '等级'), false) + '</th>' +
            columns.map(function(column) {
                var unit = column.unit ? '（' + column.unit + '）' : '';
                return '<th>' + partnerTableText(column.label, false) + partnerTableText(unit, false) + '</th>';
            }).join('');
        var body = rankTable.rows.map(function(row) {
            var suffix = rankTable.type === 'stars' ? '★' : (rankTable.type === 'levels' ? '级' : '');
            var rank = partnerTableText(row.rank, false) + suffix;
            return '<tr><th>' + rank + '</th>' + columns.map(function(column, index) {
                var value = row.values && row.values[index];
                var sourceBlankGliderValue = (value === null || value === undefined) && /^glider_/.test(String(column.key || ''));
                return '<td>' + (sourceBlankGliderValue ? '' : partnerTableText(value, true)) + '</td>';
            }).join('') + '</tr>';
        }).join('');
        var tableTitle = rankTable.title ? '<div class="pt-partner-table-title">' + partnerTableText(rankTable.title, false) +
            (rankTable.sourceLabel ? '（' + partnerTableText(rankTable.sourceLabel, false) + '）' : '') + '</div>' :
            (rankTable.sourceLabel ? '<div class="pt-partner-table-title">' + partnerTableText(rankTable.sourceLabel, false) + '</div>' : '');
        var tableClass = 'pt-partner-rank-table' + (rankTable.type === 'measured' ? ' pt-partner-rank-table--measured' : '');
        return '<div class="pt-partner-rank-wrap">' + tableTitle + '<table class="' + tableClass + '"><thead><tr>' + heading +
            '</tr></thead><tbody>' + body + '</tbody></table></div>';
    }

    function renderPartnerRankTables(rankTables, fallbackTable) {
        var tables = Array.isArray(rankTables) && rankTables.length ? rankTables : (fallbackTable ? [fallbackTable] : []);
        return tables.map(renderPartnerRankTable).join('');
    }

    function renderPartnerResearchTables(researchTables) {
        return (Array.isArray(researchTables) ? researchTables : []).map(renderPartnerRankTable).join('');
    }

    function renderPartnerFixedParameters(detail) {
        if (!detail || detail.hasPartnerSkill === false) return '';
        var tables = Array.isArray(detail.rankTables) && detail.rankTables.length ? detail.rankTables : (detail.rankTable ? [detail.rankTable] : []);
        var labels = [];
        tables.forEach(function(table) {
            (table.columns || []).forEach(function(column) { labels.push(column.label); });
        });
        var parameters = [];
        var coolDown = Number(detail.coolDown);
        var duration = Number(detail.duration);
        if (coolDown > 0 && labels.indexOf('冷却时间') < 0) {
            parameters.push({ label: '冷却时间', unit: '秒', value: coolDown });
        }
        if (duration > 1 && labels.indexOf('持续时间') < 0) {
            parameters.push({ label: '持续时间', unit: '秒', value: duration });
        }
        if (!parameters.length) return '';
        var heading = parameters.map(function(parameter) {
            return '<th>' + partnerTableText(parameter.label + '（' + parameter.unit + '）', false) + '</th>';
        }).join('');
        var values = parameters.map(function(parameter) {
            return '<td>' + partnerTableText(parameter.value, true) + '</td>';
        }).join('');
        return '<div class="pt-partner-rank-wrap pt-partner-fixed-wrap"><table class="pt-partner-rank-table">' +
            '<thead><tr>' + heading + '</tr></thead><tbody><tr>' + values + '</tr></tbody></table></div>';
    }

    return {
        onChange: onChange, setCategory: setCategory, setSource: setSource,
        setSearch: setSearch, toggleUnreleased: toggleUnreleased,
        toggleSortByLevel: toggleSortByLevel, toggleOnlyNew: toggleOnlyNew,
        toggleExcludeHidden: toggleExcludeHidden, toggleOnlyNewActive: toggleOnlyNewActive,
        isNewPalPassive: isNewPalPassive,
        setSubCategory: setSubCategory,
        getFiltered: getFiltered, getCategorizedFiltered: getCategorizedFiltered,
        getActiveFiltered: getActiveFiltered, getState: getState,
        getSourcesForCategory: getSourcesForCategory,
        renderPartnerRankTable: renderPartnerRankTable,
        renderPartnerRankTables: renderPartnerRankTables,
        renderPartnerResearchTables: renderPartnerResearchTables,
        renderPartnerFixedParameters: renderPartnerFixedParameters,
        CATEGORY_LABEL: CATEGORY_LABEL, CATEGORY_ORDER: CATEGORY_ORDER,
        CATEGORY_MAP: CATEGORY_MAP,
        SUB_CAT_LABEL: SUB_CAT_LABEL, SUB_CAT_ORDER: SUB_CAT_ORDER
    };
})();
if (typeof window !== 'undefined') { window.PT_SKILL_COMMON = PT_SKILL_COMMON; }
