# 伙伴技能固定分面筛选 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用一套固定侧栏完成伙伴技能的快速浏览与跨类别组合查询，并修正玩家机动、骑乘跳跃和多段跳的分类语义。

**Architecture:** 分类事实继续保存在 `伙伴技能分类.json`；其中新增筛面定义，把“同一筛面按或、不同筛面按且”的关系变成数据。技能核心负责规范化筛面、执行纯筛选与计算选项数量，网页适配层只维护选择状态和渲染固定侧栏，生成程序继续把标准分类写入网站数据包。

**Tech Stack:** 原生 JavaScript、HTML 字符串模板、CSS、Node.js `assert` 测试、JSON 数据生成脚本。

---

### Task 1: 修正移动分类事实与筛面定义

**Files:**
- Modify: `PalToolbox/游戏内容/幻兽帕鲁1.0/数据包/伙伴技能分类.json`
- Modify: `迁移验证/伙伴技能/伙伴技能分类核心.js`
- Modify: `迁移验证/伙伴技能/伙伴技能分类核心.test.js`
- Modify: `迁移验证/伙伴技能/伙伴技能分类.test.js`

- [ ] **Step 1: 写入会失败的分类检查**

在分类测试中明确断言：

```js
assert.ok(!classification.detailTags.some(function(tag) { return tag.id === 'jump.multi'; }));
assert.ok(hasSubcategory('GrassRabbitMan', 'move.player_mobility'));
assert.ok(hasSubcategory('LongCat', 'move.player_mobility'));
assert.ok(hasTag('FengyunDeeper', 'jump.double'));
assert.ok(hasTag('SaintCentaur', 'jump.triple'));
assert.ok(hasTag('YakushimaMonster001', 'jump.high'));
assert.ok(!hasTag('GrassRabbitMan', 'jump.double'));
```

分类核心测试增加 `facets` 引用合法性、选项不可跨错大类、能力编号必须存在的断言。

- [ ] **Step 2: 运行检查并确认旧数据失败**

Run:

```powershell
node '迁移验证/伙伴技能/伙伴技能分类核心.test.js'
node '迁移验证/伙伴技能/伙伴技能分类.test.js'
```

Expected: FAIL，原因包括仍存在 `jump.multi`、缺少 `move.player_mobility` / `jump.high` 与筛面定义。

- [ ] **Step 3: 人工写入已经确认的移动分类**

把旧 `move.jump` 拆为：

```json
[
  { "id": "move.riding_jump", "label": "骑乘跳跃" },
  { "id": "move.player_mobility", "label": "玩家机动" }
]
```

删除 `jump.multi`；把精确标签整理为 `jump.double`（骑乘二段跳）、`jump.triple`（骑乘三段跳）、`jump.high`（骑乘高跳）。踏春兔和喵璐璐只归 `move.player_mobility`；武道蛙与极道蛙并入宽泛的 `move.special`，不为一种能力另建筛选项；19 个骑乘时跳跃能力生效的记录归 `move.riding_jump`，其中 10 个按二/三段跳标精确标签，9 个标 `jump.high`。

加入移动组的三个筛面：

```json
[
  { "id": "move.mode", "groupId": "move", "label": "移动方式" },
  { "id": "move.jump_type", "groupId": "move", "label": "骑乘跳跃" },
  { "id": "move.other", "groupId": "move", "label": "其他移动" }
]
```

其余八个用途大类默认各自形成一个筛面。`move.mount` 与 `move.riding_jump` 作为卡片语义父类保留，但不直接生成重复筛选项；地面/飞行/水上、二段/三段/高跳由精确标签直接进入对应筛面。

- [ ] **Step 4: 让分类核心验证新的结构**

分类核心需要从实际 `groups[].children` 计算数量，不再硬编码 64；同时检查 `facets[].groupId`、子分类和标签的 `facetId` 都指向有效筛面，并继续检查全部 assignment 引用。

- [ ] **Step 5: 运行分类检查**

Run:

```powershell
node '迁移验证/伙伴技能/伙伴技能分类核心.test.js'
node '迁移验证/伙伴技能/伙伴技能分类.test.js'
```

Expected: 两项均 PASS，且输出 9 个大类、65 个下级分类、6 个精确标签。

### Task 2: 用核心层实现固定分面筛选

**Files:**
- Modify: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/核心/技能核心.test.js`
- Modify: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/核心/技能核心.js`

- [ ] **Step 1: 写同面“或”、跨面“且”的失败测试**

测试夹具至少包含地面二段跳、地面三段跳、飞行二段跳、玩家机动和战斗追击。断言：

```js
core.filterPartnerSkills({
  facetSelections: {
    'move.mode': ['mount.ground'],
    'move.jump_type': ['jump.double', 'jump.triple']
  }
});
```

只返回地面二段跳和地面三段跳；`move.mode` 同时选择地面与飞行时返回二者并集。再断言跨“移动方式”和“战斗方式”只返回同时具备两类能力的记录。

- [ ] **Step 2: 运行核心检查并确认失败**

Run: `node 'PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/核心/技能核心.test.js'`

Expected: FAIL，因为旧核心没有 `facetSelections` 与筛面清单/计数能力。

- [ ] **Step 3: 实现纯筛面核心**

核心新增并导出：

```js
getPartnerFacetGroups()
getPartnerFacetCounts(filters)
filterPartnerSkills({ sourceCategory, query, facetSelections })
```

每个技能先把 `usageSubcategoryIds` 与 `usageTagIds` 合成能力集合；每个已选筛面用 `some()` 命中任一能力，全部筛面再用 `every()` 同时成立。计数时忽略当前选项所在筛面的选择，只保留来源、搜索和其他筛面条件，再试加该选项。

删除旧的 `requiredCapabilityIds`、`requiredTagIds`、单选 `usageCategoryId/subcategoryId/detailTagId` 分支，避免两套逻辑并存。

- [ ] **Step 4: 运行核心检查**

Run: `node 'PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/核心/技能核心.test.js'`

Expected: PASS，覆盖同面 OR、跨面 AND、来源、搜索和动态计数。

### Task 3: 替换伙伴技能页旧筛选界面

**Files:**
- Modify: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/网页模式适配/伙伴技能目录读取.test.js`
- Modify: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/网页模式适配/技能网页.js`
- Modify: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/样式/技能网页样式.css`

- [ ] **Step 1: 写固定侧栏结构的失败检查**

断言源码具备：

```js
assert.ok(source.includes('data-sk-partner-facet-option'));
assert.ok(source.includes('data-sk-partner-filter-search'));
assert.ok(source.includes('data-sk-partner-remove-filter'));
assert.ok(source.includes('data-sk-partner-clear-filters'));
assert.ok(source.includes('partnerFacetSelections'));
assert.ok(!source.includes('data-sk-partner-advanced'));
assert.ok(!source.includes('requiredCapabilityIds'));
```

CSS 检查固定侧栏、折叠分组、已选条件区和窄屏单列布局，继续保留 48px 头像检查。

- [ ] **Step 2: 运行目录读取检查并确认失败**

Run: `node 'PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/网页模式适配/伙伴技能目录读取.test.js'`

Expected: FAIL，因为页面仍渲染独立组合筛选和三级单选条。

- [ ] **Step 3: 替换状态与事件**

状态改为：

```js
var partnerFacetSelections = {};
var partnerFilterSearchQ = '';
var partnerExpandedGroups = { move: true };
```

同一个筛面按钮只切换对应数组元素；展开大类、筛选项搜索、顶部移除单项与全部清空都修改同一份状态。切换帕鲁来源只更新来源，不清空能力选择。

- [ ] **Step 4: 渲染固定分面侧栏与自然语言摘要**

页面结构为“固定筛选侧栏 + 结果区”。侧栏依次显示来源、筛选项搜索、九个用途折叠组及每个筛面；按钮显示核心返回的动态数量。结果区上方显示已选标签和摘要，摘要用“同一筛面用或、不同筛面用同时”的句式。

没有结果时保留侧栏并显示清空入口；选项数量为 0 时降低视觉权重但仍可点击。

- [ ] **Step 5: 原位替换旧样式**

删除 `.sk-partner-advanced-panel`、旧搜索按钮同行和旧三级筛选样式，新增固定双栏、折叠组、筛面选项、已选条件和响应式样式；不使用 `!important`，不在文件末尾用重复选择器覆盖旧实现。

- [ ] **Step 6: 运行页面结构检查**

Run: `node 'PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/网页模式适配/伙伴技能目录读取.test.js'`

Expected: PASS，且源码中不再出现独立组合筛选状态或入口。

### Task 4: 生成正式数据并完成回归验证

**Files:**
- Modify (generated): `PalToolbox/游戏内容/幻兽帕鲁1.0/数据包/伙伴技能.json`
- Verify: `迁移验证/伙伴技能/*.test.js`

- [ ] **Step 1: 重新生成网站数据包**

Run: `node '迁移验证/伙伴技能/更新伙伴技能数据.js'`

Expected: 生成完成，无冲突，catalog 带有更新后的 taxonomy 和人工分类索引。

- [ ] **Step 2: 运行伙伴技能全套自动检查**

Run:

```powershell
Get-ChildItem -LiteralPath '迁移验证/伙伴技能' -Filter '*.test.js' | ForEach-Object { node $_.FullName; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }
node 'PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/核心/技能核心.test.js'
node 'PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/网页模式适配/伙伴技能目录读取.test.js'
node 'PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/通用逻辑/伙伴技能等级表.test.js'
```

Expected: 全部 PASS。

- [ ] **Step 3: 浏览器肉眼验证**

打开网站伙伴技能页，选择“普通帕鲁 → 地面骑乘 → 骑乘二段跳 + 骑乘三段跳”。应看到地面坐骑中任意一种跳跃类型；摘要明确表达“地面骑乘，同时（二段跳或三段跳）”。再同时选择“飞行骑乘”，结果扩展为地面或飞行，而非只剩同时具备两种方式的帕鲁。

展开另一个大类并选择战斗条件，应与移动条件取交集。搜索“玩家机动”应能直接看到该选项，选择后普通帕鲁中应包含踏春兔和喵璐璐，二者不出现在骑乘二段跳/三段跳里。

- [ ] **Step 4: 检查改动边界**

Run: `git diff --check`，并逐文件检查只包含伙伴技能分类、核心筛选、页面适配、样式、生成数据、测试和本计划。不要暂存或覆盖工作区内其他用户改动。

用户已经要求直接在本会话落地，因此执行阶段采用 Inline Execution。
