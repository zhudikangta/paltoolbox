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
assert.strictEqual(summary.subcategories, 97, '补齐骑乘时移动速度提升后必须有九十七个下级分类');
assert.ok(summary.assignments >= catalogIds.length, '正式分类必须覆盖整个伙伴技能目录');
const catalogIdSet = new Set(catalogIds);
const retainedNoSkillAssignments = Object.keys(classification.assignments).filter(function(palId) {
    return !catalogIdSet.has(palId);
});
assert.ok(
    retainedNoSkillAssignments.every(function(palId) {
        return classification.assignments[palId].reviewStatus === 'no-partner-skill';
    }),
    '目录外只能保留已经核实为无伙伴技能的历史审核记录'
);
assert.strictEqual(classification.meta.classificationMethod, 'manual-entry-by-entry-review', '正式分类必须明确记录为逐条人工复核');
assert.strictEqual(classification.meta.reviewedCatalogCount, catalogIds.length, '逐条人工复核数量必须覆盖完整目录');
assert.strictEqual(classification.meta.reviewedAssignmentCount, Object.keys(classification.assignments).length, '人工复核记录数必须与正式分类记录一致');
assert.strictEqual(classification.meta.classificationVersion, '2.4.0', '骑乘移动速度反查补漏后必须更新正式分类版本');
assert.ok(!fs.existsSync(path.join(__dirname, '\u751f\u6210\u4f19\u4f34\u6280\u80fd\u5206\u7c7b.js')), '不得保留根据描述自动推断分类的生成器');

const index = buildClassificationIndex(classification);
assert.strictEqual(index.subcategories['player.weapon_damage'].label, '指定武器增加伤害', '指定武器本次伤害提升必须明确写为增加伤害');
assert.strictEqual(index.subcategories['player.weapon_extra_damage'].label, '指定武器追加伤害', '指定武器命中后另行补伤必须独立分类');
assert.strictEqual(index.subcategories['player.conditional_damage'].label, '异常状态增加伤害', '异常状态下本次攻击伤害提升必须明确写为增加伤害');
assert.strictEqual(index.subcategories['player.extra_damage'].label, '异常状态追加伤害', '异常状态下命中后另行补伤必须明确写为追加伤害');
assert.strictEqual(index.subcategories['player.weakspot'].label, '弱点部位增加伤害', '弱点部位效果必须明确是增加伤害');
assert.ok(!index.subcategories['player.attack'], '不得保留泛称的玩家攻击力提升筛选');
assert.ok(!index.subcategories['player.element_convert'], '不得保留与攻击力提升方式重复的攻击属性转换筛选');
assert.strictEqual(index.subcategories['player.mounted_transform_attack'].label, '骑乘转属攻击力提升');
assert.strictEqual(index.subcategories['player.empowered_transform_attack'].label, '赋能转属攻击力提升');
assert.strictEqual(index.subcategories['player.constant_attack'].label, '常驻攻击力提升');
assert.strictEqual(index.subcategories['player.conditional_attack'].label, '条件攻击力提升');
assert.strictEqual(index.groups['pal_combat'].label, '帕鲁战斗能力强化', '帕鲁战斗分类应明确覆盖帕鲁端的战斗效果');
assert.strictEqual(index.subcategories['pal.element_attack'].label, '特定属性帕鲁攻击力提升');
assert.strictEqual(index.subcategories['pal.element_defense'].label, '特定属性帕鲁防御力提升');
assert.strictEqual(index.subcategories['pal.deployed_attack'].label, '出战帕鲁攻击力提升');
assert.strictEqual(index.subcategories['pal.deployed_defense'].label, '出战帕鲁防御力提升');
assert.strictEqual(index.subcategories['pal.self_attack'].label, '自身攻击力提升');
assert.strictEqual(index.subcategories['pal.self_defense'].label, '自身防御力提升');
assert.strictEqual(index.subcategories['pal.mounted_element_attack'].label, '骑乘时帕鲁属性攻击力提升');
assert.strictEqual(index.subcategories['pal.status_damage'].label, '异常状态增加伤害');
assert.strictEqual(index.subcategories['pal.weakspot_damage'].label, '弱点部位增加伤害');
assert.strictEqual(index.subcategories['pal.named_attack'].label, '指定帕鲁攻击力提升');
assert.strictEqual(index.subcategories['pal.named_defense'].label, '指定帕鲁防御力提升');
assert.strictEqual(index.subcategories['pal.named_move_speed'].label, '指定帕鲁移动速度提升');
assert.strictEqual(index.subcategories['pal.party_attack'].label, '队伍构成攻击力提升');
assert.strictEqual(index.subcategories['pal.party_defense'].label, '队伍构成防御力提升');
assert.strictEqual(index.subcategories['pal.party_move_speed'].label, '队伍构成移动速度提升');
assert.strictEqual(index.subcategories['pal.partner_damage'].label, '伙伴技能伤害提升');
assert.strictEqual(index.subcategories['pal.active_skill_cooldown'].label, '主动技能冷却缩短');
assert.strictEqual(index.subcategories['pal.partner_skill_cooldown'].label, '伙伴技能冷却缩短');
['pal.element_stats', 'pal.active_stats', 'pal.self_burst', 'pal.named_synergy', 'pal.party_scaling', 'pal.cooldown'].forEach(function(id) {
    assert.ok(!index.subcategories[id], '不得保留混合用途的旧分类：' + id);
});
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
assert.strictEqual(index.subcategories['base.ranch'].label, '放牧', '所有家畜牧场产出必须统一归为放牧');
assert.strictEqual(index.subcategories['capture.sphere_tracking'].label, '帕鲁球自动追踪');
assert.strictEqual(index.subcategories['capture.sphere_saving'].label, '帕鲁球节省');
assert.strictEqual(index.subcategories['resource.mining_efficiency'].label, '采矿效率提升');
assert.strictEqual(index.subcategories['resource.logging_efficiency'].label, '伐木效率提升');
assert.strictEqual(index.subcategories['utility.invisibility'].label, '隐身');
assert.strictEqual(index.subcategories['utility.stealth'].label, '降低被发现概率');
assert.ok(!index.subcategories['capture.sphere'], '不得保留混合帕鲁球追踪与节省的旧分类');
assert.ok(!index.subcategories['resource.gather'], '不得保留混合采矿与伐木的旧分类');
assert.ok(!index.subcategories['utility.vision'], '不得保留混合夜视、隐身与隐蔽的旧分类');
assert.ok(hasSubcategory('Bastet', 'base.ranch'), '喵丝特挖金币的家畜牧场效果只能归入放牧');
assert.ok(!hasSubcategory('Bastet', 'resource.special'), '喵丝特的放牧挖金币不能被当作额外资源掉落');
assert.ok(hasSubcategory('CatMage', 'capture.sphere_saving'), '暗巫猫的帕鲁球不消耗必须归入帕鲁球节省');
assert.ok(hasSubcategory('Mutant', 'capture.sphere_tracking'), '秘斯媞雅的帕鲁球自动追踪必须独立分类');
assert.ok(hasSubcategory('NaughtyCat', 'capture.egg_extra'), '笑魇猫额外捡蛋必须独立分类');
assert.ok(hasSubcategory('SakuraSaurus', 'capture.boss_egg'), '连理龙头目蛋效果必须独立分类');
assert.ok(hasSubcategory('PlantSlime', 'resource.logging_efficiency'), '叶泥泥伐木伤害提升必须归入伐木效率');
assert.ok(hasSubcategory('CuteMole', 'resource.mining_efficiency'), '遁地鼠采矿伤害提升必须归入采矿效率');
assert.ok(hasSubcategory('JellyfishFairy', 'resource.fishing_yield'), '海月仙垂钓道具增加必须与打捞分开');
assert.ok(hasSubcategory('JellyfishGhost', 'resource.salvage_yield'), '海月灵打捞道具增加必须与垂钓分开');
assert.ok(hasSubcategory('OctopusGirl', 'resource.fishing_gauge_assist'), '墨沫姬垂钓计量槽辅助必须独立分类');
assert.ok(hasSubcategory('OniGhostGirl', 'survival.enemy_attack_reduction'), '吓丝妮降低敌人攻击力必须独立归为敌人攻击力降低');
assert.ok(hasSubcategory('FlowerPrince', 'survival.status_immunity'), '夜蔓爵的中毒免疫必须单独分类');
assert.ok(hasSubcategory('FlowerPrince', 'survival.environmental_hazard_immunity'), '夜蔓爵的毒气免疫必须单独分类');
assert.ok(hasSubcategory('LizardMan', 'utility.invisibility'), '朋克蜥的透明效果必须归入隐身');
assert.ok(hasSubcategory('SmallYeti', 'utility.stealth'), '雪墩墩不容易被发现必须归入降低被发现概率');
assert.strictEqual(index.subcategories['move.mounted_speed'].label, '骑乘时移动速度提升', '骑乘加速必须作为独立可筛选用途');
assert.deepStrictEqual(
    palsInSubcategory('move.mounted_speed'),
    ['BlackGriffon', 'DarkMechaDragon', 'FairyDragon', 'FairyDragon_Water', 'Garm'],
    '所有明确写明骑乘或飞行时移动速度提升的帕鲁必须完整归入同一筛选项'
);
const manuallyVerifiedMountedWeaponPals = new Set(['GrassGolem', 'GrassGolem_Dark']);
const mountedTransformAttackPals = [
    'BlueDragon', 'BlueDragon_Ice', 'FireKirin', 'FireKirin_Dark', 'GoldenHorse',
    'HadesBird', 'HadesBird_Electric', 'IceHorse', 'IceHorse_Dark', 'Kirin_Ice',
    'KingSunfish_Thunder', 'RedArmorBird', 'SkyDragon_Grass', 'ThunderBird',
    'ThunderBird_Ice', 'WeaselDragon', 'WeaselDragon_Fire'
].sort();
const empoweredTransformAttackPals = [
    'Anubis', 'FoxMage', 'FoxMage_Dark', 'GrassMinotaur', 'IceWitch', 'ScorpionMan_Electric', 'StuffedShark'
].sort();
assert.deepStrictEqual(
    palsInSubcategory('player.mounted_transform_attack'),
    mountedTransformAttackPals,
    '骑乘转属攻击力提升必须使用逐条人工确认后的固定名单'
);
assert.deepStrictEqual(
    palsInSubcategory('player.empowered_transform_attack'),
    empoweredTransformAttackPals,
    '赋能转属攻击力提升必须使用逐条人工确认后的固定名单'
);
assert.deepStrictEqual(palsInSubcategory('player.constant_attack'), ['SharkKid', 'SharkKid_Fire'], '常驻攻击力提升必须只包含无条件队伍增益');
assert.deepStrictEqual(palsInSubcategory('player.conditional_attack'), ['ClownRabbit', 'KendoFrog', 'MonochromeQueen'], '条件攻击力提升必须只包含有明确前提的攻击力增益');
assert.deepStrictEqual(
    (classification.facets || []).filter(function(facet) { return facet.groupId === 'player_damage'; }).map(function(facet) { return facet.label; }),
    ['攻击力提升方式', '指定武器伤害', '异常状态', '其他攻击强化'],
    '玩家伤害强化必须使用四个组内小标题组织筛选项'
);
mountedTransformAttackPals.concat(empoweredTransformAttackPals).forEach(function(palId) {
    assert.ok(!hasSubcategory(palId, 'player.element_convert'), palId + ' 不得再保留重复的攻击属性转换分类');
});

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
assert.ok(hasSubcategory('Carbunclo', 'combat.weapon_form'), '翠叶鼠坐在玩家头上配合枪械攻击，必须归入帕鲁化身武器');
assert.ok(!hasSubcategory('Carbunclo', 'combat.active_attack'), '翠叶鼠不是玩家下令后独立发动攻击');
assert.ok(!hasSubcategory('Carbunclo', 'combat.follow_attack'), '翠叶鼠附着在玩家头上攻击，不是自动随行追击');
assert.ok(!hasSubcategory('BluePlatypus', 'move.glider'), '乘浪冲撞的冲浪鸭不能归入滑翔');
assert.ok(hasSubcategory('BluePlatypus', 'combat.active_attack'), '冲浪鸭必须归入指令发动攻击');
assert.ok(hasSubcategory('Eagle', 'move.glider'), '天擒鸟必须归入滑翔');
assert.ok(!hasSubcategory('Eagle', 'combat.active_attack'), '天擒鸟腾出右手使用枪械不等于指令帕鲁发动攻击');
assert.ok(!hasSubcategory('KendoFrog', 'player.weapon_operation'), '企丸王蓄势跳板不属于玩家武器蓄力');
assert.ok(hasSubcategory('KendoFrog', 'move.special'), '武道蛙跳板必须并入宽泛的特殊机动，不能单独建立只有一种能力的筛选项');
assert.ok(!index.subcategories['move.jump_assist'], '正式分类不得保留只有武道蛙一种能力的跳跃辅助分类');
assert.ok(index.subcategories['combat.pal_weapon_combat'], '战斗方式必须提供帕鲁持武器作战分类');
assert.ok(hasSubcategory('Monkey', 'combat.pal_weapon_combat'), '新叶猿掏枪改变自身战斗方式，必须归入帕鲁持武器作战');
assert.ok(hasSubcategory('Monkey_Fire', 'combat.pal_weapon_combat'), '秋叶猿掏枪改变自身战斗方式，必须归入帕鲁持武器作战');
assert.ok(hasSubcategory('BadCatgirl', 'combat.pal_weapon_combat'), '妮瞅莎掏霰弹枪改变自身战斗方式，必须归入帕鲁持武器作战');
assert.ok(hasSubcategory('PoseidonOrca', 'combat.pal_weapon_combat'), '海皇鲸以长枪协战，必须归入帕鲁持武器作战');
assert.ok(!hasSubcategory('Monkey', 'combat.active_attack'), '猴急步枪不是玩家下令指定目标的攻击');
assert.ok(!hasSubcategory('PoseidonOrca', 'combat.follow_attack'), '海皇鲸需要占用当前召唤名额，不能归入自动随行追击');
assert.ok(hasSubcategory('GrassGolem', 'combat.mounted_weapon'), '双心岩傀右手激光必须归入骑乘武装');
assert.ok(hasSubcategory('GrassGolem_Dark', 'combat.mounted_weapon'), '咒心岩傀右手激光必须归入骑乘武装');
assert.ok(!hasSubcategory('GrassGolem', 'combat.active_attack'), '双心岩傀右手激光不是指令发动攻击');
assert.ok(!hasSubcategory('GrassGolem_Dark', 'combat.active_attack'), '咒心岩傀右手激光不是指令发动攻击');
assert.ok(hasSubcategory('ElecSnail', 'player.status_buildup'), '电涡蜗为玩家攻击附加感电积蓄值');
assert.ok(hasSubcategory('OniGhostGirl', 'survival.enemy_attack_reduction'), '吓丝妮降低敌人攻击力必须归入敌人攻击力降低');
assert.ok(!index.subcategories['combat.enemy_debuff'], '只有吓丝妮一只的敌人减益不得单独占用战斗方式分类');
assert.ok(hasSubcategory('WoolFox', 'pal.element_attack'), '米露菲必须归入特定属性帕鲁攻击力提升');
assert.ok(hasSubcategory('FlameBambi', 'pal.element_defense'), '燎火鹿必须归入特定属性帕鲁防御力提升');
assert.ok(hasSubcategory('KingBahamut', 'pal.deployed_attack'), '焰煌的并肩作战攻击提升必须单独分类');
assert.ok(hasSubcategory('KingBahamut', 'pal.deployed_defense'), '焰煌的并肩作战防御提升必须单独分类');
assert.ok(hasSubcategory('Gorilla', 'pal.self_attack'), '铁拳猿的自身攻击提升必须单独分类');
assert.ok(hasSubcategory('WingGolem', 'pal.self_defense'), '泰锋的自身防御提升必须单独分类');
assert.ok(hasSubcategory('BlackGriffon', 'pal.mounted_element_attack'), '异构格里芬的 PAL 参数必须归入骑乘时帕鲁属性攻击力提升');
assert.ok(hasSubcategory('MoonQueen', 'pal.mounted_element_attack'), '辉月伊的 PAL 参数必须归入骑乘时帕鲁属性攻击力提升');
assert.ok(hasSubcategory('CactusDoll', 'pal.status_damage'), '球抱苞的玩家与帕鲁共同异常增伤必须保留帕鲁端筛选');
assert.ok(hasSubcategory('CactusDoll', 'player.conditional_damage'), '球抱苞的共同异常增伤必须同时保留玩家端筛选');
assert.ok(hasSubcategory('Kirin', 'pal.weakspot_damage'), '雷角马的玩家与帕鲁共同弱点增伤必须保留帕鲁端筛选');
assert.ok(hasSubcategory('Kirin', 'player.weakspot'), '雷角马的共同弱点增伤必须同时保留玩家端筛选');
assert.ok(hasSubcategory('Alpaca', 'pal.named_defense'), '美露帕指定君王美露帕的防御提升必须单独分类');
assert.ok(hasSubcategory('Alpaca', 'pal.named_move_speed'), '美露帕指定君王美露帕的移速提升必须单独分类');
assert.ok(hasSubcategory('KingAlpaca', 'pal.party_defense'), '君王美露帕按队伍构成获得的防御提升必须单独分类');
assert.ok(hasSubcategory('KingAlpaca', 'pal.party_move_speed'), '君王美露帕按队伍构成获得的移速提升必须单独分类');
assert.ok(hasSubcategory('GhostBeast', 'pal.active_skill_cooldown'), '噬魂兽缩短主动技能冷却必须单独分类');
assert.ok(hasSubcategory('SleeveRabbit', 'pal.partner_skill_cooldown'), '兔绣袖缩短伙伴技能冷却必须单独分类');
assert.ok(hasSubcategory('NegativeKoala', 'base.work_speed'), '瞅什魔的自身工作速度提升必须进入据点工作速度筛选');
assert.ok(hasSubcategory('NegativeKoala', 'move.special'), '瞅什魔发动后的自身移速提升必须进入特殊机动筛选');
assert.ok(hasSubcategory('JellyfishFairy', 'base.work_speed'), '海月仙的据点工作速度提升不得留在战斗强化');
assert.ok(hasSubcategory('Sekhmet', 'base.work_speed'), '塞赫麦特的据点工作速度提升不得留在战斗强化');
assert.deepStrictEqual(palsInSubcategory('combat.active_attack'), [
    'Baphomet', 'Baphomet_Dark', 'BluePlatypus', 'BluePlatypus_Fire',
    'CuteButterfly',
    'NightLady', 'NightLady_Dark', 'Ronin', 'Ronin_Dark', 'SharkKid', 'SharkKid_Fire',
    'Werewolf', 'Werewolf_Ice', 'WhiteMoth', 'YakushimaBoss001'
].sort(), '指令发动攻击必须使用逐条确认后的固定名单，不能按描述关键词扩张');
assert.deepStrictEqual(palsInSubcategory('combat.pal_weapon_combat'), [
    'BadCatgirl', 'Monkey', 'Monkey_Fire', 'PoseidonOrca'
].sort(), '帕鲁持武器作战必须使用逐条人工确认后的固定名单');
assert.ok(!hasSubcategory('IceSeal', 'move.glider'), '骑乘时下坡滑行的香草豹冰不能归入滑翔伞');
assert.ok(!hasSubcategory('IceSeal', 'combat.active_attack'), '香草豹冰的内部冲刺类型不能冒充主动攻击能力');
assert.ok(hasSubcategory('Hedgehog', 'combat.projectile_form'), '电棘鼠投向敌人的炸弹形态必须归入投掷或炮弹化');
assert.ok(hasSubcategory('Hedgehog_Ice', 'combat.projectile_form'), '冰刺鼠投向敌人的炸弹形态必须归入投掷或炮弹化');
['DarkFlameFox', 'ElecLizard', 'Mothman'].forEach(function(palId) {
    assert.ok(!hasSubcategory(palId, 'player.conditional_damage'), palId + ' 的异常状态只是触发前提，不能误归异常状态增加伤害');
    assert.ok(hasSubcategory(palId, 'player.extra_damage'), palId + ' 命中后另加一段伤害，必须归入异常状态追加伤害');
});
assert.ok(hasSubcategory('LanternButler', 'player.weapon_extra_damage'), '妖焰灯的箭矢命中后爆炸必须归入指定武器追加伤害');
assert.ok(!hasSubcategory('LanternButler', 'player.weapon_damage'), '妖焰灯不提升箭矢本次伤害，不能归入指定武器增加伤害');
assert.ok(!hasSubcategory('LanternButler', 'player.extra_damage'), '妖焰灯不需要异常状态，不能归入异常状态追加伤害');
assert.ok(hasSubcategory('FlowerDoll_Fire', 'survival.instant_heal'), '樱丽娜的生命值恢复不能漏掉');
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
        assert.ok(
            manuallyVerifiedMountedWeaponPals.has(palId) || /骑乘期间它还能(?:用|挥下).*攻击|地毯式轰炸/.test(description),
            palId + ' 只有骑乘时由帕鲁提供武器攻击，或经游戏内人工复核确认时，才能归入骑乘武装'
        );
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
