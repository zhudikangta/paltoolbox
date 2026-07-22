const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const context = { window: {} };
context.global = context;
vm.createContext(context);

const commonFile = path.join(__dirname, '帕鲁图鉴通用.js');
vm.runInContext(fs.readFileSync(commonFile, 'utf8'), context, { filename: commonFile });

const common = context.window.PT_PALDEX_COMMON;
const core = {
    getAll: function() {
        return [
            { id: 'base', category: '基础', implementStatus: '正常', elements: [], works: [], name: '棉悠悠', displayId: '1', activeSkills: ['空气弹'] },
            { id: 'subspecies', category: '亚种', implementStatus: '正常', elements: [], works: [], name: '亚种', displayId: '2', activeSkills: [] },
            { id: 'variant', category: '变体', implementStatus: '正常', elements: [], works: [], name: 'variant', displayId: '2', activeSkills: [] },
            { id: 'terraria', category: '泰拉瑞亚', implementStatus: '正常', elements: [], works: [], name: 'terraria', displayId: '3', activeSkills: [] },
            { id: 'raid', category: '石板Boss', implementStatus: '正常', elements: [], works: [], name: 'raid', displayId: '4', activeSkills: [] },
            { id: 'tower', category: '塔主Boss', implementStatus: '正常', elements: [], works: [], name: 'tower', displayId: '4', activeSkills: [] },
            { id: 'boss', category: 'Boss变体', implementStatus: '正常', elements: [], works: [], name: 'boss', displayId: '4', activeSkills: [] },
            { id: 'berserk', category: '狂暴化', implementStatus: '正常', elements: [], works: [], name: 'berserk', displayId: '4', activeSkills: [] },
            { id: 'missing', category: '未归类', implementStatus: '正常', elements: [], works: [], name: 'missing', displayId: '5', activeSkills: [] },
            { id: 'future', category: '基础', implementStatus: '未实装', elements: [], works: [], name: 'future', displayId: '6', activeSkills: [] }
        ];
    }
};

assert.deepStrictEqual(Array.from(common.MAIN_CATEGORIES, function(item) { return item.label; }), [
    '普通帕鲁', '石板Boss', '塔主Boss', 'Boss', '狂暴化', '其他'
], '帕鲁图鉴应该显示六个并列分类');
assert.strictEqual(common.ORDINARY_SUB_CATEGORIES, undefined, '普通帕鲁下面不应该再保留基础、亚种、泰拉瑞亚子分类');

assert.deepStrictEqual(common.getFilteredPals(core).map(function(p) { return p.id; }), [
    'base', 'subspecies', 'terraria'
], '默认普通帕鲁应该合并基础、亚种和泰拉瑞亚，并把泰拉瑞亚排在末尾');

common.setFilter('mainCategory', 'other');
assert.deepStrictEqual(common.getFilteredPals(core).map(function(p) { return p.id; }), ['variant', 'missing'], '其他应该作为第六个主分类显示变体和未归类记录');

common.setFilter('mainCategory', 'raidBoss');
assert.deepStrictEqual(common.getFilteredPals(core).map(function(p) { return p.id; }), ['raid'], '石板Boss应该筛选石板Boss数据');

common.setFilter('mainCategory', 'towerBoss');
assert.deepStrictEqual(common.getFilteredPals(core).map(function(p) { return p.id; }), ['tower'], '塔主Boss应该筛选塔主Boss数据');

common.setFilter('mainCategory', 'bossVariant');
assert.deepStrictEqual(common.getFilteredPals(core).map(function(p) { return p.id; }), ['boss'], '界面上的Boss应该筛选Boss变体数据');

common.setFilter('mainCategory', 'berserk');
assert.deepStrictEqual(common.getFilteredPals(core).map(function(p) { return p.id; }), ['berserk'], '狂暴化应该筛选狂暴化数据');

common.setFilter('mainCategory', 'normal');
common.setFilter('showUnreleased', true);
assert.deepStrictEqual(common.getFilteredPals(core).map(function(p) { return p.id; }), ['base', 'subspecies', 'future', 'terraria'], '勾选显示未实装后应该把未实装普通帕鲁放回结果，并保持泰拉瑞亚位于末尾');

common.setFilter('showUnreleased', false);
common.setFilter('search', '空气弹');
assert.deepStrictEqual(common.getFilteredPals(core).map(function(p) { return p.id; }), [], '图鉴列表搜索不应该匹配技能名称');
common.setFilter('search', '棉悠');
assert.deepStrictEqual(common.getFilteredPals(core).map(function(p) { return p.id; }), ['base'], '图鉴列表搜索应该匹配帕鲁中文名');

console.log('帕鲁图鉴分类筛选测试通过');
