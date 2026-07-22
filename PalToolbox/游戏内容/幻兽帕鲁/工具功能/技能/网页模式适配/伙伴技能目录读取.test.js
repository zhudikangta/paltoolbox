const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, '技能网页.js'), 'utf8');
assert.ok(source.includes('.catalog'), '伙伴技能页必须读取生成目录');
assert.ok(!source.includes('partnerData = (results[0] && results[0].partnerSkills)'), '伙伴技能页不应再直接遍历图鉴全量事实');
assert.ok(source.includes('partnerCatalogIds.slice()'), '伙伴技能页应保留生成目录的六大分类和泰拉瑞亚末尾顺序');
assert.ok(source.includes("var PARTNER_CATEGORIES = ['普通帕鲁', '石板Boss', '塔主Boss', 'Boss', '狂暴化', '其他'];"), '伙伴技能页应该定义六个并列分类');
assert.ok(source.includes('data-sk-partner-category'), '伙伴技能页应该渲染可点击的分类按钮');
assert.ok(source.includes('p.catalogCategory === partnerCategory'), '伙伴技能页应该按目录分类字段筛选卡片');
assert.ok(source.includes("closest('[data-sk-partner-category]')"), '伙伴技能页应该响应六项分类按钮');

console.log('伙伴技能目录读取测试通过');
