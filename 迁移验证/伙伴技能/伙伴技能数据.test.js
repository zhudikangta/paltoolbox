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
    hasPartnerSkill: true,
    rankTable: null,
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

const stealth = parseDetailPartnerSkill(
    fixture('透明化等级表片段.html'),
    'LizardMan',
    'https://paldb.cc/cn/Leezpunk'
);
assert.deepStrictEqual(stealth.rankTable, {
    type: 'stars',
    rankLabel: '星级',
    columns: [
        { key: 'OverWriteCoolTime', label: '冷却时间', unit: '秒' },
        { key: 'OverWriteEffectTime', label: '持续时间', unit: '秒' }
    ],
    rows: [
        { rank: 0, values: [30, 10] },
        { rank: 1, values: [25, 12] },
        { rank: 2, values: [20, 14] },
        { rank: 3, values: [15, 16] },
        { rank: 4, values: [8, 20] }
    ]
}, '普通伙伴技能的 PalDB 1~5 级必须转成本站 0~4 星，并保留全部参数列');

const ranch = parseDetailPartnerSkill(
    fixture('放牧十级表片段.html'),
    'SheepBall',
    'https://paldb.cc/cn/Lamball'
);
assert.strictEqual(ranch.rankTable.type, 'levels', '放牧表必须按等级展示');
assert.deepStrictEqual(ranch.rankTable.columns.map(function(column) { return column.label; }), ['产物', '数量', '产出概率']);
assert.deepStrictEqual(ranch.rankTable.rows[0], { rank: 1, values: ['羊毛', '1', '100%'] });
assert.deepStrictEqual(ranch.rankTable.rows[9], { rank: 10, values: ['羊毛', '3–10', '100%'] }, 'PalDB 最后一行的 0 必须归一成 10 级');

const noSkill = parseDetailPartnerSkill(
    fixture('空伙伴技能片段.html'),
    'RAID_YakushimaBoss002',
    'https://paldb.cc/cn/Moon_Lord'
);
assert.strictEqual(noSkill.hasPartnerSkill, false, '空白伙伴技能栏必须明确识别成无伙伴技能');

const jump = parseDetailPartnerSkill(
    fixture('透明化等级表片段.html')
        .replace(/LizardMan/g, 'KendoFrog')
        .replace(/透明化/g, '蓄势跳跃')
        .replace('发动后<span>(10~20)</span>秒内变得透明。', '玩家踩上去后能高高跳起，在落地前攻击力提升。')
        .replace(/OverWriteCoolTime/g, 'MainValue')
        .replace(/<div>OverWriteEffectTime [^<]+<\/div>/g, ''),
    'KendoFrog',
    'https://paldb.cc/cn/Croajiro'
);
assert.strictEqual(jump.rankTable.columns[0].label, '起跳力度', '跳跃技能的 MainValue 不能误标成攻击力提升');

const sekhmet = parseDetailPartnerSkill(
    fixture('沙漠女帝等级表片段.html'),
    'Sekhmet',
    'https://paldb.cc/cn/Sekhmet'
);
assert.deepStrictEqual(
    sekhmet.rankTable.columns.map(function(column) { return column.label; }),
    ['阿努比斯工作速度提升', '塞赫麦特作业效率提升'],
    '沙漠女帝的两组工作加成不能因为泛化列名相同而被合并'
);
assert.deepStrictEqual(
    sekhmet.rankTable.rows.map(function(row) { return row.values; }),
    [[20, 30], [24, 36], [28, 42], [32, 48], [40, 60]],
    '沙漠女帝必须保留两组完整的 0~4 星数值'
);

const commaValues = parseDetailPartnerSkill(
    fixture('透明化等级表片段.html')
        .replace(/LizardMan/g, 'CaptainPenguin')
        .replace(/透明化/g, '勇敢的海之战士')
        .replace('发动后<span>(10~20)</span>秒内变得透明。', '击倒火属性帕鲁时获得的掉落道具增加(40~80)%。')
        .replace(/OverWriteCoolTime/g, 'ElementAddDrop_Fire_PAL')
        .replace(/<div>OverWriteEffectTime [^<]+<\/div>/g, '')
        .replace(/ElementAddDrop_Fire_PAL (\d+)/g, '$&, $1'),
    'CaptainPenguin',
    'https://paldb.cc/cn/Penking'
);
assert.deepStrictEqual(
    commaValues.rankTable.rows.map(function(row) { return row.values[0]; }),
    [30, 25, 20, 15, 8],
    '同一参数写成两个逗号分隔值时，也必须保留逐星数值'
);

const localizedSkillTable = parseDetailPartnerSkill(
    fixture('透明化等级表片段.html')
        .replace(/LizardMan/g, 'WingGolem')
        .replace(/透明化/g, '钢铁守护者')
        .replace('发动后<span>(10~20)</span>秒内变得透明。', '发动后，自身的攻击力与防御力提升(50~200)%。')
        .replace(/<table class="table">[\s\S]*?<\/table>/, '<table class="table"><thead><tr><th>Lv.<th>Skill<tbody>' +
            '<tr><td>1<td><div><div>攻击 <span class="positive">+50%</span></div></div><div><div>防御 <span class="positive">+50%</span></div></div>' +
            '<tr><td>2<td><div><div>攻击 <span class="positive">+75%</span></div></div><div><div>防御 <span class="positive">+75%</span></div></div>' +
            '<tr><td>3<td><div><div>攻击 <span class="positive">+110%</span></div></div><div><div>防御 <span class="positive">+110%</span></div></div>' +
            '<tr><td>4<td><div><div>攻击 <span class="positive">+150%</span></div></div><div><div>防御 <span class="positive">+150%</span></div></div>' +
            '<tr><td>5<td><div><div>攻击 <span class="positive">+200%</span></div></div><div><div>防御 <span class="positive">+200%</span></div></div></table>'),
    'WingGolem',
    'https://paldb.cc/cn/Knocklem'
);
assert.deepStrictEqual(
    localizedSkillTable.rankTable,
    {
        type: 'stars',
        rankLabel: '星级',
        columns: [
            { key: 'localized_attack', label: '攻击力提升', unit: '%' },
            { key: 'localized_defense', label: '防御力提升', unit: '%' }
        ],
        rows: [
            { rank: 0, values: [50, 50] },
            { rank: 1, values: [75, 75] },
            { rank: 2, values: [110, 110] },
            { rank: 3, values: [150, 150] },
            { rank: 4, values: [200, 200] }
        ]
    },
    '中文 Skill 表的攻击和防御也必须拆成明确列'
);

const mixedTables = parseDetailPartnerSkill(
    fixture('透明化等级表片段.html')
        .replace(/LizardMan/g, 'NegativeKoala')
        .replace(/透明化/g, '肾上腺素')
        .replace('发动后<span>(10~20)</span>秒内变得透明。', '移动速度和工作速度提升(100~900)%，并可在牧场产出毒腺。')
        .replace(/<table class="table">[\s\S]*?<\/table>/, '<table class="table"><thead><tr><th>Lv.<th>Skill<tbody>' +
            '<tr><td>1<td><div><div>工作速度 <span class="positive">+100%</span></div></div>' +
            '<tr><td>2<td><div><div>工作速度 <span class="positive">+200%</span></div></div>' +
            '<tr><td>3<td><div><div>工作速度 <span class="positive">+400%</span></div></div>' +
            '<tr><td>4<td><div><div>工作速度 <span class="positive">+600%</span></div></div>' +
            '<tr><td>5<td><div><div>工作速度 <span class="positive">+900%</span></div></div></table>' +
            '<table class="table"><thead><tr><th>Lv.<th>speed multiplier<tbody>' +
            '<tr><td>1<td><tr><td>2<td>2<tr><td>3<td>3<tr><td>4<td>5<tr><td>5<td>7</table>' +
            '<table class="table"><thead><tr><th>Lv.<th>Item<tbody>' +
            '<tr><td>1<td><div><a>毒腺</a> <small class="itemQuantity">1</small> <span class="float-end">100%</span></div>' +
            '<tr><td>2<td><div><a>毒腺</a> <small class="itemQuantity">1–2</small> <span class="float-end">100%</span></div>' +
            '<tr><td>3<td><div><a>毒腺</a> <small class="itemQuantity">1–3</small> <span class="float-end">100%</span></div>' +
            '<tr><td>4<td><div><a>毒腺</a> <small class="itemQuantity">1–4</small> <span class="float-end">100%</span></div>' +
            '<tr><td>5<td><div><a>毒腺</a> <small class="itemQuantity">1–5</small> <span class="float-end">100%</span></div>' +
            '<tr><td>6<td><div><a>毒腺</a> <small class="itemQuantity">1–6</small> <span class="float-end">100%</span></div>' +
            '<tr><td>7<td><div><a>毒腺</a> <small class="itemQuantity">1–7</small> <span class="float-end">100%</span></div>' +
            '<tr><td>8<td><div><a>毒腺</a> <small class="itemQuantity">1–8</small> <span class="float-end">100%</span></div>' +
            '<tr><td>9<td><div><a>毒腺</a> <small class="itemQuantity">2–9</small> <span class="float-end">100%</span></div>' +
            '<tr><td>0<td><div><a>毒腺</a> <small class="itemQuantity">3–10</small> <span class="float-end">100%</span></div></table>'),
    'NegativeKoala',
    'https://paldb.cc/cn/Depresso'
);
assert.strictEqual(mixedTables.rankTables.length, 3, '混合型伙伴技能的星级效果、移动速度和牧场产出必须全部保留');
assert.strictEqual(mixedTables.rankTables[0].columns[0].label, '工作速度提升');
assert.deepStrictEqual(mixedTables.rankTables[1].rows[0], { rank: 0, values: [1] });
assert.deepStrictEqual(mixedTables.rankTables[2].rows[9], { rank: 10, values: ['毒腺', '3–10', '100%'] });

const pals = [
    { id: 'Base', 种族: 'Base', 分类: '基础', 实装状态: '正常', 中文名: '原型', 伙伴技能: '原型技能', 头像文件: 'T_Base_icon_normal.png' },
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
const taxonomyTemplate = JSON.parse(fs.readFileSync(path.join(
    __dirname, '..', '..', 'PalToolbox', '游戏内容', '幻兽帕鲁1.0', '数据包', '伙伴技能分类.json'
), 'utf8'));
const fixtureClassification = {
    meta: taxonomyTemplate.meta,
    groups: taxonomyTemplate.groups,
    facets: taxonomyTemplate.facets,
    detailTags: taxonomyTemplate.detailTags,
    assignments: {
        Base: { subcategoryIds: ['move.mount'], tagIds: ['mount.ground'], reviewStatus: 'reviewed' },
        Terra: { subcategoryIds: ['move.special'], tagIds: [], reviewStatus: 'reviewed' },
        RAID_Hand_Left: { subcategoryIds: ['combat.active_attack'], tagIds: [], reviewStatus: 'reviewed' },
        GYM_Base: { subcategoryIds: ['base.work_speed'], tagIds: [], reviewStatus: 'reviewed' }
    }
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
        RAID_Hand_Left: { skillName: '手部技能', description: '手部说明', sourceUrl: 'raid', hasPartnerSkill: true }
    },
    internalParameters: internalParameters,
    classification: fixtureClassification,
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
assert.strictEqual(built.catalog[0].iconFile, 'T_Base_icon_normal.png', '伙伴技能目录必须复用帕鲁头像文件');
assert.deepStrictEqual(built.catalog[0].usageCategoryIds, ['move'], '目录必须保存用途大类索引');
assert.deepStrictEqual(built.catalog[0].usageSubcategoryIds, ['move.mount'], '目录必须保存下级分类索引');
assert.deepStrictEqual(built.catalog[0].usageTagIds, ['mount.ground'], '目录必须保存精确标签索引');
assert.strictEqual(built.taxonomy.groups.length, 9, '生成数据必须携带九大类定义供页面读取');
assert.strictEqual(built.taxonomy.groups[0].id, 'move', '生成后的用途大类必须保留可供筛选的 id');
assert.strictEqual(built.taxonomy.groups[0].children[0].id, 'move.mount', '生成后的用途子类必须保留可供筛选的 id');
assert.strictEqual(built.taxonomy.facets[0].id, 'move.mode', '生成数据必须携带固定筛面定义');
assert.strictEqual(built.taxonomy.detailTags[0].id, 'mount.ground', '生成后的精确标签必须保留可供组合筛选的 id');

const moonLordData = buildPartnerSkillData({
    pals: [{ id: 'RAID_YakushimaBoss002', 种族: 'MoonLord', 分类: '石板Boss', 实装状态: '正常', 中文名: '月亮领主' }],
    specialRecords: {
        RAID_YakushimaBoss002: {
            skillName: '', description: '', hasPartnerSkill: false,
            rankTable: { type: 'stars', columns: [{ key: 'unused', label: '不应显示', unit: '' }], rows: [] },
            sourceUrl: 'moon'
        }
    },
    internalParameters: {
        RAID_YakushimaBoss002: { id: 'RAID_YakushimaBoss002', skillType: 'Unknown', coolDown: 0, duration: 0, values: [] }
    },
    metadata: { retrievedAt: '2026-07-22', gameVersion: 'v1.0.0', transformVersion: '1.1.0' }
});
assert.strictEqual(moonLordData.partnerSkills.RAID_YakushimaBoss002.hasPartnerSkill, false);
assert.strictEqual(moonLordData.partnerSkills.RAID_YakushimaBoss002.descriptionStatus, '无伙伴技能');
assert.strictEqual(moonLordData.partnerSkills.RAID_YakushimaBoss002.rankTable, null, '无伙伴技能的条目不能挂着无意义的等级表');

console.log('伙伴技能数据测试通过');
