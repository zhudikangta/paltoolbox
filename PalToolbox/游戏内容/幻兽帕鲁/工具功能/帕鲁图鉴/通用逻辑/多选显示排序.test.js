const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function runFile(context, file) {
    vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
}

const context = { window: {} };
context.global = context;
vm.createContext(context);
runFile(context, path.join(__dirname, '帕鲁图鉴通用.js'));

const common = context.window.PT_PALDEX_COMMON;
const statById = common.DISPLAY_FIELDS.reduce(function(map, field) {
    map[field.id] = field.stat;
    return map;
}, {});

function makeStats(values) {
    const stats = {};
    Object.keys(values).forEach(function(id) {
        stats[statById[id]] = values[id];
    });
    return stats;
}

const core = {
    getAll: function() {
        return [
            {
                id: 'allMatch',
                displayId: '201',
                species: 'BrandNewAllMatch',
                iconSourceKey: 'BrandNewAllMatch',
                category: '基础',
                implementStatus: '正常',
                elements: ['fire', 'water'],
                works: [{ name: 'generate', level: 2 }, { name: 'cooling', level: 1 }],
                stats: makeStats({ moveSpeed: 900, hp: 80, defense: 70 }),
                name: 'allmatch',
                activeSkills: []
            },
            {
                id: 'elementOnly',
                displayId: '202',
                species: 'BrandNewElementOnly',
                iconSourceKey: 'BrandNewElementOnly',
                category: '基础',
                implementStatus: '正常',
                elements: ['fire', 'water'],
                works: [{ name: 'generate', level: 4 }],
                stats: makeStats({ moveSpeed: 500, hp: 120, defense: 90 }),
                name: 'elementonly',
                activeSkills: []
            },
            {
                id: 'workOnly',
                displayId: '203',
                species: 'BrandNewWorkOnly',
                iconSourceKey: 'BrandNewWorkOnly',
                category: '基础',
                implementStatus: '正常',
                elements: ['fire'],
                works: [{ name: 'generate', level: 3 }, { name: 'cooling', level: 2 }],
                stats: makeStats({ moveSpeed: 650, hp: 95, defense: 110 }),
                name: 'workonly',
                activeSkills: []
            },
            {
                id: 'singleFire',
                displayId: '204',
                species: 'SheepBall',
                iconSourceKey: 'SheepBall',
                category: '基础',
                implementStatus: '正常',
                elements: ['fire'],
                works: [{ name: 'generate', level: 1 }],
                stats: makeStats({ moveSpeed: 300, hp: 60, defense: 50 }),
                name: 'singlefire',
                activeSkills: []
            }
        ];
    }
};

common.setFilter('element', 'fire');
common.setFilter('element', 'water');
assert.deepStrictEqual(common.getFilteredPals(core).map(function(p) { return p.id; }), ['allMatch', 'elementOnly'], '属性多选必须同时具备全部属性');

common.setFilter('element', 'fire');
common.setFilter('element', 'water');
assert.deepStrictEqual(Array.from(common.getState().selEls), [], '再次点击已选属性应该取消选择');

common.setFilter('work', 'generate');
common.setFilter('work', 'cooling');
assert.deepStrictEqual(common.getFilteredPals(core).map(function(p) { return p.id; }), ['allMatch', 'workOnly'], '工作多选必须同时具备全部工作');

common.setFilter('element', 'water');
assert.deepStrictEqual(common.getFilteredPals(core).map(function(p) { return p.id; }), ['allMatch'], '属性加工作混选必须同时满足全部条件');

common.setFilter('element', 'water');
common.setFilter('work', 'generate');
common.setFilter('work', 'cooling');
common.setFilter('displayField', 'moveSpeed');
assert.deepStrictEqual(Array.from(common.getState().displayFields), ['moveSpeed'], '数值显示字段仍然可以单独开启');

common.setFilter('sort', 'moveSpeed-asc');
assert.deepStrictEqual(common.getFilteredPals(core).map(function(p) { return p.id; }), ['singleFire', 'elementOnly', 'workOnly', 'allMatch'], '清空筛选后数值排序仍然可用');

common.setFilter('sort', 'default');
common.setFilter('newOnly', true);
assert.ok(common.getFilteredPals(core).map(function(p) { return p.id; }).indexOf('singleFire') < 0, '新帕鲁筛选仍然排除旧帕鲁');

console.log('帕鲁图鉴多选显示排序测试通过');
