# Palworld Partner Skill Data Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task. Subagents are unavailable in this environment, so execute inline.

**Goal:** 将 PalDB 中文伙伴技能整理为本站标准事实，让帕鲁图鉴按帕鲁记录完整展示，让伙伴技能工具仅遍历去重目录，并让两个入口都提供六项并列分类筛选。

**Architecture:** 原始 HTML 和现有解包记录作为转换输入；Node.js 转换核心输出一个带 `partnerSkills`、`internalParameters`、`catalog` 和 `conflicts` 的正式 JSON。图鉴核心按 id 读取全量事实并按原始分类映射六项筛选，伙伴技能网页适配层按 catalog 取数和筛选。

**Tech Stack:** Node.js 内置 `fs`、`path`、`https/fetch`，原生 JavaScript，PowerShell 迁移检查。

---

### Task 1: 建立 HTML 解析和生成规则的失败检查

**Files:**
- Create: `迁移验证/伙伴技能/伙伴技能数据.test.js`
- Create: `迁移验证/伙伴技能/测试资料/普通列表片段.html`
- Create: `迁移验证/伙伴技能/测试资料/Boss详情片段.html`
- Test: `迁移验证/伙伴技能/伙伴技能数据.test.js`

1. 写测试，要求解析器提取帕鲁链接、帕鲁名、图鉴号、技能名和保留换行的纯文本描述。
2. 写测试，要求详情页能按特殊帕鲁 id 提取 Boss 描述。
3. 写生成器测试，要求图鉴事实保留重复 Boss，目录只保留差异 Boss，并去掉相同 `_2` 记录。
4. Run: `node 迁移验证/伙伴技能/伙伴技能数据.test.js`
5. 确认因缺少转换核心而失败。

### Task 2: 实现可重复的抓取与转换核心

**Files:**
- Create: `迁移验证/伙伴技能/伙伴技能数据核心.js`
- Create: `迁移验证/伙伴技能/更新伙伴技能数据.js`
- Modify: `迁移验证/伙伴技能/伙伴技能数据.test.js`

1. 实现 HTML 实体解码、标签清理、普通卡片解析和特殊详情卡片解析。
2. 实现本站帕鲁与 299 个 PalDB 普通记录的名称对应。
3. 实现内部参数签名、原型查找、差异判定和目录去重。
4. 实现 `--fetch` 抓取模式和默认的离线生成模式；离线生成不访问外网。
5. Run: `node 迁移验证/伙伴技能/伙伴技能数据.test.js`
6. 确认解析和生成规则全部通过。

### Task 3: 获取 PalDB 原始来源并生成正式数据

**Files:**
- Create: `PalToolbox/游戏内容/幻兽帕鲁1.0/原始来源/伙伴技能/来源.json`
- Create: `PalToolbox/游戏内容/幻兽帕鲁1.0/原始来源/伙伴技能/paldb-partner-skill.html`
- Create: `PalToolbox/游戏内容/幻兽帕鲁1.0/原始来源/伙伴技能/详情/*.html`
- Create: `PalToolbox/游戏内容/幻兽帕鲁1.0/原始来源/伙伴技能/本地解包伙伴技能-2026-07-06.json`
- Modify: `PalToolbox/游戏内容/幻兽帕鲁1.0/数据包/伙伴技能.json`

1. Run: `node 迁移验证/伙伴技能/更新伙伴技能数据.js --fetch`
2. 检查来源清单包含 PalDB URL、获取日期 `2026-07-22`、游戏版本 `v1.0.0` 和转换版本。
3. Run: `node 迁移验证/伙伴技能/更新伙伴技能数据.js --check`
4. 确认 299 个普通帕鲁一一对应、全量事实覆盖本站帕鲁 id、目录无错误重复。

### Task 4: 让两个现有入口各自读取正确数据并提供六项筛选

**Files:**
- Modify: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/帕鲁图鉴/核心/帕鲁图鉴核心.test.js`
- Modify: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/帕鲁图鉴/网页模式适配/帕鲁图鉴网页.js`
- Modify: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/核心/技能核心.test.js`
- Modify: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/核心/技能核心.js`
- Modify: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/网页模式适配/技能网页.js`

1. 先扩展图鉴核心测试，证明 Boss id 能读到自己的技能名和完整描述。
2. 先扩展技能核心测试，证明传入 catalog 后不会遍历被排除的重复 Boss。
3. Run 两个核心测试，确认新断言先失败。
4. 最小修改核心和网页适配层：图鉴用 `partnerSkills[id]`，伙伴技能工具用 `catalog`。
5. 增加筛选测试：两个页面都显示普通帕鲁、石板Boss、塔主Boss、Boss、狂暴化、其他；图鉴普通类合并基础、亚种和泰拉瑞亚并把泰拉瑞亚排在末尾，不再显示子分类。
6. 实现两个页面的六项筛选，伙伴技能特殊类继续服从 catalog 的差异去重结果。
7. Run 两个核心测试和两个筛选测试，确认通过。

### Task 5: 同步结构地图和全量验证

**Files:**
- Modify: `AGENTS.md`
- Modify: `迁移验证/1.0数据资源结构.test.ps1`

1. 先增加数据结构检查，要求原始来源、四个正式数据区块和元数据存在，并确认失败。
2. 更新 AGENTS.md 结构地图，标明 `幻兽帕鲁1.0` 包含正式数据与原始来源。
3. Run:
   - `node 迁移验证/伙伴技能/伙伴技能数据.test.js`
   - 所有技能和帕鲁图鉴 `*.test.js`
   - `powershell -ExecutionPolicy Bypass -File 迁移验证/1.0数据资源结构.test.ps1`
   - `powershell -ExecutionPolicy Bypass -File 迁移验证/迁移完整性.test.ps1`
   - `git diff --check`
4. 本地打开 `PalToolbox/入口页面/index.html`，逐项点击两个页面的六类筛选，并肉眼检查棉悠悠、塞赫麦特、塔主荷鲁斯、月亮领主手部，以及伙伴技能页的去重结果。

### Task 6: 复核与收尾

1. 使用 `verification-before-completion` 重跑验证并核对输出。
2. 使用 `requesting-code-review` 检查数据边界、重复策略和不相关改动。
3. 使用 `finishing-a-development-branch` 完成分支收尾，不发布网站。
