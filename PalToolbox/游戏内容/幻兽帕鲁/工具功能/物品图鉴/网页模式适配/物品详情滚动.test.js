var assert = require('assert');
var fs = require('fs');
var path = require('path');

var webSource = fs.readFileSync(path.join(__dirname, '物品图鉴网页.js'), 'utf8');
var styleSource = fs.readFileSync(path.join(__dirname, '..', '样式', '物品图鉴网页样式.css'), 'utf8');

assert.ok(/function renderDetail\(item\)[\s\S]*?pt-web-item-detail-page/.test(webSource), '物品详情页必须有独立标记，避免和列表页混用布局');
assert.ok(/\.pt-web-item-detail-page\s*>\s*\.pt-web-section\s*\{[^}]*overflow-y\s*:\s*auto/.test(styleSource), '物品详情内容区必须可以纵向滚动');
assert.ok(/\.pt-web-item-detail-page\s*>\s*\.pt-web-section\s*\{[^}]*min-height\s*:\s*0/.test(styleSource), '物品详情滚动区必须允许在固定页面高度内收缩');

console.log('物品详情滚动测试通过');
