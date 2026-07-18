const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadCore() {
    const context = { window: {} };
    context.global = context;
    vm.createContext(context);
    const file = path.join(__dirname, '帕鲁图鉴核心.js');
    vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
    return context.window.PT_PALDEX_CORE;
}

const core = loadCore();

core.setData([{
    id: 'SheepBall',
    种族: 'SheepBall',
    图鉴编号: 1,
    图鉴后缀: '',
    分类: '基础',
    实装状态: '正常',
    中文名: '棉悠悠',
    中文名状态: '完全匹配',
    头像文件: 'T_SheepBall_icon_normal.png',
    头像状态: '已存在',
    属性1: 'Normal',
    属性2: 'None',
    HP: 70,
    近战攻击: 70,
    远程攻击: 70,
    防御: 70,
    繁殖力: 3050,
    工作适性: { 手工: 1, 搬运: 1 },
    伙伴技能: '茸茸盾牌',
    技能学习: [{ 技能名: '空气弹' }],
    掉落列表: [{ 物品名: '羊毛' }],
    描述: '测试描述'
}, {
    id: 'BOSS_SheepBall',
    种族: 'SheepBall',
    图鉴编号: 1,
    图鉴后缀: '',
    分类: 'Boss变体',
    实装状态: '正常',
    中文名: '',
    中文名状态: '缺中文名',
    头像文件: '',
    头像状态: '头像表缺失',
    属性1: 'Normal',
    属性2: 'None',
    工作适性: {}
}]);

const pal = core.getById('SheepBall');
assert.strictEqual(pal.name, '棉悠悠');
assert.strictEqual(pal.displayId, '1');
assert.strictEqual(pal.slug, 'SheepBall');
assert.strictEqual(JSON.stringify(pal.elements), JSON.stringify(['无属性']));
assert.strictEqual(JSON.stringify(pal.works), JSON.stringify([{ name: '手工作业', level: 1 }, { name: '搬运', level: 1 }]));
assert.ok(pal.icon.includes('幻兽帕鲁1.0/资源包/帕鲁头像/T_SheepBall_icon_normal.png'));
assert.strictEqual(core.getBySpecies('SheepBall').id, 'SheepBall');
assert.strictEqual(core.search('棉悠')[0].id, 'SheepBall');
assert.strictEqual(core.search('1')[0].id, 'SheepBall');
assert.strictEqual(core.search('SheepBall').length, 0, '图鉴搜索不应该匹配内部英文名称');
assert.strictEqual(core.search('空气弹').length, 0, '图鉴搜索不应该匹配技能名称');

const missing = core.getById('BOSS_SheepBall');
assert.strictEqual(missing.name, 'BOSS_SheepBall');
assert.strictEqual(missing.icon, '');
assert.strictEqual(missing.nameStatus, '缺中文名');

console.log('帕鲁图鉴核心测试通过');
