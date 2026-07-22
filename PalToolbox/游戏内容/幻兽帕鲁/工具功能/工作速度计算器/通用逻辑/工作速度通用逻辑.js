var PT_WORK_SPEED_LOGIC = (function() {

function getInitialState() {
    return {
        tcBonus: 0,
        researchBonus: 0,
        soulBonus: 0,
        monitorBonus: 0,
        betaBonus: false,
        buildingBonus: false,
        foodBonus: 0,
        workLevel: 1,
        workType: '',
        facilityName: '',
        workload: '',
        fps: 60,
        palCount: 1,
        ceilingWorkload: '',
        ceilingFps: 60
    };
}

function getWorkSpeedData() {
    if (typeof window !== 'undefined' && window.PT_WORK_SPEED_DATA) return window.PT_WORK_SPEED_DATA;
    if (typeof module !== 'undefined' && module.exports) {
        return require('../../../../幻兽帕鲁1.0/数据包/工作速度计算器数据.js').PT_WORK_SPEED_DATA;
    }
    return null;
}

function getWorkSpeedCore() {
    if (typeof window !== 'undefined' && window.PT_WORK_SPEED_CORE) return window.PT_WORK_SPEED_CORE;
    if (typeof module !== 'undefined' && module.exports) {
        return require('../核心/工作速度计算核心.js').PT_WORK_SPEED_CORE;
    }
    return null;
}

function renderOptions(options, selectedValue) {
    return options.map(function(option) {
        var value = option.value != null ? option.value : option.name;
        var label = option.label || option.name;
        var selected = String(selectedValue) === String(value) ? ' selected' : '';
        return '<option value="' + value + '"' + selected + '>' + label + '</option>';
    }).join('');
}

function renderResultCard(label, resultKey) {
    return [
        '<article class="pt-result-item">',
        '<span class="pt-result-item__label">', label, '</span>',
        '<strong class="pt-result-item__value" data-result="', resultKey, '">—</strong>',
        '</article>'
    ].join('');
}

function getWorkloadRule(state, workSpeedData) {
    var usedData = workSpeedData || getWorkSpeedData() || {};
    if (!state.workType) {
        return {
            locked: false,
            workload: '',
            placeholder: '请先选择工作类型',
            statusText: '○ 可编辑'
        };
    }

    if (!state.facilityName) {
        return {
            locked: false,
            workload: '',
            placeholder: '请选择工作设施',
            statusText: '○ 可编辑'
        };
    }

    var facility = ((((usedData.facilities || {})[state.workType]) || {})[state.facilityName]) || null;
    if (!facility) {
        return {
            locked: false,
            workload: '',
            placeholder: '输入工作量',
            statusText: '○ 可编辑'
        };
    }

    if (facility.workload != null) {
        return {
            locked: true,
            workload: facility.workload,
            placeholder: '',
            statusText: '● 已锁定'
        };
    }

    return {
        locked: false,
        workload: '',
        placeholder: '输入工作量',
        statusText: '○ 可编辑'
    };
}

function readState(root) {
    var next = getInitialState();
    root.querySelectorAll('[data-field]').forEach(function(field) {
        var key = field.dataset.field;
        if (field.type === 'checkbox') {
            next[key] = field.checked;
        } else if (field.tagName === 'SELECT') {
            var sv = parseFloat(field.value || '0');
            next[key] = (key === 'workType' || key === 'facilityName') ? field.value : (isFinite(sv) ? sv : 0);
        } else if (key === 'workload' || key === 'ceilingWorkload') {
            next[key] = field.value === '' ? '' : (function() { var v = parseFloat(field.value || '0'); return isFinite(v) ? v : 0; })();
        } else {
            var nv = parseFloat(field.value || '0');
            next[key] = isFinite(nv) ? nv : 0;
        }
    });
    return next;
}

function applyMaxValues(root) {
    var fieldValues = {
        tcBonus: 175,
        researchBonus: 35,
        soulBonus: 60,
        foodBonus: 50,
        workLevel: 5,
        monitorBonus: 0.5
    };

    Object.keys(fieldValues).forEach(function(key) {
        var field = root.querySelector('[data-field="' + key + '"]');
        if (!field) return;
        field.value = String(fieldValues[key]);
        if (field.tagName === 'SELECT') {
            field.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });

    var betaCheck = root.querySelector('[data-field="betaBonus"]');
    var buildingCheck = root.querySelector('[data-field="buildingBonus"]');
    if (betaCheck) betaCheck.checked = true;
    if (buildingCheck) buildingCheck.checked = true;

    updateResults(root);
}

function updateFacilityOptions(root, state) {
    var facilitySelect = root.querySelector('[data-role="facility-select"]');
    var workSpeedCore = getWorkSpeedCore();
    var workSpeedData = getWorkSpeedData();
    if (!facilitySelect || !workSpeedCore || !workSpeedData) return;

    if (!state.workType) {
        facilitySelect.innerHTML = '<option value="" hidden>请先选择工作类型</option>';
        facilitySelect.disabled = true;
        if (typeof window.PT_refreshCustomSelect === 'function') {
            window.PT_refreshCustomSelect(facilitySelect);
        }
        return;
    }

    facilitySelect.disabled = false;

    var facilities = workSpeedCore.getFacilityOptions(state.workType, workSpeedData);
    var hasCat = facilities.some(function(f) { return f.cat; });
    var html = '<option value="" hidden>请选择工作设施</option>';

    if (hasCat) {
        var groups = {};
        facilities.forEach(function(item) {
            var cat = item.cat || '其他';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(item);
        });
        Object.keys(groups).forEach(function(cat) {
            html += '<optgroup label="' + cat + '">';
            html += groups[cat].map(function(item) {
                var selected = item.name === state.facilityName ? ' selected' : '';
                var workloadTag = item.workload != null ? ' [量' + item.workload + ']' : '';
                return '<option value="' + item.name + '"' + selected + '>' + item.name + ' (×' + item.factor + ')' + workloadTag + '</option>';
            }).join('');
            html += '</optgroup>';
        });
    } else {
        html += facilities.map(function(item) {
            var selected = item.name === state.facilityName ? ' selected' : '';
            var workloadTag = item.workload != null ? ' [量' + item.workload + ']' : '';
            return '<option value="' + item.name + '"' + selected + '>' + item.name + ' (×' + item.factor + ')' + workloadTag + '</option>';
        }).join('');
    }

    facilitySelect.innerHTML = html;
    if (typeof window.PT_refreshCustomSelect === 'function') {
        window.PT_refreshCustomSelect(facilitySelect);
    }
}

function applyWorkloadRule(root, state) {
    var workloadInput = root.querySelector('[data-role="workload-input"]');
    var lockNode = root.querySelector('[data-role="workload-lock"]');
    var rule = getWorkloadRule(state, getWorkSpeedData());
    if (!workloadInput || !lockNode) return rule;

    workloadInput.disabled = rule.locked;
    workloadInput.placeholder = rule.placeholder || '';

    if (rule.locked) {
        workloadInput.value = String(rule.workload);
        lockNode.textContent = rule.statusText;
        lockNode.className = 'pt-workload-lock pt-workload-lock--locked';
    } else {
        if (state.workType && state.facilityName && String(state.workload || '') !== '') {
            workloadInput.value = String(state.workload);
        }
        lockNode.textContent = rule.statusText;
        lockNode.className = 'pt-workload-lock pt-workload-lock--editable';
    }

    return rule;
}

function syncCeilingFromMain(root) {
    var fpsInput = root.querySelector('[data-field="fps"]');
    var workloadInput = root.querySelector('[data-role="workload-input"]');
    var ceilingWorkloadInput = root.querySelector('[data-field="ceilingWorkload"]');
    var ceilingFpsInput = root.querySelector('[data-field="ceilingFps"]');

    if (ceilingWorkloadInput && workloadInput && workloadInput.value !== '') {
        ceilingWorkloadInput.value = workloadInput.value;
    }
    if (ceilingFpsInput && fpsInput) {
        ceilingFpsInput.value = fpsInput.value;
    }
}

function updateResults(root) {
    var state = readState(root);
    updateFacilityOptions(root, state);
    var workloadRule = applyWorkloadRule(root, state);
    if (workloadRule.locked) {
        syncCeilingFromMain(root);
    }

    var activeState = readState(root);
    var workSpeedCore = getWorkSpeedCore();
    var workSpeedData = getWorkSpeedData();
    var workloadValue = activeState.workload === '' ? 0 : activeState.workload;
    var effectiveFps = activeState.fps || 60;
    var effectivePalCount = activeState.palCount || 1;

    if (workSpeedCore) {
        var speedResult = workSpeedCore.calculate({
            tcBonus: activeState.tcBonus,
            researchBonus: activeState.researchBonus,
            soulBonus: activeState.soulBonus,
            monitorBonus: activeState.monitorBonus,
            betaBonus: activeState.betaBonus,
            buildingBonus: activeState.buildingBonus,
            foodBonus: activeState.foodBonus,
            workLevel: activeState.workLevel || 1,
            workType: activeState.workType || 'handcraft',
            facilityName: activeState.facilityName || '原始作业台',
            workload: workloadValue || 1,
            fps: effectiveFps,
            palCount: effectivePalCount
        }, workSpeedData);

        root.querySelector('[data-result="actualSpeed"]').textContent = speedResult.actualSpeed.toFixed(3);

        if (activeState.facilityName && workloadValue > 0 && effectiveFps > 0 && effectivePalCount > 0) {
            root.querySelector('[data-result="theoreticalSpeed"]').textContent = speedResult.theoreticalSpeed.toFixed(3);
            root.querySelector('[data-result="theoreticalTime"]').textContent = speedResult.theoreticalTime.toFixed(3) + '秒';
            root.querySelector('[data-result="actualTime"]').textContent = speedResult.actualTime.toFixed(3) + '秒';
            root.querySelector('[data-result="rounds"]').textContent = String(speedResult.rounds);
            root.querySelector('[data-result="errorSeconds"]').textContent = speedResult.errorSeconds.toFixed(3) + '秒';
            root.querySelector('[data-result="errorPercent"]').textContent = speedResult.errorPercent.toFixed(3) + '%';
        } else {
            ['theoreticalSpeed', 'theoreticalTime', 'actualTime', 'rounds', 'errorSeconds', 'errorPercent'].forEach(function(key) {
                root.querySelector('[data-result="' + key + '"]').textContent = '—';
            });
        }
    }

    var ceilingWorkload = activeState.ceilingWorkload === '' ? 0 : activeState.ceilingWorkload;
    var ceilingFps = activeState.ceilingFps || 60;
    if (workSpeedCore && ceilingWorkload > 0 && ceilingFps > 0) {
        root.querySelector('[data-result="ceilingResult"]').textContent = String(workSpeedCore.calculateCeiling(ceilingWorkload, ceilingFps));
    } else {
        root.querySelector('[data-result="ceilingResult"]').textContent = '—';
    }
}

return {
    getInitialState: getInitialState,
    getWorkSpeedData: getWorkSpeedData,
    getWorkSpeedCore: getWorkSpeedCore,
    renderOptions: renderOptions,
    renderResultCard: renderResultCard,
    getWorkloadRule: getWorkloadRule,
    readState: readState,
    applyMaxValues: applyMaxValues,
    updateFacilityOptions: updateFacilityOptions,
    applyWorkloadRule: applyWorkloadRule,
    syncCeilingFromMain: syncCeilingFromMain,
    updateResults: updateResults
};
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PT_WORK_SPEED_LOGIC: PT_WORK_SPEED_LOGIC };
}
if (typeof window !== 'undefined') {
    window.PT_WORK_SPEED_LOGIC = PT_WORK_SPEED_LOGIC;
}
