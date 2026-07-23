const fs = require('fs');
const path = require('path');
const {
    parsePartnerSkillList,
    parseDetailPartnerSkill,
    extractTribeLinks,
    technicalSignature,
    buildPartnerSkillData
} = require('./伙伴技能数据核心');
const { applyEffectBlocks } = require('./伙伴技能效果块核心.js');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const DATA_ROOT = path.join(PROJECT_ROOT, 'PalToolbox', '游戏内容', '幻兽帕鲁1.0');
const PAL_FILE = path.join(DATA_ROOT, '数据包', '帕鲁.json');
const OUTPUT_FILE = path.join(DATA_ROOT, '数据包', '伙伴技能.json');
const CLASSIFICATION_FILE = path.join(DATA_ROOT, '数据包', '伙伴技能分类.json');
const SOURCE_ROOT = path.join(DATA_ROOT, '原始来源', '伙伴技能');
const MAIN_HTML_FILE = path.join(SOURCE_ROOT, 'paldb-partner-skill.html');
const SOURCE_MANIFEST_FILE = path.join(SOURCE_ROOT, '来源.json');
const INTERNAL_SOURCE_FILE = path.join(SOURCE_ROOT, '本地解包伙伴技能-2026-07-06.json');
const SUPPLEMENTAL_RANK_TABLE_FILE = path.join(SOURCE_ROOT, '补充等级表.json');
const FACT_CORRECTION_FILE = path.join(__dirname, '伙伴技能事实修正.json');
const EFFECT_BLOCKS_FILE = path.join(__dirname, '伙伴技能效果块.json');
const DETAIL_ROOT = path.join(SOURCE_ROOT, '详情');
const ORDINARY_DETAIL_ROOT = path.join(DETAIL_ROOT, '普通');
const MAIN_URL = 'https://paldb.cc/cn/Partner_Skill';
const RETRIEVED_AT = '2026-07-22';
const GAME_VERSION = 'v1.0.0';
const TRANSFORM_VERSION = '1.6.0';
const ORDINARY_CATEGORIES = new Set(['基础', '亚种', '泰拉瑞亚']);
const FIXED_SPECIAL_PAGES = {
    RAID_YakushimaBoss001_Green: 'True_Eye_of_Cthulhu',
    RAID_YakushimaBoss002: 'Moon_Lord',
    RAID_YakushimaBoss002_Hand_Left: 'Moon_Lord',
    RAID_YakushimaBoss002_Hand_Right: 'Moon_Lord',
    RAID_YakushimaBoss002_Head: 'Moon_Lord'
};

function readJson(file) {
    return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
}

function writeJson(file, value) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function normalizeName(value) {
    return String(value || '').trim();
}

function visibleBaseName(value) {
    return normalizeName(value).replace(/[\s(（][^()（）]*(?:[)）])?\s*$/, '').trim();
}

function loadInternalParameters() {
    const raw = readJson(INTERNAL_SOURCE_FILE);
    return raw.internalParameters || raw.partnerSkills || {};
}

function buildIndexes(pals, normalRecords) {
    const ordinaryBySpecies = {};
    const ordinaryByName = {};
    const normalByName = {};
    pals.forEach(function(pal) {
        if (!ORDINARY_CATEGORIES.has(pal.分类)) return;
        if (!ordinaryBySpecies[pal.种族 || pal.id]) ordinaryBySpecies[pal.种族 || pal.id] = pal;
        ordinaryByName[normalizeName(pal.中文名)] = pal;
    });
    normalRecords.forEach(function(record) { normalByName[normalizeName(record.palName)] = record; });
    return { ordinaryBySpecies, ordinaryByName, normalByName };
}

function findBasePal(pal, indexes) {
    if (ORDINARY_CATEGORIES.has(pal.分类)) return pal;
    const bySpecies = indexes.ordinaryBySpecies[pal.种族 || ''];
    if (bySpecies) return bySpecies;
    const cleanName = visibleBaseName(pal.中文名);
    return indexes.ordinaryByName[cleanName] || null;
}

function isDuplicateTwo(pal, palsById, internal) {
    if (!/_2$/.test(pal.id)) return false;
    const original = palsById[pal.id.replace(/_2$/, '')];
    return !!original && technicalSignature(internal[original.id]) === technicalSignature(internal[pal.id]);
}

function getSpecialTargets(pals, internal, indexes) {
    const palsById = Object.fromEntries(pals.map(function(pal) { return [pal.id, pal]; }));
    return pals.filter(function(pal) {
        if (ORDINARY_CATEGORIES.has(pal.分类) || (!internal[pal.id] && !normalizeName(pal.伙伴技能))) return false;
        if (isDuplicateTwo(pal, palsById, internal)) return false;
        const base = findBasePal(pal, indexes);
        if (!base) return true;
        if (!internal[pal.id] || !internal[base.id]) return true;
        return technicalSignature(internal[pal.id]) !== technicalSignature(internal[base.id]);
    });
}

async function fetchText(url) {
    const response = await fetch(url, {
        headers: {
            'user-agent': 'PalToolbox partner-skill data updater/1.0 (+offline site data build)',
            'accept-language': 'zh-CN,zh;q=0.9'
        }
    });
    if (!response.ok) throw new Error('HTTP ' + response.status + ': ' + url);
    return response.text();
}

async function locateSpecialPage(pal, base, normalByName, pageCache) {
    const fixedSlug = FIXED_SPECIAL_PAGES[pal.id];
    const slugs = [];
    if (fixedSlug) slugs.push(fixedSlug);
    if (base) {
        const normal = normalByName[normalizeName(base.中文名)];
        if (normal && normal.palSlug && !slugs.includes(normal.palSlug)) slugs.push(normal.palSlug);
    }

    async function getPage(slug) {
        if (!pageCache[slug]) {
            const url = 'https://paldb.cc/cn/' + slug;
            pageCache[slug] = { url: url, html: await fetchText(url) };
        }
        return pageCache[slug];
    }

    const checked = new Set();
    while (slugs.length) {
        const slug = slugs.shift();
        if (!slug || checked.has(slug)) continue;
        checked.add(slug);
        let page;
        try {
            page = await getPage(slug);
        } catch (error) {
            process.stderr.write('跳过无法读取的详情页 ' + slug + ': ' + error.message + '\n');
            continue;
        }
        const record = parseDetailPartnerSkill(page.html, pal.id, page.url);
        if (record) return { record: record, html: page.html, url: page.url };
        extractTribeLinks(page.html).forEach(function(href) {
            if (!checked.has(href) && !slugs.includes(href)) slugs.push(href);
        });
    }
    return null;
}

async function fetchSources() {
    fs.mkdirSync(DETAIL_ROOT, { recursive: true });
    fs.mkdirSync(ORDINARY_DETAIL_ROOT, { recursive: true });
    if (!fs.existsSync(INTERNAL_SOURCE_FILE)) fs.copyFileSync(OUTPUT_FILE, INTERNAL_SOURCE_FILE);

    const mainHtml = await fetchText(MAIN_URL);
    fs.writeFileSync(MAIN_HTML_FILE, mainHtml, 'utf8');
    const normalRecords = parsePartnerSkillList(mainHtml, MAIN_URL);
    if (normalRecords.length !== 299) throw new Error('PalDB 普通伙伴技能应为 299 条，实际为 ' + normalRecords.length);

    const pals = readJson(PAL_FILE);
    const internal = loadInternalParameters();
    const indexes = buildIndexes(pals, normalRecords);
    const ordinaryDetails = {};
    let ordinaryCursor = 0;

    async function fetchOrdinaryWorker() {
        while (ordinaryCursor < normalRecords.length) {
            const index = ordinaryCursor;
            ordinaryCursor += 1;
            const record = normalRecords[index];
            const pal = indexes.ordinaryByName[normalizeName(record.palName)];
            if (!pal || !record.palSlug) continue;
            const url = 'https://paldb.cc/cn/' + record.palSlug;
            const html = await fetchText(url);
            const detailRecord = parseDetailPartnerSkill(html, pal.id, url);
            if (!detailRecord) throw new Error('普通详情页无法提取伙伴技能: ' + pal.id + ' / ' + url);
            const fileName = record.palSlug.replace(/[\\/:*?"<>|]/g, '_') + '.html';
            fs.writeFileSync(path.join(ORDINARY_DETAIL_ROOT, fileName), html, 'utf8');
            ordinaryDetails[pal.id] = { url: url, file: '详情/普通/' + fileName };
            process.stdout.write('[普通 ' + (index + 1) + '/' + normalRecords.length + '] ' + pal.id + '\n');
        }
    }

    await Promise.all(Array.from({ length: 8 }, fetchOrdinaryWorker));
    const targets = getSpecialTargets(pals, internal, indexes);
    const pageCache = {};
    const details = {};
    const missing = [];

    for (let index = 0; index < targets.length; index += 1) {
        const pal = targets[index];
        const base = findBasePal(pal, indexes);
        process.stdout.write('[' + (index + 1) + '/' + targets.length + '] 核对 ' + pal.id + '\n');
        const located = await locateSpecialPage(pal, base, indexes.normalByName, pageCache);
        if (!located) {
            missing.push(pal.id);
            continue;
        }
        const fileName = pal.id + '.html';
        fs.writeFileSync(path.join(DETAIL_ROOT, fileName), located.html, 'utf8');
        details[pal.id] = { url: located.url, file: '详情/' + fileName };
    }

    writeJson(SOURCE_MANIFEST_FILE, {
        source: 'PalDB 简体中文站',
        retrievedAt: RETRIEVED_AT,
        gameVersion: GAME_VERSION,
        transformVersion: TRANSFORM_VERSION,
        ordinary: { url: MAIN_URL, file: 'paldb-partner-skill.html', records: normalRecords.length },
        localUnpackedParameters: { file: path.basename(INTERNAL_SOURCE_FILE), retrievedAt: '2026-07-06' },
        ordinaryDetails: ordinaryDetails,
        details: details,
        missingSpecialRecords: missing
    });
    process.stdout.write('原始来源已更新：普通 ' + normalRecords.length + ' 条、普通详情 ' + Object.keys(ordinaryDetails).length + ' 条，特殊详情 ' + Object.keys(details).length + ' 条，未收录 ' + missing.length + ' 条。\n');
}

function loadOrdinaryRecords(manifest, listRecords) {
    const pals = readJson(PAL_FILE);
    const ordinaryById = Object.fromEntries(pals.filter(function(pal) {
        return ORDINARY_CATEGORIES.has(pal.分类);
    }).map(function(pal) { return [pal.id, pal]; }));
    const detailByName = {};
    Object.keys(manifest.ordinaryDetails || {}).forEach(function(palId) {
        const pal = ordinaryById[palId];
        const detail = manifest.ordinaryDetails[palId];
        if (!pal || !detail) return;
        const html = fs.readFileSync(path.join(SOURCE_ROOT, detail.file), 'utf8');
        const record = parseDetailPartnerSkill(html, palId, detail.url);
        if (!record) throw new Error('无法从已保存普通详情页提取 ' + palId);
        detailByName[normalizeName(pal.中文名)] = record;
    });
    return listRecords.map(function(record) {
        return detailByName[normalizeName(record.palName)] || record;
    });
}

function loadSpecialRecords(manifest) {
    const result = {};
    Object.keys(manifest.details || {}).forEach(function(palId) {
        const detail = manifest.details[palId];
        const html = fs.readFileSync(path.join(SOURCE_ROOT, detail.file), 'utf8');
        const record = parseDetailPartnerSkill(html, palId, detail.url);
        if (!record) throw new Error('无法从已保存详情页提取 ' + palId);
        result[palId] = record;
    });
    return result;
}

function applySupplementalRankTables(records, supplemental) {
    const facts = supplemental && supplemental.partnerSkills || {};
    return records.map(function(record) {
        const extra = facts[record.palId];
        if (!extra || !extra.rankTable) return record;
        if (record.rankTable || (record.rankTables && record.rankTables.length)) {
            throw new Error('补充等级表与 PalDB 已有等级表冲突: ' + record.palId);
        }
        return Object.assign({}, record, {
            rankTable: extra.rankTable,
            rankTableSource: extra.source || null
        });
    });
}

function applyFactCorrections(records, corrections) {
    const facts = corrections && corrections.partnerSkills || {};
    return records.map(function(record) {
        const correction = facts[record.palId];
        if (!correction) return record;
        if (!correction.description || !correction.correction || !correction.correction.sourceUrl) {
            throw new Error('伙伴技能事实修正缺少正文或证据: ' + record.palId);
        }
        return Object.assign({}, record, {
            description: correction.description,
            factCorrection: correction.correction
        });
    });
}

function generateData() {
    const manifest = readJson(SOURCE_MANIFEST_FILE);
    const mainHtml = fs.readFileSync(MAIN_HTML_FILE, 'utf8');
    const listRecords = parsePartnerSkillList(mainHtml, manifest.ordinary.url);
    const supplemental = readJson(SUPPLEMENTAL_RANK_TABLE_FILE);
    const corrections = readJson(FACT_CORRECTION_FILE);
    const normalRecords = applyFactCorrections(
        applySupplementalRankTables(loadOrdinaryRecords(manifest, listRecords), supplemental),
        corrections
    );
    const pals = readJson(PAL_FILE);
    const internalParameters = loadInternalParameters();
    const specialRecords = loadSpecialRecords(manifest);
    const classification = readJson(CLASSIFICATION_FILE);
    const effectBlocks = readJson(EFFECT_BLOCKS_FILE);
    const output = buildPartnerSkillData({
        pals: pals,
        normalRecords: normalRecords,
        specialRecords: specialRecords,
        internalParameters: internalParameters,
        classification: classification,
        metadata: {
            retrievedAt: manifest.retrievedAt,
            gameVersion: manifest.gameVersion,
            transformVersion: TRANSFORM_VERSION
        }
    });
    const applied = applyEffectBlocks({
        partnerSkills: output.partnerSkills,
        catalog: output.catalog,
        taxonomy: output.taxonomy,
        definitions: effectBlocks
    });
    output.partnerSkills = applied.partnerSkills;
    output.meta.effectBlocks = {
        file: path.basename(EFFECT_BLOCKS_FILE),
        records: Object.keys(effectBlocks.partnerSkills || {}).length,
        verifiedAt: effectBlocks.meta && effectBlocks.meta.verifiedAt || '',
        gameVersion: effectBlocks.meta && effectBlocks.meta.gameVersion || '',
        transformVersion: effectBlocks.meta && effectBlocks.meta.transformVersion || ''
    };
    output.meta.statistics.palDbOrdinaryRecords = normalRecords.length;
    output.meta.statistics.palDbOrdinaryDetailRecords = Object.keys(manifest.ordinaryDetails || {}).length;
    output.meta.statistics.palDbSpecialRecords = Object.keys(specialRecords).length;
    output.meta.statistics.palDbMissingSpecialRecords = (manifest.missingSpecialRecords || []).length;
    output.meta.supplementalRankTables = {
        file: path.basename(SUPPLEMENTAL_RANK_TABLE_FILE),
        records: Object.keys(supplemental.partnerSkills || {}).length,
        retrievedAt: supplemental.meta && supplemental.meta.retrievedAt || '',
        gameVersion: supplemental.meta && supplemental.meta.gameVersion || ''
    };
    output.meta.factCorrections = {
        file: path.basename(FACT_CORRECTION_FILE),
        records: Object.keys(corrections.partnerSkills || {}).length,
        verifiedAt: corrections.meta && corrections.meta.verifiedAt || '',
        gameVersion: corrections.meta && corrections.meta.gameVersion || '',
        transformVersion: corrections.meta && corrections.meta.transformVersion || ''
    };
    Object.keys(supplemental.partnerSkills || {}).forEach(function(palId) {
        if (output.partnerSkills[palId]) {
            output.partnerSkills[palId].rankTableSource = supplemental.partnerSkills[palId].source || null;
        }
    });
    return output;
}

function validateData(output) {
    const pals = readJson(PAL_FILE);
    const ordinary = pals.filter(function(pal) { return ORDINARY_CATEGORIES.has(pal.分类); });
    const ordinaryCatalog = output.catalog.filter(function(item) { return item.category === '普通帕鲁'; });
    const directOrdinaryFacts = ordinary.filter(function(pal) { return output.partnerSkills[pal.id].source.mode === 'direct'; });
    const errors = [];
    if (output.meta.statistics.palDbOrdinaryRecords !== 299) errors.push('PalDB 普通记录不是 299 条');
    if (output.meta.statistics.palDbOrdinaryDetailRecords !== 299) errors.push('PalDB 普通详情不是 299 条');
    if (Object.keys(output.partnerSkills).length !== pals.length) errors.push('标准事实未覆盖所有帕鲁');
    if (ordinaryCatalog.length !== ordinary.length) errors.push('目录中普通帕鲁不完整');
    if (directOrdinaryFacts.length !== 299) errors.push('PalDB 299 个普通记录未与本站一一对应');
    if (!output.meta.effectBlocks || output.meta.effectBlocks.records !== output.catalog.length) {
        errors.push('效果块未完整覆盖伙伴技能目录');
    }
    const missingFacts = pals.filter(function(pal) { return !output.partnerSkills[pal.id]; }).map(function(pal) { return pal.id; });
    if (missingFacts.length) errors.push('缺少事实: ' + missingFacts.join(', '));
    const duplicateCatalog = output.catalog.filter(function(item) { return /_2$/.test(item.palId); });
    if (duplicateCatalog.length) errors.push('目录仍包含 `_2` 重复: ' + duplicateCatalog.map(function(item) { return item.palId; }).join(', '));
    if (!output.taxonomy || output.taxonomy.groups.length !== 9) errors.push('生成数据缺少九大伙伴技能用途分类');
    output.catalog.forEach(function(item) {
        if (!Object.prototype.hasOwnProperty.call(item, 'iconFile')) errors.push(item.palId + ' 缺少头像字段');
        if (!Object.prototype.hasOwnProperty.call(item, 'displayId')) errors.push(item.palId + ' 缺少帕鲁图鉴显示编号字段');
        if (!Array.isArray(item.usageCategoryIds) || !Array.isArray(item.usageSubcategoryIds) || !Array.isArray(item.usageTagIds)) {
            errors.push(item.palId + ' 缺少伙伴技能分类索引');
        }
        const fact = output.partnerSkills[item.palId];
        if (!fact || !Array.isArray(fact.effectBlocks) || !fact.effectBlocks.length) {
            errors.push(item.palId + ' 缺少正式效果块');
        }
    });
    Object.keys(output.partnerSkills).forEach(function(palId) {
        const fact = output.partnerSkills[palId];
        const tables = fact.rankTables || (fact.rankTable ? [fact.rankTable] : []);
        tables.forEach(function(table) {
            const rawLabels = table.columns.filter(function(column) { return !column.label || column.label === column.key; });
            if (rawLabels.length) errors.push(palId + ' 仍有未翻译的伙伴技能参数列: ' + rawLabels.map(function(column) { return column.key; }).join(', '));
            const missingValues = table.rows.some(function(row) { return row.values.some(function(value) { return value === null || value === undefined; }); });
            if (missingValues) errors.push(palId + ' 的伙伴技能等级表仍有空值');
            if (table.type === 'stars' && table.rows.map(function(row) { return row.rank; }).join(',') !== '0,1,2,3,4') {
                errors.push(palId + ' 的伙伴技能星级不是 0~4 星');
            }
        });
    });
    const moonLord = output.partnerSkills.RAID_YakushimaBoss002;
    if (!moonLord || moonLord.hasPartnerSkill !== false || moonLord.descriptionStatus !== '无伙伴技能') {
        errors.push('月亮领主必须明确标记为无伙伴技能');
    }
    if (errors.length) throw new Error(errors.join('\n'));
    return {
        pals: pals.length,
        ordinary: ordinary.length,
        catalog: output.catalog.length,
        conflicts: output.conflicts.length
    };
}

async function main() {
    const args = new Set(process.argv.slice(2));
    if (args.has('--fetch')) await fetchSources();
    const output = generateData();
    const summary = validateData(output);
    if (!args.has('--check')) writeJson(OUTPUT_FILE, output);
    process.stdout.write('伙伴技能数据校验通过：帕鲁 ' + summary.pals + '，普通 ' + summary.ordinary + '，目录 ' + summary.catalog + '，冲突 ' + summary.conflicts + '。\n');
}

main().catch(function(error) {
    process.stderr.write(error.stack + '\n');
    process.exitCode = 1;
});
