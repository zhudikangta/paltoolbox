const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
    parsePartnerSkillList,
    parseDetailPartnerSkill,
    extractTribeLinks,
    buildPartnerSkillData
} = require('./伙伴技能数据核心');

const fixture = function(name) {
    return fs.readFileSync(path.join(__dirname, '测试资料', name), 'utf8');
};

const normal = parsePartnerSkillList(fixture('普通列表片段.html'), 'https://paldb.cc/cn/Partner_Skill');
assert.strictEqual(normal.length, 2, '应该按卡片提取普通帕鲁');
assert.deepStrictEqual(normal[0], {
    palName: '棉悠悠',
    palNumber: '1',
    palSlug: 'Lamball',
    skillName: '茸茸盾牌',
    description: '发动后，它会化身为装备在玩家身上的盾牌。\n将它分派到家畜牧场，它就有机会掉落羊毛。',
    sourceUrl: 'https://paldb.cc/cn/Partner_Skill'
});

const boss = parseDetailPartnerSkill(
    fixture('Boss详情片段.html'),
    'BOSS_Sekhmet',
    'https://paldb.cc/cn/Cutthroat_Sun_Snuffer_Sekhmet'
);
assert.strictEqual(boss.skillName, '沙漠女帝');
assert.ok(boss.description.includes('(200~400)%'), 'Boss 专属数值必须保留');
const falsePositive = fixture('Boss详情片段.html')
    .replace('?s=Pals%2FBOSS_Sekhmet', '?s=Pals%2FSekhmet')
    .replace('<table>', '<div>Code</div><div>Sekhmet</div><table>');
assert.strictEqual(
    parseDetailPartnerSkill(falsePositive, 'BOSS_Sekhmet', 'https://paldb.cc/cn/Sekhmet'),
    null,
    '普通页面 Tribes 列表里的 Boss id 不能被误认为当前卡片'
);
assert.deepStrictEqual(
    extractTribeLinks(fixture('Boss详情片段.html')),
    ['Sekhmet', 'Cutthroat_Sun_Snuffer_Sekhmet'],
    '抓取器应该只跟进 Tribes 卡片中的帕鲁变体链接'
);

const pals = [
    { id: 'Base', 种族: 'Base', 分类: '基础', 实装状态: '正常', 中文名: '原型', 伙伴技能: '原型技能' },
    { id: 'BOSS_Base', 种族: 'Base', 分类: 'Boss变体', 实装状态: '正常', 中文名: '原型(Boss)' },
    { id: 'GYM_Base', 种族: 'Base', 分类: '塔主Boss', 实装状态: '正常', 中文名: '原型(塔主)' },
    { id: 'GYM_Base_2', 种族: 'Base', 分类: '塔主Boss', 实装状态: '正常', 中文名: '原型(塔主)' },
    { id: 'RAID_Hand_Left', 种族: 'Hand_Left', 分类: '石板Boss', 实装状态: '正常', 中文名: '左手' },
    { id: 'RAID_Hand_Left_2', 种族: 'Hand_Left', 分类: '石板Boss', 实装状态: '正常', 中文名: '左手' },
    { id: 'Terra', 种族: 'Terra', 分类: '泰拉瑞亚', 实装状态: '正常', 中文名: '史莱姆', 伙伴技能: '黏液' }
];
const internalParameters = {
    Base: { id: 'Base', skillType: 'Unknown', description: 'MoveSpeed(10,20)' },
    BOSS_Base: { id: 'BOSS_Base', skillType: 'Unknown', description: 'MoveSpeed(10,20)' },
    GYM_Base: { id: 'GYM_Base', skillType: 'Unknown', description: 'MoveSpeed(100,200)' },
    GYM_Base_2: { id: 'GYM_Base_2', skillType: 'Unknown', description: 'MoveSpeed(100,200)' },
    RAID_Hand_Left: { id: 'RAID_Hand_Left', skillType: 'Unknown', description: 'SummonHand' },
    RAID_Hand_Left_2: { id: 'RAID_Hand_Left_2', skillType: 'Unknown', description: 'SummonHand' }
};
const built = buildPartnerSkillData({
    pals: pals,
    normalRecords: [
        { palName: '原型', skillName: '原型技能', description: '原型说明', sourceUrl: 'normal' },
        { palName: '史莱姆', skillName: '黏液', description: '史莱姆说明', sourceUrl: 'normal' }
    ],
    specialRecords: {
        GYM_Base: { skillName: '塔主技能', description: '塔主专属说明', sourceUrl: 'gym' },
        GYM_Base_2: { skillName: '塔主技能', description: '塔主专属说明', sourceUrl: 'gym' },
        RAID_Hand_Left: { skillName: '手部技能', description: '手部说明', sourceUrl: 'raid' }
    },
    internalParameters: internalParameters,
    metadata: { retrievedAt: '2026-07-22', gameVersion: 'v1.0.0', transformVersion: '1.0.0' }
});

assert.strictEqual(Object.keys(built.partnerSkills).length, pals.length, '图鉴事实必须覆盖所有帕鲁 id');
assert.strictEqual(built.partnerSkills.BOSS_Base.description, '原型说明', '内部参数相同的 Boss 仍要有完整说明');
assert.strictEqual(built.partnerSkills.GYM_Base.description, '塔主专属说明', '差异 Boss 必须保留自己的说明');
assert.strictEqual(built.partnerSkills.RAID_Hand_Left_2.description, '手部说明', '图鉴中的 `_2` 重复记录也必须有完整说明');
assert.deepStrictEqual(
    built.catalog.map(function(item) { return item.palId; }),
    ['Base', 'Terra', 'RAID_Hand_Left', 'GYM_Base'],
    '目录应包含全部普通帕鲁、差异 Boss 和无原型部件，并去掉相同 Boss 及 `_2` 重复'
);
assert.ok(built.internalParameters.GYM_Base, '解包参数必须放在独立区块');
assert.ok(Array.isArray(built.conflicts), '冲突必须有独立记录区块');

console.log('伙伴技能数据测试通过');
