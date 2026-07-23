const ORDINARY_CATEGORIES = new Set(['基础', '亚种', '泰拉瑞亚']);
const CATEGORY_NAME = {
    '石板Boss': '石板Boss',
    '塔主Boss': '塔主Boss',
    'Boss变体': 'Boss',
    '狂暴化': '狂暴化'
};
const CATEGORY_ORDER = {
    '普通帕鲁': 0,
    '石板Boss': 1,
    '塔主Boss': 2,
    'Boss': 3,
    '狂暴化': 4,
    '其他': 5
};
const { decorateCatalog } = require('./伙伴技能分类核心');

function decodeEntities(value) {
    const named = {
        amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
        ndash: '–', mdash: '—', hellip: '…'
    };
    return String(value || '').replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, function(_, entity) {
        if (entity[0] === '#') {
            const radix = entity[1].toLowerCase() === 'x' ? 16 : 10;
            const digits = radix === 16 ? entity.slice(2) : entity.slice(1);
            return String.fromCodePoint(parseInt(digits, radix));
        }
        return Object.prototype.hasOwnProperty.call(named, entity.toLowerCase()) ? named[entity.toLowerCase()] : _;
    });
}

function textFromHtml(value) {
    return decodeEntities(String(value || '')
        .replace(/<br\s*\/?\s*>/gi, '\n')
        .replace(/<\/p\s*>/gi, '\n')
        .replace(/<[^>]+>/g, ''))
        .replace(/\r/g, '')
        .split('\n')
        .map(function(line) { return line.replace(/[\t ]+/g, ' ').trim(); })
        .filter(Boolean)
        .join('\n')
        .trim();
}

function normalizeDescription(value) {
    return String(value || '').replace(/[ \t]+(科技\d+)[ \t]*$/, '\n$1').trim();
}

function splitCards(html, token) {
    const source = String(html || '');
    const starts = [];
    let cursor = 0;
    while ((cursor = source.indexOf(token, cursor)) >= 0) {
        starts.push(cursor);
        cursor += token.length;
    }
    return starts.map(function(start, index) {
        return source.slice(start, starts[index + 1] == null ? source.length : starts[index + 1]);
    });
}

function findDescription(card, afterIndex) {
    const source = card.slice(Math.max(0, afterIndex));
    const match = source.match(/<div\s+class=["']flex-grow-1 ms-2["'][^>]*>([\s\S]*?)<\/div>/i);
    return match ? normalizeDescription(textFromHtml(match[1])) : '';
}

const PARTNER_PARAMETER_LABELS = {
    OverWriteCoolTime: { label: '冷却时间', unit: '秒' },
    OverWriteEffectTime: { label: '持续时间', unit: '秒' },
    CoolTime: { label: '冷却时间', unit: '秒' },
    EffectTime: { label: '持续时间', unit: '秒' }
};

const ELEMENT_LABELS = {
    Normal: '无', Fire: '火', Water: '水', Leaf: '草', Grass: '草',
    Electricity: '雷', Electric: '雷', Ice: '冰', Earth: '地', Ground: '地',
    Dark: '暗', Dragon: '龙'
};

const WORK_LABELS = {
    Collection: '采集', Cool: '冷却', Deforest: '伐木', EmitFlame: '生火',
    GenerateElectricity: '发电', Handcraft: '手工作业', Mining: '采矿',
    MonsterFarm_ToBaseCampPal: '牧场', ProductMedicine: '制药', Seeding: '播种',
    Transport: '搬运', Watering: '浇水'
};

function elementFromKey(key) {
    return Object.keys(ELEMENT_LABELS).find(function(element) {
        return new RegExp('(?:^|_)' + element + '(?:_|$)', 'i').test(key) ||
            new RegExp('GiveA' + element + '(?:_|$)', 'i').test(key);
    });
}

function descriptionPresentation(context) {
    const description = String(context && context.description || '');
    const skillName = String(context && context.skillName || '伙伴技能');
    const reducedElement = description.match(/受到的([无火水草雷冰地暗龙])属性伤害减轻/);
    if (reducedElement) return { label: reducedElement[1] + '属性伤害减轻', unit: '%' };
    if (/攻击力/.test(description) && /防御力/.test(description)) return { label: '攻击力与防御力提升', unit: '%' };
    if (/破坏矿石的效率/.test(description)) return { label: '矿石破坏效率提升', unit: '%' };
    if (/配种牧场.*产蛋速度/.test(description)) return { label: '配种牧场产蛋速度提升', unit: '%' };
    if (/孵化速度/.test(description)) return { label: '帕鲁蛋孵化速度提升', unit: '%' };
    if (/近战攻击在.*秒内命中/.test(description)) return { label: '连击判定时间', unit: '秒' };
    if (/重新装弹的速度/.test(description)) return { label: '武器装弹速度提升', unit: '%' };
    if (/化身为玩家的刀/.test(description)) return { label: '伙伴武器攻击力', unit: '' };
    if (/卷起旋风攻击/.test(description)) return { label: '旋风攻击威力', unit: '' };
    if (/爆炸攻击伤害减轻/.test(description)) return { label: '爆炸伤害减轻', unit: '%' };
    if (/非战斗状态的敌人/.test(description)) return { label: '对非战斗状态敌人伤害提升', unit: '%' };
    if (/更容易钓上高潜力帕鲁/.test(description)) return { label: '高潜力帕鲁上钩率提升', unit: '%' };
    if (/攀爬速度/.test(description)) return { label: '攀爬速度提升', unit: '%' };
    if (/下次击中弱点/.test(description)) return { label: '下次弱点伤害提升', unit: '%' };
    if (/耐久度损耗减缓/.test(description)) return { label: '耐久度损耗减缓', unit: '%' };
    if (/浸湿状态.*陷入冻结/.test(description)) return { label: '浸湿目标必定冻结', unit: '' };
    if (/不使用钥匙.*打开宝箱/.test(description)) return { label: '开锁能力等级', unit: '级' };
    if (/空中进行冲刺/.test(description)) return { label: '空中冲刺性能', unit: '' };
    if (/负重上限/.test(description)) return { label: '负重上限增加', unit: '' };
    if (/恢复.*生命值|生命值.*恢复|最大HP.*复活/.test(description)) return { label: '生命值恢复', unit: '%' };
    if (/高高跳起|跳跃/.test(description)) return { label: '起跳力度', unit: '' };
    if (/攻击速度/.test(description)) return { label: '攻击速度提升', unit: '%' };
    if (/防御力/.test(description)) return { label: '防御力提升', unit: '%' };
    if (/攻击力/.test(description)) return { label: '攻击力提升', unit: '%' };
    if (/掉落量|掉落的.*提升|掉落道具增加/.test(description)) return { label: '掉落量提升', unit: '%' };
    if (/概率/.test(description)) return { label: '触发概率', unit: '%' };
    if (/威力将提升至/.test(description)) return { label: '专属技能威力倍率', unit: '倍' };
    if (/冲向敌人|向前方突进|攻击锁定|追击|装备在手上|发射器|猛烈扫射|火焰喷射器|冷冻喷射器|冲锋枪|机关枪|霰弹枪攻击|大锤进行攻击|远程炮轰/.test(description)) {
        return { label: '伙伴技能攻击系数', unit: '' };
    }
    return { label: skillName + '效果', unit: '' };
}

function parameterPresentation(key, context) {
    if (key === 'localized_attack') return { label: '攻击力提升', unit: '%' };
    if (key === 'localized_defense') return { label: '防御力提升', unit: '%' };
    if (key === 'localized_work_speed') return { label: '工作速度提升', unit: '%' };
    if (/WorkSpeedUp_Sekhmet_PartnerSkill/i.test(key)) return { label: '阿努比斯工作速度提升', unit: '%' };
    if (/^CraftSpeed_PartnerSkill/i.test(key) && /Sekhmet/i.test(String(context && context.palId || ''))) {
        return { label: '塞赫麦特作业效率提升', unit: '%' };
    }
    if (key === 'GrassRabbitMan_PartnerSkill_JumpCount') return { label: '额外跳跃次数', unit: '次' };
    if (key === 'GrassRabbitMan_PartnerSkill_AirDash') return { label: '额外空中冲刺次数', unit: '次' };
    if (/^Element(?:Normal|Fire|Water|Leaf|Grass|Electricity|Electric|Ice|Earth|Ground|Dark|Dragon)$/i.test(key)) {
        const element = key.replace(/^Element/i, '');
        return { label: '玩家攻击转为' + (ELEMENT_LABELS[element] || '对应') + '属性', unit: '' };
    }
    if (PARTNER_PARAMETER_LABELS[key]) return PARTNER_PARAMETER_LABELS[key];
    if (/Cool(?:Down)?Time/i.test(key)) return { label: '冷却时间', unit: '秒' };
    if (/(?:Effect|Duration|Enable)Time/i.test(key)) return { label: '持续时间', unit: '秒' };
    if (/MoveSpeed.*Snow|SnowType.*MoveSpeed/i.test(key)) return { label: '雪地移动速度提升', unit: '%' };
    if (key === 'MainValue' && /IceSeal/.test(String(context && context.palId || ''))) {
        return { label: '滑行速度', unit: '' };
    }
    if (key === 'MainValue') return descriptionPresentation(context);
    if (/MaxInventoryWeight/i.test(key)) return { label: '负重上限增加', unit: '' };
    if (/FallDamageInvalid/i.test(key)) return { label: '坠落伤害免疫', unit: '' };
    if (/LavaDamageInvalid/i.test(key)) return { label: '熔岩伤害免疫', unit: '' };
    if (/TemperatureInvalid_Cold/i.test(key)) return { label: '寒冷环境免疫', unit: '' };
    if (/TemperatureInvalid_Heat/i.test(key)) return { label: '炎热环境免疫', unit: '' };
    if (/TemperatureResist_Cold/i.test(key)) return { label: '耐寒等级增加', unit: '级' };
    if (/TemperatureResist_Heat/i.test(key)) return { label: '耐热等级增加', unit: '级' };
    if (/AttackUp_/i.test(key)) {
        const element = elementFromKey(key);
        return { label: (element ? ELEMENT_LABELS[element] + '属性帕鲁' : '') + '攻击力提升', unit: '%' };
    }
    if (/DefenseUp_/i.test(key)) {
        const element = elementFromKey(key);
        return { label: (element ? ELEMENT_LABELS[element] + '属性帕鲁' : '') + '防御力提升', unit: '%' };
    }
    if (/ElementBoostWeakness_/i.test(key)) {
        const element = elementFromKey(key);
        return { label: (element ? ELEMENT_LABELS[element] + '属性' : '') + '弱点伤害提升', unit: '%' };
    }
    if (/ElementBoost_/i.test(key)) {
        const element = elementFromKey(key);
        return { label: (element ? ELEMENT_LABELS[element] + '属性' : '') + '攻击力提升', unit: '%' };
    }
    if (/GiveA(?:Normal|Fire|Water|Leaf|Grass|Electricity|Electric|Ice|Earth|Ground|Dark|Dragon)_Ride/i.test(key)) {
        const element = elementFromKey(key);
        return { label: '骑乘攻击转为' + (element ? ELEMENT_LABELS[element] + '属性' : '对应属性'), unit: '' };
    }
    if (/GiveElement_TrainerATK_UP/i.test(key)) return { label: '骑乘时玩家攻击力提升', unit: '%' };
    if (/AdditionalEffect_/i.test(key)) return { label: '附加异常状态值', unit: '点' };
    if (/DamageUpTrainerAndOtomo_/i.test(key)) return { label: '对异常状态目标伤害提升', unit: '%' };
    if (/DamageUpWeapon/i.test(key)) return { label: '指定武器伤害提升', unit: '%' };
    if (/DamageUpPartnerSkillAttack/i.test(key)) return { label: '伙伴技能伤害提升', unit: '%' };
    if (/DamageUp_LastBullet/i.test(key)) return { label: '弹匣最后一发伤害提升', unit: '%' };
    if (/WeakDamage_ActiveOtomo/i.test(key)) return { label: '弱点伤害提升', unit: '%' };
    if (/AttackSpeedUp/i.test(key)) return { label: '攻击速度提升', unit: '%' };
    if (/AttackRateHPThreshold/i.test(key)) return { label: '低生命值时攻击力提升', unit: '%' };
    if (/RecoverHPOnHPThreshold/i.test(key)) return { label: '生命值恢复', unit: '%' };
    if (/RegeneHPRate/i.test(key)) return { label: '每秒生命值恢复', unit: '%' };
    if (/LifeSteal/i.test(key)) return { label: '生命偷取', unit: '%' };
    if (/ShieldDamageCutRate/i.test(key)) return { label: '护盾承受伤害降低', unit: '%' };
    if (/ShieldDamage/i.test(key)) return { label: '护盾耐久', unit: '' };
    if (/WorkSuitabilityAddRank_/i.test(key)) {
        const workKey = Object.keys(WORK_LABELS).find(function(item) { return key.indexOf(item) >= 0; });
        return { label: (workKey ? WORK_LABELS[workKey] : '工作') + '适应性等级增加', unit: '级' };
    }
    if (/CraftSpeed|WorkSpeedUp/i.test(key)) return { label: '工作速度提升', unit: '%' };
    if (/FarmCropGrowupSpeed/i.test(key)) return { label: '作物生长速度提升', unit: '%' };
    if (/FarmCropHarvestNumRate/i.test(key)) return { label: '作物收获量提升', unit: '%' };
    if (/FullStomatch_Decrease/i.test(key)) return { label: '据点帕鲁饱食度下降减缓', unit: '%' };
    if (/BaseCampPal_SAN_Down/i.test(key)) return { label: '据点帕鲁SAN值下降减缓', unit: '%' };
    if (/Regene_Stomatch/i.test(key)) return { label: '饱食度恢复', unit: '%' };
    if (/Mining_up|TrainerMining/i.test(key)) return { label: '采矿效率提升', unit: '%' };
    if (/Logging_up|TrainerLogging/i.test(key)) return { label: '伐木效率提升', unit: '%' };
    if (/ItemWeightReduction/i.test(key)) return { label: '指定物资重量减轻', unit: '%' };
    if (/ItemCorruptionSpeedRate/i.test(key)) return { label: '食物腐败速度减缓', unit: '%' };
    if (/AddItemDrop|CollectItemDrop/i.test(key)) return { label: '掉落量提升', unit: '%' };
    if (/EggAlphaConversion/i.test(key)) return { label: '帕鲁蛋变为头目蛋概率', unit: '%' };
    if (/EggObtainExtraEgg/i.test(key)) return { label: '额外获得帕鲁蛋概率', unit: '%' };
    if (/MeatCut_/i.test(key)) return { label: '屠宰产物数量', unit: '' };
    if (/PalExp_Increase/i.test(key)) return { label: '获得经验提升', unit: '%' };
    if (/MoveSpeed/i.test(key)) return { label: '移动速度提升', unit: '%' };
    if (/SwimSpeed/i.test(key)) return { label: '水上移动速度提升', unit: '%' };
    if (/JumpPower/i.test(key)) return { label: '跳跃高度提升', unit: '%' };
    if (/AvoidDuration/i.test(key)) return { label: '闪避无敌时间延长', unit: '%' };
    if (/LowGravity/i.test(key)) return { label: '低重力', unit: '' };
    if (/EnemySightDetectionRate/i.test(key)) return { label: '被敌人发现概率降低', unit: '%' };
    if (/CaptureLevel/i.test(key)) return { label: '捕获力提升', unit: '%' };
    if (/SyncroPassiveWhenCapture/i.test(key)) return { label: '捕获时继承被动概率', unit: '%' };
    if (/Homing/i.test(key)) return { label: '追踪性能提升', unit: '%' };
    if (/Fishing_StartProgressAdd/i.test(key)) return { label: '垂钓初始捕获进度增加', unit: '%' };
    if (/Fishing_SuccessAmountUp/i.test(key)) return { label: '垂钓捕获进度增加量提升', unit: '%' };
    if (/Fishing_FailedAmountDown/i.test(key)) return { label: '垂钓失败时进度下降减缓', unit: '%' };
    if (/Fishing_.*Drop|FishingSalvage/i.test(key)) return { label: '垂钓额外产物概率', unit: '%' };
    if (/Defuser_ExplosiveSpore/i.test(key)) return { label: '爆炸伤害降低', unit: '%' };
    if (/DashDefence/i.test(key)) return { label: '冲刺期间减伤', unit: '%' };
    if (/ShotAttack_PartnerSkill_SpecificElement/i.test(key)) return { label: '指定属性射击伤害提升', unit: '%' };
    if (/TrainerATK_UP/i.test(key)) return { label: '玩家攻击力提升', unit: '%' };
    if (/TrainerDEF_UP/i.test(key)) return { label: '玩家防御力提升', unit: '%' };
    return descriptionPresentation(context);
}

function parseItemRankTable(tableHtml) {
    const rows = [];
    const bodyMatch = String(tableHtml || '').match(/<tbody\b[^>]*>([\s\S]*)/i);
    if (!bodyMatch) return null;
    for (const rowHtml of bodyMatch[1].split(/<tr\b[^>]*>/i).slice(1)) {
        const cells = rowHtml.split(/<td\b[^>]*>/i).slice(1);
        if (cells.length < 2) continue;
        const rawRank = Number(textFromHtml(cells[0]));
        if (!Number.isFinite(rawRank)) continue;
        const valueHtml = cells[1];
        const itemMatch = valueHtml.match(/<a\b[^>]*>([\s\S]*?)<\/a>/i);
        const quantityMatch = valueHtml.match(/class=["'][^"']*itemQuantity[^"']*["'][^>]*>([\s\S]*?)<\/small>/i);
        const chanceMatch = valueHtml.match(/class=["'][^"']*float-end[^"']*["'][^>]*>([\s\S]*?)<\/span>/i);
        rows.push({
            rank: rawRank === 0 && rows.length >= 9 ? 10 : rawRank,
            values: [
                itemMatch ? textFromHtml(itemMatch[1]) : '',
                quantityMatch ? textFromHtml(quantityMatch[1]) : '',
                chanceMatch ? textFromHtml(chanceMatch[1]) : ''
            ]
        });
    }
    if (!rows.length) return null;
    return {
        type: 'levels',
        rankLabel: '等级',
        columns: [
            { key: 'item', label: '产物', unit: '' },
            { key: 'quantity', label: '数量', unit: '' },
            { key: 'probability', label: '产出概率', unit: '' }
        ],
        rows: rows
    };
}

function parseNumericRankTable(tableHtml, context) {
    const bodyMatch = String(tableHtml || '').match(/<tbody\b[^>]*>([\s\S]*)/i);
    if (!bodyMatch) return null;
    const rowParts = bodyMatch[1].split(/<tr\b[^>]*>/i).slice(1);
    const rawRows = [];
    const keys = [];
    rowParts.forEach(function(rowHtml) {
        const rankMatch = rowHtml.match(/<td\b[^>]*>\s*(-?\d+)/i);
        if (!rankMatch) return;
        const values = {};
        for (const valueMatch of rowHtml.matchAll(/<div\b[^>]*>([\s\S]*?)<\/div>/gi)) {
            const text = textFromHtml(valueMatch[1]);
            const pair = text.match(/^([A-Za-z][A-Za-z0-9_.]*)\s+([+-]?\d+(?:\.\d+)?)(?:\s*,\s*([+-]?\d+(?:\.\d+)?))?\s*%?(?:\s*\([^)]*\))?$/);
            const localized = text.match(/^(攻击|防御|工作速度)\s*\+?(-?\d+(?:\.\d+)?)\s*%?(?:\s*\([^)]*\))?$/);
            if (!pair && !localized) continue;
            if (pair && pair[1] === 'GrassRabbitMan_PartnerSkill' && pair[3] != null) {
                const splitValues = [
                    ['GrassRabbitMan_PartnerSkill_JumpCount', pair[2]],
                    ['GrassRabbitMan_PartnerSkill_AirDash', pair[3]]
                ];
                splitValues.forEach(function(entry) {
                    if (!keys.includes(entry[0])) keys.push(entry[0]);
                    values[entry[0]] = Number(entry[1]);
                });
                continue;
            }
            const key = pair ? pair[1] : ({ '攻击': 'localized_attack', '防御': 'localized_defense', '工作速度': 'localized_work_speed' }[localized[1]]);
            if (!keys.includes(key)) keys.push(key);
            values[key] = Number(pair ? pair[2] : localized[2]);
        }
        rawRows.push({ rawRank: Number(rankMatch[1]), values: values });
    });
    if (!rawRows.length || !keys.length) return null;
    if (keys.length === 1 && keys[0] === 'LowGravity_PartnerSkill' && rawRows.every(function(row) {
        return row.values.LowGravity_PartnerSkill === 1;
    })) return null;
    const isStarTable = rawRows.length === 5 && rawRows.every(function(row) {
        return row.rawRank >= 1 && row.rawRank <= 5;
    });
    rawRows.sort(function(a, b) {
        const rankA = a.rawRank === 0 ? 10 : a.rawRank;
        const rankB = b.rawRank === 0 ? 10 : b.rawRank;
        return rankA - rankB;
    });
    const groupedColumns = [];
    keys.forEach(function(key) {
        const presentation = parameterPresentation(key, context);
        const signature = presentation.label + '\u0000' + presentation.unit;
        let group = groupedColumns.find(function(item) { return item.signature === signature; });
        if (!group) {
            group = { signature: signature, key: key, label: presentation.label, unit: presentation.unit, rawKeys: [] };
            groupedColumns.push(group);
        }
        group.rawKeys.push(key);
    });
    return {
        type: isStarTable ? 'stars' : 'levels',
        rankLabel: isStarTable ? '星级' : '等级',
        columns: groupedColumns.map(function(group) {
            return { key: group.key, label: group.label, unit: group.unit };
        }),
        rows: rawRows.map(function(row, index) {
            return {
                rank: isStarTable ? row.rawRank - 1 : (row.rawRank === 0 && index >= 9 ? 10 : row.rawRank),
                values: groupedColumns.map(function(group) {
                    for (const key of group.rawKeys) {
                        if (Object.prototype.hasOwnProperty.call(row.values, key)) return row.values[key];
                    }
                    return 0;
                })
            };
        })
    };
}

function genericColumnPresentation(header) {
    const normalized = String(header || '').trim();
    if (/^GliderMaxSpeed$/i.test(normalized)) return { key: 'glider_max_speed', label: '滑翔最大速度', unit: '' };
    if (/^GliderGravityScale$/i.test(normalized)) return { key: 'glider_gravity_scale', label: '滑翔重力倍率', unit: '倍' };
    if (/^GliderSP$/i.test(normalized)) return { key: 'glider_sp', label: '滑翔耐力消耗', unit: '' };
    if (/^Range$/i.test(normalized)) return { key: 'range', label: '探测范围', unit: '' };
    if (/^Extend Range per Sec$/i.test(normalized)) return { key: 'range_per_second', label: '每秒扩大范围', unit: '' };
    if (/^speed multiplier$/i.test(normalized)) return { key: 'speed_multiplier', label: '移动速度倍率', unit: '倍' };
    return { key: normalized.toLowerCase().replace(/[^a-z0-9]+/g, '_'), label: normalized, unit: '' };
}

function tableCells(source, tagName) {
    const pattern = new RegExp('<' + tagName + '\\b[^>]*>([\\s\\S]*?)(?=<' + tagName + '\\b|<\\/tr|<tbody\\b|<\\/thead|$)', 'gi');
    return Array.from(String(source || '').matchAll(pattern)).map(function(match) { return textFromHtml(match[1]); });
}

function parseGenericRankTable(tableHtml) {
    const headMatch = String(tableHtml || '').match(/<thead\b[^>]*>([\s\S]*?)(?:<\/thead>|<tbody\b)/i);
    const bodyMatch = String(tableHtml || '').match(/<tbody\b[^>]*>([\s\S]*)/i);
    if (!headMatch || !bodyMatch) return null;
    const headers = tableCells(headMatch[1], 'th');
    if (headers.length < 2 || /^(?:value|Skill|Item)$/i.test(headers[1])) return null;
    const columns = headers.slice(1).map(genericColumnPresentation);
    const rawRows = bodyMatch[1].split(/<tr\b[^>]*>/i).slice(1).map(function(rowHtml) {
        const cells = tableCells(rowHtml, 'td');
        const rawRank = Number(cells[0]);
        if (!Number.isFinite(rawRank)) return null;
        return {
            rawRank: rawRank,
            values: columns.map(function(column, index) {
                const rawValue = String(cells[index + 1] || '').trim();
                if (!rawValue) return column.key === 'speed_multiplier' ? 1 : 0;
                return /^[-+]?\d+(?:\.\d+)?$/.test(rawValue) ? Number(rawValue) : rawValue;
            })
        };
    }).filter(Boolean);
    if (!rawRows.length) return null;
    const isStarTable = rawRows.length === 5 && rawRows.every(function(row) { return row.rawRank >= 1 && row.rawRank <= 5; });
    rawRows.sort(function(a, b) { return (a.rawRank || 10) - (b.rawRank || 10); });
    return {
        type: isStarTable ? 'stars' : 'levels',
        rankLabel: isStarTable ? '星级' : '等级',
        columns: columns,
        rows: rawRows.map(function(row, index) {
            return {
                rank: isStarTable ? row.rawRank - 1 : (row.rawRank === 0 && index >= 9 ? 10 : row.rawRank),
                values: row.values
            };
        })
    };
}

function parseRankTables(card, context) {
    const heading = String(card || '').match(/<h5\b[^>]*>[\s\S]*?Partner Skill[\s\S]*?<\/h5>/i);
    if (!heading) return [];
    const afterHeading = card.slice(heading.index + heading[0].length);
    const nextHeading = afterHeading.search(/<h5\b/i);
    const section = afterHeading.slice(0, nextHeading >= 0 ? nextHeading : afterHeading.length);
    return Array.from(section.matchAll(/<table\b[^>]*class=["'][^"']*\btable\b[^"']*["'][^>]*>([\s\S]*?)<\/table>/gi)).map(function(match) {
        const tableHtml = match[0];
        if (/<th\b[^>]*>\s*Item|itemQuantity/i.test(tableHtml)) return parseItemRankTable(tableHtml);
        return parseNumericRankTable(tableHtml, context) || parseGenericRankTable(tableHtml);
    }).filter(Boolean);
}

function parseCard(card, sourceUrl) {
    const nameMatches = Array.from(card.matchAll(/<a\b(?=[^>]*\bclass=["'][^"']*\bitemname\b[^"']*["'])(?=[^>]*\bhref=["']([^"']+)["'])[^>]*>([\s\S]*?)<\/a>/gi));
    const nameMatch = nameMatches[0];
    const skillMatch = card.match(/border-left:\s*solid\s+white[^>]*>\s*<span\s+class=["']ms-2["']>([\s\S]*?)<\/span>\s*Lv\.\s*1/i);
    if (!nameMatch || !skillMatch) return null;
    const numberMatch = card.match(/#\s*([0-9]+[A-Za-z]?)\s*<\/span>/i);
    const skillName = textFromHtml(skillMatch[1]);
    const description = findDescription(card, skillMatch.index + skillMatch[0].length);
    const palIdMatch = card.match(/<div>\s*Code\s*<\/div>\s*<div[^>]*>\s*([^<\s]+)/i);
    const palId = palIdMatch ? decodeEntities(palIdMatch[1]).trim() : '';
    const rankTables = parseRankTables(card, { palId: palId, skillName: skillName, description: description });
    const result = {
        palName: textFromHtml(nameMatch[2]),
        palNumber: numberMatch ? numberMatch[1] : '',
        palSlug: decodeEntities(nameMatch[1]),
        skillName: skillName,
        description: description,
        hasPartnerSkill: !!(skillName || description),
        rankTable: rankTables[0] || null,
        sourceUrl: sourceUrl
    };
    if (rankTables.length > 1) result.rankTables = rankTables;
    return result;
}

function parsePartnerSkillList(html, sourceUrl) {
    let source = String(html || '');
    const tabStart = source.indexOf('<div id="伙伴技能"');
    if (tabStart >= 0) {
        const tabEnd = source.indexOf('<div id="Player"', tabStart);
        source = source.slice(tabStart, tabEnd >= 0 ? tabEnd : source.length);
    }
    return splitCards(source, '<div class="col"><div class="card itemPopup">')
        .map(function(card) { return parseCard(card, sourceUrl); })
        .filter(Boolean);
}

function parseDetailPartnerSkill(html, palId, sourceUrl) {
    const encodedId = encodeURIComponent(String(palId || '')).replace(/%2F/gi, '%2F');
    const cards = splitCards(html, '<div class="card itemPopup"');
    const card = cards.find(function(item) {
        const partnerHeading = item.search(/>\s*伙伴技能\s*</);
        const header = item.slice(0, partnerHeading >= 0 ? partnerHeading : Math.min(item.length, 6000));
        if (header.indexOf('Pals%2F' + encodedId) >= 0) return true;
        const code = item.match(/<div>\s*Code\s*<\/div>\s*<div[^>]*>\s*([^<\s]+)/i);
        return !!code && decodeEntities(code[1]).trim() === String(palId || '');
    });
    if (!card) return null;
    const parsed = parseCard(card, sourceUrl);
    if (!parsed) return null;
    parsed.palId = palId;
    return parsed;
}

function extractTribeLinks(html) {
    const match = String(html || '').match(/<h5\b[^>]*>\s*Tribes\s*<\/h5>([\s\S]*?)<\/table>/i);
    if (!match) return [];
    const links = [];
    const seen = new Set();
    for (const item of match[1].matchAll(/<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi)) {
        const href = decodeEntities(item[1]);
        if (!href || /^(?:https?:|\/|#|javascript:)/i.test(href) || seen.has(href)) continue;
        seen.add(href);
        links.push(href);
    }
    return links;
}

function stableValue(value) {
    if (Array.isArray(value)) return value.map(stableValue);
    if (!value || typeof value !== 'object') return value;
    const result = {};
    Object.keys(value).sort().forEach(function(key) {
        if (key === 'id' || key === 'nameCN') return;
        result[key === 'description' ? 'technicalDescription' : key] = stableValue(value[key]);
    });
    return result;
}

function technicalSignature(value) {
    if (!value) return '';
    return JSON.stringify(stableValue(value));
}

function cloneJson(value) {
    return JSON.parse(JSON.stringify(value));
}

function stableJsonValue(value) {
    if (Array.isArray(value)) return value.map(stableJsonValue);
    if (!value || typeof value !== 'object') return value;
    return Object.keys(value).sort().reduce(function(result, key) {
        result[key] = stableJsonValue(value[key]);
        return result;
    }, {});
}

function assertFreshOutput(generated, persisted) {
    const generatedJson = JSON.stringify(stableJsonValue(generated));
    const persistedJson = JSON.stringify(stableJsonValue(persisted));
    if (generatedJson !== persistedJson) {
        throw new Error('正式伙伴技能数据已陈旧，请运行更新伙伴技能数据.js 重新生成');
    }
}

function normalizeName(value) {
    return String(value || '').trim();
}

function palDisplayId(pal) {
    if (!pal || !pal.图鉴编号 || Number(pal.图鉴编号) <= 0) return '';
    return String(pal.图鉴编号) + String(pal.图鉴后缀 || '');
}

function palDisplayNumber(pal) {
    return Number(pal && pal.图鉴编号) || 0;
}

function catalogCategory(pal) {
    if (ORDINARY_CATEGORIES.has(pal.分类)) return '普通帕鲁';
    return CATEGORY_NAME[pal.分类] || '其他';
}

function cloneInternalParameters(source) {
    const result = {};
    Object.keys(source || {}).forEach(function(id) {
        result[id] = stableValue(Object.assign({ id: id }, source[id] || {}));
        result[id].id = id;
    });
    return result;
}

function buildPartnerSkillData(options) {
    const pals = options.pals || [];
    const normalRecords = options.normalRecords || [];
    const specialRecords = options.specialRecords || {};
    const rawInternal = options.internalParameters || {};
    const metadata = options.metadata || {};
    const normalByName = {};
    const ordinaryBySpecies = {};
    const palsById = {};
    const conflicts = [];

    normalRecords.forEach(function(record) { normalByName[normalizeName(record.palName)] = record; });
    pals.forEach(function(pal) {
        palsById[pal.id] = pal;
        if (ORDINARY_CATEGORIES.has(pal.分类) && !ordinaryBySpecies[pal.种族 || pal.id]) {
            ordinaryBySpecies[pal.种族 || pal.id] = pal;
        }
    });

    const partnerSkills = {};
    pals.forEach(function(pal) {
        const isOrdinary = ORDINARY_CATEGORIES.has(pal.分类);
        const base = isOrdinary ? pal : ordinaryBySpecies[pal.种族 || ''];
        const normalRecord = base ? normalByName[normalizeName(base.中文名)] : null;
        const specialRecord = specialRecords[pal.id] || null;
        const ownSignature = technicalSignature(rawInternal[pal.id]);
        const baseSignature = base ? technicalSignature(rawInternal[base.id]) : '';
        const differsFromBase = !!base && !!ownSignature && !!baseSignature && ownSignature !== baseSignature;
        const duplicateId = /_2$/.test(pal.id) ? pal.id.replace(/_2$/, '') : '';
        const duplicateRecord = duplicateId &&
            technicalSignature(rawInternal[duplicateId]) === ownSignature ? specialRecords[duplicateId] : null;
        let selected = null;
        let descriptionStatus = 'PalDB未收录';
        let sourceMode = 'missing';

        if (isOrdinary && normalRecord) {
            selected = normalRecord;
            descriptionStatus = normalRecord.description ? '已核对' : 'PalDB待调查';
            sourceMode = 'direct';
        } else if ((differsFromBase || !base) && specialRecord) {
            selected = specialRecord;
            descriptionStatus = specialRecord.description ? '已核对' : 'PalDB待调查';
            sourceMode = 'direct';
        } else if ((differsFromBase || !base) && duplicateRecord) {
            selected = duplicateRecord;
            descriptionStatus = duplicateRecord.description ? '重复记录一致' : 'PalDB待调查';
            sourceMode = 'duplicate';
        } else if (base && normalRecord && !differsFromBase) {
            selected = normalRecord;
            descriptionStatus = normalRecord.description ? '原型一致' : 'PalDB待调查';
            sourceMode = 'inherited';
        }

        const localSkillName = normalizeName(pal.伙伴技能);
        const sourceSkillName = normalizeName(selected && selected.skillName);
        if (localSkillName && sourceSkillName && localSkillName !== sourceSkillName) {
            conflicts.push({
                palId: pal.id,
                field: 'skillName',
                localValue: localSkillName,
                sourceValue: sourceSkillName,
                sourceUrl: selected.sourceUrl || ''
            });
        }

        partnerSkills[pal.id] = {
            id: pal.id,
            palName: normalizeName(pal.中文名) || pal.id,
            skillName: sourceSkillName || localSkillName,
            description: selected ? selected.description || '' : '',
            descriptionStatus: selected && selected.hasPartnerSkill === false ? '无伙伴技能' : descriptionStatus,
            hasPartnerSkill: selected ? selected.hasPartnerSkill !== false : !!(sourceSkillName || (selected && selected.description)),
            rankTable: selected && selected.hasPartnerSkill !== false ? selected.rankTable || null : null,
            rankTables: selected && selected.hasPartnerSkill !== false ? selected.rankTables || null : null,
            category: catalogCategory(pal),
            implementStatus: pal.实装状态 || '',
            basePalId: base && base.id !== pal.id ? base.id : '',
            differsFromBase: differsFromBase,
            source: {
                mode: sourceMode,
                url: selected && selected.sourceUrl || '',
                sourcePalId: sourceMode === 'inherited' && base ? base.id : (sourceMode === 'duplicate' ? duplicateId : pal.id)
            }
        };
        if (selected && selected.factCorrection) {
            partnerSkills[pal.id].source.correction = selected.factCorrection;
        }
    });

    const catalog = [];
    pals.forEach(function(pal, sourceIndex) {
        const fact = partnerSkills[pal.id];
        const isOrdinary = ORDINARY_CATEGORIES.has(pal.分类);
        const hasOwnPartnerSkill = !!rawInternal[pal.id] || !!specialRecords[pal.id] || !!normalizeName(pal.伙伴技能);
        const include = isOrdinary || (
            fact.hasPartnerSkill !== false &&
            (fact.differsFromBase || (!fact.basePalId && hasOwnPartnerSkill))
        );
        if (!include) return;

        if (/_2$/.test(pal.id)) {
            const originalId = pal.id.replace(/_2$/, '');
            const original = palsById[originalId];
            if (original && technicalSignature(rawInternal[originalId]) === technicalSignature(rawInternal[pal.id])) return;
        }

        catalog.push({
            palId: pal.id,
            category: fact.category,
            basePalId: fact.basePalId,
            reason: isOrdinary ? '普通帕鲁' : (fact.differsFromBase ? '与原型不同' : '无普通原型'),
            sortIndex: sourceIndex,
            displayId: palDisplayId(pal),
            displayNumber: palDisplayNumber(pal)
        });
    });
    catalog.sort(function(a, b) {
        const categoryDiff = CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category];
        if (categoryDiff) return categoryDiff;
        const aNumber = a.displayNumber > 0 ? a.displayNumber : Number.MAX_SAFE_INTEGER;
        const bNumber = b.displayNumber > 0 ? b.displayNumber : Number.MAX_SAFE_INTEGER;
        if (aNumber !== bNumber) return aNumber - bNumber;
        const suffix = String(a.displayId || '').replace(/^\d+/, '').localeCompare(String(b.displayId || '').replace(/^\d+/, ''));
        if (suffix !== 0) return suffix;
        return a.sortIndex - b.sortIndex;
    });
    catalog.forEach(function(item) {
        delete item.sortIndex;
        delete item.displayNumber;
    });

    const decoratedCatalog = options.classification
        ? decorateCatalog(catalog, palsById, options.classification)
        : catalog;
    const internalParameters = cloneInternalParameters(rawInternal);
    return {
        meta: {
            generatedAt: metadata.retrievedAt || '',
            source: {
                name: 'PalDB 简体中文站',
                url: 'https://paldb.cc/cn/Partner_Skill',
                retrievedAt: metadata.retrievedAt || '',
                gameVersion: metadata.gameVersion || '',
                transformVersion: metadata.transformVersion || ''
            },
            statistics: {
                palFacts: Object.keys(partnerSkills).length,
                internalParameters: Object.keys(internalParameters).length,
                catalogEntries: decoratedCatalog.length,
                conflicts: conflicts.length
            }
        },
        taxonomy: options.classification ? {
            meta: cloneJson(options.classification.meta || {}),
            groups: cloneJson(options.classification.groups || []),
            facets: cloneJson(options.classification.facets || []),
            detailTags: cloneJson(options.classification.detailTags || [])
        } : { meta: {}, groups: [], facets: [], detailTags: [] },
        partnerSkills: partnerSkills,
        internalParameters: internalParameters,
        catalog: decoratedCatalog,
        conflicts: conflicts
    };
}

module.exports = {
    decodeEntities,
    textFromHtml,
    parsePartnerSkillList,
    parseDetailPartnerSkill,
    extractTribeLinks,
    technicalSignature,
    buildPartnerSkillData,
    assertFreshOutput
};
