var PT_SKILL_WEB = (function() {
    var dataReady = false;
    var loadError = '';
    var searchComposing = false;

    var partnerData = null;
    var partnerCatalogIds = [];
    var partnerLoading = false;
    var partnerLoadError = '';
    var partnerSearchQ = '';
    var partnerCategory = '普通帕鲁';
    var PARTNER_CATEGORIES = ['普通帕鲁', '石板Boss', '塔主Boss', 'Boss', '狂暴化', '其他'];
    var PARTNER_DATA_URL = '../游戏内容/幻兽帕鲁1.0/数据包/伙伴技能.json';

    var activeSort = 'default';
    var fruitOnly = false;

    var RANK_COLORS = {
        '0': '#6b7280', '1': '#6b7280',
        '2': '#3b82f6',
        '3': '#eab308',
        '4': '#22c55e',
        '5': '#22c55e'
    };
    var RANK_GLOW = { '5': 'filter:drop-shadow(0 0 8px rgba(168,85,247,.65));box-shadow:inset 0 0 6px rgba(168,85,247,.25)' };

    var EFFECT_DESC_MAP = {
        'LifeSteal': '生命偷取',
        'KnockbackInvalid_ForPassiveSkill': '击退无效',
        'LeanBackInvalid_ForPassiveSkill': '后仰无效'
    };

    function getCommon() {
        return (typeof window !== 'undefined' && window.PT_SKILL_COMMON) ? window.PT_SKILL_COMMON : null;
    }

    function getCrossref() {
        return (typeof window !== 'undefined' && window.PT_CROSS_REF) ? window.PT_CROSS_REF : null;
    }

    function getRawData() {
        var ref = getCrossref();
        return ref ? ref.skillData : null;
    }

    function isActiveMode() {
        return window.PT_WEB_ACTIVE_TOOL === 'activeSkill';
    }

    function isPassivesMode() {
        return window.PT_WEB_ACTIVE_TOOL === 'passives';
    }

    function isPartnerMode() {
        return window.PT_WEB_ACTIVE_TOOL === 'partnerSkill';
    }

    function ensureData() {
        if (dataReady) return true;
        var ref = getCrossref();
        if (!ref) { loadError = '跨工具索引模块未加载'; return false; }
        if (ref.isDataReady()) { dataReady = true; return true; }
        ref.loadAll().then(function() {
            dataReady = true;
            loadError = '';
            rerender();
        }).catch(function(err) {
            loadError = err && err.message ? err.message : '数据加载失败';
            rerender();
        });
        return false;
    }

    function ensurePartnerData() {
        if (partnerData || partnerLoading) return !!partnerData;
        var loader = (typeof window !== 'undefined' && window.PT_DATA_LOADER) ? window.PT_DATA_LOADER : null;
        if (!loader) { partnerLoadError = '加载器不可用'; return false; }
        partnerLoading = true;
        loader.loadJson(PARTNER_DATA_URL).then(function(rawPartnerData) {
            rawPartnerData = rawPartnerData || {};
            var partnerFacts = rawPartnerData.partnerSkills || {};
            var internalParameters = rawPartnerData.internalParameters || {};
            var catalog = Array.isArray(rawPartnerData.catalog) ? rawPartnerData.catalog : Object.keys(partnerFacts).map(function(id) { return { palId: id }; });
            partnerData = {};
            partnerCatalogIds = [];
            catalog.forEach(function(catalogItem) {
                var id = typeof catalogItem === 'string' ? catalogItem : catalogItem.palId;
                if (!id || !partnerFacts[id]) return;
                partnerCatalogIds.push(id);
                partnerData[id] = Object.assign({}, internalParameters[id] || {}, partnerFacts[id], {
                    catalogCategory: catalogItem.category || partnerFacts[id].category || '',
                    catalogReason: catalogItem.reason || ''
                });
            });
            partnerLoading = false;
            rerender();
        }).catch(function(err) {
            partnerLoading = false;
            partnerLoadError = err && err.message ? err.message : '加载失败';
            rerender();
        });
        return false;
    }

    function renderLoading() {
        var title = '技能';
        if (isActiveMode()) title = '主动技能';
        else if (isPassivesMode()) title = '词条';
        else if (isPartnerMode()) title = '伙伴技能';
        var msg = loadError || partnerLoadError || '加载中…';
        return '<div class="pt-web-tool-page pt-web-page--grid-fluid pt-web-skill-page">' +
            '<header class="pt-web-tool-heading"><div><span class="pt-web-tool-kicker">资料 / ' + title + '</span><h1>' + title + '</h1></div></header>' +
            '<section class="pt-web-section"><div class="sk-data-state">' + msg + '</div></section></div>';
    }

    function activeSortPower(a, b) {
        var pa = (a.威力 != null ? a.威力 : 0);
        var pb = (b.威力 != null ? b.威力 : 0);
        return activeSort === 'power-desc' ? pb - pa : pa - pb;
    }

    function renderActive() {
        var rawData = getRawData();
        if (!rawData) return renderLoading();
        var common = getCommon();
        var rawList = rawData.active || [];
        if (fruitOnly) rawList = rawList.filter(function(s) { return s.技能果实; });
        var list = common ? common.getActiveFiltered({ active: rawList }) : rawList;
        if (activeSort !== 'default') list = list.slice().sort(activeSortPower);
        var s = common ? common.getState() : { searchQ: '', category: '全部', source: '全部', showUnreleased: false, sortByLevel: false, onlyNew: false, excludeHidden: true, onlyNewActive: false };
        var q = s.searchQ;

        var cards = list.map(function(s) {
            var effects = (s.效果 || []).map(function(e) { return '<span class="sk-tag">' + e + '</span>'; }).join('');
            var desc = s.描述 ? '<p class="sk-desc">' + s.描述 + '</p>' : '';
            var fruitTag = s.技能果实 ? '<span class="sk-tag sk-tag--fruit">技能果实</span>' : '';
            return '<article class="sk-card"><div class="sk-card-head"><strong>' + (s.中文名 || s.id) + '</strong><span class="sk-id">' + s.id + '</span></div>' +
                '<div class="sk-meta">' +
                '<span class="sk-elem sk-elem--' + (s.属性英文 || '').toLowerCase() + '">' + (s.属性 || '') + '</span>' +
                '<span>' + (s.类别 || '') + '</span>' +
                '<span>威力 ' + (s.威力 != null ? s.威力 : '--') + '</span>' +
                '<span>冷却 ' + (s.冷却 != null ? s.冷却 + 's' : '--') + '</span>' +
                '</div>' + desc +
                '<div class="sk-tags">' + effects + fruitTag + '</div></article>';
        }).join('');

        var sortChips = [
            { id: 'default', label: '默认顺序' },
            { id: 'power-desc', label: '伤害↓' },
            { id: 'power-asc', label: '伤害↑' }
        ];
        var sortHtml = sortChips.map(function(sc) {
            var on = activeSort === sc.id ? ' pt-filter-chip--active' : '';
            return '<button class="pt-filter-chip pt-filter-chip--sm' + on + '" data-sk-sort="' + sc.id + '"><span class="pt-filter-chip__label">' + sc.label + '</span></button>';
        }).join('');

        return '<div class="pt-web-tool-page pt-web-page--grid-fluid pt-web-skill-page pt-web-filter-page">' +
            '<header class="pt-web-tool-heading"><div><span class="pt-web-tool-kicker">资料 / 主动技能</span><h1>主动技能</h1></div></header>' +
            '<section class="pt-web-section pt-web-filter-section">' +
            '<div class="pt-web-filter-shell"><div class="pt-web-filter-groups">' +
            '<div class="pt-web-filter-cluster pt-web-filter-cluster--primary">' +
            '<input type="text" class="pt-input" data-sk-search placeholder="搜索名称、ID、属性…" value="' + q + '">' +
            '</div>' +
            '<div class="pt-web-filter-divider" aria-hidden="true"></div>' +
            '<div class="pt-web-filter-cluster pt-web-filter-cluster--advanced">' +
            '<div class="pt-web-filter-chips-row"><span class="pt-web-filter-chip-label">排序</span><div class="pt-web-filter-chips">' + sortHtml + '</div></div>' +
            '<label class="pt-web-filter-toggle"><input type="checkbox" data-sk-fruit' + (fruitOnly ? ' checked' : '') + '> 仅显示技能果实技能</label>' +
            '<label class="pt-web-filter-toggle"><input type="checkbox" data-sk-exclude-hidden' + (s.excludeHidden ? ' checked' : '') + '> 排除未实装、无中文名等技能</label>' +
            '<label class="pt-web-filter-toggle"><input type="checkbox" data-sk-only-new-active' + (s.onlyNewActive ? ' checked' : '') + '> 仅显示新主动技能</label>' +
            '</div>' +
            '</div></div>' +
            '</section>' +
            '<section class="pt-web-section sk-grid-section"><div class="sk-count">共 ' + list.length + ' 条</div>' +
            '<div class="sk-grid">' + cards + '</div></section></div>';
    }

    function displayName(item) {
        var name = item.中文名 || '';
        if (!name || name.indexOf('zh-Hans') > -1 || name.indexOf('zh-hans') > -1) return item.id || '';
        return name;
    }

    function passiveLevel(item) {
        return Number((item._raw || item).等级) || 0;
    }

    function comparePassiveByLevelDesc(a, b) {
        var levelDiff = passiveLevel(b) - passiveLevel(a);
        if (levelDiff) return levelDiff;
        var ar = a._raw || a;
        var br = b._raw || b;
        return displayName(ar).localeCompare(displayName(br), 'zh-Hans-CN') || String(ar.id || '').localeCompare(String(br.id || ''));
    }

    function renderPassiveCard(item) {
        var raw = item._raw || item;
        var lv = raw.等级 != null ? raw.等级 : 0;
        var lvStr = String(lv);
        var bgColor = lv < 0 ? '#ef4444' : (RANK_COLORS[lvStr] || '#6b7280');
        var glow = RANK_GLOW[lv] || '';
        var effects = (raw.效果描述 || []).map(function(d) {
            var text = d;
            Object.keys(EFFECT_DESC_MAP).forEach(function(key) {
                text = text.split(key).join(EFFECT_DESC_MAP[key]);
            });
            return '<span class="sk-tag">' + text + '</span>';
        }).join('');
        var triggers = (raw.触发 || []).map(function(t) { return '<span class="sk-tag sk-tag--trigger">' + t + '</span>'; }).join('');
        var sourceTag = raw.来源 && raw.来源 !== '其他' ? '<span class="sk-tag sk-tag--source">' + raw.来源 + '</span>' : '';
        var equipInfo = '';
        var equipNames = raw.来源装备名 || [];
        var equipIds = raw.来源装备 || [];
        if (equipNames.length) {
            equipInfo = '<div class="sk-equip">出自：' + equipNames.map(function(n, i) {
                var eid = equipIds[i] || '';
                if (eid) return '<a class="sk-equip-link" data-sk-equip="' + eid + '" href="javascript:">' + n + '</a>';
                return n;
            }).join('、') + '</div>';
        }
        var chainInfo = (raw.来源链 || []).length ? '<div class="sk-chain">' + raw.来源链.map(function(c) { return '<div class="sk-chain-item">' + c + '</div>'; }).join('') + '</div>' : '';
        var unreleasedTag = item._unreleased ? '<span class="sk-tag sk-tag--unreleased">未实装</span>' : '';

        return '<article class="sk-card sk-card--passive" style="border-left:4px solid ' + bgColor + ';' + glow + '">' +
            '<div class="sk-card-head"><strong>' + displayName(raw) + '</strong>' +
            '<span class="sk-rank">Lv.' + raw.等级 + '</span></div>' +
            '<div class="sk-meta">' + sourceTag + triggers + unreleasedTag + '</div>' +
            '<div class="sk-tags">' + effects + '</div>' +
            equipInfo + chainInfo + '</article>';
    }

    function renderPassives() {
        var rawData = getRawData();
        if (!rawData) return renderLoading();
        var common = getCommon();
        var s = common ? common.getState() : { searchQ: '', category: '全部', source: '全部', showUnreleased: false, sortByLevel: false, onlyNew: false, excludeHidden: true, onlyNewActive: false };
        var categorized = common ? common.getCategorizedFiltered(rawData) : {};
        var CATEGORY_ORDER = common ? common.CATEGORY_ORDER : [];
        var CATEGORY_LABEL = common ? common.CATEGORY_LABEL : {};

        var catChips = CATEGORY_ORDER.map(function(c) {
            var cnt = 0;
            Object.keys(categorized[c] || {}).forEach(function(src) { cnt += categorized[c][src].length; });
            return '<button class="pt-filter-chip pt-filter-chip--sm' + (s.category === c ? ' pt-filter-chip--active' : '') + (cnt === 0 ? ' sk-chip--empty' : '') + '" data-sk-cat="' + c + '">' +
                '<span class="pt-filter-chip__label">' + (CATEGORY_LABEL[c] || c) + '</span><span class="pt-filter-chip__count">' + cnt + '</span></button>';
        }).join('');

        var groupCount = 0;
        CATEGORY_ORDER.forEach(function(cat) {
            if (s.category !== '全部' && s.category !== cat) return;
            Object.keys(categorized[cat] || {}).forEach(function(src) {
                var items = categorized[cat][src];
                if (cat === 'pal' && s.subCategory !== '全部') {
                    items = items.filter(function(i) { return i._subCat === s.subCategory; });
                }
                if (cat === 'pal' && s.onlyNew && common) {
                    items = items.filter(function(i) { return common.isNewPalPassive(displayName(i._raw || i)); });
                }
                groupCount += items.length;
            });
        });

        var allHtml = '';
        var SUB_CAT_ORDER = common ? common.SUB_CAT_ORDER : [];
        var SUB_CAT_LABEL = common ? common.SUB_CAT_LABEL : {};
        CATEGORY_ORDER.forEach(function(cat) {
            var groups = categorized[cat] || {};
            var catTotal = 0;
            Object.keys(groups).forEach(function(src) { catTotal += groups[src].length; });
            if (catTotal === 0) return;
            if (s.category !== '全部' && s.category !== cat) return;
            allHtml += '<div class="sk-category-group"><h2 class="sk-category-title">' + (CATEGORY_LABEL[cat] || cat) + '</h2>';
            if (cat === 'pal' && s.sortByLevel) {
                var byLevel = {};
                Object.keys(groups).forEach(function(src) {
                    groups[src].forEach(function(item) {
                        if (s.subCategory !== '全部' && item._subCat !== s.subCategory) return;
                        if (s.onlyNew && common && !common.isNewPalPassive(displayName(item._raw || item))) return;
                        var lv = String((item._raw || item).等级 || 0);
                        if (!byLevel[lv]) byLevel[lv] = [];
                        byLevel[lv].push(item);
                    });
                });
                Object.keys(byLevel).map(Number).sort(function(a, b) { return b - a; }).forEach(function(lv) {
                    var items = byLevel[String(lv)];
                    var cardsHtml = items.map(renderPassiveCard).join('');
                    allHtml += '<div class="sk-group"><h3 class="sk-group-title">Lv.' + lv + ' <span class="sk-tab-count">(' + items.length + ')</span></h3>' +
                        '<div class="sk-grid">' + cardsHtml + '</div></div>';
                });
            } else {
                Object.keys(groups).forEach(function(src) {
                    var items = groups[src];
                    if (cat === 'pal' && s.subCategory !== '全部') {
                        items = items.filter(function(i) { return i._subCat === s.subCategory; });
                    }
                    if (cat === 'pal' && s.onlyNew && common) {
                        items = items.filter(function(i) { return common.isNewPalPassive(displayName(i._raw || i)); });
                    }
                    if (!items.length) return;
                    if (cat === 'pal') items = items.slice().sort(comparePassiveByLevelDesc);
                    var cardsHtml = items.map(renderPassiveCard).join('');
                    allHtml += '<div class="sk-group"><h3 class="sk-group-title">' + src + ' <span class="sk-tab-count">(' + items.length + ')</span></h3>' +
                        '<div class="sk-grid">' + cardsHtml + '</div></div>';
                });
            }
            allHtml += '</div>';
        });

        var allCatChip = '<button class="pt-filter-chip pt-filter-chip--sm' + (s.category === '全部' ? ' pt-filter-chip--active' : '') + '" data-sk-cat="全部"><span class="pt-filter-chip__label">全部</span></button>';
        var allSubChip = '<button class="pt-filter-chip pt-filter-chip--sm' + (s.subCategory === '全部' ? ' pt-filter-chip--active' : '') + '" data-sk-sub="全部"><span class="pt-filter-chip__label">全部</span></button>';

        return '<div class="pt-web-tool-page pt-web-page--grid-fluid pt-web-skill-page pt-web-filter-page">' +
            '<header class="pt-web-tool-heading"><div><span class="pt-web-tool-kicker">资料 / 词条</span><h1>词条</h1></div></header>' +
            '<section class="pt-web-section pt-web-filter-section">' +
            '<div class="pt-web-filter-shell"><div class="pt-web-filter-groups">' +
            '<div class="pt-web-filter-cluster pt-web-filter-cluster--category">' +
            '<div class="pt-web-filter-chips pt-web-filter-category-chips pt-web-filter-category-chips--main">' + allCatChip + catChips + '</div>' +
            '</div>' +
            '<div class="pt-web-filter-divider" aria-hidden="true"></div>' +
            '<div class="pt-web-filter-cluster pt-web-filter-cluster--primary">' +
            '<input type="text" class="pt-input" data-sk-search placeholder="搜索名称、ID、来源…" value="' + s.searchQ + '">' +
            ((s.category === 'pal') ? '<div class="pt-web-filter-chips-row"><span class="pt-web-filter-chip-label">子类</span><div class="pt-web-filter-chips">' + allSubChip + SUB_CAT_ORDER.map(function(sc) {
                var cnt = 0;
                if (categorized['pal']) { Object.keys(categorized['pal']).forEach(function(src) { cnt += (categorized['pal'][src].filter(function(i) { return i._subCat === sc; })).length; }); }
                return '<button class="pt-filter-chip pt-filter-chip--sm' + (s.subCategory === sc ? ' pt-filter-chip--active' : '') + (cnt === 0 ? ' sk-chip--empty' : '') + '" data-sk-sub="' + sc + '"><span class="pt-filter-chip__label">' + (SUB_CAT_LABEL[sc] || sc) + '</span></button>';
            }).join('') + '</div></div>' +
            '<label class="pt-web-filter-toggle"><input type="checkbox" data-sk-sort-level' + (s.sortByLevel ? ' checked' : '') + '> 按等级排序</label>' +
            '<label class="pt-web-filter-toggle"><input type="checkbox" data-sk-only-new' + (s.onlyNew ? ' checked' : '') + '> 只显示新词条</label>' : '') +
            '</div>' +
            '<div class="pt-web-filter-divider" aria-hidden="true"></div>' +
            '<div class="pt-web-filter-cluster pt-web-filter-cluster--advanced">' +
            '<label class="pt-web-filter-toggle"><input type="checkbox" data-sk-unreleased' + (s.showUnreleased ? ' checked' : '') + '> 显示未实装</label>' +
            '</div>' +
            '</div></div>' +
            '</section>' +
            '<section class="pt-web-section sk-grid-section"><div class="sk-count">共 ' + groupCount + ' 条</div>' + allHtml + '</section></div>';
    }

    function renderPartner() {
        if (!ensurePartnerData()) return renderLoading();
        if (!partnerData) return renderLoading();
        var ids = partnerCatalogIds.slice();
        ids = ids.filter(function(id) {
            var p = partnerData[id];
            return p.catalogCategory === partnerCategory;
        });
        if (partnerSearchQ) {
            var q = partnerSearchQ.toLowerCase();
            ids = ids.filter(function(id) {
                var p = partnerData[id];
                return (p.palName || p.nameCN || '').toLowerCase().indexOf(q) > -1 ||
                    (p.skillName || '').toLowerCase().indexOf(q) > -1 ||
                    (p.description || '').toLowerCase().indexOf(q) > -1 ||
                    id.toLowerCase().indexOf(q) > -1;
            });
        }
        var cards = ids.map(function(id) {
            var p = partnerData[id];
            var palName = p.palName || p.nameCN || id;
            var name = p.skillName || '--';
            var desc = p.description || '';
            var trigger = p.trigger || '';
            var cooldown = p.coolDown;
            var values = p.values || [];
            var valuesHtml = values.length ? '<div class="sk-partner-values">' + values.map(function(v, i) {
                return '<span class="sk-partner-star">' + (i + 1) + '★:' + v + '</span>';
            }).join(' ') + '</div>' : '';
            return '<article class="sk-card sk-card--passive" style="border-left:4px solid #8b5cf6">' +
                '<div class="sk-card-head"><strong>' + name + '</strong><span class="sk-id">' + palName + ' / ' + id + '</span></div>' +
                '<div class="sk-meta">' +
                (trigger ? '<span class="sk-tag sk-tag--trigger">' + trigger + '</span>' : '') +
                (cooldown ? '<span class="sk-tag">冷却 ' + cooldown + 's</span>' : '') +
                '</div>' +
                (desc ? '<p class="sk-desc">' + desc + '</p>' : '') +
                valuesHtml + '</article>';
        }).join('');
        var categoryChips = PARTNER_CATEGORIES.map(function(category) {
            return '<button type="button" class="pt-filter-chip pt-filter-chip--sm' + (category === partnerCategory ? ' pt-filter-chip--active' : '') + '" data-sk-partner-category="' + category + '"><span class="pt-filter-chip__label">' + category + '</span></button>';
        }).join('');

        return '<div class="pt-web-tool-page pt-web-page--grid-fluid pt-web-skill-page pt-web-filter-page">' +
            '<header class="pt-web-tool-heading"><div><span class="pt-web-tool-kicker">资料 / 伙伴技能</span><h1>伙伴技能</h1></div></header>' +
            '<section class="pt-web-section pt-web-filter-section">' +
            '<div class="pt-web-filter-shell"><div class="pt-web-filter-groups">' +
            '<div class="pt-web-filter-cluster pt-web-filter-cluster--category">' +
            '<div class="pt-web-filter-category-layout"><div class="pt-web-filter-chips pt-web-filter-category-chips pt-web-filter-category-chips--main">' + categoryChips + '</div></div>' +
            '</div>' +
            '<div class="pt-web-filter-divider" aria-hidden="true"></div>' +
            '<div class="pt-web-filter-cluster pt-web-filter-cluster--primary">' +
            '<input type="text" class="pt-input" data-sk-partner-search placeholder="搜索伙伴技能名称…" value="' + partnerSearchQ + '">' +
            '</div>' +
            '</div></div>' +
            '</section>' +
            '<section class="pt-web-section sk-grid-section"><div class="sk-count">共 ' + ids.length + ' 条</div>' +
            '<div class="sk-grid">' + cards + '</div></section></div>';
    }

    function openEquipDetail(equipId) {
        var ref = typeof window !== 'undefined' && window.PT_CROSS_REF ? window.PT_CROSS_REF : null;
        if (!ref) return;
        var item = ref.getItem(equipId);
        if (!item) return;
        if (typeof window.PT_EQUIP_COMMON !== 'undefined' && window.PT_EQUIP_COMMON) {
            window.PT_EQUIP_COMMON.selectItem(item);
        }
        if (typeof window.PT_switchWebTool === 'function') {
            window.PT_switchWebTool('equipment');
        }
    }

    function render() {
        loadError = '';
        if (isPartnerMode()) return renderPartner();
        if (!ensureData()) return renderLoading();
        if (isActiveMode()) return renderActive();
        if (isPassivesMode()) return renderPassives();
        return renderLoading();
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
        if (!root || root.dataset.skBd === '1') return;
        root.dataset.skBd = '1';

        root.addEventListener('click', function(e) {
            var partnerChip = e.target.closest('[data-sk-partner-category]');
            if (partnerChip) {
                partnerCategory = partnerChip.getAttribute('data-sk-partner-category') || '普通帕鲁';
                rerender();
                return;
            }
            var chip = e.target.closest('[data-sk-cat]');
            if (chip) {
                var common = getCommon();
                if (common) { common.setCategory(chip.getAttribute('data-sk-cat')); rerender(); }
                return;
            }
            chip = e.target.closest('[data-sk-sub]');
            if (chip) {
                var common = getCommon();
                if (common) { common.setSubCategory(chip.getAttribute('data-sk-sub')); }
                rerender();
                return;
            }
            chip = e.target.closest('[data-sk-source]');
            if (chip) {
                var common = getCommon();
                if (common) { common.setSource(chip.getAttribute('data-sk-source')); rerender(); }
                return;
            }
            var sortBtn = e.target.closest('[data-sk-sort]');
            if (sortBtn) {
                activeSort = sortBtn.getAttribute('data-sk-sort');
                rerender();
                return;
            }
            var equipLink = e.target.closest('[data-sk-equip]');
            if (equipLink) {
                openEquipDetail(equipLink.getAttribute('data-sk-equip'));
                return;
            }
        });
        root.addEventListener('input', function(e) {
            var input = e.target.closest('[data-sk-search]');
            if (!input || searchComposing || e.isComposing) return;
            var selStart = input.selectionStart;
            var common = getCommon();
            if (common) { common.setSearch(input.value); rerender(); }
            var newInput = root.querySelector('[data-sk-search]');
            if (newInput) { newInput.focus(); newInput.selectionStart = newInput.selectionEnd = selStart; }
        });
        root.addEventListener('input', function(e) {
            var input = e.target.closest('[data-sk-partner-search]');
            if (!input || searchComposing || e.isComposing) return;
            partnerSearchQ = input.value;
            rerender();
            var newInput = root.querySelector('[data-sk-partner-search]');
            if (newInput) { newInput.focus(); newInput.selectionStart = newInput.selectionEnd = input.selectionStart; }
        });
        root.addEventListener('compositionstart', function(e) {
            if (!e.target.closest('[data-sk-search]') && !e.target.closest('[data-sk-partner-search]')) return;
            searchComposing = true;
        });
        root.addEventListener('compositionend', function(e) {
            var input = e.target.closest('[data-sk-search]') || e.target.closest('[data-sk-partner-search]');
            if (!input) return;
            searchComposing = false;
            var selStart = input.selectionStart;
            var isPartner = input.getAttribute('data-sk-partner-search') !== null;
            if (isPartner) {
                partnerSearchQ = input.value;
            } else {
                var common = getCommon();
                if (common) { common.setSearch(input.value); }
            }
            rerender();
            var sel = isPartner ? '[data-sk-partner-search]' : '[data-sk-search]';
            var newInput = root.querySelector(sel);
            if (newInput) { newInput.focus(); newInput.selectionStart = newInput.selectionEnd = selStart; }
        });
        root.addEventListener('change', function(e) {
            var cb = e.target.closest('[data-sk-unreleased]');
            if (cb) { var common = getCommon(); if (common) { common.toggleUnreleased(); rerender(); } return; }
            cb = e.target.closest('[data-sk-sort-level]');
            if (cb) { var common = getCommon(); if (common) { common.toggleSortByLevel(); rerender(); } return; }
            cb = e.target.closest('[data-sk-only-new]');
            if (cb) { var common = getCommon(); if (common) { common.toggleOnlyNew(); rerender(); } return; }
            cb = e.target.closest('[data-sk-exclude-hidden]');
            if (cb) { var common = getCommon(); if (common) { common.toggleExcludeHidden(); rerender(); } return; }
            cb = e.target.closest('[data-sk-only-new-active]');
            if (cb) { var common = getCommon(); if (common) { common.toggleOnlyNewActive(); rerender(); } return; }
            cb = e.target.closest('[data-sk-fruit]');
            if (cb) { fruitOnly = cb.checked; rerender(); return; }
        });
    }

    var common = getCommon();
    if (common) common.onChange(function() { rerender(); });

    return {
        render: render,
        bind: bind,
        destroy: function() {
            dataReady = false;
            partnerData = null;
            partnerCatalogIds = [];
            partnerCategory = '普通帕鲁';
            partnerSearchQ = '';
        }
    };
})();

if (typeof window !== 'undefined') {
    window.PT_SKILL_WEB = PT_SKILL_WEB;
}
