var PT_renderToolCardShell = function PT_renderToolCardShell(options) {
    var config = options || {};
    var title = config.title || '未命名工具';
    var icon = config.icon || '◆';
    var instanceLabel = config.instanceLabel || '#1';
    var bodyClassName = config.bodyClassName || '';
    var content = config.content || '';
    var showToolbar = config.showToolbar !== false;
    var toolbarHtml = showToolbar ? [
        '<div class="pt-window-card__toolbar">',
        '<button type="button" class="pt-window-card__toolbtn" data-action="copy" aria-label="复制">⎘</button>',
        '<button type="button" class="pt-window-card__toolbtn" data-action="minimize" aria-label="最小化">—</button>',
        '<button type="button" class="pt-window-card__toolbtn" data-action="close" aria-label="关闭">✕</button>',
        '</div>'
    ].join('') : '';

    return [
        '<section class="pt-window-card">',
        '<header class="pt-window-card__header">',
        '<div class="pt-window-card__title-wrap">',
        '<span class="pt-window-card__badge">', icon, '</span>',
        '<div class="pt-window-card__title-group">',
        '<h3 class="pt-window-card__title">', title, '</h3>',
        '<span class="pt-window-card__instance">', instanceLabel, '</span>',
        '</div>',
        '</div>',
        toolbarHtml,
        '</header>',
        '<div class="pt-window-card__body ', bodyClassName, '">',
        content,
        '</div>',
        '</section>'
    ].join('');
};

var PT_renderToolCard = function PT_renderToolCard(toolMeta, instanceMeta) {
    var title = toolMeta && toolMeta.title ? toolMeta.title : '未命名工具';
    var description = toolMeta && toolMeta.description ? toolMeta.description : '暂无说明。';
    var icon = toolMeta && toolMeta.iconText ? toolMeta.iconText : '◆';
    var label = instanceMeta && instanceMeta.instanceLabel ? instanceMeta.instanceLabel : '#1';

    return PT_renderToolCardShell({
        title: title,
        icon: icon,
        instanceLabel: label,
        bodyClassName: 'pt-window-card__body--placeholder',
        showToolbar: instanceMeta ? instanceMeta.showToolbar : undefined,
        content: [
            '<article class="pt-empty-card">',
            '<h4>', title, '</h4>',
            '<p class="pt-subtext">', description, '</p>',
            '</article>'
        ].join('')
    });
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PT_renderToolCardShell: PT_renderToolCardShell,
        PT_renderToolCard: PT_renderToolCard
    };
}

if (typeof window !== 'undefined') {
    window.PT_renderToolCardShell = PT_renderToolCardShell;
    window.PT_renderToolCard = PT_renderToolCard;
}
