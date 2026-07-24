const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function findFile(startDir, fileName) {
    const entries = fs.readdirSync(startDir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(startDir, entry.name);
        if (entry.isFile() && entry.name === fileName) return fullPath;
        if (entry.isDirectory()) {
            const found = findFile(fullPath, fileName);
            if (found) return found;
        }
    }
    return null;
}

function createBaseWindow(store, settings) {
    return {
        PT_THEME_PRESETS: {
            oceanic: { label: '默认', cardBgGlass: 'rgba(12,24,38,1)', panelBg: 'rgba(12,24,38,.72)' },
            skyVault: { label: '银蓝', cardBgGlass: 'rgba(20,38,58,1)' }
        },
        PT_MATERIAL_PRESETS: {
            gradient: { label: '渐变玻璃' },
            smokedGlass: { label: '烟熏玻璃' },
            metalGlass: { label: '金属玻璃' }
        },
        PT_PICKER_PANEL: {},
        readPTSettings: function() {
            return Object.assign({
                cardThemePresets: {},
                cardMaterialPresets: {},
                cardBackgroundTheme: 'theme:oceanic',
                cardMaterial: 'gradient',
                smallCardAppearanceEnabled: false,
                smallCardTheme: 'theme:oceanic',
                smallCardMaterial: 'smallTranslucent'
            }, settings || {});
        },
        localStorage: {
            getItem: function(key) { return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null; },
            setItem: function(key, value) { store[key] = String(value); },
            removeItem: function(key) { delete store[key]; }
        }
    };
}

function createContext(settings) {
    const store = {};
    const context = { window: createBaseWindow(store, settings) };
    context.global = context;
    vm.createContext(context);
    return context;
}

function runFile(context, file) {
    vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
}

function loadCommon(settings) {
    const context = createContext(settings);
    runFile(context, findFile(path.resolve(__dirname, '../../../../../'), '视觉总调度.js'));
    runFile(context, path.join(__dirname, '帕鲁图鉴通用.js'));
    return context.window.PT_PALDEX_COMMON;
}

function loadPaldexWeb() {
    const context = createContext();
    runFile(context, findFile(path.resolve(__dirname, '../../../../../'), '视觉总调度.js'));
    runFile(context, findFile(path.resolve(__dirname, '..'), '帕鲁图鉴通用.js'));
    context.window.PT_PALDEX_CORE = {
        ELEMENTS: ['火属性'],
        getAll: function() {
            return [{
                slug: 'test-pal',
                displayId: '001',
                name: '测试帕鲁',
                category: '基础',
                implementStatus: '正常',
                partnerSkill: '测试技能',
                elements: ['火属性'],
                works: [{ name: '点火', level: 1 }],
                stats: { HP: 100, 攻击: 20, 防御: 30, 移动速度: 400 },
                icon: ''
            }];
        },
        getElementColor: function() { return '#f00'; },
        getElementIconUrl: function() { return ''; },
        getWorkIconUrl: function() { return 'work-icon.webp'; },
        getWorkIcon: function() { return ''; }
    };
    runFile(context, findFile(path.resolve(__dirname, '..'), '帕鲁图鉴网页.js'));
    return context.window.PT_PALDEX_WEB;
}

function loadVisualSettingsCard() {
    const context = createContext();
    runFile(context, findFile(path.resolve(__dirname, '../../../../../'), '视觉总调度.js'));
    runFile(context, findFile(path.resolve(__dirname, '..'), '帕鲁图鉴通用.js'));
    runFile(context, findFile(path.resolve(__dirname, '../../../../../'), '视觉设置卡片.js'));
    return context.window.PT_VISUAL_SETTINGS_CARD;
}

function plain(value) {
    return JSON.parse(JSON.stringify(value));
}

const common = loadCommon();
const paldexHtml = loadPaldexWeb().render();
const paldexWebJs = fs.readFileSync(findFile(path.resolve(__dirname, '..'), '帕鲁图鉴网页.js'), 'utf8');
const paldexCommonJs = fs.readFileSync(path.join(__dirname, '帕鲁图鉴通用.js'), 'utf8');
const paldexCss = fs.readFileSync(path.resolve(__dirname, '../样式/帕鲁图鉴网页样式.css'), 'utf8') +
    fs.readFileSync(path.resolve(__dirname, '../../../../../共享/视觉系统/主题样式.css'), 'utf8');
const appearanceSubpage = loadVisualSettingsCard().renderAppearanceSubpage({});
const visualSettingsJs = fs.readFileSync(findFile(path.resolve(__dirname, '../../../../../'), '视觉设置卡片.js'), 'utf8');
const wallPrototypePath = findFile(path.resolve(__dirname, '..'), '帕鲁图鉴侧壁原型.html');
const wallPrototypeBaselinePath = findFile(path.resolve(__dirname, '..'), '帕鲁图鉴侧壁原型-基准样本.html');
const wallGeometryPrototypePath = findFile(path.resolve(__dirname, '..'), '帕鲁图鉴侧壁几何原型.html');
const wallPrototypeHtml = wallPrototypePath ? fs.readFileSync(wallPrototypePath, 'utf8') : '';
const wallPrototypeBaselineHtml = wallPrototypeBaselinePath ? fs.readFileSync(wallPrototypeBaselinePath, 'utf8') : '';
const wallGeometryPrototypeHtml = wallGeometryPrototypePath ? fs.readFileSync(wallGeometryPrototypePath, 'utf8') : '';

assert.ok(!paldexHtml.includes('data-pd-appearance-toggle'), '图鉴页不应该再渲染图鉴外观按钮');
assert.ok(!paldexHtml.includes('data-pd-appearance-panel'), '图鉴页不应该再渲染图鉴外观面板');
assert.ok(paldexHtml.includes('class="pt-web-filter-shell"'), '帕鲁图鉴筛选栏应该有一个固定在顶部的大整体外壳');
assert.ok(paldexHtml.includes('class="pt-web-filter-cluster pt-web-filter-cluster--primary"'), '帕鲁图鉴现有搜索、属性、工作筛选应该归到第一个小整体');
assert.ok(paldexHtml.includes('class="pt-web-filter-cluster pt-web-filter-cluster--advanced"'), '帕鲁图鉴筛选栏右侧应该有新增筛选小整体');
assert.ok(paldexHtml.includes('data-pd-new-only'), '帕鲁图鉴新增筛选区应该有只显示新帕鲁开关');
assert.ok(paldexHtml.includes('data-pd-field'), '帕鲁图鉴新增筛选区应该有字段显示按钮');
assert.ok(paldexHtml.includes('生命值'), '帕鲁图鉴新增筛选区应该能按需显示生命值');
assert.ok(paldexHtml.includes('防御力'), '帕鲁图鉴新增筛选区应该能按需显示防御力');
assert.ok(paldexHtml.includes('pd-field-column pd-field-column--left'), '帕鲁图鉴字段筛选应该有左侧战斗和速度字段列');
assert.ok(paldexHtml.includes('pd-field-column pd-field-column--right'), '帕鲁图鉴字段筛选应该有右侧杂项字段列');
assert.ok(paldexHtml.includes('pd-field-divider'), '帕鲁图鉴字段筛选两列中间应该有小分割线');
assert.ok(/生命值[\s\S]*防御力[\s\S]*近战攻击[\s\S]*远程攻击[\s\S]*移动速度[\s\S]*冲刺速度/.test(paldexHtml), '帕鲁图鉴字段筛选左列顺序应该是生命值、防御力、近战攻击、远程攻击、移动速度、冲刺速度');
assert.ok(/食量[\s\S]*繁殖力[\s\S]*雄性概率/.test(paldexHtml), '帕鲁图鉴字段筛选右列顺序应该是食量、繁殖力、雄性概率');
assert.ok(!paldexHtml.includes('<span>HP '), '帕鲁图鉴一级卡片默认不应该固定显示生命值');
assert.ok(!paldexHtml.includes('<span>攻 '), '帕鲁图鉴一级卡片默认不应该固定显示攻击');
assert.ok(!paldexHtml.includes('<span>防 '), '帕鲁图鉴一级卡片默认不应该固定显示防御');
assert.ok(paldexHtml.includes('pt-filter-chip'), '帕鲁图鉴筛选按钮应该复用全局筛选按钮样式，跟随设置里的按钮风格');
assert.ok(paldexHtml.includes('class="pd-work-icon"'), '帕鲁图鉴一级卡片的工作适性标签应该显示工作图标');
assert.ok(paldexHtml.includes('src="work-icon.webp"'), '帕鲁图鉴一级卡片的工作适性标签应该复用核心层工作图标地址');
assert.ok(/\.pt-web-paldex-page\{[^}]*height:100%[^}]*display:flex[^}]*flex-direction:column[^}]*overflow:hidden/.test(paldexCss), '帕鲁图鉴页面应该拆成上方筛选区和下方独立滚动区');
assert.ok(/\.pt-web-filter-section\s*\{[^}]*position:\s*relative[^}]*flex:\s*0 0 auto/.test(paldexCss), '帕鲁图鉴筛选栏应该占据顶部固定空间，而不是靠硬遮挡盖住图鉴');
assert.ok(/\.pd-filter-grid-section\{[^}]*flex:1 1 auto[^}]*min-height:0[^}]*overflow-y:auto/.test(paldexCss), '图鉴网格区域应该自己滚动，卡片不能进入筛选栏区域');
assert.ok(/\.pd-grid\{[^}]*grid-auto-rows:var\(--pd-card-row-height\)/.test(paldexCss), '图鉴卡片增加字段后应该统一变高，而不是各长各的');
assert.ok(!/\.pt-web-filter-section\s*\{[^}]*backdrop-filter/.test(paldexCss), '帕鲁图鉴筛选栏不应该靠背景模糊硬遮挡下面的卡片');
assert.ok(/body\.pt-btn-style--classic \.pd-chip\{[^}]*box-shadow:none/.test(paldexCss), '经典平面按钮设置下，帕鲁图鉴筛选按钮应该去掉立体阴影');
assert.ok(/\.pd-field-controls\{[^}]*grid-template-columns:minmax\(0,1fr\) auto minmax\(0,1fr\)/.test(paldexCss), '帕鲁图鉴新增字段筛选应该用左右两列加中间小分割线');
assert.ok(/\.pd-field-divider\{[^}]*width:1px/.test(paldexCss), '帕鲁图鉴字段筛选中间分割线应该保持很细');
assert.ok(/\.pd-field-control\{[^}]*grid-template-columns:minmax\(70px,1fr\) auto auto/.test(paldexCss), '帕鲁图鉴每个字段筛选内部应该保持字段名和两个排序按钮单行排列');
assert.ok(/\.pd-sort-controls\s*\{[^}]*flex-wrap:\s*nowrap/.test(paldexCss), '帕鲁图鉴基础排序按钮应该尽量保持单行，避免撑高筛选区');
assert.ok(/\.pd-work-tag\{[^}]*display:inline-flex[^}]*align-items:center/.test(paldexCss), '帕鲁图鉴一级卡片工作适性标签应该横向贴合图标和文字');
assert.ok(/\.pd-work-tag\{[^}]*line-height:1\.15/.test(paldexCss), '帕鲁图鉴一级卡片工作适性标签应该贴合最新紧凑文字行高');
assert.ok(/\.pd-work-tag\{[^}]*padding:1px 3px/.test(paldexCss), '帕鲁图鉴一级卡片工作适性标签应该使用最新紧凑内边距');
assert.ok(/\.pd-work-icon\{[^}]*width:11px[^}]*height:11px/.test(paldexCss), '帕鲁图鉴一级卡片工作图标应该跟小字号标签匹配');
assert.ok(/\.pd-card-stats\{[^}]*grid-template-columns:1fr/.test(paldexCss), '帕鲁图鉴一级卡片显示字段应该单列排列');
assert.ok(/\.pd-card-stats\{[^}]*margin-top:4px/.test(paldexCss), '帕鲁图鉴一级卡片显示字段应该贴近工作适性，不应该被推到卡片底部');
assert.ok(paldexWebJs.includes('PT_buildCardVisualVars'), '图鉴材质应该复用桌面模式的视觉解析入口');
assert.ok(paldexCommonJs.includes('PT_getLayeredCardAppearanceSettings'), '图鉴必须复用统一的大卡片/小卡片分层解析');
assert.ok(paldexWebJs.includes("'--pd-frame-glass-glow'"), '图鉴大卡片必须使用材质自身的玻璃辉光');
assert.ok(!paldexWebJs.includes('function applyOpacityToColor'), '图鉴不应该保留自己的透明度算法');
assert.ok(!paldexWebJs.includes("if (!root || root.dataset.pdBd === '1') return"), '再次进入图鉴时不应该被旧绑定标记拦截');
assert.ok(paldexWebJs.includes("var hasBoundEvents = root.dataset.pdBd === '1'"), '图鉴应该只复用事件绑定，不跳过外观刷新');
assert.ok(paldexWebJs.includes('function applyFrameMask()'), '图鉴应该按实际方格位置计算整张钢板的孔洞');
assert.ok(paldexWebJs.includes('mask="url(#holes)"'), '钢板遮罩应该从整张板中真实减去所有孔洞');
assert.ok(paldexHtml.includes('data-pd-cube-wall-layer'), '正式图鉴网格里应该有专门绘制立方体侧壁的canvas层');
assert.ok(paldexWebJs.includes('function ensureSideWallLayer'), '正式图鉴应该只为当前活动卡片准备侧壁画布层');
assert.ok(paldexWebJs.includes('function renderSideWallForCard'), '正式图鉴应该能按当前卡片绘制侧壁');
assert.ok(paldexWebJs.includes('function readCubeMaterialForCard'), '正式图鉴侧壁应该读取卡片材质变量，和正面使用同一套材质');
assert.ok(paldexWebJs.includes("getPropertyValue('--pd-cube-bg')"), '正式图鉴侧壁底色应该来自立方体正面的材质变量');
assert.ok(paldexWebJs.includes('function drawPaldexStackedSideWall'), '正式图鉴侧壁应该使用密集切片堆叠，保留物理堆叠感');
assert.ok(paldexWebJs.includes('function drawPaldexSideWallSurface'), '正式图鉴侧壁应该先铺连续底面，减轻横向条纹');
assert.ok(paldexWebJs.includes('function drawPaldexMaterialSideWallFace'), '正式图鉴侧壁应该有一整块连续材质面，用来承接材质而不是暴露切片线');
assert.ok(paldexWebJs.includes('drawPaldexMaterialSideWallFace(ctx, back, front, material)'), '正式图鉴侧壁应该先画连续材质面，再叠厚度层');
assert.ok(paldexWebJs.includes('function fillPaldexSideWallSweepMask'), '连续材质面应该用前后同源圆角轮廓生成遮罩，不能手拼直角');
assert.ok(paldexWebJs.includes("globalCompositeOperation = 'destination-out'"), '连续材质面应该从扫掠面里扣掉正面卡片区域，避免透明正面下方发黑');
assert.ok(paldexWebJs.includes('transparentSideAlpha'), '正式图鉴侧壁应该使用透明侧壁透明度，不能画成不透的暗面');
assert.ok(paldexWebJs.includes('material.transparentSideAlpha'), '正式图鉴侧壁绘制应该使用透明材质参数');
assert.ok(paldexWebJs.includes('function getPaldexSideWallMaterialProfile'), '正式图鉴侧壁应该有材质翻译表，把材质转换成侧壁画法');
assert.ok(paldexWebJs.includes("kind: 'glass'"), '玻璃材质应该被翻译成干净透明侧壁');
assert.ok(paldexWebJs.includes("kind: 'smokedGlass'"), '烟熏玻璃材质应该被翻译成更暗但仍透明的侧壁');
assert.ok(paldexWebJs.includes("kind: 'metal'"), '金属材质应该有自己的连续面质感，不应该和默认材质一样');
assert.ok(paldexWebJs.includes("kind: 'wood'"), '木质材质应该有自己的连续面质感，不应该和默认材质一样');
assert.ok(paldexWebJs.includes('function drawPaldexSideWallMaterialTexture'), '连续材质面应该叠加材质纹理，而不是只换颜色');
assert.ok(paldexWebJs.includes('function drawPaldexGlassSideWall'), '玻璃类侧壁应该有专门画法，不应该和金属木质共用一套');
assert.ok(paldexWebJs.includes('function drawPaldexSmokedGlassSideWall'), '烟熏玻璃侧壁应该有专门画法');
assert.ok(!/function drawPaldexSideWallEdgeGlints[\s\S]*?ctx\.stroke\(\)/.test(paldexWebJs), '玻璃侧壁不应该再画完整矩形描边，避免正面和侧壁之间出现双边硬线');
assert.ok(paldexWebJs.includes('function drawPaldexSideWallSoftEdge'), '玻璃侧壁边缘只能用柔和渐隐过渡，不能用硬描边');
assert.ok(paldexWebJs.includes('function drawPaldexBlurredGlassSideWall'), '玻璃侧壁应该先离屏绘制再模糊融合，避免切片线一层层露出来');
assert.ok(paldexWebJs.includes("filter = 'blur("), '玻璃侧壁融合应该使用画布模糊把切片糊开');
const glassSideWallBody = paldexWebJs.slice(
  paldexWebJs.indexOf('function drawPaldexGlassSideWall(ctx, back, front, material)'),
  paldexWebJs.indexOf('function drawPaldexGlassSideWallSlices')
);
assert.ok(glassSideWallBody.includes('drawPaldexBlurredGlassSideWall'), '玻璃侧壁入口应该先走模糊融合画法');
assert.ok(!glassSideWallBody.includes('drawPaldexSideWallSoftEdge'), '玻璃侧壁不应该直接在主画面叠柔边切片');
const defaultSideWallBody = paldexWebJs.slice(
  paldexWebJs.indexOf('function renderSideWallForCard(card, depth, direction)'),
  paldexWebJs.indexOf('function updatePulledCard')
);
assert.ok(!defaultSideWallBody.includes('drawPaldexStackedSideWall(ctx, back, front, material)'), '默认材质不应该直接在主画面暴露密集切片线');
assert.ok(defaultSideWallBody.includes('drawPaldexBlurredGlassSideWall(ctx, back, front, material'), '默认材质也应该走模糊融合厚度层');
assert.ok(paldexWebJs.includes("getPropertyValue('--pd-cube-material-id')"), '正式图鉴侧壁应该读取立方体材质编号');
assert.ok(paldexWebJs.includes('function getCardPullDirection'), '正式图鉴应该按卡片屏幕位置计算抽出方向');
assert.ok(paldexWebJs.includes('function getCardPullVector'), '正式图鉴应该把抽出方向转换成正面位移变量');
assert.ok(paldexWebJs.includes('function getDragDepthDelta'), '正式图鉴拖拽深度应该按抽出方向投影计算');
assert.ok(/\.pd-grid\{[^}]*background:transparent/.test(paldexCss), '孔洞下方必须透明，不能铺框架底色');
assert.ok(/\.pd-grid::after\{[^}]*z-index:3[^}]*--pd-frame-metal-texture[^}]*--pd-frame-wood-texture[^}]*--pd-frame-mask/.test(paldexCss), '整张钢板应该作为上盖遮挡层承接材质并使用统一孔洞遮罩');
assert.ok(!/\.pd-grid::after\{[^}]*inset 0 -10px 22px/.test(paldexCss), '图鉴大卡片不能额外叠加固定黑色内阴影');
assert.ok(!/\.pd-grid::after\{[^}]*0 12px 34px rgba\(0,0,0/.test(paldexCss), '图鉴大卡片不能额外叠加固定黑色外阴影');
assert.ok(!/\.pd-grid::before\{[^}]*--pd-frame-mask/.test(paldexCss), '整张钢板不应该只画在卡片下面，否则下压时框架盖不住卡片');
assert.ok(!/\.pd-cell::before\{[^}]*inset:0/.test(paldexCss), '不应该给每个方格单独画一圈假框架');
assert.ok(/\.pd-grid\{[^}]*gap:var\(--pd-frame-width/.test(paldexCss), '相邻立方体之间应该只共享一条框架窄条');
assert.ok(/\.pd-cell\{[^}]*padding:0/.test(paldexCss), '方格自身不应该再制造双份框架间距');
assert.ok(/\.pd-cell\{[^}]*background:transparent/.test(paldexCss), '方格自身不应该再画独立槽底');
assert.ok(/\.pd-cell\{[^}]*box-shadow:none/.test(paldexCss), '平齐状态下不应该显示框架内壁');
assert.ok(/\.pd-cell\{[^}]*border-radius:var\(--pd-frame-radius/.test(paldexCss), '框架孔洞应该使用统一圆角');
assert.ok(/\.pd-card\{[^}]*border-radius:var\(--pd-cube-radius/.test(paldexCss), '立方体应该使用与孔洞配套的统一圆角');
assert.ok(/\.pd-grid::after\{[^}]*--pd-frame-before-background/.test(paldexCss), '框架材质高光应该按材质设置显示');
assert.ok(/\.pd-card\{[^}]*--pd-cube-before-background/.test(paldexCss), '立方体正面应该承接自己的材质高光');
assert.ok(/\.pd-card\{[^}]*--pd-cube-material-id/.test(paldexCss), '立方体正面应该保存当前材质编号，供侧壁翻译材质');
assert.ok(!paldexCss.includes('--pd-cube-curve-band-mask'), '正式图鉴应该撤掉不好看的曲面带实验结构');
assert.ok(!paldexCss.includes('--pd-cube-flat-core-shadow'), '正式图鉴应该撤掉平面核心实验结构，避免正面像塞小卡片');
assert.ok(/\.pd-card::before\{[^}]*--pd-cube-before-background/.test(paldexCss), '正式图鉴正面应该回到材质高光层，而不是曲面实验层');
assert.ok(!paldexCss.includes('--pd-type-depth'), '正式图鉴不应该残留失败侧壁厚度变量');
assert.ok(!/\.pd-card\{[^}]*transform:translate\([1-9]/.test(paldexCss), '正常位置不应该用平面偏移冒充下沉');
assert.ok(/\.pd-cell\{[^}]*overflow:hidden/.test(paldexCss), '正常位置应该由洞口裁掉右边缘和下边缘的侧边棱角');
assert.ok(!paldexCss.includes('.pd-cell::before'), '平齐状态下不应该保留框架内壁伪层');
assert.ok(/\.pd-cell:has\(\.pd-card--hovered\)\{[^}]*overflow:visible/.test(paldexCss), '抬起时应该解除洞口裁切，避免卡片被洞口截断');
assert.ok(/\.pd-cube-wall-layer\{[^}]*position:absolute[^}]*pointer-events:none/.test(paldexCss), '侧壁画布层应该盖在网格上但不能拦截鼠标');
assert.ok(/\.pd-card--hovered\{[^}]*translate\(var\(--pd-pull-x/.test(paldexCss), '立方体悬停抽出时正面应该使用按屏幕位置计算出的横向位移');
assert.ok(paldexWebJs.includes('renderSideWallForCard(card, 22, direction)'), '正式图鉴悬停时应该用足够的侧壁深度体现立体感');
assert.ok(/\.pd-card--hovered\{[^}]*--pd-pull-depth/.test(paldexCss), '正式图鉴悬停样式应该把拉出深度用于投影，增强立体感');
assert.ok(/\.pd-card--dragging\{[^}]*translate\(var\(--pd-pull-x/.test(paldexCss), '按住拖拽时正面应该使用按屏幕位置计算出的位移');
assert.ok(/\.pd-card--dragging\{[^}]*var\(--pd-pull-shadow-depth/.test(paldexCss), '按住拖拽时应该用非负深度控制阴影，避免反向下压时阴影失效');
assert.ok(/\.pd-card--sinking\{[^}]*translate\(var\(--pd-pull-x/.test(paldexCss), '反向下压时也应该沿透视方向移动正面');
assert.ok(!/\.pd-cell:has\(\.pd-card--sinking\)\{[^}]*overflow:visible/.test(paldexCss), '反向下压时不应该解除洞口裁切，否则会盖在框架上');
assert.ok(paldexWebJs.includes('function updatePulledCard'), '按住拖拽时应该沿固定抽出方向更新深度');
assert.ok(paldexWebJs.includes('projected + 22'), '按住拖拽也应该沿用悬停时的厚抽出基准，不能退回浅抽出');
assert.ok(!paldexWebJs.includes('if (depth < 24) return;'), '按住拖拽不应该有硬门槛，否则小幅移动会卡住不跟手');
assert.ok(paldexWebJs.includes('Math.max(-22, Math.min(96, projected + 22))'), '按住拖拽应该允许最多一个悬停高度的反向下压');
assert.ok(paldexWebJs.includes('pressedHasDragged'), '鼠标按下后应该记录是否真的发生拖拽，用来阻止松开时误触发展开');
assert.ok(paldexWebJs.includes(".classList.add('pd-card--sinking')"), '反向下压时应该进入被洞口裁切的下压状态，而不是继续使用外拉状态');
assert.ok(paldexWebJs.includes('--pd-pull-depth'), '拖拽深度应该写入立方体样式变量');
assert.ok(paldexWebJs.includes('--pd-pull-shadow-depth'), '拖拽阴影深度应该单独写入，避免负数破坏阴影');
assert.ok(paldexWebJs.includes('--pd-pull-x'), '正面横向抽出位移应该写入立方体样式变量');
assert.ok(paldexWebJs.includes('--pd-pull-y'), '正面纵向抽出位移应该写入立方体样式变量');
assert.ok(!paldexWebJs.includes('var projected = (dx + dy) / 2'), '正式图鉴不应该继续使用固定左上方向的拖拽公式');
assert.ok(/\.pd-cell:has\(\.pd-card--dragging\)\{[^}]*overflow:visible/.test(paldexCss), '长距离拉出时格子不应该裁掉卡片正面');
assert.ok(!paldexHtml.includes('pd-card-side-svg'), '立方体侧壁不应该继续使用SVG路径层');
assert.ok(!paldexWebJs.includes('function buildExposedExtrudePath'), '立方体侧壁不应该继续用路径生成假挤出面');
assert.ok(!paldexHtml.includes('pd-card-side-face'), '正式图鉴不应该残留失败的HTML侧面');
assert.ok(!paldexCss.includes('pd-card-side-face'), '正式图鉴样式不应该残留失败的HTML侧面');
assert.ok(!paldexCss.includes('transform-style:preserve-3d'), '正式图鉴不应该残留失败的CSS 3D侧面');
assert.ok(!paldexCss.includes('--pd-cube-side-fill'), '正式图鉴不应该残留无用侧壁颜色变量');
assert.ok(paldexWebJs.includes('function clearHoveredCards'), '拖拽前应该能统一清掉其他悬停卡片');
assert.ok(paldexWebJs.includes('if (pressedCard) return;'), '拖拽期间不应该触发其他卡片悬停动画');
assert.ok(!paldexCss.includes('.pd-card::before{top:0;left:calc(100% - 1px)'), '不应该继续用CSS右侧斜片冒充侧壁');
assert.ok(!appearanceSubpage.includes('data-paldex-appearance-field'), '设置页不应该再维护一套独立的图鉴外观字段');
assert.ok(!appearanceSubpage.includes('帕鲁图鉴外观'), '设置页不应该再显示重复的帕鲁图鉴外观卡片');
assert.ok(appearanceSubpage.includes('大卡片背景主题'), '图鉴外框应该统一由大卡片主题控制');
assert.ok(appearanceSubpage.includes('大卡片材质'), '图鉴外框应该统一由大卡片材质控制');
assert.ok(appearanceSubpage.includes('小卡片主题'), '图鉴立方体应该统一由小卡片主题控制');
assert.ok(appearanceSubpage.includes('小卡片材质'), '图鉴立方体应该统一由小卡片材质控制');
assert.ok(appearanceSubpage.includes('pt-appearance-editor-actions'), '外观设置页顶部应该有高级面板大键区域');
assert.ok(appearanceSubpage.includes('<span>主题高级面板</span>'), '主题高级面板入口应该改成外观设置顶部的大键');
assert.ok(appearanceSubpage.includes('<span>材质高级面板</span>'), '材质高级面板入口应该改成外观设置顶部的大键');
assert.ok(appearanceSubpage.includes('<small>管理和微调界面主题</small>'), '主题高级面板大键应该有说明文字');
assert.ok(appearanceSubpage.includes('<small>管理和微调卡片材质</small>'), '材质高级面板大键应该有说明文字');
assert.ok(!appearanceSubpage.includes('pt-inline-action pt-style-editor-entry'), '外观设置里的高级面板不应该再是小按钮');
assert.ok(!appearanceSubpage.includes('>高级面板</button>'), '外观设置里的高级面板入口应该改名，不再叫高级面板');
assert.ok(visualSettingsJs.includes("replaceSettingsPage(root, '#pt-appearance-subpage-wrap'"), '重新进入外观设置时应该重渲染页面，按钮样式才能按保存值回显');
assert.ok(wallPrototypePath, '应该有隔离的帕鲁图鉴侧壁原型页');
assert.ok(wallPrototypeBaselinePath, '应该保留当前80分状态的侧壁原型基准样本');
assert.ok(wallGeometryPrototypePath, '应该有隔离的帕鲁图鉴侧壁几何原型页');
assert.ok(wallPrototypeHtml.includes('<canvas id="pd-wall-prototype"'), '侧壁原型应该用canvas画布绘制');
assert.ok(wallPrototypeBaselineHtml.includes('<canvas id="pd-wall-prototype"'), '侧壁原型基准样本应该保留canvas画布绘制');
assert.ok(wallGeometryPrototypeHtml.includes('<canvas id="pd-wall-geometry-prototype"'), '侧壁几何原型应该用canvas画布绘制');
assert.ok(wallGeometryPrototypeHtml.includes('function buildStraightSideFaces'), '侧壁几何原型应该先拆出四个直边侧面');
assert.ok(wallGeometryPrototypeHtml.includes('function buildCornerSweepFaces'), '侧壁几何原型应该单独拆出四个圆角过渡面');
assert.ok(wallGeometryPrototypeHtml.includes("name: 'top'") && wallGeometryPrototypeHtml.includes("name: 'right'") && wallGeometryPrototypeHtml.includes("name: 'bottom'") && wallGeometryPrototypeHtml.includes("name: 'left'"), '侧壁几何原型必须明确上右下左四个直边侧面');
assert.ok(wallGeometryPrototypeHtml.includes("name: 'topRight'") && wallGeometryPrototypeHtml.includes("name: 'bottomRight'") && wallGeometryPrototypeHtml.includes("name: 'bottomLeft'") && wallGeometryPrototypeHtml.includes("name: 'topLeft'"), '侧壁几何原型必须明确四个圆角过渡面');
assert.ok(wallGeometryPrototypeHtml.includes('function drawFaceLabels'), '侧壁几何原型应该直接标注每个几何面，方便肉眼验');
assert.ok(wallGeometryPrototypeHtml.includes('data-role="show-corners"'), '侧壁几何原型应该能单独开关圆角过渡面');
assert.ok(!wallGeometryPrototypeHtml.includes('function drawEdgeBridgeLayer'), '侧壁几何原型不应该再用贴边连接层，避免看起来像包了一圈边');
assert.ok(wallGeometryPrototypeHtml.includes('function buildCurvedScreenTransitionBands'), '侧壁几何原型应该先拆出曲面屏式过渡带');
assert.ok(wallGeometryPrototypeHtml.includes('function drawCurvedScreenTransitionBands'), '侧壁几何原型应该绘制曲面屏式过渡带，而不是描边');
assert.ok(!wallGeometryPrototypeHtml.includes("rgba(255,255,255,.30)") && !wallGeometryPrototypeHtml.includes("rgba(255,255,255,.20)"), '曲面屏式过渡带不应该有明显白边');
assert.ok(!wallGeometryPrototypeHtml.includes('ctx.stroke(roundedRectPath(inner))'), '曲面屏式过渡带不应该画内侧轮廓线，避免像塞了一张小卡片');
assert.ok(/drawCornerFaces\(cornerFaces\);[\s\S]*drawStraightFaces\(straightFaces\);[\s\S]*drawFaceLabels\(straightFaces, cornerFaces\);[\s\S]*drawCurvedScreenTransitionBands\(transitionBands\);[\s\S]*drawFrontFace\(front\);/.test(wallGeometryPrototypeHtml), '几何标注应该画在曲面带之前，不能压到正面和曲面带上');
assert.ok(wallPrototypeBaselineHtml.includes('data-role="screen-position"'), '侧壁原型基准样本应该保留按屏幕位置抽出的80分状态');
assert.ok(!wallPrototypeBaselineHtml.includes('function drawCornerOcclusion'), '侧壁原型基准样本不应该保留失败的人工右下棱阴影');
assert.ok(!wallPrototypeBaselineHtml.includes('function drawCornerRimLight'), '侧壁原型基准样本不应该保留失败的人工右下棱亮边');
assert.ok(wallPrototypeBaselineHtml.includes('ctx.lineWidth = 1.1'), '侧壁原型基准样本应该保留80分状态的顶层正面边缘');
assert.ok(wallPrototypeBaselineHtml.includes('ctx.shadowBlur = 24'), '侧壁原型基准样本应该保留80分状态的顶层正面外发阴影');
assert.ok(wallPrototypeHtml.includes('function drawRoundedRect'), '侧壁原型应该有圆角矩形绘制函数');
assert.ok(wallPrototypeHtml.includes('function drawSideWall'), '侧壁原型应该单独绘制侧壁');
assert.ok(wallPrototypeHtml.includes('function drawHollowRoundedRect'), '侧壁原型应该能绘制空心圆角卡片切片');
assert.ok(wallPrototypeHtml.includes('function drawStackedSideWall'), '侧壁原型应该用多层空心切片堆叠侧壁');
assert.ok(wallPrototypeHtml.includes('data-role="screen-position"'), '侧壁原型应该能调整立方体在屏幕里的横向位置');
assert.ok(wallPrototypeHtml.includes('function getPullDirection'), '侧壁原型应该能按屏幕位置得到抽出方向');
assert.ok(wallPrototypeHtml.includes('function getPullVector'), '侧壁原型应该按屏幕横向位置计算抽出方向');
assert.ok(wallPrototypeHtml.includes('function getDragDepthDelta'), '侧壁原型拖拽时应该按抽出方向投影计算深度变化');
assert.ok(/function drawPrototype\(depth\)[\s\S]*var pull = getPullVector\(back, width, depth\);[\s\S]*x: back\.x \+ pull\.x,[\s\S]*y: back\.y \+ pull\.y,/.test(wallPrototypeHtml), '侧壁原型前方面位置应该来自屏幕位置抽出方向，而不是固定左上偏移');
assert.ok(/pointerdown[\s\S]*startPullDirection = getPullDirection\(back, canvas\.clientWidth\);/.test(wallPrototypeHtml), '开始拖拽时应该锁定当前屏幕位置对应的抽出方向');
assert.ok(/pointermove[\s\S]*var delta = getDragDepthDelta\(event\.clientX - startX, event\.clientY - startY, startPullDirection\);/.test(wallPrototypeHtml), '拖拽深度应该来自鼠标位移在抽出方向上的投影');
assert.ok(!wallPrototypeHtml.includes('((startX - event.clientX) + (startY - event.clientY)) / 2'), '侧壁原型不应该继续使用固定左上方向的拖拽公式');
assert.ok(/function drawSideWall\(back, front\)[\s\S]*drawStackedSideWall\(back, front\);[\s\S]*\}/.test(wallPrototypeHtml), '侧壁原型侧壁应该只靠切片堆叠生成，不应该叠加人工棱线');
assert.ok(!wallPrototypeHtml.includes('function drawCornerOcclusion'), '侧壁原型不应该继续保留人工右下棱阴影');
assert.ok(!wallPrototypeHtml.includes('function drawCornerRimLight'), '侧壁原型不应该继续保留人工右下棱亮边');
assert.ok(!wallPrototypeHtml.includes('x: back.x - depth'), '侧壁原型不应该继续固定向左上抽出');
assert.ok(wallPrototypeHtml.includes('var sliceCount'), '侧壁原型应该按抽出深度计算切片数量');
assert.ok(!/function drawHollowRoundedRect[\s\S]*?target\.stroke\(\)/.test(wallPrototypeHtml), '空心切片应该靠填充叠成面，不应该再用粗描边');
assert.ok(!wallPrototypeHtml.includes('ctx.lineWidth = 1.1'), '工作版顶层正面边缘应该降到0，不再保留1.1像素描边');
assert.ok(!wallPrototypeHtml.includes('ctx.stroke(face)'), '工作版顶层正面不应该再额外描边');
assert.ok(!wallPrototypeHtml.includes('ctx.shadowBlur = 24'), '工作版顶层正面不应该继续散发外部黑影');
assert.ok(!wallPrototypeHtml.includes('ctx.shadowOffsetX = 18'), '工作版顶层正面不应该继续横向外投阴影');
assert.ok(!wallPrototypeHtml.includes('ctx.shadowOffsetY = 24'), '工作版顶层正面不应该继续纵向外投阴影');
assert.ok(wallPrototypeHtml.includes('function drawFaceCurvedEdges'), '工作版顶层正面应该改用内部四边曲面阴影');
assert.ok(/function drawFrontFace\(front\)[\s\S]*ctx\.fill\(face\);[\s\S]*drawFaceCurvedEdges\(face, front\);/.test(wallPrototypeHtml), '工作版应该在填充正面之后绘制内部曲面，不应该靠外部投影造黑边');
assert.ok(!wallPrototypeHtml.includes('function drawSampledSideWall'), '侧壁原型不应该继续使用采样连接侧壁');
assert.ok(!wallPrototypeHtml.includes("wall.globalCompositeOperation = 'destination-out'"), '侧壁原型不应该再用错位轮廓相减来画侧壁');

const inheritedAppearanceCommon = loadCommon({
    frameTheme: 'theme:skyVault',
    cardBackgroundTheme: 'theme:skyVault',
    cardMaterial: 'metalGlass',
    smallCardAppearanceEnabled: false,
    smallCardTheme: 'theme:oceanic',
    smallCardMaterial: 'smokedGlass'
});
assert.deepStrictEqual(plain(inheritedAppearanceCommon.getAppearanceSettings()), {
    frameTheme: 'theme:skyVault',
    frameMaterial: 'metalGlass',
    cubeTheme: 'theme:skyVault',
    cubeMaterial: 'metalGlass'
});

const independentSmallCardCommon = loadCommon({
    cardBackgroundTheme: 'theme:skyVault',
    cardMaterial: 'gradient',
    smallCardAppearanceEnabled: true,
    smallCardTheme: 'theme:oceanic',
    smallCardMaterial: 'metalGlass'
});
assert.deepStrictEqual(plain(independentSmallCardCommon.getAppearanceSettings()), {
    frameTheme: 'theme:skyVault',
    frameMaterial: 'gradient',
    cubeTheme: 'theme:oceanic',
    cubeMaterial: 'metalGlass'
});
assert.strictEqual(independentSmallCardCommon.setAppearanceSettings, undefined, '图鉴不应该再暴露独立外观写入口');

assert.ok(!/function drawFrontFace\(front\)[\s\S]*shadowBlur\s*=\s*16[\s\S]*function drawPrototype/.test(wallGeometryPrototypeHtml), '几何原型正面不应该用大范围外投影把自己和侧壁割裂开');
assert.ok(wallGeometryPrototypeHtml.includes('function drawFrontFlatCore'), '几何原型正面中间应该单独作为平面核心绘制，边缘留给曲面带');

console.log('帕鲁图鉴外观设置测试通过');
