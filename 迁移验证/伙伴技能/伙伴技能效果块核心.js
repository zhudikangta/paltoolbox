function unique(values) {
    const result = [];
    const seen = new Set();
    (Array.isArray(values) ? values : []).forEach(function(value) {
        if (!value || seen.has(value)) return;
        seen.add(value);
        result.push(value);
    });
    return result;
}

function blockCapabilityIds(block) {
    const source = block || {};
    return unique((source.subcategoryIds || []).concat(source.tagIds || []));
}

function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
}

function sortedUnique(values) {
    return unique(values).sort();
}

function sameIds(left, right) {
    const leftIds = sortedUnique(left);
    const rightIds = sortedUnique(right);
    return leftIds.length === rightIds.length && leftIds.every(function(id, index) {
        return id === rightIds[index];
    });
}

function taxonomyIdSets(taxonomy) {
    const subcategoryIds = new Set();
    const tagIds = new Set();
    const source = taxonomy || {};

    (Array.isArray(source.groups) ? source.groups : []).forEach(function(group) {
        (Array.isArray(group.children) ? group.children : []).forEach(function(child) {
            if (child && child.id) subcategoryIds.add(child.id);
        });
    });
    (Array.isArray(source.detailTags) ? source.detailTags : []).forEach(function(tag) {
        if (tag && tag.id) tagIds.add(tag.id);
    });

    return { subcategoryIds: subcategoryIds, tagIds: tagIds };
}

function isPlainObject(value) {
    if (!value || Object.prototype.toString.call(value) !== '[object Object]') return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
}

function applyEffectBlocks(options) {
    const source = options || {};
    const sourceFacts = source.partnerSkills && typeof source.partnerSkills === 'object' ? source.partnerSkills : {};
    const sourceCatalog = Array.isArray(source.catalog) ? source.catalog : [];
    const definitions = source.definitions && source.definitions.partnerSkills && typeof source.definitions.partnerSkills === 'object'
        ? source.definitions.partnerSkills
        : {};
    const partnerSkills = deepClone(sourceFacts);
    const catalog = deepClone(sourceCatalog);
    const allowedIds = taxonomyIdSets(source.taxonomy);
    const errors = [];

    catalog.forEach(function(item) {
        const palId = item && item.palId;
        if (!palId) {
            errors.push('目录记录缺少 palId');
            return;
        }
        if (!Object.prototype.hasOwnProperty.call(partnerSkills, palId)) {
            errors.push('目录中的 palId 在伙伴技能事实中不存在: ' + palId);
            return;
        }
        if (!Object.prototype.hasOwnProperty.call(definitions, palId)) {
            errors.push('效果块未覆盖目录: ' + palId);
            return;
        }

        const blocks = definitions[palId];
        if (!Array.isArray(blocks)) {
            errors.push(palId + ' 的效果块必须是数组');
            return;
        }
        if (!blocks.length) {
            errors.push(palId + ' 的效果块不能为空');
            return;
        }

        const blockSubcategoryIds = [];
        const blockTagIds = [];
        blocks.forEach(function(block, index) {
            const blockName = palId + ' 的第 ' + (index + 1) + ' 个效果块';
            if (!isPlainObject(block)) {
                errors.push(blockName + '必须是普通对象');
                return;
            }
            if (!block || typeof block.text !== 'string' || !block.text.trim()) {
                errors.push(blockName + '文本不能为空');
            }

            if (!Array.isArray(block.subcategoryIds)) {
                errors.push(blockName + '的下级分类必须是数组');
            } else block.subcategoryIds.forEach(function(id) {
                blockSubcategoryIds.push(id);
                if (!allowedIds.subcategoryIds.has(id)) {
                    errors.push(palId + ' 的效果块引用未知下级分类: ' + id);
                }
            });
            if (!Array.isArray(block.tagIds)) {
                errors.push(blockName + '的精确标签必须是数组');
            } else block.tagIds.forEach(function(id) {
                blockTagIds.push(id);
                if (!allowedIds.tagIds.has(id)) {
                    errors.push(palId + ' 的效果块引用未知精确标签: ' + id);
                }
            });
        });

        if (!sameIds(blockSubcategoryIds, item.usageSubcategoryIds || [])) {
            errors.push(palId + ' 的效果块下级分类与目录不一致');
        }
        if (!sameIds(blockTagIds, item.usageTagIds || [])) {
            errors.push(palId + ' 的效果块精确标签与目录不一致');
        }

        partnerSkills[palId].effectBlocks = deepClone(blocks);
        partnerSkills[palId].description = blocks.map(function(block) {
            return typeof block.text === 'string' ? block.text.trim() : '';
        }).join('\n');
    });

    if (errors.length) throw new Error(errors.join('\n'));
    return { partnerSkills: partnerSkills, catalog: catalog };
}

module.exports = {
    unique,
    blockCapabilityIds,
    applyEffectBlocks
};
