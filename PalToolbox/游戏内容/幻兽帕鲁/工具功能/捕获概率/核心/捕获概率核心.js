var PT_CAPTURE_CORE = (function() {
function calculate(hpPercent, ballBonus, statusBonus, backBonus) {
    var rate = Math.max(1, Math.min(98, (100 - hpPercent) * 0.42 * ballBonus * statusBonus * backBonus / 2));
    return rate;
}
var BALL_OPTIONS = [{v:1,label:'普通帕鲁球'},{v:1.5,label:'优级帕鲁球'},{v:2,label:'特级帕鲁球'},{v:2.5,label:'大师帕鲁球'},{v:3,label:'传奇球'}];
var STATUS_OPTIONS = [{v:1,label:'无状态'},{v:1.25,label:'冻结/麻痹'},{v:1.1,label:'中毒/燃烧'}];
return {calculate:calculate,BALL_OPTIONS:BALL_OPTIONS,STATUS_OPTIONS:STATUS_OPTIONS};
})();
if(typeof window!=='undefined')window.PT_CAPTURE_CORE=PT_CAPTURE_CORE;
