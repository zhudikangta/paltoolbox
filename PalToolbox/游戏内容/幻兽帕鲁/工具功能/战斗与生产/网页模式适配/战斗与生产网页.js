var PT_COMBAT_WEB = (function() {
    function getCommon() { return window.PT_COMBAT_COMMON || null; }

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
        level: '等级',
        workerMax: '工人数',
        baseCampMax: '营地数',
        workerNum: '所需工人数',
        incompleteMsg: '未完成文本原始编号',
        completeMsg: '完成文本原始编号',
        builds: '所需建造',
        object: '建造物',
        count: '数量',
        name: '名称',
        triggerSAN: '触发理智',
        valid: '是否有效',
        interruptRecover: '打断恢复',
        interruptSleep: '打断睡眠',
        priority: '优先级',
        cropCN: '产物',
        growTime_s: '成长秒数',
        cropNum: '收获数量',
        seedWork: '播种工作量',
        waterWork: '浇水工作量',
        harvestWork: '收获工作量',
        id: '原始编号',
        nameCN: '名称',
        characterID: '角色原始编号',
        nameTextID: '名称文本编号',
        gender: '性别',
        talkCount: '可对话',
        skinColor: '肤色原始值',
        palID: '帕鲁原始编号',
        palCN: '帕鲁',
        lvMin: '最低等级',
        lvMax: '最高等级',
        hitBarRate: '命中条倍率',
        missRate: '失败倍率',
        successRate: '成功倍率',
        searchRate: '搜索倍率',
        startProgress: '初始进度',
        enemyDrop: '敌人掉落倍率',
        itemDrop: '物品掉落倍率',
        areaName: '区域',
        spawns: '生成组',
        levels: '等级池',
        lotteries: '奖励池',
        rank: '类型',
        weight: '权重',
        spawnerName: '生成器原始编号',
        levelName: '关卡原始编号',
        bonusExp: '额外经验',
        type: '奖励类型原始值',
        content: '奖励内容原始值'
    };
    var VALUE_LABELS = {
        Default: '普通',
        Top: '最高',
        High: '高',
        Low: '低',
        Male: '男性',
        Female: '女性',
        Normal: '普通',
        Boss: 'Boss',
        FishPal: '钓鱼帕鲁',
        NPCHuman: '人类',
        MidBoss: '中型Boss',
        Elite: '精英',
        Common: '普通',
        None: '无'
    };

    function labelKey(key) {
        return KEY_LABELS[key] || key;
    }

    function formatCombatValue(key, value) {
        if (value == null || value === '') return '';
        if (VALUE_LABELS[value]) return VALUE_LABELS[value];
        if (key === 'type' && String(value).indexOf('::') > -1) return '原始奖励类型：' + escapeHtml(value);
        return formatValue(value);
    }

    function tabs(state) {
        var tabList = [
            ['camp', '营地等级'],
            ['task', '营地任务'],
            ['event', '工人事件'],
            ['crop', '农场作物'],
            ['npc', '独特NPC'],
            ['fish', '钓鱼帕鲁'],
            ['bait', '鱼饵'],
            ['dungeon', '地下城']
        ];
        return tabList.map(function(tab) {
            var active = state.tab === tab[0] ? ' pt-filter-chip--active' : '';
            return '<button class="pt-filter-chip pt-filter-chip--sm' + active + '" data-cb-tab="' + tab[0] + '"><span class="pt-filter-chip__label">' + tab[1] + '</span></button>';
        }).join('');
    }

    function getConfig(tab) {
        var core = window.PT_COMBAT_CORE;
        if (!core) return { list: [], cols: [], title: '' };
        var configs = {
            camp: {
                title: '营地等级',
                list: core.getCampLevels(),
                cols: [['level', '等级'], ['workerMax', '工人数'], ['baseCampMax', '营地数']]
            },
            task: {
                title: '营地任务',
                list: core.getCampTasks(),
                cols: [['level', '等级'], ['workerNum', '工人数'], ['incompleteMsg', '未完成文本'], ['completeMsg', '完成文本']]
            },
            event: {
                title: '工人事件',
                list: core.getWorkerEvents(),
                cols: [['name', '事件'], ['triggerSAN', '触发理智'], ['valid', '有效'], ['priority', '优先级']]
            },
            crop: {
                title: '农场作物',
                list: core.getCrops(),
                cols: [['name', '作物'], ['growTime_s', '成长秒数'], ['cropNum', '收获数量'], ['seedWork', '播种工作量'], ['waterWork', '浇水工作量'], ['harvestWork', '收获工作量']]
            },
            npc: {
                title: '独特NPC',
                list: core.getNpc(),
                cols: [['nameCN', '名称'], ['id', '原始编号'], ['characterID', '角色原始编号'], ['gender', '性别'], ['talkCount', '可对话']]
            },
            fish: {
                title: '钓鱼帕鲁',
                list: core.getFishPals(),
                cols: [['palCN', '帕鲁'], ['id', '原始编号'], ['palID', '帕鲁原始编号'], ['lvMin', '最低等级'], ['lvMax', '最高等级']]
            },
            bait: {
                title: '鱼饵',
                list: core.getBait(),
                cols: [['nameCN', '鱼饵'], ['id', '原始编号'], ['hitBarRate', '命中条倍率'], ['missRate', '失败倍率'], ['successRate', '成功倍率'], ['searchRate', '搜索倍率']]
            },
            dungeon: {
                title: '地下城',
                list: core.getDungeonAreas(),
                cols: [['areaName', '区域'], ['spawns', '生成组'], ['levels', '等级池'], ['lotteries', '奖励池']]
            }
        };
        return configs[tab] || configs.camp;
    }

    function getCellValue(row, key) {
        var value = row[key];
        if (Array.isArray(value)) return value.length + ' 条';
        if (value && typeof value === 'object') return Object.keys(value).length + ' 项';
        return formatCombatValue(key, value);
    }

    function renderContent() {
        var state = getCommon().getState();
        var config = getConfig(state.tab);
        var html = '<table class="cb-table"><thead><tr>' + config.cols.map(function(col) {
            return '<th>' + col[1] + '</th>';
        }).join('') + '</tr></thead><tbody>';
        config.list.forEach(function(row, index) {
            html += '<tr class="cb-row" data-cb-id="' + state.tab + '_' + index + '">' + config.cols.map(function(col) {
                return '<td>' + getCellValue(row, col[0]) + '</td>';
            }).join('') + '</tr>';
        });
        if (!config.list.length) {
            html += '<tr><td colspan="' + config.cols.length + '" class="cb-empty">暂无数据</td></tr>';
        }
        html += '</tbody></table>';
        return html;
    }

    function renderNestedValue(value) {
        if (Array.isArray(value)) {
            if (!value.length) return '<span class="cb-muted">无</span>';
            return '<div class="cb-nested-list">' + value.slice(0, 12).map(function(item) {
                if (item && typeof item === 'object') {
                    return '<div class="cb-nested-item">' + Object.keys(item).map(function(key) {
                        return '<span><b>' + escapeHtml(labelKey(key)) + '</b>: ' + formatCombatValue(key, item[key]) + '</span>';
                    }).join(' / ') + '</div>';
                }
                return '<div class="cb-nested-item">' + formatValue(item) + '</div>';
            }).join('') + (value.length > 12 ? '<div class="cb-muted">还有 ' + (value.length - 12) + ' 条未展开</div>' : '') + '</div>';
        }
        if (value && typeof value === 'object') {
            return '<div class="cb-nested-list">' + Object.keys(value).map(function(key) {
                return '<div class="cb-nested-item"><b>' + escapeHtml(labelKey(key)) + '</b>: ' + formatCombatValue(key, value[key]) + '</div>';
            }).join('') + '</div>';
        }
        return formatValue(value);
    }

    function getTitle(row, fallback) {
        return row.nameCN || row.name || row.palCN || row.areaName || row.id || fallback;
    }

    function renderDetail(id) {
        var parts = id.split('_');
        var tab = parts[0];
        var index = parseInt(parts[1], 10);
        var config = getConfig(tab);
        var row = config.list[index];
        if (!row) return '';
        var rows = Object.keys(row).map(function(key) {
            return '<div class="cb-drow"><span class="cb-dlbl">' + escapeHtml(labelKey(key)) + '</span><span>' + renderNestedValue(row[key]) + '</span></div>';
        }).join('');
        return '<div class="pt-web-tool-page pt-web-page--grid-fluid pt-web-filter-page cb-page">' +
            '<section class="pt-web-section pt-web-filter-section cb-filter-bar"><button class="cb-back" data-cb-back>返回</button></section>' +
            '<section class="pt-web-section cb-content-section"><div class="cb-detail"><div class="cb-dname">' + escapeHtml(getTitle(row, config.title)) + '</div>' + rows + '</div></section></div>';
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
        return '<div class="pt-web-tool-page pt-web-page--grid-fluid pt-web-filter-page cb-page">' +
            '<section class="pt-web-section pt-web-filter-section cb-filter-bar"><div class="pt-web-filter-cluster cb-tabs">' + tabs(state) + '</div></section>' +
            '<section class="pt-web-section cb-content-section">' + renderContent() + '</section></div>';
    }

    function bind(root) {
        if (!root) return;
        root.addEventListener('click', function(event) {
            var back = event.target.closest('[data-cb-back]');
            if (back) {
                var backCommon = getCommon();
                if (backCommon) backCommon.deselectItem();
                return;
            }
            var tab = event.target.closest('[data-cb-tab]');
            if (tab) {
                var tabCommon = getCommon();
                if (tabCommon) tabCommon.setTab(tab.getAttribute('data-cb-tab'));
                return;
            }
            var row = event.target.closest('[data-cb-id]');
            if (row) {
                var rowCommon = getCommon();
                if (rowCommon) rowCommon.selectItem(row.getAttribute('data-cb-id'));
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
if (typeof window !== 'undefined') window.PT_COMBAT_WEB = PT_COMBAT_WEB;
