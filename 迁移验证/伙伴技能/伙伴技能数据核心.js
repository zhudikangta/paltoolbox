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
    return match ? textFromHtml(match[1]) : '';
}

function parseCard(card, sourceUrl) {
    const nameMatches = Array.from(card.matchAll(/<a\b(?=[^>]*\bclass=["'][^"']*\bitemname\b[^"']*["'])(?=[^>]*\bhref=["']([^"']+)["'])[^>]*>([\s\S]*?)<\/a>/gi));
    const nameMatch = nameMatches[0];
    const skillMatch = card.match(/border-left:\s*solid\s+white[^>]*>\s*<span\s+class=["']ms-2["']>([\s\S]*?)<\/span>\s*Lv\.\s*1/i);
    if (!nameMatch || !skillMatch) return null;
    const numberMatch = card.match(/#\s*([0-9]+[A-Za-z]?)\s*<\/span>/i);
    return {
        palName: textFromHtml(nameMatch[2]),
        palNumber: numberMatch ? numberMatch[1] : '',
        palSlug: decodeEntities(nameMatch[1]),
        skillName: textFromHtml(skillMatch[1]),
        description: findDescription(card, skillMatch.index + skillMatch[0].length),
        sourceUrl: sourceUrl
    };
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

function normalizeName(value) {
    return String(value || '').trim();
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
            descriptionStatus: descriptionStatus,
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
    });

    const catalog = [];
    pals.forEach(function(pal, sourceIndex) {
        const fact = partnerSkills[pal.id];
        const isOrdinary = ORDINARY_CATEGORIES.has(pal.分类);
        const hasOwnPartnerSkill = !!rawInternal[pal.id] || !!specialRecords[pal.id] || !!normalizeName(pal.伙伴技能);
        const include = isOrdinary || fact.differsFromBase || (!fact.basePalId && hasOwnPartnerSkill);
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
            terraria: pal.分类 === '泰拉瑞亚'
        });
    });
    catalog.sort(function(a, b) {
        const categoryDiff = CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category];
        if (categoryDiff) return categoryDiff;
        if (a.category === '普通帕鲁' && a.terraria !== b.terraria) return a.terraria ? 1 : -1;
        return a.sortIndex - b.sortIndex;
    });
    catalog.forEach(function(item) {
        delete item.sortIndex;
        delete item.terraria;
    });

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
                catalogEntries: catalog.length,
                conflicts: conflicts.length
            }
        },
        partnerSkills: partnerSkills,
        internalParameters: internalParameters,
        catalog: catalog,
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
    buildPartnerSkillData
};
