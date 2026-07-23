# Palworld Partner Skill Taxonomy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有伙伴技能工具中落地九大类、六十二个下级分类、帕鲁头像、快速浏览和默认收起的“同时具备”组合筛选。

**Architecture:** 新增独立的标准分类 JSON 和纯计算分类核心；伙伴技能数据生成器负责校验并把分类与头像写入现有 `catalog` 生成索引。网页核心负责筛选，网页适配只负责状态、事件和 HTML，继续复用现有等级表与固定参数渲染。

**Tech Stack:** 原生 JavaScript、JSON、HTML 字符串模板、CSS、Node.js `assert` 测试。

---

## 文件结构

- 新建 `PalToolbox/游戏内容/幻兽帕鲁1.0/数据包/伙伴技能分类.json`：本站维护的分类树和逐帕鲁标签。
- 新建 `迁移验证/伙伴技能/伙伴技能分类核心.js`：校验分类、解析父子关系、装饰目录，不能操作页面。
- 新建 `迁移验证/伙伴技能/伙伴技能分类.test.js`：九大类、六十二小类、目录全覆盖和关键实例检查。
- 修改 `迁移验证/伙伴技能/伙伴技能数据核心.js`：把分类和头像合并进生成目录。
- 修改 `迁移验证/伙伴技能/更新伙伴技能数据.js`：读取标准分类文件并校验生成结果。
- 修改 `PalToolbox/游戏内容/幻兽帕鲁1.0/数据包/伙伴技能.json`：由更新程序重新生成。
- 修改 `PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/核心/技能核心.js`：增加纯筛选与分类查询接口。
- 修改 `PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/核心/技能核心.test.js`：验证快速单选和组合全包含。
- 修改 `PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/网页模式适配/技能网页.js`：渲染两层筛选、头像优先卡片和事件。
- 修改 `PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/网页模式适配/伙伴技能目录读取.test.js`：验证页面结构和旧详情保留。
- 修改 `PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/样式/技能网页样式.css`：伙伴技能筛选和卡片专用样式。
- 修改 `AGENTS.md`：结构地图补充伙伴技能标准分类入口。

### Task 1: 建立分类模型与失败测试

- [ ] **Step 1: 写分类核心的失败测试**

测试构造九大类、六十二个子类和两个目录项，要求 `validateClassification()` 拒绝重复标签、未知帕鲁和漏项，并要求 `decorateCatalog()` 产出 `usageCategoryIds`、`usageSubcategoryIds`、`usageTagIds`。

```js
assert.strictEqual(model.groups.length, 9);
assert.strictEqual(model.groups.reduce((n, group) => n + group.children.length, 0), 62);
assert.deepStrictEqual(decorated[0].usageTagIds, ['mount.ground', 'jump.multi', 'jump.double']);
assert.throws(() => validateClassification(broken, ['SheepBall']), /分类目录未覆盖/);
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node "迁移验证/伙伴技能/伙伴技能分类.test.js"`

Expected: FAIL，提示找不到 `伙伴技能分类核心` 或导出函数。

- [ ] **Step 3: 实现最小分类核心**

导出稳定接口：

```js
module.exports = {
    validateClassification,
    buildClassificationIndex,
    decorateCatalog
};
```

`validateClassification(data, catalogIds)` 收集并抛出全部结构错误；`buildClassificationIndex()` 建立大类、子类和精确标签索引；`decorateCatalog()` 只复制目录条目并附加分类数组，不修改输入。

- [ ] **Step 4: 运行分类核心测试确认通过**

Run: `node "迁移验证/伙伴技能/伙伴技能分类.test.js"`

Expected: PASS，输出“伙伴技能分类核心测试通过”。

### Task 2: 建立正式分类数据并覆盖全部目录

- [ ] **Step 1: 写正式数据完整性测试**

读取 `伙伴技能分类.json` 与现有 `伙伴技能.json`，验证九大类、六十二小类、每个目录项都有已审核分类或明确“无伙伴技能”状态，并锁定关键实例：

```js
assert.ok(tagsOf('SheepBall').includes('survival.shield'));
assert.ok(tagsOf('SheepBall').includes('base.ranch'));
assert.ok(tagsOf('FengyunDeeper').includes('mount.ground'));
assert.ok(tagsOf('FengyunDeeper').includes('jump.multi'));
assert.ok(tagsOf('BOSS_Sekhmet').includes('base.work_speed'));
```

- [ ] **Step 2: 运行测试确认正式数据尚不存在或不完整**

Run: `node "迁移验证/伙伴技能/伙伴技能分类.test.js"`

Expected: FAIL，指出缺少正式分类文件或目录漏项。

- [ ] **Step 3: 写入分类树和逐项分配**

分类文件使用以下稳定结构：

```json
{
  "meta": {
    "source": "本站人工用途分类，依据伙伴技能标准事实",
    "classifiedAt": "2026-07-22",
    "gameVersion": "v1.0.0",
    "classificationVersion": "1.0.0",
    "transformVersion": "1.4.0"
  },
  "groups": [],
  "detailTags": [],
  "assignments": {}
}
```

每个 `assignments[palId]` 包含 `subcategoryIds`、`tagIds` 和 `reviewStatus`。多用途技能保留全部标签；二段跳同时标记 `jump.multi` 与 `jump.double`，三段跳同时标记 `jump.multi` 与 `jump.triple`。

- [ ] **Step 4: 输出并逐项检查未覆盖、单标签异常和高频分类分布**

Run: `node "迁移验证/伙伴技能/伙伴技能分类.test.js" --report`

Expected: 未覆盖 0、未知标签 0，并打印每个大类和子类的数量；空伙伴技能只能是明确的 `no-partner-skill`。

### Task 3: 把分类与头像接入生成目录

- [ ] **Step 1: 扩展生成器测试并确认失败**

在 `伙伴技能数据.test.js` 的小型 fixture 中传入分类和头像，断言目录项包含：

```js
assert.strictEqual(built.catalog[0].iconFile, 'T_Base_icon_normal.png');
assert.deepStrictEqual(built.catalog[0].usageCategoryIds, ['move']);
assert.deepStrictEqual(built.catalog[0].usageSubcategoryIds, ['move.mount']);
assert.deepStrictEqual(built.catalog[0].usageTagIds, ['mount.ground']);
assert.ok(built.taxonomy.groups.length === 9);
```

Run: `node "迁移验证/伙伴技能/伙伴技能数据.test.js"`

Expected: FAIL，目录尚未输出分类与头像。

- [ ] **Step 2: 最小修改生成核心**

`buildPartnerSkillData(options)` 接收 `classification`，目录初步生成并排序后调用 `decorateCatalog()`；头像只从 `palsById[palId].头像文件` 读取。输出根对象增加只读 `taxonomy`，不修改 `partnerSkills` 和 `internalParameters` 的既有字段。

- [ ] **Step 3: 修改更新程序并重新生成**

读取 `数据包/伙伴技能分类.json`，将分类传给生成核心，把转换版本提升到 `1.4.0`，并在 `validateData()` 中检查目录分类数组和头像字段。

Run: `node "迁移验证/伙伴技能/更新伙伴技能数据.js"`

Expected: 输出目录数量和分类覆盖数量，生成成功。

- [ ] **Step 4: 运行数据回归测试**

Run:

```powershell
node "迁移验证/伙伴技能/伙伴技能数据.test.js"
node "迁移验证/伙伴技能/正式数据等级表.test.js"
node "迁移验证/伙伴技能/更新伙伴技能数据.js" --check
```

Expected: 三项均通过，旧等级表、Boss 差异和月亮领主“无伙伴技能”断言不回退。

### Task 4: 在网页核心实现可复用筛选

- [ ] **Step 1: 写失败测试**

给 `技能核心.test.js` 增加带标签的三条伙伴技能，断言：

```js
assert.deepStrictEqual(core.filterPartnerSkills({ sourceCategory: '普通帕鲁', subcategoryId: 'base.ranch' }).map(x => x.id), ['SheepBall']);
assert.deepStrictEqual(core.filterPartnerSkills({ requiredTagIds: ['mount.ground', 'jump.multi'] }).map(x => x.id), ['FengyunDeeper']);
assert.deepStrictEqual(core.getPartnerTaxonomy().groups.map(x => x.id), ['move', 'combat', 'player_damage', 'pal_combat', 'survival', 'capture', 'resource', 'base', 'utility']);
```

Run: `node "PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/核心/技能核心.test.js"`

Expected: FAIL，筛选接口不存在。

- [ ] **Step 2: 实现纯筛选接口**

`setPartnerSkillData()` 保存 taxonomy、分类数组和头像；新增：

```js
function filterPartnerSkills(filters) { /* 来源、搜索、快速分类、requiredTagIds 全包含 */ }
function getPartnerTaxonomy() { return JSON.parse(JSON.stringify(partnerTaxonomy)); }
```

搜索范围包含帕鲁名、技能名、描述和分类中文名；组合筛选用 `requiredTagIds.every()`，不实现隐藏的组内“或”。

- [ ] **Step 3: 运行核心测试确认通过**

Run: `node "PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/核心/技能核心.test.js"`

Expected: PASS，输出“技能核心测试通过”。

### Task 5: 实现视频友好的网页界面

- [ ] **Step 1: 写网页结构失败测试**

要求源码包含九大类容器、当前大类下级项、`data-sk-partner-advanced` 收起按钮、`data-sk-partner-required-tag` 组合项、条件摘要、伙伴头像和先帕鲁后技能的卡片结构；继续断言 `renderPartnerFixedParameters` 与 `renderPartnerRankTables` 存在。

Run: `node "PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/网页模式适配/伙伴技能目录读取.test.js"`

Expected: FAIL，新的筛选入口和头像结构尚不存在。

- [ ] **Step 2: 接入统一核心而不复制筛选逻辑**

网页状态只保存：

```js
var partnerUsageCategory = 'all';
var partnerUsageSubcategory = 'all';
var partnerAdvancedOpen = false;
var partnerRequiredTags = [];
```

`renderPartner()` 调用 `PT_SKILL_CORE.setPartnerSkillData(raw)` 和 `filterPartnerSkills()`；来源、大类、下级分类为快速单选。组合筛选按钮只控制区域展开，勾选标签后生成“同时具备：地面骑乘、多段跳”的摘要。

- [ ] **Step 3: 调整卡片信息顺序**

卡片头部结构固定为：

```html
<div class="sk-partner-pal">
  <img class="sk-partner-avatar" loading="lazy" alt="">
  <div><strong class="sk-partner-pal-name">帕鲁名</strong><div class="sk-partner-skill-name">伙伴技能：技能名</div></div>
</div>
```

随后渲染当前相关标签、描述、`renderPartnerFixedParameters()` 和 `renderPartnerRankTables()`。

- [ ] **Step 4: 添加专用样式并验证窄屏**

样式使用已有颜色变量，不使用 `!important`，不在文件末尾追加覆盖旧实现；直接调整伙伴技能相关规则。大类和下级分类允许换行，结果网格最小宽度保持 280px，头像固定 48px。

- [ ] **Step 5: 运行网页与样式测试**

Run:

```powershell
node "PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/网页模式适配/伙伴技能目录读取.test.js"
node "PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/通用逻辑/伙伴技能等级表.test.js"
```

Expected: PASS，等级表渲染测试不回退。

### Task 6: 结构地图与整体验证

- [ ] **Step 1: 更新结构地图**

在 `AGENTS.md` 的“幻兽帕鲁1.0”说明中补充“伙伴技能标准分类”，说明它是正式分类入口；不枚举测试和生成文件。

- [ ] **Step 2: 运行全部相关自动检查**

Run:

```powershell
node "迁移验证/伙伴技能/伙伴技能分类.test.js"
node "迁移验证/伙伴技能/伙伴技能数据.test.js"
node "迁移验证/伙伴技能/正式数据等级表.test.js"
node "迁移验证/伙伴技能/更新伙伴技能数据.js" --check
node "PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/核心/技能核心.test.js"
node "PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/网页模式适配/伙伴技能目录读取.test.js"
node "PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/通用逻辑/伙伴技能等级表.test.js"
```

Expected: 全部退出码 0。

- [ ] **Step 3: 浏览器肉眼验证**

打开本地网站进入“伙伴技能”：确认卡片先显示头像和帕鲁名；点击“放牧与据点经营 → 放牧产物与挖掘”；再打开组合筛选选择“地面骑乘、多段跳”；切换六项来源；展开带等级表的技能。预期筛选数量同步变化，组合结果只包含同时具备标签的记录，旧等级表、冷却时间和持续时间仍完整显示。

- [ ] **Step 4: 检查改动边界**

Run: `git status --short` 和 `git diff --stat`

Expected: 只包含本计划列出的分类、伙伴技能、测试、结构地图及先前用户已有修改；不得覆盖或回退无关文件。
