const assert = require('assert');
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

console.log('伙伴技能效果块核心测试通过');
