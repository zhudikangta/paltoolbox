var PT_WORKSIM_WEB = (function() {
    function getCommon() { return window.PT_WORKSIM_COMMON || null; }

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function renderWorkTypes(state) {
        var core = window.PT_WORKSIM_CORE;
        var counts = core ? core.getCounts() : {};
        return (core ? core.getWorkTypes() : []).map(function(type) {
            var active = state.workType === type ? ' pt-filter-chip--active' : '';
            return '<button class="pt-filter-chip pt-filter-chip--sm' + active + '" data-ws-type="' + escapeHtml(type) + '"><span class="pt-filter-chip__label">' + escapeHtml(type) + ' (' + (counts[type] || 0) + ')</span></button>';
        }).join('');
    }

    function selectedStats(list, state) {
        var selected = list.filter(function(pal) { return state.selected[pal.id]; });
        var totalLevel = selected.reduce(function(sum, pal) {
            return sum + (pal.工作适性[state.workType] || 0);
        }, 0);
        return { selected: selected, totalLevel: totalLevel };
    }

    function renderContent() {
        var core = window.PT_WORKSIM_CORE;
        var state = getCommon().getState();
        var list = core ? core.getPalsByWork(state.workType) : [];
        var stats = selectedStats(list, state);
        var html = '<div class="ws-summary"><span>已选 ' + stats.selected.length + ' 只</span><span>总适性等级 ' + stats.totalLevel + '</span><button class="ws-action" data-ws-select-all>全选</button><button class="ws-action" data-ws-clear>清空</button></div>';
        html += '<table class="ws-table"><thead><tr><th>选择</th><th>图鉴</th><th>帕鲁</th><th>适性等级</th><th>其他工作</th></tr></thead><tbody>';
        list.forEach(function(pal) {
            var checked = state.selected[pal.id] ? ' checked' : '';
            var otherWorks = Object.keys(pal.工作适性 || {}).filter(function(type) { return type !== state.workType; }).map(function(type) {
                return type + ' Lv.' + pal.工作适性[type];
            }).join(' / ');
            html += '<tr class="ws-row"><td><input type="checkbox" data-ws-pal="' + escapeHtml(pal.id) + '"' + checked + '></td><td>#' + (pal.图鉴编号 || '') + (pal.图鉴后缀 || '') + '</td><td>' + escapeHtml(pal.中文名 || pal.id) + '</td><td>Lv.' + (pal.工作适性[state.workType] || 0) + '</td><td>' + escapeHtml(otherWorks) + '</td></tr>';
        });
        if (!list.length) html += '<tr><td colspan="5" class="ws-empty">暂无帕鲁</td></tr>';
        html += '</tbody></table>';
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
        return '<div class="pt-web-tool-page pt-web-page--grid-fluid pt-web-filter-page ws-page">' +
            '<section class="pt-web-section pt-web-filter-section ws-filter-bar"><div class="pt-web-filter-cluster ws-tabs">' + renderWorkTypes(state) + '</div></section>' +
            '<section class="pt-web-section ws-content-section">' + renderContent() + '</section></div>';
    }

    function bind(root) {
        if (!root) return;
        root.addEventListener('click', function(event) {
            var type = event.target.closest('[data-ws-type]');
            if (type) {
                var typeCommon = getCommon();
                if (typeCommon) typeCommon.setWorkType(type.getAttribute('data-ws-type'));
                return;
            }
            var all = event.target.closest('[data-ws-select-all]');
            if (all) {
                var allCommon = getCommon();
                var core = window.PT_WORKSIM_CORE;
                if (allCommon && core) allCommon.selectMany(core.getPalsByWork(allCommon.getState().workType).map(function(pal) { return pal.id; }));
                return;
            }
            var clear = event.target.closest('[data-ws-clear]');
            if (clear) {
                var clearCommon = getCommon();
                if (clearCommon) clearCommon.clearSelected();
            }
        });
        root.addEventListener('change', function(event) {
            var pal = event.target.closest('[data-ws-pal]');
            if (!pal) return;
            var common = getCommon();
            if (common) common.togglePal(pal.getAttribute('data-ws-pal'));
        });
    }

    function rerender() {
        var content = document.getElementById('pt-web-content');
        var scroll = content ? content.querySelector('.pt-web-tool-scroll') : null;
        if (!scroll) return;
        scroll.innerHTML = render();
    }

    function destroy() {}

    (function init() {
        var common = getCommon();
        if (common) common.onUpdate(function() { rerender(); });
    })();

    return { render: render, bind: bind, destroy: destroy };
})();
if (typeof window !== 'undefined') window.PT_WORKSIM_WEB = PT_WORKSIM_WEB;
