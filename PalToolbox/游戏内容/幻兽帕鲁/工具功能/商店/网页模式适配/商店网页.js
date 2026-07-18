var PT_SHOP_WEB = (function() {
    var searchComposing = false;

    function getCommon() { return window.PT_SHOP_COMMON || null; }

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

    var PRODUCT_KEY_LABELS = {
        itemID: '物品原始编号',
        nameCN: '物品名称',
        type: '商品类型',
        price: '价格',
        count: '数量',
        stock: '库存'
    };
    var PRODUCT_TYPE_LABELS = {
        Normal: '普通'
    };
    var CURRENCY_LABELS = {
        DogCoin: '汪汪币',
        BountyProof_1: '赏金证明',
        BattleTicket: '竞技场票券'
    };

    function formatShopValue(key, value) {
        if (key === 'type') return PRODUCT_TYPE_LABELS[value] || ('原始类型：' + escapeHtml(value));
        if (key === 'stock') return value ? formatValue(value) : '不限';
        if (key === 'currency') return (CURRENCY_LABELS[value] || '原始货币编号') + '（' + escapeHtml(value) + '）';
        return formatValue(value);
    }

    function productKeyLabel(key) {
        return PRODUCT_KEY_LABELS[key] || key;
    }

    function shopNameById(id) {
        var core = window.PT_SHOP_CORE;
        var shop = core ? core.getShopById(id) : null;
        return shop && shop.nameCN ? shop.nameCN : '';
    }

    function parseLotteryGroups(groupsText) {
        if (!groupsText) return [];
        try {
            return JSON.parse(String(groupsText).replace(/'/g, '"'));
        } catch (error) {
            return null;
        }
    }

    function renderTabs(state) {
        var tabs = [
            ['shops', '商店'],
            ['special', '特殊货币'],
            ['lottery', '动态刷新']
        ];
        return tabs.map(function(tab) {
            var active = state.tab === tab[0] ? ' pt-filter-chip--active' : '';
            return '<button class="pt-filter-chip pt-filter-chip--sm' + active + '" data-sh-tab="' + tab[0] + '"><span class="pt-filter-chip__label">' + tab[1] + '</span></button>';
        }).join('');
    }

    function matchesSearch(text, search) {
        if (!search) return true;
        return String(text || '').toLowerCase().indexOf(search.toLowerCase()) >= 0;
    }

    function renderShopChips(state, shops) {
        return '<div class="sh-subfilters">' + shops.map(function(shop) {
            var active = state.shopId === shop.id ? ' pt-filter-chip--active' : '';
            return '<button class="pt-filter-chip pt-filter-chip--sm' + active + '" data-sh-id="' + escapeHtml(shop.id) + '"><span class="pt-filter-chip__label">' + escapeHtml(shop.nameCN || shop.id) + '</span></button>';
        }).join('') + '</div>';
    }

    function renderProducts(state) {
        var core = window.PT_SHOP_CORE;
        var shops = core ? core.getShops() : [];
        var currentShop = state.shopId ? core.getShopById(state.shopId) : shops[0];
        if (!state.shopId && currentShop) {
            state.shopId = currentShop.id;
        }
        var html = renderShopChips(state, shops);
        if (!currentShop) return html + '<p class="sh-hint">暂无商店数据</p>';
        var products = (currentShop.products || []).filter(function(product) {
            return matchesSearch(product.nameCN, state.search) || matchesSearch(product.itemID, state.search);
        });
        html += '<div class="sh-section-title">' + escapeHtml(currentShop.nameCN || currentShop.id) + '</div>';
        html += '<table class="sh-table"><thead><tr><th>物品</th><th>类型</th><th>价格</th><th>数量</th><th>库存</th></tr></thead><tbody>';
        products.forEach(function(product, index) {
            html += '<tr class="sh-row" data-sh-pid="' + index + '"><td>' + escapeHtml(product.nameCN || product.itemID) + '</td><td>' + formatShopValue('type', product.type) + '</td><td>' + formatValue(product.price) + '</td><td>' + formatValue(product.count) + '</td><td>' + formatShopValue('stock', product.stock) + '</td></tr>';
        });
        if (!products.length) html += '<tr><td colspan="5" class="sh-empty">没有匹配物品</td></tr>';
        html += '</tbody></table>';
        return html;
    }

    function renderSpecial() {
        var core = window.PT_SHOP_CORE;
        var special = core ? core.getSpecialShops() : {};
        var keys = Object.keys(special);
        var html = '<table class="sh-table"><thead><tr><th>商店编号</th><th>货币</th></tr></thead><tbody>';
        keys.forEach(function(id) {
            var row = special[id] || {};
            html += '<tr><td>' + escapeHtml(shopNameById(id) || id) + '</td><td>' + formatShopValue('currency', row.currency) + '</td></tr>';
        });
        if (!keys.length) html += '<tr><td colspan="2" class="sh-empty">暂无特殊货币数据</td></tr>';
        html += '</tbody></table>';
        return html;
    }

    function renderLottery() {
        var core = window.PT_SHOP_CORE;
        var lotteries = core ? core.getLotteries() : {};
        var keys = Object.keys(lotteries).filter(function(id) {
            var row = lotteries[id] || {};
            return matchesSearch(id, getCommon().getState().search) || matchesSearch(row.groups, getCommon().getState().search);
        });
        var html = '<table class="sh-table"><thead><tr><th>刷新表原始编号</th><th>刷新组</th></tr></thead><tbody>';
        keys.forEach(function(id) {
            var row = lotteries[id] || {};
            var groups = parseLotteryGroups(row.groups);
            var groupHtml = '';
            if (Array.isArray(groups)) {
                groupHtml = '<table class="sh-table sh-table--inner"><thead><tr><th>商店</th><th>商店原始编号</th><th>权重</th></tr></thead><tbody>' + groups.map(function(group) {
                    var shopId = group.ShopGroupName || '';
                    return '<tr><td>' + escapeHtml(shopNameById(shopId) || '未找到中文名') + '</td><td>' + escapeHtml(shopId) + '</td><td>' + formatValue(group.Weight) + '</td></tr>';
                }).join('') + '</tbody></table>';
            } else {
                groupHtml = '<span class="sh-muted">原始刷新组：</span>' + escapeHtml(row.groups || '');
            }
            html += '<tr><td>' + escapeHtml(id) + '</td><td class="sh-preline">' + groupHtml + '</td></tr>';
        });
        if (!keys.length) html += '<tr><td colspan="2" class="sh-empty">暂无动态刷新数据</td></tr>';
        html += '</tbody></table>';
        return html;
    }

    function renderContent() {
        var state = getCommon().getState();
        if (state.tab === 'special') return renderSpecial();
        if (state.tab === 'lottery') return renderLottery();
        return renderProducts(state);
    }

    function renderDetail(itemId) {
        var core = window.PT_SHOP_CORE;
        var state = getCommon().getState();
        var shop = core ? core.getShopById(state.shopId) : null;
        if (!shop) return '';
        var products = (shop.products || []).filter(function(product) {
            return matchesSearch(product.nameCN, state.search) || matchesSearch(product.itemID, state.search);
        });
        var product = products[parseInt(itemId, 10)];
        if (!product) return '';
        var rows = Object.keys(product).map(function(key) {
            return '<div class="sh-drow"><span class="sh-dlbl">' + escapeHtml(productKeyLabel(key)) + '</span><span>' + formatShopValue(key, product[key]) + '</span></div>';
        }).join('');
        return '<div class="pt-web-tool-page pt-web-page--grid-fluid pt-web-filter-page sh-page">' +
            '<section class="pt-web-section pt-web-filter-section sh-filter-bar"><button class="sh-back" data-sh-back>返回</button></section>' +
            '<section class="pt-web-section sh-content-section"><div class="sh-detail"><div class="sh-dname">' + escapeHtml(product.nameCN || product.itemID) + '</div>' + rows + '</div></section></div>';
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
        return '<div class="pt-web-tool-page pt-web-page--grid-fluid pt-web-filter-page sh-page">' +
            '<section class="pt-web-section pt-web-filter-section sh-filter-bar"><div class="pt-web-filter-cluster sh-tabs">' + renderTabs(state) + '<input type="text" class="pt-input sh-search" data-sh-search value="' + escapeHtml(state.search) + '" placeholder="搜索物品或编号..."></div></section>' +
            '<section class="pt-web-section sh-content-section">' + renderContent() + '</section></div>';
    }

    function bind(root) {
        if (!root) return;
        root.addEventListener('click', function(event) {
            var back = event.target.closest('[data-sh-back]');
            if (back) {
                var backCommon = getCommon();
                if (backCommon) backCommon.deselectItem();
                return;
            }
            var tab = event.target.closest('[data-sh-tab]');
            if (tab) {
                var tabCommon = getCommon();
                if (tabCommon) tabCommon.setTab(tab.getAttribute('data-sh-tab'));
                return;
            }
            var shop = event.target.closest('[data-sh-id]');
            if (shop) {
                var shopCommon = getCommon();
                if (shopCommon) shopCommon.setShop(shop.getAttribute('data-sh-id'));
                return;
            }
            var product = event.target.closest('[data-sh-pid]');
            if (product) {
                var productCommon = getCommon();
                if (productCommon) productCommon.selectItem(product.getAttribute('data-sh-pid'));
            }
        });
        root.addEventListener('input', function(event) {
            var search = event.target.closest('[data-sh-search]');
            if (!search || searchComposing || event.isComposing) return;
            var common = getCommon();
            if (!common) return;
            var selectionStart = search.selectionStart;
            var selectionEnd = search.selectionEnd;
            common.setSearch(search.value);
            restoreSearchFocus(root, selectionStart, selectionEnd);
        });
        root.addEventListener('compositionstart', function(event) {
            if (!event.target.closest('[data-sh-search]')) return;
            searchComposing = true;
        });
        root.addEventListener('compositionend', function(event) {
            var search = event.target.closest('[data-sh-search]');
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
        var search = root.querySelector('[data-sh-search]');
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
if (typeof window !== 'undefined') window.PT_SHOP_WEB = PT_SHOP_WEB;
