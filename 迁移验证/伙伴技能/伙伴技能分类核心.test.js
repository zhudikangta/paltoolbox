const assert = require('assert');
const {
    validateClassification,
    buildClassificationIndex,
    decorateCatalog
} = require('./伙伴技能分类核心');

function makeGroups() {
    const specs = [
        ['move', 7], ['combat', 7], ['player_damage', 8], ['pal_combat', 7],
        ['survival', 9], ['capture', 5], ['resource', 9], ['base', 8], ['utility', 5]
    ];
    return specs.map(function(spec, groupIndex) {
        return {
            id: spec[0],
            label: spec[0],
            order: groupIndex + 1,
            children: Array.from({ length: spec[1] }, function(_, childIndex) {
                return {
                    id: spec[0] + '.child_' + childIndex,
                    label: spec[0] + ' ' + childIndex,
                    order: childIndex + 1
                };
            })
        };
    });
}

function makeClassification() {
    const groups = makeGroups();
    groups[0].children[0] = { id: 'move.mount', label: '骑乘', order: 1 };
    groups[0].children[1] = { id: 'move.glider', label: '滑翔', order: 2, facetId: 'move.mode', facetOrder: 4 };
    groups[0].children[2] = { id: 'move.riding_jump', label: '骑乘跳跃', order: 3, filterable: false };
    groups[0].children[6] = { id: 'move.player_mobility', label: '玩家机动', order: 7, facetId: 'move.other' };
    groups[7].children[0] = { id: 'base.ranch', label: '放牧产物与挖掘', order: 1 };
    return {
        meta: {
            source: '本站人工用途分类，依据伙伴技能标准事实',
            classifiedAt: '2026-07-22',
            gameVersion: 'v1.0.0',
            classificationVersion: '1.0.0',
            transformVersion: '1.4.0'
        },
        groups: groups,
        facets: [
            { id: 'move.mode', groupId: 'move', label: '移动方式', order: 1 },
            { id: 'move.jump_type', groupId: 'move', label: '骑乘跳跃', order: 2 },
            { id: 'move.other', groupId: 'move', label: '其他移动', order: 3 }
        ],
        detailTags: [
            { id: 'mount.ground', label: '地面骑乘', subcategoryId: 'move.mount', kind: 'precise', facetId: 'move.mode' },
            { id: 'jump.double', label: '骑乘二段跳', subcategoryId: 'move.riding_jump', kind: 'precise', facetId: 'move.jump_type' },
            { id: 'jump.high', label: '骑乘高跳', subcategoryId: 'move.riding_jump', kind: 'precise', facetId: 'move.jump_type' }
        ],
        assignments: {
            Base: {
                subcategoryIds: ['move.mount', 'move.riding_jump'],
                tagIds: ['mount.ground', 'jump.double'],
                reviewStatus: 'reviewed'
            },
            Empty: {
                subcategoryIds: [],
                tagIds: [],
                reviewStatus: 'no-partner-skill'
            }
        }
    };
}

const classification = makeClassification();
const summary = validateClassification(classification, ['Base', 'Empty']);
assert.deepStrictEqual(summary, {
    groups: 9,
    subcategories: 65,
    detailTags: 3,
    assignments: 2
});

const index = buildClassificationIndex(classification);
assert.strictEqual(index.groups.move.label, 'move');
assert.strictEqual(index.subcategories['move.mount'].groupId, 'move');
assert.strictEqual(index.facets['move.jump_type'].label, '骑乘跳跃');

const catalog = decorateCatalog(
    [{ palId: 'Base', category: '普通帕鲁' }, { palId: 'Empty', category: '石板Boss' }],
    { Base: { 头像文件: 'T_Base_icon_normal.png' }, Empty: { 头像文件: '' } },
    classification
);
assert.deepStrictEqual(catalog[0].usageCategoryIds, ['move']);
assert.deepStrictEqual(catalog[0].usageSubcategoryIds, ['move.mount', 'move.riding_jump']);
assert.deepStrictEqual(catalog[0].usageTagIds, ['mount.ground', 'jump.double']);
assert.strictEqual(catalog[0].iconFile, 'T_Base_icon_normal.png');
assert.strictEqual(catalog[1].classificationStatus, 'no-partner-skill');

const missing = makeClassification();
delete missing.assignments.Base;
assert.throws(
    function() { validateClassification(missing, ['Base', 'Empty']); },
    /分类目录未覆盖.*Base/,
    '目录中的每个帕鲁都必须有分类或明确状态'
);

const duplicate = makeClassification();
duplicate.detailTags.push({ id: 'jump.double', label: '重复', subcategoryId: 'move.riding_jump', kind: 'precise', facetId: 'move.jump_type' });
assert.throws(
    function() { validateClassification(duplicate, ['Base', 'Empty']); },
    /重复分类 id.*jump.double/,
    '分类 id 重复时必须失败'
);

const unknownFacet = makeClassification();
unknownFacet.detailTags[0].facetId = 'move.unknown';
assert.throws(
    function() { validateClassification(unknownFacet, ['Base', 'Empty']); },
    /引用未知筛面.*move\.unknown/,
    '筛选能力不能引用不存在的筛面'
);

const unknownPal = makeClassification();
unknownPal.assignments.Ghost = { subcategoryIds: ['move.mount'], tagIds: [], reviewStatus: 'reviewed' };
assert.throws(
    function() { validateClassification(unknownPal, ['Base', 'Empty']); },
    /分类包含目录外帕鲁.*Ghost/,
    '标准分类不能静默保留目录外帕鲁'
);

console.log('伙伴技能分类核心测试通过');
