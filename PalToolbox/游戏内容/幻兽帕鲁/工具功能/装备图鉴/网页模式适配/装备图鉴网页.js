var PT_EQUIP_WEB = (function() {
    var dataReady = false;
    var loadError = '';
    var searchComposing = false;

    function getCore() {
        return (typeof window !== 'undefined' && window.PT_EQUIP_CORE) ? window.PT_EQUIP_CORE : null;
    }

    function getCommon() {
        return (typeof window !== 'undefined' && window.PT_EQUIP_COMMON) ? window.PT_EQUIP_COMMON : null;
    }

    function getCrossref() {
        return (typeof window !== 'undefined' && window.PT_CROSS_REF) ? window.PT_CROSS_REF : null;
    }

    function ensureData() {
        if (dataReady) return true;
        var ref = getCrossref();
        if (!ref) { loadError = '跨工具索引模块未加载'; return false; }
        if (ref.isItemReady()) { dataReady = true; return true; }
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
        var msg = loadError || '加载装备数据…';
        return '<div class="pt-web-tool-page pt-web-page--grid-fluid pt-web-equip-page">' +
            '<header class="pt-web-tool-heading"><div><span class="pt-web-tool-kicker">图鉴 / 装备</span><h1>装备图鉴</h1></div></header>' +
            '<section class="pt-web-section"><div class="eq-data-state">' + msg + '</div></section></div>';
    }

    function renderPrimaryTabs(core, common) {
        var s = common.getState();
        var cats = core.getPrimaryCategories();
        return cats.map(function(c) {
            var label = core.PRIMARY_LABEL[c] || c;
            var active = s.mainCategory === c ? ' pt-filter-chip--active' : '';
            return '<button class="pt-filter-chip pt-filter-chip--sm' + active + '" data-eq-cat="' + c + '"><span class="pt-filter-chip__label">' + label + '</span></button>';
        }).join('');
    }

    function renderSubChips(core, common) {
        var s = common.getState();
        var subs = core.getSubCategories(s.mainCategory);
        if (!subs.length) return '';
        return subs.map(function(sub) {
            var label = core.getSubLabel(s.mainCategory, sub);
            var active = s.subCategory === sub ? ' pt-filter-chip--active' : '';
            return '<button class="pt-filter-chip pt-filter-chip--sm' + active + '" data-eq-sub="' + sub + '"><span class="pt-filter-chip__label">' + label + '</span></button>';
        }).join('');
    }

    function renderCard(item) {
        var core = getCore();
        if (!core) return '';
        var name = core.getDisplayName(item);
        var icon = core.getIconUrl(item);
        var rarity = item.稀有度;
        var rarityLabel = core.RARITY_LABEL[rarity] || '';
        var weight = item.重量 != null ? item.重量 : '';
        var cat = item.类别 || '';
        var subCat = cat.split('/').length > 1 ? cat.split('/')[1] : '';
        var subLabel = core.getSubLabel(cat.split('/')[0], subCat) || '';

        return '<article class="eq-card" data-eq-id="' + (item.id || '') + '">' +
            '<img class="eq-card-img" src="' + icon + '" alt="' + name + '" loading="lazy" onerror="this.style.display=\'none\'">' +
            '<div class="eq-card-body">' +
            '<div class="eq-card-name">' + name + '</div>' +
            (rarityLabel ? '<span class="eq-rarity eq-rarity--' + rarity + '">' + rarityLabel + '</span>' : '') +
            (subLabel ? '<div class="eq-card-sub">' + subLabel + '</div>' : '') +
            (weight ? '<div class="eq-card-weight">' + weight + ' kg</div>' : '') +
            '</div></article>';
    }

    function renderGrid(core, common) {
        var items = common.getFilteredItems(core);
        if (!items.length) {
            return '<div class="eq-empty">没有匹配的装备</div>';
        }
        return '<div class="eq-count">共 ' + items.length + ' 件</div>' +
            '<div class="eq-grid">' + items.map(renderCard).join('') + '</div>';
    }

    function renderItemDetail(item) {
        var core = getCore();
        var ref = getCrossref();
        if (!core) return renderLoading();
        var name = core.getDisplayName(item);
        var icon = core.getIconUrl(item);
        var rarity = item.稀有度;
        var rarityLabel = core.RARITY_LABEL[rarity] || '';
        var weight = item.重量 != null ? item.重量 + ' kg' : '';
        var stack = item.堆叠上限;
        var price = item.售价;
        var desc = item.描述 || '';
        if (desc === 'zh-hans text' || desc === '#N/A') desc = '';

        var passiveList = [];
        if (ref) {
            var passives = ref.getPassiveSourcesByEquipId(item.id || '');
            if (passives.length) {
                passiveList = passives.map(function(p) {
                    var pName = p.中文名 || p.id || '';
                    if (pName === 'zh-Hans Text') pName = p.id;
                    var effects = (p.效果描述 || []).join('、');
                    return '<div class="eq-detail-passive">' +
                        '<span class="eq-passive-name">' + pName + '</span>' +
                        (effects ? '<span class="eq-passive-effect">' + effects + '</span>' : '') +
                        '</div>';
                });
            }
        }

        var recipeList = [];
        if (ref) {
            var recipes = ref.getRecipesByResult(item.id || '');
            if (recipes.length) {
                recipeList = recipes.map(function(r) {
                    var materials = (r.materials || []).map(function(m) {
                        var mid = m.itemID || '';
                        var mName = mid;
                        var mItem = ref.getItem(mid);
                        if (mItem) mName = ref.getDisplayName(mItem);
                        return mName + ' x' + (m.count || 1);
                    }).join('、');
                    var workAmount = r.workAmount != null ? Math.round(r.workAmount / 100) : '';
                    return '<div class="eq-detail-recipe">' +
                        '<span class="eq-recipe-label">制造材料：</span>' + materials +
                        (workAmount ? '<span class="eq-work">工作量 ' + workAmount + '</span>' : '') + '</div>';
                });
            }
        }

        return '<div class="pt-web-tool-page pt-web-page--grid-fluid pt-web-equip-page">' +
            '<header class="pt-web-tool-heading"><div><span class="pt-web-tool-kicker">图鉴 / 装备</span><h1>装备详情</h1></div></header>' +
            '<section class="pt-web-section"><button class="eq-back" data-eq-back>← 返回列表</button>' +
            '<div class="eq-detail">' +
            '<div class="eq-detail-head">' +
            '<img class="eq-detail-img" src="' + icon + '" alt="' + name + '" onerror="this.style.display=\'none\'">' +
            '<div class="eq-detail-title">' +
            '<h2>' + name + '</h2>' +
            (rarityLabel ? '<span class="eq-rarity eq-rarity--' + rarity + '">' + rarityLabel + '</span>' : '') +
            '<div class="eq-detail-id">' + (item.id || '') + '</div>' +
            '</div></div>' +
            '<div class="eq-detail-meta">' +
            (weight ? '<span>重量 ' + weight + '</span>' : '') +
            (stack ? '<span>堆叠上限 ' + stack + '</span>' : '') +
            (price != null ? '<span>售价 ' + price + '</span>' : '') +
            '</div>' +
            (desc ? '<p class="eq-detail-desc">' + desc + '</p>' : '') +
            (passiveList.length ? '<div class="eq-detail-section"><h3>可携带词条</h3>' + passiveList.join('') + '</div>' : '') +
            (recipeList.length ? '<div class="eq-detail-section"><h3>制造配方</h3>' + recipeList.join('') + '</div>' : '') +
            '</div></section></div>';
    }

    function render() {
        loadError = '';
        if (!ensureData()) return renderLoading();
        var core = getCore();
        var common = getCommon();
        if (!core || !common) return renderLoading();
        var s = common.getState();

        if (s.selectedItem) return renderItemDetail(s.selectedItem);

        var tabs = renderPrimaryTabs(core, common);
        var chips = renderSubChips(core, common);
        var grid = renderGrid(core, common);

        return '<div class="pt-web-tool-page pt-web-page--grid-fluid pt-web-equip-page pt-web-filter-page">' +
            '<header class="pt-web-tool-heading"><div><span class="pt-web-tool-kicker">图鉴 / 装备</span><h1>装备图鉴</h1></div></header>' +
            '<section class="pt-web-section pt-web-filter-section">' +
            '<div class="pt-web-filter-shell"><div class="pt-web-filter-groups">' +
            '<div class="pt-web-filter-cluster pt-web-filter-cluster--category">' +
            '<div class="pt-web-filter-category-layout">' +
            '<div class="pt-web-filter-chips pt-web-filter-category-chips pt-web-filter-category-chips--main">' + tabs + '</div>' +
            '</div>' +
            '</div>' +
            '<div class="pt-web-filter-divider" aria-hidden="true"></div>' +
            '<div class="pt-web-filter-cluster pt-web-filter-cluster--primary">' +
            '<input type="text" class="pt-input" data-eq-search placeholder="搜索装备名称或ID…" value="' + s.searchQ + '">' +
            (chips ? '<div class="pt-web-filter-chips-row"><span class="pt-web-filter-chip-label">子类</span><div class="pt-web-filter-chips">' + chips + '</div></div>' : '') +
            '</div>' +
            '</div></div>' +
            '</section>' +
            '<section class="pt-web-section eq-grid-section">' + grid + '</section></div>';
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
        if (!root || root.dataset.eqBd === '1') return;
        root.dataset.eqBd = '1';

        root.addEventListener('click', function(e) {
            var tab = e.target.closest('[data-eq-cat]');
            if (tab) {
                var common = getCommon();
                if (common) { common.setMainCategory(tab.getAttribute('data-eq-cat')); rerender(); }
                return;
            }
            var chip = e.target.closest('[data-eq-sub]');
            if (chip) {
                var common = getCommon();
                if (common) { common.setSubCategory(chip.getAttribute('data-eq-sub')); rerender(); }
                return;
            }
            var back = e.target.closest('[data-eq-back]');
            if (back) {
                var common = getCommon();
                if (common) { common.deselectItem(); rerender(); }
                return;
            }
            var card = e.target.closest('[data-eq-id]');
            if (card) {
                var id = card.getAttribute('data-eq-id');
                var ref = getCrossref();
                var item = ref ? ref.getItem(id) : null;
                if (item) {
                    var common = getCommon();
                    if (common) { common.selectItem(item); rerender(); }
                }
                return;
            }
        });

        root.addEventListener('input', function(e) {
            var input = e.target.closest('[data-eq-search]');
            if (!input || searchComposing || e.isComposing) return;
            var selStart = input.selectionStart;
            var common = getCommon();
            if (common) { common.setSearch(input.value); rerender(); }
            var newInput = root.querySelector('[data-eq-search]');
            if (newInput) { newInput.focus(); newInput.selectionStart = newInput.selectionEnd = selStart; }
        });
        root.addEventListener('compositionstart', function(e) {
            if (!e.target.closest('[data-eq-search]')) return;
            searchComposing = true;
        });
        root.addEventListener('compositionend', function(e) {
            var input = e.target.closest('[data-eq-search]');
            if (!input) return;
            searchComposing = false;
            var selStart = input.selectionStart;
            var common = getCommon();
            if (common) { common.setSearch(input.value); rerender(); }
            var newInput = root.querySelector('[data-eq-search]');
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

if (typeof window !== 'undefined') window.PT_EQUIP_WEB = PT_EQUIP_WEB;
