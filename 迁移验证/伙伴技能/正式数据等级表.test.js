const assert = require('assert');
const data = require('../../PalToolbox/游戏内容/幻兽帕鲁1.0/数据包/伙伴技能.json');

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

const ordinaryWithoutRankTable = data.catalog.filter(function(item) {
    if (item.category !== '普通帕鲁') return false;
    const fact = data.partnerSkills[item.palId];
    return fact.hasPartnerSkill !== false && !fact.rankTable && !(fact.rankTables && fact.rankTables.length);
}).map(function(item) { return item.palId; }).sort();
assert.deepStrictEqual(ordinaryWithoutRankTable, [
    'WorldTreeDragon',
    'YakushimaMonster001',
    'YakushimaMonster001_Blue',
    'YakushimaMonster001_Pink',
    'YakushimaMonster001_Purple',
    'YakushimaMonster001_Rainbow',
    'YakushimaMonster001_Red'
].sort(), '除未完成条目和不随星级改变的泰拉瑞亚史莱姆外，普通帕鲁都必须有等级表');

assert.ok(
    data.partnerSkills.BlueDragon.rankTable.columns.some(function(column) { return column.label === '骑乘攻击转为水属性'; }),
    '属性转换列必须写明实际属性，不能只写“对应属性”'
);

assert.strictEqual(data.partnerSkills.RAID_YakushimaBoss002.hasPartnerSkill, false);
assert.strictEqual(data.partnerSkills.RAID_YakushimaBoss002.descriptionStatus, '无伙伴技能');

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
            assert.ok(row.values.every(function(value) { return value !== null && value !== undefined; }), palId + ' 的等级表不应留空');
        });
    });
});

console.log('伙伴技能正式数据等级表测试通过');
