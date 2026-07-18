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
            { id: 'variant', category: '变体', implementStatus: '正常', elements: [], works: [], name: 'variant', displayId: '2', activeSkills: [] },
            { id: 'terraria', category: '泰拉瑞亚', implementStatus: '正常', elements: [], works: [], name: 'terraria', displayId: '3', activeSkills: [] },
            { id: 'boss', category: 'Boss变体', implementStatus: '正常', elements: [], works: [], name: 'boss', displayId: '4', activeSkills: [] },
            { id: 'missing', category: '未归类', implementStatus: '正常', elements: [], works: [], name: 'missing', displayId: '5', activeSkills: [] },
            { id: 'future', category: '基础', implementStatus: '未实装', elements: [], works: [], name: 'future', displayId: '6', activeSkills: [] }
        ];
    }
};

assert.ok(common.MAIN_CATEGORIES.some(function(item) {
    return item.id === 'bossVariant' && item.label === 'Boss';
}), 'Boss变体分类应该只在界面上显示为Boss');

assert.ok(!common.MAIN_CATEGORIES.some(function(item) {
    return item.raw === '未归类' || item.label === '未归类';
}), '分类筛选不应该继续显示未归类');

assert.ok(common.ORDINARY_SUB_CATEGORIES.some(function(item) {
    return item.id === 'variant' && item.label === '其他' && item.raw === '变体';
}), '普通帕鲁里的变体应该显示成其他');

assert.deepStrictEqual(common.getFilteredPals(core).map(function(p) { return p.id; }), ['base'], '默认普通帕鲁只显示基础加亚种，且未实装默认隐藏');

common.setFilter('subCategory', 'variant');
assert.deepStrictEqual(common.getFilteredPals(core).map(function(p) { return p.id; }), ['variant'], '普通帕鲁的其他应该筛选变体');

common.setFilter('mainCategory', 'bossVariant');
assert.deepStrictEqual(common.getFilteredPals(core).map(function(p) { return p.id; }), ['boss'], '界面上的Boss应该筛选Boss变体数据');

common.setFilter('mainCategory', 'normal');
common.setFilter('showUnreleased', true);
assert.deepStrictEqual(common.getFilteredPals(core).map(function(p) { return p.id; }), ['base', 'future'], '勾选显示未实装后应该把未实装帕鲁放回当前分类结果里');

common.setFilter('showUnreleased', false);
common.setFilter('search', '空气弹');
assert.deepStrictEqual(common.getFilteredPals(core).map(function(p) { return p.id; }), [], '图鉴列表搜索不应该匹配技能名称');
common.setFilter('search', '棉悠');
assert.deepStrictEqual(common.getFilteredPals(core).map(function(p) { return p.id; }), ['base'], '图鉴列表搜索应该匹配帕鲁中文名');

console.log('帕鲁图鉴分类筛选测试通过');
