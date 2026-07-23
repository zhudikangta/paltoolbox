const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, '帕鲁图鉴网页.js'), 'utf8');
assert.ok(source.includes('detail.skillName'), '图鉴详情应优先使用按帕鲁 id 取得的标准技能名');
assert.ok(source.includes('detail.description'), '图鉴详情应使用按帕鲁 id 取得的完整描述');
assert.ok(source.includes('renderPartnerRankTable'), '图鉴详情必须使用共用等级表并显示全部参数');
assert.ok(source.includes('renderPartnerFixedParameters'), '图鉴详情必须显示主动伙伴技能的固定冷却和持续时间');
assert.ok(!source.includes('detail.descriptionStatus'), '图鉴详情不应把内部核对状态显示给玩家');
assert.ok(source.includes('无伙伴技能'), '图鉴详情必须明确显示没有伙伴技能的记录');
assert.ok(source.includes("partnerDetail.hasPartnerSkill === false ? '无伙伴技能'"), '图鉴详情页头也必须显示“无伙伴技能”，不能显示占位符');

console.log('图鉴伙伴技能详情读取测试通过');
