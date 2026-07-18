var PT_WORK_SPEED_WEB = (function() {

function getLogic() {
    if (typeof window !== 'undefined' && window.PT_WORK_SPEED_LOGIC) return window.PT_WORK_SPEED_LOGIC;
    if (typeof module !== 'undefined' && module.exports) {
        return require('../通用逻辑/工作速度通用逻辑.js').PT_WORK_SPEED_LOGIC;
    }
    return null;
}

function renderFacilityFactorTable(workSpeedData) {
    var logic = getLogic();
    var data = workSpeedData || (logic ? logic.getWorkSpeedData() : null) || {};
    var facilities = data.facilities || {};
    var typeLabels = {};
    (data.workTypeOptions || []).forEach(function(item) {
        typeLabels[item.value] = item.label;
    });
    var rows = '';
    Object.keys(facilities).forEach(function(typeId) {
        var names = Object.keys(facilities[typeId] || {});
        names.forEach(function(name, index) {
            var facility = facilities[typeId][name] || {};
            rows += '<tr>';
            rows += index === 0 ? '<td rowspan="' + names.length + '">' + (typeLabels[typeId] || typeId) + '</td>' : '';
            rows += '<td>' + name + '</td>';
            rows += '<td>×' + facility.factor + '</td>';
            rows += '<td>' + (facility.workload != null ? facility.workload : '手动输入') + '</td>';
            rows += '</tr>';
        });
    });
    return '<h4>设施因子</h4><table class="pt-formula-table pt-formula-table--facility"><tr><th>工作类型</th><th>设施</th><th>倍率</th><th>工作量</th></tr>' + rows + '</table>';
}

function render() {
    var logic = getLogic();
    var state = logic ? logic.getInitialState() : {};
    var sharedData = (logic ? logic.getWorkSpeedData() : null) || {};
    var workTypeOptions = sharedData.workTypeOptions || [];
    var monitorOptions = sharedData.monitorOptions || [];
    var html = '<div class="pt-web-tool-page pt-web-page--bounded pt-web-work-speed-page">';
    html += '<header class="pt-web-tool-heading">';
    html += '<div><span class="pt-web-tool-kicker">生产 / 计算</span><h1>工作速度计算器</h1></div>';
    html += '<button type="button" class="pt-btn pt-btn--primary pt-btn--pill" data-action="max-all">✦ 一键最大值</button>';
    html += '</header>';
    html += '<div class="pt-mainpage pt-web-calc-layout">';
    html += '<section class="pt-web-calc-main">';
    html += '<section class="pt-web-section pt-web-section--pal"><div class="pt-web-section__head"><h2>帕鲁参数</h2></div>';
    html += '<div class="pt-web-form-card">';
    html += '<label class="pt-web-field"><span class="pt-web-field__label">词条+伙伴总加成(%)</span><input type="number" class="pt-input" min="0" placeholder="默认 0" data-field="tcBonus" value="' + (state.tcBonus || '') + '"></label>';
    html += '<label class="pt-web-field"><span class="pt-web-field__label">研究加成(%)</span><input type="number" class="pt-input" min="0" placeholder="制冷最高30%，其他35%" data-field="researchBonus" value="' + (state.researchBonus || '') + '"></label>';
    html += '<label class="pt-web-field"><span class="pt-web-field__label">魂(%)</span><input type="number" class="pt-input" min="0" placeholder="默认 0" data-field="soulBonus" value="' + (state.soulBonus || '') + '"></label>';
    html += '<label class="pt-web-field"><span class="pt-web-field__label">监控台</span><select class="pt-select" data-field="monitorBonus">' + logic.renderOptions(monitorOptions, state.monitorBonus) + '</select></label>';
    html += '<label class="pt-web-field"><span class="pt-web-field__label">食物加成(%)</span><input type="number" class="pt-input" min="0" placeholder="默认 0" data-field="foodBonus" value="' + (state.foodBonus || '') + '"></label>';
    html += '<label class="pt-web-field"><span class="pt-web-field__label">工作等级</span><input type="number" class="pt-input" min="1" max="5" placeholder="1~5" data-field="workLevel" value="' + (state.workLevel > 1 ? state.workLevel : '') + '"></label>';
    html += '<div class="pt-web-toggle-row">';
    html += '<div class="pt-toggle"><label class="pt-toggle__control"><input type="checkbox" class="pt-toggle__input" data-field="betaBonus"' + (state.betaBonus ? ' checked' : '') + '><span class="pt-toggle__track"></span></label><span class="pt-toggle__label">β波</span><span class="pt-subtext">+10%</span></div>';
    html += '<div class="pt-toggle"><label class="pt-toggle__control"><input type="checkbox" class="pt-toggle__input" data-field="buildingBonus"' + (state.buildingBonus ? ' checked' : '') + '><span class="pt-toggle__track"></span></label><span class="pt-toggle__label">建筑加成</span><span class="pt-subtext">+20%</span></div>';
    html += '</div>';
    html += '</div></section>';
    html += '<section class="pt-web-section"><div class="pt-web-section__head"><h2>工作参数</h2></div>';
    html += '<div class="pt-web-form-card">';
    html += '<label class="pt-web-field"><span class="pt-web-field__label">工作类型</span><select class="pt-select" data-field="workType"><option value="" hidden>请选择</option>' + logic.renderOptions(workTypeOptions, state.workType) + '</select></label>';
    html += '<label class="pt-web-field"><span class="pt-web-field__label">工作设施</span><select class="pt-select" data-field="facilityName" data-role="facility-select" disabled><option value="" hidden>请先选择工作类型</option></select></label>';
    html += '<label class="pt-web-field"><span class="pt-web-field__label">工作量</span><span class="pt-web-field__input-group"><input type="number" class="pt-input" data-field="workload" data-role="workload-input" value="' + state.workload + '"><span class="pt-workload-lock" data-role="workload-lock">○ 可编辑</span></span></label>';
    html += '<label class="pt-web-field"><span class="pt-web-field__label">帧率(fps)</span><input type="number" class="pt-input" placeholder="默认 60" data-field="fps" value="' + (state.fps !== 60 ? state.fps : '') + '"></label>';
    html += '<label class="pt-web-field"><span class="pt-web-field__label">帕鲁数量</span><input type="number" class="pt-input" min="1" placeholder="默认 1" data-field="palCount" value="' + (state.palCount !== 1 ? state.palCount : '') + '"></label>';
    html += '</div></section></section>';
    html += '<aside class="pt-web-calc-results">';
    html += '<section class="pt-web-result-panel">';
    html += '<div class="pt-web-result-panel__head"><h2>计算结果</h2></div>';
    html += '<div class="pt-result-stack">';
    html += logic.renderResultCard('真实面板工作速度', 'actualSpeed');
    html += logic.renderResultCard('理论工作速度', 'theoreticalSpeed');
    html += logic.renderResultCard('理论工作时间', 'theoreticalTime');
    html += logic.renderResultCard('实际工作时间', 'actualTime');
    html += logic.renderResultCard('判定轮数', 'rounds');
    html += logic.renderResultCard('时间误差', 'errorSeconds');
    html += logic.renderResultCard('误差百分比', 'errorPercent');
    html += '</div>';
    html += '<button type="button" class="pt-btn pt-btn--ghost pt-btn--block" data-action="toggle-formula">查看公式与原理</button>';
    html += '<div class="pt-web-ceiling-block"><div class="pt-web-section__head"><h2>极限速度</h2></div>';
    html += '<div class="pt-ceiling-fields"><div class="pt-field"><span>工作量</span><input type="number" class="pt-input" data-field="ceilingWorkload" value="' + state.ceilingWorkload + '"></div><div class="pt-field"><span>帧率</span><input type="number" class="pt-input" placeholder="默认 60" data-field="ceilingFps" value="' + (state.ceilingFps !== 60 ? state.ceilingFps : '') + '"></div></div>';
    html += '<div class="pt-inline-result">极限速度：<strong data-result="ceilingResult">—</strong></div></div>';
    html += '</section></aside></div>';
    html += '<section class="pt-subpage pt-subpage--formula pt-formula-page pt-web-reference-page" style="display:none"><div class="pt-subpage__head"><button type="button" class="pt-btn pt-btn--ghost pt-subpage__back" data-action="toggle-formula">← 返回计算器</button><h4 class="pt-subpage__title">公式与原理</h4></div><div class="pt-subpage__body"><div class="pt-formula-page__content">';
    html += '<h4>符号对照</h4><table class="pt-formula-table"><tr><td>真实面板工作速度</td><td>v_真</td></tr><tr><td>理论工作速度</td><td>V</td></tr><tr><td>理论工作时间</td><td>T_理论</td></tr><tr><td>实际工作时间</td><td>T_实际</td></tr><tr><td>判定轮数</td><td>n</td></tr><tr><td>极限速度</td><td>V_极限</td></tr><tr><td>当前帧率</td><td>f</td></tr><tr><td>帕鲁数量</td><td>N</td></tr></table>';
    html += '<h4>工作速度公式</h4>';
    html += '<div class="pt-formula-block"><h5>真实面板工作速度 v_真</h5><p>v_真 = 70 × (1 + 词条% + 伙伴% + 研究%) × (1 + 魂%) × (1 + 监控台%) × (1 + β波%) × (1 + 建筑%) × (1 + 食物%)</p><p class="pt-subtext">基础值固定 70。</p></div>';
    html += '<div class="pt-formula-block"><h5>理论工作速度 V</h5><p>V = N × (工作等级因子 × 设施因子) / 70 × v_真</p></div>';
    html += '<div class="pt-formula-block"><h5>理论工作时间 T_理论</h5><p>T_理论 = 工作量 / V</p></div>';
    html += '<div class="pt-formula-block"><h5>实际工作时间 T_实际</h5><p>T_实际 = ⌈T_理论 × f⌉ / f</p></div>';
    html += '<div class="pt-formula-block"><h5>判定轮数 n</h5><p>n = ⌈T_理论 × f⌉ = ⌈V_极限 / V⌉</p></div>';
    html += '<div class="pt-formula-block"><h5>误差</h5><p>时间误差 = T_实际 − T_理论 &nbsp; 误差% = (T_实际 − T_理论) / T_理论 × 100%</p></div>';
    html += '<div class="pt-formula-block"><h5>极限速度 V_极限</h5><p>V_极限 = 工作量 × f</p></div>';
    html += '<h4>工作等级因子</h4><table class="pt-formula-table"><tr><th></th><th>1级</th><th>2级</th><th>3级</th><th>4级</th><th>5级</th></tr><tr><td>生火/手工/制药</td><td>0.7</td><td>2</td><td>6</td><td>18</td><td>54</td></tr><tr><td>播种/采集/浇水/伐木/采矿/冷却</td><td>0.7</td><td>1.5</td><td>3</td><td>5</td><td>10</td></tr><tr><td>发电</td><td>2.5</td><td>5</td><td>10</td><td>20</td><td>40</td></tr><tr><td>原油提炼</td><td>0.7</td><td>1.5</td><td>3</td><td>5</td><td>10</td></tr></table>';
    html += renderFacilityFactorTable(sharedData);
    html += '</div></div></section></div>';
    return html;
}

function bind(root) {
    var logic = getLogic();
    if (!root || !logic) return;
    root.querySelectorAll('[data-field]').forEach(function(field) {
        var eventName = field.type === 'checkbox' ? 'change' : 'input';
        if (field.tagName === 'SELECT') eventName = 'change';
        field.addEventListener(eventName, function() {
            if (field.dataset.field === 'workType') {
                var facilitySelect = root.querySelector('[data-role="facility-select"]');
                var workloadInput = root.querySelector('[data-role="workload-input"]');
                if (facilitySelect) facilitySelect.value = '';
                if (workloadInput) workloadInput.value = '';
            }
            if (field.dataset.field === 'workload' || field.dataset.field === 'fps') logic.syncCeilingFromMain(root);
            logic.updateResults(root);
        });
    });
    var maxButton = root.querySelector('[data-action="max-all"]');
    if (maxButton) maxButton.addEventListener('click', function() { logic.applyMaxValues(root); });
    var formulaToggle = root.querySelectorAll('[data-action="toggle-formula"]');
    var calcLayout = root.querySelector('.pt-web-calc-layout');
    var formulaPage = root.querySelector('.pt-formula-page');
    if (formulaToggle.length === 2 && calcLayout && formulaPage) {
        formulaToggle.forEach(function(btn) {
            btn.addEventListener('click', function() {
                var showFormula = formulaPage.style.display === 'none';
                root.classList.toggle('pt-subpage-active', showFormula);
                calcLayout.style.display = showFormula ? 'none' : '';
                formulaPage.style.display = showFormula ? 'flex' : 'none';
            });
        });
    }
    logic.updateResults(root);
    if (typeof window.PT_initCustomSelects === 'function') window.PT_initCustomSelects(root);
}

return { render: render, bind: bind };
})();

if (typeof window !== 'undefined') {
    window.PT_WORK_SPEED_WEB = PT_WORK_SPEED_WEB;
}
