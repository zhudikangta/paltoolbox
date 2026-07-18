var PT_BUILD_WEB = (function() {
    var dataReady = false;
    var loadError = '';
    var searchComposing = false;

    function getCore() {
        return (typeof window !== 'undefined' && window.PT_BUILD_CORE) ? window.PT_BUILD_CORE : null;
    }

    function getCommon() {
        return (typeof window !== 'undefined' && window.PT_BUILD_COMMON) ? window.PT_BUILD_COMMON : null;
    }

    function getCrossref() {
        return (typeof window !== 'undefined' && window.PT_CROSS_REF) ? window.PT_CROSS_REF : null;
    }

    function ensureData() {
        if (dataReady) return true;
        var ref = getCrossref();
        if (!ref) { loadError = '跨工具索引模块未加载'; return false; }
        if (ref.isBuildingReady()) { dataReady = true; return true; }
        ref.loadAll().then(function() {
            dataReady = true;
            rerender();
        }).catch(function(err) {
            loadError = err && err.message ? err.message : '数据加载失败';
            rerender();
        });
        return false;
    }

    function renderLoading() {
        var msg = loadError || '加载建筑数据…';
        return '<div class="pt-web-tool-page pt-web-page--grid-fluid pt-web-build-page">' +
            '<header class="pt-web-tool-heading"><div><span class="pt-web-tool-kicker">图鉴 / 建筑</span><h1>建筑图鉴</h1></div></header>' +
            '<section class="pt-web-section"><div class="bl-data-state">' + msg + '</div></section></div>';
    }

    function renderTabs(core, common) {
        var s = common.getState();
        var cats = core.getCategories();
        return cats.map(function(cat) {
            var label = core.CATEGORY_LABEL[cat] || cat;
            var active = s.mainCategory === cat ? ' pt-filter-chip--active' : '';
            return '<button class="pt-filter-chip pt-filter-chip--sm' + active + '" data-bl-cat="' + cat + '"><span class="pt-filter-chip__label">' + label + '</span></button>';
        }).join('');
    }

    function renderCard(b) {
        var core = getCore();
        var ref = getCrossref();
        if (!core) return '';
        var name = core.getDisplayName(b);
        var icon = core.getIconUrl(b);
        var level = b.等级;
        var work = b.工作量 != null ? Math.round(b.工作量 / 100) : null;
        var materials = b.材料 || [];

        return '<article class="bl-card" data-bl-id="' + (b.id || '') + '">' +
            '<img class="bl-card-img" src="' + icon + '" alt="' + name + '" loading="lazy" onerror="this.style.display=\'none\'">' +
            '<div class="bl-card-body">' +
            '<div class="bl-card-name">' + name + '</div>' +
            '<div class="bl-card-meta">' +
            (level != null ? '<span class="bl-level">Lv.' + level + '</span>' : '') +
            (work ? '<span class="bl-work">工作量 ' + work + '</span>' : '') +
            '</div>' +
            (materials.length ? '<div class="bl-card-mats">' + materials.map(function(m) {
                var mid = m.id || '';
                var mName = mid;
                if (ref) { var mi = ref.getItem(mid); if (mi) mName = ref.getDisplayName(mi); }
                return '<span class="bl-mat">' + mName + ' x' + (m.数量 || 1) + '</span>';
            }).join('') + '</div>' : '') +
            '</div></article>';
    }

    function renderGrid(core, common) {
        var items = common.getFilteredItems(core);
        if (!items.length) {
            return '<div class="bl-empty">没有匹配的建筑</div>';
        }
        return '<div class="bl-count">共 ' + items.length + ' 件</div>' +
            '<div class="bl-grid">' + items.map(renderCard).join('') + '</div>';
    }

    function renderDetail(b) {
        var core = getCore();
        var ref = getCrossref();
        if (!core) return renderLoading();
        var name = core.getDisplayName(b);
        var icon = core.getIconUrl(b);
        var level = b.等级;
        var work = b.工作量 != null ? Math.round(b.工作量 / 100) : null;
        var materials = b.材料 || [];

        var matHtml = materials.length ? materials.map(function(m) {
            var mid = m.id || '';
            var mName = mid;
            if (ref) {
                var mItem = ref.getItem(mid);
                if (mItem) mName = ref.getDisplayName(mItem);
            }
            return '<div class="bl-detail-mat"><span class="bl-mat-name">' + mName + '</span><span class="bl-mat-qty">x' + (m.数量 || 1) + '</span></div>';
        }).join('') : '<div class="bl-detail-mats-empty">无材料需求</div>';

        return '<div class="pt-web-tool-page pt-web-page--grid-fluid pt-web-build-page">' +
            '<header class="pt-web-tool-heading"><div><span class="pt-web-tool-kicker">图鉴 / 建筑</span><h1>建筑详情</h1></div></header>' +
            '<section class="pt-web-section"><button class="bl-back" data-bl-back>← 返回列表</button>' +
            '<div class="bl-detail">' +
            '<div class="bl-detail-head">' +
            '<img class="bl-detail-img" src="' + icon + '" alt="' + name + '" onerror="this.style.display=\'none\'">' +
            '<div class="bl-detail-title"><h2>' + name + '</h2>' +
            '<div class="bl-detail-id">' + (b.id || '') + '</div></div></div>' +
            '<div class="bl-detail-stats">' +
            (level != null ? '<div class="bl-stat"><span class="bl-stat-label">等级</span><span class="bl-stat-value">' + level + '</span></div>' : '') +
            (work ? '<div class="bl-stat"><span class="bl-stat-label">工作量</span><span class="bl-stat-value">' + work + '</span></div>' : '') +
            '</div>' +
            '<div class="bl-detail-section"><h3>材料需求</h3><div class="bl-detail-mats">' + matHtml + '</div></div>' +
            '</div></section></div>';
    }

    function render() {
        loadError = '';
        if (!ensureData()) return renderLoading();
        var core = getCore();
        var common = getCommon();
        if (!core || !common) return renderLoading();
        var s = common.getState();

        if (s.selectedItem) return renderDetail(s.selectedItem);

        var tabs = renderTabs(core, common);
        var grid = renderGrid(core, common);

        return '<div class="pt-web-tool-page pt-web-page--grid-fluid pt-web-build-page pt-web-filter-page">' +
            '<header class="pt-web-tool-heading"><div><span class="pt-web-tool-kicker">图鉴 / 建筑</span><h1>建筑图鉴</h1></div></header>' +
            '<section class="pt-web-section pt-web-filter-section">' +
            '<div class="pt-web-filter-shell"><div class="pt-web-filter-groups">' +
            '<div class="pt-web-filter-cluster pt-web-filter-cluster--category">' +
            '<div class="pt-web-filter-chips pt-web-filter-category-chips pt-web-filter-category-chips--main">' + tabs + '</div>' +
            '</div>' +
            '<div class="pt-web-filter-divider" aria-hidden="true"></div>' +
            '<div class="pt-web-filter-cluster pt-web-filter-cluster--primary">' +
            '<input type="text" class="pt-input" data-bl-search placeholder="搜索建筑名称…" value="' + s.searchQ + '">' +
            '</div>' +
            '</div></div>' +
            '</section>' +
            '<section class="pt-web-section bl-grid-section">' + grid + '</section></div>';
    }

    function rerender() {
        if (typeof document === 'undefined') return;
        var content = document.getElementById('pt-web-content');
        if (!content) return;
        var scroll = content.querySelector('.pt-web-tool-scroll');
        if (!scroll) return;
        scroll.innerHTML = render();
        bind(content);
    }

    function bind(root) {
        if (!root || root.dataset.blBd === '1') return;
        root.dataset.blBd = '1';

        root.addEventListener('click', function(e) {
            var tab = e.target.closest('[data-bl-cat]');
            if (tab) {
                var common = getCommon();
                if (common) { common.setMainCategory(tab.getAttribute('data-bl-cat')); rerender(); }
                return;
            }
            var back = e.target.closest('[data-bl-back]');
            if (back) {
                var common = getCommon();
                if (common) { common.deselectItem(); rerender(); }
                return;
            }
            var card = e.target.closest('[data-bl-id]');
            if (card) {
                var id = card.getAttribute('data-bl-id');
                var ref = getCrossref();
                if (ref) {
                    var buildings = ref.buildingData || [];
                    var item = null;
                    for (var i = 0; i < buildings.length; i++) {
                        if (buildings[i].id === id) { item = buildings[i]; break; }
                    }
                    if (item) {
                        var common = getCommon();
                        if (common) { common.selectItem(item); rerender(); }
                    }
                }
                return;
            }
        });

        root.addEventListener('input', function(e) {
            var input = e.target.closest('[data-bl-search]');
            if (!input || searchComposing || e.isComposing) return;
            var selStart = input.selectionStart;
            var common = getCommon();
            if (common) { common.setSearch(input.value); rerender(); }
            var newInput = root.querySelector('[data-bl-search]');
            if (newInput) { newInput.focus(); newInput.selectionStart = newInput.selectionEnd = selStart; }
        });
        root.addEventListener('compositionstart', function(e) {
            if (!e.target.closest('[data-bl-search]')) return;
            searchComposing = true;
        });
        root.addEventListener('compositionend', function(e) {
            var input = e.target.closest('[data-bl-search]');
            if (!input) return;
            searchComposing = false;
            var selStart = input.selectionStart;
            var common = getCommon();
            if (common) { common.setSearch(input.value); rerender(); }
            var newInput = root.querySelector('[data-bl-search]');
            if (newInput) { newInput.focus(); newInput.selectionStart = newInput.selectionEnd = selStart; }
        });
    }

    var common = getCommon();
    if (common) common.onStateChange(function() { rerender(); });

    return {
        render: render,
        bind: bind,
        destroy: function() { dataReady = false; }
    };
})();

if (typeof window !== 'undefined') window.PT_BUILD_WEB = PT_BUILD_WEB;
