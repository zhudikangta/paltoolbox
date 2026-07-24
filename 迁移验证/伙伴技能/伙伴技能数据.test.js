const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
    parsePartnerSkillList,
    parseDetailPartnerSkill,
    extractTribeLinks,
    buildPartnerSkillData,
    assertFreshOutput
} = require('./伙伴技能数据核心');

const fixture = function(name) {
    return fs.readFileSync(path.join(__dirname, '测试资料', name), 'utf8');
};
const formalFile = path.join(
    __dirname, '..', '..', 'PalToolbox', '游戏内容', '幻兽帕鲁1.0', '数据包', '伙伴技能.json'
);

assert.doesNotThrow(function() {
    assertFreshOutput(
        { meta: { transformVersion: '1.6.0', records: 301 }, catalog: [{ palId: 'SheepBall' }] },
        { catalog: [{ palId: 'SheepBall' }], meta: { records: 301, transformVersion: '1.6.0' } }
    );
}, '稳定比较不应受对象字段顺序影响');
assert.throws(function() {
    assertFreshOutput(
        { meta: { transformVersion: '1.6.0', records: 301 }, catalog: [{ palId: 'SheepBall' }] },
        { meta: { transformVersion: '1.6.0', records: 300 }, catalog: [{ palId: 'SheepBall' }] }
    );
}, /正式伙伴技能数据已陈旧/, '完整重生成结果变化时 --check 必须报告正式文件陈旧');

const oneSecondInternal = buildPartnerSkillData({
    internalParameters: {
        ActionWindow: { duration: 1, coolDown: 30, description: '类型: 主动技能 | 冷却: 30s | 持续: 1s | 数值: 1星=20' },
        ActualDuration: { duration: 10, coolDown: 30 }
    }
});
assert.strictEqual(oneSecondInternal.internalParameters.ActionWindow.duration, undefined, '动作窗口 duration=1 不能进入正式数据');
assert.ok(!oneSecondInternal.internalParameters.ActionWindow.technicalDescription.includes('持续: 1s'), '动作窗口不能在正式技术说明中伪装成持续时间');
assert.strictEqual(oneSecondInternal.internalParameters.ActualDuration.duration, 10, '明确的非 1 秒持续时间必须保留');

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

const inlineTechnology = parsePartnerSkillList(
    fixture('普通列表片段.html').replace(
        /发动后，它会化身为装备在玩家身上的盾牌。<br>\r?\n\s*将它分派到<a href="Ranch">家畜牧场<\/a>，它就有机会掉落<span>羊毛<\/span>。/,
        '可骑在它的背上移动。<br>\n    骑乘期间可以进行2段跳跃，破坏树木的效率也会提升<span>(220~500)%</span>。 科技12'
    ),
    'https://paldb.cc/cn/Partner_Skill'
);
assert.strictEqual(
    inlineTechnology[0].description,
    '可骑在它的背上移动。\n骑乘期间可以进行2段跳跃，破坏树木的效率也会提升(220~500)%。\n科技12',
    '描述末尾的科技编号必须独立成段，供卡片绘制分割线'
);

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

const grassRabbitMan = parseDetailPartnerSkill(
    fixture('透明化等级表片段.html')
        .replace(/LizardMan/g, 'GrassRabbitMan')
        .replace(/透明化/g, '草原特技之星')
        .replace('发动后<span>(10~20)</span>秒内变得透明。', '若它在队伍中，可以额外进行+1次跳跃和+1次空中冲刺。（不可叠加）')
        .replace(/OverWriteCoolTime \d+/g, 'GrassRabbitMan_PartnerSkill 1, 1')
        .replace(/<div>OverWriteEffectTime [^<]+<\/div>/g, ''),
    'GrassRabbitMan',
    'https://paldb.cc/cn/Verdash'
);
assert.deepStrictEqual(
    grassRabbitMan.rankTable.columns,
    [
        { key: 'GrassRabbitMan_PartnerSkill_JumpCount', label: '额外跳跃次数', unit: '次' },
        { key: 'GrassRabbitMan_PartnerSkill_AirDash', label: '额外空中冲刺次数', unit: '次' }
    ],
    '踏春兔原始表中的两个 1 必须分别解释为额外跳跃和额外空中冲刺'
);
assert.deepStrictEqual(
    grassRabbitMan.rankTable.rows.map(function(row) { return row.values; }),
    [[1, 1], [1, 1], [1, 1], [1, 1], [1, 1]],
    '踏春兔的两个固定次数必须在 0~4 星完整保留'
);

const longCat = parseDetailPartnerSkill(
    fixture('透明化等级表片段.html')
        .replace(/LizardMan/g, 'LongCat')
        .replace(/透明化/g, '伸展喵咪')
        .replace('发动后<span>(10~20)</span>秒内变得透明。', '若它在队伍中，玩家承受的重力减弱，跳跃或坠落时会漂浮落地。（不可叠加）')
        .replace(/OverWriteCoolTime \d+/g, 'LowGravity_PartnerSkill 1')
        .replace(/<div>OverWriteEffectTime [^<]+<\/div>/g, '')
        .replace(/<tr><td>[2-5][\s\S]*?(?=<tr><td>1)/, ''),
    'LongCat',
    'https://paldb.cc/cn/Valentail'
);
assert.strictEqual(
    longCat.rankTable,
    null,
    '喵璐璐的 LowGravity=1 是固定开关，不能伪装成 1% 的重力减轻表'
);

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

const thunderDropWithPlayerDefense = parseDetailPartnerSkill(
    fixture('透明化等级表片段.html')
        .replace(/LizardMan/g, 'DarkScorpion')
        .replace(/透明化/g, '钢铁之蝎')
        .replace('发动后<span>(10~20)</span>秒内变得透明。', '若它在队伍中，玩家的防御力将提升(5~10)%，且击倒雷属性帕鲁时获得的掉落道具增加(40~80)%。')
        .replace(/<table class="table">[\s\S]*?<\/table>/, '<table class="table"><thead><tr><th>level<th>value<tbody>' +
            '<tr><td>1<td><div>ElementAddDrop_Thunder_1_PAL 40</div><div>TrainerDEF_UP_PartnerSkill_Otomo 5</div>' +
            '<tr><td>2<td><div>ElementAddDrop_Thunder_1_PAL 50</div><div>TrainerDEF_UP_PartnerSkill_Otomo 6</div>' +
            '<tr><td>3<td><div>ElementAddDrop_Thunder_1_PAL 60</div><div>TrainerDEF_UP_PartnerSkill_Otomo 7</div>' +
            '<tr><td>4<td><div>ElementAddDrop_Thunder_1_PAL 70</div><div>TrainerDEF_UP_PartnerSkill_Otomo 8</div>' +
            '<tr><td>5<td><div>ElementAddDrop_Thunder_1_PAL 80</div><div>TrainerDEF_UP_PartnerSkill_Otomo 10</div></table>'),
    'DarkScorpion',
    'https://paldb.cc/cn/DarkScorpion'
);
assert.deepStrictEqual(
    thunderDropWithPlayerDefense.rankTable.columns.map(function(column) { return column.label; }),
    ['击倒雷属性帕鲁掉落道具增加', '玩家防御力提升'],
    '雷属性掉落字段不能被同段里的玩家防御力描述误判为防御力提升'
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

const gliderMissingCells = parseDetailPartnerSkill(
    fixture('透明化等级表片段.html')
        .replace(/LizardMan/g, 'FlyingManta_Thunder')
        .replace(/透明化/g, '电风滑翔')
        .replace('发动后<span>(10~20)</span>秒内变得透明。', '若它在队伍中，会改变滑翔伞的性能。')
        .replace(/<table class="table">[\s\S]*?<\/table>/, '<table class="table table-striped table-hover"><thead><tr><th>Lv.<th>GliderMaxSpeed<th>GliderGravityScale<th>GliderSP<tbody>' +
            '<tr><td>1<td>700<td><td>9.5<tr><td>2<td>850<td>0.013<td>8<tr><td>3<td><td>0.011<td>7</table>'),
    'FlyingManta_Thunder',
    'https://paldb.cc/cn/Celaray_Lux'
);
assert.deepStrictEqual(
    gliderMissingCells.rankTable.rows.map(function(row) { return row.values; }),
    [[700, null, 9.5], [850, 0.013, 8], [null, 0.011, 7]],
    'PalDB 滑翔表的空白格必须保留为空，不能伪造成数值 0'
);

const entirelyBlankGenericTable = parseDetailPartnerSkill(
    fixture('透明化等级表片段.html')
        .replace(/LizardMan/g, 'DreamDemon')
        .replace(/透明化/g, '逐梦者')
        .replace('发动后<span>(10~20)</span>秒内变得透明。', '若它在队伍中，就会出现于玩家身边。')
        .replace(/<table class="table">[\s\S]*?<\/table>/, '<table class="table"><thead><tr><th>Lv.<th>Range<tbody>' +
            '<tr><td>1<td><tr><td>2<td><tr><td>3<td><tr><td>4<td><tr><td>5<td></table>'),
    'DreamDemon',
    'https://paldb.cc/cn/Daedream'
);
assert.strictEqual(
    entirelyBlankGenericTable.rankTable,
    null,
    '等级表的所有数据格均为空时，不能生成伪造的 0 数值表'
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
    { id: 'Base', 种族: 'Base', 图鉴编号: 10, 图鉴后缀: 'B', 分类: '基础', 实装状态: '正常', 中文名: '原型', 伙伴技能: '原型技能', 头像文件: 'T_Base_icon_normal.png' },
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
        {
            palName: '原型', skillName: '原型技能', description: '原型说明', sourceUrl: 'normal',
            researchTables: [{
                type: 'measured', rankLabel: '移动方式', sourceLabel: '实测数据',
                columns: [{ key: 'moveSpeed', label: '移动速度', unit: '' }, { key: 'sprintSpeed', label: '冲刺速度', unit: '' }, { key: 'increase', label: '提升百分比', unit: '' }],
                rows: [{ rank: '地面移动', values: [850, 1200, '—'] }, { rank: '飞行移动', values: [1100, 1600, '移动 +29.4%；冲刺 +33.3%'] }]
            }]
        },
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
assert.strictEqual(built.catalog[0].displayId, '10B', '伙伴技能目录必须复用帕鲁图鉴的完整显示编号');
assert.deepStrictEqual(
    built.partnerSkills.Base.researchTables,
    [{
        type: 'measured', rankLabel: '移动方式', sourceLabel: '实测数据',
        columns: [{ key: 'moveSpeed', label: '移动速度', unit: '' }, { key: 'sprintSpeed', label: '冲刺速度', unit: '' }, { key: 'increase', label: '提升百分比', unit: '' }],
        rows: [{ rank: '地面移动', values: [850, 1200, '—'] }, { rank: '飞行移动', values: [1100, 1600, '移动 +29.4%；冲刺 +33.3%'] }]
    }],
    '本人实测的固定表必须作为正式研究数据传入页面，不能混进星级表'
);
assert.strictEqual(built.catalog.find(function(item) { return item.palId === 'Terra'; }).displayId, '', '没有图鉴编号的帕鲁显示编号必须为空');
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
assert.deepStrictEqual(moonLordData.catalog, [], '特殊帕鲁没有伙伴技能时不能进入伙伴技能目录');

const formal = JSON.parse(fs.readFileSync(formalFile, 'utf8'));
assert.ok(formal.meta.effectBlocks, '正式数据必须记录效果块生成元数据');
assert.strictEqual(formal.meta.effectBlocks.records, 301);
assert.strictEqual(formal.meta.effectBlocks.transformVersion, '1.9.1');
assert.strictEqual(formal.partnerSkills.KendoFrog.effectBlocks.length, 2);
assert.strictEqual(formal.partnerSkills.KendoFrog_Dark.effectBlocks.length, 2);
assert.ok(
    formal.partnerSkills.DarkMechaDragon.description.includes('骑乘时移动速度提升(0~20)%。'),
    '杰诺多兰必须以游戏内真实描述写明骑乘时移动速度提升'
);
assert.ok(
    formal.partnerSkills.DarkMechaDragon.effectBlocks[0].text.includes('骑乘时移动速度提升(0~20)%。'),
    '杰诺多兰的骑乘移动速度必须归在骑乘描述块中'
);
assert.ok(
    !formal.partnerSkills.BirdDragon.description.includes('骑乘时移动速度提升(0~20)%。'),
    '杰诺多兰的游戏内修正不得误写入同样可飞行的烽歌龙'
);

console.log('伙伴技能数据测试通过');
