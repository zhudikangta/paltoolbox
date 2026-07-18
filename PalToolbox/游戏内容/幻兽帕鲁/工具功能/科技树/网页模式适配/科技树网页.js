var PT_TECH_WEB = (function() {
    var loaded = false;
    var loading = false;
    var currentQuery = '';
    var currentSelected = null;
    var currentChangesOnly = false;
    var boundRoot = null;
    var boundClick = null;

    function getCore() {
        return window.PT_TECH_CORE || null;
    }

    function getItemById(id) {
        var core = getCore();
        if (!core) return null;
        var all = core.getAll();
        for (var i = 0; i < all.length; i++) {
            if (all[i].id === id) return all[i];
        }
        return null;
    }

    function getCrossref() {
        return window.PT_CROSS_REF || null;
    }

    function selectItem(item) {
        currentSelected = item;
        rerender();
    }

    function deselectItem() {
        currentSelected = null;
        rerender();
    }

    function ensureData() {
        if (loaded || loading || typeof fetch !== 'function') return;
        loading = true;
        Promise.all([
            fetch('../游戏内容/幻兽帕鲁1.0/数据包/科技.json').then(function(r) { return r.json(); }),
            fetch('../游戏内容/幻兽帕鲁/工具功能/科技树/核心/科技旧等级映射.json').then(function(r) { return r.json(); }),
            fetch('../游戏内容/幻兽帕鲁1.0/数据包/建筑.json').then(function(r) { return r.json(); })
        ]).then(function(results) {
            var core = getCore();
            if (core) {
                core.setData(results[0]);
                core.setOldLevelMap(results[1]);
                core.setBuildings(results[2]);
            }
            loaded = true;
            loading = false;
            rerender();
        }).catch(function() {
            loading = false;
        });
    }

    function renderTag(text) {
        return text ? '<span class="tech-tag">' + text + '</span>' : '';
    }

    function renderCard(item, core) {
        var icon = core.getIconUrl(item);
        var change = core.getChangeDetail(item);
        var badgeHtml = '';
        if (currentChangesOnly && change.changed && change.badge) {
            badgeHtml = '<span class="tech-badge' + (change.oldLevel ? ' tech-badge--moved' : ' tech-badge--new') + '">' + change.badge + '</span>';
        }
        return '<article class="tech-card" data-tech-id="' + item.id + '">' +
            '<div class="tech-card__head">' +
            (icon ? '<img class="tech-card__icon" src="' + icon + '" loading="lazy" alt="' + item.name + '">' : '<span class="tech-card__icon tech-card__icon--empty">?</span>') +
            '<div class="tech-card__name">' + item.name + '</div>' +
            '</div>' +
            '<div class="tech-card__meta">' +
            renderTag('Lv.' + item.level) +
            renderTag(item.points + '点') +
            badgeHtml +
            '</div>' +
            '</article>';
    }

    function renderRecipeTable(id) {
        var ref = getCrossref();
        if (!ref || typeof ref.getRecipesByResult !== 'function') return '';
        var recipes = ref.getRecipesByResult(id);
        if (!recipes || !recipes.length) return '';
        var html = '';
        recipes.forEach(function(r) {
            var mats = (r.materials || []).map(function(m) {
                return '<span class="tech-mat">' + m.nameCN + ' <span class="tech-mat__count">×' + m.count + '</span></span>';
            }).join('');
            if (!mats) return;
            html += '<div class="tech-detail__section"><h3>制造配方</h3>' +
                '<div class="tech-mats">' + mats + '</div>' +
                (r.workAmount ? '<div class="tech-detail__row"><span class="tech-detail__label">工作量</span><span>' + r.workAmount + '</span></div>' : '') +
                '</div>';
        });
        return html;
    }

    function renderBuildingMaterials(buildId) {
        var core = getCore();
        if (!core) return '';
        var b = core.getBuildingById(buildId);
        if (!b) return '';
        var html = '';
        var ref = getCrossref();
        if (b.描述) {
            var desc = String(b.描述).replace(/<itemName id=\|([^|]+)\|\/>/g, function(m, id) {
                var item = ref ? ref.getItem(id) : null;
                return item && item.中文名 ? item.中文名 : id;
            });
            html += '<p class="tech-detail__desc">' + desc + '</p>';
        }
        if (b.TypeA || b.类别) {
            html += '<div class="tech-detail__row"><span class="tech-detail__label">类别</span><span>' + (b.类别 || b.TypeA) + '</span></div>';
        }
        var mats = (b.材料 || []).map(function(m) {
            var item = ref ? ref.getItem(m.id) : null;
            var n = item && item.中文名 ? item.中文名 : (m.id || '');
            return '<span class="tech-mat">' + n + ' <span class="tech-mat__count">×' + m.数量 + '</span></span>';
        }).join('');
        if (mats) {
            html += '<h3>建造材料</h3><div class="tech-mats">' + mats + '</div>';
        }
        if (b.工作量) {
            html += '<div class="tech-detail__row"><span class="tech-detail__label">工作量</span><span>' + b.工作量 + '</span></div>';
        }
        return html ? '<div class="tech-detail__section">' + html + '</div>' : '';
    }

    function renderDetail(item, core) {
        var icon = core.getIconUrl(item);
        var bossLabel = '';
        if (item.boss) {
            bossLabel = String(item.boss).replace('EPalBossType::', '');
        }
        var detailHtml = '';
        (item.items || []).forEach(function(u) { detailHtml += renderRecipeTable(u.id); });
        (item.buildings || []).forEach(function(u) { detailHtml += renderBuildingMaterials(u.id); });
        var unlocks = [];
        (item.buildings || []).forEach(function(u) { unlocks.push(u.name); });
        (item.items || []).forEach(function(u) { unlocks.push(u.name); });
        return '<div class="pt-web-tool-page pt-web-page--grid-fluid pt-web-tech-page">' +
            '<header class="pt-web-tool-heading"><h1>科技详情</h1></header>' +
            '<section class="pt-web-section">' +
            '<button class="tech-back" data-tech-back>← 返回科技树</button>' +
            '<div class="tech-detail">' +
            '<div class="tech-detail__head">' +
            (icon ? '<img class="tech-detail__icon" src="' + icon + '" alt="' + item.name + '">' : '') +
            '<div>' +
            '<div class="tech-detail__name">' + item.name + '</div>' +
            '<div class="tech-detail__id">' + item.id + '</div>' +
            '</div></div>' +
            '<div class="tech-detail__meta">' +
            renderTag('Lv.' + item.level) +
            renderTag(item.points + '点') +
            renderTag(item.ancient ? '古代科技' : '普通科技') +
            '</div>' +
            (item.description ? '<p class="tech-detail__desc">' + item.description + '</p>' : '') +
            (item.prerequisite ? '<div class="tech-detail__row"><span class="tech-detail__label">前置科技</span><span>' + item.prerequisite + '</span></div>' : '') +
            (bossLabel ? '<div class="tech-detail__row"><span class="tech-detail__label">所需BOSS</span><span>' + bossLabel + '</span></div>' : '') +
            (item.research ? '<div class="tech-detail__row"><span class="tech-detail__label">所需研究</span><span>' + item.research + '</span></div>' : '') +
            (detailHtml || (unlocks.length ? '<div class="tech-detail__section"><h3>解锁内容</h3><div class="tech-detail__unlocks">' + unlocks.map(function(n) { return renderTag(n); }).join('') + '</div></div>' : '')) +
            '</div></section></div>';
    }

    function mapByLevel(list) {
        var map = {};
        list.forEach(function(item) {
            var level = item.level || 0;
            if (!map[level]) map[level] = [];
            map[level].push(item);
        });
        return map;
    }

    function mergeLevels(normalMap, ancientMap) {
        var levelMap = {};
        Object.keys(normalMap).forEach(function(level) {
            levelMap[level] = true;
        });
        Object.keys(ancientMap).forEach(function(level) {
            levelMap[level] = true;
        });
        return Object.keys(levelMap).map(function(level) {
            return Number(level);
        }).sort(function(a, b) {
            return a - b;
        });
    }

    function renderLevelRows(normalList, ancientList, core) {
        var normalMap = mapByLevel(normalList);
        var ancientMap = mapByLevel(ancientList);
        var levels = mergeLevels(normalMap, ancientMap);
        if (!levels.length) return '<div class="tech-empty">没有符合条件的科技</div>';
        return levels.map(function(level) {
            var normalItems = normalMap[level] || [];
            var ancientItems = ancientMap[level] || [];
            if (currentChangesOnly) {
                normalItems = normalItems.filter(function(item) {
                    return core.getChangeDetail(item).changed;
                });
                ancientItems = ancientItems.filter(function(item) {
                    return core.getChangeDetail(item).changed;
                });
                if (!normalItems.length && !ancientItems.length) return '';
            }
            return '<div class="tech-level-row" data-tech-level-row="' + level + '">' +
                '<div class="tech-level-badge"><span>' + level + '</span></div>' +
                '<div class="tech-grid tech-grid--normal">' + normalItems.map(function(item) {
                    return renderCard(item, core);
                }).join('') + '</div>' +
                '<div class="tech-grid tech-grid--ancient">' + ancientItems.map(function(item) {
                    return renderCard(item, core);
                }).join('') + '</div>' +
                '</div>';
        }).join('');
    }

    function renderFilters(core) {
        return '<section class="pt-web-section pt-web-filter-section">' +
            '<div class="pt-web-filter-shell"><div class="pt-web-filter-groups">' +
            '<div class="pt-web-filter-cluster pt-web-filter-cluster--primary tech-filter-primary">' +
            '<input class="pt-input tech-filter-search" data-tech-search type="search" value="' + currentQuery + '" placeholder="搜索科技名称、编号、描述...">' +
            '<label class="tech-changes-label"><input type="checkbox" data-tech-changes-only' + (currentChangesOnly ? ' checked' : '') + '> 只看1.0新增变化</label>' +
            '</div>' +
            '</div></div>' +
            '</section>';
    }

    function renderLoading() {
        return '<div class="pt-web-tool-page pt-web-page--grid-fluid"><header class="pt-web-tool-heading"><h1>科技树</h1></header><section class="pt-web-section">正在加载科技数据...</section></div>';
    }

    function render() {
        var core = getCore();
        if (!core) return '<div class="pt-web-tool-page pt-web-page--bounded"><p>科技树核心未加载</p></div>';
        ensureData();
        if (!loaded && !core.getAll().length) return renderLoading();
        if (currentSelected) return renderDetail(currentSelected, core);
        return '<div class="pt-web-tool-page pt-web-page--grid-fluid pt-web-tech-page pt-web-filter-page">' +
            '<header class="pt-web-tool-heading"><h1>科技树</h1></header>' +
            renderFilters(core) +
            renderBoard(core) +
            '</div>';
    }

    function renderBoard(core) {
        var normalList = core.search(currentQuery, 'normal', 0);
        var ancientList = core.search(currentQuery, 'ancient', 0);
        return '<section class="tech-board">' +
            '<div class="tech-panel-title tech-panel-title--normal">普通科技</div>' +
            '<div class="tech-panel-title tech-panel-title--ancient">古代科技</div>' +
            '<div class="tech-level-rows">' + renderLevelRows(normalList, ancientList, core) + '</div>' +
            '</section>';
    }

    function rerender() {
        var content = document.getElementById('pt-web-content');
        var scroll = content ? content.querySelector('.pt-web-tool-scroll') : null;
        if (!scroll) return;
        var core = getCore();
        if (!core) { scroll.innerHTML = render(); bind(content); return; }
        if (!currentSelected && loaded) {
            var board = scroll.querySelector('.tech-board');
            if (board) {
                board.outerHTML = renderBoard(core);
                return;
            }
            scroll.innerHTML = render();
            bind(content);
            return;
        }
        scroll.innerHTML = render();
        bind(content);
    }

    function handleRootClick(e) {
        var back = e.target.closest('[data-tech-back]');
        if (back) { deselectItem(); return; }
        var card = e.target.closest('[data-tech-id]');
        if (card) {
            var id = card.getAttribute('data-tech-id');
            var item = getItemById(id);
            if (item) selectItem(item);
        }
    }

    function bind(root) {
        if (!root) return;
        var search = root.querySelector('[data-tech-search]');
        if (search) {
            search.addEventListener('input', function() {
                currentQuery = search.value;
                rerender();
            });
        }
        var changesOnly = root.querySelector('[data-tech-changes-only]');
        if (changesOnly) {
            changesOnly.addEventListener('change', function() {
                currentChangesOnly = changesOnly.checked;
                rerender();
            });
        }
        if (boundRoot !== root) {
            if (boundRoot && boundClick) boundRoot.removeEventListener('click', boundClick);
            boundRoot = root;
            boundClick = handleRootClick;
            root.addEventListener('click', handleRootClick);
        }
    }

    return {
        render: render,
        bind: bind
    };
})();

if (typeof window !== 'undefined') {
    window.PT_TECH_WEB = PT_TECH_WEB;
}
