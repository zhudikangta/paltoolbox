window.PT_WEB_TOOLS = {
    calculator:    { id: 'calculator',    title: '工作速度计算器',  group: 'archived', displayModule: 'PT_WORK_SPEED_WEB', layout: 'bounded' },
    breeding:      { id: 'breeding',      title: '配种查询',        group: 'calculators', displayModule: 'PT_BREEDING_WEB',   layout: 'grid-fluid' },
    capture:       { id: 'capture',       title: '捕获概率',        group: 'archived', displayModule: null,    layout: 'bounded' },
    paldex:        { id: 'paldex',        title: '帕鲁图鉴',        group: 'library',     displayModule: 'PT_PALDEX_WEB',     layout: 'grid-fluid' },
    items:         { id: 'items',         title: '物品图鉴',        group: 'library',     displayModule: 'PT_ITEM_WEB',       layout: 'grid-fluid' },
    equipment:     { id: 'equipment',     title: '装备图鉴',        group: 'library',     displayModule: 'PT_EQUIP_WEB',      layout: 'grid-fluid' },
    building:      { id: 'building',      title: '建筑图鉴',        group: 'library',     displayModule: 'PT_BUILD_WEB',      layout: 'grid-fluid' },
    activeSkill:   { id: 'activeSkill',   title: '主动技能',        group: 'skills',      displayModule: 'PT_SKILL_WEB',      layout: 'grid-fluid' },
    passives:      { id: 'passives',      title: '词条',            group: 'skills',      displayModule: 'PT_SKILL_WEB',      layout: 'grid-fluid' },
    partnerSkill:  { id: 'partnerSkill',  title: '伙伴技能',        group: 'skills',      displayModule: 'PT_SKILL_WEB',      layout: 'grid-fluid' },
    map:           { id: 'map',           title: '地图指南',        group: null,          displayModule: 'PT_MAP_WEB',        layout: 'immersive' },
    reference:     { id: 'reference',     title: '数值速查',        group: 'archived',      displayModule: null,                layout: 'bounded' },
    tech:          { id: 'tech',          title: '科技树',          group: null,            displayModule: 'PT_TECH_WEB',       layout: 'grid-fluid' },
    expTable:      { id: 'expTable',      title: '经验表',          group: null,            displayModule: 'PT_EXP_WEB',        layout: 'grid-fluid' },
    combat:        { id: 'combat',        title: '战斗与生产',      group: null,            displayModule: 'PT_COMBAT_WEB',     layout: 'grid-fluid' },
    shop:          { id: 'shop',          title: '商店',            group: null,            displayModule: 'PT_SHOP_WEB',       layout: 'grid-fluid' },
    mission:       { id: 'mission',       title: '任务与人物',      group: null,            displayModule: 'PT_MISSION_WEB',    layout: 'grid-fluid' },
    incident:      { id: 'incident',      title: '事件',            group: null,            displayModule: 'PT_INCIDENT_WEB',   layout: 'grid-fluid' },
    drops:         { id: 'drops',         title: '掉落',            group: null,            displayModule: 'PT_DROP_WEB',       layout: 'grid-fluid' },
    workSim:       { id: 'workSim',       title: '工作模拟',        group: null,            displayModule: 'PT_WORKSIM_WEB',    layout: 'bounded' },
    server:        { id: 'server',        title: '服务器搭建',      group: 'archived',      displayModule: null,                layout: 'bounded' },
    aihelper:      { id: 'aihelper',      title: '帕鲁AI助手',      group: 'archived',      displayModule: null,                layout: 'bounded' },
    settings:      { id: 'settings',      title: '设置',            group: null,            displayModule: 'PT_WEB_SETTINGS_PAGE', layout: 'bounded' }
};

window.PT_WEB_GROUPS = [
    { id: 'calculators', title: '工具', tools: ['breeding'], open: true },
    { id: 'library',     title: '图鉴', tools: ['paldex','items','equipment','building'], open: true },
    { id: 'skills',      title: '技能', tools: ['activeSkill','passives','partnerSkill'], open: true }
];

window.PT_WEB_STANDALONE = ['map','tech','expTable','combat','shop','mission','incident','drops','workSim','settings'];
window.PT_WEB_ACTIVE_TOOL = null;

function PT_getWebDisplayModule(toolId) {
    var tool = (window.PT_WEB_TOOLS || {})[toolId];
    if (!tool || !tool.displayModule) return null;
    return window[tool.displayModule] || null;
}

function PT_getWebLayoutClass(tool) {
    var layout = window.PT_getWebToolLayout ? window.PT_getWebToolLayout(tool) : (tool && tool.layout ? tool.layout : 'bounded');
    if (layout === 'grid-fluid') return 'pt-web-page--grid-fluid';
    if (layout === 'immersive') return 'pt-web-page--immersive';
    return 'pt-web-page--bounded';
}

window.PT_getWebToolLayout = function PT_getWebToolLayout(tool) {
    var base = tool && tool.layout ? tool.layout : 'bounded';
    if (base === 'immersive') return 'immersive';
    try {
        var settings = typeof window.readPTSettings === 'function' ? window.readPTSettings('web') : {};
        var layouts = settings.webToolLayouts || {};
        var selected = tool && tool.id ? layouts[tool.id] : null;
        if (selected === 'bounded' || selected === 'grid-fluid') return selected;
    } catch (error) {}
    return base === 'grid-fluid' ? 'grid-fluid' : 'bounded';
};

function PT_applyWebLayoutClassToRenderedTool(content, tool) {
    var page = content ? content.querySelector('.pt-web-tool-page') : null;
    if (!page) return;
    page.classList.remove('pt-web-page--bounded', 'pt-web-page--grid-fluid', 'pt-web-page--immersive');
    page.classList.add(PT_getWebLayoutClass(tool));
}

function PT_destroyActiveWebTool() {
    if (!window.PT_WEB_ACTIVE_TOOL) return;
    var activeModule = PT_getWebDisplayModule(window.PT_WEB_ACTIVE_TOOL);
    if (activeModule && typeof activeModule.destroy === 'function') {
        activeModule.destroy();
    }
    window.PT_WEB_ACTIVE_TOOL = null;
}

window.PT_renderWebModeShell = function PT_renderWebModeShell() {
    var app = document.getElementById('app');
    if (!app) return;

    document.body.classList.add('pt-body--web-mode');

    var toolListHtml = (window.PT_WEB_GROUPS || []).map(function(group) {
        var tools = (group.tools || []).map(function(toolId) {
            var tool = window.PT_WEB_TOOLS[toolId];
            if (!tool) return '';
            return [
                '<button type="button" class="pt-web-tool-item" data-tool-id="', toolId, '">',
                '<span class="pt-web-tool-item__title">', tool.title, '</span>',
                '</button>'
            ].join('');
        }).join('');
        return [
            '<section class="pt-web-nav-group', group.open === false ? '' : ' pt-web-nav-group--open', '" data-web-group="', group.id, '">',
            '<button type="button" class="pt-web-nav-group__head" data-web-group-toggle="', group.id, '">',
            '<span>', group.title, '</span><span class="pt-web-nav-group__chevron">⌄</span>',
            '</button>',
            '<div class="pt-web-nav-group__items">',
            tools,
            '</div>',
            '</section>'
        ].join('');
    }).join('');

    var standaloneHtml = (window.PT_WEB_STANDALONE || []).map(function(toolId) {
        var tool = window.PT_WEB_TOOLS[toolId];
        if (!tool) return '';
        return [
            '<button type="button" class="pt-web-tool-item pt-web-tool-item--standalone" data-tool-id="', toolId, '">',
            '<span class="pt-web-tool-item__title">', tool.title, '</span>',
            '</button>'
        ].join('');
    }).join('');

    app.innerHTML = [
        '<div class="pt-web-mode-root">',
        '<nav class="pt-web-sidebar">',
        '<div class="pt-web-sidebar__brand">',
        '<strong>PalToolbox</strong>',
        '<span>幻兽帕鲁</span>',
        '</div>',
        '<div class="pt-web-sidebar__tools">',
        toolListHtml,
        standaloneHtml,
        renderArchivedGroup(),
        '</div>',
        '</nav>',
        '<main class="pt-web-content" id="pt-web-content"></main>',
        '</div>'
    ].join('');

    var items = app.querySelectorAll('.pt-web-tool-item');
    for (var i = 0; i < items.length; i++) {
        items[i].addEventListener('click', function() {
            window.PT_switchWebTool(this.getAttribute('data-tool-id'));
        });
    }

    var groupToggles = app.querySelectorAll('[data-web-group-toggle]');
    for (var g = 0; g < groupToggles.length; g++) {
        groupToggles[g].addEventListener('click', function() {
            var group = this.closest('.pt-web-nav-group');
            if (group) group.classList.toggle('pt-web-nav-group--open');
        });
    }

    if (typeof window.PT_applyVisualPrefs === 'function') {
        var settings = typeof window.readPTSettings === 'function' ? window.readPTSettings('web') : { theme: 'oceanic' };
        var visualSettings = typeof window.PT_getWebVisualSettings === 'function' ? window.PT_getWebVisualSettings(settings) : settings;
        window.PT_applyVisualPrefs(visualSettings);
    }

    if (window.PT_MAP_WEB && typeof window.PT_MAP_WEB.preload === 'function') {
        window.PT_MAP_WEB.preload();
    }

    window.PT_switchWebTool('paldex');
};

function renderArchivedGroup() {
    var tools = ['calculator','capture','reference','server','aihelper'].map(function(toolId) {
        var tool = window.PT_WEB_TOOLS[toolId];
        if (!tool) return '';
        return '<button type="button" class="pt-web-tool-item" data-tool-id="' + toolId + '">' +
            '<span class="pt-web-tool-item__title">' + tool.title + '</span></button>';
    }).join('');
    return '<section class="pt-web-nav-group pt-web-nav-group--archived" data-web-group="archived">' +
        '<button type="button" class="pt-web-nav-group__head" data-web-group-toggle="archived">' +
        '<span>已过期 / 未来上架</span><span class="pt-web-nav-group__chevron">⌄</span></button>' +
        '<div class="pt-web-nav-group__items">' + tools + '</div></section>';
}

window.PT_switchWebTool = function PT_switchWebTool(toolId) {
    var content = document.getElementById('pt-web-content');
    if (!content) return;

    var tool = (window.PT_WEB_TOOLS || {})[toolId];
    if (!tool) return;

    PT_destroyActiveWebTool();

    var moduleName = tool.displayModule;
    var displayModule = moduleName ? (window[moduleName] || null) : null;
    if (!displayModule || typeof displayModule.render !== 'function') {
        var layoutClass = PT_getWebLayoutClass(tool);
        content.innerHTML = '<div class="pt-web-tool-frame"><div class="pt-web-tool-scroll">' +
            '<div class="pt-web-tool-page ' + layoutClass + '"><header class="pt-web-tool-heading"><h1>' + tool.title + '</h1></header>' +
            '<section class="pt-web-section"><p style="color:var(--pt-text-sub)">此工具尚未迁移，敬请期待。</p></section></div>' +
            '</div></div>';
        PT_applyWebLayoutClassToRenderedTool(content, tool);
        if (typeof window.PT_initCustomScrollbars === 'function') window.PT_initCustomScrollbars(content);
    } else {
        window.PT_WEB_ACTIVE_TOOL = toolId;
        content.innerHTML = '<div class="pt-web-tool-frame"><div class="pt-web-tool-scroll">' + displayModule.render() + '</div></div>';
        PT_applyWebLayoutClassToRenderedTool(content, tool);

        if (typeof displayModule.bind === 'function') {
            displayModule.bind(content);
        }

        if (typeof window.PT_initCustomSelects === 'function') {
            window.PT_initCustomSelects(content);
        }
        if (typeof window.PT_initCustomScrollbars === 'function') {
            window.PT_initCustomScrollbars(content);
        }
    }

    window.PT_WEB_ACTIVE_TOOL = toolId;

    var items = document.querySelectorAll('.pt-web-tool-item');
    for (var i = 0; i < items.length; i++) {
        var isActive = items[i].getAttribute('data-tool-id') === toolId;
        items[i].classList.toggle('pt-web-tool-item--active', isActive);
    }
};

window.addEventListener('DOMContentLoaded', function() {
    var mode = 'dock';
    try {
        var settings = typeof window.readPTSettings === 'function' ? window.readPTSettings() : null;
        mode = (settings && settings.webMode) || 'dock';
    } catch (e) {}

    if (mode !== 'web') return;

    window.PT_renderWebModeShell();
    if (typeof window.PT_finishModeSwitchTransition === 'function') {
        window.PT_finishModeSwitchTransition();
    }
});
