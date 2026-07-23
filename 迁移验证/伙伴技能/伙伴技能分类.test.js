const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { validateClassification, buildClassificationIndex } = require('./伙伴技能分类核心');

const projectRoot = path.resolve(__dirname, '..', '..');
const dataRoot = path.join(projectRoot, 'PalToolbox', '游戏内容', '幻兽帕鲁1.0', '数据包');
const classificationPath = path.join(dataRoot, '伙伴技能分类.json');
const partnerPath = path.join(dataRoot, '伙伴技能.json');

const readJson = function(file) {
    return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
};

assert.ok(fs.existsSync(classificationPath), '必须建立伙伴技能正式分类文件');
const classification = readJson(classificationPath);
const partnerData = readJson(partnerPath);
const catalogIds = partnerData.catalog.map(function(item) { return item.palId; });
const summary = validateClassification(classification, catalogIds);

assert.strictEqual(summary.groups, 9, '伙伴技能必须有九个用途大类');
assert.strictEqual(summary.subcategories, 65, '伙伴技能必须有六十五个下级分类');
assert.strictEqual(summary.assignments, catalogIds.length, '正式分类必须覆盖整个伙伴技能目录');
assert.strictEqual(classification.meta.classificationMethod, 'manual-entry-by-entry-review', '正式分类必须明确记录为逐条人工复核');
assert.strictEqual(classification.meta.reviewedCatalogCount, catalogIds.length, '逐条人工复核数量必须覆盖完整目录');
assert.ok(!fs.existsSync(path.join(__dirname, '\u751f\u6210\u4f19\u4f34\u6280\u80fd\u5206\u7c7b.js')), '不得保留根据描述自动推断分类的生成器');

const index = buildClassificationIndex(classification);
const assignment = function(palId) {
    assert.ok(classification.assignments[palId], '缺少关键帕鲁分类: ' + palId);
    return classification.assignments[palId];
};
const hasSubcategory = function(palId, id) { return assignment(palId).subcategoryIds.includes(id); };
const hasTag = function(palId, id) { return assignment(palId).tagIds.includes(id); };
const palsInSubcategory = function(id) {
    return Object.keys(classification.assignments).filter(function(palId) {
        return hasSubcategory(palId, id);
    }).sort();
};

assert.ok(hasSubcategory('SheepBall', 'survival.shield'), '棉悠悠必须归入护盾与屏障');
assert.ok(hasSubcategory('SheepBall', 'base.ranch'), '棉悠悠的牧场产出不能漏掉');
assert.ok(hasSubcategory('FengyunDeeper', 'move.mount'), '云海鹿必须归入骑乘');
assert.ok(hasSubcategory('FengyunDeeper', 'move.riding_jump'), '云海鹿必须归入骑乘跳跃');
assert.ok(hasTag('FengyunDeeper', 'mount.ground'), '云海鹿必须标记地面骑乘');
assert.ok(hasTag('FengyunDeeper', 'jump.double'), '云海鹿必须保留具体二段跳');
assert.ok(hasTag('SaintCentaur', 'jump.triple'), '圣光骑士必须保留具体三段跳');
assert.ok(hasTag('LegendDeer', 'jump.triple'), '默世鹿描述中的 3 段跳跃必须识别为三段跳');
assert.ok(hasTag('YakushimaMonster001', 'jump.high'), '绿史莱姆必须标记骑乘高跳');
assert.ok(hasSubcategory('GrassRabbitMan', 'move.player_mobility'), '踏春兔赋予玩家的额外跳跃和空中冲刺必须归入玩家机动');
assert.ok(hasSubcategory('LongCat', 'move.player_mobility'), '喵璐璐赋予玩家的低重力漂浮必须归入玩家机动');
assert.ok(!hasTag('GrassRabbitMan', 'jump.double'), '踏春兔赋予玩家额外跳跃不等于坐骑二段跳');
assert.ok(!classification.detailTags.some(function(tag) { return tag.id === 'jump.multi'; }), '正式分类不得保留重复的多段跳标签');
assert.ok(!hasSubcategory('LegendDeer', 'combat.mounted_weapon'), '默世鹿抵御攻击的护盾不能误判成骑乘武装');
assert.ok(!hasSubcategory('BlueDragon', 'combat.mounted_weapon'), '骑乘时玩家攻击转属性不能误判成骑乘武装');
assert.ok(hasSubcategory('LazyDragon', 'combat.mounted_weapon'), '佩克龙骑乘时使用导弹发射器必须归入骑乘武装');
assert.ok(!hasSubcategory('Carbunclo', 'move.mount'), '坐在玩家头上的翠叶鼠不能归入玩家骑乘');
assert.ok(!hasTag('Carbunclo', 'mount.ground'), '翠叶鼠不能标记为地面骑乘');
assert.ok(!hasSubcategory('BluePlatypus', 'move.glider'), '乘浪冲撞的冲浪鸭不能归入滑翔');
assert.ok(hasSubcategory('BluePlatypus', 'combat.active_attack'), '冲浪鸭必须归入指令发动攻击');
assert.ok(hasSubcategory('Eagle', 'move.glider'), '天擒鸟必须归入滑翔');
assert.ok(!hasSubcategory('Eagle', 'combat.active_attack'), '天擒鸟腾出右手使用枪械不等于指令帕鲁发动攻击');
assert.ok(!hasSubcategory('KendoFrog', 'player.weapon_operation'), '企丸王蓄势跳板不属于玩家武器蓄力');
assert.ok(hasSubcategory('KendoFrog', 'move.special'), '武道蛙跳板必须并入宽泛的特殊机动，不能单独建立只有一种能力的筛选项');
assert.ok(!index.subcategories['move.jump_assist'], '正式分类不得保留只有武道蛙一种能力的跳跃辅助分类');
assert.ok(hasSubcategory('Monkey', 'combat.active_attack'), '猴急步枪是帕鲁接受指令后持枪扫射');
assert.ok(!hasSubcategory('Monkey', 'combat.weapon_form'), '猴急步枪没有让帕鲁化身为玩家武器');
assert.ok(hasSubcategory('ElecSnail', 'player.status_buildup'), '电涡蜗为玩家攻击附加感电积蓄值');
assert.ok(hasSubcategory('OniGhostGirl', 'combat.enemy_debuff'), '吓丝妮降低敌人攻击力必须归入敌人减益');
assert.deepStrictEqual(palsInSubcategory('combat.active_attack'), [
    'BadCatgirl', 'Baphomet', 'Baphomet_Dark', 'BluePlatypus', 'BluePlatypus_Fire',
    'Carbunclo', 'CuteButterfly', 'GrassGolem', 'GrassGolem_Dark', 'Monkey', 'Monkey_Fire',
    'NightLady', 'NightLady_Dark', 'Ronin', 'Ronin_Dark', 'SharkKid', 'SharkKid_Fire',
    'Werewolf', 'Werewolf_Ice', 'WhiteMoth', 'YakushimaBoss001'
].sort(), '指令发动攻击必须使用逐条确认后的固定名单，不能按描述关键词扩张');
assert.ok(!hasSubcategory('IceSeal', 'move.glider'), '骑乘时下坡滑行的香草豹冰不能归入滑翔伞');
assert.ok(!hasSubcategory('IceSeal', 'combat.active_attack'), '香草豹冰的内部冲刺类型不能冒充主动攻击能力');
assert.ok(hasSubcategory('Hedgehog', 'combat.projectile_form'), '电棘鼠投向敌人的炸弹形态必须归入投掷或炮弹化');
assert.ok(hasSubcategory('Hedgehog_Ice', 'combat.projectile_form'), '冰刺鼠投向敌人的炸弹形态必须归入投掷或炮弹化');
assert.ok(hasSubcategory('FlowerDoll_Fire', 'survival.heal'), '樱丽娜的生命值恢复不能漏掉');
assert.ok(hasSubcategory('FlowerDoll_Fire', 'survival.damage_reduction'), '樱丽娜的草属性伤害减轻不能漏掉');
assert.ok(
    hasSubcategory('BOSS_Sekhmet', 'base.work_speed') || hasSubcategory('Sekhmet', 'base.work_speed'),
    '沙漠女帝必须归入工作速度与效率'
);

Object.keys(classification.assignments).forEach(function(palId) {
    const item = classification.assignments[palId];
    const fact = partnerData.partnerSkills[palId] || {};
    const description = String(fact.description || '');
    const isRideable = /可(?:骑在|坐在).*?(?:背上|背后的月亮)/.test(description);
    const replacesGlider = /改变滑翔伞的性能/.test(description);
    const mountTags = item.tagIds.filter(function(id) { return id.startsWith('mount.'); });
    const jumpTags = item.tagIds.filter(function(id) { return id.startsWith('jump.'); });
    const facetTags = item.tagIds.filter(function(id) { return /^(activation|target|gear)\./.test(id); });
    assert.strictEqual(facetTags.length, 0, palId + ' 不得保留无助于组合筛选的自动语义标签');
    assert.ok(['reviewed', 'no-partner-skill', 'insufficient-facts'].includes(item.reviewStatus), palId + ' 的审核状态无效');
    if (fact.hasPartnerSkill !== false && item.reviewStatus === 'reviewed') {
        assert.ok(item.subcategoryIds.length > 0, palId + ' 已审核的伙伴技能不能没有任何用途');
    }
    if (isRideable) assert.ok(item.subcategoryIds.includes('move.mount'), palId + ' 明确可供玩家骑乘却漏掉骑乘分类');
    if (replacesGlider) assert.ok(item.subcategoryIds.includes('move.glider'), palId + ' 明确替代滑翔伞却漏掉滑翔分类');
    if (item.subcategoryIds.includes('move.mount')) {
        assert.ok(/可(?:骑在|坐在).*?(?:背上|背后的月亮)/.test(description), palId + ' 只有明确写出玩家可骑在其背上时才能归入骑乘');
        assert.strictEqual(mountTags.length, 1, palId + ' 每个坐骑必须且只能标记地面、飞行或水上之一');
    } else {
        assert.strictEqual(mountTags.length, 0, palId + ' 不是坐骑却带有骑乘类型标签');
    }
    if (item.subcategoryIds.includes('move.glider')) {
        assert.ok(/改变滑翔伞的性能/.test(description), palId + ' 只有能替代滑翔伞时才能归入滑翔');
    }
    if (!item.subcategoryIds.includes('move.riding_jump')) assert.strictEqual(jumpTags.length, 0, palId + ' 没有骑乘跳跃用途却带有骑乘跳跃细分标签');
    if (item.subcategoryIds.includes('combat.mounted_weapon')) {
        assert.ok(/骑乘期间它还能(?:用|挥下).*攻击|地毯式轰炸/.test(description), palId + ' 只有骑乘时由帕鲁提供武器攻击才能归入骑乘武装');
    }
    if (/(?:2|二)段跳(?:跃)?/.test(description)) {
        if (/骑乘期间/.test(description)) assert.ok(item.tagIds.includes('jump.double'), palId + ' 的骑乘二段跳标签不完整');
    }
    if (/(?:3|三)段跳(?:跃)?/.test(description)) {
        if (/骑乘期间/.test(description)) assert.ok(item.tagIds.includes('jump.triple'), palId + ' 的骑乘三段跳标签不完整');
    }
});

if (process.argv.includes('--report')) {
    const groupCounts = {};
    Object.keys(classification.assignments).forEach(function(palId) {
        const used = new Set();
        classification.assignments[palId].subcategoryIds.forEach(function(id) {
            const subcategory = index.subcategories[id];
            if (subcategory) used.add(subcategory.groupId);
        });
        used.forEach(function(groupId) { groupCounts[groupId] = (groupCounts[groupId] || 0) + 1; });
    });
    console.log(JSON.stringify({ summary: summary, groupCounts: groupCounts }, null, 2));
}

console.log('伙伴技能正式分类测试通过');
