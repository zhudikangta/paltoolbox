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
            detailTags: []
        },
        partnerSkills: {
            KendoFrog: { name: 'KendoFrog' },
            KendoFrog_Dark: { name: 'KendoFrog_Dark' }
        },
        catalog: [{
            palId: 'KendoFrog',
            usageSubcategoryIds: ['move.special', 'player.attack'],
            usageTagIds: []
        }, {
            palId: 'KendoFrog_Dark',
            usageSubcategoryIds: ['player.weakspot', 'pal.active_stats'],
            usageTagIds: []
        }],
        definitions: {
            KendoFrog: {
                blocks: [{
                    text: '  KendoFrog 的特殊移动。  ',
                    subcategoryIds: ['move.special'],
                    tagIds: []
                }, {
                    text: 'KendoFrog 会提升玩家攻击。',
                    subcategoryIds: ['player.attack'],
                    tagIds: []
                }]
            },
            KendoFrog_Dark: {
                blocks: [{
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
delete missingDefinition.definitions.KendoFrog_Dark;
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
missingFact.definitions.MissingPal = {
    blocks: [{ text: '缺失事实。', subcategoryIds: [], tagIds: [] }]
};
assert.throws(
    function() { applyEffectBlocks(missingFact); },
    /目录中的 palId 在伙伴技能事实中不存在: MissingPal/
);

console.log('伙伴技能效果块核心测试通过');
