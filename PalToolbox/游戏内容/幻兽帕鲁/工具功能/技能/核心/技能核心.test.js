const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const context = { window: {} };
context.global = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '技能核心.js'), 'utf8'), context);

const core = context.window.PT_SKILL_CORE;
core.setActiveSkillData({
    palLearnSkills: {
        SheepBall: {
            nameCN: '棉悠悠',
            skills: [
                { wazaID: 'AirCanon', nameCN: '空气弹', level: 1, element: 'Normal', category: 'Shot', power: 30 }
            ]
        },
        PinkCat: {
            nameCN: '捣蛋猫',
            skills: [
                { wazaID: 'AirCanon', nameCN: '空气弹', level: 7, element: 'Normal', category: 'Shot', power: 30 }
            ]
        }
    }
});
core.setPartnerSkillData({
    partnerSkills: {
        SheepBall: {
            id: 'SheepBall',
            palName: '棉悠悠',
            skillName: '茸茸盾牌',
            description: '举起盾牌'
        },
        BOSS_SheepBall: {
            id: 'BOSS_SheepBall',
            palName: '棉悠悠(Boss)',
            skillName: '茸茸盾牌',
            description: '举起盾牌'
        }
    },
    internalParameters: {
        SheepBall: { typeLabel: '主动技能', trigger: '玩家使用', coolDown: 30, values: [1, 2, 3] }
    },
    catalog: [{ palId: 'SheepBall', category: '普通帕鲁', reason: '普通帕鲁' }]
});

const active = core.search('active', '空气弹');
assert.strictEqual(active.length, 1, '相同主动技能应该按技能编号合并');
assert.strictEqual(active[0].element, '无属性', '主动技能属性应该翻译成中文');
assert.deepStrictEqual(JSON.parse(JSON.stringify(active[0].learnedBy.map(function(item) { return item.palName; }))), ['棉悠悠', '捣蛋猫'], '主动技能应该保留习得帕鲁列表');

const partner = core.search('partner', '盾牌');
assert.strictEqual(partner.length, 1, '伙伴技能应该能按中文名搜索');
assert.strictEqual(partner[0].type, '主动技能', '伙伴技能应该保留类型');
assert.strictEqual(partner[0].cooldown, 30, '伙伴技能应该保留冷却时间');
assert.strictEqual(partner[0].palName, '棉悠悠', '目录条目应保留帕鲁名');
assert.strictEqual(partner[0].category, '普通帕鲁', '目录条目应保留六大分类字段');
assert.deepStrictEqual(core.getPartnerSkills().map(function(item) { return item.id; }), ['SheepBall'], '伙伴技能工具只能读取 catalog，不能遍历图鉴全量事实');

core.setPartnerSkillData({
    partnerSkills: {
        Later: { id: 'Later', skillName: 'Z技能', palName: '后一项' },
        Earlier: { id: 'Earlier', skillName: 'A技能', palName: '前一项' }
    },
    catalog: [{ palId: 'Later' }, { palId: 'Earlier' }]
});
assert.deepStrictEqual(core.getPartnerSkills().map(function(item) { return item.id; }), ['Later', 'Earlier'], '伙伴技能应保留生成目录的分类和泰拉瑞亚末尾顺序');

console.log('技能核心测试通过');
