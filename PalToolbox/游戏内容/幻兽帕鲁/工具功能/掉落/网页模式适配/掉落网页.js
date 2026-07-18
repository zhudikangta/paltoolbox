var PT_DROP_WEB = (function() {
    var searchComposing = false;
    var typeLabels = {
        pal: '帕鲁', boss: '首领', raid: '袭击', npc: '敌对人物', human: '人类',
        tower: '塔主', predator: '捕食者', quest: '任务', arena: '竞技场'
    };
    var typeOrder = ['pal', 'boss', 'raid', 'npc', 'human', 'tower', 'predator', 'quest', 'arena'];

    function getCommon() { return window.PT_DROP_COMMON || null; }
    function getCore() { return window.PT_DROP_CORE || null; }

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatRange(min, max) {
        if (min == null && max == null) return '未记录';
        return min === max ? String(min) : String(min) + ' - ' + String(max);
    }

    function displayName(entry) {
        return entry.nameCN || entry.characterID || '未命名角色';
    }

    function statusClass(status) {
        return status === 'missing' ? 'missing' : (status === 'fallback_group' ? 'group' : 'ok');
    }

    function statusDot(status) {
        return '<span class="dr-status dr-status--' + statusClass(status) + '"></span>';
    }

    function renderTypeFilters(state, counts) {
        var total = getCore().getAll().length;
        var html = '<button class="pt-filter-chip pt-filter-chip--sm' + (!state.type ? ' pt-filter-chip--active' : '') + '" data-dr-type=""><span class="pt-filter-chip__label">全部 (' + total + ')</span></button>';
        typeOrder.forEach(function(type) {
            if (!counts[type]) return;
            var active = state.type === type ? ' pt-filter-chip--active' : '';
            html += '<button class="pt-filter-chip pt-filter-chip--sm' + active + '" data-dr-type="' + type + '"><span class="pt-filter-chip__label">' + typeLabels[type] + ' (' + counts[type] + ')</span></button>';
        });
        return html;
    }

    function renderStatusFilters(state) {
        return '<button class="pt-filter-chip pt-filter-chip--sm' + (!state.status ? ' pt-filter-chip--active' : '') + '" data-dr-status=""><span class="pt-filter-chip__label">全部名称</span></button>' +
            '<button class="pt-filter-chip pt-filter-chip--sm' + (state.status === 'missing' ? ' pt-filter-chip--active' : '') + '" data-dr-status="missing"><span class="pt-filter-chip__label">缺中文名</span></button>';
    }

    function renderPreview(items) {
        var visible = (items || []).filter(function(item) { return Number(item.rate) > 0; });
        if (!visible.length) return '<span class="dr-muted">未记录掉落物</span>';
        var names = visible.slice(0, 4).map(function(item) {
            return escapeHtml(item.nameCN || item.itemID) + ' (' + escapeHtml(item.rate) + '%)';
        }).join('、');
        if (visible.length > 4) names += '<span class="dr-muted"> +' + (visible.length - 4) + '</span>';
        return names;
    }

    function renderList() {
        var state = getCommon().getState();
        var core = getCore();
        var entries = core.filter(state);
        var html = '<div class="dr-legend"><span>' + statusDot('ok') + '有中文名</span><span>' + statusDot('fallback_group') + '组织泛名</span><span>' + statusDot('missing') + '缺中文名</span><span class="dr-count">共 ' + entries.length + ' 条</span></div>';
        html += '<table class="dr-table"><thead><tr><th>角色</th><th>类型</th><th>等级</th><th>掉落物</th></tr></thead><tbody>';
        entries.forEach(function(entry) {
            html += '<tr class="dr-row" data-dr-id="' + escapeHtml(entry.characterID) + '">' +
                '<td>' + statusDot(entry.nameStatus) + escapeHtml(displayName(entry)) + '</td>' +
                '<td><span class="dr-type">' + escapeHtml(typeLabels[entry.type] || entry.type || '未分类') + '</span></td>' +
                '<td>' + (entry.level ? escapeHtml(entry.level) : '—') + '</td>' +
                '<td class="dr-preview">' + renderPreview(entry.items) + '</td>' +
                '</tr>';
        });
        if (!entries.length) html += '<tr><td class="dr-empty" colspan="4">没有符合条件的掉落记录</td></tr>';
        html += '</tbody></table>';
        return html;
    }

    function renderDetail(id) {
        var entry = getCore().getById(id);
        if (!entry) return '<div class="dr-empty">未找到这条掉落记录</div>';
        var items = (entry.items || []).filter(function(item) { return Number(item.rate) > 0; });
        var html = '<div class="pt-web-tool-page pt-web-page--grid-fluid pt-web-filter-page dr-page">' +
            '<section class="pt-web-section pt-web-filter-section dr-filter-bar"><button class="dr-back" data-dr-back>返回</button></section>' +
            '<section class="pt-web-section dr-content-section"><div class="dr-detail">' +
            '<div class="dr-detail__name">' + statusDot(entry.nameStatus) + escapeHtml(displayName(entry)) + '</div>' +
            '<div class="dr-detail__meta"><span>' + escapeHtml(typeLabels[entry.type] || entry.type || '未分类') + '</span><span>等级：' + (entry.level ? escapeHtml(entry.level) : '未记录') + '</span><span>角色原始编号：' + escapeHtml(entry.characterID) + '</span></div>' +
            '<div class="dr-detail__title">掉落物（' + items.length + ' 种）</div>' +
            '<table class="dr-table"><thead><tr><th>物品</th><th>概率</th><th>数量</th><th>物品原始编号</th></tr></thead><tbody>';
        items.forEach(function(item) {
            html += '<tr><td>' + escapeHtml(item.nameCN || item.itemID) + '</td><td>' + escapeHtml(item.rate) + '%</td><td>' + formatRange(item.min, item.max) + '</td><td class="dr-id">' + escapeHtml(item.itemID) + '</td></tr>';
        });
        if (!items.length) html += '<tr><td class="dr-empty" colspan="4">未记录掉落物</td></tr>';
        html += '</tbody></table></div></section></div>';
        return html;
    }

    function render() {
        var common = getCommon();
        if (!common || !getCore()) return '<div class="pt-web-tool-page pt-web-page--bounded"><p>掉落工具尚未加载</p></div>';
        var state = common.getState();
        if (!state.loaded && !state.loading) {
            common.load();
            return '<div class="pt-web-tool-page pt-web-page--bounded"><p>加载掉落数据中...</p></div>';
        }
        if (state.loading) return '<div class="pt-web-tool-page pt-web-page--bounded"><p>加载掉落数据中...</p></div>';
        if (!state.loaded) return '<div class="pt-web-tool-page pt-web-page--bounded"><p>掉落数据读取失败</p></div>';
        if (state.selected) return renderDetail(state.selected);
        var counts = getCore().getTypeCounts();
        return '<div class="pt-web-tool-page pt-web-page--grid-fluid pt-web-filter-page dr-page">' +
            '<section class="pt-web-section pt-web-filter-section dr-filter-bar"><div class="pt-web-filter-cluster dr-tabs">' +
            renderTypeFilters(state, counts) + renderStatusFilters(state) +
            '<input type="text" class="pt-input dr-search" data-dr-search value="' + escapeHtml(state.search) + '" placeholder="搜索角色、原始编号或掉落物..."></div></section>' +
            '<section class="pt-web-section dr-content-section">' + renderList() + '</section></div>';
    }

    function restoreSearchFocus(root, start, end) {
        var search = root.querySelector('[data-dr-search]');
        if (!search) return;
        search.focus();
        if (typeof start === 'number' && typeof end === 'number') {
            search.selectionStart = start;
            search.selectionEnd = end;
        }
    }

    function bind(root) {
        if (!root) return;
        root.addEventListener('click', function(event) {
            var common = getCommon();
            if (!common) return;
            var back = event.target.closest('[data-dr-back]');
            if (back) { common.clearSelection(); return; }
            var type = event.target.closest('[data-dr-type]');
            if (type) { common.setType(type.getAttribute('data-dr-type')); return; }
            var status = event.target.closest('[data-dr-status]');
            if (status) { common.setStatus(status.getAttribute('data-dr-status')); return; }
            var row = event.target.closest('[data-dr-id]');
            if (row) common.select(row.getAttribute('data-dr-id'));
        });
        root.addEventListener('input', function(event) {
            var search = event.target.closest('[data-dr-search]');
            if (!search || searchComposing || event.isComposing) return;
            var start = search.selectionStart;
            var end = search.selectionEnd;
            getCommon().setSearch(search.value);
            restoreSearchFocus(root, start, end);
        });
        root.addEventListener('compositionstart', function(event) {
            if (event.target.closest('[data-dr-search]')) searchComposing = true;
        });
        root.addEventListener('compositionend', function(event) {
            var search = event.target.closest('[data-dr-search]');
            if (!search) return;
            searchComposing = false;
            var start = search.selectionStart;
            var end = search.selectionEnd;
            getCommon().setSearch(search.value);
            restoreSearchFocus(root, start, end);
        });
    }

    function rerender() {
        var content = document.getElementById('pt-web-content');
        var scroll = content ? content.querySelector('.pt-web-tool-scroll') : null;
        if (scroll) scroll.innerHTML = render();
    }

    function destroy() {
        var common = getCommon();
        if (common) common.clearSelection();
    }

    (function init() {
        var common = getCommon();
        if (common) common.onUpdate(rerender);
    })();

    return { render: render, bind: bind, destroy: destroy };
})();
if (typeof window !== 'undefined') window.PT_DROP_WEB = PT_DROP_WEB;
