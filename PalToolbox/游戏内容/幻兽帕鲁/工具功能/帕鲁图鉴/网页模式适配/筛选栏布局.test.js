const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function renderWithMainCategory(mainCategory) {
    const context = {
        window: {
            PT_PALDEX_CORE: {
                ELEMENTS: [],
                getAll: function() {
                    return [{
                        slug: 'test-pal',
                        name: '测试帕鲁',
                        displayId: '1',
                        elements: [],
                        works: [],
                        stats: {},
                        icon: '',
                        partnerSkill: ''
                    }];
                },
                getBySlug: function() { return null; },
                getElementColor: function() { return ''; },
                getElementIconUrl: function() { return ''; },
                getWorkIconUrl: function() { return ''; },
                getWorkIcon: function() { return ''; }
            },
            PT_PALDEX_COMMON: {
                MAIN_CATEGORIES: [
                    { id: 'normal', label: '普通帕鲁' },
                    { id: 'bossVariant', label: 'Boss' }
                ],
                ORDINARY_SUB_CATEGORIES: [
                    { id: 'baseVariant', label: '基础+亚种' },
                    { id: 'terraria', label: '泰拉瑞亚' },
                    { id: 'variant', label: '其他' }
                ],
                DISPLAY_FIELDS: [],
                getState: function() {
                    return {
                        mainCategory: mainCategory,
                        subCategory: 'baseVariant',
                        showUnreleased: false,
                        newOnly: false,
                        selEls: [],
                        selWorks: [],
                        displayFields: [],
                        sortMode: 'default',
                        selPal: null,
                        searchQ: ''
                    };
                },
                getFilteredPals: function(core) { return core.getAll(); }
            },
            addEventListener: function() {}
        },
        document: {}
    };
    context.global = context;
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '帕鲁图鉴网页.js'), 'utf8'), context);
    return context.window.PT_PALDEX_WEB.render();
}

const normalHtml = renderWithMainCategory('normal');
const bossHtml = renderWithMainCategory('bossVariant');
const css = fs.readFileSync(path.resolve(__dirname, '../样式/帕鲁图鉴网页样式.css'), 'utf8') +
    fs.readFileSync(path.resolve(__dirname, '../../../../../共享/视觉系统/主题样式.css'), 'utf8');

assert.ok(normalHtml.includes('pt-web-filter-category-chips--sub'), '普通帕鲁状态应该显示子分类列');
assert.ok(bossHtml.includes('pt-web-filter-category-chips--sub'), '非普通帕鲁状态也应该保留子分类占位列，避免右侧筛选整体位移');
assert.ok(bossHtml.includes('pt-web-filter-category-chips--sub-empty'), '非普通帕鲁状态的子分类列应该是空占位');
assert.ok(!/\.pt-web-filter-groups\s*\{[^}]*width:\s*max-content/.test(css), '筛选栏外层不能按内容最大宽度撑开，否则窄窗口会越界');
assert.ok(/\.pt-web-filter-groups\s*\{[^}]*width:\s*min\(1580px,\s*100%\)/.test(css), '筛选栏外层应该限制在可视容器内');
assert.ok(/\.pt-web-filter-cluster--primary\s*\{[^}]*max-width:\s*100%/.test(css), '属性和工作筛选组应该允许在容器内收缩换行');
assert.ok(/\.pt-web-filter-chips\s*\{[^}]*min-width:\s*0/.test(css), '按钮行应该允许收缩，否则图标按钮会撑出右边界');

console.log('帕鲁图鉴筛选栏布局测试通过');
