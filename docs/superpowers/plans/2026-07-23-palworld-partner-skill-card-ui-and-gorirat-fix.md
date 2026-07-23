# 伙伴技能卡片外观与石掌猿描述修复 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 补全石掌猿伙伴技能的两项效果，并让伙伴技能卡片与筛选栏复用帕鲁图鉴可调外观系统。

**Architecture:** 数据修正作为带证据的研究修正输入进入现有伙伴技能生成器，再由标准事实供图鉴详情页和伙伴技能工具共同读取。外观解析集中在 `PT_PALDEX_COMMON`，帕鲁图鉴和伙伴技能网页适配层只负责把同一组 CSS 变量应用到各自页面；伙伴技能保留适合长说明和等级表的自适应卡片结构。

**Tech Stack:** 原生 JavaScript、HTML 字符串模板、CSS、自带 Node.js `assert` 测试、浏览器肉眼验收。

---

## 文件职责

- 新建 `迁移验证/伙伴技能/伙伴技能事实修正.json`：保存来源正文与原始等级数据冲突时的研究修正及证据元数据。
- 修改 `迁移验证/伙伴技能/更新伙伴技能数据.js`：读取、校验并应用研究修正，再生成标准事实。
- 修改 `迁移验证/伙伴技能/伙伴技能数据核心.js`：把修正证据随正式事实的 `source.correction` 输出，普通帕鲁和继承记录使用同一证据。
- 修改 `迁移验证/伙伴技能/正式数据等级表.test.js`：锁定石掌猿两段正文、两张等级表和 Boss 继承结果。
- 修改 `PalToolbox/游戏内容/幻兽帕鲁1.0/数据包/伙伴技能.json`：由生成器更新的正式事实，不人工编辑。
- 修改 `PalToolbox/游戏内容/幻兽帕鲁/工具功能/帕鲁图鉴/通用逻辑/帕鲁图鉴通用.js`：提供帕鲁图鉴外观 CSS 变量的唯一解析入口。
- 修改 `PalToolbox/游戏内容/幻兽帕鲁/工具功能/帕鲁图鉴/网页模式适配/帕鲁图鉴网页.js`：改为调用公共外观变量入口，保持现有图鉴效果。
- 新建 `PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/网页模式适配/伙伴技能外观.test.js`：检查外观设置复用、分段说明和新卡片结构。
- 修改 `PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/网页模式适配/技能网页.js`：应用公共外观变量并输出新的伙伴技能卡片和筛选结构。
- 修改 `PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/样式/技能网页样式.css`：让卡片网格、卡片和筛选栏消费可调主题与材质变量。

### Task 1: 用失败检查锁定石掌猿完整事实

**Files:**
- Modify: `迁移验证/伙伴技能/正式数据等级表.test.js`
- Test: `迁移验证/伙伴技能/正式数据等级表.test.js`

- [ ] **Step 1: 写入失败断言**

在现有正式数据测试中加入：

```js
const goriratTerra = data.partnerSkills.Gorilla_Ground;
assert.deepStrictEqual(goriratTerra.description.split('\n'), [
    '发动后会解放野性之力，并在一定时间内石掌猿的攻击力将提升(75~300)%。',
    '若它在队伍中，玩家的攀爬速度提升(50~100)%。（不可叠加）'
]);
assert.deepStrictEqual(
    goriratTerra.rankTables.map(function(table) { return table.rows.map(function(row) { return row.values[0]; }); }),
    [[75, 115, 165, 225, 300], [50, 60, 70, 85, 100]]
);
assert.strictEqual(data.partnerSkills.BOSS_Gorilla_Ground.description, goriratTerra.description);
assert.ok(goriratTerra.source.correction, '石掌猿必须保留研究修正证据');
assert.strictEqual(data.partnerSkills.BOSS_Gorilla_Ground.source.correction.id, goriratTerra.source.correction.id);
```

- [ ] **Step 2: 运行测试并确认失败原因**

Run:

```powershell
node '迁移验证/伙伴技能/正式数据等级表.test.js'
```

Expected: FAIL；当前 `Gorilla_Ground.description` 只有攀爬速度一段，且 `source.correction` 不存在。

### Task 2: 把石掌猿修正接入生成流程

**Files:**
- Create: `迁移验证/伙伴技能/伙伴技能事实修正.json`
- Modify: `迁移验证/伙伴技能/更新伙伴技能数据.js`
- Modify: `迁移验证/伙伴技能/伙伴技能数据核心.js`
- Generate: `PalToolbox/游戏内容/幻兽帕鲁1.0/数据包/伙伴技能.json`
- Test: `迁移验证/伙伴技能/正式数据等级表.test.js`
- Test: `迁移验证/伙伴技能/伙伴技能数据.test.js`

- [ ] **Step 1: 建立带证据的研究修正输入**

创建 JSON：

```json
{
  "meta": {
    "dataRole": "research-correction",
    "verifiedAt": "2026-07-23",
    "gameVersion": "v1.0.0",
    "transformVersion": "1.5.0"
  },
  "partnerSkills": {
    "Gorilla_Ground": {
      "description": "发动后会解放野性之力，并在一定时间内石掌猿的攻击力将提升(75~300)%。\n若它在队伍中，玩家的攀爬速度提升(50~100)%。（不可叠加）",
      "correction": {
        "id": "gorilla-ground-missing-active-attack",
        "status": "verified-from-source-values",
        "sourceUrl": "https://paldb.cc/cn/Gorirat_Terra",
        "evidence": "PalDB 中文正文仅列攀爬速度；同页伙伴技能等级表明确列出 ToSelf 攻击 +75%、+115%、+165%、+225%、+300%。"
      }
    }
  }
}
```

- [ ] **Step 2: 在生成器中读取并应用修正**

在常量区增加 `FACT_CORRECTION_FILE`，并加入纯数据转换函数：

```js
function applyFactCorrections(records, corrections) {
    const facts = corrections && corrections.partnerSkills || {};
    return records.map(function(record) {
        const correction = facts[record.palId];
        if (!correction) return record;
        if (!correction.description || !correction.correction || !correction.correction.sourceUrl) {
            throw new Error('伙伴技能事实修正缺少正文或证据: ' + record.palId);
        }
        return Object.assign({}, record, {
            description: correction.description,
            factCorrection: correction.correction
        });
    });
}
```

在 `generateData()` 中先应用补充等级表，再应用事实修正：

```js
const corrections = readJson(FACT_CORRECTION_FILE);
const normalRecords = applyFactCorrections(
    applySupplementalRankTables(loadOrdinaryRecords(manifest, listRecords), supplemental),
    corrections
);
```

同时把修正文件名、记录数、验证日期、游戏版本和转换版本写入 `output.meta.factCorrections`。

- [ ] **Step 3: 在标准事实中保留修正证据**

在 `buildPartnerSkillData()` 生成 `source` 时增加：

```js
correction: selected && selected.factCorrection || null
```

这样 `Gorilla_Ground` 与继承同一普通记录的 `BOSS_Gorilla_Ground` 都携带同一修正证据。

- [ ] **Step 4: 重新生成标准事实**

Run:

```powershell
node '迁移验证/伙伴技能/更新伙伴技能数据.js'
```

Expected: `伙伴技能数据校验通过`，生成文件内普通石掌猿和 Boss 均为两段正文，两张等级表数值不变。

- [ ] **Step 5: 运行数据测试**

Run:

```powershell
node '迁移验证/伙伴技能/正式数据等级表.test.js'
node '迁移验证/伙伴技能/伙伴技能数据.test.js'
node '迁移验证/伙伴技能/更新伙伴技能数据.js' --check
```

Expected: 三条命令均通过，生成检查不改文件。

### Task 3: 抽出帕鲁图鉴外观变量公共入口

**Files:**
- Modify: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/帕鲁图鉴/通用逻辑/帕鲁图鉴通用.js`
- Modify: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/帕鲁图鉴/网页模式适配/帕鲁图鉴网页.js`
- Modify: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/帕鲁图鉴/通用逻辑/帕鲁图鉴外观设置.test.js`

- [ ] **Step 1: 给公共入口补失败测试**

在图鉴外观测试里断言：

```js
assert.strictEqual(typeof common.getAppearanceCssVars, 'function');
const vars = common.getAppearanceCssVars({ theme: 'oceanic' });
assert.strictEqual(vars['--pd-frame-bg'], 'frame-bg');
assert.strictEqual(vars['--pd-cube-bg'], 'cube-bg');
```

测试上下文中的 `PT_buildCardVisualVars` 按 `selection` 返回可识别的 `frame-bg` 或 `cube-bg`，确保四项设置真实传入公共解析器。

- [ ] **Step 2: 运行图鉴外观测试确认失败**

Run:

```powershell
node 'PalToolbox/游戏内容/幻兽帕鲁/工具功能/帕鲁图鉴/通用逻辑/帕鲁图鉴外观设置.test.js'
```

Expected: FAIL，提示 `getAppearanceCssVars` 尚不存在。

- [ ] **Step 3: 实现唯一的外观变量解析函数**

在 `帕鲁图鉴通用.js` 增加 `getAppearanceCssVars(webSettings)`：读取 `getAppearanceSettings()`，分别调用两次 `PT_buildCardVisualVars` 获得 frame 和 cube，并返回现有 `--pd-frame-*` 与 `--pd-cube-*` 变量对象。将函数加入 `PT_PALDEX_COMMON` 返回对象。

函数缺少 `PT_buildCardVisualVars` 时返回空对象；默认主题仍按 `webSettings.theme → oceanic` 回退。

- [ ] **Step 4: 让帕鲁图鉴适配层消费公共变量**

把 `帕鲁图鉴网页.js` 的 `applyAppearanceVars()` 改为：

```js
var vars = common.getAppearanceCssVars(getWebSettings());
Object.keys(vars).forEach(function(name) {
    root.style.setProperty(name, vars[name]);
});
```

删除适配层内重复的 `PT_buildCardVisualVars` 调用和变量映射，现有变量名与 CSS 不变。

- [ ] **Step 5: 运行图鉴外观回归测试**

Run:

```powershell
node 'PalToolbox/游戏内容/幻兽帕鲁/工具功能/帕鲁图鉴/通用逻辑/帕鲁图鉴外观设置.test.js'
node 'PalToolbox/游戏内容/幻兽帕鲁/工具功能/帕鲁图鉴/网页模式适配/筛选栏布局.test.js'
```

Expected: 两项通过；帕鲁图鉴仍使用原有变量名、材质和筛选布局。

### Task 4: 用失败检查定义伙伴技能新卡片与筛选外观

**Files:**
- Create: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/网页模式适配/伙伴技能外观.test.js`
- Test: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/网页模式适配/伙伴技能外观.test.js`

- [ ] **Step 1: 建立静态结构与样式测试**

测试读取 `技能网页.js` 和 `技能网页样式.css`，断言：

```js
assert.ok(source.includes('getAppearanceCssVars'), '伙伴技能必须读取帕鲁图鉴公共外观变量');
assert.ok(source.includes('applyPartnerAppearanceVars'), '每次伙伴技能渲染后必须重新应用外观');
assert.ok(source.includes('renderPartnerDescription'), '伙伴技能说明必须按自然段渲染');
assert.ok(source.includes('sk-partner-card-grid'), '伙伴技能需要独立的可调边框网格');
assert.ok(source.includes('sk-partner-card'), '伙伴技能需要可调材质卡片');
assert.ok(!source.includes('style="border-left:4px solid #8b5cf6"'), '卡片不能固定紫色边框');
assert.ok(/\.sk-partner-card-grid\{[^}]*--pd-frame-bg/.test(css));
assert.ok(/\.sk-partner-card\{[^}]*--pd-cube-bg/.test(css));
assert.ok(/\.sk-partner-filter-sidebar\{[^}]*--pd-frame-bg/.test(css));
assert.ok(!css.includes('!important'));
```

- [ ] **Step 2: 运行并确认失败**

Run:

```powershell
node 'PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/网页模式适配/伙伴技能外观.test.js'
```

Expected: FAIL；公共外观调用、新卡片结构和变量样式尚不存在。

### Task 5: 实现伙伴技能可调卡片和设置式筛选栏

**Files:**
- Modify: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/网页模式适配/技能网页.js`
- Modify: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/样式/技能网页样式.css`
- Test: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/网页模式适配/伙伴技能外观.test.js`
- Test: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/网页模式适配/伙伴技能目录读取.test.js`

- [ ] **Step 1: 在伙伴技能适配层应用公共外观变量**

增加 `getPaldexCommon()`、`getWebSettings()` 和：

```js
function applyPartnerAppearanceVars(targetRoot) {
    var common = getPaldexCommon();
    if (!targetRoot || !common || typeof common.getAppearanceCssVars !== 'function') return;
    var page = targetRoot.querySelector('.pt-web-skill-page') || targetRoot;
    var vars = common.getAppearanceCssVars(getWebSettings());
    Object.keys(vars).forEach(function(name) {
        page.style.setProperty(name, vars[name]);
    });
}
```

将 `bind(root)` 开头改为先调用 `applyPartnerAppearanceVars(root)`，再判断是否已经绑定事件。这样首次打开、搜索重渲染和从设置页返回时都会刷新外观，事件仍只绑定一次。

- [ ] **Step 2: 按自然段渲染说明**

增加：

```js
function renderPartnerDescription(description) {
    return String(description || '').split(/\n+/).map(function(paragraph) {
        return paragraph.trim();
    }).filter(Boolean).map(function(paragraph) {
        return '<p class="sk-desc sk-partner-desc">' + paragraph + '</p>';
    }).join('');
}
```

卡片渲染改为调用该函数，石掌猿显示两个独立自然段，其他多行技能也获得相同效果。

- [ ] **Step 3: 调整伙伴技能卡片结构**

- 卡片增加 `sk-partner-card`，移除固定紫色内联边框。
- 结果网格使用 `sk-partner-card-grid`，外层承接帕鲁图鉴 frame 变量。
- 头像、帕鲁名、内部 ID、技能名、用途标签、说明和表格顺序保持不变。
- 不加入帕鲁图鉴的固定高度、侧壁 canvas 或拖拽展开事件。

- [ ] **Step 4: 让 CSS 消费同一组外观变量**

为网格、卡片和筛选栏增加帕鲁图鉴变量：

```css
.sk-partner-card-grid{
  background-image:var(--pd-frame-before-background),var(--pd-frame-metal-texture),var(--pd-frame-wood-texture),var(--pd-frame-bg);
  border:1px solid var(--pd-frame-border,rgba(255,255,255,.14));
  box-shadow:var(--pd-frame-metal-shadow,none),0 12px 30px rgba(0,0,0,.16);
}
.sk-partner-card{
  background-image:var(--pd-cube-before-background),var(--pd-cube-metal-texture),var(--pd-cube-wood-texture),var(--pd-cube-bg);
  border:1px solid var(--pd-cube-border,rgba(255,255,255,.14));
  backdrop-filter:blur(var(--pd-cube-blur,14px)) saturate(var(--pd-cube-saturate,1.22));
}
.sk-partner-filter-sidebar{
  background-image:var(--pd-frame-before-background),var(--pd-frame-metal-texture),var(--pd-frame-wood-texture),var(--pd-frame-bg);
  border-color:var(--pd-frame-border,rgba(255,255,255,.14));
}
```

同时把搜索、来源和用途分组做成设置页式分区：统一圆角、标题间距、轻分割线、整行选项与明显选中态。继续使用 `pt-filter-chip`，不修改六来源和筛选事件。

- [ ] **Step 5: 运行伙伴技能页面测试**

Run:

```powershell
node 'PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/网页模式适配/伙伴技能外观.test.js'
node 'PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/网页模式适配/伙伴技能目录读取.test.js'
node 'PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/核心/技能核心.test.js'
node 'PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/通用逻辑/伙伴技能等级表.test.js'
```

Expected: 四项通过；六来源、同项或/跨项且、动态数量、冷却持续时间和全部等级表保持不变。

### Task 6: 全量自动检查与浏览器验收

**Files:**
- Verify only; no new production files.

- [ ] **Step 1: 检查格式和数据生成稳定性**

Run:

```powershell
git diff --check
node '迁移验证/伙伴技能/更新伙伴技能数据.js' --check
node '迁移验证/伙伴技能/正式数据等级表.test.js'
node '迁移验证/伙伴技能/伙伴技能数据.test.js'
node '迁移验证/伙伴技能/伙伴技能分类.test.js'
node 'PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/网页模式适配/伙伴技能外观.test.js'
node 'PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/网页模式适配/伙伴技能目录读取.test.js'
node 'PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/核心/技能核心.test.js'
node 'PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/通用逻辑/伙伴技能等级表.test.js'
node 'PalToolbox/游戏内容/幻兽帕鲁/工具功能/帕鲁图鉴/通用逻辑/帕鲁图鉴外观设置.test.js'
node 'PalToolbox/游戏内容/幻兽帕鲁/工具功能/帕鲁图鉴/网页模式适配/伙伴技能详情读取.test.js'
```

Expected: 所有命令退出码为 0；`git diff --check` 无空白错误。

- [ ] **Step 2: 浏览器检查石掌猿**

1. 打开 `PalToolbox/入口页面/index.html`。
2. 点击“伙伴技能”。
3. 在“搜索帕鲁或技能”输入“石掌猿”。
4. 应看到两个自然段：自身攻击力提升 75～300%，玩家攀爬速度提升 50～100%。
5. 应同时看到攻击提升与攀爬速度两张 0～4 星表。

- [ ] **Step 3: 浏览器检查外观同步**

1. 记录当前帕鲁图鉴卡片与伙伴技能卡片外观。
2. 打开“设置 → 外观设置 → 帕鲁图鉴外观”。
3. 更换一次边框主题或材质，再更换一次卡片主题或材质。
4. 返回伙伴技能；卡片网格边框、伙伴技能卡片和筛选栏应同步变化。
5. 恢复验收前的设置值，避免留下测试配置。

- [ ] **Step 4: 浏览器检查筛选回归**

1. 清空石掌猿搜索。
2. 展开两个不同用途大类并各选一项，确认跨项为“且”。
3. 在同一筛选项内再选第二项，确认同行为“或”。
4. 确认六个来源仍可切换，已选条件可逐项移除和全部清空。
5. 把窗口缩窄至 900px 以下，筛选栏和结果区应改为单列，表格不得横向挤坏。

## 工作树注意事项

当前工作树已有与伙伴技能数据、分类和图鉴详情相关的未提交改动。执行时只修改本计划列出的职责，不使用重置、覆盖或整文件回退；完成后逐文件检查差异并单独汇报本批改动，不把既有改动误认成本次新增。
