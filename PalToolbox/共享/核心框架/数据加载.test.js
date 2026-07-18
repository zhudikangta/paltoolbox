const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

async function loadLoader() {
    const calls = [];
    const context = {
        window: {
            fetch: async function(url) {
                calls.push(url);
                return {
                    ok: true,
                    json: async function() { return { url: url, count: calls.length }; }
                };
            }
        },
        Promise: Promise
    };
    context.global = context;
    vm.createContext(context);
    const file = path.join(__dirname, '数据加载.js');
    vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
    return { loader: context.window.PT_DATA_LOADER, calls: calls };
}

(async function() {
    const loaded = await loadLoader();
    const first = await loaded.loader.loadJson('data/a.json');
    const second = await loaded.loader.loadJson('data/a.json');

    assert.strictEqual(first.url, 'data/a.json');
    assert.strictEqual(second.url, 'data/a.json');
    assert.strictEqual(loaded.calls.length, 1);
    const cached = await loaded.loader.getCached('data/a.json');
    assert.strictEqual(cached.url, 'data/a.json');

    console.log('数据加载测试通过');
})();
