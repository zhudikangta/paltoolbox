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

function definitionBlocks(definition) {
    if (Array.isArray(definition)) return definition;
    return definition && Array.isArray(definition.blocks) ? definition.blocks : [];
}

function applyEffectBlocks(options) {
    const source = options || {};
    const sourceFacts = source.partnerSkills && typeof source.partnerSkills === 'object' ? source.partnerSkills : {};
    const sourceCatalog = Array.isArray(source.catalog) ? source.catalog : [];
    const definitions = source.definitions && typeof source.definitions === 'object' ? source.definitions : {};
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

        const blocks = definitionBlocks(definitions[palId]);
        if (!blocks.length) {
            errors.push(palId + ' 的效果块不能为空');
            return;
        }

        const blockSubcategoryIds = [];
        const blockTagIds = [];
        blocks.forEach(function(block, index) {
            if (!block || typeof block.text !== 'string' || !block.text.trim()) {
                errors.push(palId + ' 的第 ' + (index + 1) + ' 个效果块文本不能为空');
            }

            const subcategoryIds = Array.isArray(block && block.subcategoryIds) ? block.subcategoryIds : [];
            const tagIds = Array.isArray(block && block.tagIds) ? block.tagIds : [];
            subcategoryIds.forEach(function(id) {
                blockSubcategoryIds.push(id);
                if (!allowedIds.subcategoryIds.has(id)) {
                    errors.push(palId + ' 的效果块引用未知下级分类: ' + id);
                }
            });
            tagIds.forEach(function(id) {
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
