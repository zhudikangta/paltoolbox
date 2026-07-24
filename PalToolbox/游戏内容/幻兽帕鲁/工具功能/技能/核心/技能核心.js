var PT_SKILL_CORE = (function() {
    var activeSkills = [];
    var partnerSkills = [];
    var partnerTaxonomy = { groups: [], facets: [], detailTags: [] };
    var partnerFacetGroups = [];
    var partnerFacetOptionById = {};
    var partnerSubcategoryById = {};
    var partnerDetailTagById = {};

    var ELEMENT_NAME = {
        Normal: '无属性',
        Fire: '火属性',
        Water: '水属性',
        Leaf: '草属性',
        Grass: '草属性',
        Electricity: '雷属性',
        Thunder: '雷属性',
        Ice: '冰属性',
        Earth: '地属性',
        Ground: '地属性',
        Dark: '暗属性',
        Dragon: '龙属性'
    };

    function normalizeElement(value) {
        return ELEMENT_NAME[value] || value || '';
    }

    function normalizePartnerCapabilityIds(value) {
        if (!Array.isArray(value)) return [];
        return value.filter(function(id) {
            return typeof id === 'string' && id;
        });
    }

    function normalizePartnerEffectBlocks(value) {
        if (!Array.isArray(value)) return [];
        return value.reduce(function(blocks, block) {
            if (!block || typeof block !== 'object' || Array.isArray(block)) return blocks;
            var text = typeof block.text === 'string' ? block.text : '';
            if (!text.trim()) return blocks;
            blocks.push({
                text: text,
                subcategoryIds: normalizePartnerCapabilityIds(block.subcategoryIds),
                tagIds: normalizePartnerCapabilityIds(block.tagIds)
            });
            return blocks;
        }, []);
    }

    function setActiveSkillData(raw) {
        var map = {};
        var palMap = raw && raw.palLearnSkills ? raw.palLearnSkills : {};
        Object.keys(palMap).forEach(function(palId) {
            var pal = palMap[palId] || {};
            (pal.skills || []).forEach(function(skill) {
                var id = skill.wazaID || skill.id || '';
                if (!id) return;
                if (!map[id]) {
                    map[id] = {
                        id: id,
                        name: skill.nameCN || id,
                        element: normalizeElement(skill.element),
                        category: skill.category || '',
                        power: skill.power,
                        learnedBy: []
                    };
                }
                map[id].learnedBy.push({
                    palId: palId,
                    palName: pal.nameCN || palId,
                    level: skill.level
                });
            });
        });
        activeSkills = Object.keys(map).map(function(id) {
            var item = map[id];
            item.learnedBy.sort(function(a, b) {
                return (Number(a.level) || 0) - (Number(b.level) || 0) || String(a.palName).localeCompare(String(b.palName));
            });
            return item;
        }).sort(function(a, b) {
            return String(a.name).localeCompare(String(b.name));
        });
    }

    function setPartnerSkillData(raw) {
        var source = raw && raw.partnerSkills ? raw.partnerSkills : {};
        var internal = raw && raw.internalParameters ? raw.internalParameters : {};
        var catalog = raw && Array.isArray(raw.catalog) ? raw.catalog : Object.keys(source).map(function(id) { return { palId: id }; });
        partnerTaxonomy = raw && raw.taxonomy ? raw.taxonomy : { groups: [], facets: [], detailTags: [] };
        var taxonomyLabels = {};
        partnerSubcategoryById = {};
        partnerDetailTagById = {};
        (partnerTaxonomy.groups || []).forEach(function(group) {
            taxonomyLabels[group.id] = group.label || group.id;
            (group.children || []).forEach(function(child) {
                taxonomyLabels[child.id] = child.label || child.id;
                partnerSubcategoryById[child.id] = child;
            });
        });
        (partnerTaxonomy.detailTags || []).forEach(function(tag) {
            taxonomyLabels[tag.id] = tag.label || tag.id;
            partnerDetailTagById[tag.id] = tag;
        });
        buildPartnerFacetGroups();
        partnerSkills = catalog.map(function(catalogItem) {
            var id = typeof catalogItem === 'string' ? catalogItem : catalogItem.palId;
            var item = source[id] || {};
            var parameters = internal[id] || item;
            return {
                id: item.id || id,
                name: item.skillName || item.nameCN || item.id || id,
                palName: item.palName || item.nameCN || id,
                category: catalogItem.category || item.category || '',
                reason: catalogItem.reason || '',
                displayId: catalogItem.displayId || '',
                iconFile: catalogItem.iconFile || '',
                usageCategoryIds: (catalogItem.usageCategoryIds || []).slice(),
                usageSubcategoryIds: (catalogItem.usageSubcategoryIds || []).slice(),
                usageTagIds: (catalogItem.usageTagIds || []).slice(),
                classificationStatus: catalogItem.classificationStatus || '',
                usageSearchText: (catalogItem.usageCategoryIds || []).concat(catalogItem.usageSubcategoryIds || [], catalogItem.usageTagIds || []).map(function(value) {
                    return taxonomyLabels[value] || value;
                }).join(' '),
                type: parameters.typeLabel || parameters.skillType || '',
                trigger: parameters.trigger || '',
                cooldown: parameters.coolDown,
                description: item.description || '',
                effectBlocks: normalizePartnerEffectBlocks(item.effectBlocks),
                values: parameters.values || []
            };
        });
    }

    function getActiveSkills() {
        return activeSkills.slice();
    }

    function getPartnerSkills() {
        return partnerSkills.slice();
    }

    function getPartnerTaxonomy() {
        return JSON.parse(JSON.stringify(partnerTaxonomy || { groups: [], facets: [], detailTags: [] }));
    }

    function buildPartnerFacetGroups() {
        var definitions = partnerTaxonomy.facets || [];
        var detailTags = partnerTaxonomy.detailTags || [];
        partnerFacetOptionById = {};
        partnerFacetGroups = (partnerTaxonomy.groups || []).map(function(group) {
            var explicitFacets = definitions.filter(function(facet) { return facet.groupId === group.id; });
            var facets = explicitFacets.length ? explicitFacets.slice() : [{
                id: group.id,
                groupId: group.id,
                label: group.label,
                order: group.order || 0,
                isDefault: true
            }];
            facets.sort(function(a, b) { return (Number(a.order) || 0) - (Number(b.order) || 0); });
            facets = facets.map(function(facet) {
                var options = [];
                (group.children || []).forEach(function(child) {
                    if (child.filterable === false) return;
                    var childFacetId = child.facetId || (facet.isDefault ? group.id : '');
                    if (childFacetId !== facet.id) return;
                    options.push({
                        id: child.id,
                        label: child.label || child.id,
                        order: child.facetOrder !== undefined ? child.facetOrder : (child.order || 0),
                        capabilityIds: (child.capabilityIds || [child.id]).slice()
                    });
                });
                detailTags.forEach(function(tag) {
                    if (tag.filterable === false) return;
                    var tagFacetId = tag.facetId || (facet.isDefault ? group.id : '');
                    if (tagFacetId !== facet.id) return;
                    options.push({
                        id: tag.id,
                        label: tag.label || tag.id,
                        order: tag.facetOrder !== undefined ? tag.facetOrder : (tag.order || 0),
                        capabilityIds: (tag.capabilityIds || [tag.id]).slice()
                    });
                });
                options.sort(function(a, b) { return (Number(a.order) || 0) - (Number(b.order) || 0); });
                options.forEach(function(option) { partnerFacetOptionById[option.id] = option; });
                return {
                    id: facet.id,
                    label: facet.label || group.label,
                    order: facet.order || 0,
                    options: options
                };
            }).filter(function(facet) { return facet.options.length; });
            return {
                id: group.id,
                label: group.label || group.id,
                order: group.order || 0,
                facets: facets
            };
        }).filter(function(group) { return group.facets.length; });
    }

    function getPartnerFacetGroups() {
        return JSON.parse(JSON.stringify(partnerFacetGroups));
    }

    function getPartnerSelectedFilters(facetSelections) {
        var selected = [];
        partnerFacetGroups.forEach(function(group) {
            group.facets.forEach(function(facet) {
                var selectedIds = Array.isArray(facetSelections && facetSelections[facet.id]) ? facetSelections[facet.id] : [];
                facet.options.forEach(function(option) {
                    if (selectedIds.indexOf(option.id) < 0) return;
                    selected.push({
                        facetId: facet.id,
                        facetLabel: facet.label,
                        optionId: option.id,
                        label: option.label
                    });
                });
            });
        });
        return selected;
    }

    function getPartnerVisibleTagLabels(item) {
        var labels = [];
        (item && item.usageSubcategoryIds || []).forEach(function(subcategoryId) {
            var subcategory = partnerSubcategoryById[subcategoryId];
            if (!subcategory || subcategory.filterable === false) return;
            labels.push(subcategory.label || subcategory.id);
        });
        (item && item.usageTagIds || []).forEach(function(tagId) {
            var tag = partnerDetailTagById[tagId];
            if (!tag || tag.kind !== 'precise') return;
            labels.push(tag.label || tag.id);
        });
        return labels.filter(function(label, index, all) {
            return all.indexOf(label) === index;
        });
    }

    function getPartnerSourceCategories(preferredOrder) {
        var seen = {};
        partnerSkills.forEach(function(item) {
            if (item.category) seen[item.category] = true;
        });
        var order = Array.isArray(preferredOrder) ? preferredOrder : [];
        return Object.keys(seen).sort(function(a, b) {
            var aIndex = order.indexOf(a);
            var bIndex = order.indexOf(b);
            aIndex = aIndex < 0 ? Number.MAX_SAFE_INTEGER : aIndex;
            bIndex = bIndex < 0 ? Number.MAX_SAFE_INTEGER : bIndex;
            return aIndex - bIndex || String(a).localeCompare(String(b));
        });
    }

    function selectedPartnerOptionIds(facetSelections) {
        return Object.keys(facetSelections || {}).reduce(function(ids, facetId) {
            return ids.concat(Array.isArray(facetSelections[facetId]) ? facetSelections[facetId] : []);
        }, []);
    }

    function selectedPartnerCapabilityIds(facetSelections) {
        return selectedPartnerOptionIds(facetSelections).reduce(function(ids, optionId) {
            var option = partnerFacetOptionById[optionId];
            var capabilityIds = option ? option.capabilityIds : [optionId];
            capabilityIds.forEach(function(id) {
                if (ids.indexOf(id) < 0) ids.push(id);
            });
            return ids;
        }, []);
    }

    function splitPartnerTechnologyText(value) {
        var text = String(value || '').replace(/\r/g, '').trim();
        var match = text.match(/(?:^|\n)[ \t]*(科技\d+)[ \t]*$/);
        if (!match) return { text: text, technologyText: '' };
        return {
            text: text.slice(0, match.index).trim(),
            technologyText: match[1]
        };
    }

    function getPartnerEffectBlockModels(item, facetSelections) {
        var selectedCapabilityIds = selectedPartnerCapabilityIds(facetSelections);
        return normalizePartnerEffectBlocks(item && item.effectBlocks).map(function(block) {
            var presentation = splitPartnerTechnologyText(block.text);
            var capabilityIds = block.subcategoryIds.concat(block.tagIds);
            var labels = [];
            var seenLabelIds = {};
            var visiblePreciseTags = block.tagIds.map(function(id) {
                return partnerDetailTagById[id];
            }).filter(function(definition) {
                return definition && definition.filterable !== false && definition.kind === 'precise';
            });
            var hiddenSubcategoryIds = {};
            visiblePreciseTags.forEach(function(definition) {
                if (definition.subcategoryId) hiddenSubcategoryIds[definition.subcategoryId] = true;
            });

            block.subcategoryIds.forEach(function(id) {
                var definition = partnerSubcategoryById[id];
                if (!definition || definition.filterable === false || hiddenSubcategoryIds[id] || seenLabelIds[id]) return;
                seenLabelIds[id] = true;
                labels.push({
                    id: id,
                    label: definition.label || id,
                    selected: selectedCapabilityIds.indexOf(id) > -1
                });
            });
            block.tagIds.forEach(function(id) {
                var definition = partnerDetailTagById[id];
                if (!definition || definition.filterable === false || definition.kind !== 'precise' || seenLabelIds[id]) return;
                seenLabelIds[id] = true;
                labels.push({
                    id: id,
                    label: definition.label || id,
                    selected: selectedCapabilityIds.indexOf(id) > -1
                });
            });

            var highlighted = selectedCapabilityIds.some(function(id) {
                return capabilityIds.indexOf(id) > -1;
            });

            var model = {
                text: presentation.text,
                labels: labels,
                highlighted: highlighted
            };
            if (presentation.technologyText) model.technologyText = presentation.technologyText;
            return model;
        });
    }

    function matchesPartnerFacetOption(item, option) {
        var capabilityIds = item.usageSubcategoryIds.concat(item.usageTagIds);
        var requiredIds = option ? option.capabilityIds : [];
        return requiredIds.some(function(id) { return capabilityIds.indexOf(id) > -1; });
    }

    function matchesPartnerFacetSelections(item, facetSelections) {
        return Object.keys(facetSelections || {}).every(function(facetId) {
            var selectedOptionIds = Array.isArray(facetSelections[facetId]) ? facetSelections[facetId] : [];
            if (!selectedOptionIds.length) return true;
            return selectedOptionIds.every(function(optionId) {
                var option = partnerFacetOptionById[optionId];
                return option
                    ? matchesPartnerFacetOption(item, option)
                    : item.usageSubcategoryIds.concat(item.usageTagIds).indexOf(optionId) > -1;
            });
        });
    }

    function filterPartnerSkills(filters) {
        filters = filters || {};
        var query = String(filters.query || '').trim().toLowerCase();
        var facetSelections = filters.facetSelections && typeof filters.facetSelections === 'object' ? filters.facetSelections : {};
        return partnerSkills.filter(function(item) {
            if (filters.sourceCategory && filters.sourceCategory !== '全部' && item.category !== filters.sourceCategory) return false;
            if (!matchesPartnerFacetSelections(item, facetSelections)) return false;
            if (!query) return true;
            return [item.name, item.id, item.palName, item.description, item.usageSearchText].some(function(value) {
                return String(value || '').toLowerCase().indexOf(query) > -1;
            });
        });
    }

    function getPartnerFacetCounts(filters) {
        filters = filters || {};
        var currentSelections = filters.facetSelections && typeof filters.facetSelections === 'object' ? filters.facetSelections : {};
        var counts = {};
        partnerFacetGroups.forEach(function(group) {
            group.facets.forEach(function(facet) {
                counts[facet.id] = {};
                facet.options.forEach(function(option) {
                    var nextSelections = {};
                    Object.keys(currentSelections).forEach(function(facetId) {
                        if (Array.isArray(currentSelections[facetId]) && currentSelections[facetId].length) {
                            nextSelections[facetId] = currentSelections[facetId].slice();
                        }
                    });
                    var nextFacetSelections = nextSelections[facet.id] || [];
                    if (nextFacetSelections.indexOf(option.id) < 0) nextFacetSelections.push(option.id);
                    nextSelections[facet.id] = nextFacetSelections;
                    counts[facet.id][option.id] = filterPartnerSkills({
                        sourceCategory: filters.sourceCategory,
                        query: filters.query,
                        facetSelections: nextSelections
                    }).length;
                });
            });
        });
        return counts;
    }

    function getPartnerFacetGroupCounts(filters) {
        var filtered = filterPartnerSkills(filters || {});
        var counts = {};
        partnerFacetGroups.forEach(function(group) {
            counts[group.id] = filtered.filter(function(item) {
                return group.facets.some(function(facet) {
                    return facet.options.some(function(option) {
                        return matchesPartnerFacetOption(item, option);
                    });
                });
            }).length;
        });
        return counts;
    }

    function search(kind, query) {
        var list = kind === 'partner' ? partnerSkills : activeSkills;
        var q = String(query || '').toLowerCase();
        if (!q) return list.slice();
        return list.filter(function(item) {
            return String(item.name || '').toLowerCase().indexOf(q) > -1 ||
                String(item.id || '').toLowerCase().indexOf(q) > -1 ||
                String(item.palName || '').toLowerCase().indexOf(q) > -1 ||
                String(item.element || '').toLowerCase().indexOf(q) > -1 ||
                String(item.type || '').toLowerCase().indexOf(q) > -1 ||
                String(item.description || '').toLowerCase().indexOf(q) > -1;
        });
    }

    return {
        setActiveSkillData: setActiveSkillData,
        setPartnerSkillData: setPartnerSkillData,
        getActiveSkills: getActiveSkills,
        getPartnerSkills: getPartnerSkills,
        getPartnerTaxonomy: getPartnerTaxonomy,
        getPartnerFacetGroups: getPartnerFacetGroups,
        getPartnerSelectedFilters: getPartnerSelectedFilters,
        getPartnerVisibleTagLabels: getPartnerVisibleTagLabels,
        getPartnerEffectBlockModels: getPartnerEffectBlockModels,
        getPartnerSourceCategories: getPartnerSourceCategories,
        getPartnerFacetCounts: getPartnerFacetCounts,
        getPartnerFacetGroupCounts: getPartnerFacetGroupCounts,
        filterPartnerSkills: filterPartnerSkills,
        search: search
    };
})();

if (typeof window !== 'undefined') {
    window.PT_SKILL_CORE = PT_SKILL_CORE;
}
