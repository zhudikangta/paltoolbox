var PT_BREEDING_CORE = (function() {
    var K_NAME = '\u4e2d\u6587\u540d';
    var K_DISPLAY_NO = '\u56fe\u9274\u7f16\u53f7';
    var K_DISPLAY_SUFFIX = '\u56fe\u9274\u540e\u7f00';
    var K_ICON_FILE = '\u5934\u50cf\u6587\u4ef6';
    var K_ICON_STATUS = '\u5934\u50cf\u72b6\u6001';
    var K_BREED_POWER = '\u7e41\u6b96\u529b';
    var K_CAN_BREED = '\u53ef\u914d\u79cd';
    var K_CATEGORY = '\u5206\u7c7b';
    var K_IMPLEMENT_STATUS = '\u5b9e\u88c5\u72b6\u6001';
    var K_SPECIES = '\u79cd\u65cf';
    var K_PARENT_A_ID = '\u4eb2\u672cA_ID';
    var K_PARENT_A = '\u4eb2\u672cA';
    var K_PARENT_A_GENDER = '\u4eb2\u672cA\u6027\u522b';
    var K_PARENT_B_ID = '\u4eb2\u672cB_ID';
    var K_PARENT_B = '\u4eb2\u672cB';
    var K_PARENT_B_GENDER = '\u4eb2\u672cB\u6027\u522b';
    var K_CHILD_ID = '\u5b50\u4ee3ID';
    var K_CHILD = '\u5b50\u4ee3';
    var ICON_STATUS_EXISTS = '\u5df2\u5b58\u5728';
    var ICON_STATUS_COPIED = '\u5df2\u590d\u5236';
    var STATUS_UNIMPLEMENTED = '\u672a\u5b9e\u88c5';

    var pals = [];
    var parentCandidates = [];
    var formulaCandidates = [];
    var palById = {};
    var specialRows = [];
    var specialByPairKeyNoGender = {};
    var specialChildIds = {};
    var parentPairCache = {};

    function clearCache() {
        parentPairCache = {};
    }

    function pairKey(p1, p2) {
        p1 = String(p1 || '');
        p2 = String(p2 || '');
        return p1 < p2 ? p1 + '\u0001' + p2 : p2 + '\u0001' + p1;
    }

    function displayName(raw) {
        return raw && raw[K_NAME] ? raw[K_NAME] : String(raw && raw.id || '');
    }

    function displayId(raw) {
        if (!raw || !raw[K_DISPLAY_NO] || raw[K_DISPLAY_NO] <= 0) return '';
        return String(raw[K_DISPLAY_NO]) + String(raw[K_DISPLAY_SUFFIX] || '');
    }

    function toNumber(value) {
        var num = Number(value);
        return isFinite(num) ? num : null;
    }

    function normalizePal(raw, order) {
        raw = raw || {};
        var id = String(raw.id || '');
        var species = String(raw[K_SPECIES] || id);
        var breedingPower = toNumber(raw[K_BREED_POWER]);
        return {
            id: id,
            species: species,
            name: displayName(raw),
            displayId: displayId(raw),
            iconFile: raw[K_ICON_FILE] || '',
            iconStatus: raw[K_ICON_STATUS] || '',
            breedingPower: breedingPower,
            canBreed: raw[K_CAN_BREED] !== false && breedingPower !== null,
            category: raw[K_CATEGORY] || '',
            implementStatus: raw[K_IMPLEMENT_STATUS] || '',
            order: order || 0
        };
    }

    function isPlaceholderName(name) {
        return !name || String(name).indexOf('zh_Hans_Text') === 0 || String(name).indexOf('zh-Hans Text') === 0;
    }

    function isInternalVariant(pal) {
        var category = String(pal && pal.category || '');
        var id = String(pal && pal.id || '');
        return category.indexOf('Boss') > -1 ||
            category.indexOf('\u9996\u9886') > -1 ||
            category.indexOf('\u72c2\u66b4') > -1 ||
            /^boss_/i.test(id);
    }

    function candidatePriority(pal) {
        if (!pal) return 99;
        if (pal.id && pal.id === pal.species) return 0;
        if (pal.category === '\u57fa\u7840' || pal.category === '\u4e9a\u79cd' || pal.category === '\u53d8\u4f53') return 1;
        if (!isInternalVariant(pal)) return 5;
        return 9;
    }

    function compareCandidate(a, b) {
        var priorityDiff = candidatePriority(a) - candidatePriority(b);
        if (priorityDiff !== 0) return priorityDiff;
        if (isPlaceholderName(a.name) !== isPlaceholderName(b.name)) return isPlaceholderName(a.name) ? 1 : -1;
        return a.order - b.order;
    }

    function displaySortValue(pal) {
        var raw = String(pal && pal.displayId || '').trim();
        var match = raw.match(/^(\d+)(.*)$/);
        if (!match) return { num: 99999, suffix: raw };
        return { num: Number(match[1]), suffix: match[2] || '' };
    }

    function compareByDisplayId(a, b) {
        var va = displaySortValue(a);
        var vb = displaySortValue(b);
        if (va.num !== vb.num) return va.num - vb.num;
        var suffixDiff = va.suffix.localeCompare(vb.suffix);
        if (suffixDiff !== 0) return suffixDiff;
        return String(a.name || a.species).localeCompare(String(b.name || b.species), 'zh-Hans-CN');
    }

    function isSelectablePal(pal) {
        return !!pal &&
            (pal.category === '基础' || pal.category === '亚种' || pal.category === '泰拉瑞亚') &&
            pal.breedingPower > 0 &&
            pal.breedingPower < 9999 &&
            pal.implementStatus !== STATUS_UNIMPLEMENTED &&
            !isInternalVariant(pal);
    }

    function compactSpeciesCandidates(list) {
        var bySpecies = {};
        list.forEach(function(pal) {
            if (!pal || !pal.species || !isSelectablePal(pal)) return;
            var existing = bySpecies[pal.species];
            if (!existing || compareCandidate(pal, existing) < 0) bySpecies[pal.species] = pal;
        });
        return Object.keys(bySpecies).map(function(key) {
            return bySpecies[key];
        }).sort(compareByDisplayId);
    }

    function rebuildFormulaCandidates() {
        parentCandidates = compactSpeciesCandidates(pals);
        formulaCandidates = parentCandidates.filter(function(pal) {
            return !specialChildIds[pal.species];
        }).sort(function(a, b) {
            return a.breedingPower - b.breedingPower || a.order - b.order;
        });
    }

    function setPalData(rawList) {
        pals = (rawList || []).map(function(raw, index) {
            return normalizePal(raw, index);
        }).filter(function(pal) {
            return !!pal.id;
        });
        palById = {};
        pals.forEach(function(pal) {
            palById[pal.id] = pal;
        });
        rebuildFormulaCandidates();
        clearCache();
    }

    function normalizeSpecialPair(row) {
        row = row || {};
        var pair = {
            id: row.id || '',
            parentAId: row[K_PARENT_A_ID] || '',
            parentAName: row[K_PARENT_A] || '',
            parentAGender: row[K_PARENT_A_GENDER] || '',
            parentBId: row[K_PARENT_B_ID] || '',
            parentBName: row[K_PARENT_B] || '',
            parentBGender: row[K_PARENT_B_GENDER] || '',
            childId: row[K_CHILD_ID] || '',
            childName: row[K_CHILD] || '',
            source: 'special'
        };
        pair.parentA = { id: pair.parentAId, name: pair.parentAName, gender: pair.parentAGender };
        pair.parentB = { id: pair.parentBId, name: pair.parentBName, gender: pair.parentBGender };
        pair.child = { id: pair.childId, name: pair.childName };
        return pair;
    }

    function setBreedingData(rawRows) {
        specialRows = (rawRows || []).map(normalizeSpecialPair).filter(function(row) {
            return row.parentAId && row.parentBId && row.childId;
        });
        specialByPairKeyNoGender = {};
        specialChildIds = {};
        var rowsByPairKey = {};
        specialRows.forEach(function(row) {
            var key = pairKey(row.parentAId, row.parentBId);
            if (!rowsByPairKey[key]) rowsByPairKey[key] = [];
            rowsByPairKey[key].push(row);
            specialChildIds[row.childId] = true;
        });
        Object.keys(rowsByPairKey).forEach(function(key) {
            var rows = rowsByPairKey[key];
            var genderedRows = rows.filter(function(row) {
                return !!(row.parentAGender || row.parentBGender);
            });
            specialByPairKeyNoGender[key] = genderedRows.length ? genderedRows : [rows[0]];
        });
        rebuildFormulaCandidates();
        clearCache();
    }

    function getPal(id) {
        var pal = palById[id];
        if (pal) return pal;
        for (var i = 0; i < parentCandidates.length; i++) {
            if (parentCandidates[i].species === id) return parentCandidates[i];
        }
        return { id: id || '', species: id || '', name: id || '', displayId: '', iconFile: '', iconStatus: '', breedingPower: null, canBreed: false, category: '', implementStatus: '', order: 0 };
    }

    function getPalIconHtml(id) {
        var pal = getPal(id);
        if (pal.iconFile && (pal.iconStatus === ICON_STATUS_EXISTS || pal.iconStatus === ICON_STATUS_COPIED)) {
            return '<img src="../\u6e38\u620f\u5185\u5bb9/\u5e7b\u517d\u5e15\u9c811.0/\u8d44\u6e90\u5305/\u5e15\u9c81\u5934\u50cf/' + pal.iconFile + '" class="br-icon" loading="lazy" alt="' + pal.name + '">';
        }
        return '<span class="br-icon-missing">?</span>';
    }

    function getPals() {
        return parentCandidates.slice();
    }

    function getBreedingRows() {
        return specialRows.slice();
    }

    function getSpecialPairs() {
        return specialRows.slice();
    }

    function getFormulaTargetPower(p1, p2) {
        var parentA = getPal(p1);
        var parentB = getPal(p2);
        if (!isSelectablePal(parentA) || !isSelectablePal(parentB)) return null;
        return Math.floor((parentA.breedingPower + parentB.breedingPower + 1) / 2);
    }

    function findFormulaChildId(p1, p2) {
        var target = getFormulaTargetPower(p1, p2);
        if (target === null || !formulaCandidates.length) return '';
        var best = null;
        var bestDiff = Infinity;
        var low = 0;
        var high = formulaCandidates.length;
        while (low < high) {
            var mid = Math.floor((low + high) / 2);
            if (formulaCandidates[mid].breedingPower < target) low = mid + 1;
            else high = mid;
        }
        var start = Math.max(0, low - 3);
        var end = Math.min(formulaCandidates.length - 1, low + 3);
        for (var i = start; i <= end; i++) {
            var pal = formulaCandidates[i];
            var diff = Math.abs(pal.breedingPower - target);
            if (!best || diff < bestDiff || (diff === bestDiff && pal.breedingPower > best.breedingPower) || (diff === bestDiff && pal.breedingPower === best.breedingPower && pal.order < best.order)) {
                best = pal;
                bestDiff = diff;
            }
        }
        return best ? best.species : '';
    }

    function makeFormulaPair(p1, p2, childId) {
        var parentA = getPal(p1);
        var parentB = getPal(p2);
        var child = getPal(childId);
        var target = getFormulaTargetPower(p1, p2);
        return {
            id: '',
            parentAId: parentA.species,
            parentAName: parentA.name,
            parentAGender: '',
            parentBId: parentB.species,
            parentBName: parentB.name,
            parentBGender: '',
            childId: child.species,
            childName: child.name,
            targetPower: target,
            source: 'formula',
            parentA: { id: parentA.species, name: parentA.name, gender: '' },
            parentB: { id: parentB.species, name: parentB.name, gender: '' },
            child: { id: child.species, name: child.name }
        };
    }

    function findChildren(p1, p2) {
        var specials = specialByPairKeyNoGender[pairKey(p1, p2)] || [];
        if (specials.length > 0) return specials.slice();
        var childId = findFormulaChildId(p1, p2);
        return childId ? [makeFormulaPair(p1, p2, childId)] : [];
    }

    function findChildrenByParent(parentId) {
        var parent = getPal(parentId);
        if (!isSelectablePal(parent)) return [];
        return parentCandidates.map(function(otherParent) {
            return {
                otherParentId: otherParent.species,
                results: findChildren(parent.species, otherParent.species)
            };
        }).filter(function(row) {
            return row.results.length > 0;
        }).sort(function(a, b) {
            return compareByDisplayId(getPal(a.otherParentId), getPal(b.otherParentId));
        });
    }

    function findChild(p1, p2) {
        var results = findChildren(p1, p2);
        return results.length > 0 ? results[0] : null;
    }

    function findParentPairs(childId) {
        childId = String(childId || '');
        if (!childId) return [];
        if (parentPairCache[childId]) return parentPairCache[childId].slice();

        var pairs = [];
        var seen = {};

        function addPair(row) {
            var key = pairKey(row.parentAId, row.parentBId);
            if (seen[key]) return;
            seen[key] = true;
            pairs.push(row);
        }

        var child = getPal(childId);
        if (child && child.species) {
            addPair(makeFormulaPair(child.species, child.species, child.species));
        }

        specialRows.forEach(function(row) {
            if (row.childId === childId) addPair(row);
        });

        if (specialChildIds[childId]) {
            parentPairCache[childId] = pairs.slice();
            return pairs;
        }

        for (var i = 0; i < parentCandidates.length; i++) {
            for (var j = i + 1; j < parentCandidates.length; j++) {
                var parentA = parentCandidates[i];
                var parentB = parentCandidates[j];
                if (specialByPairKeyNoGender[pairKey(parentA.species, parentB.species)]) continue;
                if (findFormulaChildId(parentA.species, parentB.species) === childId) {
                    addPair(makeFormulaPair(parentA.species, parentB.species, childId));
                }
            }
        }

        pairs.sort(function(a, b) {
            return String(getPal(a.parentAId).displayId || getPal(a.parentAId).name).localeCompare(String(getPal(b.parentAId).displayId || getPal(b.parentAId).name), 'zh-Hans-CN', { numeric: true }) ||
                String(getPal(a.parentBId).displayId || getPal(a.parentBId).name).localeCompare(String(getPal(b.parentBId).displayId || getPal(b.parentBId).name), 'zh-Hans-CN', { numeric: true });
        });
        parentPairCache[childId] = pairs.slice();
        return pairs;
    }

    function searchPals(query) {
        var q = String(query || '').toLowerCase();
        if (!q) return [];
        return parentCandidates.filter(function(pal) {
            return String(pal.name).toLowerCase().indexOf(q) > -1 ||
                String(pal.id).toLowerCase().indexOf(q) > -1 ||
                String(pal.species).toLowerCase().indexOf(q) > -1 ||
                String(pal.displayId).toLowerCase().indexOf(q) > -1;
        }).slice(0, 300);
    }

    return {
        setPalData: setPalData,
        setBreedingData: setBreedingData,
        getPals: getPals,
        getBreedingRows: getBreedingRows,
        getSpecialPairs: getSpecialPairs,
        getPal: getPal,
        getPalIconHtml: getPalIconHtml,
        getFormulaTargetPower: getFormulaTargetPower,
        findChild: findChild,
        findChildren: findChildren,
        findChildrenByParent: findChildrenByParent,
        findParentPairs: findParentPairs,
        searchPals: searchPals
    };
})();

if (typeof window !== 'undefined') {
    window.PT_BREEDING_CORE = PT_BREEDING_CORE;
}
