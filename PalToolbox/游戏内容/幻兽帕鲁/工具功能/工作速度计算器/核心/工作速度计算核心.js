var PT_WORK_SPEED_CORE = (function() {
var PT_WORK_SPEED_DATA = (typeof window !== 'undefined' && window.PT_WORK_SPEED_DATA)
    ? window.PT_WORK_SPEED_DATA
    : require('../../../数据包/工作速度计算器数据.js').PT_WORK_SPEED_DATA;

function round10(value) {
    return Math.round(value * 1e10) / 1e10;
}

function ceilStable(value) {
    return Math.ceil(value - 1e-12);
}

function calculateActualSpeed(input) {
    return round10(
        70 *
        (1 + input.tcBonus / 100 + input.researchBonus / 100) *
        (1 + input.soulBonus / 100) *
        (1 + input.monitorBonus) *
        (1 + (input.betaBonus ? 0.1 : 0)) *
        (1 + (input.buildingBonus ? 0.2 : 0)) *
        (1 + input.foodBonus / 100)
    );
}

function getFacilityOptions(workType, sourceData) {
    const usedData = sourceData || PT_WORK_SPEED_DATA;
    const facilities = usedData.facilities[workType] || {};
    return Object.keys(facilities).map((name) => ({
        name,
        factor: facilities[name].factor,
        workload: facilities[name].workload,
        cat: facilities[name].cat || null
    }));
}

function calculate(input, sourceData) {
    const usedData = sourceData || PT_WORK_SPEED_DATA;
    const facility = (((usedData.facilities || {})[input.workType] || {})[input.facilityName]) || { factor: 1 };
    const factors = usedData.levelFactors[input.workType] || usedData.levelFactors.handcraft;
    const levelIndex = Math.min(Math.max(Math.floor(input.workLevel), 1), 5) - 1;
    const levelFactor = factors[levelIndex];
    const actualSpeed = calculateActualSpeed(input);
    const theoreticalSpeed = round10((input.palCount * (levelFactor * facility.factor) / 70) * actualSpeed);
    const theoreticalTime = round10(input.workload / theoreticalSpeed);
    const rounds = ceilStable(theoreticalTime * input.fps);
    const actualTime = round10(rounds / input.fps);
    const errorSeconds = round10(actualTime - theoreticalTime);
    const errorPercent = theoreticalTime > 0 ? round10((actualTime - theoreticalTime) / theoreticalTime * 100) : 0;

    return {
        actualSpeed,
        theoreticalSpeed,
        theoreticalTime,
        actualTime,
        rounds,
        errorSeconds,
        errorPercent
    };
}

function calculateCeiling(workload, fps) {
    return round10(workload * fps);
}

return { calculate, calculateCeiling, getFacilityOptions };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PT_WORK_SPEED_CORE: PT_WORK_SPEED_CORE
    };
}

if (typeof window !== 'undefined') {
    window.PT_WORK_SPEED_CORE = PT_WORK_SPEED_CORE;
}
