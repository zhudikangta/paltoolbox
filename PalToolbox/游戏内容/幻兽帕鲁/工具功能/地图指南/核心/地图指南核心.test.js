var assert = require('assert');
var fs = require('fs');
var path = require('path');
var vm = require('vm');
var core = require('./地图指南核心.js');

function getLegacyStageZoom(stage, minZoom, maxZoom, breaks) {
    var list = breaks || [0, 0.2, 0.4, 0.6];
    var min = Number(minZoom);
    var max = Number(maxZoom);
    var index = Math.max(0, Math.min(list.length - 1, Number(stage) || 0));
    if (!isFinite(min) || !isFinite(max) || max <= min) return max;
    return min + (max - min) * (list[index] || 0);
}

function buildLegacyStageClusters(points, options) {
    var opts = options || {};
    var radii = opts.stageRadii || [260, 140, 52, 1];
    var stage = Math.max(0, Math.min(radii.length - 1, Number(opts.stage) || 0));
    var radius = Number(radii[stage]);
    if (!isFinite(radius) || radius < 1) radius = 1;
    var stageZoom = getLegacyStageZoom(stage, opts.minZoom, opts.maxZoom, opts.stageBreaks);
    var nativeZoom = Number(opts.nativeZoom);
    if (!isFinite(nativeZoom)) nativeZoom = 8;
    var scale = Math.pow(2, stageZoom - nativeZoom);
    var scaledRadius = radius / (!isFinite(scale) || scale <= 0 ? 1 : scale);
    var clusters = [];

    (points || []).forEach(function(point) {
        var px = Number(point && point.px);
        var py = Number(point && point.py);
        if (!isFinite(px) || !isFinite(py)) return;
        var match = null;
        for (var i = 0; i < clusters.length; i++) {
            var dx = px - clusters[i].px;
            var dy = py - clusters[i].py;
            if (dx * dx + dy * dy <= scaledRadius * scaledRadius) {
                match = clusters[i];
                break;
            }
        }
        if (match) {
            match.points.push(point);
            match.count = match.points.length;
            match.px += (px - match.px) / match.count;
            match.py += (py - match.py) / match.count;
        } else {
            clusters.push({ px: px, py: py, count: 1, points: [point] });
        }
    });

    return clusters;
}

function simplifyClusters(clusters) {
    return clusters.map(function(cluster) {
        return {
            px: cluster.px,
            py: cluster.py,
            count: cluster.count,
            keys: cluster.points.map(function(point) { return point.key || point.id; })
        };
    });
}

var models = [
    { id: 'a', px: 0, py: 0 },
    { id: 'b', px: 20000, py: 0 }
];

var early = core.buildStageClusters(models, {
    stage: 0,
    minZoom: -4,
    maxZoom: 8,
    nativeZoom: 8,
    stageBreaks: [0, 0.2, 0.4, 0.6],
    stageRadii: [260, 140, 52, 1]
});

assert.strictEqual(early.length, 1, 'stage 0 keeps nearby points clustered');
assert.strictEqual(early[0].count, 2, 'stage 0 cluster contains both points');

var laterSameDistance = core.buildStageClusters(models, {
    stage: 2,
    minZoom: -4,
    maxZoom: 8,
    nativeZoom: 8,
    stageBreaks: [0, 0.2, 0.4, 0.6],
    stageRadii: [260, 140, 52, 1]
});

assert.strictEqual(laterSameDistance.length, 2, 'stage 2 can split the same points after a stage boundary');
assert.strictEqual(core.getClusterStage(0.19999, [0, 0.2, 0.4, 0.6]), 0, 'progress before 20 percent stays in stage 0');
assert.strictEqual(core.getClusterStage(0.2 - 1e-12, [0, 0.2, 0.4, 0.6]), 1, 'floating point noise at the 20 percent step still enters stage 1');
assert.strictEqual(core.getClusterStage(0.2, [0, 0.2, 0.4, 0.6]), 1, 'progress at 20 percent enters stage 1');
assert.strictEqual(core.getClusterStage(0.39999, [0, 0.2, 0.4, 0.6]), 1, 'progress before 40 percent stays in stage 1');
assert.strictEqual(core.getClusterStage(0.4 - 1e-12, [0, 0.2, 0.4, 0.6]), 2, 'floating point noise at the 40 percent step still enters stage 2');
assert.strictEqual(core.getClusterStage(0.4, [0, 0.2, 0.4, 0.6]), 2, 'progress at 40 percent enters stage 2');
assert.strictEqual(core.getClusterStage(0.59999, [0, 0.2, 0.4, 0.6]), 2, 'progress before 60 percent stays in stage 2');
assert.strictEqual(core.getClusterStage(0.6 - 1e-12, [0, 0.2, 0.4, 0.6]), 3, 'floating point noise at the 60 percent step still enters stage 3');
assert.strictEqual(core.getClusterStage(0.6, [0, 0.2, 0.4, 0.6]), 3, 'progress at 60 percent enters stage 3');
var centerMovesAcrossCell = [
    { id: 'a', px: 9, py: 0 },
    { id: 'b', px: 19, py: 0 },
    { id: 'c', px: 21, py: 0 }
];
var centerMoveOptions = {
    stage: 0,
    minZoom: 8,
    maxZoom: 9,
    nativeZoom: 8,
    stageBreaks: [0, 0.2, 0.4, 0.6],
    stageRadii: [10, 1, 1, 1]
};
assert.deepStrictEqual(
    simplifyClusters(core.buildStageClusters(centerMovesAcrossCell, centerMoveOptions)),
    simplifyClusters(buildLegacyStageClusters(centerMovesAcrossCell, centerMoveOptions)),
    'moving a cluster center across a cell keeps later neighbor lookup identical'
);

var earliestCandidateWins = [
    { id: 'first', px: 0, py: 0 },
    { id: 'second', px: 20, py: 0 },
    { id: 'between', px: 10, py: 0 }
];
assert.deepStrictEqual(
    simplifyClusters(core.buildStageClusters(earliestCandidateWins, centerMoveOptions)),
    simplifyClusters(buildLegacyStageClusters(earliestCandidateWins, centerMoveOptions)),
    'spatial lookup keeps the earliest matching cluster instead of choosing the nearest one'
);

var sparsePoints = [];
for (var sparseIndex = 0; sparseIndex < 4000; sparseIndex++) {
    sparsePoints.push({ id: 'sparse-' + sparseIndex, px: sparseIndex * 3, py: sparseIndex % 7 });
}
var sparseClusters = core.buildStageClusters(sparsePoints, {
    stage: 3,
    minZoom: 8,
    maxZoom: 9,
    nativeZoom: 8,
    stageBreaks: [0, 0.2, 0.4, 0.6],
    stageRadii: [1, 1, 1, 1]
});
assert.strictEqual(sparseClusters.length, sparsePoints.length, 'large sparse inputs remain fully split');

var origin = core.getClusterAnimationOrigin(['a', 'b'], {
    a: { x: 10, y: 20 },
    b: { x: 30, y: 60 }
});

assert.deepStrictEqual(origin, { x: 20, y: 40 }, 'cluster animation starts from the average previous child position');

assert.strictEqual(core.shouldAnimateClusterExit(['a'], { x: 10, y: 20 }, {
    'a': { keys: ['a'], x: 10.2, y: 20.3 }
}), false, 'unchanged single point should not create a fading clone');

assert.strictEqual(core.shouldAnimateClusterExit(['a', 'b'], { x: 20, y: 40 }, {
    'a': { keys: ['a'], x: 10, y: 20 },
    'b': { keys: ['b'], x: 30, y: 60 }
}), false, 'cluster split should not create a fading exit clone');

assert.strictEqual(core.shouldAnimateClusterExit(['a'], { x: 10, y: 20 }, {
    'a': { keys: ['a', 'b'], x: 20, y: 40 }
}), true, 'cluster merge moves the old point into the new cluster');

assert.strictEqual(core.shouldAnimateClusterEntry(['a'], {
    'a': { keys: ['a', 'b'], x: 20, y: 40 }
}), true, 'cluster split moves the new point out from the old cluster');

assert.strictEqual(core.shouldAnimateClusterEntry(['a', 'b'], {
    'a': { keys: ['a'], x: 10, y: 20 },
    'b': { keys: ['b'], x: 30, y: 60 }
}), false, 'cluster merge does not also animate the new cluster');

assert.deepStrictEqual(core.getClusterMergeExitFrames(10, 20, 30, 40), [
    { transform: 'translate3d(10px,20px,0) scale(1)', opacity: 1, offset: 0 },
    { transform: 'translate3d(19px,29px,0) scale(0.96)', opacity: 1, offset: 0.45 },
    { transform: 'translate3d(26px,36px,0) scale(0.78)', opacity: 0.25, offset: 0.82 },
    { transform: 'translate3d(30px,40px,0) scale(0.72)', opacity: 0, offset: 1 }
], 'merging points fade before their shadows overlap at the cluster center');

assert.strictEqual(core.shouldAnimateClusterExit(['a', 'b'], { x: 20, y: 40 }, {
    'a': { keys: ['a', 'b'], x: 20.1, y: 40.2 },
    'b': { keys: ['a', 'b'], x: 20.1, y: 40.2 }
}), false, 'unchanged cluster should not create a fading clone');

assert.strictEqual(core.isRegionLabelType('Region'), true, 'Region is rendered as a text label');
assert.strictEqual(core.isRegionLabelType('Fast Travel'), false, 'other map types keep normal marker behavior');
assert.strictEqual(core.getRegionLabelFontSize(0), 10, 'region label text stays small when zoomed out');
assert.strictEqual(core.getRegionLabelFontSize(1), 18, 'region label text is capped when zoomed in');
assert.strictEqual(core.getRegionLabelFontSize(2), 18, 'region label text does not grow without limit');
assert.ok(core.getRegionLabelZIndexOffset() >= 10000, 'region label stays above normal map icons');

assert.strictEqual(core.getClusterProfile('Fast Travel'), 'never', 'fast travel is always visible');
assert.strictEqual(core.getClusterProfile('Cave Entrance'), 'light', 'cave entrances use light clustering');
assert.strictEqual(core.getClusterProfile('Treasure'), 'normal', 'treasure keeps normal clustering');
assert.strictEqual(core.getClusterProfile('Ore'), 'heavy', 'ore uses heavy clustering');
assert.deepStrictEqual(core.getClusterStageRadii('Cave Entrance'), [120, 0, 0, 1], 'light clustering only clusters at the lowest zoom stage');
assert.deepStrictEqual(core.getClusterStageRadii('Treasure'), [260, 64, 0, 1], 'normal clustering loosens after 20 percent and splits after 40 percent');
assert.deepStrictEqual(core.getClusterStageRadii('Ore'), [420, 220, 84, 1], 'heavy clustering uses larger radii');
assert.strictEqual(core.shouldClusterMapType('Alpha Pal', 'Enemies'), false, 'important enemies stay unclustered');
assert.strictEqual(core.shouldClusterMapType('Cave Entrance', 'Enemies'), true, 'light enemies can cluster');
assert.ok(core.getZoomClusterUpdateFrameDelay() >= 2, 'zoom stage updates wait for map zoom settling');

assert.deepStrictEqual(core.getLeafletMapAnimationOptions(), {
    zoomAnimation: true,
    fadeAnimation: false,
    markerZoomAnimation: true
}, 'leaflet keeps zoom continuity while disabling tile fade ghosting');

assert.deepStrictEqual(core.getLeafletTileAnimationOptions(), {
    updateWhenZooming: true,
    updateWhenIdle: false,
    keepBuffer: 6
}, 'tile layer keeps updating while panning and keeps enough nearby tiles');

assert.deepStrictEqual(core.getTilePreloadOptions(), {
    maxNativeZoom: 4,
    panBuffer: 2,
    zoomProgressThreshold: 0.55
}, 'high zoom panning preloads nearby native tiles before they enter the viewport');

assert.strictEqual(core.shouldUpdateMapTypeOnZoomStage('Fast Travel', 'Locations', true), false, 'zoom stage update skips never-cluster types');
assert.strictEqual(core.shouldUpdateMapTypeOnZoomStage('Treasure', 'Resource', true), true, 'zoom stage update includes clustered types');
assert.strictEqual(core.shouldUpdateMapTypeOnZoomStage('Treasure', 'Resource', false), false, 'zoom stage update skips every type when clustering is disabled');

var mapDataPath = path.resolve(__dirname, '../../../../幻兽帕鲁1.0/数据包/地图数据.js');
var mapDataContext = { window: {} };
vm.createContext(mapDataContext);
vm.runInContext(fs.readFileSync(mapDataPath, 'utf8'), mapDataContext);
var mapData = mapDataContext.PT_MAP_DATA || mapDataContext.window.PT_MAP_DATA;
var previousWindow = global.window;
global.window = { PT_MAP_DATA: mapData };

core.getMapList().forEach(function(map) {
    var groups = {};
    core.getPointsForMap(map.id).forEach(function(point, pointIndex) {
        var type = point.type || 'Other';
        if (!core.shouldClusterMapType(type)) return;
        var coord = core.getPointPixelCoords(point, map.id);
        if (!coord || !isFinite(coord.px) || !isFinite(coord.py)) return;
        if (!groups[type]) groups[type] = [];
        groups[type].push({
            key: type + ':' + pointIndex,
            px: coord.px,
            py: coord.py
        });
    });

    Object.keys(groups).forEach(function(type) {
        for (var stage = 0; stage < 4; stage++) {
            var options = {
                stage: stage,
                minZoom: 0,
                maxZoom: 4.2,
                nativeZoom: 8,
                stageBreaks: [0, 0.2, 0.4, 0.6],
                stageRadii: core.getClusterStageRadii(type)
            };
            assert.deepStrictEqual(
                simplifyClusters(core.buildStageClusters(groups[type], options)),
                simplifyClusters(buildLegacyStageClusters(groups[type], options)),
                map.id + ' / ' + type + ' / stage ' + stage + ' keeps legacy cluster members and order'
            );
        }
    });
});

global.window = previousWindow;
