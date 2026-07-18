var PT_ITEM_WEB = (function() {
    var dataReady = false;
    var loadError = '';
    var searchComposing = false;

    function getCore() {
        return (typeof window !== 'undefined' && window.PT_ITEM_CORE) ? window.PT_ITEM_CORE : null;
    }

    function getCommon() {
        return (typeof window !== 'undefined' && window.PT_ITEM_COMMON) ? window.PT_ITEM_COMMON : null;
    }

    function getCrossref() {
        return (typeof window !== 'undefined' && window.PT_CROSS_REF) ? window.PT_CROSS_REF : null;
    }

    function ensureData() {
        if (dataReady) return true;
        var ref = getCrossref();
        if (!ref) { loadError = '跨工具索引模块未加载'; return false; }
        if (ref.isDataReady() && ref.isPalReady()) { dataReady = true; return true; }
        ref.loadAll().then(function() {
            return ref.loadPalData();
        }).then(function() {
            dataReady = true;
            rerender();
        }).catch(function(err) {
            loadError = err && err.message ? err.message : '数据加载失败';
            dataReady = true;
            rerender();
        });
        return false;
    }

    function renderLoading() {
        var msg = loadError || '加载物品数据…';
        return '<div class="pt-web-tool-page pt-web-page--grid-fluid pt-web-item-page">' +
            '<header class="pt-web-tool-heading"><div><span class="pt-web-tool-kicker">图鉴 / 物品</span><h1>物品图鉴</h1></div></header>' +
            '<section class="pt-web-section"><div class="it-data-state">' + msg + '</div></section></div>';
    }

    function renderTabs(core, common) {
        var s = common.getState();
        var cats = core.getCategories();
        return cats.map(function(c) {
            var label = core.CATEGORY_LABEL[c] || c;
            var active = s.mainCategory === c ? ' pt-filter-chip--active' : '';
            return '<button class="pt-filter-chip pt-filter-chip--sm' + active + '" data-it-cat="' + c + '"><span class="pt-filter-chip__label">' + label + '</span></button>';
        }).join('');
    }

    function renderSubTabs(core, common) {
        var s = common.getState();
        var subs = common.getSubCategories(core);
        if (!subs.length) return '';
        var html = subs.map(function(sub) {
            var label = core.SUB_CATEGORY_LABEL[sub] || sub;
            var active = s.subCategory === sub ? ' pt-filter-chip--active' : '';
            return '<button class="pt-filter-chip pt-filter-chip--sm' + active + '" data-it-sub="' + sub + '"><span class="pt-filter-chip__label">' + label + '</span></button>';
        }).join('');
        return '<div class="pt-web-filter-chips pt-web-filter-category-chips pt-web-filter-category-chips--sub it-sub-chips">' + html + '</div>';
    }

    function renderCard(item) {
        var core = getCore();
        if (!core) return '';
        var name = core.getDisplayName(item);
        var icon = core.getIconUrl(item);
        var rarity = item.稀有度;
        var weight = item.重量 != null ? item.重量 : '';
        var stack = item.堆叠上限;
        var price = item.售价;
        var desc = item.描述 || '';
        if (desc === 'zh-hans text' || desc === '#N/A') desc = '';

        return '<article class="it-card" data-it-id="' + (item.id || '') + '">' +
            '<img class="it-card-img" src="' + icon + '" alt="' + name + '" loading="lazy" onerror="this.style.display=\'none\'">' +
            '<div class="it-card-body">' +
            '<div class="it-card-name">' + name + '</div>' +
            (rarity ? '<span class="it-rarity">稀有度 ' + rarity + '</span>' : '') +
            (desc ? '<div class="it-card-desc">' + desc + '</div>' : '') +
            (weight || stack || price != null ? '<div class="it-card-meta">' +
                (weight ? weight + ' kg' : '') +
                (stack ? ' / 堆叠 ' + stack : '') +
                (price != null ? ' / 售价 ' + price : '') +
                '</div>' : '') +
            '</div></article>';
    }

    function renderGrid(core, common) {
        var items = common.getFilteredItems(core);
        if (!items.length) {
            return '<div class="it-empty">没有匹配的物品</div>';
        }
        var countLabel = common.getState().subCategory ? items.length + ' 件' : '共 ' + items.length + ' 件';
        return '<div class="it-count">' + countLabel + '</div>' +
            '<div class="it-grid">' + items.map(renderCard).join('') + '</div>';
    }

    function renderDetail(item) {
        var core = getCore();
        var ref = getCrossref();
        if (!core) return renderLoading();
        var name = core.getDisplayName(item);
        var icon = core.getIconUrl(item);
        var rarity = item.稀有度;
        var weight = item.重量 != null ? item.重量 + ' kg' : '';
        var stack = item.堆叠上限;
        var price = item.售价;
        var desc = item.描述 || '';
        if (desc === 'zh-hans text' || desc === '#N/A') desc = '';
        var cat = item.类别 || '';

        var recipeInfo = '';
        if (ref) {
            var asResult = ref.getRecipesByResult(item.id || '');
            if (asResult.length) {
                var matsHtml = asResult.map(function(r) {
                    var materials = (r.materials || []).map(function(m) {
                        var mid = m.itemID || '';
                        var mName = mid;
                        var mItem = ref.getItem(mid);
                        if (mItem) mName = ref.getDisplayName(mItem);
                        return mName + ' x' + (m.count || 1);
                    }).join('、');
                    return '<div class="it-detail-recipe">制造配方：' + materials + '</div>';
                }).join('');
                recipeInfo += matsHtml;
            }
            var usedIn = ref.getRecipesByMaterial(item.id || '');
            if (usedIn.length) {
                recipeInfo += usedIn.slice(0, 20).map(function(r) {
                    var resultId = r.productID || '';
                    var resultName = resultId;
                    var resultItem = ref.getItem(resultId);
                    if (resultItem) resultName = ref.getDisplayName(resultItem);
                    return '<div class="it-detail-recipe">用于制造：' + resultName + '</div>';
                }).join('');
                if (usedIn.length > 20) {
                    recipeInfo += '<div class="it-detail-recipe it-detail-recipe--more">…还有 ' + (usedIn.length - 20) + ' 个配方</div>';
                }
            }
        }

        return '<div class="pt-web-tool-page pt-web-page--grid-fluid pt-web-item-page pt-web-item-detail-page">' +
            '<header class="pt-web-tool-heading"><div><span class="pt-web-tool-kicker">图鉴 / 物品</span><h1>物品详情</h1></div></header>' +
            '<section class="pt-web-section"><button class="it-back" data-it-back>← 返回列表</button>' +
            '<div class="it-detail">' +
            '<div class="it-detail-head">' +
            '<img class="it-detail-img" src="' + icon + '" alt="' + name + '" onerror="this.style.display=\'none\'">' +
            '<div class="it-detail-title"><h2>' + name + '</h2>' +
            '<div class="it-detail-id">' + (item.id || '') + '</div></div></div>' +
            '<div class="it-detail-meta">' +
            (weight ? '<span>重量 ' + weight + '</span>' : '') +
            (stack ? '<span>堆叠上限 ' + stack + '</span>' : '') +
            (rarity ? '<span>稀有度 ' + rarity + '</span>' : '') +
            (price != null ? '<span>售价 ' + price + '</span>' : '') +
            '</div>' +
            (cat ? '<div class="it-detail-cat">类别：' + cat + '</div>' : '') +
            (desc ? '<p class="it-detail-desc">' + desc + '</p>' : '') +
            (recipeInfo ? '<div class="it-detail-section"><h3>配方信息</h3>' + recipeInfo + '</div>' : '') +
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
        var subTabs = renderSubTabs(core, common);
        var grid = renderGrid(core, common);

        return '<div class="pt-web-tool-page pt-web-page--grid-fluid pt-web-item-page pt-web-filter-page">' +
            '<header class="pt-web-tool-heading"><div><span class="pt-web-tool-kicker">图鉴 / 物品</span><h1>物品图鉴</h1></div></header>' +
            '<section class="pt-web-section pt-web-filter-section">' +
            '<div class="pt-web-filter-shell"><div class="pt-web-filter-groups">' +
            '<div class="pt-web-filter-cluster pt-web-filter-cluster--category">' +
            '<div class="pt-web-filter-chips pt-web-filter-category-chips pt-web-filter-category-chips--main it-category-chips">' + tabs + '</div>' +
            (subTabs ? '<div class="it-sub-divider" aria-hidden="true"></div>' + subTabs : '') +
            '</div>' +
            '<div class="pt-web-filter-divider" aria-hidden="true"></div>' +
            '<div class="pt-web-filter-cluster pt-web-filter-cluster--primary">' +
            '<input type="text" class="pt-input" data-it-search placeholder="搜索物品名称或ID…" value="' + s.searchQ + '">' +
            '</div>' +
            '</div></div>' +
            '</section>' +
            '<section class="pt-web-section it-grid-section">' + grid + '</section></div>';
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
        if (!root || root.dataset.itBd === '1') return;
        root.dataset.itBd = '1';

        root.addEventListener('click', function(e) {
            var tab = e.target.closest('[data-it-cat]');
            if (tab) {
                var common = getCommon();
                if (common) { common.setMainCategory(tab.getAttribute('data-it-cat')); rerender(); }
                return;
            }
            var subTab = e.target.closest('[data-it-sub]');
            if (subTab) {
                var common = getCommon();
                if (common) { common.setSubCategory(subTab.getAttribute('data-it-sub')); rerender(); }
                return;
            }
            var back = e.target.closest('[data-it-back]');
            if (back) {
                var common = getCommon();
                if (common) { common.deselectItem(); rerender(); }
                return;
            }
            var card = e.target.closest('[data-it-id]');
            if (card) {
                var id = card.getAttribute('data-it-id');
                var ref = getCrossref();
                var item = ref ? ref.getItem(id) : null;
                if (item && !ref.isEquipment(item)) {
                    var common = getCommon();
                    if (common) { common.selectItem(item); rerender(); }
                }
                return;
            }
        });

        root.addEventListener('input', function(e) {
            var input = e.target.closest('[data-it-search]');
            if (!input || searchComposing || e.isComposing) return;
            var selStart = input.selectionStart;
            var common = getCommon();
            if (common) { common.setSearch(input.value); rerender(); }
            var newInput = root.querySelector('[data-it-search]');
            if (newInput) { newInput.focus(); newInput.selectionStart = newInput.selectionEnd = selStart; }
        });
        root.addEventListener('compositionstart', function(e) {
            if (!e.target.closest('[data-it-search]')) return;
            searchComposing = true;
        });
        root.addEventListener('compositionend', function(e) {
            var input = e.target.closest('[data-it-search]');
            if (!input) return;
            searchComposing = false;
            var selStart = input.selectionStart;
            var common = getCommon();
            if (common) { common.setSearch(input.value); rerender(); }
            var newInput = root.querySelector('[data-it-search]');
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

if (typeof window !== 'undefined') window.PT_ITEM_WEB = PT_ITEM_WEB;
