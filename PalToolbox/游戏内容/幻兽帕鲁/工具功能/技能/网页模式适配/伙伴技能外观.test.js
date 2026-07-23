const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, '技能网页.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', '样式', '技能网页样式.css'), 'utf8');
const paldexCommonSource = fs.readFileSync(
    path.join(__dirname, '..', '..', '帕鲁图鉴', '通用逻辑', '帕鲁图鉴通用.js'),
    'utf8'
);

assert.ok(source.includes('getAppearanceSettings'), '伙伴技能必须读取帕鲁图鉴的外观设置');
assert.ok(source.includes('PT_buildCardVisualVars'), '伙伴技能必须复用全局卡片视觉解析器');
assert.ok(!paldexCommonSource.includes('getAppearanceCssVars'), '外观适配不应改造帕鲁图鉴通用模块');
assert.ok(source.includes('applyPartnerAppearanceVars'), '每次渲染后必须重新应用外观设置');
assert.ok(source.includes('var partnerShowDetails = false'), '伙伴技能的表格详情必须默认关闭');
assert.ok(source.includes('data-sk-partner-toggle-details'), '结果区上方必须提供展示详情按钮');
assert.ok(source.includes('partnerShowDetails &&'), '固定参数和星级表必须只在展示详情打开时渲染');
assert.ok(source.includes('animatePartnerFilterGroup'), '折叠分组展开时必须同步播放下拉动画和更新孔洞');
assert.ok(source.includes("toggleAttribute('inert'"), '收起的筛选分组不能留下可聚焦的隐藏按钮');

assert.ok(source.includes('applyPartnerSheetMasks'), '孔洞必须在内容生成后一次计算');
assert.ok(source.includes('.sk-partner-card-cell'), '右栏必须逐个读取伙伴技能槽位');
assert.ok(
    source.includes('.sk-partner-sidebar-block, .sk-partner-filter-group'),
    '左栏必须逐个读取搜索块和功能分类'
);
assert.ok(source.includes("querySelector('.sk-partner-filter-stack')"), '左栏孔洞必须挂在随内容滚动的容器');
assert.ok(source.includes("querySelector('.sk-partner-results-stack')"), '右栏孔洞必须挂在随卡片滚动的容器');
assert.ok(source.includes("'--sk-partner-sidebar-mask'"), '左栏必须使用独立的内容坐标孔洞');
assert.ok(source.includes("'--sk-partner-results-mask'"), '右栏必须使用独立的内容坐标孔洞');
assert.ok(!source.includes("root.addEventListener('scroll'"), '滚动时不得逐帧重算全部孔洞');
assert.ok(!source.includes('getBoundingClientRect()'), '孔洞不能在滚动时触发布局测量');
assert.ok(!source.includes('clipped ? 0 : 7'), '孔洞圆角不能在视口边缘被强制清零');

assert.ok(source.includes('renderPartnerDescription'), '伙伴技能说明必须按自然段渲染');
assert.ok(source.includes('sk-partner-card-wall'), '伙伴技能结果必须使用连续外框');
assert.ok(source.includes('sk-partner-card-grid'), '连续外框内必须保留响应式网格');
assert.ok(source.includes('sk-partner-card-cell'), '每张伙伴技能卡必须保留透明网格槽位');
assert.ok(source.includes('sk-partner-card'), '伙伴技能必须使用可调材质卡片');
assert.ok(source.includes('sk-partner-filter-stack'), '左栏必须有随内容滚动的孔洞层宿主');
assert.ok(source.includes('sk-partner-results-stack'), '右栏必须有随内容滚动的孔洞层宿主');
assert.ok(!source.includes('style="border-left:4px solid #8b5cf6"'), '卡片不能固定紫色边框');
assert.ok(!source.includes('calculatePartnerMasonryLayout'), '同行等高后不能残留最短列排布');
assert.ok(!source.includes('data-sk-partner-detail'), '外观对齐不能新增详情页入口');

assert.ok(/\.sk-partner-browser\{[^}]*--pd-frame-bg/.test(css), '浏览器本体必须承载左右连续底框');
assert.ok(!/\.sk-partner-browser::after\{[^}]*mask-image/.test(css), '不能保留固定在视口上的统一遮罩');
assert.ok(
    /\.sk-partner-filter-stack::after\{[^}]*mask-image:var\(--sk-partner-sidebar-mask/.test(css),
    '左栏孔洞层必须跟随左栏内容滚动'
);
assert.ok(
    /\.sk-partner-results-stack::after\{[^}]*mask-image:var\(--sk-partner-results-mask/.test(css),
    '右栏孔洞层必须跟随卡片内容滚动'
);
const sheetRule = css.match(/\.sk-partner-filter-stack::after,\s*\.sk-partner-results-stack::after\{([^}]*)\}/);
assert.ok(sheetRule, '左右内容孔洞层必须共用基础规则');
assert.ok(!sheetRule[1].includes('box-shadow'), '内容孔洞层不能重复绘制整块内阴影');
assert.ok(/\.sk-partner-card-wall\{[^}]*background:transparent/.test(css), '结果网格本体必须透明');
assert.ok(!/\.sk-partner-card-cell\{[^}]*--pd-frame-bg/.test(css), '单张卡片槽位不能拥有独立外框');
assert.ok(/\.sk-partner-card\{[^}]*--pd-cube-bg/.test(css), '卡片必须使用图鉴卡片外观变量');
assert.ok(/\.sk-partner-card\{[^}]*background:var\(--pd-cube-bg/.test(css), '纯色卡片背景必须正常显示');
assert.ok(/\.sk-partner-filter-sidebar\{[^}]*background:transparent/.test(css), '筛选栏本体必须透明');
assert.ok(!/\.sk-partner-filter-sidebar::before\{/.test(css), '筛选栏不能使用整栏挖空伪层');
assert.ok(/\.sk-partner-sidebar-block\{[^}]*--pd-cube-blur/.test(css), '筛选栏区块必须应用立方体材质');
assert.ok(/\.sk-partner-filter-group\{[^}]*--pd-cube-blur/.test(css), '筛选分组必须应用立方体材质');
assert.ok(/\.sk-partner-filter-group-collapse\{[^}]*grid-template-rows:0fr[^}]*transition:/.test(css), '折叠内容必须使用可动画的收起状态');
assert.ok(/\.sk-partner-filter-group--open \.sk-partner-filter-group-collapse\{[^}]*grid-template-rows:1fr/.test(css), '展开状态必须平滑打开完整内容');
assert.ok(/\.sk-partner-results-actions\{[^}]*display:flex/.test(css), '展示详情必须作为清楚可见的顶部操作');

assert.ok(/\.sk-partner-card-grid\{[^}]*display:grid[^}]*align-items:stretch/.test(css), '卡片必须同行等高');
assert.ok(/\.sk-partner-card-cell\{[^}]*position:relative[^}]*height:100%/.test(css), '槽位必须占满网格行');
assert.ok(/\.sk-partner-card\{[^}]*height:100%/.test(css), '卡片必须与同行槽位等高');
assert.ok(/\.sk-partner-card\{[^}]*margin-bottom:0/.test(css), '卡片必须清除通用底部外边距');

assert.ok(
    /\.sk-partner-filter-sidebar\{[^}]*padding-right:18px[^}]*scrollbar-width:none/.test(css),
    '筛选栏必须预留自绘滚动条位置并隐藏原生滚动条'
);
assert.ok(/\.sk-partner-filter-sidebar::-webkit-scrollbar\{[^}]*width:0/.test(css), '必须隐藏 Chromium 原生滚动条');
assert.ok(source.includes('PT_initCustomScrollbars'), '必须复用 Dock 自绘滚动条');
assert.ok(!source.includes('holeHeight'), '孔洞高度必须与卡片完全一致');
assert.ok(!css.includes('sk-partner-card--dragging'), '外观对齐不能复制图鉴抽拉动画');
assert.ok(!css.includes('!important'), '样式不能依靠 !important 覆盖旧实现');

console.log('伙伴技能外观测试通过');
