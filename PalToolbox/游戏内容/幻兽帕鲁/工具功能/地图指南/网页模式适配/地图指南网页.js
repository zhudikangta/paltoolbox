var PT_MAP_WEB = (function() {
    var PIXEL_SIZE = 131072;
    var NATIVE_ZOOM = 8;
    var CLUSTER_STORAGE_KEY = 'pt_map_cluster_enabled';
    var FAVORITES_STORAGE_KEY = 'pt_map_favorites';
    var DEFAULT_FAVORITES = ['Fast Travel', 'Alpha Pal', 'Rampaging', 'Bounty', 'Cave Entrance', 'Dungeon', 'Fruit Tree', 'Fishing Spot'];
    var CLUSTER_STAGE_BREAKS = [0, 0.2, 0.4, 0.6];
    var CLUSTER_STAGE_RADII = [260, 140, 52, 1];
    var CLUSTER_ANIMATION_MS = 500;
    var ZOOM_STEP_COUNT = 10;
    var ZOOM_TOTAL_RANGE = 4.2;
    var ZOOM_STEP_SIZE = 0.42;
    function computeWheelPxPerZoomStep() {
        var dpr = window.devicePixelRatio || 1;
        var ua = navigator.userAgent.toLowerCase();
        var je;
        if (ua.indexOf('linux') > -1 && ua.indexOf('chrome') > -1) {
            je = dpr;
        } else if (ua.indexOf('mac') > -1) {
            je = 3 * dpr;
        } else {
            je = dpr > 0 ? 2 * dpr : 1;
        }
        var t = Math.exp(ZOOM_STEP_SIZE * Math.LN2 / 4);
        var d2Needed = -Math.log(2 / t - 1);
        var normalizedDelta = 100 / je;
        return normalizedDelta / (4 * d2Needed);
    }

    function installCustomWheelZoom(map) {
        var PER_FRAME_MAX_STEP = 0.14;
        var wheel = { _accumDelta: 0, _lastDir: 0, _targetZoom: null, _lastMousePos: null, _raf: null, _lastZoomFire: 0 };

        function tick() {
            wheel._raf = null;
            try { map.closeTooltip(); } catch (e) {}

            if (wheel._accumDelta !== 0) {
                var current = map.getZoom();
                var d2 = Math.abs(wheel._accumDelta) / (map.options.wheelPxPerZoomLevel * 4);
                var d3 = 4 * Math.log(2 / (1 + Math.exp(-d2))) / Math.LN2;
                var sign = wheel._accumDelta > 0 ? 1 : -1;
                if (wheel._targetZoom === null) wheel._targetZoom = current;
                wheel._targetZoom = map._limitZoom(wheel._targetZoom + sign * d3);
                wheel._accumDelta = 0;
            }

            if (wheel._targetZoom !== null) {
                var cur = map.getZoom();
                var diff = wheel._targetZoom - cur;
                var absDiff = Math.abs(diff);
                if (absDiff < 0.0005) {
                    wheel._targetZoom = null;
                    map.fire('zoom');
                    return;
                }
                var step = Math.min(absDiff, PER_FRAME_MAX_STEP);
                var newZoom = map._limitZoom(cur + (diff > 0 ? step : -step));
                if (wheel._lastMousePos) {
                    map.setZoomAround(wheel._lastMousePos, newZoom);
                } else {
                    map.setZoom(newZoom);
                }
                if (map._mapPane) map._mapPane.classList.remove('leaflet-zoom-anim');
                map._animatingZoom = false;
                clearTimeout(map._zoomTransitionTimeout);
                var now = +new Date();
                if (now - wheel._lastZoomFire >= 50) {
                    wheel._lastZoomFire = now;
                    map.fire('zoom');
                }
                updateHudZoom();
                wheel._raf = requestAnimationFrame(tick);
            }
        }

        function onWheel(e) {
            var delta = L.DomEvent.getWheelDelta(e);
            if (!delta) return;
            var dir = delta > 0 ? 1 : -1;

            if (wheel._lastDir !== 0 && dir !== wheel._lastDir) {
                wheel._accumDelta = 0;
                wheel._targetZoom = map.getZoom();
            }

            wheel._accumDelta += delta;
            wheel._lastDir = dir;
            wheel._lastMousePos = map.mouseEventToContainerPoint(e);

            if (wheel._raf === null) wheel._raf = requestAnimationFrame(tick);

            L.DomEvent.stop(e);
            L.DomEvent.preventDefault(e);
        }

        function docWheel(e) {
            if (!map._container || !map._container.contains(e.target)) return;
            onWheel(e);
        }

        document.addEventListener('wheel', docWheel, { capture: true, passive: false });

        return function destroy() {
            document.removeEventListener('wheel', docWheel, { capture: true });
            if (wheel._raf !== null) { cancelAnimationFrame(wheel._raf); wheel._raf = null; }
        };
    }

    var DRAG_GAP_PREFIX = '__pt_drag_gap__:';
    var DRAG_START_THRESHOLD = 6;
    var DROP_STICKY_RATIO = 0.22;
    var DROP_STICKY_MIN = 14;
    var DROP_STICKY_MAX = 30;
    var state = {
        root: null,
        stage: null,
        deck: null,
        map: null,
        customWheelZoom: null,
        layerGroups: {},
        markers: [],
        prepared: null,
        checked: null,
        search: '',
        searchTimer: 0,
        clusterEnabled: true,
        clusterStage: 0,
        clusterUpdateToken: 0,
        layersRendered: false,
        viewportOnly: false,
        deckMode: 'collapsed',
        hud: null,
        hudZoomText: null,
        hudZoomFill: null,
        hudCoordText: null,
        bounds: null,
        favoritesRow: null,
        searchInput: null,
        fullListRow: null,
        barStat: null,
        barActive: null,
        resizeObserver: null,
        preloadStarted: false,
        preloaded: false,
        preloadImages: [],
        preloadedTileKeys: {},
        tilePreloadFrame: null,
        activeMapId: null,
        favorites: null,
        previewFavorites: null,
        drag: {
            active: false,
            pending: false,
            suppressClick: false,
            pointerId: null,
            source: null,
            type: null,
            sourceEl: null,
            floatingEl: null,
            startX: 0,
            startY: 0,
            clientX: 0,
            clientY: 0,
            offsetX: 0,
            offsetY: 0,
            width: 0,
            height: 0,
            insideFavorites: false,
            previewIndex: -1,
            moveHandler: null,
            upHandler: null,
            cancelHandler: null
        }
    };

    var palDataById = {};
    var palDataLoaded = false;
    var PAL_HEADSHOT_PATH = '../游戏内容/幻兽帕鲁1.0/资源包/帕鲁头像/';
    var PAL_DATA_URL = '../游戏内容/幻兽帕鲁1.0/数据包/帕鲁.json';

    function normalizePalData(data) {
        if (Array.isArray(data)) return data;
        if (!data || typeof data !== 'object') return [];
        return Object.keys(data).map(function(key) { return data[key]; });
    }

    function ensurePalData() {
        if (palDataLoaded) return Promise.resolve();
        var loader = typeof window !== 'undefined' && window.PT_DATA_LOADER;
        if (!loader) return Promise.reject();
        return loader.loadJson(PAL_DATA_URL).then(function(d) {
            normalizePalData(d).forEach(function(p) { if (p && p.id) palDataById[p.id] = p; });
            palDataLoaded = true;
            if (state.map) updateBossMarkers();
        }).catch(function() {});
    }

    function getPalChineseName(id) {
        if (!id) return '';
        var pal = palDataById['BOSS_' + id] || palDataById[id];
        return pal ? (pal['中文名'] || id) : id;
    }

    function getPalHeadshot(id) {
        if (!id) return '';
        var pal = palDataById['BOSS_' + id] || palDataById[id];
        if (pal && pal['头像文件'] && pal['头像状态'] === '已存在') {
            return PAL_HEADSHOT_PATH + pal['头像文件'];
        }
        return '';
    }

    var TOWER_CN = {
        'Boss Tower': '高塔Boss',
        'Middle Boss Tower': '世界树挑战',
        'Last Boss Tower': '封印之室',
        'King Whale Tower': '忘却孤岛'
    };

    function getPointDisplayName(point) {
        if (!point) return '';
        var item = point.item || '';

        // 优先用 id 查 locationTextNames（快速传送点、世界树命名点等）
        if (point.id) {
            var mapData = (typeof window !== 'undefined' && window.PT_MAP_DATA) ? window.PT_MAP_DATA : null;
            var ltn = mapData && mapData.locationTextNames;
            if (ltn) {
                var direct = ltn[point.id];
                if (direct && direct !== '-' && direct.indexOf('{') !== 0) return direct;
                var withTitle = ltn[point.id + '_Title'];
                if (withTitle) return withTitle;
            }
        }

        if (point.type === 'Alpha Pal') {
            var slug = item.replace(/^BOSS_/i, '');
            if (slug === 'None') return '人类Boss';
            var cn = getPalChineseName(slug);
            if (cn && cn !== slug) return cn;
            return item;
        }
        if (point.type === 'Tower') {
            return TOWER_CN[item] || item;
        }
        if (point.type === 'Bounty') {
            return '通缉犯';
        }
        return item || point.type || '';
    }

    function updateBossMarkers() {
        if (!state.map || !state.markers) return;
        state.markers.forEach(function(m) {
            if (m._ptType !== 'Alpha Pal') return;
            var model = m._ptModel;
            if (!model) return;
            var slug = model.slug || (model.label || '').replace(/^BOSS_/i, '');
            if (slug === 'None') return;
            var cn = getPalChineseName(slug);
            if (cn && model.label !== cn) {
                model.label = cn;
                if (m.getTooltip()) {
                    var tip = m._ptTooltipHtml;
                    if (tip) {
                        var newTip = tip.replace(/<strong>[^<]*<\/strong>/, '<strong>' + escapeHtml(cn) + '</strong>');
                        m.setTooltipContent(newTip);
                    }
                }
            }
            var headshot = getPalHeadshot(slug);
            if (!headshot) return;
            var img = m._icon && m._icon._img;
            if (img && img.src.indexOf(headshot) > -1) return;
            try { m.setIcon(L.divIcon({
                className: '',
                html: '<div style="width:36px;height:36px;border-radius:50%;overflow:hidden;border:2px solid #ffcc00;box-shadow:0 0 12px rgba(255,204,0,0.4);background:rgba(0,0,0,0.3)"><img src="' + escapeHtml(headshot) + '" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display=\'none\'"></div>',
                iconSize: [36, 36],
                iconAnchor: [18, 18]
            })); } catch(e) {}
        });
    }

    function getCore() {
        return (typeof window !== 'undefined' && window.PT_MAP_CORE) ? window.PT_MAP_CORE : null;
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function fixResourcePath(path) {
        if (!path || typeof path.replace !== 'function') return '';
        return path
            .replace(/^资源包\/图标资源包\/\d+_/, '资源包/图标资源包/')
            .replace(/^资源包\//, '../游戏内容/幻兽帕鲁/资源包/');
    }

    function showDuplicateTooltip(x, y, label) {
        var tooltip = document.createElement('div');
        tooltip.className = 'map-duplicate-tooltip';
        tooltip.textContent = (label || '该类型') + ' 已在常用栏中';
        tooltip.style.left = x + 'px';
        tooltip.style.top = (y + 16) + 'px';
        document.body.appendChild(tooltip);
        setTimeout(function() {
            if (tooltip.parentNode) tooltip.parentNode.removeChild(tooltip);
        }, 3000);
    }

    function getTileUrl(z, x, y) {
        var dirMap = { MainMap: 'WorldMap', Tree: 'TreeMap' };
        return '../游戏内容/幻兽帕鲁1.0/资源包/地图/瓦片/' + (dirMap[getActiveMapId()] || getActiveMapId()) + '/z' + z + 'x' + x + 'y' + y + '.webp';
    }

    function getMapList() {
        var core = getCore();
        return core && typeof core.getMapList === 'function' ? core.getMapList() : [];
    }

    function getActiveMapId() {
        var core = getCore();
        if (!state.activeMapId) {
            state.activeMapId = core && typeof core.getDefaultMapId === 'function' ? core.getDefaultMapId() : 'MainMap';
        }
        return state.activeMapId;
    }

    function getActiveMapInfo() {
        var core = getCore();
        if (core && typeof core.getMapById === 'function') return core.getMapById(getActiveMapId());
        return { id: 'MainMap', label: '主世界', image: '' };
    }

    function runIdle(task) {
        if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
            window.requestIdleCallback(task, { timeout: 900 });
        } else {
            setTimeout(task, 32);
        }
    }

    function readClusterEnabled() {
        try {
            return localStorage.getItem(CLUSTER_STORAGE_KEY) !== '0';
        } catch (error) {
            return true;
        }
    }

    function writeClusterEnabled(value) {
        try {
            localStorage.setItem(CLUSTER_STORAGE_KEY, value ? '1' : '0');
        } catch (error) {}
    }

    function readFavorites() {
        try {
            var stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
            if (stored) {
                var parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length) return parsed;
            }
        } catch (error) {}
        return DEFAULT_FAVORITES.slice();
    }

    function writeFavorites(list) {
        try {
            localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(list));
        } catch (error) {}
    }

    function getStoredFavorites() {
        if (state.favorites) return state.favorites.slice();
        state.favorites = readFavorites();
        return state.favorites.slice();
    }

    function setStoredFavorites(list) {
        state.favorites = list.slice();
        writeFavorites(state.favorites);
    }

    function getFavoriteOrder(prepared) {
        var counts = prepared ? prepared.counts : null;
        var favorites = getStoredFavorites();
        var order = [];
        var seen = {};
        for (var i = 0; i < favorites.length; i++) {
            var type = favorites[i];
            if (seen[type]) continue;
            if (counts && !counts[type]) continue;
            seen[type] = true;
            order.push(type);
        }
        return order;
    }

    function getRenderedFavorites(prepared) {
        var source = state.previewFavorites && state.previewFavorites.length
            ? state.previewFavorites
            : getFavoriteOrder(prepared);
        var counts = prepared ? prepared.counts : null;
        var rendered = [];
        var seen = {};
        for (var i = 0; i < source.length; i++) {
            var type = source[i];
            if (type && type.indexOf(DRAG_GAP_PREFIX) === 0) {
                rendered.push(type);
                continue;
            }
            if (seen[type]) continue;
            if (counts && !counts[type]) continue;
            seen[type] = true;
            rendered.push(type);
        }
        return rendered;
    }

    function hasGapEntry(list) {
        for (var i = 0; i < list.length; i++) {
            if (list[i] && list[i].indexOf(DRAG_GAP_PREFIX) === 0) return true;
        }
        return false;
    }

    function buildGapToken(type) {
        return DRAG_GAP_PREFIX + type;
    }

    function buildPreviewFavorites(type, source, atIndex, prepared) {
        var base = getFavoriteOrder(prepared);
        var preview = base.slice();
        var idx = typeof atIndex === 'number' ? atIndex : preview.length;
        if (idx < 0) idx = 0;
        if (idx > preview.length) idx = preview.length;
        if (source === 'favorite') {
            var fromIdx = preview.indexOf(type);
            if (fromIdx !== -1) preview.splice(fromIdx, 1);
        } else if (preview.indexOf(type) !== -1) {
            return base;
        }
        var token = buildGapToken(type);
        preview.splice(idx, 0, token);
        return preview;
    }

    function clearPreviewFavorites() {
        state.previewFavorites = null;
    }

    function resolveIcon(point, type, lookup, itemName) {
        var pointIcon = point && point.fixed_icon;
        if (pointIcon && pointIcon.replace) return pointIcon;

        var typeIcon = lookup[type] && lookup[type].fixed_icon;
        if (typeIcon && typeIcon.replace) return typeIcon;

        var palCore = typeof window !== 'undefined' && window.PT_PALDEX_CORE;
        var palData = palCore && typeof palCore.getAll === 'function' ? palCore.getAll() : null;
        if (palData && itemName) {
            var target = String(itemName).toLowerCase();
            for (var i = 0; i < palData.length; i++) {
                var pal = palData[i] || {};
                if (String(pal.name || '').toLowerCase() === target || String(pal.slug || '').toLowerCase() === target) {
                    return pal.icon || '';
                }
            }
        }

        var fallback = {
            'Alpha Pal': '',
            'Cave Entrance': '',
            'Incident': '',
            'Journals': '',
            'Junk': '',
            'Respawn': '',
            'Unknown': '',
            'Ore Cluster': 'Ore',
            'Pure Quartz Cluster': 'Pure Quartz',
            'Coal Cluster': 'Coal',
            'Sulfur Cluster': 'Sulfur'
        };
        var fallbackType = fallback[type];
        if (fallbackType !== undefined) {
            if (fallbackType === '') return '';
            return resolveIcon(null, fallbackType, lookup, '');
        }
        return '';
    }

    function getIconMetric(type, lookup) {
        var meta = lookup[type] || {};
        return {
            width: Math.max(12, Number(meta.icon_width) || 30),
            height: Math.max(12, Number(meta.icon_height) || 30)
        };
    }

    function getTypeLabel(type, lookup) {
        var meta = lookup[type] || {};
        return meta.label || type;
    }

    function getMarkerClass(type) {
        if (type === 'Alpha Pal') return 'map-pal-ring-pin map-pal-ring-pin--alpha';
        if (type === 'Rampaging') return 'map-pal-ring-pin map-pal-ring-pin--rampaging';
        return '';
    }

    function isRegionLabelType(type) {
        var core = getCore();
        return core && typeof core.isRegionLabelType === 'function' ? core.isRegionLabelType(type) : type === 'Region';
    }

    function ensureChecked(prepared) {
        if (state.checked) return state.checked;
        state.checked = {};
        for (var i = 0; i < prepared.types.length; i++) {
            var type = prepared.types[i];
            state.checked[type] = prepared.defaultChecked[type] === true;
        }
        return state.checked;
    }

    function addTypeToGroup(groups, categories, category, type) {
        var cat = category || 'Other';
        if (!groups[cat]) {
            groups[cat] = [];
            categories.push(cat);
        }
        if (groups[cat].indexOf(type) === -1) groups[cat].push(type);
    }

    function buildTooltip(point, coords) {
        var title = getPointDisplayName(point) || point.item || point.type || '';
        var html = '<div class="map-tip">';
        html += '<div class="map-tip__title">';
        if (point.lv) html += '<span>Lv.' + escapeHtml(point.lv) + '</span>';
        html += '<strong>' + escapeHtml(title) + '</strong>';
        html += '</div>';
        if (coords) {
            html += '<div class="map-tip__coords"><span>X: ' + escapeHtml(coords.x) + '</span><span>Y: ' + escapeHtml(coords.y) + '</span></div>';
        }
        if (point.comment) html += '<div class="map-tip__note">' + escapeHtml(point.comment) + '</div>';
        if (point.cooldown) html += '<div class="map-tip__note">' + escapeHtml(point.cooldown) + '</div>';
        html += '</div>';
        return html;
    }

    function prepareData() {
        var activeMapId = getActiveMapId();
        if (state.prepared && state.prepared.mapId === activeMapId) return state.prepared;

        var core = getCore();
        if (!core) {
            state.prepared = {
                mapId: activeMapId,
                lookup: {},
                points: [],
                groups: {},
                categories: [],
                types: [],
                counts: {},
                labels: {},
                icons: {},
                metrics: {},
                typeCategories: {},
                defaultChecked: {},
                markerModels: []
            };
            return state.prepared;
        }

        var lookup = core.getIconLookup ? core.getIconLookup() : {};
        var points = core.getPointsForMap ? core.getPointsForMap(activeMapId) : (core.getAllPoints ? core.getAllPoints() : []);
        var groups = {};
        var categories = [];
        var counts = {};
        var labels = {};
        var icons = {};
        var metrics = {};
        var typeCategories = {};
        var defaultChecked = {};
        var markerModels = [];
        var types = [];

        Object.keys(lookup).forEach(function(type) {
            var meta = lookup[type] || {};
            typeCategories[type] = meta.category || 'Other';
            addTypeToGroup(groups, categories, typeCategories[type], type);
        });

        points.forEach(function(point, pointIndex) {
            var type = point.type || 'Other';
            if (type === 'Region') return;
            var meta = lookup[type] || {};
            var category = meta.category || 'Other';
            typeCategories[type] = category;
            addTypeToGroup(groups, categories, category, type);
            counts[type] = (counts[type] || 0) + 1;

            var coord = null;
            if (core.getPointPixelCoords) {
                coord = core.getPointPixelCoords(point, activeMapId);
            } else if (point.pos && core.gameToLatLng) {
                coord = core.gameToLatLng(parseFloat(point.pos.X), parseFloat(point.pos.Y));
            } else if (point.ipos && core.iposToLatLng) {
                coord = core.iposToLatLng(point.ipos.X, point.ipos.Y);
            }
            if (!coord || !isFinite(coord.px) || !isFinite(coord.py)) return;

            var icon = fixResourcePath(resolveIcon(point, type, lookup, point.item));
            var metric = getIconMetric(type, lookup);
            var gameCoords = core.getPointGameCoords ? core.getPointGameCoords(point) : null;
            markerModels.push({
                key: type + ':' + pointIndex + ':' + Math.round(coord.px) + ':' + Math.round(coord.py),
                type: type,
                category: category,
                px: coord.px,
                py: coord.py,
                icon: icon,
                width: metric.width,
                height: metric.height,
                markerClass: getMarkerClass(type),
                label: getPointDisplayName(point) || point.name || getTypeLabel(type, lookup),
                slug: (point.type === 'Alpha Pal') ? (point.item || '').replace(/^BOSS_/i, '') : '',
                regionLabel: isRegionLabelType(type),
                tooltip: buildTooltip(point, gameCoords)
            });
        });

        var CATEGORY_ORDER = { Collectibles: 0, Enemies: 1, NPCs: 2, Oilrig: 3, Locations: 4, Eggs: 5, Fishing: 6, Mine: 7, Resource: 8, Other: 9 };
        categories.sort(function(a, b) {
            var ai = CATEGORY_ORDER[a] != null ? CATEGORY_ORDER[a] : 99;
            var bi = CATEGORY_ORDER[b] != null ? CATEGORY_ORDER[b] : 99;
            return ai - bi;
        });
        categories.forEach(function(category) {
            groups[category].sort(function(a, b) {
                return getTypeLabel(a, lookup).localeCompare(getTypeLabel(b, lookup), 'zh-Hans-CN');
            });
            groups[category].forEach(function(type) {
                if (types.indexOf(type) === -1) types.push(type);
            });
        });

        types.forEach(function(type) {
            labels[type] = getTypeLabel(type, lookup);
            icons[type] = fixResourcePath(resolveIcon(null, type, lookup, ''));
            metrics[type] = getIconMetric(type, lookup);
            typeCategories[type] = typeCategories[type] || 'Other';
            defaultChecked[type] = core.isDefaultChecked ? core.isDefaultChecked(type) : ['Alpha Pal', 'Tower', 'Fast Travel', 'Region'].indexOf(type) > -1;
        });

        state.prepared = {
            mapId: activeMapId,
            lookup: lookup,
            points: points,
            groups: groups,
            categories: categories,
            types: types,
            counts: counts,
            labels: labels,
            icons: icons,
            metrics: metrics,
            typeCategories: typeCategories,
            defaultChecked: defaultChecked,
            markerModels: markerModels
        };
        return state.prepared;
    }

    function preloadTiles() {
        var tiles = [
            [1, 0, 0], [1, 0, 1], [1, 1, 0], [1, 1, 1],
            [2, 1, 1], [2, 1, 2], [2, 2, 1], [2, 2, 2],
            [3, 3, 3], [3, 3, 4], [3, 4, 3], [3, 4, 4]
        ];
        tiles.forEach(function(tile) {
            preloadTile(tile[0], tile[1], tile[2]);
        });
    }

    function preloadTile(z, x, y) {
        if (typeof Image !== 'function') return;
        var key = z + ':' + x + ':' + y;
        if (state.preloadedTileKeys[key]) return;
        state.preloadedTileKeys[key] = true;
        var image = new Image();
        image.decoding = 'async';
        image.src = getTileUrl(z, x, y);
        state.preloadImages.push(image);
    }

    function getTilePreloadOptions() {
        var core = getCore();
        return core && typeof core.getTilePreloadOptions === 'function'
            ? core.getTilePreloadOptions()
            : { maxNativeZoom: 4, panBuffer: 2, zoomProgressThreshold: 0.55 };
    }

    function preloadViewportTiles(map) {
        if (!map || typeof map.getPixelBounds !== 'function') return;
        var options = getTilePreloadOptions();
        if (getZoomProgress(map) < options.zoomProgressThreshold) return;
        var z = Number(options.maxNativeZoom);
        var buffer = Number(options.panBuffer);
        if (!isFinite(z) || z < 0) z = 4;
        if (!isFinite(buffer) || buffer < 0) buffer = 0;
        var bounds = map.getPixelBounds(z);
        var tileSize = 512;
        var maxTile = Math.pow(2, z) - 1;
        var minX = Math.max(0, Math.floor(bounds.min.x / tileSize) - buffer);
        var maxX = Math.min(maxTile, Math.floor(bounds.max.x / tileSize) + buffer);
        var minY = Math.max(0, Math.floor(bounds.min.y / tileSize) - buffer);
        var maxY = Math.min(maxTile, Math.floor(bounds.max.y / tileSize) + buffer);
        for (var x = minX; x <= maxX; x++) {
            for (var y = minY; y <= maxY; y++) {
                preloadTile(z, x, y);
            }
        }
    }

    function scheduleViewportTilePreload(map) {
        if (state.tilePreloadFrame !== null || typeof requestAnimationFrame !== 'function') return;
        state.tilePreloadFrame = requestAnimationFrame(function() {
            state.tilePreloadFrame = null;
            preloadViewportTiles(map);
        });
    }

    function preload() {
        if (state.preloadStarted) return;
        state.preloadStarted = true;
        ensurePalData();
        runIdle(function() {
            prepareData();
            state.preloaded = true;
        });
    }

    function buildMapSwitchHtml() {
        var maps = getMapList();
        if (!maps.length) return '';
        var active = getActiveMapId();
        var html = '<div class="map-switch" id="map-switch">';
        maps.forEach(function(map) {
            html += '<button type="button" class="pt-filter-chip map-switch__btn' + (map.id === active ? ' pt-filter-chip--active' : '') + '" data-map-id="' + escapeHtml(map.id) + '">' + escapeHtml(map.label || map.id) + '</button>';
        });
        html += '</div>';
        return html;
    }

    function render() {
        return [
            '<div class="pt-web-tool-page pt-web-page--immersive pt-web-map-page">',
            '<header class="pt-web-tool-heading map-tool-heading">',
            '<div><span class="pt-web-tool-kicker">地图 / 标点</span><h1>地图指南</h1></div>',
            '</header>',
            '<div class="map-layout">',
            '<div class="map-command-deck command-deck--collapsed" id="map-command-deck">',
            '<div class="command-bar">',
            '<div class="command-bar__center">',
            buildMapSwitchHtml(),
            '<div class="command-bar__search-wrap">',
            '<input type="text" class="pt-input command-bar__search" id="map-search" placeholder="搜索标点...">',
            '</div>',
            '<div class="command-bar__favorites" id="command-favorites"></div>',
            '<span class="command-bar__stat" id="map-bar-stat">--</span>',
            '<span class="command-bar__stat command-bar__stat--active" id="map-bar-active">--</span>',
            '</div>',
            '<div class="command-bar__right">',
            '<button type="button" class="pt-btn pt-btn--ghost command-bar__btn" data-action="selectall">全选</button>',
            '<button type="button" class="pt-btn pt-btn--ghost command-bar__btn" data-action="reset">重置</button>',
            '<button type="button" class="pt-btn pt-btn--ghost command-bar__btn" data-action="viewport">仅加载视野内</button>',
            '<button type="button" class="pt-btn pt-btn--ghost command-bar__btn" id="map-cluster-btn" data-action="cluster">聚集</button>',
            '<button type="button" class="pt-btn pt-btn--ghost command-bar__btn" data-action="toggle">展开</button>',
            '</div>',
            '</div>',
            '<div class="command-row command-row--full" id="command-full-list"></div>',
            '</div>',
            '<div class="map-stage" id="map-stage"><div class="map-loading">地图加载中...</div></div>',
            '</div>',
            '</div>'
        ].join('');
    }

    function getCategoryLabel(category) {
        var core = getCore();
        if (core && core.getCategoryLabel) return core.getCategoryLabel(category);
        var labels = {
            Enemies: '敌人',
            Resource: '资源',
            Locations: '地点',
            Fishing: '钓鱼',
            Mine: '矿石',
            NPCs: 'NPC',
            Collectibles: '收集品',
            Eggs: '帕鲁蛋',
            Oilrig: '石油平台',
            Other: '其他'
        };
        return labels[category] || category;
    }

    function buildFavoritesPillsHtml(prepared, favorites) {
        var checked = ensureChecked(prepared);
        var html = '';
        for (var i = 0; i < favorites.length; i++) {
            var type = favorites[i];
            if (type && type.indexOf(DRAG_GAP_PREFIX) === 0) {
                html += '<span class="map-favorites-gap" data-motion-key="' + escapeHtml(type) + '" aria-hidden="true" style="width:' + Math.round(state.drag.width || 68) + 'px;min-width:' + Math.round(state.drag.width || 68) + 'px;"></span>';
                continue;
            }
            if (!prepared.counts[type]) continue;
            var active = checked[type] === true;
            var icon = prepared.icons[type] || '';
            html += '<button type="button" class="pt-filter-chip pt-filter-chip--fav' + (active ? ' pt-filter-chip--active' : '') + '" data-motion-key="' + escapeHtml(type) + '" data-pill-type="' + escapeHtml(type) + '" data-drag-source="favorite">';
            if (icon) html += '<i class="pt-filter-chip__icon" style="background-image:url(\'' + escapeHtml(icon) + '\')"></i>';
            html += '<span class="pt-filter-chip__label">' + escapeHtml(prepared.labels[type] || type) + '</span>';
            html += '<b class="pt-filter-chip__count">' + (prepared.counts[type] || 0) + '</b>';
            html += '</button>';
        }
        return html;
    }

    function captureFavoritesPositions() {
        var row = state.favoritesRow;
        var positions = {};
        if (!row) return positions;
        var nodes = row.querySelectorAll('.pt-filter-chip--fav, .map-favorites-gap');
        for (var i = 0; i < nodes.length; i++) {
            var key = nodes[i].getAttribute('data-motion-key');
            if (!key) continue;
            positions[key] = {
                left: nodes[i].offsetLeft,
                top: nodes[i].offsetTop
            };
        }
        return positions;
    }

    function buildCategoryPillsHtml(prepared, category, filter) {
        var types = prepared.groups[category] || [];
        var query = String(filter || '').trim().toLowerCase();
        var checked = ensureChecked(prepared);
        var html = '';
        for (var i = 0; i < types.length; i++) {
            var type = types[i];
            if (query) {
                var label = prepared.labels[type] || type;
                if (label.toLowerCase().indexOf(query) === -1 && type.toLowerCase().indexOf(query) === -1) continue;
            }
            var active = checked[type] === true;
            var icon = prepared.icons[type] || '';
            html += '<button type="button" class="pt-filter-chip pt-filter-chip--sm' + (active ? ' pt-filter-chip--active' : '') + '" data-pill-type="' + escapeHtml(type) + '" data-drag-source="full">';
            if (icon) html += '<i class="pt-filter-chip__icon" style="background-image:url(\'' + escapeHtml(icon) + '\')"></i>';
            html += '<span class="pt-filter-chip__label">' + escapeHtml(prepared.labels[type] || type) + '</span>';
            html += '<b class="pt-filter-chip__count">' + (prepared.counts[type] || 0) + '</b>';
            html += '</button>';
        }
        return html;
    }

    function buildFullListHtml(prepared, filter) {
        var query = String(filter || '').trim().toLowerCase();
        var html = '';
        var anyMatch = false;
        var favorites = readFavorites();

        prepared.categories.forEach(function(category) {
            var pills = buildCategoryPillsHtml(prepared, category, filter);
            if (!pills) return;
            anyMatch = true;
            html += '<div class="filter-group" data-filter-category="' + escapeHtml(category) + '">';
            html += '<div class="filter-group__head">';
            html += '<span class="filter-group__label">' + escapeHtml(getCategoryLabel(category)) + '</span>';
            html += '<button type="button" class="filter-group__btn" data-group-action="all" data-group-cat="' + escapeHtml(category) + '">全选</button>';
            html += '<button type="button" class="filter-group__btn" data-group-action="none" data-group-cat="' + escapeHtml(category) + '">清空</button>';
            html += '</div>';
            html += '<div class="filter-group__body">' + pills + '</div>';
            html += '</div>';
        });

        return anyMatch ? html : '<div class="filter-empty">没有匹配的图层</div>';
    }

    function updateCommandBarStat() {
        if (!state.barStat || !state.barActive) return;
        var prepared = prepareData();
        var checked = ensureChecked(prepared);
        var activeTypes = 0;
        var visiblePoints = 0;
        var totalPoints = 0;
        for (var i = 0; i < prepared.types.length; i++) {
            var type = prepared.types[i];
            var count = prepared.counts[type] || 0;
            totalPoints += count;
            if (checked[type]) {
                activeTypes++;
                visiblePoints += count;
            }
        }
        state.barStat.textContent = visiblePoints + ' / ' + totalPoints;
        state.barActive.textContent = '启用 ' + activeTypes + ' 类';
    }

    function renderFavorites() {
        var row = state.favoritesRow;
        if (!row) return;
        var previousPositions = captureFavoritesPositions();
        var prepared = prepareData();
        var favorites = getRenderedFavorites(prepared);
        row.innerHTML = buildFavoritesPillsHtml(prepared, favorites);
        row.classList.toggle('map-favorites--preview', hasGapEntry(favorites));
        row.classList.toggle('map-favorites--illegal', state.drag.active && !state.drag.insideFavorites);
        syncFavoritesMotion(previousPositions);
    }

    function renderFullList() {
        var row = state.fullListRow;
        if (!row) return;
        var prepared = prepareData();
        row.innerHTML = buildFullListHtml(prepared, state.search);
        refreshCustomScrollbars(row.parentElement);
    }

    function applyDeckMode() {
        if (!state.deck) return;
        state.deck.classList.add('map-command-deck');
        state.deck.classList.toggle('command-deck--collapsed', state.deckMode === 'collapsed');
        state.deck.classList.toggle('command-deck--expanded', state.deckMode === 'expanded');

        var toggleBtn = state.deck.querySelector('[data-action="toggle"]');
        if (toggleBtn) {
            toggleBtn.textContent = state.deckMode === 'collapsed' ? '展开' : '收起';
        }

        if (state.fullListRow) {
            state.fullListRow.style.display = state.deckMode === 'expanded' ? '' : 'none';
        }
        refreshCustomScrollbars(state.deck);

        setTimeout(function() {
            if (state.map) state.map.invalidateSize();
        }, 300);
    }

    function refreshCustomScrollbars(scope) {
        if (typeof window !== 'undefined' && typeof window.PT_initCustomScrollbars === 'function') {
            window.PT_initCustomScrollbars(scope || state.deck || document);
        }
    }

    function setAllVisible(on) {
        var prepared = prepareData();
        ensureChecked(prepared);
        for (var i = 0; i < prepared.types.length; i++) {
            state.checked[prepared.types[i]] = on;
        }
        renderFavorites();
        renderFullList();
        updateCommandBarStat();
        updateLayers();
    }

    function setGroupVisible(category, on) {
        var prepared = prepareData();
        var types = prepared.groups[category] || [];
        ensureChecked(prepared);
        for (var i = 0; i < types.length; i++) {
            state.checked[types[i]] = on;
        }
        renderFavorites();
        renderFullList();
        updateCommandBarStat();
        updateLayers();
    }

    function toggleType(type) {
        var prepared = prepareData();
        ensureChecked(prepared);
        if (state.checked.hasOwnProperty(type)) {
            state.checked[type] = !state.checked[type];
        }
        renderFavorites();
        renderFullList();
        updateCommandBarStat();
        updateLayers();
    }

    function selectAll() {
        var prepared = prepareData();
        ensureChecked(prepared);
        for (var i = 0; i < prepared.types.length; i++) {
            state.checked[prepared.types[i]] = true;
        }
        renderFavorites();
        renderFullList();
        updateCommandBarStat();
        updateLayers();
    }

    function resetToDefaults() {
        var prepared = prepareData();
        ensureChecked(prepared);
        for (var i = 0; i < prepared.types.length; i++) {
            var type = prepared.types[i];
            state.checked[type] = prepared.defaultChecked[type] === true;
        }
        renderFavorites();
        renderFullList();
        updateCommandBarStat();
        updateLayers();
    }

    function clearLayerGroups(filter) {
        if (!state.map) return;
        Object.keys(state.layerGroups).forEach(function(type) {
            if (filter && !filter(type)) return;
            var group = state.layerGroups[type];
            if (group && state.map.hasLayer(group)) state.map.removeLayer(group);
            if (group && typeof group.clearLayers === 'function') group.clearLayers();
            delete state.layerGroups[type];
        });
        if (!filter) state.layerGroups = {};
    }

    function getZoomProgress(map, zoom) {
        var min = Number(map.getMinZoom());
        var max = Number(map.getMaxZoom());
        var current = Number(zoom == null ? map.getZoom() : zoom);
        if (!isFinite(min) || !isFinite(max) || max <= min) return 1;
        return Math.max(0, Math.min(1, (current - min) / (max - min)));
    }

    function getZoomPercent(map) {
        return Math.round(getZoomProgress(map) * 100);
    }

    function updateHudZoom() {
        if (!state.map) return;
        var percent = getZoomPercent(state.map);
        updateRegionLabelScale();
        if (!state.hudZoomText || !state.hudZoomFill) return;
        state.hudZoomText.textContent = percent + '%';
        state.hudZoomFill.style.width = percent + '%';
    }

    function updateRegionLabelScale() {
        if (!state.stage || !state.map) return;
        var core = getCore();
        var progress = getZoomProgress(state.map);
        var fontSize = core && typeof core.getRegionLabelFontSize === 'function'
            ? core.getRegionLabelFontSize(progress)
            : Math.round(10 + 8 * progress);
        state.stage.style.setProperty('--map-region-label-font-size', fontSize + 'px');
    }

    function updateHudCoords(latLng) {
        if (!state.map || !state.hudCoordText || !latLng) return;
        var core = getCore();
        var point = state.map.project(latLng, NATIVE_ZOOM);
        var coords = core && core.pixelToIpos ? core.pixelToIpos(point.x, point.y) : null;
        state.hudCoordText.textContent = coords ? ('X: ' + coords.x + ' / Y: ' + coords.y) : 'X: -- / Y: --';
    }

    function fitMapHome() {
        if (!state.map || !state.bounds) return;
        state.map.invalidateSize();
        state.map.fitBounds(state.bounds, { animate: false, padding: [0, 0] });
        state.map.setMinZoom(state.map.getZoom());
        state.map.setMaxZoom(state.map.getMinZoom() + ZOOM_TOTAL_RANGE);
        updateHudZoom();
    }

    function createHud(stage, map) {
        var hud = document.createElement('div');
        hud.className = 'map-hud';
        hud.innerHTML = [
            '<div class="map-hud__zoom">',
            '<span class="map-hud__label">Zoom</span>',
            '<div class="map-hud__bar"><i></i></div>',
            '<strong>0%</strong>',
            '</div>',
            '<div class="map-hud__coords">X: -- / Y: --</div>'
        ].join('');
        stage.appendChild(hud);
        state.hud = hud;
        state.hudZoomText = hud.querySelector('.map-hud__zoom strong');
        state.hudZoomFill = hud.querySelector('.map-hud__bar i');
        state.hudCoordText = hud.querySelector('.map-hud__coords');
        updateHudZoom();
        map.on('zoom zoomend', updateHudZoom);
        map.on('mousemove', function(event) {
            updateHudCoords(event.latlng);
        });
        map.on('mouseout', function() {
            if (state.hudCoordText) state.hudCoordText.textContent = 'X: -- / Y: --';
        });
    }

    function getZoomForProgress(map, progress) {
        var min = Number(map.getMinZoom());
        var max = Number(map.getMaxZoom());
        if (!isFinite(min) || !isFinite(max) || max <= min) return max;
        return min + (max - min) * progress;
    }

    function getClusterStage(progress) {
        var mapCore = getCore();
        if (mapCore && typeof mapCore.getClusterStage === 'function') {
            return mapCore.getClusterStage(progress, CLUSTER_STAGE_BREAKS);
        }
        if (progress >= CLUSTER_STAGE_BREAKS[3]) return 3;
        if (progress >= CLUSTER_STAGE_BREAKS[2]) return 2;
        if (progress >= CLUSTER_STAGE_BREAKS[1]) return 1;
        return 0;
    }

    function getCurrentClusterStage() {
        return getClusterStage(getZoomProgress(state.map));
    }

    function getZoomClusterUpdateFrameDelay() {
        var core = getCore();
        return core && typeof core.getZoomClusterUpdateFrameDelay === 'function'
            ? core.getZoomClusterUpdateFrameDelay()
            : 2;
    }

    function getLeafletMapAnimationOptions() {
        var core = getCore();
        return core && typeof core.getLeafletMapAnimationOptions === 'function'
            ? core.getLeafletMapAnimationOptions()
            : { zoomAnimation: false, fadeAnimation: false, markerZoomAnimation: false };
    }

    function getLeafletTileAnimationOptions() {
        var core = getCore();
        return core && typeof core.getLeafletTileAnimationOptions === 'function'
            ? core.getLeafletTileAnimationOptions()
            : { updateWhenZooming: true, updateWhenIdle: false, keepBuffer: 4 };
    }

    function scheduleClusterStageUpdate(stage) {
        if (!state.clusterEnabled) return;
        state.clusterUpdateToken += 1;
        var token = state.clusterUpdateToken;
        var frames = Math.max(0, Math.round(getZoomClusterUpdateFrameDelay()));
        function waitFrame(left) {
            if (token !== state.clusterUpdateToken) return;
            if (left <= 0) {
                if (state.map && state.clusterEnabled && stage === getCurrentClusterStage() && stage !== state.clusterStage) {
                    updateLayers({ stage: stage, clusterOnly: true });
                }
                return;
            }
            requestAnimationFrame(function() {
                waitFrame(left - 1);
            });
        }
        waitFrame(frames);
    }

    function createClusterMarker(cluster, type, category, prepared) {
        var latLng = state.map.unproject([cluster.px, cluster.py], NATIVE_ZOOM);
        var pointKeys = cluster.points.map(function(point) { return point.key; });
        var icon = prepared.icons[type] || '';
        var label = prepared.labels[type] || type;
        var title = label + ' x' + cluster.count;
        var html = '<div class="map-cluster-icon" title="' + escapeHtml(title) + '">';
        html += '<span class="map-cluster-icon__image"' + (icon ? ' style="background-image:url(\'' + escapeHtml(icon) + '\')"' : '') + '></span>';
        html += '<b>' + escapeHtml(cluster.count) + '</b>';
        html += '</div>';
        var marker = L.marker(latLng, {
            icon: L.divIcon({
                className: 'map-cluster-icon-wrap',
                html: html,
                iconSize: [42, 42],
                iconAnchor: [21, 21]
            })
        });
        marker.bindTooltip(title, {
            direction: 'top',
            offset: [0, -32],
            className: 'map-hover-tooltip',
            opacity: 1,
            sticky: false,
            interactive: false
        });
        marker.on('click', function() {
            var nextStage = Math.min(CLUSTER_STAGE_BREAKS.length - 1, state.clusterStage + 1);
            var nextZoom = getZoomForProgress(state.map, CLUSTER_STAGE_BREAKS[nextStage]);
            state.map.setView(latLng, nextZoom);
        });
        marker._ptType = type;
        marker._ptCategory = category;
        marker._ptPointKeys = pointKeys;
        return marker;
    }

    function shouldClusterType(type, category) {
        var core = getCore();
        var allowed = core && typeof core.shouldClusterMapType === 'function'
            ? core.shouldClusterMapType(type, category)
            : category !== 'Enemies';
        return state.clusterEnabled && allowed;
    }

    function getClusterStageRadii(type) {
        var core = getCore();
        return core && typeof core.getClusterStageRadii === 'function'
            ? core.getClusterStageRadii(type)
            : CLUSTER_STAGE_RADII;
    }

    function createLayerGroup() {
        return L.layerGroup();
    }

    function updateCommandBarButtons() {
        var clusterBtn = state.deck && state.deck.querySelector('[data-action="cluster"]');
        var viewportBtn = state.deck && state.deck.querySelector('[data-action="viewport"]');
        if (clusterBtn) clusterBtn.classList.toggle('command-bar__btn--active', state.clusterEnabled);
        if (viewportBtn) viewportBtn.classList.toggle('command-bar__btn--active', state.viewportOnly);
    }

    function getPointsInViewport() {
        if (!state.map) return state.markers;
        var bounds = state.map.getBounds();
        var pad = 0.3;
        var sw = bounds.getSouthWest();
        var ne = bounds.getNorthEast();
        var latPad = (ne.lat - sw.lat) * pad;
        var lngPad = (ne.lng - sw.lng) * pad;
        var padded = L.latLngBounds(
            L.latLng(sw.lat - latPad, sw.lng - lngPad),
            L.latLng(ne.lat + latPad, ne.lng + lngPad)
        );
        var visible = [];
        for (var i = 0; i < state.markers.length; i++) {
            if (padded.contains(state.markers[i].getLatLng())) {
                visible.push(state.markers[i]);
            }
        }
        return visible;
    }

    function captureLayerOrigins(filter) {
        var origins = {};
        if (!state.map || !state.map._loaded || !state.layersRendered) return origins;
        Object.keys(state.layerGroups).forEach(function(type) {
            if (filter && !filter(type)) return;
            var group = state.layerGroups[type];
            if (!group || typeof group.eachLayer !== 'function') return;
            group.eachLayer(function(layer) {
                if (!layer || !layer._ptPointKeys || typeof layer.getLatLng !== 'function') return;
                var point = state.map.latLngToLayerPoint(layer.getLatLng());
                for (var i = 0; i < layer._ptPointKeys.length; i++) {
                    origins[layer._ptPointKeys[i]] = { x: point.x, y: point.y, keys: layer._ptPointKeys.slice() };
                }
            });
        });
        return origins;
    }

    function captureLayerExits(filter) {
        var exits = [];
        if (!state.map || !state.map._loaded || !state.layersRendered) return exits;
        Object.keys(state.layerGroups).forEach(function(type) {
            if (filter && !filter(type)) return;
            var group = state.layerGroups[type];
            if (!group || typeof group.eachLayer !== 'function') return;
            group.eachLayer(function(layer) {
                if (!layer || !layer._ptPointKeys || !layer._icon || typeof layer.getLatLng !== 'function') return;
                var point = state.map.latLngToLayerPoint(layer.getLatLng());
                exits.push({
                    source: layer._icon,
                    keys: layer._ptPointKeys.slice(),
                    origin: { x: point.x, y: point.y }
                });
            });
        });
        return exits;
    }

    function captureLayerTargets(filter) {
        var targets = {};
        if (!state.map || !state.map._loaded) return targets;
        Object.keys(state.layerGroups).forEach(function(type) {
            if (filter && !filter(type)) return;
            var group = state.layerGroups[type];
            if (!group || typeof group.eachLayer !== 'function') return;
            group.eachLayer(function(layer) {
                if (!layer || !layer._ptPointKeys || typeof layer.getLatLng !== 'function') return;
                var point = state.map.latLngToLayerPoint(layer.getLatLng());
                for (var i = 0; i < layer._ptPointKeys.length; i++) {
                    targets[layer._ptPointKeys[i]] = { x: point.x, y: point.y, keys: layer._ptPointKeys.slice() };
                }
            });
        });
        return targets;
    }

    function getLayerInnerElement(layer) {
        if (!layer || !layer._icon) return null;
        return layer._icon.firstElementChild || layer._icon;
    }

    function animateLayerFromOrigin(layer, origins, mapCore) {
        if (!state.map || !state.map._loaded || !layer || !layer._ptPointKeys || typeof layer.getLatLng !== 'function') return;
        var element = getLayerInnerElement(layer);
        if (!element || typeof element.animate !== 'function') return;
        if (mapCore && typeof mapCore.shouldAnimateClusterEntry === 'function'
            && !mapCore.shouldAnimateClusterEntry(layer._ptPointKeys, origins)) return;
        var origin = mapCore && typeof mapCore.getClusterAnimationOrigin === 'function'
            ? mapCore.getClusterAnimationOrigin(layer._ptPointKeys, origins)
            : null;
        if (!origin) return;
        var target = state.map.latLngToLayerPoint(layer.getLatLng());
        var dx = origin.x - target.x;
        var dy = origin.y - target.y;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
        element.animate([
            { transform: 'translate(' + dx + 'px,' + dy + 'px)' },
            { transform: 'translate(0,0)' }
        ], {
            duration: CLUSTER_ANIMATION_MS,
            easing: 'cubic-bezier(.16,1,.3,1)',
            fill: 'both'
        });
    }

    function animateExitLayers(exits, targets, mapCore) {
        if (!exits || !targets || !state.map || !state.map.getPanes) return;
        var pane = state.map.getPanes().markerPane;
        for (var i = 0; i < exits.length; i++) {
            var exit = exits[i];
            var shouldAnimate = mapCore && typeof mapCore.shouldAnimateClusterExit === 'function'
                ? mapCore.shouldAnimateClusterExit(exit.keys, exit.origin, targets)
                : true;
            if (!shouldAnimate || !exit.source) continue;
            var target = mapCore && typeof mapCore.getClusterAnimationOrigin === 'function'
                ? mapCore.getClusterAnimationOrigin(exit.keys, targets)
                : null;
            if (!target) continue;
            var element = exit.source.cloneNode(true);
            element.classList.add('map-layer-ghost');
            element.style.position = 'absolute';
            element.style.left = '0';
            element.style.top = '0';
            element.style.marginLeft = exit.source.style.marginLeft || '';
            element.style.marginTop = exit.source.style.marginTop || '';
            element.style.transform = 'translate3d(' + Math.round(exit.origin.x) + 'px,' + Math.round(exit.origin.y) + 'px,0)';
            element.style.zIndex = String(Number(exit.source.style.zIndex || 0) + 2000);
            element.style.pointerEvents = 'none';
            pane.appendChild(element);
            if (typeof element.animate !== 'function') {
                if (element.parentNode) element.parentNode.removeChild(element);
                continue;
            }
            var dx = target.x - exit.origin.x;
            var dy = target.y - exit.origin.y;
            var frames = mapCore && typeof mapCore.getClusterMergeExitFrames === 'function'
                ? mapCore.getClusterMergeExitFrames(exit.origin.x, exit.origin.y, exit.origin.x + dx, exit.origin.y + dy)
                : null;
            if (!frames) {
                if (element.parentNode) element.parentNode.removeChild(element);
                continue;
            }
            var animation = element.animate(frames, {
                duration: CLUSTER_ANIMATION_MS,
                easing: 'cubic-bezier(.16,1,.3,1)',
                fill: 'forwards'
            });
            (function(element, anim) {
                anim.onfinish = function() {
                    if (element.parentNode) element.parentNode.removeChild(element);
                };
            })(element, animation);
        }
    }

    function animateCurrentLayers(origins, mapCore) {
        if (!state.map || !origins) return;
        Object.keys(state.layerGroups).forEach(function(type) {
            var group = state.layerGroups[type];
            if (!group || typeof group.eachLayer !== 'function') return;
            group.eachLayer(function(layer) {
                animateLayerFromOrigin(layer, origins, mapCore);
            });
        });
    }

    function updateLayers(options) {
        if (!state.map) return;
        var opts = options || {};
        var prepared = prepareData();
        var checked = ensureChecked(prepared);
        var mapCore = getCore();
        var clusterOnly = opts.clusterOnly === true;
        if (!clusterOnly) state.clusterUpdateToken += 1;
        var typeCategories = prepared.typeCategories || {};
        function shouldUpdateType(type) {
            if (!clusterOnly) return true;
            var category = typeCategories[type] || 'Other';
            return mapCore && typeof mapCore.shouldUpdateMapTypeOnZoomStage === 'function'
                ? mapCore.shouldUpdateMapTypeOnZoomStage(type, category, state.clusterEnabled)
                : state.clusterEnabled && !isRegionLabelType(type) && shouldClusterType(type, category);
        }
        var origins = opts.animate === false ? {} : captureLayerOrigins(shouldUpdateType);
        var exits = opts.animate === false ? [] : captureLayerExits(shouldUpdateType);
        clearLayerGroups(shouldUpdateType);
        state.clusterStage = opts.stage == null ? getCurrentClusterStage() : opts.stage;
        var markers = state.viewportOnly ? getPointsInViewport() : state.markers;
        var buckets = {};
        for (var i = 0; i < markers.length; i++) {
            var marker = markers[i];
            if (!shouldUpdateType(marker._ptType)) continue;
            if (!checked[marker._ptType]) continue;
            if (!state.layerGroups[marker._ptType]) {
                state.layerGroups[marker._ptType] = createLayerGroup();
            }
            if (isRegionLabelType(marker._ptType)) {
                state.layerGroups[marker._ptType].addLayer(marker);
                continue;
            }
            if (!shouldClusterType(marker._ptType, marker._ptCategory)) {
                state.layerGroups[marker._ptType].addLayer(marker);
                continue;
            }
            if (!buckets[marker._ptType]) buckets[marker._ptType] = [];
            buckets[marker._ptType].push(marker);
        }
        Object.keys(buckets).forEach(function(type) {
            var list = buckets[type];
            var models = list.map(function(marker) { return marker._ptModel; });
            var clusters = mapCore && typeof mapCore.buildStageClusters === 'function'
                ? mapCore.buildStageClusters(models, {
                    stage: state.clusterStage,
                    minZoom: state.map.getMinZoom(),
                    maxZoom: state.map.getMaxZoom(),
                    nativeZoom: NATIVE_ZOOM,
                    stageBreaks: CLUSTER_STAGE_BREAKS,
                    stageRadii: getClusterStageRadii(type)
                })
                : models.map(function(model) { return { px: model.px, py: model.py, count: 1, points: [model] }; });
            for (var j = 0; j < clusters.length; j++) {
                var cluster = clusters[j];
                if (cluster.count > 1) {
                    state.layerGroups[type].addLayer(createClusterMarker(cluster, type, list[0]._ptCategory, prepared));
                } else if (cluster.points[0] && cluster.points[0]._ptMarker) {
                    state.layerGroups[type].addLayer(cluster.points[0]._ptMarker);
                }
            }
        });
        Object.keys(state.layerGroups).forEach(function(type) {
            state.map.addLayer(state.layerGroups[type]);
        });
        if (opts.animate !== false) {
            requestAnimationFrame(function() {
                animateExitLayers(exits, captureLayerTargets(shouldUpdateType), mapCore);
                animateCurrentLayers(origins, mapCore);
            });
        }
        state.layersRendered = true;
    }

    function getDropTargets(favoritesRow) {
        var pills = favoritesRow.querySelectorAll('.pt-filter-chip--fav');
        var rect = favoritesRow.getBoundingClientRect();
        var scrollLeft = favoritesRow.scrollLeft;
        var targets = [];
        for (var i = 0; i < pills.length; i++) {
            var pillRect = pills[i].getBoundingClientRect();
            targets.push({
                center: pillRect.left - rect.left + pillRect.width / 2 + scrollLeft
            });
        }
        return targets;
    }

    function getRawDropIndex(favoritesRow, clientX, targets) {
        var rect = favoritesRow.getBoundingClientRect();
        var absX = clientX - rect.left + favoritesRow.scrollLeft;
        for (var i = 0; i < targets.length; i++) {
            if (absX < targets[i].center) return i;
        }
        return targets.length;
    }

    function getDropIndex(favoritesRow, clientX) {
        var targets = getDropTargets(favoritesRow);
        var rawIndex = getRawDropIndex(favoritesRow, clientX, targets);
        var previousIndex = state.drag.previewIndex;
        if (previousIndex < 0 || previousIndex > targets.length || rawIndex === previousIndex) {
            return rawIndex;
        }

        var rect = favoritesRow.getBoundingClientRect();
        var absX = clientX - rect.left + favoritesRow.scrollLeft;
        var dragWidth = state.drag.width || 68;
        var sticky = Math.max(DROP_STICKY_MIN, Math.min(DROP_STICKY_MAX, dragWidth * DROP_STICKY_RATIO));
        var boundaryTarget = rawIndex > previousIndex ? targets[rawIndex - 1] : targets[rawIndex];
        if (!boundaryTarget) return rawIndex;
        if (rawIndex > previousIndex && absX >= boundaryTarget.center + sticky) return rawIndex;
        if (rawIndex < previousIndex && absX <= boundaryTarget.center - sticky) return rawIndex;
        return previousIndex;
    }

    function isPointInRect(clientX, clientY, rect) {
        return rect && clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
    }

    function isInsideFavoriteDropZone(clientX, clientY) {
        var row = state.favoritesRow;
        if (!row) return false;
        var bar = row.closest('.command-bar');
        if (!bar) return false;
        return isPointInRect(clientX, clientY, bar.getBoundingClientRect());
    }

    function applyPreviewFavorites(index) {
        var drag = state.drag;
        if (!drag.type) return;
        if (drag.previewIndex === index && state.previewFavorites) return;
        var prepared = prepareData();
        var preview = buildPreviewFavorites(drag.type, drag.source, index, prepared);
        drag.previewIndex = index;
        state.previewFavorites = preview;
        renderFavorites();
        syncFavoritesMotion();
    }

    function updateFavoritesIllegalState() {
        if (!state.favoritesRow) return;
        state.favoritesRow.classList.toggle('map-favorites--illegal', state.drag.active && !state.drag.insideFavorites);
        if (state.deck) {
            state.deck.classList.toggle('map-command-deck--dragging', state.drag.active);
        }
    }

    function setGlobalDragCursor(illegal) {
        if (!document || !document.body) return;
        document.body.style.cursor = illegal ? 'not-allowed' : '';
    }

    function removeFloatingChip() {
        var floatingEl = state.drag.floatingEl;
        if (floatingEl && floatingEl.parentNode) {
            floatingEl.parentNode.removeChild(floatingEl);
        }
        state.drag.floatingEl = null;
    }

    function updateFloatingChipPosition(clientX, clientY) {
        var drag = state.drag;
        if (!drag.floatingEl) return;
        drag.floatingEl.style.transform = 'translate3d(' + Math.round(clientX - drag.offsetX) + 'px,' + Math.round(clientY - drag.offsetY) + 'px,0)';
    }

    function createFloatingChip(element) {
        var rect = element.getBoundingClientRect();
        var clone = element.cloneNode(true);
        clone.className = element.className + ' map-floating-chip';
        clone.style.width = rect.width + 'px';
        clone.style.height = rect.height + 'px';
        clone.style.transform = 'translate3d(' + Math.round(rect.left) + 'px,' + Math.round(rect.top) + 'px,0)';
        document.body.appendChild(clone);
        return { element: clone, rect: rect };
    }

    function syncFavoritesMotion(previousPositions) {
        var row = state.favoritesRow;
        if (!row) return;
        var nodes = row.querySelectorAll('.pt-filter-chip--fav, .map-favorites-gap');
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            var key = node.getAttribute('data-motion-key');
            if (!key) continue;
            var previous = previousPositions && previousPositions[key];
            if (!previous) continue;
            var currentLeft = node.offsetLeft;
            var currentTop = node.offsetTop;
            var deltaX = previous.left - currentLeft;
            var deltaY = previous.top - currentTop;
            if (!deltaX && !deltaY) continue;
            node.style.transition = 'none';
            node.style.transform = 'translate3d(' + deltaX + 'px,' + deltaY + 'px,0)';
            node.offsetWidth;
            requestAnimationFrame(function(target) {
                return function() {
                    target.style.transition = '';
                    target.style.transform = 'translate3d(0,0,0)';
                };
            }(node));
        }
    }

    function clearPointerListeners() {
        var drag = state.drag;
        if (drag.moveHandler) window.removeEventListener('pointermove', drag.moveHandler);
        if (drag.upHandler) window.removeEventListener('pointerup', drag.upHandler);
        if (drag.cancelHandler) window.removeEventListener('pointercancel', drag.cancelHandler);
        drag.moveHandler = null;
        drag.upHandler = null;
        drag.cancelHandler = null;
    }

    function resetDragState() {
        clearPointerListeners();
        removeFloatingChip();
        clearPreviewFavorites();
        setGlobalDragCursor(false);
        state.drag.active = false;
        state.drag.pending = false;
        state.drag.pointerId = null;
        state.drag.source = null;
        state.drag.type = null;
        state.drag.sourceEl = null;
        state.drag.startX = 0;
        state.drag.startY = 0;
        state.drag.clientX = 0;
        state.drag.clientY = 0;
        state.drag.offsetX = 0;
        state.drag.offsetY = 0;
        state.drag.width = 0;
        state.drag.height = 0;
        state.drag.insideFavorites = false;
        state.drag.previewIndex = -1;
        updateFavoritesIllegalState();
    }

    function updateDragPreview(clientX, clientY) {
        var drag = state.drag;
        if (!drag.active) return;
        drag.clientX = clientX;
        drag.clientY = clientY;
        updateFloatingChipPosition(clientX, clientY);
        drag.insideFavorites = isInsideFavoriteDropZone(clientX, clientY);
        updateFavoritesIllegalState();
        setGlobalDragCursor(!drag.insideFavorites);
        if (drag.insideFavorites) {
            var index = getDropIndex(state.favoritesRow, clientX);
            applyPreviewFavorites(index);
        } else {
            clearPreviewFavorites();
            renderFavorites();
        }
    }

    function commitDragResult(clientX, clientY) {
        var drag = state.drag;
        if (!drag.active || !drag.type) return;
        var prepared = prepareData();
        var favorites = getFavoriteOrder(prepared);
        if (drag.insideFavorites) {
            var targetIndex = drag.previewIndex >= 0 ? drag.previewIndex : getDropIndex(state.favoritesRow, clientX);
            if (drag.source === 'favorite') {
                reorderFavorite(drag.type, targetIndex);
            } else {
                var added = addFavorite(drag.type, targetIndex);
                if (!added) {
                    showDuplicateTooltip(clientX, clientY, prepared.labels[drag.type] || drag.type);
                }
            }
        } else if (drag.source === 'favorite' && favorites.indexOf(drag.type) !== -1) {
            removeFavorite(drag.type);
        }
    }

    function finishPointerDrag(event) {
        if (!state.drag.pointerId || event.pointerId !== state.drag.pointerId) return;
        var wasActive = state.drag.active;
        if (wasActive) {
            commitDragResult(event.clientX, event.clientY);
        }
        resetDragState();
        if (wasActive) {
            renderFavorites();
            renderFullList();
        }
    }

    function updatePointerDrag(event) {
        if (!state.drag.pointerId || event.pointerId !== state.drag.pointerId) return;
        if (!state.drag.pending && !state.drag.active) return;
        if (!state.drag.active) {
            var dx = event.clientX - state.drag.startX;
            var dy = event.clientY - state.drag.startY;
            if (Math.sqrt(dx * dx + dy * dy) < DRAG_START_THRESHOLD) return;
            state.drag.active = true;
            state.drag.pending = false;
            state.drag.suppressClick = true;
            var floating = createFloatingChip(state.drag.sourceEl);
            state.drag.floatingEl = floating.element;
            state.drag.width = floating.rect.width;
            state.drag.height = floating.rect.height;
            state.drag.offsetX = event.clientX - floating.rect.left;
            state.drag.offsetY = event.clientY - floating.rect.top;
            if (state.drag.source === 'favorite') {
                applyPreviewFavorites(getFavoriteOrder(prepareData()).indexOf(state.drag.type));
            }
        }
        updateDragPreview(event.clientX, event.clientY);
    }

    function startPointerDrag(event, source, type, element) {
        if (!element || event.button !== 0) return;
        resetDragState();
        var drag = state.drag;
        drag.pending = true;
        drag.pointerId = event.pointerId;
        drag.source = source;
        drag.type = type;
        drag.sourceEl = element;
        drag.startX = event.clientX;
        drag.startY = event.clientY;
        drag.clientX = event.clientX;
        drag.clientY = event.clientY;
        drag.moveHandler = updatePointerDrag;
        drag.upHandler = finishPointerDrag;
        drag.cancelHandler = finishPointerDrag;
        window.addEventListener('pointermove', drag.moveHandler);
        window.addEventListener('pointerup', drag.upHandler);
        window.addEventListener('pointercancel', drag.cancelHandler);
        event.preventDefault();
    }

    function addFavorite(type, atIndex) {
        var favorites = getFavoriteOrder(prepareData());
        if (favorites.indexOf(type) !== -1) return false;
        var idx = typeof atIndex === 'number' ? atIndex : favorites.length;
        if (idx < 0) idx = 0;
        if (idx > favorites.length) idx = favorites.length;
        favorites.splice(idx, 0, type);
        setStoredFavorites(favorites);
        clearPreviewFavorites();
        renderFavorites();
        renderFullList();
        return true;
    }

    function removeFavorite(type) {
        var favorites = getFavoriteOrder(prepareData());
        var idx = favorites.indexOf(type);
        if (idx === -1) return;
        favorites.splice(idx, 1);
        setStoredFavorites(favorites);
        clearPreviewFavorites();
        renderFavorites();
        renderFullList();
    }

    function reorderFavorite(type, toIndex) {
        var favorites = getFavoriteOrder(prepareData());
        var fromIdx = favorites.indexOf(type);
        if (fromIdx === -1) return;
        favorites.splice(fromIdx, 1);
        var insertAt = toIndex;
        if (fromIdx < insertAt) insertAt--;
        if (insertAt < 0) insertAt = 0;
        if (insertAt > favorites.length) insertAt = favorites.length;
        favorites.splice(insertAt, 0, type);
        setStoredFavorites(favorites);
        clearPreviewFavorites();
        renderFavorites();
        renderFullList();
    }

    function switchActiveMap(mapId) {
        if (!mapId || mapId === getActiveMapId()) return;
        state.activeMapId = mapId;
        state.prepared = null;
        state.checked = null;
        state.layerGroups = {};
        state.markers = [];
        state.bounds = null;
        state.layersRendered = false;
        state.clusterStage = 0;
        if (state.customWheelZoom) {
            state.customWheelZoom();
            state.customWheelZoom = null;
        }
        if (state.map) {
            state.map.remove();
            state.map = null;
        }
        state.mapOverlay = null;
        state.mapPreviewOverlay = null;
        state.wheelLoadShedding = false;
        renderFavorites();
        renderFullList();
        updateCommandBarStat();
        updateCommandBarButtons();
        var switchRoot = state.deck && state.deck.querySelector('#map-switch');
        if (switchRoot) switchRoot.innerHTML = buildMapSwitchHtml().replace(/^<div class="map-switch" id="map-switch">|<\/div>$/g, '');
        createMap();
    }

    function bindCommandDeckEvents() {
        if (!state.deck) return;

        if (state.searchInput) {
            state.searchInput.addEventListener('input', function() {
                clearTimeout(state.searchTimer);
                var value = state.searchInput.value;
                state.searchTimer = setTimeout(function() {
                    state.search = value.trim();
                    renderFullList();
                    updateLayers();
                }, 100);
            });
        }

        state.deck.addEventListener('pointerdown', function(event) {
            var pill = event.target.closest('[data-pill-type][data-drag-source]');
            if (!pill) return;
            startPointerDrag(event, pill.getAttribute('data-drag-source'), pill.getAttribute('data-pill-type'), pill);
        });

        state.deck.addEventListener('click', function(event) {
            if (state.drag.suppressClick) {
                state.drag.suppressClick = false;
                event.preventDefault();
                event.stopPropagation();
                return;
            }
            var target = event.target;
            if (!target) return;

            var mapBtn = target.closest('[data-map-id]');
            if (mapBtn) {
                switchActiveMap(mapBtn.getAttribute('data-map-id'));
                return;
            }

            var pill = target.closest('[data-pill-type]');
            if (pill) {
                toggleType(pill.getAttribute('data-pill-type'));
                return;
            }

            var actionBtn = target.closest('[data-action]');
            if (actionBtn) {
                switch (actionBtn.getAttribute('data-action')) {
                    case 'selectall':
                        selectAll();
                        break;
                    case 'reset':
                        resetToDefaults();
                        break;
                    case 'cluster':
                        state.clusterEnabled = !state.clusterEnabled;
                        writeClusterEnabled(state.clusterEnabled);
                        updateLayers();
                        updateCommandBarButtons();
                        break;
                    case 'viewport':
                        state.viewportOnly = !state.viewportOnly;
                        updateLayers();
                        updateCommandBarButtons();
                        break;
                    case 'toggle':
                        state.deckMode = state.deckMode === 'collapsed' ? 'expanded' : 'collapsed';
                        applyDeckMode();
                        break;
                }
                return;
            }

            var groupBtn = target.closest('[data-group-action]');
            if (groupBtn) {
                setGroupVisible(groupBtn.getAttribute('data-group-cat'), groupBtn.getAttribute('data-group-action') === 'all');
            }
        });
    }

    function createMarker(model, map) {
        var latLng = map.unproject([model.px, model.py], NATIVE_ZOOM);
        var marker;
        if (model.regionLabel) {
            var core = getCore();
            var zIndexOffset = core && typeof core.getRegionLabelZIndexOffset === 'function'
                ? core.getRegionLabelZIndexOffset()
                : 10000;
            marker = L.marker(latLng, {
                interactive: false,
                keyboard: false,
                zIndexOffset: zIndexOffset,
                icon: L.divIcon({
                    className: 'map-region-label-wrap',
                    html: '<div class="map-region-label">' + escapeHtml(model.label || '') + '</div>',
                    iconSize: [1, 1],
                    iconAnchor: [0, 0]
                })
            });
        } else if (model.type === 'Alpha Pal') {
            var palIcon = model.icon || '';
            var slug = model.slug || (model.label || '').replace(/^BOSS_/i, '');
            try {
                var palCore = window.PT_PALDEX_CORE;
                if (palCore && palCore.getBySlug) {
                    var pal = palCore.getBySlug(slug);
                    if (pal && pal.icon) palIcon = pal.icon;
                }
            } catch(e) {}
            var hd = getPalHeadshot(slug);
            if (hd) palIcon = hd;
            var alphaHtml = '<div style="width:36px;height:36px;border-radius:50%;overflow:hidden;border:2px solid #ffcc00;box-shadow:0 0 12px rgba(255,204,0,0.4);background:rgba(0,0,0,0.3)">';
            if (palIcon) alphaHtml += '<img src="' + escapeHtml(palIcon) + '" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display=\'none\'">';
            alphaHtml += '</div>';
            marker = L.marker(latLng, {
                icon: L.divIcon({
                    className: '',
                    html: alphaHtml,
                    iconSize: [36, 36],
                    iconAnchor: [18, 18]
                })
            });
        } else if (model.icon) {
            var markerClass = model.markerClass ? ' ' + model.markerClass : '';
            var innerWidth = model.width;
            var innerHeight = model.height;
            var html = [
                '<div class="map-leaflet-pin', markerClass, '" style="width:', model.width, 'px;height:', model.height, 'px;">',
                '<img class="map-pin-img" src="', escapeHtml(model.icon), '" style="width:', innerWidth, 'px;height:', innerHeight, 'px;">',
                '</div>'
            ].join('');
            marker = L.marker(latLng, {
                icon: L.divIcon({
                    className: 'map-div-icon-wrap',
                    html: html,
                    iconSize: [model.width, model.height],
                    iconAnchor: [model.width / 2, model.height / 2]
                })
            });
        } else {
            marker = L.circleMarker(latLng, {
                radius: 5,
                color: '#78dcff',
                fillColor: '#78dcff',
                fillOpacity: 0.8,
                weight: 1
            });
        }
        if (!model.regionLabel) {
            marker.bindTooltip(model.tooltip, {
                direction: 'top',
                offset: [0, -Math.max(14, Math.round(model.height / 2) + 10)],
                className: 'map-hover-tooltip',
                opacity: 1,
                sticky: false,
                interactive: false
            });
            marker._ptTooltipHtml = model.tooltip;
        }
        marker._ptType = model.type;
        marker._ptCategory = model.category;
        marker._ptModel = model;
        marker._ptPointKeys = [model.key];
        model._ptMarker = marker;
        return marker;
    }

    function createMap() {
        var prepared = prepareData();
        var stage = state.stage;
        if (!stage || typeof L === 'undefined') return;

        stage.innerHTML = '';
        var mapOptions = Object.assign({
            crs: L.CRS.Simple,
            minZoom: -4,
            maxZoom: 8,
            zoomSnap: 0,
            scrollWheelZoom: false,
            zoomDelta: ZOOM_STEP_SIZE,
            wheelPxPerZoomLevel: computeWheelPxPerZoomStep(),
            maxBoundsViscosity: 1,
            zoomControl: false,
            attributionControl: false
        }, getLeafletMapAnimationOptions());
        var map = L.map(stage, mapOptions);

        var southWest = map.unproject([0, PIXEL_SIZE], NATIVE_ZOOM);
        var northEast = map.unproject([PIXEL_SIZE, 0], NATIVE_ZOOM);
        var bounds = L.latLngBounds(southWest, northEast);
        state.bounds = bounds;

        var tileOptions = Object.assign({
            maxNativeZoom: 4,
            minNativeZoom: 1,
            tileSize: 512,
            noWrap: true,
            bounds: bounds
        }, getLeafletTileAnimationOptions());
        L.tileLayer(getTileUrl('{z}', '{x}', '{y}'), tileOptions).addTo(map);
        map.on('move zoom zoomend moveend', function() {
            scheduleViewportTilePreload(map);
        });

        L.control.zoom({ position: 'topright' }).addTo(map);
        map.setMaxBounds(bounds);
        fitMapHome();

        state.map = map;
        state.customWheelZoom = installCustomWheelZoom(map);
        state.markers = prepared.markerModels.map(function(model) {
            return createMarker(model, map);
        });
        createHud(stage, map);

        updateLayers();
        if (!palDataLoaded) {
            ensurePalData().then(function() {
                if (state.map) updateBossMarkers();
            }).catch(function(){});
        } else if (Object.keys(palDataById).length > 0) {
            updateBossMarkers();
        }
        setTimeout(function() {
            fitMapHome();
        }, 80);
    }

    function bind(root) {
        if (!root) return;
        destroy();

        ensurePalData();

        state.root = root;
        state.stage = root.querySelector('#map-stage');
        state.deck = root.querySelector('#map-command-deck');
        state.search = '';
        state.clusterEnabled = readClusterEnabled();
        state.deckMode = 'collapsed';
        state.layersRendered = false;

        if (!state.stage || !state.deck) return;

        state.favoritesRow = state.deck.querySelector('#command-favorites');
        state.searchInput = state.deck.querySelector('#map-search');
        state.fullListRow = state.deck.querySelector('#command-full-list');
        state.barStat = state.deck.querySelector('#map-bar-stat');
        state.barActive = state.deck.querySelector('#map-bar-active');

        renderFavorites();
        renderFullList();
        updateCommandBarStat();
        updateCommandBarButtons();
        applyDeckMode();
        bindCommandDeckEvents();
        createMap();

        if (typeof ResizeObserver === 'function') {
            state.resizeObserver = new ResizeObserver(function() {
                if (!state.map) return;
                if (getZoomPercent(state.map) === 0) {
                    fitMapHome();
                } else {
                    state.map.invalidateSize();
                }
            });
            state.resizeObserver.observe(state.stage);
        }

        if (state.map) {
            var _moveTimer = 0;
            state.map.on('zoomend', function() {
                var nextStage = getCurrentClusterStage();
                if (nextStage !== state.clusterStage) scheduleClusterStageUpdate(nextStage);
            });
            state.map.on('move', function() {
                if (!state.viewportOnly) return;
                if (_moveTimer) return;
                _moveTimer = setTimeout(function() {
                    _moveTimer = 0;
                    updateLayers();
                }, 100);
            });
            state.map.on('moveend', function() {
                if (_moveTimer) { clearTimeout(_moveTimer); _moveTimer = 0; }
                if (state.viewportOnly) updateLayers();
            });
        }
    }

    function destroy() {
        clearTimeout(state.searchTimer);
        state.searchTimer = 0;
        state.clusterUpdateToken += 1;
        if (state.tilePreloadFrame !== null && typeof cancelAnimationFrame === 'function') {
            cancelAnimationFrame(state.tilePreloadFrame);
            state.tilePreloadFrame = null;
        }

        if (state.resizeObserver) {
            state.resizeObserver.disconnect();
            state.resizeObserver = null;
        }

        if (state.customWheelZoom) {
            state.customWheelZoom();
            state.customWheelZoom = null;
        }

        if (state.map) {
            state.map.remove();
        }

        state.root = null;
        state.stage = null;
        state.deck = null;
        state.map = null;
        state.layerGroups = {};
        state.markers = [];
        state.bounds = null;
        state.hud = null;
        state.hudZoomText = null;
        state.hudZoomFill = null;
        state.hudCoordText = null;
        state.favoritesRow = null;
        state.searchInput = null;
        state.fullListRow = null;
        state.barStat = null;
        state.barActive = null;
        state.search = '';
        state.favorites = null;
        state.previewFavorites = null;
        state.clusterStage = 0;
        state.layersRendered = false;
        resetDragState();
    }

    return {
        render: render,
        bind: bind,
        destroy: destroy,
        preload: preload
    };
})();

if (typeof window !== 'undefined') window.PT_MAP_WEB = PT_MAP_WEB;
