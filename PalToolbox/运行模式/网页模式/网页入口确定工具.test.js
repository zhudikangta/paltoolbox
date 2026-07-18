const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const context = { window: { addEventListener: function() {} }, document: {} };
context.global = context;
vm.createContext(context);

const modeEntryPath = path.join(__dirname, '模式入口.js');
const indexPath = path.resolve(__dirname, '../../入口页面/index.html');
const rootPath = path.resolve(__dirname, '../..');

vm.runInContext(fs.readFileSync(modeEntryPath, 'utf8'), context, { filename: modeEntryPath });

const tools = context.window.PT_WEB_TOOLS || {};
const groups = context.window.PT_WEB_GROUPS || [];
const html = fs.readFileSync(indexPath, 'utf8');

assert.ok(!tools.skilldamage, '旧技能伤害不应该注册在网页工具表里');
assert.ok(!groups.some(function(group) {
    return (group.tools || []).indexOf('skilldamage') > -1;
}), '旧技能伤害不应该显示在任何侧边栏分组里');
assert.ok(!html.includes('工具功能/技能伤害/'), '入口页面不应该加载旧技能伤害资源');
assert.ok(!html.includes('数据包/配种数据.js'), '入口页面不应该加载旧配种数据');
assert.ok(!html.includes('数据包/技能数据.js'), '入口页面不应该加载旧技能数据');
assert.strictEqual(tools.tech && tools.tech.displayModule, 'PT_TECH_WEB', '科技树应该连接新版科技树网页模块');
assert.ok(html.includes('工具功能/科技树/核心/科技树核心.js'), '入口页面应该加载科技树核心');
assert.ok(html.includes('工具功能/科技树/网页模式适配/科技树网页.js'), '入口页面应该加载科技树网页适配');
assert.ok(html.includes('工具功能/科技树/样式/科技树网页样式.css'), '入口页面应该加载科技树样式');
assert.ok(fs.existsSync(path.join(rootPath, '游戏内容/幻兽帕鲁1.0/数据包/配种.json')), '新版配种数据必须存在');
assert.ok(fs.existsSync(path.join(rootPath, '游戏内容/幻兽帕鲁1.0/数据包/科技.json')), '新版科技数据必须存在');

console.log('网页入口确定工具测试通过');
