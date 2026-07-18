var PT_EXP_WEB = (function() {
    var ratioFilter = '';

    function getCommon() { return window.PT_EXP_COMMON || null; }

    function rerender() {
        var content = document.getElementById('pt-web-content');
        var scroll = content ? content.querySelector('.pt-web-tool-scroll') : null;
        if (!scroll) return;
        scroll.innerHTML = render();
    }

    function formatNumber(value) {
        if (value == null || value === '') return '';
        if (typeof value === 'number') return value.toLocaleString();
        return String(value);
    }

    function renderTabs(state) {
        var core = window.PT_EXP_CORE;
        var data = core ? core.getData() : null;
        var stats = data && data.meta ? data.meta.statistics || {} : {};
        var tabs = [
            ['player', '人物升级' + (stats.playerLevels ? ' (1-' + stats.playerLevels + ')' : '')],
            ['pal', '帕鲁升级' + (stats.palLevels ? ' (1-' + stats.palLevels + ')' : '')],
            ['ratio', '经验倍率' + (stats.expRatioEntries ? ' (' + stats.expRatioEntries + ')' : '')],
            ['capture', '捕获加成'],
            ['other', '掉落/建造/区域']
        ];
        return tabs.map(function(tab) {
            var active = state.tab === tab[0] ? ' pt-filter-chip--active' : '';
            return '<button class="pt-filter-chip pt-filter-chip--sm' + active + '" data-ep-tab="' + tab[0] + '"><span class="pt-filter-chip__label">' + tab[1] + '</span></button>';
        }).join('');
    }

    function renderExpTable(list, prefix) {
        var html = '<table class="ep-table"><thead><tr><th>等级</th><th>升下一级所需经验</th><th>累计总经验</th></tr></thead><tbody>';
        list.forEach(function(row) {
            html += '<tr class="ep-row" data-ep-id="' + prefix + row.level + '"><td>' + row.level + '</td><td>' + formatNumber(row.nextEXP) + '</td><td>' + formatNumber(row.totalEXP) + '</td></tr>';
        });
        html += '</tbody></table>';
        return html;
    }

    function renderPlayerTable() {
        var core = window.PT_EXP_CORE;
        return renderExpTable(core ? core.getPlayerExp() : [], 'player');
    }

    function renderPalTable() {
        var core = window.PT_EXP_CORE;
        return renderExpTable(core ? core.getPalExp() : [], 'pal');
    }

    function renderRatioFilters(list) {
        var filters = [
            ['', '全部'],
            ['2', '>=2x'],
            ['5', '>=5x'],
            ['10', '>=10x']
        ];
        return '<div class="ep-subfilters"><span class="ep-subfilters__label">筛选倍率</span>' + filters.map(function(filter) {
            var value = filter[0];
            var count = value ? list.filter(function(item) { return item.ratio >= parseFloat(value); }).length : list.length;
            var active = ratioFilter === value ? ' pt-filter-chip--active' : '';
            return '<button class="pt-filter-chip pt-filter-chip--sm' + active + '" data-ep-ratio="' + value + '"><span class="pt-filter-chip__label">' + filter[1] + ' (' + count + ')</span></button>';
        }).join('') + '</div>';
    }

    function renderNameStatus(status) {
        var cls = status === 'ok' ? 'ok' : 'missing';
        return '<span class="ep-name-status ep-name-status--' + cls + '"></span>';
    }

    function renderRatioTable() {
        var core = window.PT_EXP_CORE;
        var data = core ? core.getData() : null;
        var list = core ? core.getExpRatios() : [];
        var filtered = ratioFilter ? list.filter(function(item) { return item.ratio >= parseFloat(ratioFilter); }) : list;
        var dropBuild = data && data.dropBuildExp ? data.dropBuildExp : [];
        var baseDrop50 = dropBuild[49] ? dropBuild[49].dropEXP || 0 : 0;
        var html = renderRatioFilters(list);
        html += '<table class="ep-table"><thead><tr><th>帕鲁</th><th>经验倍率</th><th>举例(50级掉落)</th></tr></thead><tbody>';
        filtered.forEach(function(row) {
            var expAt50 = Math.round(baseDrop50 * (row.ratio || 0));
            html += '<tr class="ep-row" data-ep-id="ratio' + row.id + '"><td>' + renderNameStatus(row.nameStatus) + (row.nameCN || row.id) + '</td><td>' + row.ratio + 'x</td><td>' + formatNumber(expAt50) + '</td></tr>';
        });
        html += '</tbody></table>';
        return html;
    }

    function renderCaptureTable() {
        var core = window.PT_EXP_CORE;
        var list = core ? core.getCaptureBonus() : [];
        var html = '<p class="ep-hint">捕获同一帕鲁时获得的累计经验加成，第1次3点，第4999次约29.5万。</p>';
        html += '<table class="ep-table"><thead><tr><th>捕获次数</th><th>加成经验</th></tr></thead><tbody>';
        list.forEach(function(row) {
            if (row.captureCount === '...') {
                html += '<tr><td colspan="2" class="ep-ellipsis">...</td></tr>';
            } else {
                html += '<tr class="ep-row" data-ep-id="cap' + row.captureCount + '"><td>' + row.captureCount + '</td><td>' + formatNumber(row.bonusEXP) + '</td></tr>';
            }
        });
        html += '</tbody></table>';
        return html;
    }

    function renderOtherContent() {
        var core = window.PT_EXP_CORE;
        var data = core ? core.getData() : null;
        var dropList = core ? core.getDropBuildExp() : [];
        var areaFind = core ? core.getAreaFind() : {};
        var html = '<div class="ep-hint ep-hint--stack">';
        html += '<p><b>掉落经验</b>：击败一只该等级的帕鲁获得的基础经验，实际经验 = 基础经验 x 该帕鲁的经验倍率。</p>';
        html += '<p><b>建造经验</b>：完成一项该等级解锁的建造物获得的经验。</p>';
        html += '<p><b>区域发现</b>：首次抵达新区域获得的经验，数值由引擎计算，区域表共 ' + Object.keys(areaFind || {}).length + ' 个条目。</p>';
        html += '</div>';
        html += '<table class="ep-table"><thead><tr><th>怪物/建筑等级</th><th>击败掉落(基础)</th><th>建造获得</th></tr></thead><tbody>';
        dropList.forEach(function(row) {
            html += '<tr class="ep-row" data-ep-id="other' + row.level + '"><td>' + row.level + '</td><td>' + formatNumber(row.dropEXP) + '</td><td>' + formatNumber(row.buildEXP) + '</td></tr>';
        });
        html += '</tbody></table>';
        if (data && data.areaFind) {
            html += '<p class="ep-hint ep-area-count">区域发现: ' + Object.keys(data.areaFind).length + ' 个区域</p>';
        }
        return html;
    }

    function renderTable() {
        var state = getCommon().getState();
        switch (state.tab) {
            case 'player': return renderPlayerTable();
            case 'pal': return renderPalTable();
            case 'ratio': return renderRatioTable();
            case 'capture': return renderCaptureTable();
            case 'other': return renderOtherContent();
            default: return '';
        }
    }

    function findLevelRow(list, level) {
        for (var i = 0; i < list.length; i++) {
            if (list[i].level === level) return list[i];
        }
        return null;
    }

    function renderDetail(itemId) {
        var core = window.PT_EXP_CORE;
        if (!core) return '';
        var row = null;
        var title = '';
        if (itemId.indexOf('player') === 0) {
            var playerLevel = parseInt(itemId.replace('player', ''), 10);
            row = findLevelRow(core.getPlayerExp(), playerLevel);
            title = '人物升级 Lv.' + playerLevel;
        } else if (itemId.indexOf('pal') === 0) {
            var palLevel = parseInt(itemId.replace('pal', ''), 10);
            row = findLevelRow(core.getPalExp(), palLevel);
            title = '帕鲁升级 Lv.' + palLevel;
        }
        if (!row) {
            return '<div class="pt-web-tool-page pt-web-page--grid-fluid pt-web-filter-page ep-page"><section class="pt-web-section pt-web-filter-section ep-filter-bar"><button class="ep-back" data-ep-back>返回</button></section><section class="pt-web-section ep-content-section"><p>未找到数据</p></section></div>';
        }
        return '<div class="pt-web-tool-page pt-web-page--grid-fluid pt-web-filter-page ep-page">' +
            '<section class="pt-web-section pt-web-filter-section ep-filter-bar"><button class="ep-back" data-ep-back>返回</button></section>' +
            '<section class="pt-web-section ep-content-section">' +
            '<div class="ep-detail"><div class="ep-detail__name">' + title + '</div>' +
            '<div class="ep-detail__row"><span class="ep-detail__label">升下一级所需经验</span><span>' + formatNumber(row.nextEXP) + '</span></div>' +
            '<div class="ep-detail__row"><span class="ep-detail__label">累计总经验</span><span>' + formatNumber(row.totalEXP) + '</span></div>' +
            '</div></section></div>';
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
        if (state.selectedItem) return renderDetail(state.selectedItem);
        return '<div class="pt-web-tool-page pt-web-page--grid-fluid pt-web-filter-page ep-page">' +
            '<section class="pt-web-section pt-web-filter-section ep-filter-bar"><div class="pt-web-filter-cluster ep-tabs">' + renderTabs(state) + '</div></section>' +
            '<section class="pt-web-section ep-content-section">' + renderTable() + '</section></div>';
    }

    function bind(root) {
        if (!root) return;
        root.addEventListener('click', function(event) {
            var back = event.target.closest('[data-ep-back]');
            if (back) {
                var backCommon = getCommon();
                if (backCommon) backCommon.deselectItem();
                return;
            }
            var tab = event.target.closest('[data-ep-tab]');
            if (tab) {
                var tabCommon = getCommon();
                if (tabCommon) tabCommon.setTab(tab.getAttribute('data-ep-tab'));
                return;
            }
            var ratio = event.target.closest('[data-ep-ratio]');
            if (ratio) {
                ratioFilter = ratio.getAttribute('data-ep-ratio');
                rerender();
                return;
            }
            var row = event.target.closest('[data-ep-id]');
            if (row) {
                var rowCommon = getCommon();
                if (rowCommon) rowCommon.selectItem(row.getAttribute('data-ep-id'));
            }
        });
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
if (typeof window !== 'undefined') window.PT_EXP_WEB = PT_EXP_WEB;
