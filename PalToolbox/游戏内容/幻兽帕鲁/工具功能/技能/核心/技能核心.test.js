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

core.setPartnerSkillData({
    taxonomy: {
        groups: [
            { id: 'move', label: '移动与骑乘', children: [
                { id: 'move.mount', label: '骑乘', filterable: false },
                { id: 'move.glider', label: '滑翔', facetId: 'move.mode', facetOrder: 4 },
                { id: 'move.riding_jump', label: '骑乘跳跃', filterable: false },
                { id: 'move.player_mobility', label: '玩家机动', facetId: 'move.other' }
            ] },
            { id: 'combat', label: '战斗方式', children: [{ id: 'combat.active_attack', label: '指令发动攻击' }] },
            { id: 'base', label: '放牧与据点经营', children: [{ id: 'base.ranch', label: '放牧产物与挖掘' }] }
        ],
        facets: [
            { id: 'move.mode', groupId: 'move', label: '移动方式', order: 1 },
            { id: 'move.jump_type', groupId: 'move', label: '骑乘跳跃', order: 2 },
            { id: 'move.other', groupId: 'move', label: '其他移动', order: 3 }
        ],
        detailTags: [
            { id: 'mount.ground', label: '地面骑乘', subcategoryId: 'move.mount', facetId: 'move.mode' },
            { id: 'mount.flying', label: '飞行骑乘', subcategoryId: 'move.mount', facetId: 'move.mode' },
            { id: 'jump.double', label: '骑乘二段跳', subcategoryId: 'move.riding_jump', facetId: 'move.jump_type' },
            { id: 'jump.triple', label: '骑乘三段跳', subcategoryId: 'move.riding_jump', facetId: 'move.jump_type' }
        ]
    },
    partnerSkills: {
        SheepBall: { id: 'SheepBall', palName: '棉悠悠', skillName: '茸茸盾牌', description: '可以放牧' },
        GroundDouble: { id: 'GroundDouble', palName: '地面二段', skillName: '二段跳', description: '骑乘二段跳' },
        GroundTriple: { id: 'GroundTriple', palName: '地面三段', skillName: '三段跳', description: '骑乘三段跳' },
        FlyingDouble: { id: 'FlyingDouble', palName: '飞行二段', skillName: '飞行二段跳', description: '飞行骑乘二段跳' },
        PlayerMobility: { id: 'PlayerMobility', palName: '玩家机动', skillName: '额外跳跃', description: '赋予玩家额外跳跃' },
        GroundCombat: { id: 'GroundCombat', palName: '地面战斗', skillName: '骑乘攻击', description: '地面骑乘并指令攻击' },
        GroundFlyingJumper: { id: 'GroundFlyingJumper', palName: '全能坐骑', skillName: '全能骑乘', description: '同时具备地面、飞行、二段跳和三段跳' }
    },
    catalog: [
        { palId: 'SheepBall', category: '普通帕鲁', usageCategoryIds: ['base'], usageSubcategoryIds: ['base.ranch'], usageTagIds: [] },
        { palId: 'GroundDouble', category: '普通帕鲁', usageCategoryIds: ['move'], usageSubcategoryIds: ['move.mount', 'move.riding_jump'], usageTagIds: ['mount.ground', 'jump.double'] },
        { palId: 'GroundTriple', category: '普通帕鲁', usageCategoryIds: ['move'], usageSubcategoryIds: ['move.mount', 'move.riding_jump'], usageTagIds: ['mount.ground', 'jump.triple'] },
        { palId: 'FlyingDouble', category: '普通帕鲁', usageCategoryIds: ['move'], usageSubcategoryIds: ['move.mount', 'move.riding_jump'], usageTagIds: ['mount.flying', 'jump.double'] },
        { palId: 'PlayerMobility', category: '普通帕鲁', usageCategoryIds: ['move'], usageSubcategoryIds: ['move.player_mobility'], usageTagIds: [] },
        { palId: 'GroundCombat', category: '普通帕鲁', usageCategoryIds: ['move', 'combat'], usageSubcategoryIds: ['move.mount', 'combat.active_attack'], usageTagIds: ['mount.ground'] },
        { palId: 'GroundFlyingJumper', category: '普通帕鲁', usageCategoryIds: ['move'], usageSubcategoryIds: ['move.mount', 'move.riding_jump'], usageTagIds: ['mount.ground', 'mount.flying', 'jump.double', 'jump.triple'] }
    ]
});

assert.deepStrictEqual(
    JSON.parse(JSON.stringify(core.filterPartnerSkills({ sourceCategory: '普通帕鲁', facetSelections: { base: ['base.ranch'] } }).map(function(item) { return item.id; }))),
    ['SheepBall'],
    '来源与固定筛面必须共同生效'
);
assert.deepStrictEqual(
    JSON.parse(JSON.stringify(core.filterPartnerSkills({ facetSelections: { 'move.mode': ['mount.ground', 'mount.flying'] } }).map(function(item) { return item.id; }))),
    ['GroundFlyingJumper'],
    '同一个筛面内选择地面与飞行也必须按“且”返回交集'
);
assert.deepStrictEqual(
    JSON.parse(JSON.stringify(core.filterPartnerSkills({ facetSelections: {
        'move.mode': ['mount.ground'],
        'move.jump_type': ['jump.double', 'jump.triple']
    } }).map(function(item) { return item.id; }))),
    ['GroundFlyingJumper'],
    '同一行与跨行选择都必须按“且”返回交集'
);
assert.deepStrictEqual(
    JSON.parse(JSON.stringify(core.filterPartnerSkills({ facetSelections: {
        'move.mode': ['mount.ground'],
        combat: ['combat.active_attack']
    } }).map(function(item) { return item.id; }))),
    ['GroundCombat'],
    '移动方式与战斗方式必须能够跨用途大类取交集'
);
assert.deepStrictEqual(
    JSON.parse(JSON.stringify(core.getPartnerFacetGroups().map(function(group) {
        return { id: group.id, facets: group.facets.map(function(facet) { return facet.id; }) };
    }))),
    [
        { id: 'move', facets: ['move.mode', 'move.jump_type', 'move.other'] },
        { id: 'combat', facets: ['combat'] },
        { id: 'base', facets: ['base'] }
    ],
    '核心必须把显式移动筛面和其他大类的默认筛面统一提供给界面'
);
assert.deepStrictEqual(
    JSON.parse(JSON.stringify(core.getPartnerFacetGroups()[0].facets[0].options.map(function(option) { return option.id; }))),
    ['mount.ground', 'mount.flying', 'move.glider'],
    '移动方式必须按地面、飞行、水上、滑翔的语义顺序显示'
);
const counts = JSON.parse(JSON.stringify(core.getPartnerFacetCounts({
    sourceCategory: '普通帕鲁',
    facetSelections: { 'move.jump_type': ['jump.double'] }
})));
assert.strictEqual(counts['move.mode']['mount.ground'], 2, '计数必须保留其他筛面条件并计算追加地面骑乘后的交集');
assert.strictEqual(counts['move.mode']['mount.flying'], 2, '计数必须保留其他筛面条件并计算追加飞行骑乘后的交集');
const narrowedCounts = JSON.parse(JSON.stringify(core.getPartnerFacetCounts({
    sourceCategory: '普通帕鲁',
    facetSelections: { 'move.mode': ['mount.ground'] }
})));
assert.strictEqual(narrowedCounts['move.mode']['mount.flying'], 1, '同一筛面追加飞行骑乘时，计数必须继续保留已选地面骑乘条件');
assert.deepStrictEqual(
    JSON.parse(JSON.stringify(core.getPartnerSelectedFilters({ 'move.other': ['move.player_mobility'] }))),
    [{ facetId: 'move.other', facetLabel: '其他移动', optionId: 'move.player_mobility', label: '玩家机动' }],
    '顶部已选条件必须从完整筛面状态读取，不能随着筛选项搜索被隐藏'
);

assert.strictEqual(typeof core.calculatePartnerMasonryLayout, 'undefined', '恢复同行等高后核心不应残留最短列布局算法');

console.log('技能核心测试通过');
