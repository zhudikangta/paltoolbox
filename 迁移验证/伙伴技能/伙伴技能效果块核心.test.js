const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
    unique,
    blockCapabilityIds,
    applyEffectBlocks
} = require('./伙伴技能效果块核心.js');

function createFixture() {
    return {
        taxonomy: {
            groups: [{
                id: 'move',
                children: [{ id: 'move.special' }]
            }, {
                id: 'player',
                children: [{ id: 'player.attack' }, { id: 'player.weakspot' }]
            }, {
                id: 'pal',
                children: [{ id: 'pal.active_stats' }]
            }],
            detailTags: [{ id: 'tag.attack' }]
        },
        partnerSkills: {
            KendoFrog: { name: 'KendoFrog' },
            KendoFrog_Dark: { name: 'KendoFrog_Dark' }
        },
        catalog: [{
            palId: 'KendoFrog',
            usageSubcategoryIds: ['move.special', 'player.attack'],
            usageTagIds: ['tag.attack']
        }, {
            palId: 'KendoFrog_Dark',
            usageSubcategoryIds: ['player.weakspot', 'pal.active_stats'],
            usageTagIds: []
        }],
        definitions: {
            partnerSkills: {
                KendoFrog: [{
                    text: '  KendoFrog 的特殊移动。  ',
                    subcategoryIds: ['move.special'],
                    tagIds: ['tag.attack']
                }, {
                    text: 'KendoFrog 会提升玩家攻击。',
                    subcategoryIds: ['player.attack'],
                    tagIds: []
                }],
                KendoFrog_Dark: [{
                    text: 'KendoFrog_Dark 的弱点效果。',
                    subcategoryIds: ['player.weakspot'],
                    tagIds: []
                }, {
                    text: 'KendoFrog_Dark 会强化活动帕鲁。',
                    subcategoryIds: ['player.weakspot', 'pal.active_stats'],
                    tagIds: []
                }]
            }
        }
    };
}

assert.deepStrictEqual(unique(['move.special', '', null, 'move.special', 'player.attack']), ['move.special', 'player.attack']);
assert.deepStrictEqual(
    blockCapabilityIds({ subcategoryIds: ['move.special', 'player.attack'], tagIds: ['player.attack', 'pal.active_stats'] }),
    ['move.special', 'player.attack', 'pal.active_stats']
);

const fixture = createFixture();
const result = applyEffectBlocks(fixture);

assert.strictEqual(result.partnerSkills.KendoFrog.effectBlocks.length, 2);
assert.strictEqual(
    result.partnerSkills.KendoFrog.description,
    'KendoFrog 的特殊移动。\nKendoFrog 会提升玩家攻击。'
);
assert.deepStrictEqual(
    result.partnerSkills.KendoFrog_Dark.effectBlocks[1].subcategoryIds,
    ['player.weakspot', 'pal.active_stats']
);
assert.strictEqual(fixture.partnerSkills.KendoFrog.effectBlocks, undefined, '必须深拷贝，不能改写输入事实');

const missingDefinition = createFixture();
delete missingDefinition.definitions.partnerSkills.KendoFrog_Dark;
assert.throws(
    function() { applyEffectBlocks(missingDefinition); },
    /效果块未覆盖目录/
);

const missingFact = createFixture();
missingFact.catalog.push({
    palId: 'MissingPal',
    usageSubcategoryIds: [],
    usageTagIds: []
});
missingFact.definitions.partnerSkills.MissingPal = [{ text: '缺失事实。', subcategoryIds: [], tagIds: [] }];
assert.throws(
    function() { applyEffectBlocks(missingFact); },
    /目录中的 palId 在伙伴技能事实中不存在: MissingPal/
);

function assertValidationError(change, pattern) {
    const invalid = createFixture();
    change(invalid);
    assert.throws(function() {
        applyEffectBlocks(invalid);
    }, pattern);
}

assertValidationError(function(data) {
    data.definitions.partnerSkills.KendoFrog[0].text = '   ';
}, /文本不能为空/);

assertValidationError(function(data) {
    data.definitions.partnerSkills.KendoFrog[0].subcategoryIds = ['unknown.subcategory'];
    data.catalog[0].usageSubcategoryIds = ['unknown.subcategory', 'player.attack'];
}, /引用未知下级分类: unknown\.subcategory/);

assertValidationError(function(data) {
    data.definitions.partnerSkills.KendoFrog[0].tagIds = ['unknown.tag'];
    data.catalog[0].usageTagIds = ['unknown.tag'];
}, /引用未知精确标签: unknown\.tag/);

assertValidationError(function(data) {
    data.catalog[0].usageSubcategoryIds = ['move.special'];
}, /效果块下级分类与目录不一致/);

assertValidationError(function(data) {
    data.catalog[0].usageTagIds = [];
}, /效果块精确标签与目录不一致/);

assertValidationError(function(data) {
    data.definitions.partnerSkills.KendoFrog[0] = [];
}, /第 1 个效果块必须是普通对象/);

assertValidationError(function(data) {
    data.definitions.partnerSkills.KendoFrog[0] = null;
}, function(error) {
    assert.notStrictEqual(error.name, 'TypeError');
    assert.match(error.message, /第 1 个效果块必须是普通对象/);
    assert.match(error.message, /效果块下级分类与目录不一致/);
    return true;
});

assertValidationError(function(data) {
    delete data.definitions.partnerSkills.KendoFrog[0].subcategoryIds;
}, /下级分类必须是数组/);

assertValidationError(function(data) {
    data.definitions.partnerSkills.KendoFrog[0].tagIds = 'tag.attack';
}, /精确标签必须是数组/);

assertValidationError(function(data) {
    data.definitions.partnerSkills.KendoFrog = { blocks: [] };
}, /效果块必须是数组/);

const multipleErrors = createFixture();
multipleErrors.definitions.partnerSkills.KendoFrog[0].text = '';
multipleErrors.definitions.partnerSkills.KendoFrog[0].subcategoryIds = ['unknown.subcategory'];
multipleErrors.catalog[0].usageSubcategoryIds = ['unknown.subcategory', 'player.attack'];
assert.throws(function() {
    applyEffectBlocks(multipleErrors);
}, function(error) {
    assert.match(error.message, /文本不能为空/);
    assert.match(error.message, /引用未知下级分类: unknown\.subcategory/);
    return true;
});

const formalPath = path.join(__dirname, '..', '..', 'PalToolbox', '游戏内容', '幻兽帕鲁1.0', '数据包', '伙伴技能.json');
const definitionsPath = path.join(__dirname, '伙伴技能效果块.json');
const formal = JSON.parse(fs.readFileSync(formalPath, 'utf8'));
assert.strictEqual(formal.catalog.length, 301, '正式 catalog 应有 301 条记录');

const fullDefinitions = JSON.parse(fs.readFileSync(definitionsPath, 'utf8'));
assert.deepStrictEqual(
    Object.keys(fullDefinitions.partnerSkills).sort(),
    formal.catalog.map(function(item) { return item.palId; }).sort(),
    '效果块 partnerSkills 键集合必须精确覆盖正式 catalog 的 palId'
);

assert.deepStrictEqual(fullDefinitions.meta, {
    dataRole: 'standard-effect-blocks',
    verifiedAt: '2026-07-23',
    gameVersion: 'v1.0.0',
    transformVersion: '1.6.0',
    description: '伙伴技能描述分块与分类标签对应关系；逐条人工复核，不供页面直接读取。'
});

const fullResult = applyEffectBlocks({
    partnerSkills: formal.partnerSkills,
    catalog: formal.catalog,
    taxonomy: formal.taxonomy,
    definitions: fullDefinitions
});
assert.strictEqual(fullResult.catalog.length, 301, '全量应用后应保留 301 条 catalog');

const expectedKendoFrogBlocks = [{
    text: '发动后，武道蛙会靠忠诚心和膨胀的腹部积蓄力量。玩家在踩上去后能高高跳起。',
    subcategoryIds: ['move.special'],
    tagIds: []
}, {
    text: '在落地前，玩家的攻击力提升(50~86)%。',
    subcategoryIds: ['player.attack'],
    tagIds: []
}];
const expectedDarkKendoFrogBlocks = [{
    text: '发动后，极道蛙会靠忠诚心和膨胀的腹部积蓄力量。玩家在踩上去后能高高跳起。',
    subcategoryIds: ['move.special'],
    tagIds: []
}, {
    text: '若它在队伍中，玩家和帕鲁以暗属性攻击命中敌方弱点时的伤害提升(25~40)%。（不可叠加）',
    subcategoryIds: ['player.weakspot', 'pal.active_stats'],
    tagIds: []
}];
assert.deepStrictEqual(fullResult.partnerSkills.KendoFrog.effectBlocks, expectedKendoFrogBlocks);
assert.deepStrictEqual(fullResult.partnerSkills.KendoFrog_Dark.effectBlocks, expectedDarkKendoFrogBlocks);

formal.catalog.forEach(function(item) {
    const blocks = fullDefinitions.partnerSkills[item.palId];
    const actual = fullResult.partnerSkills[item.palId];
    assert.ok(Array.isArray(actual.effectBlocks) && actual.effectBlocks.length > 0, item.palId + ' 应有至少一个效果块');
    assert.strictEqual(
        actual.description,
        blocks.map(function(block) { return block.text.trim(); }).join('\n'),
        item.palId + ' 的 description 应由效果块按顺序合成'
    );
    assert.deepStrictEqual(
        unique(blocks.flatMap(function(block) { return block.subcategoryIds; })).sort(),
        unique(item.usageSubcategoryIds).sort(),
        item.palId + ' 的下级分类并集必须与 catalog 一致'
    );
    assert.deepStrictEqual(
        unique(blocks.flatMap(function(block) { return block.tagIds; })).sort(),
        unique(item.usageTagIds).sort(),
        item.palId + ' 的精确标签并集必须与 catalog 一致'
    );
});

console.log('伙伴技能效果块核心测试通过');
