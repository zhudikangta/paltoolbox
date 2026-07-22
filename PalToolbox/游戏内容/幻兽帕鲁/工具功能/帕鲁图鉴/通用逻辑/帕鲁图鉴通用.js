var PT_PALDEX_COMMON = (function() {
    var state = {
        mainCategory: 'normal',
        showUnreleased: false,
        newOnly: false,
        selEls: [],
        selWorks: [],
        displayFields: [],
        sortMode: 'default',
        selPal: null,
        searchQ: ''
    };

    var listeners = [];
    var MAIN_CATEGORIES = [
        { id: 'normal', label: '普通帕鲁', rawCategories: ['基础', '亚种', '泰拉瑞亚'] },
        { id: 'raidBoss', label: '石板Boss', rawCategories: ['石板Boss'] },
        { id: 'towerBoss', label: '塔主Boss', rawCategories: ['塔主Boss'] },
        { id: 'bossVariant', label: 'Boss', rawCategories: ['Boss变体'] },
        { id: 'berserk', label: '狂暴化', rawCategories: ['狂暴化'] },
        { id: 'other', label: '其他', rawCategories: ['变体', '未归类'] }
    ];
    var DISPLAY_FIELDS = [
        { id: 'hp', label: '生命值', stat: 'HP' },
        { id: 'defense', label: '防御力', stat: '防御' },
        { id: 'moveSpeed', label: '移动速度', stat: '移动速度' },
        { id: 'sprintSpeed', label: '冲刺速度', stat: '骑乘冲刺' },
        { id: 'food', label: '食量', stat: '食物量' },
        { id: 'maleRate', label: '雄性概率', stat: '雄性概率' },
        { id: 'breedPower', label: '繁殖力', stat: '繁殖力' },
        { id: 'meleeAttack', label: '近战攻击', stat: '近战攻击' },
        { id: 'rangedAttack', label: '远程攻击', stat: '远程攻击' }
    ];
    var DISPLAY_FIELD_BY_ID = DISPLAY_FIELDS.reduce(function(map, field) {
        map[field.id] = field;
        return map;
    }, {});
    var LEGACY_SOURCE_KEYS = ('alpaca amaterasuwolf amaterasuwolf_dark anubis badcatgirl baphomet baphomet_dark bastet bastet_ice berrygoat berrygoat_dark birddragon birddragon_ice blackcentaur blackgriffon blackmetaldragon blackpuppy blueberryfairy bluedragon bluedragon_ice blueplatypus blueplatypus_fire bluethunderhorse boar candleghost captainpenguin captainpenguin_black carbunclo catbat catmage catmage_fire catvampire chickenpal colorfulbird cowpal cutebutterfly cutefox cutemole darkalien darkcrow darkmechadragon darkscorpion darkscorpion_ground deer deer_ground dreamdemon drillgame eagle eleccat elecpanda fairydragon fairydragon_water featherostrich fengyundeeper fengyundeeper_electric firekirin firekirin_dark flamebambi flamebuffalo flowerdinosaur flowerdinosaur_electric flowerdoll flowerrabbit flyingmanta flyingmanta_thunder foxmage foxmage_dark ganesha garm ghostanglerfish ghostanglerfish_fire ghostbeast ghostrabbit goldenhorse gorilla gorilla_ground grassmammoth grassmammoth_ice grasspanda grasspanda_electric grassrabbitman grimgirl guardiandog hadesbird hadesbird_electric hawkbird hedgehog hedgehog_ice herculesbeetle herculesbeetle_ground horus horus_water icecrocodile icedeer icefox icehorse icehorse_dark icenarwhal icenarwhal_fire iceseal icewitch jellyfishfairy jellyfishghost jetdragon kelpie kelpie_fire kendofrog kendofrog_dark kingalpaca kingalpaca_ice kingbahamut kingbahamut_dragon kirin kitsunebi kitsunebi_ice lavagirl lazycatfish lazycatfish_gold lazydragon lazydragon_electric leafmomonga leafprincess legenddeer lilyqueen lilyqueen_dark littlebriarrose lizardman lizardman_fire manticore manticore_dark mimicdog monkey moonqueen mopbaby mopking mushroomdragon mushroomdragon_dark mutant mysterymask naughtycat negativekoala negativeoctopus negativeoctopus_neutral nightbluehorse nightfox nightlady nightlady_dark octopusgirl penguin penguin_electric pinkcat pinklizard pinkrabbit pinkrabbit_grass plantslime plesiosaur poseidonorca purplespider queenbee raijindaughter raijindaughter_water redarmorbird robinhood robinhood_ground ronin ronin_dark saintcentaur sakurasaurus sakurasaurus_water scorpionman serpent serpent_ground sharkkid sharkkid_fire sheepball sifudog skydragon skydragon_grass smallarmadillo snowpeafowl snowtigerbeastman soldierbee stuffedshark stuffedshark_fire suzaku suzaku_water sweetssheep tentacleturtle tentacleturtle_ground thunderbird thunderdog thunderdragonman tropicalostrich umihebi umihebi_fire violetfairy volcanicmonster volcanicmonster_ice weaseldragon weaseldragon_fire werewolf werewolf_ice whitealiendragon whitedeer whitemoth whiteshielddragon whitetiger whitetiger_ground windchimes windchimes_ice winggolem wizardowl woolfox yakushimaboss001 yakushimaboss001_small yakushimamonster001 yakushimamonster001_blue yakushimamonster001_pink yakushimamonster001_purple yakushimamonster001_rainbow yakushimamonster001_red yakushimamonster002 yakushimamonster003 yakushimamonster003_purple yeti yeti_grass').split(' ');
    var LEGACY_SOURCE_KEY_SET = LEGACY_SOURCE_KEYS.reduce(function(map, key) {
        map[key] = true;
        return map;
    }, {});
    var APPEARANCE_KEY = 'pt-paldex-appearance-v1';
    var DEFAULT_APPEARANCE = {
        frameTheme: 'theme:oceanic',
        frameMaterial: 'metalGlass',
        cubeTheme: 'theme:skyVault',
        cubeMaterial: 'smokedGlass'
    };

    function getCore() {
        return (typeof window !== 'undefined' && window.PT_PALDEX_CORE) ? window.PT_PALDEX_CORE : null;
    }

    function getState() {
        var selEls = state.selEls.slice();
        var selWorks = state.selWorks.slice();
        return {
            mainCategory: state.mainCategory,
            showUnreleased: state.showUnreleased,
            newOnly: state.newOnly,
            selEls: selEls,
            selWorks: selWorks,
            selEl: selEls[0] || '',
            selWork: selWorks[0] || '',
            displayFields: state.displayFields.slice(),
            sortMode: state.sortMode,
            selPal: state.selPal,
            searchQ: state.searchQ
        };
    }

    function toggleInList(list, value) {
        if (!value) return list.slice();
        var next = list.slice();
        var index = next.indexOf(value);
        if (index > -1) next.splice(index, 1);
        else next.push(value);
        return next;
    }

    function toNumber(value, fallback) {
        var number = Number(value);
        return isFinite(number) ? number : fallback;
    }

    function getDisplayNumber(pal) {
        var raw = pal && pal.raw || {};
        var value = raw.图鉴编号 !== undefined ? raw.图鉴编号 : pal && pal.displayId;
        var match = String(value || '').match(/\d+/);
        return match ? Number(match[0]) : 999999;
    }

    function getSourceKey(pal) {
        var raw = pal && pal.raw || {};
        return String((pal && pal.iconSourceKey) || raw.头像来源键 || (pal && pal.species) || (pal && pal.id) || '').toLowerCase();
    }

    function isNewPal(pal) {
        if (!pal) return false;
        if (pal.category === '泰拉瑞亚') return true;
        var key = getSourceKey(pal);
        if (!key) return false;
        return !LEGACY_SOURCE_KEY_SET[key];
    }

    function getFieldValue(pal, fieldId) {
        var field = DISPLAY_FIELD_BY_ID[fieldId];
        if (!field || !pal) return 0;
        return toNumber((pal.stats || {})[field.stat], -Infinity);
    }

    function getWorkSortValue(pal) {
        var works = pal && pal.works || [];
        var selected = state.selWorks;
        var levels = works.filter(function(work) {
            return !selected.length || selected.indexOf(work.name) > -1;
        }).map(function(work) {
            return toNumber(work.level, 0);
        });
        return levels.length ? Math.max.apply(Math, levels) : 0;
    }

    function compareStable(a, b, compare) {
        var result = compare(a.pal, b.pal);
        return result !== 0 ? result : a.index - b.index;
    }

    function sortPals(list) {
        var mode = state.sortMode || 'default';
        if (mode === 'default') return list;
        var wrapped = list.map(function(pal, index) {
            return { pal: pal, index: index };
        });
        wrapped.sort(function(a, b) {
            return compareStable(a, b, function(left, right) {
                if (mode === 'number-asc') return getDisplayNumber(left) - getDisplayNumber(right);
                if (mode === 'number-desc') return getDisplayNumber(right) - getDisplayNumber(left);
                if (mode === 'work-desc') return getWorkSortValue(right) - getWorkSortValue(left);
                if (mode === 'work-asc') return getWorkSortValue(left) - getWorkSortValue(right);
                var match = mode.match(/^(.+)-(asc|desc)$/);
                if (match && DISPLAY_FIELD_BY_ID[match[1]]) {
                    var leftValue = getFieldValue(left, match[1]);
                    var rightValue = getFieldValue(right, match[1]);
                    return match[2] === 'asc' ? leftValue - rightValue : rightValue - leftValue;
                }
                return 0;
            });
        });
        return wrapped.map(function(item) {
            return item.pal;
        });
    }

    function getThemePresets() {
        var themes = (typeof window !== 'undefined' && window.PT_THEME_PRESETS) ? window.PT_THEME_PRESETS : {};
        var custom = {};
        try {
            if (typeof window !== 'undefined' && typeof window.readPTSettings === 'function') {
                custom = (window.readPTSettings('web') || {}).cardThemePresets || {};
            }
        } catch (error) {}
        return { themes: themes, custom: custom };
    }

    function isKnownTheme(value) {
        var selected = String(value || '');
        var presets = getThemePresets();
        if (selected.indexOf('theme:') === 0) return !!presets.themes[selected.slice(6)];
        if (selected.indexOf('custom:') === 0) return !!presets.custom[selected.slice(7)];
        return !!presets.themes[selected];
    }

    function normalizeTheme(value, fallback) {
        var selected = String(value || '');
        if (!selected) return fallback;
        if (selected.indexOf('theme:') !== 0 && selected.indexOf('custom:') !== 0) {
            selected = 'theme:' + selected;
        }
        return isKnownTheme(selected) ? selected : fallback;
    }

    function isKnownMaterial(value) {
        var selected = String(value || '');
        var builtins = (typeof window !== 'undefined' && window.PT_MATERIAL_PRESETS) ? window.PT_MATERIAL_PRESETS : {};
        var custom = {};
        try {
            if (typeof window !== 'undefined' && typeof window.readPTSettings === 'function') {
                custom = (window.readPTSettings('web') || {}).cardMaterialPresets || {};
            }
        } catch (error) {}
        if (builtins[selected]) return true;
        return selected.indexOf('custom:') === 0 && !!custom[selected.slice(7)];
    }

    function normalizeMaterial(value, fallback) {
        var selected = String(value || '');
        return isKnownMaterial(selected) ? selected : fallback;
    }

    function normalizeAppearanceSettings(settings) {
        var source = settings || {};
        return {
            frameTheme: normalizeTheme(source.frameTheme, DEFAULT_APPEARANCE.frameTheme),
            frameMaterial: normalizeMaterial(source.frameMaterial, DEFAULT_APPEARANCE.frameMaterial),
            cubeTheme: normalizeTheme(source.cubeTheme, DEFAULT_APPEARANCE.cubeTheme),
            cubeMaterial: normalizeMaterial(source.cubeMaterial, DEFAULT_APPEARANCE.cubeMaterial)
        };
    }

    function getAppearanceSettings() {
        var parsed = null;
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                var raw = window.localStorage.getItem(APPEARANCE_KEY);
                parsed = raw ? JSON.parse(raw) : null;
            }
        } catch (error) {
            parsed = null;
        }
        return normalizeAppearanceSettings(parsed || DEFAULT_APPEARANCE);
    }

    function setAppearanceSettings(nextSettings) {
        var next = normalizeAppearanceSettings(Object.assign({}, getAppearanceSettings(), nextSettings || {}));
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.setItem(APPEARANCE_KEY, JSON.stringify(next));
            }
        } catch (error) {}
        notify();
        return next;
    }

    function setFilter(type, value) {
        switch (type) {
            case 'mainCategory':
                state.mainCategory = value || 'normal';
                state.selPal = null;
                break;
            case 'showUnreleased':
                state.showUnreleased = !!value;
                state.selPal = null;
                break;
            case 'newOnly':
                state.newOnly = !!value;
                state.selPal = null;
                break;
            case 'element':
                state.selEls = toggleInList(state.selEls, value);
                break;
            case 'work':
                state.selWorks = toggleInList(state.selWorks, value);
                break;
            case 'displayField':
                state.displayFields = toggleInList(state.displayFields, value);
                if (state.displayFields.indexOf(value) < 0 && state.sortMode.indexOf(value + '-') === 0) {
                    state.sortMode = 'default';
                }
                break;
            case 'sort':
                state.sortMode = value || 'default';
                if (state.sortMode !== 'default') {
                    var match = state.sortMode.match(/^(.+)-(asc|desc)$/);
                    if (match && DISPLAY_FIELD_BY_ID[match[1]] && state.displayFields.indexOf(match[1]) < 0) {
                        state.displayFields = state.displayFields.concat(match[1]);
                    }
                }
                break;
            case 'pal':
                state.selPal = value;
                break;
            case 'search':
                state.searchQ = value;
                break;
            case 'back':
                state.selPal = null;
                break;
        }
        notify();
    }

    function getFilteredPals(core) {
        if (!core) return [];
        var list = core.getAll();

        if (!state.showUnreleased) {
            list = list.filter(function(p) {
                return p.implementStatus !== '未实装';
            });
        }

        var selected = MAIN_CATEGORIES.find(function(category) {
            return category.id === state.mainCategory;
        }) || MAIN_CATEGORIES[0];
        list = list.filter(function(p) {
            return selected.rawCategories.indexOf(p.category) > -1;
        });

        if (state.mainCategory === 'normal' && state.sortMode === 'default') {
            list = list.filter(function(p) { return p.category !== '泰拉瑞亚'; })
                .concat(list.filter(function(p) { return p.category === '泰拉瑞亚'; }));
        }

        if (state.newOnly) {
            list = list.filter(isNewPal);
        }

        if (state.selEls.length) {
            list = list.filter(function(p) {
                var elements = p.elements || [];
                return state.selEls.every(function(element) {
                    return elements.indexOf(element) > -1;
                });
            });
        }

        if (state.selWorks.length) {
            list = list.filter(function(p) {
                var works = (p.works || []).map(function(work) { return work.name; });
                return state.selWorks.every(function(work) {
                    return works.indexOf(work) > -1;
                });
            });
        }

        if (state.searchQ) {
            var q = state.searchQ.toLowerCase();
            list = list.filter(function(p) {
                return p.nameStatus !== '缺中文名' && String(p.name || '').toLowerCase().indexOf(q) > -1 ||
                       String(p.displayId || '').toLowerCase().indexOf(q) > -1;
            });
        }

        return sortPals(list);
    }

    function onStateChange(fn) {
        listeners.push(fn);
    }

    function notify() {
        for (var i = 0; i < listeners.length; i++) {
            listeners[i]();
        }
    }

    function destroy() {
        listeners = [];
        state.mainCategory = 'normal';
        state.showUnreleased = false;
        state.newOnly = false;
        state.selEls = [];
        state.selWorks = [];
        state.displayFields = [];
        state.sortMode = 'default';
        state.selPal = null;
        state.searchQ = '';
    }

    return {
        MAIN_CATEGORIES: MAIN_CATEGORIES,
        DISPLAY_FIELDS: DISPLAY_FIELDS,
        getState: getState,
        setFilter: setFilter,
        getFilteredPals: getFilteredPals,
        onStateChange: onStateChange,
        getAppearanceSettings: getAppearanceSettings,
        setAppearanceSettings: setAppearanceSettings,
        normalizeAppearanceSettings: normalizeAppearanceSettings,
        destroy: destroy
    };
})();

if (typeof window !== 'undefined') {
    window.PT_PALDEX_COMMON = PT_PALDEX_COMMON;
}
