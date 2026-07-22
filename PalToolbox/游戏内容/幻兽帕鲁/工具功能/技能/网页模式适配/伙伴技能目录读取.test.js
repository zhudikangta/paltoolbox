const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, '技能网页.js'), 'utf8');
assert.ok(source.includes('.catalog'), '伙伴技能页必须读取生成目录');
assert.ok(!source.includes('partnerData = (results[0] && results[0].partnerSkills)'), '伙伴技能页不应再直接遍历图鉴全量事实');
assert.ok(source.includes('partnerCatalogIds.slice()'), '伙伴技能页应保留生成目录的六大分类和泰拉瑞亚末尾顺序');

console.log('伙伴技能目录读取测试通过');
