const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const context = { window: {} };
vm.createContext(context);

const corePath = path.join(__dirname, '科技树核心.js');
vm.runInContext(fs.readFileSync(corePath, 'utf8'), context, { filename: corePath });

const raw = [
    { id: 'A', 中文名: '普通科技', 等级要求: 2, 科技点数: 1, 古代科技: false, 图标文件: '物品图标/a.png', 解锁物品: [{ id: 'ItemA', 中文名: '物品A' }] },
    { id: 'B', 中文名: '古代科技', 等级要求: 1, 科技点数: 2, 古代科技: true, 解锁建筑: [{ id: 'BuildB', 中文名: '建筑B' }] }
];

const core = context.window.PT_TECH_CORE;
core.setData(raw);

assert.strictEqual(JSON.stringify(core.getLevels()), JSON.stringify([1, 2]));
assert.strictEqual(core.getAll()[0].id, 'B');
assert.strictEqual(core.search('', 'normal').length, 1);
assert.strictEqual(core.search('', 'ancient').length, 1);
assert.strictEqual(core.search('物品', 'all').length, 0);
assert.strictEqual(core.search('普通', 'all')[0].items[0].name, '物品A');
assert.strictEqual(core.getIconUrl(core.getAll()[1]), '../游戏内容/幻兽帕鲁1.0/资源包/物品图标/a.png');

console.log('科技树核心测试通过');
