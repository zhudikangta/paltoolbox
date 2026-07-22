var PT_WORK_SPEED_DATA = {
    levelFactors: {
        fire: [0.7, 2, 6, 18, 54],
        handcraft: [0.7, 2, 6, 18, 54],
        medicine: [0.7, 2, 6, 18, 54],
        water: [0.7, 1.5, 3, 5, 10],
        wood: [0.7, 1.5, 3, 5, 10],
        mine: [0.7, 1.5, 3, 5, 10],
        cool: [0.7, 1.5, 3, 5, 10],
        elec: [2.5, 5, 10, 20, 40],
        oil: [0.7, 1.5, 3, 5, 10]
    },
    facilities: {
        handcraft: {
            '原始作业台': { factor: 1, workload: null, cat: '作业' },
            '优质作业台': { factor: 1.5, workload: null, cat: '作业' },
            '作业流水线工厂': { factor: 2, workload: null, cat: '作业' },
            '作业流水线工厂Ⅱ': { factor: 4, workload: null, cat: '作业' },
            '高等文明作业工厂': { factor: 6, workload: null, cat: '作业' },
            '帕鲁球制作台': { factor: 1.5, workload: null, cat: '帕鲁球' },
            '帕鲁球流水线工厂': { factor: 2, workload: null, cat: '帕鲁球' },
            '帕鲁球流水线工厂Ⅱ': { factor: 4, workload: null, cat: '帕鲁球' },
            '高等文明帕鲁球工厂': { factor: 6, workload: null, cat: '帕鲁球' },
            '武器制作台': { factor: 1.5, workload: null, cat: '武器' },
            '武器流水线工厂': { factor: 2, workload: null, cat: '武器' },
            '武器流水线工厂Ⅱ': { factor: 4, workload: null, cat: '武器' },
            '高等文明武器工厂': { factor: 6, workload: null, cat: '武器' },
            '修理台': { factor: 1, workload: null, cat: '其他' },
            '帕鲁装置制作台': { factor: 1, workload: null, cat: '其他' },
            '制图桌': { factor: 1, workload: null, cat: '其他' },
            '金币制造工厂': { factor: 2, workload: null, cat: '其他' }
        },
        medicine: {
            '中世纪制药台': { factor: 1, workload: null },
            '电气制药台': { factor: 2, workload: null },
            '高等文明制药台': { factor: 3, workload: null }
        },
        fire: {
            '篝火': { factor: 1, workload: null },
            '料理锅': { factor: 1.5, workload: null },
            '电气厨房': { factor: 3, workload: null },
            '大型厨房': { factor: 4.5, workload: null },
            '原始炉子': { factor: 1, workload: null },
            '改良炉子': { factor: 1.5, workload: null },
            '电气炉': { factor: 3, workload: null },
            '巨大熔炉': { factor: 4.5, workload: null }
        },
        water: {
            '浇水粉碎机': { factor: 1, workload: null },
            '冷却粉碎机': { factor: 2, workload: null },
            '磨粉机': { factor: 1, workload: null }
        },
        wood: {
            '伐木场': { factor: 1, workload: 8 }
        },
        mine: {
            '采石场': { factor: 1, workload: 8 },
            '金属矿场': { factor: 1, workload: 80 },
            '金属矿场Ⅱ': { factor: 1, workload: 16 },
            '煤矿场': { factor: 1, workload: 80 },
            '硫磺矿场': { factor: 1, workload: 80 },
            '纯水晶矿场': { factor: 1, workload: 100 },
            '六棱晶矿场': { factor: 1, workload: 200 }
        },
        cool: {
            '浇水粉碎机': { factor: 1, workload: null },
            '冷却粉碎机': { factor: 2, workload: null },
            '磨粉机': { factor: 1, workload: null }
        },
        elec: {
            '发电机': { factor: 1, workload: 2500 },
            '大型发电机': { factor: 3, workload: 10000 }
        },
        oil: {
            '原油提炼机': { factor: 1, workload: 4000 }
        }
    },
    monitorOptions: [
        { value: -0.3, label: '轻松（-30%）' },
        { value: 0, label: '普通（0%）' },
        { value: 0.25, label: '繁重（+25%）' },
        { value: 0.5, label: '非常繁重（+50%）' }
    ],
    workTypeOptions: [
        { value: 'handcraft', label: '手工' },
        { value: 'medicine', label: '制药' },
        { value: 'fire', label: '生火' },
        { value: 'water', label: '浇水' },
        { value: 'wood', label: '伐木' },
        { value: 'mine', label: '采矿' },
        { value: 'cool', label: '冷却' },
        { value: 'elec', label: '发电' },
        { value: 'oil', label: '原油提炼' }
    ]
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PT_WORK_SPEED_DATA: PT_WORK_SPEED_DATA };
}

if (typeof window !== 'undefined') {
    window.PT_WORK_SPEED_DATA = PT_WORK_SPEED_DATA;
}
