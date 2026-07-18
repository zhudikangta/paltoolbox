var assert = require('assert');

global.window = {
    PT_MAP_DATA: {
        mapConfig: {
            MainMap: {
                landscapeBounds: {
                    min: { X: -100, Y: -100 },
                    max: { X: 100, Y: 100 }
                }
            },
            Tree: {
                landscapeBounds: {
                    min: { X: 300, Y: 300 },
                    max: { X: 500, Y: 500 }
                }
            }
        },
        bossSpawns: [
            { characterID: 'BOSS_A', pos: { X: 0, Y: 0 } },
            { characterID: 'BOSS_TREE', pos: { X: 400, Y: 400 } }
        ],
        questLocations: [
            { id: 'QUEST_A', pos: { X: 50, Y: 50 } }
        ]
    }
};

var core = require('./地图指南核心.js');

var maps = core.getMapList();
assert.deepStrictEqual(maps.map(function(map) { return map.id; }), ['MainMap', 'Tree'], 'map list keeps main map and tree map');
assert.strictEqual(maps[0].image, '', 'main map only uses published tiles, not the source image');
assert.strictEqual(maps[1].image, '', 'tree map only uses published tiles, not the source image');

var fs = require('fs');
var webAdapter = fs.readFileSync(require('path').join(__dirname, '..', '网页模式适配', '地图指南网页.js'), 'utf8');
assert.strictEqual(webAdapter.indexOf('T_WorldMap.png'), -1, 'web adapter does not keep a fallback to an unpublished source image');

var mainPoints = core.getPointsForMap('MainMap');
var treePoints = core.getPointsForMap('Tree');
assert.strictEqual(mainPoints.length, 2, 'main map keeps only main-map facts');
assert.strictEqual(treePoints.length, 1, 'tree map keeps only tree-map facts');
assert.strictEqual(treePoints[0].item, 'BOSS_TREE', 'tree boss stays on tree map');

var mainPixel = core.getPointPixelCoords({ pos: { X: 0, Y: 0 } }, 'MainMap');
assert.strictEqual(Math.round(mainPixel.px), 65536, 'main x coordinate maps to image center');
assert.strictEqual(Math.round(mainPixel.py), 65536, 'main y coordinate maps to image center');

var treePixel = core.getPointPixelCoords({ pos: { X: 400, Y: 400 } }, 'Tree');
assert.strictEqual(Math.round(treePixel.px), 65536, 'tree x coordinate maps to tree image center');
assert.strictEqual(Math.round(treePixel.py), 65536, 'tree y coordinate maps to tree image center');
