const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, '帕鲁图鉴网页.js'), 'utf8');
assert.ok(source.includes('detail.skillName'), '图鉴详情应优先使用按帕鲁 id 取得的标准技能名');
assert.ok(source.includes('detail.description'), '图鉴详情应使用按帕鲁 id 取得的完整描述');

console.log('图鉴伙伴技能详情读取测试通过');
