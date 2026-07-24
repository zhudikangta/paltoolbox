const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, '技能网页.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', '样式', '技能网页样式.css'), 'utf8');
const paldexCommonSource = fs.readFileSync(
    path.join(__dirname, '..', '..', '帕鲁图鉴', '通用逻辑', '帕鲁图鉴通用.js'),
    'utf8'
);

assert.ok(source.includes('PT_getLayeredCardAppearanceSettings'), '伙伴技能必须复用统一的大卡片/小卡片分层解析');
assert.ok(source.includes('PT_buildCardVisualVars'), '伙伴技能必须复用全局卡片视觉解析器');
assert.ok(source.includes("'--pd-frame-glass-glow'"), '伙伴技能大卡片必须使用材质自身的玻璃辉光');
assert.ok(!paldexCommonSource.includes('getAppearanceCssVars'), '外观适配不应改造帕鲁图鉴通用模块');
assert.ok(source.includes('applyPartnerAppearanceVars'), '每次渲染后必须重新应用外观设置');
assert.ok(source.includes('var partnerShowDetails = false'), '伙伴技能的表格详情必须默认关闭');
assert.ok(source.includes('data-sk-partner-toggle-details'), '结果区上方必须提供展示详情按钮');
assert.ok(source.includes('partnerShowDetails &&'), '固定参数和星级表必须只在展示详情打开时渲染');
assert.ok(source.includes('animatePartnerFilterGroup'), '折叠分组展开时必须同步播放下拉动画和更新孔洞');
assert.ok(source.includes("toggleAttribute('inert'"), '收起的筛选分组不能留下可聚焦的隐藏按钮');
assert.ok(source.includes('var partnerExpandedGroups = {}'), '伙伴技能首次打开时所有用途分组都应该收起');
assert.ok(!source.includes('partnerExpandedGroups = { move: true }'), '移动与骑乘不能再被代码强制默认展开');
assert.ok(source.includes('getPartnerFacetGroupCounts'), '折叠大类必须读取按帕鲁去重的动态总数');
assert.ok(source.includes('sk-partner-filter-group-count'), '折叠大类标题必须始终渲染总数');
assert.ok(
    source.includes("var expanded = !!filterNeedle || hasSelection || partnerExpandedGroups[group.id] === true;"),
    '筛选后数量为 0 不能覆盖用户已经展开的大类状态'
);
assert.ok(
    !source.includes('var expanded = !groupEmpty &&'),
    '大类展开状态不能被当前结果数量强制收起'
);
assert.ok(
    !source.includes("aria-disabled=\"' + (groupEmpty ? 'true' : 'false')"),
    '数量为 0 的大类仍必须允许点击加减号展开或收起'
);
assert.ok(
    !source.includes('if (partnerGroupToggle.disabled) return;'),
    '大类标题不能因当前数量为 0 而跳过折叠操作'
);
assert.ok(source.includes('var optionEmpty = count === 0 && !active;'), '零条子项必须具有明确的不可选状态');
assert.ok(source.includes("(optionEmpty ? ' disabled' : '')"), '零条子项必须使用原生禁用状态阻止点击');

assert.ok(source.includes('applyPartnerFrameMask'), '唯一大底板必须直接挂在最外层框内');
assert.ok(source.includes('sk-partner-frame-holes'), '唯一大底板必须使用全框孔洞遮罩');
assert.ok(source.includes('.sk-partner-card-cell'), '右栏必须逐个读取伙伴技能槽位');
assert.ok(
    !source.includes('partner-sidebar-clip'),
    '筛选区移除独立底板后，不能再生成左栏孔洞遮罩'
);
assert.ok(source.includes("querySelector('.sk-partner-results')"), '右侧孔洞必须以右侧滚动区为坐标来源');
assert.ok(source.includes('sk-partner-frame-mask-svg'), '最底层大卡片必须保存一个持久的内联 SVG 遮罩');
assert.ok(source.includes('data-sk-partner-mask-scroll-group="results"'), '右侧卡片滚动时必须只平移已有的结果孔洞');
assert.ok(source.includes('schedulePartnerFrameMaskScroll'), '右侧滚动必须单独调度孔洞平移');
assert.ok(source.includes("results.addEventListener('scroll'"), '只能在右侧展示区滚动时同步结果孔洞');
assert.ok(!source.includes('getBoundingClientRect()'), '孔洞生成不能触发布局测量');
assert.ok(!source.includes('clipped ? 0 : 7'), '孔洞圆角不能在视口边缘被强制清零');

assert.ok(source.includes('getPartnerEffectBlockModels'), '卡片必须读取效果块显示模型');
assert.ok(source.includes('renderPartnerEffectBlocks'), '卡片必须按效果块渲染标签和完整描述');
assert.ok(source.includes('sk-partner-effect-block'), '卡片必须为每个独立效果渲染效果块');
assert.ok(source.includes("return '<div class=\"sk-partner-effect-block'"), '无标题效果块必须使用语义中性的 div');
assert.ok(!source.includes("return '<section class=\"sk-partner-effect-block'"), '效果块不是命名章节，不能使用无标题 section');
assert.ok(source.includes('sk-partner-effect-block--highlighted'), '筛选命中必须落在对应效果块');
assert.ok(source.includes('sk-tag--partner-selected'), '命中的具体标签必须高亮');
assert.ok(source.includes('sk-partner-technology'), '科技等级必须使用独立于描述正文的显示区域');
assert.ok(!source.includes('renderPartnerDescription(desc)'), '卡片不能继续按描述换行机械分段');
assert.ok(!source.includes('classificationTags +'), '卡片顶部不能继续统一堆放分类标签');
assert.ok(source.includes('sk-partner-card-wall'), '伙伴技能结果必须使用连续外框');
assert.ok(source.includes('sk-partner-card-grid'), '连续外框内必须保留响应式网格');
assert.ok(source.includes('sk-partner-card-cell'), '每张伙伴技能卡必须保留透明网格槽位');
assert.ok(source.includes('sk-partner-card'), '伙伴技能必须使用可调材质卡片');
assert.ok(!/sk-partner-pal-row[^\n]+<span class="sk-id">/.test(source), '伙伴技能卡右上角不能显示英文内部编号');
assert.ok(source.includes('sk-partner-filter-stack'), '左栏必须保留内容布局宿主');
assert.ok(source.includes('sk-partner-results-stack'), '右栏必须保留内容布局宿主');
assert.ok(!source.includes('style="border-left:4px solid #8b5cf6"'), '卡片不能固定紫色边框');
assert.ok(!source.includes('calculatePartnerMasonryLayout'), '同行等高后不能残留最短列排布');
assert.ok(!source.includes('data-sk-partner-detail'), '外观对齐不能新增详情页入口');
assert.ok(source.includes('sk-partner-card-id'), '伙伴技能卡片必须使用独立的图鉴编号显示位');
assert.ok(source.includes("p.displayId ? '<span class=\"sk-partner-card-id\">#' + p.displayId"), '编号显示必须与帕鲁图鉴一样使用 # 加显示编号');
assert.ok(!source.includes('无编号'), '无编号帕鲁不应显示额外占位文字');
assert.ok(source.includes('class="sk-partner-card sk-partner-no-results"'), '无结果提示必须复用伙伴技能小卡片材质');
assert.ok(!source.includes('getPartnerVisibleTagLabels'), '卡片不能再从整张卡片统一读取全部可见标签');
assert.ok(source.includes('getPartnerSourceCategories'), '来源按钮必须由实际目录分类生成，不能继续显示空分类');
assert.ok(
    source.indexOf('effectBlocksHtml +') < source.indexOf('fixedParameterHtml + rankTableHtml'),
    '详情表格必须继续位于所有效果块之后'
);
assert.ok(source.includes('renderPartnerResearchTables(p.researchTables)'), '本人实测的固定表必须在展示详情打开时一并渲染');

assert.ok(
    /\.sk-partner-browser\{[^}]*background:transparent[^}]*isolation:isolate/.test(css),
    '最外层容器必须透明并建立唯一大卡片的绘制层'
);
assert.ok(
    /\.sk-partner-browser::before\{[^}]*--pd-frame-bg[^}]*backdrop-filter:blur\(var\(--pd-frame-bug-blur/.test(css),
    '贯穿全框的大底板必须复用大卡片材质和底层防 bug 模糊度'
);
assert.ok(/\.sk-partner-frame-mask-svg\{[^}]*width:0[^}]*height:0/.test(css), '持久 SVG 只能保存遮罩定义，不能占用页面布局');
assert.ok(!/\.sk-partner-browser\{[^}]*inset 0 -10px 22px/.test(css), '伙伴技能大卡片不能额外叠加固定黑色内阴影');
assert.ok(!/\.sk-partner-browser\{[^}]*0 12px 34px rgba\(0,0,0/.test(css), '伙伴技能大卡片不能额外叠加固定黑色外阴影');
assert.ok(/\.sk-partner-browser::before\{[^}]*sk-partner-frame-holes/.test(css), '大底板必须在最外层框内挖结果区孔洞');
assert.ok(/\.sk-partner-browser::before\{[^}]*inset:0/.test(css), '大底板必须贴满最外层框的四边');
assert.ok(!/\.sk-partner-filter-stack::before\{/.test(css), '筛选区不能保留独立底板');
assert.ok(!/\.sk-partner-results-stack::before\{/.test(css), '结果区不能再保留会被滚动容器裁掉的底板');
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
assert.ok(/\.sk-partner-filter-group-count\{[^}]*font-variant-numeric:tabular-nums/.test(css), '折叠大类总数必须使用稳定宽度的数字样式');
assert.ok(/\.sk-partner-filter-group--empty \.sk-partner-filter-group-toggle\{[^}]*cursor:pointer/.test(css), '零条大类的加减号必须保持可点击');
assert.ok(/\.sk-partner-facet-option--empty\{[^}]*background:transparent[^}]*cursor:default/.test(css), '零条子项必须半透明且不可点击，而不是保留深色按钮底');
assert.ok(/\.sk-partner-results-actions\{[^}]*display:flex/.test(css), '展示详情必须作为清楚可见的顶部操作');

assert.ok(/\.sk-partner-card-grid\{[^}]*display:grid[^}]*align-items:stretch/.test(css), '卡片必须同行等高');
assert.ok(/\.sk-partner-card-cell\{[^}]*position:relative[^}]*height:100%/.test(css), '槽位必须占满网格行');
assert.ok(/\.sk-partner-card\{[^}]*height:100%/.test(css), '卡片必须与同行槽位等高');
assert.ok(/\.sk-partner-card\{[^}]*margin-bottom:0/.test(css), '卡片必须清除通用底部外边距');
assert.ok(/\.sk-partner-card-id\{[^}]*font-size:11px[^}]*color:var\(--pt-text-sub/.test(css), '伙伴技能编号必须沿用帕鲁图鉴的弱化编号样式');
assert.ok(/\.sk-partner-no-results\{[^}]*background-color:var\(--pd-cube-bg/.test(css), '无结果卡片必须使用背景色而不是覆盖小卡片纹理的 background 简写');
assert.ok(
    /\.sk-partner-effect-block\+\.sk-partner-effect-block\{[^}]*border-top/.test(css),
    '分割线只能位于两个独立效果块之间'
);
assert.ok(
    /\.sk-partner-technology\{[^}]*border-top/.test(css),
    '科技等级上方必须恢复独立分割线'
);
assert.ok(
    /\.sk-partner-effect-block--highlighted\{[^}]*--pt-input-accent/.test(css),
    '命中效果块必须使用当前主题强调色'
);
assert.ok(
    /\.sk-tag--partner-selected\{[^}]*--pt-input-accent/.test(css),
    '命中的具体标签必须使用当前主题强调色'
);

assert.ok(
    /\.sk-partner-filter-sidebar\{[^}]*padding:8px 18px 8px 8px[^}]*scrollbar-width:none/.test(css),
    '筛选栏必须保留原有内边距和自绘滚动条预留区'
);
assert.ok(
    /\.sk-partner-results\{[^}]*padding:8px 8px 12px/.test(css),
    '结果区必须保留原有内边距，视觉位置不能变化'
);
assert.ok(/\.sk-partner-filter-sidebar::-webkit-scrollbar\{[^}]*width:0/.test(css), '必须隐藏 Chromium 原生滚动条');
assert.ok(source.includes('PT_initCustomScrollbars'), '必须复用 Dock 自绘滚动条');
assert.ok(source.includes('sk-partner-filter-scrollbar'), '筛选栏自绘滚动条必须使用伙伴技能专用定位类');
assert.ok(source.includes('sidebarScrollTop'), '重新筛选前必须保存左侧筛选栏的滚动位置');
assert.ok(source.includes('nextSidebar.scrollTop = sidebarScrollTop'), '重新渲染后必须恢复左侧筛选栏的滚动位置');
assert.ok(source.includes('sk-partner-browser-divider'), '筛选区与结果区之间必须渲染独立分割线');
assert.ok(!source.includes('sk-partner-filter-summary'), '结果区不应继续渲染冗余的筛选规则提示');
assert.ok(!source.includes('选择多个条件时，所选条件必须全部满足。'), '未选择条件时不应显示冗余提示');
assert.ok(!source.includes('当前查找：'), '选择条件后不应显示“当前查找”提示');
assert.ok(/\.sk-partner-filter-scrollbar\{[^}]*translateX\(-6px\)/.test(css), '筛选栏自绘滚动条必须向左移动 6px');
assert.ok(/\.sk-partner-browser-divider\{[^}]*width:1px[^}]*background:/.test(css), '左右区域之间必须绘制 1px 分割线');
assert.ok(/@media \(max-width:900px\)\{[\s\S]*?\.sk-partner-browser-divider\{[^}]*display:none/.test(css), '窄屏单列模式必须隐藏左右分割线');
assert.ok(!css.includes('.sk-partner-filter-summary'), '冗余提示删除后必须同步删除废弃样式');
assert.ok(!source.includes('holeHeight'), '孔洞高度必须与卡片完全一致');
assert.ok(!css.includes('sk-partner-card--dragging'), '外观对齐不能复制图鉴抽拉动画');
assert.ok(!css.includes('!important'), '样式不能依靠 !important 覆盖旧实现');

assert.ok(/\.pt-partner-rank-table--measured\{[^}]*table-layout:fixed/.test(css), '实测数据表必须固定列宽，不能撑破伙伴技能卡片');
assert.ok(/\.pt-partner-rank-table--measured th,\.pt-partner-rank-table--measured td\{[^}]*white-space:normal/.test(css), '实测数据表的提升百分比必须允许在单元格内换行');

console.log('伙伴技能外观测试通过');
