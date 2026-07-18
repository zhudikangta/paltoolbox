var assert = require('assert');
var core = require('./地图指南核心.js');

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
assert.strictEqual(core.getClusterStage(0.19, [0, 0.2, 0.4, 0.6]), 0, 'progress before 20 percent stays in stage 0');
assert.strictEqual(core.getClusterStage(0.2, [0, 0.2, 0.4, 0.6]), 1, 'progress at 20 percent enters stage 1');

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
