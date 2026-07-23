# 伙伴技能统一外框实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 恢复伙伴技能同行等高，让左右筛选区与结果区共用一张外框，并复用 Dock 自绘滚动条避免宽度跳变。

**Architecture:** `.sk-partner-browser` 作为唯一外框宿主，遮罩从左侧独立筛选瓦片、右侧可见卡片和结果信息块的实际矩形生成。左右滚动时按动画帧刷新可见孔洞；原生滚动条彻底隐藏，自绘滚动条覆盖固定预留槽位。

**Tech Stack:** 原生 HTML、CSS、JavaScript，现有 `PT_initCustomScrollbars` 与帕鲁图鉴 SVG 遮罩方式。

---

### Task 1: 建立外观回归检查

**Files:**
- Modify: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/网页模式适配/伙伴技能外观.test.js`
- Modify: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/核心/技能核心.test.js`

- [ ] 添加断言：卡片网格使用 `align-items:stretch`，槽位和卡片高度为 `100%`。
- [ ] 添加断言：唯一遮罩宿主是 `.sk-partner-browser::after`。
- [ ] 添加断言：左栏不存在整栏挖空，遮罩读取 `.sk-partner-sidebar-block` 与 `.sk-partner-filter-group`。
- [ ] 添加断言：左栏隐藏原生滚动条并为自绘滚动条保留固定右侧空间。
- [ ] 删除最短列布局测试，运行两个测试并确认因旧实现失败。

### Task 2: 恢复同行等高并删除最短列布局

**Files:**
- Modify: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/核心/技能核心.js`
- Modify: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/网页模式适配/技能网页.js`
- Modify: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/样式/技能网页样式.css`

- [ ] 删除 `calculatePartnerMasonryLayout` 及其导出。
- [ ] 把结果区恢复为响应式网格，同行槽位和卡片使用同一行高。
- [ ] 删除绝对定位、逐列坐标和网格内联高度。
- [ ] 运行核心与外观测试，确认同行等高断言通过。

### Task 3: 统一左右外框和独立孔洞

**Files:**
- Modify: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/网页模式适配/技能网页.js`
- Modify: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/样式/技能网页样式.css`

- [ ] 将 SVG 遮罩写入 `.sk-partner-browser`。
- [ ] 对左侧搜索块、来源块、筛选搜索块和每个功能分类逐项测量。
- [ ] 对右侧结果信息块、可见卡片和空结果逐项测量。
- [ ] 将洞口裁切到各自滚动视口，避免滚动内容在视口外继续挖洞。
- [ ] 在左右滚动和窗口缩放时按动画帧刷新遮罩。
- [ ] 运行外观测试，确认旧的左栏整圈挖空和右栏独立外框已删除。

### Task 4: 复用 Dock 自绘滚动条

**Files:**
- Modify: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/网页模式适配/技能网页.js`
- Modify: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/样式/技能网页样式.css`

- [ ] 删除覆盖全局规则的 `scrollbar-width:thin`。
- [ ] 同时为 Firefox、Chromium 隐藏原生滚动条。
- [ ] 给筛选栏右侧保留固定内边距，自绘滚动条显隐时内容宽度不变。
- [ ] 每次重绘后调用 `PT_initCustomScrollbars` 刷新现有 Dock 滚动条。

### Task 5: 完整验证

**Files:**
- Test: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/网页模式适配/伙伴技能外观.test.js`
- Test: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/核心/技能核心.test.js`

- [ ] 运行伙伴技能数据、分类、核心、等级表、目录读取和外观测试。
- [ ] 在页面打开伙伴技能，确认同行等高且左右外框连续。
- [ ] 展开和收起“探索与便利功能”，确认只改变对应孔洞。
- [ ] 让左栏分别出现和隐藏滚动条，确认右侧列宽及孔洞坐标不变。
- [ ] 滚动左右两栏，确认可见卡片和筛选瓦片始终与孔洞贴合。
- [ ] 运行 `git diff --check`。
