var PT_INCIDENT_WEB = (function() {
    var searchComposing = false;

    function getCommon() { return window.PT_INCIDENT_COMMON || null; }

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

    function formatOptionalValue(value) {
        if (value == null || value === '') return '无';
        return formatValue(value);
    }

    var STATUS_LABELS = {
        ok: '有中文名',
        pal_exact: '帕鲁精确中文名',
        group_name: '组织泛名',
        missing: '缺中文名'
    };

    function formatStatus(status) {
        return STATUS_LABELS[status] || '未知状态';
    }

    function roleName(spawn) {
        if (spawn.nameCN) return spawn.nameCN;
        if (spawn.characterID) return '角色原始编号：' + spawn.characterID;
        return '未知角色';
    }

    function statusClass(status) {
        if (status === 'ok' || status === 'pal_exact') return 'ok';
        if (status === 'group_name') return 'group';
        return 'missing';
    }

    function statusDot(status) {
        return '<span class="in-status in-status--' + statusClass(status) + '"></span>';
    }

    function renderCategoryFilters(state) {
        var core = window.PT_INCIDENT_CORE;
        var cats = core ? core.getCategories() : [];
        var html = '<button class="pt-filter-chip pt-filter-chip--sm' + (!state.cat ? ' pt-filter-chip--active' : '') + '" data-in-cat=""><span class="pt-filter-chip__label">全部</span></button>';
        cats.forEach(function(cat) {
            var active = state.cat === cat ? ' pt-filter-chip--active' : '';
            html += '<button class="pt-filter-chip pt-filter-chip--sm' + active + '" data-in-cat="' + escapeHtml(cat) + '"><span class="pt-filter-chip__label">' + escapeHtml(cat) + '</span></button>';
        });
        return html;
    }

    function renderStatusFilters(state) {
        var missingActive = state.status === 'missing' ? ' pt-filter-chip--active' : '';
        return '<button class="pt-filter-chip pt-filter-chip--sm' + (!state.status ? ' pt-filter-chip--active' : '') + '" data-in-status=""><span class="pt-filter-chip__label">全部名称</span></button>' +
            '<button class="pt-filter-chip pt-filter-chip--sm' + missingActive + '" data-in-status="missing"><span class="pt-filter-chip__label">缺中文名</span></button>';
    }

    function incidentMatches(incident, state) {
        if (state.cat && incident.categoryLabel !== state.cat && incident.category !== state.cat) return false;
        if (state.status === 'missing') {
            var hasMissing = (incident.spawns || []).some(function(spawn) {
                return statusClass(spawn.nameStatus) === 'missing';
            });
            if (!hasMissing) return false;
        }
        if (state.search) {
            var needle = state.search.toLowerCase();
            var text = [incident.id, incident.name, incident.categoryLabel, incident.category].concat((incident.spawns || []).map(function(spawn) {
                return [spawn.characterID, spawn.nameCN, spawn.uniqueNPCID, spawn.otomoName].join(' ');
            })).join(' ').toLowerCase();
            if (text.indexOf(needle) < 0) return false;
        }
        return true;
    }

    function renderContent() {
        var core = window.PT_INCIDENT_CORE;
        var state = getCommon().getState();
        var list = (core ? core.getIncidents() : []).filter(function(incident) {
            return incidentMatches(incident, state);
        });
        var html = '<div class="in-legend"><span>' + statusDot('ok') + '有中文名</span><span>' + statusDot('group_name') + '组织泛名</span><span>' + statusDot('missing') + '缺中文名</span></div>';
        html += '<table class="in-table"><thead><tr><th>事件原始编号</th><th>类型</th><th>角色数</th><th>角色</th><th>操作</th></tr></thead><tbody>';
        list.forEach(function(incident, index) {
            var spawns = incident.spawns || [];
            var names = spawns.slice(0, 4).map(function(spawn) {
                return statusDot(spawn.nameStatus) + escapeHtml(roleName(spawn));
            }).join(' ');
            if (spawns.length > 4) names += ' <span class="in-muted">+' + (spawns.length - 4) + '</span>';
            html += '<tr class="in-row" data-in-id="' + index + '"><td>' + escapeHtml(incident.name || incident.id) + '</td><td>' + escapeHtml(incident.categoryLabel || incident.category || '') + '</td><td>' + spawns.length + '</td><td>' + names + '</td><td>查看</td></tr>';
        });
        if (!list.length) html += '<tr><td colspan="5" class="in-empty">暂无事件</td></tr>';
        html += '</tbody></table>';
        return html;
    }

    function renderDetail(id) {
        var core = window.PT_INCIDENT_CORE;
        var state = getCommon().getState();
        var list = (core ? core.getIncidents() : []).filter(function(incident) {
            return incidentMatches(incident, state);
        });
        var row = list[parseInt(id, 10)];
        if (!row) return '';
        var spawns = row.spawns || [];
        var html = '<div class="pt-web-tool-page pt-web-page--grid-fluid pt-web-filter-page in-page">' +
            '<section class="pt-web-section pt-web-filter-section in-filter-bar"><button class="in-back" data-in-back>返回</button></section>' +
            '<section class="pt-web-section in-content-section"><div class="in-detail"><div class="in-dname">事件原始编号：' + escapeHtml(row.name || row.id) + '</div>';
        html += '<div class="in-drow"><span class="in-dlbl">类型</span><span>' + escapeHtml(row.categoryLabel || row.category || '') + '</span></div>';
        html += '<div class="in-drow"><span class="in-dlbl">事件编号</span><span>' + escapeHtml(row.id) + '</span></div>';
        html += '<table class="in-table in-table--compact"><thead><tr><th>角色</th><th>名称状态</th><th>等级</th><th>分组</th><th>是否小队</th><th>唯一人物原始编号</th><th>伙伴原始编号</th></tr></thead><tbody>';
        spawns.forEach(function(spawn) {
            html += '<tr><td>' + statusDot(spawn.nameStatus) + escapeHtml(roleName(spawn)) + '</td><td>' + escapeHtml(formatStatus(spawn.nameStatus)) + '</td><td>' + formatValue(spawn.level) + '</td><td>' + formatValue(spawn.group) + '</td><td>' + formatValue(spawn.isSquad) + '</td><td>' + formatOptionalValue(spawn.uniqueNPCID) + '</td><td>' + formatOptionalValue(spawn.otomoName) + '</td></tr>';
        });
        html += '</tbody></table></div></section></div>';
        return html;
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
        return '<div class="pt-web-tool-page pt-web-page--grid-fluid pt-web-filter-page in-page">' +
            '<section class="pt-web-section pt-web-filter-section in-filter-bar"><div class="pt-web-filter-cluster in-tabs">' + renderCategoryFilters(state) + renderStatusFilters(state) + '<input type="text" class="pt-input in-search" data-in-search value="' + escapeHtml(state.search) + '" placeholder="搜索事件或角色..."></div></section>' +
            '<section class="pt-web-section in-content-section">' + renderContent() + '</section></div>';
    }

    function bind(root) {
        if (!root) return;
        root.addEventListener('click', function(event) {
            var back = event.target.closest('[data-in-back]');
            if (back) {
                var backCommon = getCommon();
                if (backCommon) backCommon.deselectItem();
                return;
            }
            var cat = event.target.closest('[data-in-cat]');
            if (cat) {
                var catCommon = getCommon();
                if (catCommon) catCommon.setCat(cat.getAttribute('data-in-cat'));
                return;
            }
            var status = event.target.closest('[data-in-status]');
            if (status) {
                var statusCommon = getCommon();
                if (statusCommon) statusCommon.setStatus(status.getAttribute('data-in-status'));
                return;
            }
            var row = event.target.closest('[data-in-id]');
            if (row) {
                var rowCommon = getCommon();
                if (rowCommon) rowCommon.selectItem(row.getAttribute('data-in-id'));
            }
        });
        root.addEventListener('input', function(event) {
            var search = event.target.closest('[data-in-search]');
            if (!search || searchComposing || event.isComposing) return;
            var common = getCommon();
            if (!common) return;
            var selectionStart = search.selectionStart;
            var selectionEnd = search.selectionEnd;
            common.setSearch(search.value);
            restoreSearchFocus(root, selectionStart, selectionEnd);
        });
        root.addEventListener('compositionstart', function(event) {
            if (!event.target.closest('[data-in-search]')) return;
            searchComposing = true;
        });
        root.addEventListener('compositionend', function(event) {
            var search = event.target.closest('[data-in-search]');
            if (!search) return;
            var common = getCommon();
            if (!common) return;
            searchComposing = false;
            var selectionStart = search.selectionStart;
            var selectionEnd = search.selectionEnd;
            common.setSearch(search.value);
            restoreSearchFocus(root, selectionStart, selectionEnd);
        });
    }

    function restoreSearchFocus(root, selectionStart, selectionEnd) {
        var search = root.querySelector('[data-in-search]');
        if (!search) return;
        search.focus();
        if (typeof selectionStart === 'number' && typeof selectionEnd === 'number') {
            search.selectionStart = selectionStart;
            search.selectionEnd = selectionEnd;
        }
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
if (typeof window !== 'undefined') window.PT_INCIDENT_WEB = PT_INCIDENT_WEB;
