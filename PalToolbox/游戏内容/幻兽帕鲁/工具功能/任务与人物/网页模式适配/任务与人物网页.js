var PT_MISSION_WEB = (function() {
    function getCommon() { return window.PT_MISSION_COMMON || null; }

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatValue(value) {
        if (value == null || value === '') return '';
        if (typeof value === 'number') return value.toLocaleString();
        if (typeof value === 'boolean') return value ? '是' : '否';
        return escapeHtml(value);
    }

    var KEY_LABELS = {
        id: '原始编号',
        中文标题: '任务',
        描述: '说明',
        奖励: '奖励',
        经验: '经验',
        物品: '物品',
        数量: '数量',
        中文名: '中文名',
        任务阶段: '任务阶段',
        path: '阶段原始路径',
        name: '阶段名称',
        titleTextId: '标题文本编号',
        nameCN: '名称',
        nameStatus: '名称状态',
        difficulty: '难度',
        requiredSeconds: '耗时秒数',
        recommendedStrength: '推荐战力',
        requiredElementType: '需要属性',
        requiredElementNum: '需要属性数量',
        maxCharacterNum: '人数上限',
        textureType: '图标类型原始值',
        itemFieldLotteryName: '奖励抽取表原始编号',
        challengeCondition: '挑战条件原始编号',
        minLevel: '最低等级',
        maxLevel: '最高等级',
        characterNum: '人数',
        maxLostPalNum: '最大遗失帕鲁数',
        characters: '角色',
        characterID: '角色原始编号',
        questType: '任务类型',
        description: '说明',
        reward: '奖励',
        objectives: '目标',
        objectiveCount: '目标数量'
    };
    var VALUE_LABELS = {
        Easy: '简单',
        Normal: '普通',
        Hard: '困难',
        VeryHard: '非常困难',
        None: '无',
        Fire: '火',
        Water: '水',
        Leaf: '草',
        Grass: '草',
        Electricity: '雷',
        Thunder: '雷',
        Ice: '冰',
        Dark: '暗',
        Dragon: '龙',
        Earth: '地',
        Ground: '地',
        Main: '主线',
        Sub: '支线',
        Hidden: '隐藏',
        ok: '有中文名',
        missing: '缺中文名'
    };

    function labelKey(key) {
        return KEY_LABELS[key] || key;
    }

    function formatMissionValue(key, value) {
        if (value == null || value === '') return '';
        if (VALUE_LABELS[value]) return VALUE_LABELS[value];
        return formatValue(value);
    }

    function tabs(state) {
        var list = [['main', '主线'], ['sub', '支线'], ['expedition', '远征'], ['merchant', '商人']];
        return list.map(function(tab) {
            var active = state.tab === tab[0] ? ' pt-filter-chip--active' : '';
            return '<button class="pt-filter-chip pt-filter-chip--sm' + active + '" data-ms-tab="' + tab[0] + '"><span class="pt-filter-chip__label">' + tab[1] + '</span></button>';
        }).join('');
    }

    function getConfig(tab) {
        var core = window.PT_MISSION_CORE;
        if (!core) return { list: [], cols: [], title: '' };
        var configs = {
            main: { title: '主线', list: core.getMainQuests(), cols: [['中文标题', '任务'], ['描述', '说明'], ['奖励', '奖励'], ['任务阶段', '阶段']] },
            sub: { title: '支线', list: core.getSubQuests(), cols: [['中文标题', '任务'], ['描述', '说明'], ['奖励', '奖励'], ['任务阶段', '阶段']] },
            expedition: { title: '远征', list: core.getMissions(), cols: [['nameCN', '远征'], ['difficulty', '难度'], ['requiredSeconds', '耗时秒数'], ['recommendedStrength', '推荐战力'], ['maxCharacterNum', '人数上限']] },
            merchant: { title: '商人', list: core.getShops(), cols: [['id', '商人组'], ['minLevel', '最低等级'], ['maxLevel', '最高等级'], ['characterNum', '人数'], ['characters', '角色']] }
        };
        return configs[tab] || configs.main;
    }

    function cellValue(row, key) {
        var value = row[key];
        if (Array.isArray(value)) return value.length + ' 条';
        if (value && typeof value === 'object') {
            if (value.经验 != null) return '经验 ' + formatValue(value.经验) + ' / 物品 ' + ((value.物品 || []).length) + ' 个';
            return Object.keys(value).length + ' 项';
        }
        return formatMissionValue(key, value);
    }

    function renderContent() {
        var state = getCommon().getState();
        var config = getConfig(state.tab);
        var html = '<table class="ms-table"><thead><tr>' + config.cols.map(function(col) {
            return '<th>' + col[1] + '</th>';
        }).join('') + '</tr></thead><tbody>';
        config.list.forEach(function(row, index) {
            html += '<tr class="ms-row" data-ms-id="' + state.tab + '_' + index + '">' + config.cols.map(function(col) {
                return '<td>' + cellValue(row, col[0]) + '</td>';
            }).join('') + '</tr>';
        });
        if (!config.list.length) html += '<tr><td colspan="' + config.cols.length + '" class="ms-empty">暂无数据</td></tr>';
        html += '</tbody></table>';
        return html;
    }

    function renderNested(value, valueKey) {
        if (Array.isArray(value)) {
            if (!value.length) return '<span class="ms-muted">无</span>';
            return '<div class="ms-nested">' + value.slice(0, 16).map(function(item) {
                if (item && typeof item === 'object') {
                    return '<div class="ms-nested__item">' + Object.keys(item).map(function(key) {
                        return '<span><b>' + escapeHtml(labelKey(key)) + '</b>: ' + formatMissionValue(key, item[key]) + '</span>';
                    }).join(' / ') + '</div>';
                }
                return '<div class="ms-nested__item">' + formatValue(item) + '</div>';
            }).join('') + (value.length > 16 ? '<div class="ms-muted">还有 ' + (value.length - 16) + ' 条未展开</div>' : '') + '</div>';
        }
        if (value && typeof value === 'object') {
            return '<div class="ms-nested">' + Object.keys(value).map(function(key) {
                return '<div class="ms-nested__item"><b>' + escapeHtml(labelKey(key)) + '</b>: ' + renderNested(value[key], key) + '</div>';
            }).join('') + '</div>';
        }
        return formatMissionValue(valueKey, value);
    }

    function getTitle(row, fallback) {
        return row.中文标题 || row.nameCN || row.id || fallback;
    }

    function renderDetail(id) {
        var parts = id.split('_');
        var config = getConfig(parts[0]);
        var row = config.list[parseInt(parts[1], 10)];
        if (!row) return '';
        var rows = Object.keys(row).map(function(key) {
            return '<div class="ms-drow"><span class="ms-dlbl">' + escapeHtml(labelKey(key)) + '</span><span>' + renderNested(row[key], key) + '</span></div>';
        }).join('');
        return '<div class="pt-web-tool-page pt-web-page--grid-fluid pt-web-filter-page ms-page">' +
            '<section class="pt-web-section pt-web-filter-section ms-filter-bar"><button class="ms-back" data-ms-back>返回</button></section>' +
            '<section class="pt-web-section ms-content-section"><div class="ms-detail"><div class="ms-dname">' + escapeHtml(getTitle(row, config.title)) + '</div>' + rows + '</div></section></div>';
    }

    function render() {
        var common = getCommon();
        if (!common) return '<div class="pt-web-tool-page pt-web-page--bounded"><p>核心未加载</p></div>';
        var state = common.getState();
        if (!state.loaded && !state.loading) {
            common.load();
            return '<div class="pt-web-tool-page pt-web-page--bounded"><p>加载中...</p></div>';
        }
        if (state.loading) return '<div class="pt-web-tool-page pt-web-page--bounded"><p>加载中...</p></div>';
        if (state.selected) return renderDetail(state.selected);
        return '<div class="pt-web-tool-page pt-web-page--grid-fluid pt-web-filter-page ms-page">' +
            '<section class="pt-web-section pt-web-filter-section ms-filter-bar"><div class="pt-web-filter-cluster ms-tabs">' + tabs(state) + '</div></section>' +
            '<section class="pt-web-section ms-content-section">' + renderContent() + '</section></div>';
    }

    function bind(root) {
        if (!root) return;
        root.addEventListener('click', function(event) {
            var back = event.target.closest('[data-ms-back]');
            if (back) {
                var backCommon = getCommon();
                if (backCommon) backCommon.deselectItem();
                return;
            }
            var tab = event.target.closest('[data-ms-tab]');
            if (tab) {
                var tabCommon = getCommon();
                if (tabCommon) tabCommon.setTab(tab.getAttribute('data-ms-tab'));
                return;
            }
            var row = event.target.closest('[data-ms-id]');
            if (row) {
                var rowCommon = getCommon();
                if (rowCommon) rowCommon.selectItem(row.getAttribute('data-ms-id'));
            }
        });
    }

    function rerender() {
        var content = document.getElementById('pt-web-content');
        var scroll = content ? content.querySelector('.pt-web-tool-scroll') : null;
        if (!scroll) return;
        scroll.innerHTML = render();
    }

    function destroy() {
        var common = getCommon();
        if (common) common.deselectItem();
    }

    (function init() {
        var common = getCommon();
        if (common) common.onUpdate(function() { rerender(); });
    })();

    return { render: render, bind: bind, destroy: destroy };
})();
if (typeof window !== 'undefined') window.PT_MISSION_WEB = PT_MISSION_WEB;
