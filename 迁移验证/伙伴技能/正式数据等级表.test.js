const assert = require('assert');
const data = require('../../PalToolbox/游戏内容/幻兽帕鲁1.0/数据包/伙伴技能.json');

assert.ok(data.meta.effectBlocks, '正式数据必须记录效果块生成元数据');
assert.strictEqual(data.meta.effectBlocks.records, 301);
assert.strictEqual(data.meta.effectBlocks.transformVersion, '1.9.0');
assert.strictEqual(data.partnerSkills.KendoFrog.effectBlocks.length, 2);
assert.strictEqual(data.partnerSkills.KendoFrog_Dark.effectBlocks.length, 2);
assert.ok(
    data.partnerSkills.KendoFrog.effectBlocks[0].text.includes('玩家在踩上去后能高高跳起'),
    '武道蛙跳板动作必须保留在同一效果块'
);
assert.ok(
    data.partnerSkills.KendoFrog_Dark.effectBlocks[0].text.includes('玩家在踩上去后能高高跳起'),
    '极道蛙跳板动作必须保留在同一效果块'
);
assert.deepStrictEqual(
    data.partnerSkills.KendoFrog.rankTable.columns.map(function(column) { return column.label; }),
    ['起跳力度', '落地前玩家攻击力提升'],
    '武道蛙的起跳力度和落地前攻击力必须同时显示'
);
assert.deepStrictEqual(
    data.partnerSkills.KendoFrog.rankTable.rows.map(function(row) { return row.values; }),
    [[2500, 50], [3000, 56], [3500, 64], [4500, 74], [5500, 86]],
    '武道蛙的落地前攻击力必须按游戏内核对值显示 0~4 星'
);
assert.deepStrictEqual(
    data.partnerSkills.KendoFrog_Dark.rankTable.columns.map(function(column) { return column.label; }),
    ['起跳力度', '暗属性弱点伤害提升'],
    '极道蛙必须先显示与武道蛙相同的起跳力度，再显示自身附加效果'
);
assert.deepStrictEqual(
    data.partnerSkills.Werewolf.rankTable.rows.map(function(row) { return row.values; }),
    [[1.1, 15], [1.3, 17], [1.6, 20], [2, 24], [2.5, 30]],
    '月镰魔必须同时显示飞跃爪击威力倍数与近战攻速'
);
assert.deepStrictEqual(
    data.partnerSkills.Werewolf_Ice.rankTable.rows.map(function(row) { return row.values; }),
    [[1.1, 15], [1.3, 17], [1.6, 20], [2, 24], [2.5, 30]],
    '霜镰魔必须同时显示吹雪爪击威力倍数与近战攻速'
);
assert.deepStrictEqual(
    data.partnerSkills.CatMage.rankTable.rows.map(function(row) { return row.values; }),
    [[40, 10], [50, 15], [60, 20], [70, 30], [80, 50]],
    '暗巫猫不能把两套星级数值合并成一列'
);
assert.deepStrictEqual(
    data.partnerSkills.DrillGame.rankTable.rows.map(function(row) { return row.values; }),
    [[800], [960], [1200], [1440], [2000]],
    '碎岩龟必须显示由基础采矿值和倍率换算后的实际矿石破坏效率'
);
assert.deepStrictEqual(
    data.partnerSkills.DomeArmorDragon.rankTable.rows.map(function(row) { return row.values; }),
    [[60, 100], [65, 100], [70, 100], [75, 100], [80, 100]],
    '磐甲龙必须同时显示爆炸伤害减轻和眩晕免疫'
);
assert.deepStrictEqual(
    data.partnerSkills.FlowerDoll_Fire.rankTable.rows.map(function(row) { return row.values; }),
    [[80, 15, 100], [82, 17, 100], [84, 20, 100], [86, 24, 100], [90, 30, 100]],
    '樱丽娜必须同时显示治疗、草属性减伤和缠绕免疫'
);
assert.deepStrictEqual(
    data.partnerSkills.RedFlowerBird.rankTable.rows.map(function(row) { return row.values; }),
    [[15], [20], [23], [27], [30]],
    '大红呱必须按游戏内核对值显示无敌时间延长'
);
assert.deepStrictEqual(
    data.partnerSkills.WhiteDeer_Dark.rankTable.rows.map(function(row) { return row.values; }),
    [[40], [50], [60], [70], [80]],
    '织夜鹿必须按游戏内核对值显示并肩作战帕鲁的攻击力提升'
);

assert.deepStrictEqual(
    data.partnerSkills.MushroomDragon_Dark.rankTable.rows.map(function(row) { return row.values; }),
    [[10], [11.5], [13], [14], [15]],
    '菇波的 SAN 值下降减缓应显示减缓幅度，不能显示内部负值'
);
assert.deepStrictEqual(
    data.partnerSkills.SleeveRabbit.rankTable.columns,
    [{ key: 'PartnerSkillCoolTime_Decrease', label: '伙伴技能冷却时间缩短', unit: '%' }],
    '兔绣袖必须写明伙伴技能冷却时间缩短，而不是冷却时间秒数'
);
assert.deepStrictEqual(
    data.partnerSkills.SleeveRabbit.rankTable.rows.map(function(row) { return row.values; }),
    [[10], [15], [20], [30], [50]],
    '兔绣袖应显示冷却缩短幅度，不能显示内部负值'
);
assert.deepStrictEqual(
    data.partnerSkills.GrassMinotaur_Ice.rankTable.columns.map(function(column) { return column.label; }),
    ['浸湿目标必定冻结'],
    '冰峰陶洛斯不能展示与描述无关的攻击转草属性表'
);
assert.deepStrictEqual(
    data.partnerSkills.StuffedShark_Fire.rankTable.columns.map(function(column) { return column.label; }),
    ['指定物资重量减轻', '火属性弱点伤害提升'],
    '粉粉布偶鲨不能展示与描述无关的攻击转水属性表'
);

const genericMountedSpeedWithoutDescription = [
    'HawkBird', 'FlameBuffalo', 'PurpleSpider', 'Serpent', 'FengyunDeeper',
    'IceDeer', 'AmaterasuWolf', 'Umihebi', 'SaintCentaur', 'BlackCentaur',
    'Serpent_Ground', 'FengyunDeeper_Electric', 'ThunderDog_Ice',
    'AmaterasuWolf_Dark', 'Umihebi_Fire'
];
genericMountedSpeedWithoutDescription.forEach(function(palId) {
    const fact = data.partnerSkills[palId];
    const tables = fact.rankTables || (fact.rankTable ? [fact.rankTable] : []);
    assert.ok(
        !tables.some(function(table) {
            return table.columns.some(function(column) { return column.key === 'MoveSpeed_up_PartnerSkill_Ride_1'; });
        }),
        palId + ' 的正文没有骑乘移速效果，不能展示通用骑乘升星参数表'
    );
});

const stealth = data.partnerSkills.LizardMan.rankTable;
assert.deepStrictEqual(stealth.rows.map(function(row) { return row.rank; }), [0, 1, 2, 3, 4]);
assert.deepStrictEqual(stealth.columns.map(function(column) { return column.label; }), ['冷却时间', '持续时间']);
assert.deepStrictEqual(stealth.rows.map(function(row) { return row.values; }), [[30, 10], [25, 12], [20, 14], [15, 16], [8, 20]]);

const iceSeal = data.partnerSkills.IceSeal.rankTable;
assert.deepStrictEqual(iceSeal.columns.map(function(column) { return column.label; }), ['雪地移动速度提升', '滑行速度']);
assert.deepStrictEqual(iceSeal.rows[0].values, [80, 250]);
assert.deepStrictEqual(iceSeal.rows[4].values, [160, 1250]);

const lamball = data.partnerSkills.SheepBall.rankTable;
assert.strictEqual(lamball.type, 'levels');
assert.deepStrictEqual(lamball.rows.map(function(row) { return row.rank; }), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
assert.deepStrictEqual(lamball.rows[9].values, ['羊毛', '3–10', '100%']);

const depresso = data.partnerSkills.NegativeKoala;
assert.strictEqual(depresso.rankTables.length, 3, '瞅什魔的工作速度、移动速度和牧场产出必须全部保留');
assert.deepStrictEqual(depresso.rankTables[0].rows.map(function(row) { return row.rank; }), [0, 1, 2, 3, 4]);
assert.deepStrictEqual(depresso.rankTables[1].rows[0], { rank: 0, values: [1] });
assert.deepStrictEqual(depresso.rankTables[2].rows[9], { rank: 10, values: ['毒腺', '3–10', '100%'] });

assert.strictEqual(data.partnerSkills.MopKing.rankTable.columns[0].label, '攻击力与防御力提升');

const swee = data.partnerSkills.MopBaby.rankTable;
assert.ok(swee, '毛掸儿的伙伴技能会随星级变化，必须有等级表');
assert.deepStrictEqual(
    swee.columns.map(function(column) { return column.label; }),
    ['毛老爹攻击力提升', '毛老爹防御力提升']
);
assert.deepStrictEqual(
    swee.rows.map(function(row) { return [row.rank].concat(row.values); }),
    [[0, 12, 12], [1, 13, 13], [2, 15, 15], [3, 19, 19], [4, 24, 24]]
);

const goriratTerra = data.partnerSkills.Gorilla_Ground;
assert.deepStrictEqual(goriratTerra.description.split('\n'), [
    '发动后会解放野性之力，并在一定时间内石掌猿的攻击力将提升(75~300)%。',
    '若它在队伍中，玩家的攀爬速度提升(50~100)%。（不可叠加）'
]);
assert.deepStrictEqual(
    goriratTerra.rankTables.map(function(table) {
        return table.rows.map(function(row) { return row.values[0]; });
    }),
    [[75, 115, 165, 225, 300], [50, 60, 70, 85, 100]]
);
assert.strictEqual(data.partnerSkills.BOSS_Gorilla_Ground.description, goriratTerra.description);
assert.ok(goriratTerra.source.correction, '石掌猿必须保留研究修正证据');
assert.strictEqual(data.partnerSkills.BOSS_Gorilla_Ground.source.correction.id, goriratTerra.source.correction.id);
assert.ok(!Object.prototype.hasOwnProperty.call(data.partnerSkills.SheepBall.source, 'correction'), '没有研究修正的帕鲁不应携带空修正字段');
assert.deepStrictEqual(goriratTerra.effectBlocks.map(function(block) {
    return block.subcategoryIds;
}), [['pal.self_attack'], ['move.player_mobility']], '石掌猿正式效果块必须分别标记自身攻击力提升和玩家机动');
assert.deepStrictEqual(
    data.catalog.find(function(item) { return item.palId === 'Gorilla_Ground'; }).usageSubcategoryIds,
    ['pal.self_attack', 'move.player_mobility'],
    '石掌猿正式分类索引必须来自修正后的分类标准输入'
);

assert.deepStrictEqual(data.partnerSkills.IceCrocodile.effectBlocks[0].subcategoryIds, [
    'resource.weight',
    'resource.preserve'
], '肚肚鳄正式效果块必须同时保留减重和保鲜分类');
assert.deepStrictEqual(
    data.catalog.find(function(item) { return item.palId === 'IceCrocodile'; }).usageSubcategoryIds,
    ['resource.weight', 'resource.preserve'],
    '肚肚鳄正式分类索引必须来自修正后的分类标准输入'
);

assert.deepStrictEqual(data.partnerSkills.BlackGriffon.effectBlocks, [{
    text: '可骑在它的背上在空中飞行。\n且飞行时移动速度会提升。',
    subcategoryIds: ['move.mount', 'move.mounted_speed'],
    tagIds: ['mount.flying']
}, {
    text: '骑乘期间的暗属性攻击将提升(15~30)%。\n科技47',
    subcategoryIds: ['pal.mounted_element_attack'],
    tagIds: []
}], '异构格里芬的骑乘属性攻击提升必须归入帕鲁战斗能力强化');

assert.deepStrictEqual(
    data.partnerSkills.BlackGriffon.researchTables,
    [{
        type: 'measured', title: '骑乘移动速度', rankLabel: '移动方式', sourceLabel: '实测数据',
        columns: [{ key: 'moveSpeed', label: '移动速度', unit: '' }, { key: 'sprintSpeed', label: '冲刺速度', unit: '' }, { key: 'increase', label: '提升百分比', unit: '' }],
        rows: [{ rank: '地面移动', values: [850, 1200, '—'] }, { rank: '飞行移动', values: [1100, 1600, '移动 +29.4%；冲刺 +33.3%'] }]
    }],
    '异构格里芬必须显示本人实测的地面与飞行移动速度，不得混入星级表'
);
assert.deepStrictEqual(
    data.partnerSkills.FairyDragon.researchTables,
    [{
        type: 'measured', title: '骑乘移动速度', rankLabel: '移动方式', sourceLabel: '实测数据',
        columns: [{ key: 'moveSpeed', label: '移动速度', unit: '' }, { key: 'sprintSpeed', label: '冲刺速度', unit: '' }, { key: 'increase', label: '提升百分比', unit: '' }],
        rows: [{ rank: '地面移动', values: [630, 800, '—'] }, { rank: '飞行移动', values: [700, 1000, '移动 +11.1%；冲刺 +25%'] }]
    }],
    '精灵龙必须显示本人实测的地面与飞行移动速度，不得混入星级表'
);
assert.deepStrictEqual(
    data.partnerSkills.FairyDragon_Water.researchTables,
    [{
        type: 'measured', title: '骑乘移动速度', rankLabel: '移动方式', sourceLabel: '实测数据',
        columns: [{ key: 'moveSpeed', label: '移动速度', unit: '' }, { key: 'sprintSpeed', label: '冲刺速度', unit: '' }, { key: 'increase', label: '提升百分比', unit: '' }],
        rows: [{ rank: '地面移动', values: [630, 800, '—'] }, { rank: '飞行移动', values: [700, 1000, '移动 +11.1%；冲刺 +25%'] }]
    }],
    '水灵龙应按用户确认与精灵龙相同的实测表显示'
);

const grassRabbitMan = data.partnerSkills.GrassRabbitMan;
assert.deepStrictEqual(
    grassRabbitMan.rankTable.columns,
    [
        { key: 'GrassRabbitMan_PartnerSkill_JumpCount', label: '额外跳跃次数', unit: '次' },
        { key: 'GrassRabbitMan_PartnerSkill_AirDash', label: '额外空中冲刺次数', unit: '次' }
    ],
    '踏春兔不能把两个固定次数误标成起跳力度'
);
assert.deepStrictEqual(
    grassRabbitMan.rankTable.rows.map(function(row) { return row.values; }),
    [[1, 1], [1, 1], [1, 1], [1, 1], [1, 1]],
    '踏春兔 0~4 星必须完整保留额外跳跃和额外空中冲刺'
);
assert.strictEqual(data.partnerSkills.LongCat.rankTable, null, '喵璐璐的低重力开关不能显示成 1%');

const celarayLuxGlider = data.partnerSkills.FlyingManta_Thunder.rankTables[1];
assert.deepStrictEqual(
    celarayLuxGlider.rows.map(function(row) { return row.values; }),
    [[700, null, 9.5], [850, 0.013, 8], [null, 0.011, 7], [1150, 0.009, null], [1300, 0.007, 3.5]],
    '雷米儿滑翔表必须原样保留 PalDB 缺失格，不得写成 0'
);

const deer = data.partnerSkills.Deer;
const deerGround = data.partnerSkills.Deer_Ground;
assert.deepStrictEqual(deer.description.split('\n'), [
    '可骑在它的背上移动。',
    '骑乘期间可以进行2段跳跃，破坏树木的效率也会提升(220~500)%。',
    '科技12'
], '紫霞鹿的同一骑乘条件效果不能被拆开');
assert.deepStrictEqual(deerGround.description.split('\n'), [
    '可骑在它的背上移动。',
    '骑乘期间可以进行2段跳跃。',
    '若它在据点里，其他据点帕鲁的伐木工作适应性等级+1。（不可叠加）',
    '科技21'
], '祇岳鹿的基础骑乘、骑乘二段跳和据点效果应分别成段');
assert.ok(deerGround.source.correction, '祇岳鹿的描述分段修正必须保留证据');
assert.strictEqual(deerGround.source.correction.id, 'deer-ground-description-blocks');

const ordinaryWithoutRankTable = data.catalog.filter(function(item) {
    if (item.category !== '普通帕鲁') return false;
    const fact = data.partnerSkills[item.palId];
    return fact.hasPartnerSkill !== false && !fact.rankTable && !(fact.rankTables && fact.rankTables.length);
}).map(function(item) { return item.palId; }).sort();
assert.deepStrictEqual(ordinaryWithoutRankTable, [
    'AmaterasuWolf',
    'AmaterasuWolf_Dark',
    'BlackCentaur',
    'FengyunDeeper',
    'FengyunDeeper_Electric',
    'FlameBuffalo',
    'HawkBird',
    'IceDeer',
    'LongCat',
    'PurpleSpider',
    'SaintCentaur',
    'Serpent_Ground',
    'ThunderDog_Ice',
    'Umihebi',
    'Umihebi_Fire',
    'WorldTreeDragon',
    'YakushimaMonster001',
    'YakushimaMonster001_Blue',
    'YakushimaMonster001_Pink',
    'YakushimaMonster001_Purple',
    'YakushimaMonster001_Rainbow',
    'YakushimaMonster001_Red'
].sort(), '正文没有对应数值效果的通用骑乘升星参数不能伪装成伙伴技能等级表');

assert.ok(
    data.partnerSkills.BlueDragon.rankTable.columns.some(function(column) { return column.label === '骑乘攻击转为水属性'; }),
    '属性转换列必须写明实际属性，不能只写“对应属性”'
);

assert.strictEqual(data.partnerSkills.RAID_YakushimaBoss002.hasPartnerSkill, false);
assert.strictEqual(data.partnerSkills.RAID_YakushimaBoss002.descriptionStatus, '无伙伴技能');
assert.deepStrictEqual(
    data.catalog.filter(function(item) { return item.category !== '普通帕鲁'; }).map(function(item) { return item.palId; }),
    ['BOSS_Sekhmet'],
    '特殊来源目录只能保留确实拥有伙伴技能的塞赫麦特'
);

Object.keys(data.partnerSkills).forEach(function(palId) {
    const fact = data.partnerSkills[palId];
    const tables = fact.rankTables || (fact.rankTable ? [fact.rankTable] : []);
    tables.forEach(function(table) {
        table.columns.forEach(function(column) {
            assert.ok(column.label && column.label !== column.key, palId + ' 不应显示内部参数名 ' + column.key);
            if (fact.source.mode === 'direct' && fact.hasPartnerSkill !== false) {
                assert.ok(!/效果$/.test(column.label), palId + ' 的列名必须写明数值含义，不能只写技能效果');
            }
        });
        table.rows.forEach(function(row) {
            assert.ok(row.values.every(function(value, index) {
                if (value !== null && value !== undefined) return true;
                return /^glider_/.test(String(table.columns[index] && table.columns[index].key || ''));
            }), palId + ' 的等级表只允许保留 PalDB 滑翔原表的空白格');
        });
    });
});

console.log('伙伴技能正式数据等级表测试通过');
