# 伙伴技能筛选与详情交互实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修正左侧重复阴影，为筛选分组增加下拉动画，将所有筛选项统一为“且”，并增加默认关闭的详情表格开关。

**Architecture:** 筛选交集继续由技能核心负责，网页适配只保存选中状态和详情开关。折叠分组始终保留内容节点，由网页适配在原节点上切换状态，CSS 使用共享下拉框的时长和缓动；动画期间仅刷新左侧小型孔洞遮罩。

**Tech Stack:** HTML 字符串模板、原生 JavaScript、CSS、Node.js `assert`

---

### Task 1: 所有筛选项统一为交集

**Files:**
- Modify: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/核心/技能核心.js`
- Test: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/核心/技能核心.test.js`

- [ ] **Step 1: 写入失败检查**

将同行的“地面骑乘 + 飞行骑乘”期望值改成只返回同时具备两项的测试资料，并增加动态数量必须保留当前同行选择的断言。

- [ ] **Step 2: 运行检查并确认失败**

Run:

```powershell
node 'PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/核心/技能核心.test.js'
```

Expected: 同行仍按“或”返回并集，断言失败。

- [ ] **Step 3: 实现最小交集逻辑**

将 `matchesPartnerFacetSelections` 中同一筛面的 `some` 改为 `every`；每个选项内部的同义能力编号仍使用 `some`。修改 `getPartnerFacetCounts`，计算候选项时保留当前筛面的已有选择并追加候选项。

- [ ] **Step 4: 运行核心检查**

Expected: `技能核心测试通过`。

### Task 2: 详情开关、折叠动画与阴影修正

**Files:**
- Modify: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/网页模式适配/技能网页.js`
- Modify: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/样式/技能网页样式.css`
- Test: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/网页模式适配/伙伴技能外观.test.js`
- Test: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/网页模式适配/伙伴技能目录读取.test.js`

- [ ] **Step 1: 写入失败检查**

检查以下行为：

```js
source.includes('partnerShowDetails')
source.includes('data-sk-partner-toggle-details')
source.includes('animatePartnerFilterGroup')
!source.includes('同项为“或”')
!css.match(/\.sk-partner-filter-stack::after\{[^}]*box-shadow/)
css.includes('160ms cubic-bezier(0.16,1,0.3,1)')
```

- [ ] **Step 2: 运行外观与目录检查并确认失败**

Run:

```powershell
node 'PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/网页模式适配/伙伴技能外观.test.js'
node 'PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/网页模式适配/伙伴技能目录读取.test.js'
```

Expected: 详情状态、动画和全“且”说明尚不存在。

- [ ] **Step 3: 实现详情开关**

增加默认值为 `false` 的 `partnerShowDetails`。只有该值为真时才调用固定参数表和等级表渲染器。结果顶部渲染 `data-sk-partner-toggle-details` 按钮，点击后切换状态并重新渲染。

- [ ] **Step 4: 实现原地折叠动画**

始终渲染分组内容壳层。点击分组时不重新渲染整页，只切换当前分组类名、`aria-expanded` 和图标；使用 `requestAnimationFrame` 在 180ms 内刷新左侧孔洞，结束后再执行一次最终刷新。

- [ ] **Step 5: 修正阴影和筛选文案**

删除左侧孔洞层的 `box-shadow`，由最外层浏览器继续负责整体阴影。删除“同项为或”，顶部统一显示“所选条件必须全部满足”。

- [ ] **Step 6: 运行外观与目录检查**

Expected: 两项检查均通过。

### Task 3: 完整验证

**Files:**
- Verify only

- [ ] **Step 1: 浏览器肉眼验证**

打开 `入口页面/index.html`，进入“伙伴技能”：

1. 木板材质下左栏不再出现整块暗影。
2. 点开和收起任意用途大类，内容在约 160ms 内展开或折叠。
3. 默认没有表格；点击“展示详情”后出现冷却、持续时间、星级和放牧等级表，再次点击后隐藏。
4. 同时选择同行与跨行条件，结果只保留满足全部选项的帕鲁。

- [ ] **Step 2: 运行全部相关检查**

运行伙伴技能数据、分类、核心、外观、目录、等级表、图鉴详情读取检查及 `git diff --check`，预期全部退出码为 0。
