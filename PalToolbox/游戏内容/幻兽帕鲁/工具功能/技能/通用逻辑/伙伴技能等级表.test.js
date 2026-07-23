const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '技能通用.js'), 'utf8'), context);
const common = context.window.PT_SKILL_COMMON;

const stars = common.renderPartnerRankTable({
    type: 'stars',
    rankLabel: '星级',
    columns: [
        { key: 'cooldown', label: '冷却时间', unit: '秒' },
        { key: 'duration', label: '持续时间', unit: '秒' }
    ],
    rows: [
        { rank: 0, values: [30, 10] },
        { rank: 4, values: [8, 20] }
    ]
});
assert.ok(stars.includes('0★') && stars.includes('4★'), '普通等级表必须显示 0~4 星');
assert.ok(stars.includes('冷却时间（秒）') && stars.includes('持续时间（秒）'), '每个参数列必须说明含义和单位');

const levels = common.renderPartnerRankTable({
    type: 'levels',
    rankLabel: '等级',
    columns: [{ key: 'quantity', label: '数量', unit: '' }],
    rows: [{ rank: 1, values: ['1'] }, { rank: 10, values: ['3–10'] }]
});
assert.ok(levels.includes('1级') && levels.includes('10级'), '放牧等级表必须显示 1~10 级');
assert.ok(!levels.includes('数量--'), '没有单位的列名后面不应出现占位符');

const allTables = common.renderPartnerRankTables([
    {
        type: 'stars', rankLabel: '星级',
        columns: [{ key: 'work', label: '工作速度提升', unit: '%' }],
        rows: [{ rank: 0, values: [100] }]
    },
    {
        type: 'levels', rankLabel: '等级',
        columns: [{ key: 'item', label: '产物', unit: '' }],
        rows: [{ rank: 10, values: ['毒腺'] }]
    }
]);
assert.ok(allTables.includes('工作速度提升（%）') && allTables.includes('产物'), '同一伙伴技能的多张等级表必须全部渲染');

const fixedTiming = common.renderPartnerFixedParameters({
    coolDown: 120,
    duration: 10,
    rankTable: {
        type: 'stars', rankLabel: '星级',
        columns: [{ key: 'attack', label: '伙伴技能攻击系数', unit: '' }],
        rows: [{ rank: 0, values: [20] }]
    }
});
assert.ok(fixedTiming.includes('冷却时间（秒）') && fixedTiming.includes('>120<'), '猴急步枪等主动技能必须显示固定冷却时间');
assert.ok(fixedTiming.includes('持续时间（秒）') && fixedTiming.includes('>10<'), '主动技能必须显示固定持续时间');

const overriddenTiming = common.renderPartnerFixedParameters({
    coolDown: 5,
    duration: 30,
    rankTable: {
        type: 'stars', rankLabel: '星级',
        columns: [
            { key: 'cooldown', label: '冷却时间', unit: '秒' },
            { key: 'duration', label: '持续时间', unit: '秒' }
        ],
        rows: [{ rank: 0, values: [30, 10] }]
    }
});
assert.strictEqual(overriddenTiming, '', '已有逐星冷却和持续时间时不能再显示冲突的固定参数');

console.log('伙伴技能等级表测试通过');
