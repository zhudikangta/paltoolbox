const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const context = {
    window: {
        PT_TECH_CORE: {
            getAll: function() {
                return [
                    { id: 'normal1', name: '普通作业台', level: 1, points: 1, ancient: false, items: [], buildings: [], description: '' },
                    { id: 'ancient1', name: '古代装置', level: 10, points: 1, ancient: true, items: [], buildings: [], description: '' }
                ];
            },
            getLevels: function() { return [1, 10]; },
            search: function(query, type, level) {
                const all = this.getAll();
                if (type === 'normal') return all.filter(function(item) { return !item.ancient; });
                if (type === 'ancient') return all.filter(function(item) { return item.ancient; });
                return all;
            },
            getIconUrl: function() { return ''; },
            getChangeDetail: function() { return { changed: false }; }
        },
        addEventListener: function() {}
    },
    document: { getElementById: function() { return null; } },
    fetch: undefined
};
context.global = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '科技树网页.js'), 'utf8'), context);

const html = context.window.PT_TECH_WEB.render();
const css = fs.readFileSync(path.resolve(__dirname, '../样式/科技树网页样式.css'), 'utf8');

assert.ok(!html.includes('data-tech-type="ancient"'), '古代科技不应该再作为单独切换按钮出现');
assert.ok(html.includes('tech-board'), '科技树应该使用左右同屏布局');
assert.ok(html.includes('tech-panel-title--normal'), '普通科技应该在主区域展示');
assert.ok(html.includes('tech-panel-title--ancient'), '古代科技应该在右侧独立列展示');
assert.ok(html.indexOf('普通作业台') < html.indexOf('古代装置'), '古代科技应该跟在普通科技后面');
assert.ok(html.includes('data-tech-level-row="1"'), '科技树应该渲染普通科技所在的1级行');
assert.ok(html.includes('data-tech-level-row="10"'), '科技树应该渲染古代科技所在的10级行');
assert.ok(html.indexOf('data-tech-level-row="10"') < html.indexOf('古代装置'), '10级古代科技应该挂在10级行里');
assert.ok(html.indexOf('data-tech-level-row="1"') < html.indexOf('data-tech-level-row="10"'), '10级行不能被顶到1级行位置');
assert.ok(/\.tech-board\s*\{[^}]*grid-template-columns:\s*64px\s+minmax\(0,\s*1fr\)\s+240px/.test(css), '科技树布局应该是共享等级轴、普通科技主区、古代科技右侧栏');

console.log('科技树网页布局测试通过');
