var PT_WORK_SPEED_IMMERSIVE = (function() {
    function getLogic() {
        if (typeof window !== 'undefined' && window.PT_WORK_SPEED_LOGIC) return window.PT_WORK_SPEED_LOGIC;
        return null;
    }

    function field(label, inner) {
        return '<label class="pt-immersive-field"><span>' + label + '</span>' + inner + '</label>';
    }

    function numberField(label, key, value, attrs) {
        return field(label, '<input type="number" class="pt-immersive-input" data-field="' + key + '" value="' + (value || '') + '" ' + (attrs || '') + '>');
    }

    function render() {
        var logic = getLogic();
        if (!logic) return '<div class="pt-immersive-placeholder">工作速度通用逻辑未加载。</div>';
        var state = logic.getInitialState();
        var data = logic.getWorkSpeedData() || {};
        var html = '<div class="pt-immersive-work-speed">';
        html += '<div class="pt-immersive-panel__head"><div><span class="pt-immersive-kicker">生产 / 计算</span><h1>工作速度计算器</h1></div><button type="button" class="pt-immersive-btn" data-action="max-all">一键最大值</button></div>';
        html += '<div class="pt-immersive-grid">';
        html += numberField('词条+伙伴总加成(%)', 'tcBonus', state.tcBonus);
        html += numberField('研究加成(%)', 'researchBonus', state.researchBonus);
        html += numberField('魂(%)', 'soulBonus', state.soulBonus);
        html += field('监控台', '<select class="pt-immersive-select" data-field="monitorBonus">' + logic.renderOptions(data.monitorOptions || [], state.monitorBonus) + '</select>');
        html += numberField('食物加成(%)', 'foodBonus', state.foodBonus);
        html += numberField('工作等级', 'workLevel', state.workLevel, 'min="1" max="5"');
        html += field('工作类型', '<select class="pt-immersive-select" data-field="workType"><option value="" hidden>请选择</option>' + logic.renderOptions(data.workTypeOptions || [], state.workType) + '</select>');
        html += field('工作设施', '<select class="pt-immersive-select" data-field="facilityName" data-role="facility-select" disabled><option value="" hidden>请先选择工作类型</option></select>');
        html += field('工作量', '<span><input type="number" class="pt-immersive-input" data-field="workload" data-role="workload-input" value="' + state.workload + '"><span class="pt-workload-lock" data-role="workload-lock">○ 可编辑</span></span>');
        html += numberField('帧率', 'fps', state.fps === 60 ? '' : state.fps);
        html += numberField('帕鲁数量', 'palCount', state.palCount === 1 ? '' : state.palCount, 'min="1"');
        html += field('增益开关', '<div class="pt-immersive-toggle-row"><label><input type="checkbox" data-field="betaBonus"' + (state.betaBonus ? ' checked' : '') + '> β波</label><label><input type="checkbox" data-field="buildingBonus"' + (state.buildingBonus ? ' checked' : '') + '> 建筑加成</label></div>');
        html += '</div>';
        html += '<div class="pt-immersive-results">';
        html += logic.renderResultCard('真实面板工作速度', 'actualSpeed');
        html += logic.renderResultCard('理论工作速度', 'theoreticalSpeed');
        html += logic.renderResultCard('理论工作时间', 'theoreticalTime');
        html += logic.renderResultCard('实际工作时间', 'actualTime');
        html += logic.renderResultCard('判定轮数', 'rounds');
        html += logic.renderResultCard('时间误差', 'errorSeconds');
        html += logic.renderResultCard('误差百分比', 'errorPercent');
        html += '</div>';
        html += '<div class="pt-immersive-grid" style="margin-top:14px">';
        html += numberField('极限工作量', 'ceilingWorkload', state.ceilingWorkload);
        html += numberField('极限帧率', 'ceilingFps', state.ceilingFps === 60 ? '' : state.ceilingFps);
        html += '</div>';
        html += '<div class="pt-inline-result" style="margin-top:14px">极限速度：<strong data-result="ceilingResult">—</strong></div>';
        html += '</div>';
        return html;
    }

    function bind(root) {
        var logic = getLogic();
        if (!root || !logic) return;
        root.querySelectorAll('[data-field]').forEach(function(fieldNode) {
            var eventName = fieldNode.type === 'checkbox' ? 'change' : 'input';
            if (fieldNode.tagName === 'SELECT') eventName = 'change';
            fieldNode.addEventListener(eventName, function() {
                if (fieldNode.dataset.field === 'workType') {
                    var facilitySelect = root.querySelector('[data-role="facility-select"]');
                    var workloadInput = root.querySelector('[data-role="workload-input"]');
                    if (facilitySelect) facilitySelect.value = '';
                    if (workloadInput) workloadInput.value = '';
                }
                if (fieldNode.dataset.field === 'workload' || fieldNode.dataset.field === 'fps') logic.syncCeilingFromMain(root);
                logic.updateResults(root);
            });
        });
        var maxButton = root.querySelector('[data-action="max-all"]');
        if (maxButton) maxButton.addEventListener('click', function() { logic.applyMaxValues(root); });
        logic.updateResults(root);
    }

    return { render: render, bind: bind };
})();

if (typeof window !== 'undefined') {
    window.PT_WORK_SPEED_IMMERSIVE = PT_WORK_SPEED_IMMERSIVE;
}
