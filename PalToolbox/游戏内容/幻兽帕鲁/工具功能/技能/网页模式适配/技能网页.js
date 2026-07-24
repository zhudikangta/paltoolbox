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
    var partnerFacetSelections = {};
    var partnerFilterSearchQ = '';
    var partnerExpandedGroups = {};
    var partnerShowDetails = false;
    var partnerTaxonomy = { groups: [], facets: [], detailTags: [] };
    var partnerFrameMaskFrame = 0;
    var partnerFrameMaskScrollFrame = 0;
    var partnerFrameMaskLayout = null;
    var partnerFrameMaskNeedsLayout = false;
    var partnerFilterAnimationFrame = 0;
    var PARTNER_CATEGORY_ORDER = ['普通帕鲁', '石板Boss', '塔主Boss', 'Boss', '狂暴化', '其他'];
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

    function getWebSettings() {
        try {
            return typeof window.readPTSettings === 'function' ? window.readPTSettings('web') : {};
        } catch (error) {
            return {};
        }
    }

    function getPartnerAppearanceVars() {
        if (typeof window === 'undefined' || typeof window.PT_buildCardVisualVars !== 'function') return {};
        var webSettings = getWebSettings();
        var themes = window.PT_THEME_PRESETS || {};
        var fallbackTheme = themes[webSettings.theme || 'oceanic'] || themes.oceanic || {};
        if (typeof window.PT_getLayeredCardAppearanceSettings !== 'function') return {};
        var appearance = window.PT_getLayeredCardAppearanceSettings(webSettings);
        var frame = window.PT_buildCardVisualVars(webSettings, appearance.frameTheme, appearance.frameMaterial, fallbackTheme);
        var cube = window.PT_buildCardVisualVars(webSettings, appearance.cubeTheme, appearance.cubeMaterial, fallbackTheme);
        return {
            '--pd-frame-bg': frame.bg || 'rgba(12,24,38,.42)',
            '--pd-frame-border': frame.border || 'rgba(255,255,255,.16)',
            '--pd-frame-glow': frame.glow || frame.beamGlow || 'rgba(120,210,255,.24)',
            '--pd-frame-metal-texture': frame.metalTexture || 'none',
            '--pd-frame-wood-texture': frame.woodTexture || 'none',
            '--pd-frame-blur': frame.blur || '18px',
            '--pd-frame-saturate': frame.saturate || '1.22',
            '--pd-frame-brightness': frame.brightness || '1',
            '--pd-frame-contrast': frame.contrast || '1',
            '--pd-frame-hue-rotate': frame.hueRotate || '0deg',
            '--pd-frame-before-background': frame.beforeBackground || 'none',
            '--pd-frame-before-opacity': frame.beforeOpacity || '0',
            '--pd-frame-glass-glow': frame.glassGlowShadow || 'none',
            '--pd-frame-metal-shadow': frame.metalShadow || 'none',
            '--pd-frame-bug-blur': frame.bugBlur || '18px',
            '--pd-cube-bg': cube.bg || 'rgba(20,38,58,.42)',
            '--pd-cube-border': cube.border || 'rgba(255,255,255,.14)',
            '--pd-cube-glow': cube.glow || cube.beamGlow || 'rgba(120,210,255,.26)',
            '--pd-cube-beam': cube.beam || 'linear-gradient(90deg,transparent,rgba(255,255,255,.48),transparent)',
            '--pd-cube-metal-texture': cube.metalTexture || 'none',
            '--pd-cube-wood-texture': cube.woodTexture || 'none',
            '--pd-cube-blur': cube.blur || '14px',
            '--pd-cube-saturate': cube.saturate || '1.22',
            '--pd-cube-brightness': cube.brightness || '1',
            '--pd-cube-contrast': cube.contrast || '1',
            '--pd-cube-hue-rotate': cube.hueRotate || '0deg',
            '--pd-cube-sheen-opacity': cube.sheenOpacity || '0',
            '--pd-cube-sheen-angle': cube.sheenAngle || '135deg',
            '--pd-cube-before-background': cube.beforeBackground || 'none',
            '--pd-cube-before-opacity': cube.beforeOpacity || '0',
            '--pd-cube-glass-glow': cube.glassGlowShadow || 'none',
            '--pd-cube-metal-shadow': cube.metalShadow || 'none',
            '--pd-active-cube-material-id': appearance.cubeMaterial,
            '--pd-cube-material-id': appearance.cubeMaterial
        };
    }

    function applyPartnerAppearanceVars(targetRoot) {
        if (!targetRoot) return;
        var page = targetRoot.querySelector('.pt-web-skill-page') || targetRoot;
        var vars = getPartnerAppearanceVars();
        Object.keys(vars).forEach(function(name) {
            page.style.setProperty(name, vars[name]);
        });
    }

    function getPartnerOffsetWithin(element, frame) {
        var left = 0;
        var top = 0;
        var node = element;
        while (node && node !== frame) {
            left += node.offsetLeft;
            top += node.offsetTop;
            node = node.offsetParent;
        }
        if (node !== frame) return null;
        return { left: left, top: top };
    }

    function buildPartnerFrameMaskRegionLayout(frame, scroller) {
        if (!frame || !scroller) return null;
        var scrollerOffset = getPartnerOffsetWithin(scroller, frame);
        if (!scrollerOffset) return null;
        var holes = Array.prototype.map.call(scroller.querySelectorAll('.sk-partner-results-meta, .sk-partner-card-cell, .sk-partner-no-results'), function(element) {
            var offset = getPartnerOffsetWithin(element, frame);
            if (!offset || !element.clientWidth || !element.clientHeight) return null;
            return {
                left: offset.left,
                top: offset.top,
                width: element.clientWidth,
                height: element.clientHeight
            };
        }).filter(Boolean);
        return {
            scroller: scroller,
            clipX: scrollerOffset.left + scroller.clientLeft,
            clipY: scrollerOffset.top + scroller.clientTop,
            clipWidth: scroller.clientWidth,
            clipHeight: scroller.clientHeight,
            holes: holes
        };
    }

    function buildPartnerFrameMaskLayout(targetRoot) {
        if (!targetRoot) return null;
        var frame = targetRoot.querySelector('.sk-partner-browser');
        var results = frame ? frame.querySelector('.sk-partner-results') : null;
        if (!frame || !results || !frame.clientWidth || !frame.clientHeight) return null;
        var region = buildPartnerFrameMaskRegionLayout(frame, results);
        if (!region) return null;
        return {
            frame: frame,
            width: frame.clientWidth,
            height: frame.clientHeight,
            region: region
        };
    }

    function renderPartnerFrameMaskRegion(region) {
        var holes = region.holes.map(function(hole) {
            return '<rect x="' + hole.left + '" y="' + hole.top +
                '" width="' + hole.width + '" height="' + hole.height +
                '" rx="7" ry="7"/>';
        }).join('');
        return {
            clip: '<clipPath id="sk-partner-results-clip"><rect x="' + region.clipX + '" y="' + region.clipY +
                '" width="' + region.clipWidth + '" height="' + region.clipHeight + '"/></clipPath>',
            holes: '<g clip-path="url(#sk-partner-results-clip)"><g fill="black" data-sk-partner-mask-scroll-group="results" transform="translate(' +
                (-region.scroller.scrollLeft) + ' ' + (-region.scroller.scrollTop) + ')">' + holes + '</g></g>'
        };
    }

    function updatePartnerFrameMaskScroll(targetRoot) {
        var frame = targetRoot ? targetRoot.querySelector('.sk-partner-browser') : null;
        if (!frame || !partnerFrameMaskLayout || partnerFrameMaskLayout.frame !== frame) return;
        var region = partnerFrameMaskLayout.region;
        var group = frame.querySelector('[data-sk-partner-mask-scroll-group="results"]');
        if (!region || !group) return;
        group.setAttribute('transform', 'translate(' + (-region.scroller.scrollLeft) + ' ' + (-region.scroller.scrollTop) + ')');
    }

    function applyPartnerFrameMask(targetRoot, rebuildLayout) {
        var frame = targetRoot ? targetRoot.querySelector('.sk-partner-browser') : null;
        if (rebuildLayout || !partnerFrameMaskLayout || partnerFrameMaskLayout.frame !== frame) {
            partnerFrameMaskLayout = buildPartnerFrameMaskLayout(targetRoot);
        }
        if (!partnerFrameMaskLayout) return;
        var frameLayout = partnerFrameMaskLayout;
        var defs = frame.querySelector('.sk-partner-frame-mask-svg defs');
        if (!defs) return;
        var rendered = renderPartnerFrameMaskRegion(frameLayout.region);
        defs.innerHTML = rendered.clip + '<mask id="sk-partner-frame-holes" maskUnits="userSpaceOnUse" x="0" y="0" width="' + frameLayout.width + '" height="' + frameLayout.height + '">' +
            '<rect x="0" y="0" width="' + frameLayout.width + '" height="' + frameLayout.height + '" fill="white"/>' +
            rendered.holes + '</mask>';
    }

    function schedulePartnerFrameMask(targetRoot, rebuildLayout) {
        partnerFrameMaskNeedsLayout = partnerFrameMaskNeedsLayout || rebuildLayout === true;
        if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
            applyPartnerFrameMask(targetRoot, partnerFrameMaskNeedsLayout);
            partnerFrameMaskNeedsLayout = false;
            return;
        }
        if (partnerFrameMaskFrame) window.cancelAnimationFrame(partnerFrameMaskFrame);
        partnerFrameMaskFrame = window.requestAnimationFrame(function() {
            partnerFrameMaskFrame = 0;
            applyPartnerFrameMask(targetRoot, partnerFrameMaskNeedsLayout);
            partnerFrameMaskNeedsLayout = false;
        });
    }

    function schedulePartnerFrameMaskScroll(targetRoot) {
        if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
            updatePartnerFrameMaskScroll(targetRoot);
            return;
        }
        if (partnerFrameMaskScrollFrame) return;
        partnerFrameMaskScrollFrame = window.requestAnimationFrame(function() {
            partnerFrameMaskScrollFrame = 0;
            updatePartnerFrameMaskScroll(targetRoot);
        });
    }

    function animatePartnerFilterGroup(targetRoot) {
        if (!targetRoot || typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
            applyPartnerFrameMask(targetRoot, true);
            return;
        }
        if (partnerFilterAnimationFrame) window.cancelAnimationFrame(partnerFilterAnimationFrame);
        var startedAt = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
        function updateMask(now) {
            applyPartnerFrameMask(targetRoot, true);
            if ((now || Date.now()) - startedAt < 180) {
                partnerFilterAnimationFrame = window.requestAnimationFrame(updateMask);
                return;
            }
            partnerFilterAnimationFrame = 0;
        }
        partnerFilterAnimationFrame = window.requestAnimationFrame(updateMask);
    }

    function initPartnerFrameMaskScroll(targetRoot) {
        if (!targetRoot) return;
        var results = targetRoot.querySelector('.sk-partner-results');
        if (!results || results.dataset.skPartnerMaskScrollBound === '1') return;
        results.dataset.skPartnerMaskScrollBound = '1';
        results.addEventListener('scroll', function() {
            schedulePartnerFrameMaskScroll(targetRoot);
        }, { passive: true });
    }

    function initPartnerScrollbars(targetRoot) {
        if (!targetRoot || typeof window === 'undefined' || typeof window.PT_initCustomScrollbars !== 'function') return;
        var sidebar = targetRoot.querySelector('.sk-partner-filter-sidebar');
        var results = targetRoot.querySelector('.sk-partner-results');
        if (sidebar) {
            window.PT_initCustomScrollbars(sidebar);
            if (sidebar._ptCustomScrollbarState && sidebar._ptCustomScrollbarState.bar) {
                sidebar._ptCustomScrollbarState.bar.classList.add('sk-partner-filter-scrollbar');
            }
        }
        if (results) window.PT_initCustomScrollbars(results);
    }

    function renderPartnerEffectBlocks(item, skillCore) {
        var blocks = skillCore && skillCore.getPartnerEffectBlockModels
            ? skillCore.getPartnerEffectBlockModels(item, partnerFacetSelections)
            : [];
        return blocks.map(function(block) {
            var tags = block.labels.length
                ? '<div class="sk-tags sk-partner-effect-tags">' + block.labels.map(function(label) {
                    return '<span class="sk-tag sk-tag--partner-usage' +
                        (label.selected ? ' sk-tag--partner-selected' : '') +
                        '">' + label.label + '</span>';
                }).join('') + '</div>'
                : '';
            var technology = block.technologyText
                ? '<div class="sk-partner-technology">' + block.technologyText + '</div>'
                : '';
            return '<div class="sk-partner-effect-block' +
                (block.highlighted ? ' sk-partner-effect-block--highlighted' : '') +
                '">' + tags + '<p class="sk-desc sk-partner-desc">' + block.text + '</p>' +
                technology + '</div>';
        }).join('');
    }

    function getSkillCore() {
        return (typeof window !== 'undefined' && window.PT_SKILL_CORE) ? window.PT_SKILL_CORE : null;
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
            partnerTaxonomy = rawPartnerData.taxonomy || { groups: [], facets: [], detailTags: [] };
            var skillCore = getSkillCore();
            if (skillCore && skillCore.setPartnerSkillData) skillCore.setPartnerSkillData(rawPartnerData);
            partnerData = {};
            partnerCatalogIds = [];
            catalog.forEach(function(catalogItem) {
                var id = typeof catalogItem === 'string' ? catalogItem : catalogItem.palId;
                if (!id || !partnerFacts[id]) return;
                partnerCatalogIds.push(id);
                partnerData[id] = Object.assign({}, internalParameters[id] || {}, partnerFacts[id], {
                    catalogCategory: catalogItem.category || partnerFacts[id].category || '',
                    catalogReason: catalogItem.reason || '',
                    displayId: catalogItem.displayId || '',
                    iconFile: catalogItem.iconFile || '',
                    usageCategoryIds: (catalogItem.usageCategoryIds || []).slice(),
                    usageSubcategoryIds: (catalogItem.usageSubcategoryIds || []).slice(),
                    usageTagIds: (catalogItem.usageTagIds || []).slice(),
                    classificationStatus: catalogItem.classificationStatus || ''
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
        var skillCore = getSkillCore();
        var availableCategories = skillCore && skillCore.getPartnerSourceCategories
            ? skillCore.getPartnerSourceCategories(PARTNER_CATEGORY_ORDER)
            : PARTNER_CATEGORY_ORDER.slice();
        if (availableCategories.indexOf(partnerCategory) < 0) {
            partnerCategory = availableCategories[0] || '普通帕鲁';
        }
        var filteredModels = skillCore && skillCore.filterPartnerSkills ? skillCore.filterPartnerSkills({
            sourceCategory: partnerCategory,
            query: partnerSearchQ,
            facetSelections: partnerFacetSelections
        }) : [];
        var ids = skillCore && skillCore.filterPartnerSkills
            ? filteredModels.map(function(item) { return item.id; })
            : partnerCatalogIds.slice().filter(function(id) {
                var p = partnerData[id];
                return p.catalogCategory === partnerCategory;
            });
        var taxonomy = skillCore && skillCore.getPartnerTaxonomy ? skillCore.getPartnerTaxonomy() : partnerTaxonomy;
        var groups = taxonomy.groups || [];
        var facetGroups = skillCore && skillCore.getPartnerFacetGroups ? skillCore.getPartnerFacetGroups() : [];
        var facetCounts = skillCore && skillCore.getPartnerFacetCounts ? skillCore.getPartnerFacetCounts({
            sourceCategory: partnerCategory,
            query: partnerSearchQ,
            facetSelections: partnerFacetSelections
        }) : {};
        var facetGroupCounts = skillCore && skillCore.getPartnerFacetGroupCounts ? skillCore.getPartnerFacetGroupCounts({
            sourceCategory: partnerCategory,
            query: partnerSearchQ,
            facetSelections: partnerFacetSelections
        }) : {};

        var cards = ids.map(function(id) {
            var p = partnerData[id];
            var palName = p.palName || p.nameCN || id;
            var displayIdHtml = p.displayId ? '<span class="sk-partner-card-id">#' + p.displayId + '</span>' : '<span class="sk-partner-card-id"></span>';
            var name = p.hasPartnerSkill === false ? '无伙伴技能' : (p.skillName || '--');
            var common = getCommon();
            var effectBlocksHtml = renderPartnerEffectBlocks(p, skillCore);
            var fixedParameterHtml = partnerShowDetails && common && common.renderPartnerFixedParameters ? common.renderPartnerFixedParameters(p) : '';
            var rankTableHtml = partnerShowDetails && common && common.renderPartnerRankTables ? common.renderPartnerRankTables(p.rankTables, p.rankTable) : '';
            var avatar = p.iconFile
                ? '<img class="sk-partner-avatar" src="../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/' + p.iconFile + '" loading="lazy" alt="' + palName + '">'
                : '<span class="sk-partner-avatar sk-partner-avatar--missing" aria-hidden="true">?</span>';
            return '<div class="sk-partner-card-cell"><article class="sk-card sk-card--passive sk-partner-card">' +
                '<div class="sk-partner-card-top">' + displayIdHtml + '</div>' +
                '<div class="sk-partner-pal">' + avatar + '<div class="sk-partner-identity">' +
                '<div class="sk-partner-pal-row"><strong class="sk-partner-pal-name">' + palName + '</strong></div>' +
                '<div class="sk-partner-skill-name">伙伴技能：' + name + '</div></div></div>' +
                effectBlocksHtml +
                fixedParameterHtml + rankTableHtml + '</article></div>';
        }).join('');
        var categoryChips = availableCategories.map(function(category) {
            return '<button type="button" class="pt-filter-chip pt-filter-chip--sm' + (category === partnerCategory ? ' pt-filter-chip--active' : '') + '" data-sk-partner-category="' + category + '"><span class="pt-filter-chip__label">' + category + '</span></button>';
        }).join('');
        var filterNeedle = String(partnerFilterSearchQ || '').trim().toLowerCase();
        var selectedFilters = skillCore && skillCore.getPartnerSelectedFilters ? skillCore.getPartnerSelectedFilters(partnerFacetSelections) : [];
        var filterGroupsHtml = facetGroups.map(function(group) {
            var groupMatches = String(group.label || '').toLowerCase().indexOf(filterNeedle) > -1;
            var hasSelection = false;
            var facetHtml = group.facets.map(function(facet) {
                var selectedIds = partnerFacetSelections[facet.id] || [];
                if (selectedIds.length) hasSelection = true;
                var visibleOptions = facet.options.filter(function(option) {
                    return !filterNeedle || groupMatches || String(facet.label + ' ' + option.label).toLowerCase().indexOf(filterNeedle) > -1;
                });
                if (!visibleOptions.length) return '';
                var optionsHtml = visibleOptions.map(function(option) {
                    var active = selectedIds.indexOf(option.id) > -1;
                    var count = facetCounts[facet.id] && facetCounts[facet.id][option.id];
                    return '<button type="button" class="sk-partner-facet-option' + (active ? ' sk-partner-facet-option--active' : '') + (count === 0 ? ' sk-partner-facet-option--empty' : '') + '" data-sk-partner-facet-option="' + option.id + '" data-sk-partner-facet-id="' + facet.id + '" aria-pressed="' + (active ? 'true' : 'false') + '"><span>' + option.label + '</span><span class="sk-partner-facet-count">' + (count || 0) + '</span></button>';
                }).join('');
                return '<div class="sk-partner-facet"><div class="sk-partner-facet-title">' + facet.label + '</div><div class="sk-partner-facet-options">' + optionsHtml + '</div></div>';
            }).join('');
            if (!facetHtml) return '';
            var expanded = !!filterNeedle || hasSelection || partnerExpandedGroups[group.id] === true;
            var groupCount = facetGroupCounts[group.id] || 0;
            return '<section class="sk-partner-filter-group' + (expanded ? ' sk-partner-filter-group--open' : '') + '">' +
                '<button type="button" class="sk-partner-filter-group-toggle" data-sk-partner-filter-group="' + group.id + '" aria-expanded="' + (expanded ? 'true' : 'false') + '"><span class="sk-partner-filter-group-heading"><span>' + group.label + '</span><span class="sk-partner-filter-group-count">' + groupCount + '</span></span><span class="sk-partner-filter-group-icon">' + (expanded ? '−' : '+') + '</span></button>' +
                '<div class="sk-partner-filter-group-collapse" aria-hidden="' + (expanded ? 'false' : 'true') + '"' + (expanded ? '' : ' inert') + '><div class="sk-partner-filter-group-collapse-inner"><div class="sk-partner-filter-group-body">' + facetHtml + '</div></div></div></section>';
        }).join('');
        var appliedHtml = selectedFilters.length ? '<div class="sk-partner-applied"><span class="sk-partner-applied-label">已选条件</span>' + selectedFilters.map(function(item) {
            return '<button type="button" data-sk-partner-remove-filter="' + item.optionId + '" data-sk-partner-facet-id="' + item.facetId + '">' + item.label + '<span aria-hidden="true">×</span></button>';
        }).join('') + '<button type="button" class="sk-partner-clear" data-sk-partner-clear-filters>全部清空</button></div>' : '';
        var detailsToggleHtml = '<div class="sk-partner-results-actions"><button type="button" class="pt-filter-chip pt-filter-chip--sm sk-partner-details-toggle' + (partnerShowDetails ? ' pt-filter-chip--active' : '') + '" data-sk-partner-toggle-details aria-pressed="' + (partnerShowDetails ? 'true' : 'false') + '">' + (partnerShowDetails ? '隐藏详情' : '展示详情') + '</button></div>';
        var emptyFilterHtml = filterGroupsHtml ? '' : '<div class="sk-partner-filter-empty">没有匹配的筛选项</div>';
        var resultWallClass = ids.length === 1
            ? ' sk-partner-card-wall--single'
            : (ids.length === 2 ? ' sk-partner-card-wall--double' : '');
        var resultsHtml = cards
            ? '<div class="sk-partner-card-wall' + resultWallClass + '"><div class="sk-partner-card-grid">' + cards + '</div></div>'
            : '<div class="sk-partner-card-wall sk-partner-card-wall--empty"><div class="sk-partner-card-grid sk-partner-card-grid--empty"><div class="sk-partner-card sk-partner-no-results"><strong>没有符合全部条件的帕鲁</strong><span>可以移除一个已选条件，或全部清空后重新筛选。</span>' + (selectedFilters.length ? '<button type="button" data-sk-partner-clear-filters>清空筛选</button>' : '') + '</div></div></div>';

        return '<div class="pt-web-tool-page pt-web-page--grid-fluid pt-web-skill-page pt-web-filter-page">' +
            '<header class="pt-web-tool-heading"><div><span class="pt-web-tool-kicker">资料 / 伙伴技能</span><h1>伙伴技能</h1></div></header>' +
            '<div class="sk-partner-browser">' +
            '<svg class="sk-partner-frame-mask-svg" aria-hidden="true" focusable="false"><defs></defs></svg>' +
            '<aside class="sk-partner-filter-sidebar" aria-label="伙伴技能筛选">' +
            '<div class="sk-partner-filter-stack">' +
            '<div class="sk-partner-sidebar-block"><label class="sk-partner-sidebar-label">搜索帕鲁或技能</label><input type="text" class="pt-input" data-sk-partner-search placeholder="帕鲁名、技能名或用途…" value="' + partnerSearchQ + '"></div>' +
            '<div class="sk-partner-sidebar-block"><span class="sk-partner-sidebar-label">帕鲁来源</span><div class="sk-partner-source-options">' + categoryChips + '</div></div>' +
            '<div class="sk-partner-sidebar-block"><label class="sk-partner-sidebar-label">查找筛选项</label><input type="text" class="pt-input" data-sk-partner-filter-search placeholder="例如：放牧、骑乘、玩家伤害…" value="' + partnerFilterSearchQ + '"></div>' +
            '<div class="sk-partner-filter-groups">' + filterGroupsHtml + emptyFilterHtml + '</div>' +
            '</div></aside>' +
            '<div class="sk-partner-browser-divider" aria-hidden="true"></div>' +
            '<section class="sk-partner-results sk-grid-section"><div class="sk-partner-results-stack"><div class="sk-partner-results-meta">' + detailsToggleHtml + appliedHtml + '<div class="sk-count">共 ' + ids.length + ' 条</div></div>' + resultsHtml + '</div></section>' +
            '</div></div>';
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
        var currentSidebar = scroll.querySelector('.sk-partner-filter-sidebar');
        var sidebarScrollTop = currentSidebar ? currentSidebar.scrollTop : 0;
        scroll.innerHTML = render();
        var nextSidebar = scroll.querySelector('.sk-partner-filter-sidebar');
        if (nextSidebar) nextSidebar.scrollTop = sidebarScrollTop;
        bind(content);
    }

    function bind(root) {
        if (!root) return;
        applyPartnerAppearanceVars(root);
        initPartnerScrollbars(root);
        initPartnerFrameMaskScroll(root);
        schedulePartnerFrameMask(root);
        if (root.dataset.skBd === '1') return;
        root.dataset.skBd = '1';
        if (typeof window !== 'undefined') {
            window.addEventListener('resize', function() {
                schedulePartnerFrameMask(root, true);
            });
        }

        root.addEventListener('click', function(e) {
            var partnerChip = e.target.closest('[data-sk-partner-category]');
            if (partnerChip) {
                partnerCategory = partnerChip.getAttribute('data-sk-partner-category') || '普通帕鲁';
                rerender();
                return;
            }
            var partnerGroupToggle = e.target.closest('[data-sk-partner-filter-group]');
            if (partnerGroupToggle) {
                var partnerGroupId = partnerGroupToggle.getAttribute('data-sk-partner-filter-group');
                var partnerGroup = partnerGroupToggle.closest('.sk-partner-filter-group');
                var partnerGroupOpen = !partnerGroup.classList.contains('sk-partner-filter-group--open');
                partnerExpandedGroups[partnerGroupId] = partnerGroupOpen;
                partnerGroup.classList.toggle('sk-partner-filter-group--open', partnerGroupOpen);
                partnerGroupToggle.setAttribute('aria-expanded', partnerGroupOpen ? 'true' : 'false');
                var partnerGroupCollapse = partnerGroup.querySelector('.sk-partner-filter-group-collapse');
                if (partnerGroupCollapse) {
                    partnerGroupCollapse.setAttribute('aria-hidden', partnerGroupOpen ? 'false' : 'true');
                    partnerGroupCollapse.toggleAttribute('inert', !partnerGroupOpen);
                }
                var partnerGroupIcon = partnerGroupToggle.querySelector('.sk-partner-filter-group-icon');
                if (partnerGroupIcon) partnerGroupIcon.textContent = partnerGroupOpen ? '−' : '+';
                animatePartnerFilterGroup(root);
                return;
            }
            var partnerDetailsToggle = e.target.closest('[data-sk-partner-toggle-details]');
            if (partnerDetailsToggle) {
                partnerShowDetails = !partnerShowDetails;
                rerender();
                return;
            }
            var partnerFacetOption = e.target.closest('[data-sk-partner-facet-option]');
            if (partnerFacetOption) {
                var partnerFacetId = partnerFacetOption.getAttribute('data-sk-partner-facet-id');
                var partnerOptionId = partnerFacetOption.getAttribute('data-sk-partner-facet-option');
                var selectedFacetOptions = (partnerFacetSelections[partnerFacetId] || []).slice();
                var selectedFacetOptionIndex = selectedFacetOptions.indexOf(partnerOptionId);
                if (selectedFacetOptionIndex > -1) selectedFacetOptions.splice(selectedFacetOptionIndex, 1);
                else selectedFacetOptions.push(partnerOptionId);
                if (selectedFacetOptions.length) partnerFacetSelections[partnerFacetId] = selectedFacetOptions;
                else delete partnerFacetSelections[partnerFacetId];
                rerender();
                return;
            }
            var partnerRemoveFilter = e.target.closest('[data-sk-partner-remove-filter]');
            if (partnerRemoveFilter) {
                var removeFacetId = partnerRemoveFilter.getAttribute('data-sk-partner-facet-id');
                var removeOptionId = partnerRemoveFilter.getAttribute('data-sk-partner-remove-filter');
                var remainingFacetOptions = (partnerFacetSelections[removeFacetId] || []).filter(function(id) { return id !== removeOptionId; });
                if (remainingFacetOptions.length) partnerFacetSelections[removeFacetId] = remainingFacetOptions;
                else delete partnerFacetSelections[removeFacetId];
                rerender();
                return;
            }
            var partnerClearFilters = e.target.closest('[data-sk-partner-clear-filters]');
            if (partnerClearFilters) {
                partnerFacetSelections = {};
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
        root.addEventListener('input', function(e) {
            var input = e.target.closest('[data-sk-partner-filter-search]');
            if (!input || searchComposing || e.isComposing) return;
            partnerFilterSearchQ = input.value;
            rerender();
            var newInput = root.querySelector('[data-sk-partner-filter-search]');
            if (newInput) { newInput.focus(); newInput.selectionStart = newInput.selectionEnd = input.selectionStart; }
        });
        root.addEventListener('compositionstart', function(e) {
            if (!e.target.closest('[data-sk-search]') && !e.target.closest('[data-sk-partner-search]') && !e.target.closest('[data-sk-partner-filter-search]')) return;
            searchComposing = true;
        });
        root.addEventListener('compositionend', function(e) {
            var input = e.target.closest('[data-sk-search]') || e.target.closest('[data-sk-partner-search]') || e.target.closest('[data-sk-partner-filter-search]');
            if (!input) return;
            searchComposing = false;
            var selStart = input.selectionStart;
            var isPartner = input.getAttribute('data-sk-partner-search') !== null;
            var isPartnerFilter = input.getAttribute('data-sk-partner-filter-search') !== null;
            if (isPartnerFilter) {
                partnerFilterSearchQ = input.value;
            } else if (isPartner) {
                partnerSearchQ = input.value;
            } else {
                var common = getCommon();
                if (common) { common.setSearch(input.value); }
            }
            rerender();
            var sel = isPartnerFilter ? '[data-sk-partner-filter-search]' : (isPartner ? '[data-sk-partner-search]' : '[data-sk-search]');
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
            partnerFacetSelections = {};
            partnerFilterSearchQ = '';
            partnerExpandedGroups = {};
            partnerShowDetails = false;
            partnerTaxonomy = { groups: [], facets: [], detailTags: [] };
        }
    };
})();

if (typeof window !== 'undefined') {
    window.PT_SKILL_WEB = PT_SKILL_WEB;
}
