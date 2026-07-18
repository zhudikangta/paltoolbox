var PT_BREEDING_WEB = (function() {
    var searchComposing = false;
    var PAL_DATA_URL = '../游戏内容/幻兽帕鲁1.0/数据包/帕鲁.json';
    var BREEDING_DATA_URL = '../游戏内容/幻兽帕鲁1.0/数据包/配种.json';
    var palDataLoaded = false;
    var breedingDataLoaded = false;
    var loadError = '';

    var state = {
        mode: 'child',
        parentA: null,
        parentB: null,
        child: null,
        parentASearch: '',
        parentBSearch: '',
        childSearch: '',
        parentADropdown: [],
        parentBDropdown: [],
        childDropdown: []
    };

    function getCore() {
        return (typeof window !== 'undefined' && window.PT_BREEDING_CORE) ? window.PT_BREEDING_CORE : null;
    }

    function loadAllData() {
        if (palDataLoaded && breedingDataLoaded) return true;
        var core = getCore();
        if (!core) { loadError = '配种核心模块未加载'; return false; }
        var loader = (typeof window !== 'undefined' && window.PT_DATA_LOADER) ? window.PT_DATA_LOADER : null;
        if (!loader) { loadError = '数据加载器不可用'; return false; }

        function tryLoad() {
            if (palDataLoaded && breedingDataLoaded) {
                rerender();
                return;
            }
        }

        if (!palDataLoaded) {
            loader.loadJson(PAL_DATA_URL).then(function(data) {
                core.setPalData(data);
                palDataLoaded = true;
                tryLoad();
            }).catch(function(err) {
                loadError = '帕鲁数据加载失败';
                rerender();
            });
        }

        if (!breedingDataLoaded) {
            loader.loadJson(BREEDING_DATA_URL).then(function(data) {
                core.setBreedingData(data);
                breedingDataLoaded = true;
                tryLoad();
            }).catch(function(err) {
                if (!loadError) loadError = '配种数据加载失败';
                rerender();
            });
        }

        return false;
    }

    function renderLoading() {
        var msg = loadError || '加载配种数据…';
        return '<div class="pt-web-tool-page pt-web-page--grid-fluid pt-web-breed-page">' +
            '<header class="pt-web-tool-heading"><div><span class="pt-web-tool-kicker">工具 / 配种</span><h1>配种查询</h1></div></header>' +
            '<section class="pt-web-section"><div class="br-data-state">' + msg + '</div></section></div>';
    }

    function renderPalBadge(pal, role, showPower, gender) {
        if (!pal) return '';
        var core = getCore();
        var iconHtml = core ? core.getPalIconHtml(pal.id || pal.species) : '';
        var name = pal.name || pal.id || '?';
        var displayId = pal.displayId || '';
        var power = (showPower !== false && pal.breedingPower != null) ? pal.breedingPower : '';
        var genderHtml = gender ? '<span class="br-badge-gender br-badge-gender--' + gender + '">' + gender + '</span>' : '';
        return '<div class="br-badge" data-br-role="' + (role || '') + '">' +
            iconHtml +
            '<div class="br-badge-body">' +
            '<div class="br-badge-name">' + name + genderHtml + '</div>' +
            (displayId ? '<div class="br-badge-id">#' + displayId + '</div>' : '') +
            (power !== '' ? '<div class="br-badge-power">繁殖力 ' + power + '</div>' : '') +
            '</div></div>';
    }

    function renderModeToggle() {
        var modes = [
            { id: 'child', label: '查子代' },
            { id: 'parents', label: '查父母' },
            { id: 'special', label: '特例列表' }
        ];
        return modes.map(function(m) {
            return '<button class="pt-filter-chip pt-filter-chip--sm' + (state.mode === m.id ? ' pt-filter-chip--active' : '') + '" data-br-mode="' + m.id + '"><span class="pt-filter-chip__label">' + m.label + '</span></button>';
        }).join('');
    }

    function renderPrinciple() {
        return '<div class="br-principle">' +
            '<div class="br-principle-title">配种公式</div>' +
            '<div class="br-principle-formula">[(亲本A的繁殖力 + 亲本B的繁殖力 + 1) ÷ 2] = 目标繁殖力</div>' +
            '<div class="br-principle-desc">游戏会在排除特殊固定子代后，找出繁殖力最接近这个数值的帕鲁作为子代。部分帕鲁有特殊配种规则（无视公式）。</div>' +
            '</div>';
    }

    function renderSelector(role) {
        var isChild = role === 'child';
        var searchQ = isChild ? state.childSearch : (role === 'parentA' ? state.parentASearch : state.parentBSearch);
        var dropdown = isChild ? state.childDropdown : (role === 'parentA' ? state.parentADropdown : state.parentBDropdown);
        var selected = isChild ? state.child : (role === 'parentA' ? state.parentA : state.parentB);
        var placeholder = isChild ? '搜索子代帕鲁…' : '搜索亲本帕鲁…';
        var label = isChild ? '子代' : (role === 'parentA' ? '父/母 A' : '父/母 B');

        var openClass = dropdown.length > 0 ? ' pt-custom-select--open' : '';
        return '<div class="br-selector' + openClass + '" data-br-role="' + role + '">' +
            '<label class="br-selector-label">' + label + '</label>' +
            '<div class="br-search-wrap">' +
            '<input type="text" class="pt-input br-search-input" data-br-input="' + role + '" placeholder="' + placeholder + '" value="' + searchQ + '" autocomplete="off">' +
            '<button class="br-dd-btn" data-br-dd-toggle="' + role + '" type="button">▼</button>' +
            '</div>' +
            (selected ? '<div class="br-selected">' + renderPalBadge(selected, role) +
                '<button class="br-clear-btn" data-br-clear="' + role + '">✕</button></div>' : '') +
            (dropdown.length > 0 ? '<div class="br-dd pt-custom-select__panel" data-br-dd="' + role + '">' +
                dropdown.map(function(pal) {
                    return '<div class="br-dd-item pt-custom-select__option" data-br-pal="' + (pal.id || pal.species) + '">' +
                        (pal.iconFile ? '<img src="../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/' + pal.iconFile + '" class="br-dd-icon" alt="">' : '') +
                        '<div class="br-dd-info">' +
                        (pal.displayId ? '<span class="br-dd-id">#' + pal.displayId + '</span>' : '') +
                        '<span class="br-dd-name">' + (pal.name || '') + '</span>' +
                        '</div>' +
                        '</div>';
                }).join('') + '</div>' : '') +
            '</div>';
    }

    function renderChildPreviewCard(parentA, parentB, result) {
        var core = getCore();
        var child = core.getPal(result.childId);
        var formulaHtml = '';
        var targetHtml = '';
        if (result.source === 'formula' && parentA.breedingPower != null && parentB.breedingPower != null && result.targetPower != null) {
            formulaHtml = '<div class="br-line-formula">\u516c\u5f0f\uff1a(' + parentA.breedingPower + ' + ' + parentB.breedingPower + ' + 1) / 2 = ' + result.targetPower + '</div>';
            targetHtml = '<div class="br-line-target">\u76ee\u6807\u7e41\u6b96\u529b\uff1a' + result.targetPower + '</div>';
        }
        return '<div class="br-line-card br-line-card--parents">' +
            '<div class="br-line-pal-group">' +
            renderPalBadge(parentA, '', false, result.parentAGender) +
            '<span class="br-line-op">+</span>' +
            renderPalBadge(parentB, '', false, result.parentBGender) +
            '<span class="br-line-op">=</span>' +
            renderPalBadge(child, '', false) +
            '<span class="br-line-source">' + (result.source === 'special' ? '\u7279\u6b8a\u914d\u79cd' : '\u516c\u5f0f\u914d\u79cd') + '</span>' +
            '</div>' + formulaHtml + targetHtml + '</div>';
    }

    function renderChildResult() {
        var core = getCore();
        if (!core) return '';
        var parentA = state.parentA;
        var parentB = state.parentB;
        if (!parentA && !parentB) {
            return '<div class="br-hint">请先选择两只亲本帕鲁</div>';
        }
        if (!parentA || !parentB) {
            var selectedParent = parentA || parentB;
            var previewRows = core.findChildrenByParent(selectedParent.id || selectedParent.species);
            if (!previewRows.length) return '<div class="br-hint">未找到配种结果</div>';
            return '<div class="br-count">已展示 ' + previewRows.length + ' 种另一方亲代组合</div>' +
                '<div class="br-line-list br-line-list--grid">' +
                previewRows.map(function(row) {
                    var otherParent = core.getPal(row.otherParentId);
                    var previewParentA = parentA || otherParent;
                    var previewParentB = parentB || otherParent;
                    return row.results.map(function(result) {
                        return renderChildPreviewCard(previewParentA, previewParentB, result);
                    }).join('');
                }).join('') + '</div>';
        }
        var results = core.findChildren(parentA.id || parentA.species, parentB.id || parentB.species);
        if (!results.length) {
            return '<div class="br-hint">未找到配种结果</div>';
        }
        var resultCards = results.map(function(result) {
            var child = core.getPal(result.childId);
            var sourceLabel = result.source === 'special' ? '特殊配种' : '公式配种';
            var targetPower = result.targetPower != null ? result.targetPower : '';
            var formulaHtml = '';
            var targetHtml = '';
            if (sourceLabel === '公式配种' && parentA.breedingPower != null && parentB.breedingPower != null && targetPower !== '') {
                formulaHtml = '<div class="br-line-formula">公式：(' + parentA.breedingPower + ' + ' + parentB.breedingPower + ' + 1) / 2 = ' + targetPower + '</div>';
                targetHtml = '<div class="br-line-target">目标繁殖力：' + targetPower + '</div>';
            } else if (targetPower !== '') {
                targetHtml = '<div class="br-line-target">目标繁殖力：' + targetPower + '</div>';
            }
            return '<div class="br-line-card br-line-card--solo">' +
                '<div class="br-line-pal-group">' +
                renderPalBadge(parentA, 'resultA', false, result.parentAGender) +
                '<span class="br-line-op">+</span>' +
                renderPalBadge(parentB, 'resultB', false, result.parentBGender) +
                '<span class="br-line-op">=</span>' +
                renderPalBadge(child, 'resultChild', false) +
                '</div>' +
                formulaHtml + targetHtml + '</div>';
        }).join('');
        return '<div class="br-result-card">' + resultCards + '</div>';
    }

    function renderParentsResult() {
        var core = getCore();
        if (!core) return '';
        var child = state.child;
        if (!child) {
            return '<div class="br-hint">请先选择子代帕鲁</div>';
        }
        var pairs = core.findParentPairs(child.id || child.species);
        if (!pairs.length) {
            return '<div class="br-hint">未找到亲本组合</div>';
        }

        var resultCount = pairs.length;
        var displayPairs = pairs;
        var showMore = false;
        if (pairs.length > 200) {
            displayPairs = pairs.slice(0, 200);
            showMore = true;
        }

        return '<div class="br-count">共 ' + resultCount + ' 种组合' + (showMore ? ' (仅显示前200种)' : '') + '</div>' +
            '<div class="br-line-list br-line-list--grid">' +
            displayPairs.map(function(p) {
                var palA = core.getPal(p.parentAId);
                var palB = core.getPal(p.parentBId);
                var sourceLabel = p.source === 'special' ? '特殊' : '公式';
                var formulaHtml = '';
                var targetHtml = '';
                if (p.source !== 'special' && palA.breedingPower != null && palB.breedingPower != null && p.targetPower != null) {
                    formulaHtml = '<div class="br-line-formula">公式：(' + palA.breedingPower + ' + ' + palB.breedingPower + ' + 1) / 2 = ' + p.targetPower + '</div>';
                    targetHtml = '<div class="br-line-target">目标繁殖力：' + p.targetPower + '</div>';
                }
                return '<div class="br-line-card br-line-card--parents">' +
                    '<div class="br-line-pal-group">' +
                    renderPalBadge(palA, '', false) +
                    '<span class="br-line-op">+</span>' +
                    renderPalBadge(palB, '', false) +
                    '<span class="br-line-op">=</span>' +
                    renderPalBadge(child, '', false) +
                    '<span class="br-line-source">' + sourceLabel + '</span>' +
                    '</div>' +
                    formulaHtml + targetHtml +
                    '</div>';
            }).join('') + '</div>';
    }

    function renderSpecialList() {
        var core = getCore();
        if (!core) return '';
        var rows = core.getBreedingRows().slice();
        if (!rows.length) {
            return '<div class="br-hint">暂无特殊配种数据</div>';
        }
        rows.sort(function(a, b) {
            var pa = core.getPal(a.childId);
            var pb = core.getPal(b.childId);
            var ra = String(pa && pa.displayId || '').trim();
            var rb = String(pb && pb.displayId || '').trim();
            var ma = ra.match(/^(\d+)(.*)$/);
            var mb = rb.match(/^(\d+)(.*)$/);
            var na = ma ? Number(ma[1]) : 99999;
            var nb = mb ? Number(mb[1]) : 99999;
            if (na !== nb) return na - nb;
            var sa = ma ? ma[2] : ra;
            var sb = mb ? mb[2] : rb;
            return sa.localeCompare(sb);
        });
        return '<div class="br-count">共 ' + rows.length + ' 条特殊配种</div>' +
            '<div class="br-line-list br-line-list--grid">' +
            rows.map(function(row) {
                var palA = core.getPal(row.parentAId);
                var palB = core.getPal(row.parentBId);
                var palChild = core.getPal(row.childId);
                return '<div class="br-line-card br-line-card--special">' +
                    '<div class="br-line-pal-group">' +
                    renderPalBadge(palA, '', false, row.parentAGender) +
                    '<span class="br-line-op">+</span>' +
                    renderPalBadge(palB, '', false, row.parentBGender) +
                    '<span class="br-line-op">=</span>' +
                    renderPalBadge(palChild, '', false) +
                    '<span class="br-line-source">特殊配种</span>' +
                    '</div></div>';
            }).join('') + '</div>';
    }

    function render() {
        loadError = '';
        if (!loadAllData()) return renderLoading();

        var core = getCore();
        if (!core) return renderLoading();

        var selectors = '';
        var results = '';

        if (state.mode === 'child') {
            selectors = '<div class="br-selector-row">' +
                renderSelector('parentA') +
                '<div class="br-selector-plus">+</div>' +
                renderSelector('parentB') +
                '</div>';
            results = renderChildResult();
        } else if (state.mode === 'parents') {
            selectors = '<div class="br-selector-row">' +
                renderSelector('child') +
                '</div>';
            results = renderParentsResult();
        } else {
            results = renderSpecialList();
        }

        var modeHtml = renderModeToggle();

        return '<div class="pt-web-tool-page pt-web-page--grid-fluid pt-web-breed-page pt-web-filter-page">' +
            '<header class="pt-web-tool-heading"><div><span class="pt-web-tool-kicker">工具 / 配种</span><h1>配种查询</h1></div></header>' +
            '<section class="pt-web-section pt-web-filter-section">' +
            '<div class="pt-web-filter-shell"><div class="pt-web-filter-groups">' +
            '<div class="pt-web-filter-cluster pt-web-filter-cluster--category">' +
            '<div class="pt-web-filter-chips pt-web-filter-category-chips pt-web-filter-category-chips--main">' + modeHtml + '</div>' +
            '</div>' +
            '<div class="pt-web-filter-divider" aria-hidden="true"></div>' +
            '<div class="pt-web-filter-cluster pt-web-filter-cluster--primary">' +
            '<div class="br-filter-with-principle">' +
            '<div class="br-selectors">' + selectors + '</div>' +
            renderPrinciple() +
            '</div>' +
            '</div>' +
            '</div></div>' +
            '</section>' +
            '<section class="pt-web-section br-grid-section">' + results + '</section></div>';
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

    function selectPal(role, palId) {
        var core = getCore();
        if (!core) return;
        var pal = core.getPal(palId);
        if (role === 'parentA') {
            state.parentA = pal;
            state.parentASearch = pal.name;
            state.parentADropdown = [];
        } else if (role === 'parentB') {
            state.parentB = pal;
            state.parentBSearch = pal.name;
            state.parentBDropdown = [];
        } else {
            state.child = pal;
            state.childSearch = pal.name;
            state.childDropdown = [];
        }
        rerender();
    }

    function clearPal(role) {
        if (role === 'parentA') { state.parentA = null; state.parentASearch = ''; state.parentADropdown = []; }
        else if (role === 'parentB') { state.parentB = null; state.parentBSearch = ''; state.parentBDropdown = []; }
        else { state.child = null; state.childSearch = ''; state.childDropdown = []; }
        rerender();
    }

    function setDropdown(role, list) {
        state.parentADropdown = [];
        state.parentBDropdown = [];
        state.childDropdown = [];
        if (role === 'parentA') state.parentADropdown = list;
        else if (role === 'parentB') state.parentBDropdown = list;
        else state.childDropdown = list;
    }

    function closeDropdownsWithoutRerender(root) {
        if (!state.parentADropdown.length && !state.parentBDropdown.length && !state.childDropdown.length) return;
        state.parentADropdown = [];
        state.parentBDropdown = [];
        state.childDropdown = [];
        Array.prototype.forEach.call(root.querySelectorAll('.br-dd'), function(panel) {
            panel.parentNode.removeChild(panel);
        });
        Array.prototype.forEach.call(root.querySelectorAll('.br-selector'), function(selector) {
            selector.classList.remove('pt-custom-select--open');
        });
    }

    function bind(root) {
        if (!root || root.dataset.brBd === '1') return;
        root.dataset.brBd = '1';

        root.addEventListener('click', function(e) {
            var modeBtn = e.target.closest('[data-br-mode]');
            if (modeBtn) {
                state.mode = modeBtn.getAttribute('data-br-mode');
                rerender();
                return;
            }
            var ddItem = e.target.closest('[data-br-pal]');
            if (ddItem) {
                var role = ddItem.closest('[data-br-role]');
                if (role) {
                    selectPal(role.getAttribute('data-br-role'), ddItem.getAttribute('data-br-pal'));
                }
                return;
            }
            var ddToggle = e.target.closest('[data-br-dd-toggle]');
            if (ddToggle) {
                e.stopImmediatePropagation();
                var role = ddToggle.getAttribute('data-br-dd-toggle');
                var core = getCore();
                var isChild = role === 'child';
                var dropdown = isChild ? state.childDropdown : (role === 'parentA' ? state.parentADropdown : state.parentBDropdown);
                var searchQ = isChild ? state.childSearch : (role === 'parentA' ? state.parentASearch : state.parentBSearch);
                if (dropdown.length > 0 && !searchQ) {
                    setDropdown(role, []);
                } else {
                    var allPals = core ? core.getPals().slice(0, 500) : [];
                    setDropdown(role, allPals);
                }
                rerender();
                return;
            }
            var clearBtn = e.target.closest('[data-br-clear]');
            if (clearBtn) {
                clearPal(clearBtn.getAttribute('data-br-clear'));
                return;
            }
        });

        root.addEventListener('input', function(e) {
            var input = e.target.closest('[data-br-input]');
            if (!input || searchComposing || e.isComposing) return;
            var role = input.getAttribute('data-br-input');
            var val = input.value;
            var selStart = input.selectionStart;
            if (role === 'parentA') {
                if (state.parentA && val !== state.parentA.name) state.parentA = null;
                state.parentASearch = val;
            } else if (role === 'parentB') {
                if (state.parentB && val !== state.parentB.name) state.parentB = null;
                state.parentBSearch = val;
            } else {
                if (state.child && val !== state.child.name) state.child = null;
                state.childSearch = val;
            }
            var core = getCore();
            var results = val ? core.searchPals(val) : [];
            setDropdown(role, results);
            rerender();
            var newInput = root.querySelector('[data-br-input="' + role + '"]');
            if (newInput) { newInput.focus(); newInput.selectionStart = newInput.selectionEnd = selStart; }
        });

        root.addEventListener('compositionstart', function(e) {
            if (!e.target.closest('[data-br-input]')) return;
            searchComposing = true;
        });
        root.addEventListener('compositionend', function(e) {
            var input = e.target.closest('[data-br-input]');
            if (!input) return;
            searchComposing = false;
            var role = input.getAttribute('data-br-input');
            var val = input.value;
            var selStart = input.selectionStart;
            if (role === 'parentA') { state.parentASearch = val; } else if (role === 'parentB') { state.parentBSearch = val; } else { state.childSearch = val; }
            var core = getCore();
            var results = val ? core.searchPals(val) : [];
            setDropdown(role, results);
            rerender();
            var newInput = root.querySelector('[data-br-input="' + role + '"]');
            if (newInput) { newInput.focus(); newInput.selectionStart = newInput.selectionEnd = selStart; }
        });

        root.addEventListener('click', function(e) {
            var target = e.target;
            if (window.PT_WEB_ACTIVE_TOOL !== 'breeding') return;
            if (!target.closest('[data-br-role]') && !target.closest('[data-br-mode]') && !target.closest('[data-br-clear]')) {
                closeDropdownsWithoutRerender(root);
            }
        });
    }

    return {
        render: render,
        bind: bind,
        destroy: function() { palDataLoaded = false; breedingDataLoaded = false; }
    };
})();

if (typeof window !== 'undefined') window.PT_BREEDING_WEB = PT_BREEDING_WEB;
