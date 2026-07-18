const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const context = {
    window: {
        PT_DATA_LOADER: {
            loadJson: function() { return Promise.resolve({}); }
        },
        PT_BREEDING_CORE: {
            setPalData: function() {},
            setBreedingData: function() {},
            getPals: function() { return [{ id: 'A', name: '父一' }, { id: 'B', name: '父二' }, { id: 'C', name: '子代' }]; },
            getBreedingRows: function() { return [{ parentAId: 'A', parentBId: 'B', childId: 'C' }]; },
            getSpecialPairs: function() { return [{ id: '1', parentAId: 'A', parentBId: 'B', childId: 'C' }]; },
            getPal: function(id) {
                var map = { A: { name: '父一' }, B: { name: '父二' }, C: { name: '子代' } };
                return map[id] || { name: id };
            },
            getPalIconHtml: function() { return '<span class="br-icon-missing">?</span>'; },
            searchPals: function() { return []; }
        }
    },
    document: { getElementById: function() { return null; } }
};
context.global = context;
vm.createContext(context);
const webSource = fs.readFileSync(path.join(__dirname, '配种查询网页.js'), 'utf8');
vm.runInContext(webSource, context);

assert.ok(webSource.includes('查父母'), '配种查询应该保留查父母模式');
assert.ok(webSource.includes('查子代'), '配种查询应该保留查子代模式');
assert.ok(webSource.includes('特例列表'), '配种查询应该提供特例列表');
assert.ok(!webSource.includes('路径规划'), '配种查询不应该保留配种优化路径规划');
assert.ok(!webSource.includes('热门路线'), '配种查询不应该保留热门路线');

assert.ok(webSource.includes('findChildrenByParent'), '查子代选定一方亲代后应该展示全部组合结果');
assert.ok(webSource.includes('closeDropdownsWithoutRerender'), '框外关闭候选列表时不应该重画输入框，避免拖选文字丢失');
assert.ok(!webSource.includes('state.childDropdown = [];\n                rerender();'), '框外关闭候选列表不应该重画整个配种界面');

console.log('配种查询网页测试通过');
