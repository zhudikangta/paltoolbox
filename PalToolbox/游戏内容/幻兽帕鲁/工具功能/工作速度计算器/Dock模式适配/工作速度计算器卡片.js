var PT_WORK_SPEED_DOCK = (function() {

function getLogic() {
    if (typeof window !== 'undefined' && window.PT_WORK_SPEED_LOGIC) return window.PT_WORK_SPEED_LOGIC;
    if (typeof module !== 'undefined' && module.exports) {
        return require('../通用逻辑/工作速度通用逻辑.js').PT_WORK_SPEED_LOGIC;
    }
    return null;
}

function resolveCardShell() {
    if (typeof window !== 'undefined' && window.PT_renderToolCardShell) {
        return window.PT_renderToolCardShell;
    }
    if (typeof module !== 'undefined') {
        try {
            return require('../../../../../共享/核心框架/卡片系统.js').PT_renderToolCardShell;
        } catch (e) {}
    }
    return null;
}

function render(context) {
    var logic = getLogic();
    var info = context || {};
    var title = info.toolTitle || '工作速度计算器';
    var icon = info.toolIcon || '⊕';
    var instanceLabel = info.instanceLabel || '#1';
    var state = info.state || (logic ? logic.getInitialState() : {});
    var sharedData = (logic ? logic.getWorkSpeedData() : null) || {};
    var workTypeOptions = sharedData.workTypeOptions || [];
    var monitorOptions = sharedData.monitorOptions || [];

    var cardShell = resolveCardShell();
    var shellConfig = {
        title: title,
        icon: icon,
        instanceLabel: instanceLabel,
        bodyClassName: 'pt-window-card__body--calculator',
        showToolbar: info.showToolbar !== false,
        content: [
            '<div class="pt-mainpage pt-calc-layout">',
            '<section class="pt-calc-main">',
            '<article class="pt-card pt-card--overflow-hidden">',
            '<div class="pt-card__head">',
            '<h4 class="pt-card__title">帕鲁参数</h4>',
            '<button type="button" class="pt-btn pt-btn--primary pt-btn--pill" data-action="max-all">✦ 一键最大值</button>',
            '</div>',
            '<div class="pt-form-grid">',
            '<div class="pt-field"><span>词条+伙伴总加成(%)</span><input type="number" class="pt-input" min="0" placeholder="默认0" data-field="tcBonus" value="', (state.tcBonus || ''), '"></div>',
            '<div class="pt-field"><span>研究加成(%)</span><input type="number" class="pt-input" min="0" placeholder="制冷最高30%，其他35%" data-field="researchBonus" value="', (state.researchBonus || ''), '"></div>',
            '<div class="pt-field"><span>魂(%)</span><input type="number" class="pt-input" min="0" placeholder="默认0" data-field="soulBonus" value="', (state.soulBonus || ''), '"></div>',
            '<div class="pt-field"><span>监控台</span><select class="pt-select" data-field="monitorBonus">', logic.renderOptions(monitorOptions, state.monitorBonus), '</select></div>',
            '<div class="pt-field"><span>食物加成(%)</span><input type="number" class="pt-input" min="0" placeholder="默认0" data-field="foodBonus" value="', (state.foodBonus || ''), '"></div>',
            '<div class="pt-field"><span>工作等级</span><input type="number" class="pt-input" min="1" max="5" placeholder="1~5" data-field="workLevel" value="', (state.workLevel > 1 ? state.workLevel : ''), '"></div>',
            '</div>',
            '<div class="pt-toggle-stack">',
            '<div class="pt-toggle"><label class="pt-toggle__control"><input type="checkbox" class="pt-toggle__input" data-field="betaBonus"', state.betaBonus ? ' checked' : '', '><span class="pt-toggle__track"></span></label><span class="pt-toggle__label">β波</span><span class="pt-subtext">+10%</span></div>',
            '<div class="pt-toggle"><label class="pt-toggle__control"><input type="checkbox" class="pt-toggle__input" data-field="buildingBonus"', state.buildingBonus ? ' checked' : '', '><span class="pt-toggle__track"></span></label><span class="pt-toggle__label">建筑加成</span><span class="pt-subtext">+20%</span></div>',
            '</div>',
            '<div class="pt-card-section">',
            '<div class="pt-card__head">',
            '<h4 class="pt-card__title">工作参数</h4>',
            '</div>',
            '<div class="pt-form-grid pt-form-grid--calc">',
            '<div class="pt-field"><span>工作类型</span><select class="pt-select" data-field="workType"><option value="" hidden>请选择</option>', logic.renderOptions(workTypeOptions, state.workType), '</select></div>',
            '<div class="pt-field"><span>工作设施</span><select class="pt-select" data-field="facilityName" data-role="facility-select" disabled><option value="" hidden>请先选择工作类型</option></select></div>',
            '<div class="pt-field"><span>工作量</span><input type="number" class="pt-input" data-field="workload" data-role="workload-input" value="', state.workload, '"><span class="pt-workload-lock" data-role="workload-lock">○ 可编辑</span></div>',
            '<div class="pt-field"><span>帧率(fps)</span><input type="number" class="pt-input" placeholder="默认 60" data-field="fps" value="', (state.fps !== 60 ? state.fps : ''), '"></div>',
            '<div class="pt-field"><span>帕鲁数量</span><input type="number" class="pt-input" min="1" placeholder="默认 1" data-field="palCount" value="', (state.palCount !== 1 ? state.palCount : ''), '"></div>',
            '</div>',
            '</article>',
            '</section>',
            '<aside class="pt-calc-results">',
            '<article class="pt-card pt-card--results pt-card--overflow-hidden">',
            '<div class="pt-card__head">',
            '<h4 class="pt-card__title">计算结果</h4>',
            '</div>',
            '<div class="pt-result-stack">',
            logic.renderResultCard('真实面板工作速度', 'actualSpeed'),
            logic.renderResultCard('理论工作速度', 'theoreticalSpeed'),
            logic.renderResultCard('理论工作时间', 'theoreticalTime'),
            logic.renderResultCard('实际工作时间', 'actualTime'),
            logic.renderResultCard('判定轮数', 'rounds'),
            logic.renderResultCard('时间误差', 'errorSeconds'),
            logic.renderResultCard('误差百分比', 'errorPercent'),
            '</div>',
            '<button type="button" class="pt-btn pt-btn--ghost pt-btn--block" data-action="toggle-formula">查看公式与原理</button>',
            '<div class="pt-card-section">',
            '<div class="pt-card__head">',
            '<h4 class="pt-card__title">极限速度</h4>',
            '</div>',
            '<div class="pt-ceiling-fields">',
            '<div class="pt-field"><span>工作量</span><input type="number" class="pt-input" data-field="ceilingWorkload" value="', state.ceilingWorkload, '"></div>',
            '<div class="pt-field"><span>帧率</span><input type="number" class="pt-input" placeholder="默认 60" data-field="ceilingFps" value="', (state.ceilingFps !== 60 ? state.ceilingFps : ''), '"></div>',
            '</div>',
            '<div class="pt-inline-result">极限速度：<strong data-result="ceilingResult">—</strong></div>',
            '</div>',
            '</article>',
            '</aside>',
            '</div>',
            '<section class="pt-subpage pt-subpage--formula pt-formula-page" style="display:none">',
            '<div class="pt-subpage__head"><button type="button" class="pt-btn pt-btn--ghost pt-subpage__back" data-action="toggle-formula">← 返回计算器</button><h4 class="pt-subpage__title">公式与原理</h4></div>',
            '<div class="pt-subpage__body"><div class="pt-formula-page__content">',
            '<h4>符号对照</h4>',
            '<table class="pt-formula-table"><tr><td>真实面板工作速度</td><td>v_真</td></tr><tr><td>理论工作速度</td><td>V</td></tr><tr><td>理论工作时间</td><td>T_理论</td></tr><tr><td>实际工作时间</td><td>T_实际</td></tr><tr><td>判定轮数</td><td>n</td></tr><tr><td>极限速度</td><td>V_极限</td></tr><tr><td>当前帧率</td><td>f</td></tr><tr><td>帕鲁数量</td><td>N</td></tr></table>',
            '<h4>工作速度公式</h4>',
            '<div class="pt-formula-block"><h5>真实面板工作速度 v_真</h5><p>v_真 = 70 × (1 + 词条% + 伙伴% + 研究%) × (1 + 魂%) × (1 + 监控台%) × (1 + β波%) × (1 + 建筑%) × (1 + 食物%)</p><p class="pt-subtext">基础值固定 70。研究加成和魂不显示在游戏面板。</p></div>',
            '<div class="pt-formula-block"><h5>理论工作速度 V</h5><p>V = N × (工作等级因子 × 设施因子) / 70 × v_真</p></div>',
            '<div class="pt-formula-block"><h5>理论工作时间 T_理论</h5><p>T_理论 = 工作量 / V</p></div>',
            '<div class="pt-formula-block"><h5>实际工作时间 T_实际</h5><p>T_实际 = ⌈T_理论 × f⌉ / f</p><p class="pt-subtext">⌈x⌉ = 向上取整。游戏每帧判定一次。</p></div>',
            '<div class="pt-formula-block"><h5>判定轮数 n</h5><p>n = ⌈T_理论 × f⌉ = ⌈V_极限 / V⌉</p></div>',
            '<div class="pt-formula-block"><h5>误差</h5><p>时间误差 = T_实际 − T_理论 &nbsp; 误差% = (T_实际 − T_理论) / T_理论 × 100%</p></div>',
            '<div class="pt-formula-block"><h5>极限速度 V_极限</h5><p>V_极限 = 工作量 × f</p><p class="pt-subtext">V ≥ V_极限 时用时锁死为 1/f 秒。</p></div>',
            '<h4>工作等级因子</h4>',
            '<table class="pt-formula-table"><tr><th></th><th>1级</th><th>2级</th><th>3级</th><th>4级</th><th>5级</th></tr><tr><td>生火/手工/制药</td><td>0.7</td><td>2</td><td>6</td><td>18</td><td>54</td></tr><tr><td>播种/采集/浇水/伐木/采矿/冷却</td><td>0.7</td><td>1.5</td><td>3</td><td>5</td><td>10</td></tr><tr><td>发电</td><td>2.5</td><td>5</td><td>10</td><td>20</td><td>40</td></tr><tr><td>原油提炼</td><td>0.7</td><td>1.5</td><td>3</td><td>5</td><td>10</td></tr></table>',
            '<h4>设施因子</h4>',
            '<table class="pt-formula-table"><tr><th>工作类型</th><th>设施</th><th>倍率</th></tr>',
            '<tr><td rowspan="5">手工</td><td>原始作业台 → 优质作业台 → 流水线工厂 → 流水线Ⅱ → 高等文明</td><td>1 → 1.5 → 2 → 4 → 6</td></tr>',
            '<tr><td>帕鲁球制作台 → 流水线 → 流水线Ⅱ → 高等文明</td><td>1.5 → 2 → 4 → 6</td></tr>',
            '<tr><td>武器制作台 → 流水线 → 流水线Ⅱ → 高等文明</td><td>1.5 → 2 → 4 → 6</td></tr>',
            '<tr><td>修理台 / 帕鲁装置 / 制图桌 / 金币工厂</td><td>1 / 1 / 1 / 2</td></tr>',
            '<tr><td colspan="2">以上为"作业 / 帕鲁球 / 武器 / 其他"四分类</td></tr>',
            '<tr><td>制药</td><td>中世纪 → 电气 → 高等文明</td><td>1 → 2 → 3</td></tr>',
            '<tr><td>生火</td><td>篝火/原始炉子→料理锅/改良炉子→电气厨房/电气炉→大型厨房/巨大熔炉</td><td>1→1.5→3→4.5</td></tr>',
            '<tr><td>浇水</td><td>浇水粉碎机 → 冷却粉碎机；磨粉机</td><td>1 → 2；1</td></tr>',
            '<tr><td>伐木</td><td>伐木场（固定工作量 8）</td><td>1</td></tr>',
            '<tr><td>采矿</td><td>采石场(8)/金属矿场(80)/金属矿场Ⅱ(16)/煤矿场(80)/硫磺矿场(80)/纯水晶(100)/六棱晶(200)</td><td>1</td></tr>',
            '<tr><td>冷却</td><td>浇水粉碎机 → 冷却粉碎机；磨粉机</td><td>1 → 2；1</td></tr>',
            '<tr><td>发电</td><td>发电机(容量2500) → 大型发电机(10000)</td><td>1 → 3</td></tr>',
            '<tr><td>原油</td><td>原油提炼机（固定工作量 4000）</td><td>1</td></tr>',
            '</table>',
            '</div></div>',
            '</section>'
        ].join('')
    };

    if (cardShell) {
        return cardShell(shellConfig);
    }
    return '';
}

function bind(root) {
    var logic = getLogic();
    if (!root || !logic) return;

    root.querySelectorAll('[data-field]').forEach(function(field) {
        var eventName = field.type === 'checkbox' ? 'change' : 'input';
        if (field.tagName === 'SELECT') {
            eventName = 'change';
        }
        field.addEventListener(eventName, function() {
            if (field.dataset.field === 'workType') {
                var facilitySelect = root.querySelector('[data-role="facility-select"]');
                var workloadInput = root.querySelector('[data-role="workload-input"]');
                if (facilitySelect) facilitySelect.value = '';
                if (workloadInput) workloadInput.value = '';
            }
            if (field.dataset.field === 'workload' || field.dataset.field === 'fps') {
                logic.syncCeilingFromMain(root);
            }
            logic.updateResults(root);
        });
    });

    var maxButton = root.querySelector('[data-action="max-all"]');
    if (maxButton) {
        maxButton.addEventListener('click', function() {
            logic.applyMaxValues(root);
        });
    }

    var formulaToggle = root.querySelectorAll('[data-action="toggle-formula"]');
    var calcLayout = root.querySelector('.pt-calc-layout');
    var formulaPage = root.querySelector('.pt-formula-page');
    if (formulaToggle.length === 2 && calcLayout && formulaPage) {
        formulaToggle.forEach(function(btn) {
            btn.addEventListener('click', function() {
                var showFormula = formulaPage.style.display === 'none';
                var pageRoot = root.querySelector('.pt-window-card__body--calculator') || root;
                pageRoot.classList.toggle('pt-subpage-active', showFormula);
                calcLayout.style.display = showFormula ? 'none' : '';
                formulaPage.style.display = showFormula ? 'flex' : 'none';
            });
        });
    }

    logic.updateResults(root);
    if (typeof window.PT_initCustomSelects === 'function') {
        window.PT_initCustomSelects(root);
    }
}

return { render: render, bind: bind };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PT_WORK_SPEED_DOCK: PT_WORK_SPEED_DOCK
    };
}

if (typeof window !== 'undefined') {
    window.PT_WORK_SPEED_DOCK = PT_WORK_SPEED_DOCK;
}
