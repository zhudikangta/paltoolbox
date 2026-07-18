var assert = require('assert');
var fs = require('fs');
var path = require('path');

var webSource = fs.readFileSync(path.join(__dirname, '地图指南网页.js'), 'utf8');
var styleSource = fs.readFileSync(path.join(__dirname, '..', '样式', '地图指南网页样式.css'), 'utf8');

assert.ok(/var ZOOM_STEP_SIZE = 0\.42;/.test(webSource), 'wheel zoom step keeps the old exact 10 percent step');
assert.ok(/var PER_FRAME_MAX_STEP = 0\.14;/.test(webSource), 'tile-map wheel zoom keeps the smooth frame stepping behavior');
assert.ok(!/beginWheelLoadShedding/.test(webSource), 'tile-map wheel zoom does not keep the obsolete whole-image load-shedding entry');
assert.ok(!/endWheelLoadShedding/.test(webSource), 'tile-map wheel zoom does not keep the obsolete whole-image restore entry');
assert.ok(!/WHEEL_ZOOM_COMMIT_DELAY_MS/.test(webSource), 'tile-map wheel zoom does not use delayed jump commits');
assert.ok(/L\.tileLayer\(getTileUrl/.test(webSource), 'map rendering uses the published tile set');
assert.ok(!/L\.imageOverlay\(/.test(webSource), 'map rendering does not restore the unpublished whole-map image layer');
assert.ok(!/map-image-overlay--full/.test(webSource), 'web adapter does not keep the obsolete full-image layer class');
assert.ok(!/map-image-overlay--preview/.test(webSource), 'web adapter does not keep the obsolete preview-image layer class');
assert.ok(!/map-stage--wheel-load-shedding/.test(styleSource), 'styles do not keep the obsolete whole-image load-shedding state');

console.log('地图指南瓦片滚轮适配测试通过');
