function buildClassificationIndex(data) {
    const index = {
        groups: {},
        subcategories: {},
        facets: {},
        detailTags: {}
    };
    (data && data.groups || []).forEach(function(group) {
        index.groups[group.id] = group;
        (group.children || []).forEach(function(child) {
            index.subcategories[child.id] = Object.assign({ groupId: group.id }, child);
        });
    });
    (data && data.facets || []).forEach(function(facet) {
        index.facets[facet.id] = facet;
    });
    (data && data.detailTags || []).forEach(function(tag) {
        index.detailTags[tag.id] = tag;
    });
    return index;
}

function validateClassification(data, catalogIds) {
    const errors = [];
    const seenIds = new Set();
    const groups = data && Array.isArray(data.groups) ? data.groups : [];
    const facets = data && Array.isArray(data.facets) ? data.facets : [];
    const detailTags = data && Array.isArray(data.detailTags) ? data.detailTags : [];
    const assignments = data && data.assignments && typeof data.assignments === 'object' ? data.assignments : {};
    const allowedStatuses = new Set(['reviewed', 'no-partner-skill', 'insufficient-facts']);
    let subcategoryCount = 0;

    function rememberId(id) {
        if (!id) {
            errors.push('分类 id 不能为空');
            return;
        }
        if (seenIds.has(id)) errors.push('重复分类 id: ' + id);
        seenIds.add(id);
    }

    if (groups.length !== 9) errors.push('用途大类必须为 9 个，当前为 ' + groups.length);
    groups.forEach(function(group) {
        rememberId(group.id);
        const children = Array.isArray(group.children) ? group.children : [];
        subcategoryCount += children.length;
        children.forEach(function(child) { rememberId(child.id); });
    });
    facets.forEach(function(facet) { rememberId(facet.id); });
    detailTags.forEach(function(tag) { rememberId(tag.id); });

    const index = buildClassificationIndex(data || {});
    facets.forEach(function(facet) {
        if (!index.groups[facet.groupId]) {
            errors.push('筛面引用未知用途大类: ' + facet.id + ' -> ' + facet.groupId);
        }
    });
    groups.forEach(function(group) {
        (group.children || []).forEach(function(child) {
            if (!child.facetId) return;
            const facet = index.facets[child.facetId];
            if (!facet) errors.push('下级分类引用未知筛面: ' + child.id + ' -> ' + child.facetId);
            else if (facet.groupId !== group.id) errors.push('下级分类跨用途大类引用筛面: ' + child.id + ' -> ' + child.facetId);
        });
    });
    detailTags.forEach(function(tag) {
        if (!index.subcategories[tag.subcategoryId]) {
            errors.push('精确标签引用未知下级分类: ' + tag.id + ' -> ' + tag.subcategoryId);
        }
        if (tag.facetId) {
            const facet = index.facets[tag.facetId];
            const subcategory = index.subcategories[tag.subcategoryId];
            if (!facet) errors.push('精确标签引用未知筛面: ' + tag.id + ' -> ' + tag.facetId);
            else if (subcategory && facet.groupId !== subcategory.groupId) errors.push('精确标签跨用途大类引用筛面: ' + tag.id + ' -> ' + tag.facetId);
        }
    });

    const requestedIds = Array.isArray(catalogIds) ? catalogIds : [];
    const catalogIdSet = new Set(requestedIds);
    requestedIds.forEach(function(palId) {
        if (!assignments[palId]) errors.push('分类目录未覆盖: ' + palId);
    });
    Object.keys(assignments).forEach(function(palId) {
        const assignment = assignments[palId] || {};
        if (
            requestedIds.length &&
            !catalogIdSet.has(palId) &&
            assignment.reviewStatus !== 'no-partner-skill'
        ) {
            errors.push('分类包含目录外帕鲁: ' + palId);
        }
        if (!allowedStatuses.has(assignment.reviewStatus)) {
            errors.push(palId + ' 的审核状态无效: ' + (assignment.reviewStatus || '空'));
        }
        const subcategoryIds = Array.isArray(assignment.subcategoryIds) ? assignment.subcategoryIds : [];
        const tagIds = Array.isArray(assignment.tagIds) ? assignment.tagIds : [];
        subcategoryIds.forEach(function(id) {
            if (!index.subcategories[id]) errors.push(palId + ' 引用未知下级分类: ' + id);
        });
        tagIds.forEach(function(id) {
            if (!index.detailTags[id]) errors.push(palId + ' 引用未知精确标签: ' + id);
        });
        if (assignment.reviewStatus === 'reviewed' && !subcategoryIds.length) {
            errors.push(palId + ' 已审核但没有用途分类');
        }
    });

    if (errors.length) throw new Error(errors.join('\n'));
    return {
        groups: groups.length,
        subcategories: subcategoryCount,
        detailTags: detailTags.length,
        assignments: Object.keys(assignments).length
    };
}

function decorateCatalog(catalog, palsById, data) {
    const ids = (catalog || []).map(function(item) { return item.palId; });
    validateClassification(data, ids);
    const index = buildClassificationIndex(data);
    const assignments = data.assignments || {};
    return (catalog || []).map(function(item) {
        const assignment = assignments[item.palId] || {};
        const subcategoryIds = (assignment.subcategoryIds || []).slice();
        const usageCategoryIds = [];
        subcategoryIds.forEach(function(id) {
            const subcategory = index.subcategories[id];
            if (subcategory && !usageCategoryIds.includes(subcategory.groupId)) usageCategoryIds.push(subcategory.groupId);
        });
        return Object.assign({}, item, {
            iconFile: palsById && palsById[item.palId] && palsById[item.palId].头像文件 || '',
            usageCategoryIds: usageCategoryIds,
            usageSubcategoryIds: subcategoryIds,
            usageTagIds: (assignment.tagIds || []).slice(),
            classificationStatus: assignment.reviewStatus || 'insufficient-facts'
        });
    });
}

module.exports = {
    validateClassification,
    buildClassificationIndex,
    decorateCatalog
};
