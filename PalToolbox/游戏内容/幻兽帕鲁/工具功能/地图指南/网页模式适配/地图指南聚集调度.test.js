var assert = require('assert');
var fs = require('fs');
var path = require('path');

var webSource = fs.readFileSync(path.join(__dirname, '地图指南网页.js'), 'utf8');

assert.ok(
    /if \(nextStage !== state\.clusterStage\) scheduleClusterStageUpdate\(nextStage\)/.test(webSource),
    'zoom end only schedules clustering when the fixed stage changes'
);
assert.ok(
    /function getCachedStageClusters\(type, models, mapCore\)/.test(webSource),
    'web adapter caches complete stage clusters by map type and stage'
);
assert.ok(
    /var markers = state\.markers;/.test(webSource),
    'clustering always starts from the complete map marker list'
);
assert.ok(
    !/var markers = state\.viewportOnly \? getPointsInViewport\(\) : state\.markers;/.test(webSource),
    'viewport mode does not remove source points before clustering'
);
assert.ok(
    /function getPaddedViewportBounds\(\)/.test(webSource),
    'viewport clipping uses one reusable padded boundary'
);
assert.ok(
    /function isClusterResultInViewport\(cluster, viewportBounds\)/.test(webSource),
    'completed cluster results are clipped only when they are added to the map'
);
assert.ok(
    /state\.clusterResults = \{\};/.test(webSource),
    'map switching and teardown can invalidate saved cluster results'
);

console.log('地图指南聚集调度测试通过');
