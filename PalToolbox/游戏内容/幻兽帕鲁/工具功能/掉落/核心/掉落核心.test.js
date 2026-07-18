const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const context = { window: {} };
context.global = context;
vm.createContext(context);

const coreFile = path.join(__dirname, '掉落核心.js');
vm.runInContext(fs.readFileSync(coreFile, 'utf8'), context, { filename: coreFile });

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../../幻兽帕鲁1.0/数据包/掉落.json'), 'utf8'));
const core = context.window.PT_DROP_CORE;

core.setData(data);

assert.strictEqual(core.getAll().length, 1044, '掉落工具必须保留上游全部 1044 条角色记录');
assert.deepStrictEqual(
    Object.keys(core.getTypeCounts()).sort(),
    ['arena', 'boss', 'human', 'npc', 'pal', 'predator', 'quest', 'raid', 'tower'],
    '掉落工具必须保留全部九种分类'
);
assert.ok(core.filter({ type: 'boss' }).length > 400, '首领分类必须能够筛出完整首领掉落记录');
assert.ok(core.filter({ search: '石' }).length > 0, '必须能按中文角色名或掉落物名称搜索');
assert.ok(core.filter({ search: 'BOSS_' }).length > 0, '必须能按角色原始编号搜索');

console.log('掉落核心测试通过');
