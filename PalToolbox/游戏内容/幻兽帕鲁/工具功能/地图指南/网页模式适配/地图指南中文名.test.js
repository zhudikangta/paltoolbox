var assert = require('assert');
var fs = require('fs');
var path = require('path');

var webSource = fs.readFileSync(path.join(__dirname, '地图指南网页.js'), 'utf8');

assert.ok(/function normalizePalData\(data\)/.test(webSource), '地图指南需要同时接受数组和编号对象形式的帕鲁中文名数据');
assert.ok(/normalizePalData\(d\)\.forEach/.test(webSource), '地图指南建立中文名索引时必须使用归一化后的帕鲁数据');

console.log('地图指南中文名测试通过');
