var PT_CAPTURE_WEB = (function() {
function getCore(){return(typeof window!=='undefined'&&window.PT_CAPTURE_CORE)?window.PT_CAPTURE_CORE:null;}
function render(){
    var core=getCore();if(!core)return'<div class="pt-web-tool-page pt-web-page--bounded"><p>数据未加载</p></div>';
    var balls=core.BALL_OPTIONS.map(function(b,i){return'<option value="'+b.v+'"'+(b.v===2?' selected':'')+'>'+b.label+'</option>';}).join('');
    var statuses=core.STATUS_OPTIONS.map(function(s){return'<option value="'+s.v+'">'+s.label+'</option>';}).join('');
    return'<div class="pt-web-tool-page pt-web-page--bounded pt-web-capture-page">'+
        '<header class="pt-web-tool-heading"><div><span class="pt-web-tool-kicker">计算 / 捕获</span><h1>捕获概率</h1></div></header>'+
        '<section class="pt-web-section"><div class="cp-form">'+
        '<label class="cp-field"><span>目标剩余血量(%)</span><input type="range" class="cp-range" min="1" max="99" value="20" data-cap-hp><input type="number" class="pt-input cp-number" min="1" max="99" value="20" data-cap-hp-num></label>'+
        '<label class="cp-field"><span>帕鲁球</span><select class="pt-select" data-cap-ball>'+balls+'</select></label>'+
        '<label class="cp-field"><span>状态加成</span><select class="pt-select" data-cap-status>'+statuses+'</select></label>'+
        '<label class="cp-field"><span>背袭加成</span><input type="number" class="pt-input" value="1.2" step="0.1" min="1" max="2" data-cap-back></label>'+
        '</div>'+
        '<div class="cp-result"><span class="cp-result-label">估算捕获率</span><strong class="cp-result-value" data-cap-result>52%</strong></div>'+
        '<div class="cp-tips">'+
        '<div class="cp-tip"><strong>技巧提示</strong><p>先压血再控场，稀有目标优先高级球，背袭收益明显。</p></div>'+
        '<div class="cp-tip"><strong>公式</strong><p>(100 - 血量%) × 0.42 × 球倍率 × 状态 × 背袭 ÷ 2</p></div>'+
        '</div></section></div>';
}
function bind(root){
    if(!root)return;
    var core=getCore();if(!core)return;
    function update(){
        var hp=parseFloat(root.querySelector('[data-cap-hp]').value)||20;
        var ball=parseFloat(root.querySelector('[data-cap-ball]').value)||2;
        var status=parseFloat(root.querySelector('[data-cap-status]').value)||1;
        var back=parseFloat(root.querySelector('[data-cap-back]').value)||1.2;
        var result=core.calculate(hp,ball,status,back);
        root.querySelector('[data-cap-result]').textContent=result.toFixed(1)+'%';
    }
    root.querySelector('[data-cap-hp]').addEventListener('input',function(){root.querySelector('[data-cap-hp-num]').value=this.value;update();});
    root.querySelector('[data-cap-hp-num]').addEventListener('input',function(){root.querySelector('[data-cap-hp]').value=this.value;update();});
    root.querySelector('[data-cap-ball]').addEventListener('change',update);
    root.querySelector('[data-cap-status]').addEventListener('change',update);
    root.querySelector('[data-cap-back]').addEventListener('input',update);
    update();
}
return{render:render,bind:bind};
})();
if(typeof window!=='undefined')window.PT_CAPTURE_WEB=PT_CAPTURE_WEB;
