const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const context = { window: {} };
context.global = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '配种查询核心.js'), 'utf8'), context);

const core = context.window.PT_BREEDING_CORE;
core.setPalData([
    { id: 'LazyDragon', 种族: 'LazyDragon', 中文名: '佩克龙', 图鉴编号: 85, 繁殖力: 500, 可配种: true, 实装状态: '正常', 分类: '基础', 头像文件: 'LazyDragon.webp', 头像状态: '已存在' },
    { id: 'ElecCat', 种族: 'ElecCat', 中文名: '伏特喵', 图鉴编号: 7, 繁殖力: 2800, 可配种: true, 实装状态: '正常', 分类: '基础', 头像文件: 'ElecCat.webp', 头像状态: '已存在' },
    { id: 'LazyDragon_Electric', 种族: 'LazyDragon_Electric', 中文名: '派克龙', 图鉴编号: 85, 图鉴后缀: 'B', 繁殖力: 540, 可配种: true, 实装状态: '正常', 分类: '亚种', 头像文件: 'LazyDragon_Electric.webp', 头像状态: '已存在' }
]);
core.setBreedingData([
    { id: '2', 亲本A_ID: 'LazyDragon', 亲本A: '佩克龙', 亲本B_ID: 'ElecCat', 亲本B: '伏特喵', 子代ID: 'LazyDragon_Electric', 子代: '派克龙' }
]);

assert.strictEqual(core.searchPals('佩克').length, 1, '配种查询应该能按新版帕鲁中文名搜索');
assert.strictEqual(core.findChild('ElecCat', 'LazyDragon').child.id, 'LazyDragon_Electric', '配种查询应该能无视父母顺序查子代');
assert.strictEqual(core.findParentPairs('LazyDragon_Electric').length, 2, '配种查询应该按上游规则返回自配和特殊父母组合');
assert.strictEqual(core.getSpecialPairs().length, 1, '配种查询应该提供特例列表数据');
assert.strictEqual(core.getSpecialPairs()[0].id, '2', '配种特例列表应该保留新版配种行编号');
assert.strictEqual(core.getPal('LazyDragon_Electric').displayId, '85B', '配种查询应该从新版帕鲁资料拿图鉴编号');
assert.ok(core.getPalIconHtml('LazyDragon_Electric').indexOf('幻兽帕鲁1.0/资源包/帕鲁头像/LazyDragon_Electric.webp') > -1, '配种查询头像应该来自新版资源目录');
assert.strictEqual(core.findPath, undefined, '配种查询不应该保留配种优化路径规划入口');

core.setPalData([
    { id: 'A', '\u79cd\u65cf': 'A', '\u4e2d\u6587\u540d': '父一', '\u56fe\u9274\u7f16\u53f7': 1, '\u7e41\u6b96\u529b': 100, '\u53ef\u914d\u79cd': true, '\u5b9e\u88c5\u72b6\u6001': '正常', '\u5206\u7c7b': '基础' },
    { id: 'B', '\u79cd\u65cf': 'B', '\u4e2d\u6587\u540d': '父二', '\u56fe\u9274\u7f16\u53f7': 2, '\u7e41\u6b96\u529b': 300, '\u53ef\u914d\u79cd': true, '\u5b9e\u88c5\u72b6\u6001': '正常', '\u5206\u7c7b': '基础' },
    { id: 'NormalChild', '\u79cd\u65cf': 'NormalChild', '\u4e2d\u6587\u540d': '普通子代', '\u56fe\u9274\u7f16\u53f7': 3, '\u7e41\u6b96\u529b': 201, '\u53ef\u914d\u79cd': true, '\u5b9e\u88c5\u72b6\u6001': '正常', '\u5206\u7c7b': '基础' },
    { id: 'SpecialOnly', '\u79cd\u65cf': 'SpecialOnly', '\u4e2d\u6587\u540d': '特殊子代', '\u56fe\u9274\u7f16\u53f7': 4, '\u7e41\u6b96\u529b': 200, '\u53ef\u914d\u79cd': true, '\u5b9e\u88c5\u72b6\u6001': '正常', '\u5206\u7c7b': '基础' },
    { id: 'BossA', '\u79cd\u65cf': 'A', '\u4e2d\u6587\u540d': '父一头目', '\u56fe\u9274\u7f16\u53f7': 1, '\u7e41\u6b96\u529b': 100, '\u53ef\u914d\u79cd': true, '\u5b9e\u88c5\u72b6\u6001': '正常', '\u5206\u7c7b': 'Boss' }
]);
core.setBreedingData([
    { id: 's1', '\u4eb2\u672cA_ID': 'X', '\u4eb2\u672cA': '特父一', '\u4eb2\u672cB_ID': 'Y', '\u4eb2\u672cB': '特父二', '\u5b50\u4ee3ID': 'SpecialOnly', '\u5b50\u4ee3': '特殊子代' }
]);

assert.strictEqual(core.findChild('A', 'B').child.id, 'NormalChild', '普通配种应该按繁殖力公式查子代');
assert.strictEqual(core.findChild('X', 'Y').child.id, 'SpecialOnly', '特殊组合应该优先于普通公式');
assert.strictEqual(core.findParentPairs('NormalChild').some(function(pair) {
    return pair.parentAId === 'A' && pair.parentBId === 'B';
}), true, '反向配种应该包含普通公式算出的父母组合');
assert.strictEqual(core.findParentPairs('SpecialOnly').some(function(pair) {
    return pair.id === 's1';
}), true, '反向配种应该包含特殊组合');
assert.strictEqual(core.findParentPairs('SpecialOnly').some(function(pair) {
    return pair.parentAId === 'A' && pair.parentBId === 'B';
}), false, '特殊子代不应该参与普通公式结果池');
assert.strictEqual(core.searchPals('父一头目').length, 0, '配种候选应该像上游一样过滤内部Boss变体');

core.setPalData([
    { id: 'CatMage', '\u79cd\u65cf': 'CatMage', '\u4e2d\u6587\u540d': '暗巫猫', '\u56fe\u9274\u7f16\u53f7': 1, '\u7e41\u6b96\u529b': 100, '\u53ef\u914d\u79cd': true, '\u5b9e\u88c5\u72b6\u6001': '正常', '\u5206\u7c7b': '基础' },
    { id: 'FoxMage', '\u79cd\u65cf': 'FoxMage', '\u4e2d\u6587\u540d': '焰巫狐', '\u56fe\u9274\u7f16\u53f7': 2, '\u7e41\u6b96\u529b': 200, '\u53ef\u914d\u79cd': true, '\u5b9e\u88c5\u72b6\u6001': '正常', '\u5206\u7c7b': '基础' },
    { id: 'FoxMage_Dark', '\u79cd\u65cf': 'FoxMage_Dark', '\u4e2d\u6587\u540d': '幽巫狐', '\u56fe\u9274\u7f16\u53f7': 3, '\u7e41\u6b96\u529b': 300, '\u53ef\u914d\u79cd': true, '\u5b9e\u88c5\u72b6\u6001': '正常', '\u5206\u7c7b': '亚种' },
    { id: 'CatMage_Fire', '\u79cd\u65cf': 'CatMage_Fire', '\u4e2d\u6587\u540d': '炽巫猫', '\u56fe\u9274\u7f16\u53f7': 4, '\u7e41\u6b96\u529b': 400, '\u53ef\u914d\u79cd': true, '\u5b9e\u88c5\u72b6\u6001': '正常', '\u5206\u7c7b': '亚种' },
    { id: 'HerculesBeetle_Ground', '\u79cd\u65cf': 'HerculesBeetle_Ground', '\u4e2d\u6587\u540d': '格鲁力斯', '\u56fe\u9274\u7f16\u53f7': 5, '\u7e41\u6b96\u529b': 500, '\u53ef\u914d\u79cd': true, '\u5b9e\u88c5\u72b6\u6001': '正常', '\u5206\u7c7b': '亚种' }
]);
core.setBreedingData([
    { id: 'gender-male', '\u4eb2\u672cA_ID': 'CatMage', '\u4eb2\u672cA': '暗巫猫', '\u4eb2\u672cA\u6027\u522b': '♂', '\u4eb2\u672cB_ID': 'FoxMage', '\u4eb2\u672cB': '焰巫狐', '\u4eb2\u672cB\u6027\u522b': '♀', '\u5b50\u4ee3ID': 'FoxMage_Dark', '\u5b50\u4ee3': '幽巫狐' },
    { id: 'gender-female', '\u4eb2\u672cA_ID': 'CatMage', '\u4eb2\u672cA': '暗巫猫', '\u4eb2\u672cA\u6027\u522b': '♀', '\u4eb2\u672cB_ID': 'FoxMage', '\u4eb2\u672cB': '焰巫狐', '\u4eb2\u672cB\u6027\u522b': '♂', '\u5b50\u4ee3ID': 'CatMage_Fire', '\u5b50\u4ee3': '炽巫猫' },
    { id: 'duplicate-a', '\u4eb2\u672cA_ID': 'HerculesBeetle_Ground', '\u4eb2\u672cA': '格鲁力斯', '\u4eb2\u672cB_ID': 'HerculesBeetle_Ground', '\u4eb2\u672cB': '格鲁力斯', '\u5b50\u4ee3ID': 'HerculesBeetle_Ground', '\u5b50\u4ee3': '格鲁力斯' },
    { id: 'duplicate-b', '\u4eb2\u672cA_ID': 'HerculesBeetle_Ground', '\u4eb2\u672cA': '格鲁力斯', '\u4eb2\u672cB_ID': 'HerculesBeetle_Ground', '\u4eb2\u672cB': '格鲁力斯', '\u5b50\u4ee3ID': 'HerculesBeetle_Ground', '\u5b50\u4ee3': '格鲁力斯' }
]);
assert.strictEqual(core.findChildren('CatMage', 'FoxMage').map(function(row) { return row.childId; }).join(','), 'FoxMage_Dark,CatMage_Fire', '暗巫猫和焰巫狐必须保留两条性别特例结果');
assert.strictEqual(core.findChildren('HerculesBeetle_Ground', 'HerculesBeetle_Ground').length, 1, '无性别的重复特殊配种只能返回一条结果');

core.setPalData([
    { id: 'Pal10', '\u79cd\u65cf': 'Pal10', '\u4e2d\u6587\u540d': '十号', '\u56fe\u9274\u7f16\u53f7': 10, '\u7e41\u6b96\u529b': 1000, '\u53ef\u914d\u79cd': true, '\u5b9e\u88c5\u72b6\u6001': '正常', '\u5206\u7c7b': '基础' },
    { id: 'Pal2', '\u79cd\u65cf': 'Pal2', '\u4e2d\u6587\u540d': '二号', '\u56fe\u9274\u7f16\u53f7': 2, '\u7e41\u6b96\u529b': 2000, '\u53ef\u914d\u79cd': true, '\u5b9e\u88c5\u72b6\u6001': '正常', '\u5206\u7c7b': '基础' },
    { id: 'Pal1', '\u79cd\u65cf': 'Pal1', '\u4e2d\u6587\u540d': '一号', '\u56fe\u9274\u7f16\u53f7': 1, '\u7e41\u6b96\u529b': 3000, '\u53ef\u914d\u79cd': true, '\u5b9e\u88c5\u72b6\u6001': '正常', '\u5206\u7c7b': '基础' }
]);
core.setBreedingData([]);
assert.strictEqual(typeof core.findChildrenByParent, 'function', '配种查询应该提供单亲代的全部子代可能性');
assert.strictEqual(core.findChildrenByParent('Pal10').map(function(row) { return row.otherParentId; }).join(','), 'Pal1,Pal2,Pal10', '单亲代结果必须按另一方亲代图鉴编号升序排列');

core.setPalData([
    { id: 'LowChild', '\u79cd\u65cf': 'LowChild', '\u4e2d\u6587\u540d': '低候选', '\u56fe\u9274\u7f16\u53f7': 1, '\u7e41\u6b96\u529b': 100, '\u53ef\u914d\u79cd': true, '\u5b9e\u88c5\u72b6\u6001': '正常', '\u5206\u7c7b': '基础' },
    { id: 'HighChild', '\u79cd\u65cf': 'HighChild', '\u4e2d\u6587\u540d': '高候选', '\u56fe\u9274\u7f16\u53f7': 2, '\u7e41\u6b96\u529b': 102, '\u53ef\u914d\u79cd': true, '\u5b9e\u88c5\u72b6\u6001': '正常', '\u5206\u7c7b': '基础' },
    { id: 'ParentA', '\u79cd\u65cf': 'ParentA', '\u4e2d\u6587\u540d': '亲本甲', '\u56fe\u9274\u7f16\u53f7': 3, '\u7e41\u6b96\u529b': 80, '\u53ef\u914d\u79cd': true, '\u5b9e\u88c5\u72b6\u6001': '正常', '\u5206\u7c7b': '基础' },
    { id: 'ParentB', '\u79cd\u65cf': 'ParentB', '\u4e2d\u6587\u540d': '亲本乙', '\u56fe\u9274\u7f16\u53f7': 4, '\u7e41\u6b96\u529b': 122, '\u53ef\u914d\u79cd': true, '\u5b9e\u88c5\u72b6\u6001': '正常', '\u5206\u7c7b': '基础' }
]);
core.setBreedingData([]);
assert.strictEqual(core.findChild('ParentA', 'ParentB').childId, 'HighChild', '普通公式在两个候选距离相同时必须选择繁殖力较高的子代');

console.log('配种查询核心测试通过');
