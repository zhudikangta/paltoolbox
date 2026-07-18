var PT_PALDEX_WEB = (function() {
    var scrollRoot = null;
    var expandedCard = null;
    var expandedOrigEl = null;
    var expandedOrigRect = null;
    var pressedCard = null;
    var pressedStartX = 0;
    var pressedStartY = 0;
    var pressedPullDepth = 0;
    var pressedPullDirection = { x: -1, y: -1 };
    var pressedHasDragged = false;
    var activeSideWallCard = null;
    var resizeHandler = null;
    var searchIsComposing = false;
    var DATA_URL = '../游戏内容/幻兽帕鲁1.0/数据包/帕鲁.json';
    var SKILL_DATA_URL = '../游戏内容/幻兽帕鲁1.0/数据包/习得技能.json';
    var PARTNER_SKILL_DATA_URL = '../游戏内容/幻兽帕鲁1.0/数据包/伙伴技能.json';
    var loadingPromise = null;
    var loadError = '';

    function getCore() {
        return (typeof window !== 'undefined' && window.PT_PALDEX_CORE) ? window.PT_PALDEX_CORE : null;
    }

    function getCommon() {
        return (typeof window !== 'undefined' && window.PT_PALDEX_COMMON) ? window.PT_PALDEX_COMMON : null;
    }

    function getWebSettings() {
        try {
            return typeof window.readPTSettings === 'function' ? window.readPTSettings('web') : {};
        } catch (error) {
            return {};
        }
    }

    function hasData(core) {
        return !!(core && typeof core.getAll === 'function' && core.getAll().length);
    }

    function renderLoading() {
        var message = loadError || '正在读取新版帕鲁资料...';
        var className = loadError ? 'pd-data-state pd-data-state--error' : 'pd-data-state';
        return '<div class="pt-web-tool-page pt-web-page--grid-fluid pt-web-paldex-page pt-web-filter-page">' +
            '<header class="pt-web-tool-heading"><div><span class="pt-web-tool-kicker">图鉴 / 帕鲁</span><h1>帕鲁图鉴</h1></div></header>' +
            '<section class="pt-web-section"><div class="' + className + '">' + message + '</div></section></div>';
    }

    function ensureData(root) {
        var core = getCore();
        if (hasData(core) || loadingPromise) return;
        var loader = (typeof window !== 'undefined' && window.PT_DATA_LOADER) ? window.PT_DATA_LOADER : null;
        if (!core || !loader || typeof loader.loadJson !== 'function') {
            loadError = '新版帕鲁资料加载器不可用';
            rerender();
            return;
        }
        loadError = '';
        loadingPromise = Promise.all([
            loader.loadJson(DATA_URL),
            loader.loadJson(SKILL_DATA_URL),
            loader.loadJson(PARTNER_SKILL_DATA_URL)
        ]).then(function(results) {
            loadingPromise = null;
            if (typeof core.setData === 'function') core.setData(results[0]);
            if (typeof core.setSkillData === 'function') core.setSkillData(results[1]);
            if (typeof core.setPartnerSkillData === 'function') core.setPartnerSkillData(results[2]);
            rerender();
        }).catch(function(error) {
            loadingPromise = null;
            loadError = error && error.message ? error.message : '新版帕鲁资料加载失败';
            rerender();
        });
    }

    function applyAppearanceVars(targetRoot) {
        var common = getCommon();
        if (!targetRoot || !common || typeof common.getAppearanceSettings !== 'function') return;
        if (typeof window.PT_buildCardVisualVars !== 'function') return;
        var settings = common.getAppearanceSettings();
        var webSettings = getWebSettings();
        var themes = window.PT_THEME_PRESETS || {};
        var fallbackTheme = themes[(webSettings && webSettings.theme) || 'oceanic'] || themes.oceanic || {};
        var frame = window.PT_buildCardVisualVars(webSettings, settings.frameTheme, settings.frameMaterial, fallbackTheme);
        var cube = window.PT_buildCardVisualVars(webSettings, settings.cubeTheme, settings.cubeMaterial, fallbackTheme);
        var root = targetRoot.querySelector('.pt-web-paldex-page') || targetRoot;

        root.style.setProperty('--pd-frame-bg', frame.bg || 'rgba(12,24,38,.42)');
        root.style.setProperty('--pd-frame-border', frame.border || 'rgba(255,255,255,.16)');
        root.style.setProperty('--pd-frame-glow', frame.glow || frame.beamGlow || 'rgba(120,210,255,.24)');
        root.style.setProperty('--pd-frame-metal-texture', frame.metalTexture || 'none');
        root.style.setProperty('--pd-frame-wood-texture', frame.woodTexture || 'none');
        root.style.setProperty('--pd-frame-blur', frame.blur || '18px');
        root.style.setProperty('--pd-frame-saturate', frame.saturate || '1.22');
        root.style.setProperty('--pd-frame-brightness', frame.brightness || '1');
        root.style.setProperty('--pd-frame-contrast', frame.contrast || '1');
        root.style.setProperty('--pd-frame-hue-rotate', frame.hueRotate || '0deg');
        root.style.setProperty('--pd-frame-before-background', frame.beforeBackground || 'none');
        root.style.setProperty('--pd-frame-before-opacity', frame.beforeOpacity || '0');
        root.style.setProperty('--pd-frame-metal-shadow', frame.metalShadow || 'none');

        root.style.setProperty('--pd-cube-bg', cube.bg || 'rgba(20,38,58,.42)');
        root.style.setProperty('--pd-cube-border', cube.border || 'rgba(255,255,255,.14)');
        root.style.setProperty('--pd-cube-glow', cube.glow || cube.beamGlow || 'rgba(120,210,255,.26)');
        root.style.setProperty('--pd-cube-beam', cube.beam || 'linear-gradient(90deg, transparent, rgba(255,255,255,.48), transparent)');
        root.style.setProperty('--pd-cube-metal-texture', cube.metalTexture || 'none');
        root.style.setProperty('--pd-cube-wood-texture', cube.woodTexture || 'none');
        root.style.setProperty('--pd-cube-blur', cube.blur || '14px');
        root.style.setProperty('--pd-cube-saturate', cube.saturate || '1.22');
        root.style.setProperty('--pd-cube-brightness', cube.brightness || '1');
        root.style.setProperty('--pd-cube-contrast', cube.contrast || '1');
        root.style.setProperty('--pd-cube-hue-rotate', cube.hueRotate || '0deg');
        root.style.setProperty('--pd-cube-sheen-opacity', cube.sheenOpacity || '0');
        root.style.setProperty('--pd-cube-sheen-angle', cube.sheenAngle || '135deg');
        root.style.setProperty('--pd-cube-before-background', cube.beforeBackground || 'none');
        root.style.setProperty('--pd-cube-before-opacity', cube.beforeOpacity || '0');
        root.style.setProperty('--pd-cube-glass-glow', cube.glassGlowShadow || 'none');
        root.style.setProperty('--pd-cube-metal-shadow', cube.metalShadow || 'none');
        root.style.setProperty('--pd-active-cube-material-id', settings.cubeMaterial || 'gradient');
        root.style.setProperty('--pd-cube-material-id', settings.cubeMaterial || 'gradient');
        if (typeof document !== 'undefined' && document.documentElement) {
            ['--pd-frame-bg','--pd-frame-border','--pd-frame-glow','--pd-frame-metal-texture','--pd-frame-wood-texture','--pd-frame-blur','--pd-frame-saturate','--pd-frame-brightness','--pd-frame-contrast','--pd-frame-hue-rotate','--pd-frame-before-background','--pd-frame-before-opacity','--pd-frame-metal-shadow','--pd-cube-bg','--pd-cube-border','--pd-cube-glow','--pd-cube-beam','--pd-cube-metal-texture','--pd-cube-wood-texture','--pd-cube-blur','--pd-cube-saturate','--pd-cube-brightness','--pd-cube-contrast','--pd-cube-hue-rotate','--pd-cube-sheen-opacity','--pd-cube-sheen-angle','--pd-cube-before-background','--pd-cube-before-opacity','--pd-cube-glass-glow','--pd-cube-metal-shadow','--pd-active-cube-material-id','--pd-cube-material-id'].forEach(function(name) {
                document.documentElement.style.setProperty(name, root.style.getPropertyValue(name));
            });
        }
    }

    function applyFrameMask() {
        if (!scrollRoot) return;
        var grid = scrollRoot.querySelector('.pd-grid');
        if (!grid || !grid.clientWidth || !grid.clientHeight) return;
        var holes = Array.prototype.map.call(grid.querySelectorAll('.pd-cell'), function(cell) {
            return '<rect x="' + cell.offsetLeft + '" y="' + cell.offsetTop + '" width="' + cell.clientWidth + '" height="' + cell.clientHeight + '" rx="7" ry="7"/>';
        }).join('');
        var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + grid.clientWidth + '" height="' + grid.clientHeight + '" viewBox="0 0 ' + grid.clientWidth + ' ' + grid.clientHeight + '">' +
            '<mask id="holes" maskUnits="userSpaceOnUse"><rect width="100%" height="100%" fill="white"/><g fill="black">' + holes + '</g></mask>' +
            '<rect width="100%" height="100%" fill="white" mask="url(#holes)"/></svg>';
        grid.style.setProperty('--pd-frame-mask', 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")');
    }

    function render() {
        var core = getCore();
        var common = getCommon();
        if (!core) return '<div class="pt-web-tool-page pt-web-page--bounded"><p>帕鲁数据未加载</p></div>';
        if (!hasData(core)) return renderLoading();

        var state = common ? common.getState() : { mainCategory: 'normal', subCategory: 'baseVariant', showUnreleased: false, newOnly: false, selEls: [], selWorks: [], displayFields: [], sortMode: 'default', selPal: null, searchQ: '' };
        var selectedElements = state.selEls || (state.selEl ? [state.selEl] : []);
        var selectedWorks = state.selWorks || (state.selWork ? [state.selWork] : []);
        var displayFields = state.displayFields || [];
        var displayFieldDefs = common && common.DISPLAY_FIELDS ? common.DISPLAY_FIELDS : [];
        var displayFieldById = {};
        displayFieldDefs.forEach(function(field) {
            displayFieldById[field.id] = field;
        });

        if (state.selPal !== null) {
            var p = core.getBySlug(state.selPal);
            if (p) return renderDetail(core, p);
        }

        var pals = common ? common.getFilteredPals(core) : core.getAll();

        var mainCategories = common && common.MAIN_CATEGORIES ? common.MAIN_CATEGORIES : [
            { id: 'normal', label: '普通帕鲁' },
            { id: 'raidBoss', label: '石板Boss' },
            { id: 'towerBoss', label: '塔主Boss' },
            { id: 'bossVariant', label: 'Boss' },
            { id: 'berserk', label: '狂暴化' }
        ];
        var ordinarySubCategories = common && common.ORDINARY_SUB_CATEGORIES ? common.ORDINARY_SUB_CATEGORIES : [
            { id: 'baseVariant', label: '基础+亚种' },
            { id: 'terraria', label: '泰拉瑞亚' },
            { id: 'variant', label: '其他' }
        ];
        var mainCategoryChips = mainCategories.map(function(category) {
            return '<button type="button" class="pd-chip pd-category-chip pt-filter-chip pt-filter-chip--sm' + (category.id === state.mainCategory ? ' pd-chip--active pt-filter-chip--active' : '') + '" data-pd-main-category="' + category.id + '"><span class="pt-filter-chip__label">' + category.label + '</span></button>';
        }).join('');
        var subCategoryChips = state.mainCategory === 'normal' ? ordinarySubCategories.map(function(category) {
            return '<button type="button" class="pd-chip pd-category-chip pt-filter-chip pt-filter-chip--sm' + (category.id === state.subCategory ? ' pd-chip--active pt-filter-chip--active' : '') + '" data-pd-sub-category="' + category.id + '"><span class="pt-filter-chip__label">' + category.label + '</span></button>';
        }).join('') : '';
        var subCategoryColumn = '<div class="pt-web-filter-chips pt-web-filter-category-chips pt-web-filter-category-chips--sub' + (subCategoryChips ? '' : ' pt-web-filter-category-chips--sub-empty') + '">' + subCategoryChips + '</div>';
        var unreleasedToggle = '<label class="pt-web-filter-toggle"><input type="checkbox" data-pd-show-unreleased' + (state.showUnreleased ? ' checked' : '') + '><span>显示未实装</span></label>';

        var elChips = core.ELEMENTS.map(function(e) {
            return '<button type="button" class="pd-chip pt-filter-chip pt-filter-chip--sm' + (selectedElements.indexOf(e) > -1 ? ' pd-chip--active pt-filter-chip--active' : '') + '" data-pd-el="' + e + '" style="--c:' + core.getElementColor(e) + '">' +
                '<img class="pd-chip-icon pt-filter-chip__icon" src="' + core.getElementIconUrl(e) + '" alt="' + e.replace('属性', '') + '"><span class="pt-filter-chip__label">' + e.replace('属性', '') + '</span></button>';
        }).join('');

        var workNames = [];
        core.getAll().forEach(function(p) {
            (p.works || []).forEach(function(w) {
                if (workNames.indexOf(w.name) < 0) workNames.push(w.name);
            });
        });
        var workChips = workNames.map(function(w) {
            var label = w === '点火' ? '生火' : w;
            var iconSrc = core.getWorkIconUrl(w);
            var iconHtml = iconSrc ? '<img class="pd-chip-icon pt-filter-chip__icon" src="' + iconSrc + '" alt="' + label + '">' : core.getWorkIcon(w);
            return '<button type="button" class="pd-chip pt-filter-chip pt-filter-chip--sm' + (selectedWorks.indexOf(w) > -1 ? ' pd-chip--active pt-filter-chip--active' : '') + '" data-pd-work="' + w + '">' + iconHtml + '<span class="pt-filter-chip__label">' + label + '</span></button>';
        }).join('');

        var newOnlyToggle = '<label class="pt-web-filter-toggle pd-new-only-toggle"><input type="checkbox" data-pd-new-only' + (state.newOnly ? ' checked' : '') + '><span>只显示新帕鲁</span></label>';
        var sortChips = [
            { id: 'number-asc', label: '编号正序' },
            { id: 'number-desc', label: '编号倒序' },
            { id: 'work-desc', label: '工作高到低' },
            { id: 'work-asc', label: '工作低到高' }
        ].map(function(sort) {
            return '<button type="button" class="pd-chip pt-filter-chip pt-filter-chip--sm' + (state.sortMode === sort.id ? ' pd-chip--active pt-filter-chip--active' : '') + '" data-pd-sort="' + sort.id + '"><span class="pt-filter-chip__label">' + sort.label + '</span></button>';
        }).join('');
        function buildFieldControl(field) {
            var isShown = displayFields.indexOf(field.id) > -1;
            var descMode = field.id + '-desc';
            var ascMode = field.id + '-asc';
            return '<div class="pd-field-control">' +
                '<button type="button" class="pd-chip pt-filter-chip pt-filter-chip--sm' + (isShown ? ' pd-chip--active pt-filter-chip--active' : '') + '" data-pd-field="' + field.id + '"><span class="pt-filter-chip__label">' + field.label + '</span></button>' +
                '<button type="button" class="pd-chip pt-filter-chip pt-filter-chip--sm' + (state.sortMode === descMode ? ' pd-chip--active pt-filter-chip--active' : '') + '" data-pd-sort="' + descMode + '"><span class="pt-filter-chip__label">高到低</span></button>' +
                '<button type="button" class="pd-chip pt-filter-chip pt-filter-chip--sm' + (state.sortMode === ascMode ? ' pd-chip--active pt-filter-chip--active' : '') + '" data-pd-sort="' + ascMode + '"><span class="pt-filter-chip__label">低到高</span></button>' +
                '</div>';
        }
        function getFieldControls(ids) {
            return ids.map(function(id) {
                return displayFieldById[id] ? buildFieldControl(displayFieldById[id]) : '';
            }).join('');
        }
        var leftFieldControls = getFieldControls(['hp', 'defense', 'meleeAttack', 'rangedAttack', 'moveSpeed', 'sprintSpeed']);
        var rightFieldControls = getFieldControls(['food', 'breedPower', 'maleRate']);
        var fieldControls = '<div class="pd-field-column pd-field-column--left">' + leftFieldControls + '</div>' +
            '<div class="pd-field-divider" aria-hidden="true"></div>' +
            '<div class="pd-field-column pd-field-column--right">' + rightFieldControls + '</div>';
        var advancedFilters = '<div class="pt-web-filter-cluster pt-web-filter-cluster--advanced">' +
            '<div class="pd-advanced-row">' + newOnlyToggle + '</div>' +
            '<div class="pt-web-filter-chips-row"><span class="pt-web-filter-chip-label">排序</span><div class="pt-web-filter-chips pd-sort-controls">' + sortChips + '</div></div>' +
            '<div class="pt-web-filter-chips-row"><span class="pt-web-filter-chip-label">显示</span><div class="pd-field-controls">' + fieldControls + '</div></div>' +
            '</div>';

        var cards = pals.map(function(p) {
            var displayIdHtml = p.displayId ? '<span class="pd-card-id">#' + p.displayId + '</span>' : '<span class="pd-card-id"></span>';
            var els = (p.elements || []).map(function(e) {
                return '<img class="pd-el-img" src="' + core.getElementIconUrl(e) + '" alt="' + e.replace('属性', '') + '" title="' + e + '">';
            }).join('');
            var works = (p.works || []).map(function(w) {
                var workLabel = w.name === '点火' ? '生火' : w.name;
                var workIconSrc = core.getWorkIconUrl(w.name);
                var workIconHtml = workIconSrc ? '<img class="pd-work-icon" src="' + workIconSrc + '" alt="' + workLabel + '">' : core.getWorkIcon(w.name);
                return '<span class="pd-work-tag">' + workIconHtml + '<span>Lv' + w.level + ' ' + workLabel + '</span></span>';
            }).join('');
            var extraStats = displayFields.map(function(fieldId) {
                var field = displayFieldById[fieldId];
                if (!field) return '';
                var value = ((p.stats || {})[field.stat] !== undefined && (p.stats || {})[field.stat] !== null && (p.stats || {})[field.stat] !== '') ? (p.stats || {})[field.stat] : '--';
                return '<span>' + field.label + ' ' + value + '</span>';
            }).join('');
            var src = p.icon;
            if (src) src = src.replace(/^资源包\//, '../游戏内容/幻兽帕鲁/资源包/');
            return '<div class="pd-cell"><div class="pd-card" data-pd-id="' + p.slug + '">' +
                '<div class="pd-card-top">' + displayIdHtml + '<span class="pd-card-els">' + els + '</span></div>' +
                '<div class="pd-card-main"><img class="pd-card-img" src="' + src + '" alt="' + p.name + '" loading="lazy" onerror="this.style.opacity=.3">' +
                '<div class="pd-card-info"><b>' + p.name + '</b><em>' + p.partnerSkill + '</em></div></div>' +
                '<div class="pd-card-works">' + works + '</div>' +
                (extraStats ? '<div class="pd-card-stats">' + extraStats + '</div>' : '') + '</div></div>';
        }).join('');

        return '<div class="pt-web-tool-page pt-web-page--grid-fluid pt-web-paldex-page pt-web-filter-page" style="--pd-extra-field-count:' + displayFields.length + '">' +
            '<header class="pt-web-tool-heading"><div><span class="pt-web-tool-kicker">图鉴 / 帕鲁</span><h1>帕鲁图鉴</h1></div></header>' +
            '<section class="pt-web-section pt-web-filter-section"><div class="pt-web-filter-shell"><div class="pt-web-filter-groups">' +
            '<div class="pt-web-filter-cluster pt-web-filter-cluster--category">' +
            '<div class="pt-web-filter-category-layout"><div class="pt-web-filter-chips pt-web-filter-category-chips pt-web-filter-category-chips--main">' + mainCategoryChips + '</div>' +
            subCategoryColumn +
            '</div>' + unreleasedToggle +
            '</div>' +
            '<div class="pt-web-filter-divider" aria-hidden="true"></div>' +
            '<div class="pt-web-filter-cluster pt-web-filter-cluster--primary"><input type="text" class="pt-web-search" data-pd-search placeholder="搜索编号、名字..." value="' + state.searchQ + '">' +
            '<div class="pt-web-filter-chips-row"><span class="pt-web-filter-chip-label">属性</span><div class="pt-web-filter-chips">' + elChips + '</div></div>' +
            '<div class="pt-web-filter-chips-row"><span class="pt-web-filter-chip-label">工作</span><div class="pt-web-filter-chips">' + workChips + '</div></div></div>' +
            '<div class="pt-web-filter-divider" aria-hidden="true"></div>' +
            advancedFilters +
            '</div></div></section>' +
            '<section class="pt-web-section pd-filter-grid-section"><div class="pd-grid"><canvas class="pd-cube-wall-layer" data-pd-cube-wall-layer></canvas>' + cards + '</div></section></div>';
    }

    function detailValue(value) {
        return value === undefined || value === null || value === '' ? '--' : value;
    }

    function detailYesNo(value) {
        return value ? '是' : '否';
    }

    function renderDetailTable(rows) {
        return '<table class="pd-detail-table"><tbody>' + rows.map(function(row) {
            return '<tr><th>' + row[0] + '</th><td>' + detailValue(row[1]) + '</td></tr>';
        }).join('') + '</tbody></table>';
    }

    function renderPartnerSkill(core, p) {
        var raw = p.raw || {};
        var detail = core.getPartnerSkillDetail ? core.getPartnerSkillDetail(p.id) : null;
        var rows = [];
        rows.push(['名称', p.partnerSkill || '--']);
        if (p.partnerSkillDescription) rows.push(['帕鲁说明', p.partnerSkillDescription]);
        if (detail && detail.typeLabel) rows.push(['类型', detail.typeLabel]);
        if (detail && detail.description) rows.push(['效果', String(detail.description).replace(/\s*\|\s*/g, '<br>')]);
        if (detail && detail.values && detail.values.length) {
            rows.push(['星级数值', detail.values.map(function(value, index) {
                return (index + 1) + '星=' + detailValue(value);
            }).join('　')]);
        }
        if (!rows.length && raw.伙伴技能) rows.push(['名称', raw.伙伴技能]);
        return rows.length ? '<div class="pd-detail-panel"><h3>伙伴技能</h3>' + renderDetailTable(rows) + '</div>' : '';
    }

    function renderWorkTable(p) {
        if (!p.works || !p.works.length) return '<p class="pd-detail-empty">--</p>';
        return '<table class="pd-detail-table"><tbody>' + p.works.map(function(work) {
            return '<tr><th>' + work.name + '</th><td>Lv.' + work.level + '</td></tr>';
        }).join('') + '</tbody></table>';
    }

    function renderLearnSkillTable(core, p) {
        var skills = p.learnSkills || [];
        if (!skills.length) return '<p class="pd-detail-empty">--</p>';
        return '<table class="pd-detail-table pd-detail-table--wide"><thead><tr><th>等级</th><th>技能</th><th>属性</th><th>类型</th><th>威力</th></tr></thead><tbody>' + skills.map(function(skill) {
            var detail = core.getSkillDetail ? core.getSkillDetail(skill.技能ID) : null;
            return '<tr><td>Lv.' + detailValue(skill.学习等级) + '</td><td>' + detailValue(skill.技能名 || skill.技能ID) + '</td><td>' + detailValue(detail && detail.element) + '</td><td>' + detailValue(detail && detail.category) + '</td><td>' + detailValue(detail && detail.power) + '</td></tr>';
        }).join('') + '</tbody></table>';
    }

    function renderDropTable(p) {
        var drops = p.dropList || [];
        if (!drops.length) return '<p class="pd-detail-empty">--</p>';
        return '<table class="pd-detail-table"><tbody>' + drops.map(function(drop) {
            return '<tr><th>' + detailValue(drop.物品名 || drop.物品ID) + '</th><td>' + detailValue(drop.物品ID) + '</td></tr>';
        }).join('') + '</tbody></table>';
    }

    function renderDetail(core, p) {
        var src = p.icon;
        if (src) src = src.replace(/^资源包\//, '../游戏内容/幻兽帕鲁/资源包/');
        var els = (p.elements || []).map(function(e) {
            return '<img class="pd-el-img" src="' + core.getElementIconUrl(e) + '" alt="' + e.replace('属性', '') + '" title="' + e + '">';
        }).join('');
        var raw = p.raw || {};
        var st = p.stats || {};
        var titleIdHtml = p.displayId ? ' <span style="font-size:14px;color:var(--pt-text-sub)">#' + p.displayId + '</span>' : '';
        var baseRows = [
            ['属性', els || '--'],
            ['HP', st.HP],
            ['近战攻击', st.近战攻击],
            ['远程攻击', st.远程攻击],
            ['防御', st.防御],
            ['繁殖力', st.繁殖力],
            ['可配种', detailYesNo(p.canBreed)],
            ['移动速度', st.移动速度],
            ['骑乘冲刺', st.骑乘冲刺],
            ['食物量', st.食物量],
            ['雄性概率', st.雄性概率 === undefined ? '--' : st.雄性概率 + '%'],
            ['夜行', detailYesNo(st.是否夜行)]
        ];
        var statusRows = [
            ['内部ID', p.id],
            ['显示名', p.name],
            ['名字Key', raw.名字Key],
            ['中文名状态', p.nameStatus],
            ['头像状态', p.iconStatus],
            ['头像来源', p.iconSourceKey],
            ['数据状态', p.dataStatus],
            ['分类', p.category],
            ['实装状态', p.implementStatus]
        ];

        var habitat = core.getPalHabitat ? core.getPalHabitat(p.id) : null;
        var habitatHtml = habitat ? '<button class="pd-habitat-btn" onclick="PT_PALDEX_WEB.showHabitatMap(\'' + (p.id || '') + '\')">' + (habitat.source === 'boss' ? '👑 查看 Boss 位置' : '🌍 查看栖息地') + '</button>' : '<span class="pd-habitat-none">无栖息地</span>';

        return '<div class="pt-web-tool-page pt-web-page--grid-fluid pt-web-paldex-page pd-detail-page">' +
            '<button class="pd-back" data-pd-back>← 返回列表</button>' +
            '<section class="pt-web-section">' +
            '<div class="pd-detail-head"><img src="' + src + '" class="pd-detail-img" onerror="this.style.opacity=.3">' +
            '<div><h2>' + p.name + titleIdHtml + '</h2>' +
            '<div>' + els + '</div>' +
            '<div class="pd-detail-partner"><strong>伙伴技能</strong> ' + p.partnerSkill + '</div></div></div>' +
            '<div class="pd-detail-desc"><strong>帕鲁背景故事</strong><p>' + detailValue(p.description) + '</p></div>' +
            '<div class="pd-habitat-bar">' + habitatHtml + '</div>' +
            '<div class="pd-detail-panels">' +
            '<div class="pd-detail-panel"><h3>基础属性</h3>' + renderDetailTable(baseRows) + '</div>' +
            renderPartnerSkill(core, p) +
            '<div class="pd-detail-panel"><h3>资料状态</h3>' + renderDetailTable(statusRows) + '</div>' +
            '<div class="pd-detail-panel"><h3>工作适性</h3>' + renderWorkTable(p) + '</div>' +
            '<div class="pd-detail-panel pd-detail-panel--wide"><h3>技能学习 (' + (p.learnSkills || []).length + ')</h3>' + renderLearnSkillTable(core, p) + '</div>' +
            '<div class="pd-detail-panel"><h3>掉落 (' + (p.dropList || []).length + ')</h3>' + renderDropTable(p) + '</div>' +
            '</div></section></div>';
    }

    function showHabitatMap(palId, palName) {
        try {
            var core = getCore();
            if (!core || !core.getPalHabitat) return;
            var habitat = core.getPalHabitat(palId);
            if (!palName) {
                var pal = core.getBySlug ? core.getBySlug(palId) : null;
                if (pal) palName = pal.name || palId;
            }
            if (!habitat || !habitat.points || !habitat.points.length) return;
            if (typeof L === 'undefined') return;

            var overlay = document.createElement('div');
            overlay.className = 'pd-habitat-overlay';
            var hasDay = habitat.points.some(function(p) { return p.type === 'day'; });
            var hasNight = habitat.points.some(function(p) { return p.type === 'night'; });
            var legendHtml = habitat.source === 'boss'
                ? '<span class="pd-legend-dot" style="border:2px solid #ff4444;background:transparent"></span> Boss \u4f4d\u7f6e'
                : (hasDay ? '<span class="pd-legend-btn pd-legend-btn--on" data-habitat-mode="day"><span class="pd-legend-dot pd-legend-day"></span> \u767d\u5929</span>' : '') +
                  (hasNight ? '<span class="pd-legend-btn pd-legend-btn--on" data-habitat-mode="night"><span class="pd-legend-dot pd-legend-night"></span> \u591c\u665a</span>' : '');
            overlay.innerHTML = '<div class="pd-habitat-modal"><div class="pd-habitat-modal-head"><strong>' + (palName || palId) + ' \u6816\u606f\u5730</strong><span class="pd-habitat-points">' + habitat.totalPoints + (habitat.source === 'boss' ? ' \u4e2a Boss \u4f4d\u7f6e' : ' \u4e2a\u70b9\u4f4d') + '</span><button class="pd-habitat-close">\u2715</button></div><div class="pd-habitat-map" id="pd-habitat-map"></div><div class="pd-habitat-legend">' + legendHtml + '</div></div>';
            document.body.appendChild(overlay);

            var mapDiv = overlay.querySelector('#pd-habitat-map');

            var PIXEL_SIZE = 131072;
            var NATIVE_ZOOM = 8;

            var map = L.map(mapDiv, {
                crs: L.CRS.Simple,
                minZoom: 0,
                maxZoom: 8,
                zoomSnap: 0,
                scrollWheelZoom: true,
                zoomControl: false,
                attributionControl: false
            });

            var southWest = map.unproject([0, PIXEL_SIZE], NATIVE_ZOOM);
            var northEast = map.unproject([PIXEL_SIZE, 0], NATIVE_ZOOM);
            var bounds = L.latLngBounds(southWest, northEast);

            L.tileLayer('../游戏内容/幻兽帕鲁1.0/资源包/地图/瓦片/WorldMap/z{z}x{x}y{y}.webp', {
                maxNativeZoom: 4,
                minNativeZoom: 1,
                tileSize: 512,
                noWrap: true,
                bounds: bounds
            }).addTo(map);

            map.setMaxBounds(bounds);

            var markers = { day: [], night: [], boss: [] };
            var allLatLngs = [];
            habitat.points.forEach(function(pt) {
                var px, py;
                try {
                    var mapCore = window.PT_MAP_CORE;
                    if (mapCore && mapCore.getPointPixelCoords) {
                        var c = mapCore.getPointPixelCoords(pt, null);
                        if (c) { px = c.px; py = c.py; }
                    }
                } catch(e) {}
                if (px == null || !isFinite(px) || !isFinite(py)) {
                    if (pt.ipos && pt.ipos.X != null) {
                        px = Number(pt.ipos.X);
                        py = Number(pt.ipos.Y);
                    }
                }
                if (px == null || py == null || !isFinite(px) || !isFinite(py)) return;
                var latLng = map.unproject([px, py], NATIVE_ZOOM);
                allLatLngs.push(latLng);

                var m;
                if (pt.type === 'boss') {
                    var iconSrc = '';
                    try {
                        var palData = core && core.getBySlug ? core.getBySlug(palId) : null;
                        if (palData && palData.icon) iconSrc = palData.icon.replace(/^资源包\//, '../游戏内容/幻兽帕鲁/资源包/');
                    } catch(e) {}
                    var bossHtml = '<div style="width:32px;height:32px;border-radius:50%;overflow:hidden;border:2px solid #ff4444;box-shadow:0 0 8px rgba(255,68,68,0.5);background:rgba(0,0,0,0.3)">';
                    if (iconSrc) bossHtml += '<img src="' + iconSrc + '" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display=\'none\'">';
                    bossHtml += '</div>';
                    m = L.marker(latLng, {
                        icon: L.divIcon({ className: '', html: bossHtml, iconSize: [32, 32], iconAnchor: [16, 16] })
                    }).addTo(map).bindTooltip((palName || palId) + ' Lv.' + (pt.level || '?'), { direction: 'top', className: 'pd-habitat-tooltip' });
                    markers.boss.push(m);
                } else {
                    var fillColor = pt.type === 'day' ? '#ffd700' : '#4488ff';
                    m = L.circleMarker(latLng, {
                        radius: 6, color: fillColor, fillColor: fillColor, fillOpacity: 0.5, weight: 1, opacity: 0.8
                    }).addTo(map).bindTooltip(pt.type === 'day' ? '\u767d\u5929' : '\u591c\u665a', { direction: 'top', className: 'pd-habitat-tooltip' });
                    (pt.type === 'day' ? markers.day : markers.night).push(m);
                }
            });

            if (allLatLngs.length) {
                var g = L.featureGroup(allLatLngs.map(function(ll) { return L.marker(ll); }));
                map.fitBounds(g.getBounds().pad(0.15));
            }

            setMode(habitat.source === 'boss' ? 'boss' : 'day');

            function setMode(mode) {
                markers.day.forEach(function(m) { if (m._map) map.removeLayer(m); });
                markers.night.forEach(function(m) { if (m._map) map.removeLayer(m); });
                if (mode === 'day') markers.day.forEach(function(m) { m.addTo(map); });
                if (mode === 'night') markers.night.forEach(function(m) { m.addTo(map); });
                var btns = overlay.querySelectorAll('[data-habitat-mode]');
                for (var b = 0; b < btns.length; b++) {
                    btns[b].classList.toggle('pd-legend-btn--on', btns[b].getAttribute('data-habitat-mode') === mode);
                }
            }

            if (markers.day.length && markers.night.length) {
                var legend = overlay.querySelector('.pd-habitat-legend');
                legend.addEventListener('click', function(e) {
                    var btn = e.target.closest('[data-habitat-mode]');
                    if (!btn) return;
                    var curMode = btn.getAttribute('data-habitat-mode');
                    if (btn.classList.contains('pd-legend-btn--on')) return;
                    setMode(curMode);
                });
            } else if (markers.boss.length) {
                var btn = overlay.querySelector('[data-habitat-mode]');
                if (btn) btn.classList.add('pd-legend-btn--on');
            }

            function closeMap() {
                if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
                if (map) { map.remove(); map = null; }
            }

            overlay.querySelector('.pd-habitat-close').addEventListener('click', closeMap);
            overlay.addEventListener('click', function(e) {
                if (e.target === overlay) closeMap();
            });
        } catch(e) {
            if (typeof console !== 'undefined') console.error('Habitat map error:', e);
        }
    }

    function setClipHole(el, w, h, l, t, r, b) {
        el.style.clipPath = 'polygon(evenodd,' +
            '0px 0px,' + w + 'px 0px,' + w + 'px ' + h + 'px,0px ' + h + 'px,0px 0px,' +
            l + 'px ' + t + 'px,' + r + 'px ' + t + 'px,' + r + 'px ' + b + 'px,' + l + 'px ' + b + 'px,' + l + 'px ' + t + 'px)';
    }

    function expandCard(cardEl, palId) {
        var core = getCore();
        if (!core) return;
        var p = core.getBySlug(palId);
        if (!p) return;

        var rect = cardEl.getBoundingClientRect();

        expandedOrigEl = cardEl;
        expandedOrigRect = rect;
        cardEl.style.opacity = '0';
        cardEl.classList.remove('pd-card--spring');

        var contentArea = document.getElementById('pt-web-content') || cardEl.closest('.pt-window-card__body') || scrollRoot;
        if (!contentArea) return;
        var target = contentArea.getBoundingClientRect();

        var exp = document.createElement('div');
        exp.className = 'pd-expand-card';
        exp.style.left = rect.left + 'px';
        exp.style.top = rect.top + 'px';
        exp.style.width = rect.width + 'px';
        exp.style.height = rect.height + 'px';
        exp.style.borderRadius = '10px';
        document.body.appendChild(exp);
        expandedCard = exp;

        var contentDiv = document.createElement('div');
        contentDiv.className = 'pd-expand-content';
        contentDiv.innerHTML = renderDetail(core, p);
        exp.appendChild(contentDiv);

        contentDiv.addEventListener('click', function(e) {
            if (!e.target.closest('[data-pd-back]')) return;
            collapseCard();
        });

        var sr = scrollRoot.getBoundingClientRect();
        var srW = sr.width, srH = sr.height;
        var iL = rect.left - sr.left, iT = rect.top - sr.top;
        var iR = rect.right - sr.left, iB = rect.bottom - sr.top;
        var tL = target.left - sr.left, tT = target.top - sr.top;
        var tR = target.right - sr.left, tB = target.bottom - sr.top;

        scrollRoot.style.transition = 'none';
        setClipHole(scrollRoot, srW, srH, iL, iT, iR, iB);
        void scrollRoot.offsetHeight;

        requestAnimationFrame(function() {
            scrollRoot.style.transition = 'clip-path .35s ease';
            setClipHole(scrollRoot, srW, srH, tL, tT, tR, tB);

            exp.style.left = target.left + 'px';
            exp.style.top = target.top + 'px';
            exp.style.width = target.width + 'px';
            exp.style.height = target.height + 'px';
            exp.style.borderRadius = '0px';
        });

        setTimeout(function() {
            scrollRoot.style.visibility = 'hidden';
            scrollRoot.style.transition = '';
            scrollRoot.style.clipPath = '';
        }, 380);
    }

    function collapseCard() {
        if (!expandedCard || !expandedOrigRect) return;

        var exp = expandedCard;
        var origEl = expandedOrigEl;
        var rect = expandedOrigRect;

        scrollRoot.style.visibility = '';
        scrollRoot.style.transition = 'none';

        var sr = scrollRoot.getBoundingClientRect();
        var contentArea = document.getElementById('pt-web-content') || (origEl ? origEl.closest('.pt-window-card__body') : null) || scrollRoot;
        if (!contentArea) return;
        var target = contentArea.getBoundingClientRect();
        var srW = sr.width, srH = sr.height;
        var tL = target.left - sr.left, tT = target.top - sr.top;
        var tR = target.right - sr.left, tB = target.bottom - sr.top;

        setClipHole(scrollRoot, srW, srH, tL, tT, tR, tB);
        void scrollRoot.offsetHeight;

        scrollRoot.style.transition = 'clip-path .35s ease';
        setClipHole(scrollRoot, srW, srH, rect.left - sr.left, rect.top - sr.top, rect.right - sr.left, rect.bottom - sr.top);

        exp.style.left = rect.left + 'px';
        exp.style.top = rect.top + 'px';
        exp.style.width = rect.width + 'px';
        exp.style.height = rect.height + 'px';
        exp.style.borderRadius = '10px';

        var cleanup = function() {
            if (exp.parentNode) exp.parentNode.removeChild(exp);
            scrollRoot.style.transition = '';
            scrollRoot.style.clipPath = '';
            if (origEl) origEl.style.opacity = '';
            expandedCard = null;
            expandedOrigEl = null;
            expandedOrigRect = null;
        };

        exp.addEventListener('transitionend', cleanup, { once: true });
        setTimeout(cleanup, 500);
    }

    function layoutSticky() {
        if (!scrollRoot) return;
        var heading = scrollRoot.querySelector('.pt-web-tool-heading');
        var bar = scrollRoot.querySelector('.pd-filter-bar');
        if (heading && bar) {
            bar.style.top = heading.offsetHeight + 'px';
        }
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function parseColorValue(value) {
        var text = String(value || '').trim();
        var match = text.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/i);
        if (!match) return { r: 20, g: 38, b: 58, a: .46 };
        return {
            r: Number(match[1]),
            g: Number(match[2]),
            b: Number(match[3]),
            a: match[4] === undefined ? 1 : Number(match[4])
        };
    }

    function rgba(color, alpha) {
        return 'rgba(' + Math.round(color.r) + ',' + Math.round(color.g) + ',' + Math.round(color.b) + ',' + clamp(alpha, 0, 1).toFixed(3) + ')';
    }

    function ensureSideWallLayer() {
        if (!scrollRoot || typeof document === 'undefined') return null;
        var grid = scrollRoot.querySelector('.pd-grid');
        if (!grid) return null;
        var canvas = grid.querySelector('[data-pd-cube-wall-layer]');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.className = 'pd-cube-wall-layer';
            canvas.setAttribute('data-pd-cube-wall-layer', '');
            grid.insertBefore(canvas, grid.firstChild);
        }
        var scale = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;
        var width = Math.max(1, Math.round(grid.clientWidth * scale));
        var height = Math.max(1, Math.round(grid.clientHeight * scale));
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
        }
        canvas.style.width = grid.clientWidth + 'px';
        canvas.style.height = grid.clientHeight + 'px';
        var ctx = canvas.getContext('2d');
        if (ctx) ctx.setTransform(scale, 0, 0, scale, 0, 0);
        return canvas;
    }

    function clearSideWallLayer() {
        var canvas = ensureSideWallLayer();
        if (!canvas) return;
        var grid = canvas.parentNode;
        var ctx = canvas.getContext('2d');
        if (ctx && grid) ctx.clearRect(0, 0, grid.clientWidth, grid.clientHeight);
        activeSideWallCard = null;
    }

    function readCubeMaterialForCard(card) {
        var style = (typeof window !== 'undefined' && card) ? window.getComputedStyle(card) : null;
        var base = style ? style.getPropertyValue('--pd-cube-bg') : '';
        var border = style ? style.getPropertyValue('--pd-cube-border') : '';
        var glow = style ? style.getPropertyValue('--pd-cube-glow') : '';
        var materialId = style ? String(style.getPropertyValue('--pd-cube-material-id') || '').trim() : '';
        var color = parseColorValue(base || (style ? style.backgroundColor : ''));
        var transparentSideAlpha = clamp(color.a * .34 + .05, .14, .38);
        var profile = getPaldexSideWallMaterialProfile(materialId, color);
        return {
            color: color,
            border: parseColorValue(border),
            glow: parseColorValue(glow),
            materialId: materialId,
            profile: profile,
            faceAlpha: clamp(color.a, .42, .96),
            sideAlpha: transparentSideAlpha * profile.alphaScale,
            transparentSideAlpha: transparentSideAlpha * profile.alphaScale
        };
    }

    function getPaldexSideWallMaterialProfile(materialId, color) {
        var id = String(materialId || '').replace(/^['"]|['"]$/g, '');
        var baseAlpha = color && isFinite(color.a) ? color.a : .46;
        if (id === 'smokedGlass') {
            return {
                kind: 'smokedGlass',
                alphaScale: 1.58,
                hazeAlpha: clamp(baseAlpha * .3, .16, .34),
                edgeAlpha: .34,
                innerShade: .26,
                sliceAlpha: .58,
                blurRadius: 8,
                faceAlpha: clamp(baseAlpha * .68, .28, .52),
                textureAlpha: .04
            };
        }
        if (id === 'gradient' || id === 'frosted' || id === 'iceMistGlass' || id === 'smallTranslucent') {
            return {
                kind: 'glass',
                alphaScale: 1.42,
                hazeAlpha: clamp(baseAlpha * .25, .12, .28),
                edgeAlpha: .3,
                innerShade: .16,
                sliceAlpha: .42,
                blurRadius: 7,
                faceAlpha: clamp(baseAlpha * .58, .22, .42),
                textureAlpha: .03
            };
        }
        if (id === 'brushedMetal' || id === 'mirrorMetal' || id === 'matteMetal' || id === 'oxidizedMetal' || id === 'metalGlass') {
            return {
                kind: 'metal',
                alphaScale: 1.24,
                hazeAlpha: clamp(baseAlpha * .22, .14, .3),
                edgeAlpha: .34,
                innerShade: .34,
                sliceAlpha: .32,
                blurRadius: 7,
                faceAlpha: clamp(baseAlpha * .9, .44, .72),
                textureAlpha: id === 'mirrorMetal' ? .1 : .16
            };
        }
        if (id === 'oakWood' || id === 'walnutWood' || id === 'mahoganyWood' || id === 'ebonyWood') {
            return {
                kind: 'wood',
                alphaScale: 1.18,
                hazeAlpha: clamp(baseAlpha * .2, .12, .28),
                edgeAlpha: .28,
                innerShade: .3,
                sliceAlpha: .3,
                blurRadius: 7,
                faceAlpha: clamp(baseAlpha * .86, .42, .68),
                textureAlpha: .16
            };
        }
        return {
            kind: 'default',
            alphaScale: 1,
            hazeAlpha: clamp(baseAlpha * .14, .06, .2),
            edgeAlpha: .22,
            innerShade: .18,
            sliceAlpha: .44,
            blurRadius: 7,
            faceAlpha: clamp(baseAlpha * .78, .34, .62),
            textureAlpha: .08
        };
    }

    function mixColor(color, target, amount) {
        var next = target || { r: 255, g: 255, b: 255 };
        var t = clamp(amount, 0, 1);
        return {
            r: color.r + (next.r - color.r) * t,
            g: color.g + (next.g - color.g) * t,
            b: color.b + (next.b - color.b) * t,
            a: color.a
        };
    }

    function drawPaldexRoundedRect(ctx, x, y, w, h, r) {
        var rr = Math.min(r, w / 2, h / 2);
        ctx.moveTo(x + rr, y);
        ctx.lineTo(x + w - rr, y);
        ctx.arcTo(x + w, y, x + w, y + rr, rr);
        ctx.lineTo(x + w, y + h - rr);
        ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
        ctx.lineTo(x + rr, y + h);
        ctx.arcTo(x, y + h, x, y + h - rr, rr);
        ctx.lineTo(x, y + rr);
        ctx.arcTo(x, y, x + rr, y, rr);
        ctx.closePath();
    }

    function drawPaldexHollowRoundedRect(ctx, rect, thickness, fill) {
        ctx.save();
        ctx.fillStyle = fill;
        ctx.beginPath();
        drawPaldexRoundedRect(ctx, rect.x, rect.y, rect.w, rect.h, rect.r);
        drawPaldexRoundedRect(
            ctx,
            rect.x + thickness,
            rect.y + thickness,
            Math.max(0, rect.w - thickness * 2),
            Math.max(0, rect.h - thickness * 2),
            Math.max(0, rect.r - thickness)
        );
        ctx.fill('evenodd');
        ctx.restore();
    }

    function drawPaldexFilledRoundedRect(ctx, rect, fill) {
        ctx.save();
        ctx.fillStyle = fill;
        ctx.beginPath();
        drawPaldexRoundedRect(ctx, rect.x, rect.y, rect.w, rect.h, rect.r);
        ctx.fill();
        ctx.restore();
    }

    function getCardBackRect(card) {
        var grid = scrollRoot ? scrollRoot.querySelector('.pd-grid') : null;
        if (!grid || !card) return null;
        var cell = card.closest('.pd-cell') || card;
        var gridRect = grid.getBoundingClientRect();
        var rect = cell.getBoundingClientRect();
        var cardStyle = (typeof window !== 'undefined') ? window.getComputedStyle(card) : null;
        var radius = cardStyle ? parseFloat(cardStyle.borderRadius) || 7 : 7;
        return {
            x: rect.left - gridRect.left,
            y: rect.top - gridRect.top,
            w: rect.width,
            h: rect.height,
            r: radius
        };
    }

    function getCardPullDirection(card) {
        if (!card || typeof window === 'undefined') return { x: -1, y: -1 };
        var rect = card.getBoundingClientRect();
        var viewWidth = window.innerWidth || (document.documentElement ? document.documentElement.clientWidth : rect.width);
        var center = rect.left + rect.width / 2;
        var screenCenter = viewWidth / 2;
        var halfTrack = Math.max(1, (viewWidth - rect.width) / 2);
        var ratio = clamp((center - screenCenter) / halfTrack, -1, 1);
        return { x: ratio * .9, y: -1 };
    }

    function getCardPullVector(card, depth, direction) {
        var dir = direction || getCardPullDirection(card);
        return { x: depth * dir.x, y: depth * dir.y };
    }

    function setCardPullVars(card, depth, direction) {
        if (!card) return;
        var pull = getCardPullVector(card, depth, direction);
        var shadowDepth = Math.abs(depth);
        card.style.setProperty('--pd-pull-depth', depth + 'px');
        card.style.setProperty('--pd-pull-shadow-depth', shadowDepth + 'px');
        card.style.setProperty('--pd-pull-x', pull.x.toFixed(2) + 'px');
        card.style.setProperty('--pd-pull-y', pull.y.toFixed(2) + 'px');
    }

    function clearCardPullVars(card) {
        if (!card) return;
        card.style.removeProperty('--pd-pull-depth');
        card.style.removeProperty('--pd-pull-shadow-depth');
        card.style.removeProperty('--pd-pull-x');
        card.style.removeProperty('--pd-pull-y');
    }

    function getDragDepthDelta(deltaX, deltaY, direction) {
        var dir = direction || { x: -1, y: -1 };
        var strength = Math.max(.0001, dir.x * dir.x + dir.y * dir.y);
        return (deltaX * dir.x + deltaY * dir.y) / strength;
    }

    function drawPaldexSideWallSurface(ctx, back, front, material) {
        var dx = back.x - front.x;
        var dy = back.y - front.y;
        var depth = Math.max(Math.abs(dx), Math.abs(dy));
        if (depth <= 0) return;
        var steps = Math.max(10, Math.min(42, Math.ceil(depth / 2.4)));
        var thickness = Math.max(4, Math.min(9, depth / steps + 4.8));
        for (var i = steps; i >= 1; i--) {
            var t = i / steps;
            var light = 1 - t;
            var rect = {
                x: front.x + dx * t,
                y: front.y + dy * t,
                w: front.w,
                h: front.h,
                r: front.r
            };
            drawPaldexHollowRoundedRect(ctx, rect, thickness, rgba(material.color, material.transparentSideAlpha * (.32 + light * .18)));
        }
    }

    function drawPaldexStackedSideWall(ctx, back, front, material) {
        var dx = back.x - front.x;
        var dy = back.y - front.y;
        var depth = Math.max(Math.abs(dx), Math.abs(dy));
        if (depth <= 0) return;
        var sliceCount = Math.max(1, Math.min(120, Math.ceil(depth / .9)));
        var thickness = Math.max(1.2, Math.min(2.8, depth / sliceCount + 1.6));
        for (var i = sliceCount; i >= 1; i--) {
            var t = i / sliceCount;
            var light = 1 - t;
            var rect = {
                x: front.x + dx * t,
                y: front.y + dy * t,
                w: front.w,
                h: front.h,
                r: front.r
            };
            var sideAlpha = material.transparentSideAlpha * (.38 + light * .32);
            drawPaldexHollowRoundedRect(ctx, rect, thickness, rgba(material.color, sideAlpha));
        }
    }

    function drawPaldexSideWallSoftEdge(ctx, back, front, material) {
        var profile = material.profile || getPaldexSideWallMaterialProfile(material.materialId, material.color);
        var dx = back.x - front.x;
        var dy = back.y - front.y;
        var depth = Math.max(Math.abs(dx), Math.abs(dy));
        if (depth <= 0) return;
        var edgeAlpha = (profile.edgeAlpha || .22) * .42;
        var bands = 4;
        for (var i = 0; i < bands; i++) {
            var t = .16 + i * .16;
            var rect = {
                x: front.x + dx * t,
                y: front.y + dy * t,
                w: front.w,
                h: front.h,
                r: front.r
            };
            drawPaldexHollowRoundedRect(ctx, rect, 1.1 + i * .9, rgba(material.glow, edgeAlpha * (1 - i / bands)));
        }
    }

    function createPaldexSideWallBuffer(ctx) {
        if (!ctx || !ctx.canvas || typeof document === 'undefined') return null;
        var source = ctx.canvas;
        var width = Math.max(1, Math.ceil(source.clientWidth || source.width || 1));
        var height = Math.max(1, Math.ceil(source.clientHeight || source.height || 1));
        var buffer = document.createElement('canvas');
        buffer.width = width;
        buffer.height = height;
        return {
            canvas: buffer,
            ctx: buffer.getContext('2d'),
            width: width,
            height: height
        };
    }

    function getPaldexSideWallBounds(back, front) {
        var minX = Math.min(back.x, front.x);
        var minY = Math.min(back.y, front.y);
        var maxX = Math.max(back.x + back.w, front.x + front.w);
        var maxY = Math.max(back.y + back.h, front.y + front.h);
        return {
            x: minX - 10,
            y: minY - 10,
            w: maxX - minX + 20,
            h: maxY - minY + 20
        };
    }

    function fillPaldexSideWallSweepMask(ctx, back, front) {
        var dx = back.x - front.x;
        var dy = back.y - front.y;
        var depth = Math.max(Math.abs(dx), Math.abs(dy));
        if (depth <= 0) return;
        var steps = Math.max(18, Math.min(72, Math.ceil(depth / 1.5)));
        ctx.save();
        ctx.fillStyle = '#fff';
        ctx.globalCompositeOperation = 'source-over';
        for (var i = steps; i >= 0; i--) {
            var t = i / steps;
            drawPaldexFilledRoundedRect(ctx, {
                x: front.x + dx * t,
                y: front.y + dy * t,
                w: front.w,
                h: front.h,
                r: front.r
            }, '#fff');
        }
        ctx.globalCompositeOperation = 'destination-out';
        drawPaldexFilledRoundedRect(ctx, front, '#fff');
        ctx.restore();
    }

    function drawPaldexSideWallMaterialTexture(ctx, bounds, back, front, material) {
        var profile = material.profile || getPaldexSideWallMaterialProfile(material.materialId, material.color);
        var alpha = profile.textureAlpha || 0;
        if (alpha <= 0) return;
        var kind = profile.kind || 'default';
        ctx.save();
        if (kind === 'metal') {
            var metalLight = mixColor(material.color, { r: 255, g: 255, b: 255 }, .42);
            var metalDark = mixColor(material.color, { r: 0, g: 0, b: 0 }, .38);
            ctx.lineWidth = 1;
            for (var mx = bounds.x - bounds.h; mx < bounds.x + bounds.w + bounds.h; mx += 9) {
                ctx.beginPath();
                ctx.strokeStyle = rgba(metalLight, alpha * .78);
                ctx.moveTo(mx, bounds.y + bounds.h);
                ctx.lineTo(mx + bounds.h, bounds.y);
                ctx.stroke();
                ctx.beginPath();
                ctx.strokeStyle = rgba(metalDark, alpha * .52);
                ctx.moveTo(mx + 3, bounds.y + bounds.h);
                ctx.lineTo(mx + bounds.h + 3, bounds.y);
                ctx.stroke();
            }
        } else if (kind === 'wood') {
            var woodLight = mixColor(material.color, { r: 255, g: 218, b: 150 }, .28);
            var woodDark = mixColor(material.color, { r: 55, g: 26, b: 12 }, .38);
            ctx.lineWidth = 1.2;
            for (var wy = bounds.y - 12; wy < bounds.y + bounds.h + 18; wy += 13) {
                ctx.beginPath();
                ctx.strokeStyle = rgba(woodLight, alpha * .56);
                ctx.moveTo(bounds.x - 8, wy);
                ctx.bezierCurveTo(bounds.x + bounds.w * .28, wy - 10, bounds.x + bounds.w * .58, wy + 14, bounds.x + bounds.w + 12, wy + 3);
                ctx.stroke();
                ctx.beginPath();
                ctx.strokeStyle = rgba(woodDark, alpha * .44);
                ctx.moveTo(bounds.x - 10, wy + 5);
                ctx.bezierCurveTo(bounds.x + bounds.w * .33, wy + 12, bounds.x + bounds.w * .7, wy - 8, bounds.x + bounds.w + 14, wy + 8);
                ctx.stroke();
            }
        } else if (kind === 'glass' || kind === 'smokedGlass') {
            var glassLight = mixColor(material.color, { r: 255, g: 255, b: 255 }, .52);
            var shine = ctx.createLinearGradient(front.x, front.y, back.x + back.w, back.y + back.h);
            shine.addColorStop(0, rgba(glassLight, alpha * .9));
            shine.addColorStop(.42, rgba(glassLight, alpha * .16));
            shine.addColorStop(1, rgba(material.color, 0));
            ctx.fillStyle = shine;
            ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
        } else {
            var mist = ctx.createRadialGradient(bounds.x + bounds.w * .32, bounds.y + bounds.h * .2, 0, bounds.x + bounds.w * .5, bounds.y + bounds.h * .52, Math.max(bounds.w, bounds.h));
            mist.addColorStop(0, rgba(mixColor(material.color, { r: 255, g: 255, b: 255 }, .28), alpha * .62));
            mist.addColorStop(1, rgba(mixColor(material.color, { r: 0, g: 0, b: 0 }, .24), alpha * .36));
            ctx.fillStyle = mist;
            ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
        }
        ctx.restore();
    }

    function drawPaldexMaterialSideWallFace(ctx, back, front, material) {
        var profile = material.profile || getPaldexSideWallMaterialProfile(material.materialId, material.color);
        var surface = createPaldexSideWallBuffer(ctx);
        var mask = createPaldexSideWallBuffer(ctx);
        if (!surface || !surface.ctx || !mask || !mask.ctx) {
            drawPaldexSideWallSurface(ctx, back, front, material);
            return;
        }
        var bounds = getPaldexSideWallBounds(back, front);
        var lightColor = mixColor(material.color, { r: 255, g: 255, b: 255 }, profile.kind === 'metal' ? .32 : .2);
        var darkColor = mixColor(material.color, { r: 0, g: 0, b: 0 }, profile.innerShade || .24);
        var faceAlpha = profile.faceAlpha || material.transparentSideAlpha;
        var gradient = surface.ctx.createLinearGradient(front.x, front.y, back.x + back.w, back.y + back.h);
        gradient.addColorStop(0, rgba(lightColor, faceAlpha * .82));
        gradient.addColorStop(.52, rgba(material.color, faceAlpha));
        gradient.addColorStop(1, rgba(darkColor, faceAlpha * .96));
        surface.ctx.fillStyle = gradient;
        surface.ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
        drawPaldexSideWallMaterialTexture(surface.ctx, bounds, back, front, material);

        fillPaldexSideWallSweepMask(mask.ctx, back, front);
        surface.ctx.save();
        surface.ctx.globalCompositeOperation = 'destination-in';
        surface.ctx.drawImage(mask.canvas, 0, 0, mask.width, mask.height);
        surface.ctx.restore();

        ctx.save();
        ctx.drawImage(surface.canvas, 0, 0, surface.width, surface.height);
        ctx.restore();
    }

    function drawPaldexBlurredGlassSideWall(ctx, back, front, material, drawSlices) {
        var profile = material.profile || getPaldexSideWallMaterialProfile(material.materialId, material.color);
        var buffer = createPaldexSideWallBuffer(ctx);
        if (!buffer || !buffer.ctx) {
            drawSlices(ctx, back, front, material);
            return;
        }
        drawSlices(buffer.ctx, back, front, material);
        drawPaldexSideWallSoftEdge(buffer.ctx, back, front, material);
        ctx.save();
        ctx.globalAlpha = .98;
        ctx.filter = 'blur(' + (profile.blurRadius || 4) + 'px)';
        ctx.drawImage(buffer.canvas, 0, 0, buffer.width, buffer.height);
        ctx.restore();
    }

    function drawPaldexGlassSideWall(ctx, back, front, material) {
        var profile = material.profile || getPaldexSideWallMaterialProfile(material.materialId, material.color);
        drawPaldexBlurredGlassSideWall(ctx, back, front, material, function(targetCtx, targetBack, targetFront, targetMaterial) {
            drawPaldexGlassSideWallSlices(targetCtx, targetBack, targetFront, targetMaterial, profile);
        });
    }

    function drawPaldexGlassSideWallSlices(ctx, back, front, material, profile) {
        profile = profile || material.profile || getPaldexSideWallMaterialProfile(material.materialId, material.color);
        var dx = back.x - front.x;
        var dy = back.y - front.y;
        var depth = Math.max(Math.abs(dx), Math.abs(dy));
        if (depth <= 0) return;
        var steps = Math.max(8, Math.min(30, Math.ceil(depth / 3.4)));
        var thickness = Math.max(3.2, Math.min(7.2, depth / steps + 3.4));
        for (var i = steps; i >= 1; i--) {
            var t = i / steps;
            var light = 1 - t;
            var rect = {
                x: front.x + dx * t,
                y: front.y + dy * t,
                w: front.w,
                h: front.h,
                r: front.r
            };
            drawPaldexHollowRoundedRect(ctx, rect, thickness, rgba(material.color, material.transparentSideAlpha * (.18 + light * .16)));
        }
        var hazeRect = {
            x: front.x + dx * .55,
            y: front.y + dy * .55,
            w: front.w,
            h: front.h,
            r: front.r
        };
        drawPaldexHollowRoundedRect(ctx, hazeRect, Math.max(6, thickness * 1.4), rgba(material.color, profile.hazeAlpha));
    }

    function drawPaldexSmokedGlassSideWall(ctx, back, front, material) {
        var profile = material.profile || getPaldexSideWallMaterialProfile(material.materialId, material.color);
        drawPaldexBlurredGlassSideWall(ctx, back, front, material, function(targetCtx, targetBack, targetFront, targetMaterial) {
            drawPaldexSmokedGlassSideWallSlices(targetCtx, targetBack, targetFront, targetMaterial, profile);
        });
    }

    function drawPaldexSmokedGlassSideWallSlices(ctx, back, front, material, profile) {
        profile = profile || material.profile || getPaldexSideWallMaterialProfile(material.materialId, material.color);
        var dx = back.x - front.x;
        var dy = back.y - front.y;
        var depth = Math.max(Math.abs(dx), Math.abs(dy));
        if (depth <= 0) return;
        var steps = Math.max(10, Math.min(38, Math.ceil(depth / 2.8)));
        var thickness = Math.max(4.2, Math.min(8.6, depth / steps + 4.4));
        for (var i = steps; i >= 1; i--) {
            var t = i / steps;
            var light = 1 - t;
            var rect = {
                x: front.x + dx * t,
                y: front.y + dy * t,
                w: front.w,
                h: front.h,
                r: front.r
            };
            drawPaldexHollowRoundedRect(ctx, rect, thickness, rgba(material.color, material.transparentSideAlpha * (.28 + light * .2)));
        }
        var shadeRect = {
            x: front.x + dx * .72,
            y: front.y + dy * .72,
            w: front.w,
            h: front.h,
            r: front.r
        };
        drawPaldexHollowRoundedRect(ctx, shadeRect, Math.max(8, thickness * 1.8), rgba(material.color, profile.hazeAlpha));
    }

    function drawPaldexUnifiedSideWallSlices(ctx, back, front, material, profile) {
        profile = profile || material.profile || getPaldexSideWallMaterialProfile(material.materialId, material.color);
        var dx = back.x - front.x;
        var dy = back.y - front.y;
        var depth = Math.max(Math.abs(dx), Math.abs(dy));
        if (depth <= 0) return;
        var steps = Math.max(8, Math.min(28, Math.ceil(depth / 3.8)));
        var thickness = Math.max(3.2, Math.min(7.4, depth / steps + 3.2));
        for (var i = steps; i >= 1; i--) {
            var t = i / steps;
            var light = 1 - t;
            var rect = {
                x: front.x + dx * t,
                y: front.y + dy * t,
                w: front.w,
                h: front.h,
                r: front.r
            };
            var sliceAlpha = material.transparentSideAlpha * ((profile.sliceAlpha || .32) * .42 + light * .1);
            drawPaldexHollowRoundedRect(ctx, rect, thickness, rgba(material.color, sliceAlpha));
        }
        var bodyRect = {
            x: front.x + dx * .62,
            y: front.y + dy * .62,
            w: front.w,
            h: front.h,
            r: front.r
        };
        drawPaldexHollowRoundedRect(ctx, bodyRect, Math.max(6, thickness * 1.5), rgba(material.color, profile.hazeAlpha));
    }

    function renderSideWallForCard(card, depth, direction) {
        var canvas = ensureSideWallLayer();
        if (!canvas || !card) return;
        var grid = canvas.parentNode;
        var ctx = canvas.getContext('2d');
        var back = getCardBackRect(card);
        if (!ctx || !grid || !back) return;
        var pull = getCardPullVector(card, depth, direction);
        var front = {
            x: back.x + pull.x,
            y: back.y + pull.y,
            w: back.w,
            h: back.h,
            r: back.r
        };
        var material = readCubeMaterialForCard(card);
        ctx.clearRect(0, 0, grid.clientWidth, grid.clientHeight);
        drawPaldexMaterialSideWallFace(ctx, back, front, material);
        if (material.profile && material.profile.kind === 'glass') {
            drawPaldexGlassSideWall(ctx, back, front, material);
        } else if (material.profile && material.profile.kind === 'smokedGlass') {
            drawPaldexSmokedGlassSideWall(ctx, back, front, material);
        } else {
            drawPaldexBlurredGlassSideWall(ctx, back, front, material, function(targetCtx, targetBack, targetFront, targetMaterial) {
                drawPaldexUnifiedSideWallSlices(targetCtx, targetBack, targetFront, targetMaterial, material.profile);
            });
        }
        activeSideWallCard = card;
    }

    function updatePulledCard(event) {
        if (!pressedCard || !event) return;
        var dx = event.clientX - pressedStartX;
        var dy = event.clientY - pressedStartY;
        var projected = getDragDepthDelta(dx, dy, pressedPullDirection);
        var depth = Math.max(-22, Math.min(96, projected + 22));
        if (Math.abs(dx) + Math.abs(dy) > 3) pressedHasDragged = true;
        pressedPullDepth = depth;
        pressedCard.classList.remove('pd-card--pressed');
        setCardPullVars(pressedCard, depth, pressedPullDirection);
        if (depth > 0) {
            pressedCard.classList.remove('pd-card--sinking');
            pressedCard.classList.add('pd-card--dragging');
            renderSideWallForCard(pressedCard, depth, pressedPullDirection);
        } else {
            pressedCard.classList.remove('pd-card--dragging');
            pressedCard.classList.add('pd-card--sinking');
            clearSideWallLayer();
        }
    }

    function clearHoveredCards(exceptCard) {
        if (!scrollRoot) return;
        Array.prototype.forEach.call(scrollRoot.querySelectorAll('.pd-card--hovered'), function(card) {
            if (card === exceptCard) return;
            card.classList.remove('pd-card--hovered');
            card.classList.remove('pd-card--dip');
            clearCardPullVars(card);
        });
    }

    function rerender() {
        if (!scrollRoot) return;
        var active = typeof document !== 'undefined' ? document.activeElement : null;
        var restoreSearch = !!(active && active.closest && active.closest('[data-pd-search]'));
        var selectionStart = restoreSearch && active.selectionStart !== undefined ? active.selectionStart : null;
        var selectionEnd = restoreSearch && active.selectionEnd !== undefined ? active.selectionEnd : null;
        clearSideWallLayer();
        scrollRoot.innerHTML = render();
        applyAppearanceVars(scrollRoot);
        layoutSticky();
        if (restoreSearch) {
            var nextSearch = scrollRoot.querySelector('[data-pd-search]');
            if (nextSearch && typeof nextSearch.focus === 'function') {
                nextSearch.focus();
                if (selectionStart !== null && typeof nextSearch.setSelectionRange === 'function') {
                    nextSearch.setSelectionRange(selectionStart, selectionEnd);
                }
            }
        }
        requestAnimationFrame(applyFrameMask);
    }

    function bind(root) {
        if (!root) return;
        var hasBoundEvents = root.dataset.pdBd === '1';
        root.dataset.pdBd = '1';

        scrollRoot = root.querySelector('.pt-web-tool-scroll') || root;
        applyAppearanceVars(scrollRoot);
        ensureData(root);

        var common = getCommon();
        if (common) {
            common.onStateChange(rerender);
        }

        if (!hasBoundEvents) root.addEventListener('mouseover', function(e) {
            if (pressedCard) return;
            var card = e.target.closest('[data-pd-id]');
            if (!card || card.classList.contains('pd-card--hovered')) return;

            var prev = scrollRoot.querySelector('.pd-card--hovered');
            if (prev && prev !== card) {
                prev.classList.remove('pd-card--hovered');
                prev.classList.add('pd-card--dip');
            }

            var direction = getCardPullDirection(card);
            setCardPullVars(card, 22, direction);
            card.classList.add('pd-card--hovered');
            renderSideWallForCard(card, 22, direction);
        });

        if (!hasBoundEvents) root.addEventListener('mouseout', function(e) {
            var card = e.target.closest('[data-pd-id]');
            if (!card) return;
            if (pressedCard) return;
            if (pressedCard === card) return;
            var related = e.relatedTarget;
            if (related && card.contains(related)) return;

            card.classList.remove('pd-card--hovered');
            card.classList.add('pd-card--dip');
            clearSideWallLayer();
        });

        if (!hasBoundEvents) root.addEventListener('animationend', function(e) {
            if (e.target.classList.contains('pd-card--dip')) {
                e.target.classList.remove('pd-card--dip');
                clearCardPullVars(e.target);
            }
        });

        if (!hasBoundEvents) root.addEventListener('mousedown', function(e) {
            var card = e.target.closest('[data-pd-id]');
            if (!card) return;
            pressedCard = card;
            pressedStartX = e.clientX;
            pressedStartY = e.clientY;
            pressedPullDirection = getCardPullDirection(card);
            pressedPullDepth = 0;
            pressedHasDragged = false;
            clearHoveredCards(card);
            setCardPullVars(card, 22, pressedPullDirection);
            card.classList.add('pd-card--pressed');
            renderSideWallForCard(card, 22, pressedPullDirection);
        });

        if (!hasBoundEvents) root.addEventListener('mousemove', function(e) {
            updatePulledCard(e);
        });

        if (!hasBoundEvents) root.addEventListener('mouseup', function(e) {
            if (!pressedCard) return;
            var card = pressedCard;
            pressedCard = null;
            card.classList.remove('pd-card--pressed');
            card.classList.remove('pd-card--dragging');
            card.classList.remove('pd-card--sinking');
            clearSideWallLayer();
            if (pressedHasDragged) {
                pressedPullDepth = 0;
                pressedHasDragged = false;
                card.classList.add('pd-card--dip');
                return;
            }
            if (pressedPullDepth >= 18) {
                pressedPullDepth = 0;
                card.classList.add('pd-card--dip');
                return;
            }
            pressedPullDepth = 0;
            card.classList.add('pd-card--spring');
            var id = card.getAttribute('data-pd-id');
            setTimeout(function() {
                expandCard(card, id);
            }, 80);
        });

        if (!hasBoundEvents) root.addEventListener('click', function(e) {
            if (e.target.closest('[data-pd-id]')) return;
            var common = getCommon();
            if (!common) return;

            var el = e.target.closest('[data-pd-el]');
            if (el) { common.setFilter('element', el.getAttribute('data-pd-el')); return; }

            var wk = e.target.closest('[data-pd-work]');
            if (wk) { common.setFilter('work', wk.getAttribute('data-pd-work')); return; }

            var mainCategory = e.target.closest('[data-pd-main-category]');
            if (mainCategory) { common.setFilter('mainCategory', mainCategory.getAttribute('data-pd-main-category')); return; }

            var subCategory = e.target.closest('[data-pd-sub-category]');
            if (subCategory) { common.setFilter('subCategory', subCategory.getAttribute('data-pd-sub-category')); return; }

            var showUnreleased = e.target.closest('[data-pd-show-unreleased]');
            if (showUnreleased) { common.setFilter('showUnreleased', showUnreleased.checked); return; }

            var newOnly = e.target.closest('[data-pd-new-only]');
            if (newOnly) { common.setFilter('newOnly', newOnly.checked); return; }

            var field = e.target.closest('[data-pd-field]');
            if (field) { common.setFilter('displayField', field.getAttribute('data-pd-field')); return; }

            var sort = e.target.closest('[data-pd-sort]');
            if (sort) { common.setFilter('sort', sort.getAttribute('data-pd-sort')); return; }

            var back = e.target.closest('[data-pd-back]');
            if (back) { common.setFilter('back', null); return; }
        });

        if (!hasBoundEvents) root.addEventListener('input', function(e) {
            var inp = e.target.closest('[data-pd-search]');
            if (!inp) return;
            if (searchIsComposing || e.isComposing) return;
            var common = getCommon();
            if (common) common.setFilter('search', inp.value);
        });

        if (!hasBoundEvents) root.addEventListener('compositionstart', function(e) {
            if (!e.target.closest('[data-pd-search]')) return;
            searchIsComposing = true;
        });

        if (!hasBoundEvents) root.addEventListener('compositionend', function(e) {
            var inp = e.target.closest('[data-pd-search]');
            if (!inp) return;
            searchIsComposing = false;
            var common = getCommon();
            if (common) common.setFilter('search', inp.value);
        });

        layoutSticky();
        requestAnimationFrame(applyFrameMask);
        resizeHandler = function() {
            layoutSticky();
            applyFrameMask();
            clearSideWallLayer();
            if (activeSideWallCard) renderSideWallForCard(activeSideWallCard, pressedPullDepth || 10);
        };
        window.addEventListener('resize', resizeHandler);
    }

    function destroy() {
        var common = getCommon();
        if (common) common.destroy();
        if (pressedCard) {
            pressedCard.classList.remove('pd-card--pressed');
            pressedCard.classList.remove('pd-card--dragging');
            pressedCard.classList.remove('pd-card--sinking');
            clearCardPullVars(pressedCard);
            pressedCard = null;
        }
        if (expandedCard) {
            if (expandedCard.parentNode) expandedCard.parentNode.removeChild(expandedCard);
            expandedCard = null;
        }
        if (expandedOrigEl) {
            expandedOrigEl.style.opacity = '';
            expandedOrigEl = null;
        }
        if (scrollRoot) {
            clearSideWallLayer();
            scrollRoot.style.transition = '';
            scrollRoot.style.clipPath = '';
            scrollRoot.style.visibility = '';
        }
        if (resizeHandler) {
            window.removeEventListener('resize', resizeHandler);
            resizeHandler = null;
        }
        expandedOrigRect = null;
        scrollRoot = null;
    }

    return { render: render, bind: bind, destroy: destroy, showHabitatMap: showHabitatMap };
})();

if (typeof window !== 'undefined') window.PT_PALDEX_WEB = PT_PALDEX_WEB;
