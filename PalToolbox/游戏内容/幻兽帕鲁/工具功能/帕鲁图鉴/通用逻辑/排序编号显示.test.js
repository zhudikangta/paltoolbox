const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function runFile(context, file) {
    vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
}

const coreContext = { window: {} };
coreContext.global = coreContext;
vm.createContext(coreContext);
runFile(coreContext, path.resolve(__dirname, '../核心/帕鲁图鉴核心.js'));
const core = coreContext.window.PT_PALDEX_CORE;

core.setData([
    { id: 'TenPal', 种族: 'TenPal', 图鉴编号: 10, 图鉴后缀: '', 分类: '基础', 实装状态: '正常', 中文名: '十号帕鲁', 属性1: 'Normal', 属性2: 'None', 工作适性: {} },
    { id: 'TwoPal', 种族: 'TwoPal', 图鉴编号: 2, 图鉴后缀: '', 分类: '基础', 实装状态: '正常', 中文名: '二号帕鲁', 属性1: 'Normal', 属性2: 'None', 工作适性: {} },
    { id: 'BOSS_TenPal', 种族: 'TenPal', 图鉴编号: 0, 图鉴后缀: '', 分类: 'Boss变体', 实装状态: '正常', 中文名: 'A十号Boss', 属性1: 'Normal', 属性2: 'None', 工作适性: {} },
    { id: 'BOSS_TwoPal', 种族: 'TwoPal', 图鉴编号: 0, 图鉴后缀: '', 分类: 'Boss变体', 实装状态: '正常', 中文名: 'Z二号Boss', 属性1: 'Normal', 属性2: 'None', 工作适性: {} },
    { id: 'YakushimaMonster001', 种族: 'YakushimaMonster001', 图鉴编号: 0, 图鉴后缀: '', 分类: '泰拉瑞亚', 实装状态: '正常', 中文名: 'Z绿史莱姆', 属性1: 'Normal', 属性2: 'None', 工作适性: {} },
    { id: 'YakushimaMonster002', 种族: 'YakushimaMonster002', 图鉴编号: 0, 图鉴后缀: '', 分类: '泰拉瑞亚', 实装状态: '正常', 中文名: 'A附魔剑', 属性1: 'Normal', 属性2: 'None', 工作适性: {} }
]);

const bossOrder = core.getAll().filter(function(pal) {
    return pal.category === 'Boss变体';
}).map(function(pal) {
    return pal.id;
});

assert.deepStrictEqual(bossOrder, ['BOSS_TwoPal', 'BOSS_TenPal'], 'Boss分类应该按照对应普通帕鲁的编号排序');
assert.deepStrictEqual(core.getAll().filter(function(pal) {
    return pal.category === '泰拉瑞亚';
}).map(function(pal) {
    return pal.id;
}), ['YakushimaMonster001', 'YakushimaMonster002'], '没有对应普通帕鲁编号的分类应该保留数据文件原始顺序');
assert.strictEqual(core.getById('BOSS_TwoPal').displayId, '', '无编号Boss不应该有显示编号');
assert.strictEqual(core.getById('YakushimaMonster001').displayId, '', '无编号泰拉瑞亚帕鲁不应该有显示编号');

const webContext = {
    window: {
        PT_PALDEX_CORE: {
            ELEMENTS: [],
            getAll: function() { return [{ slug: 'YakushimaMonster001' }]; },
            getBySlug: function() { return null; },
            getElementColor: function() { return '#fff'; },
            getElementIconUrl: function() { return ''; },
            getWorkIconUrl: function() { return ''; },
            getWorkIcon: function() { return ''; }
        },
        PT_PALDEX_COMMON: {
            getState: function() { return { mainCategory: 'normal', showUnreleased: false, selEl: '', selWork: '', selPal: null, searchQ: '' }; },
            getFilteredPals: function() {
                return [{ slug: 'YakushimaMonster001', displayId: '', name: '绿史莱姆', partnerSkill: '', elements: [], works: [], stats: {}, icon: '' }];
            },
            MAIN_CATEGORIES: []
        }
    }
};
webContext.global = webContext;
vm.createContext(webContext);
runFile(webContext, path.resolve(__dirname, '../网页模式适配/帕鲁图鉴网页.js'));

const html = webContext.window.PT_PALDEX_WEB.render();
assert.ok(!html.includes('<span class="pd-card-id">#</span>'), '无编号卡片不应该显示空井号');
assert.ok(!html.includes('<span style="font-size:14px;color:var(--pt-text-sub)">#</span>'), '无编号详情标题不应该显示空井号');

console.log('帕鲁图鉴排序编号显示测试通过');
