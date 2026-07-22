# 幻兽帕鲁 1.0 数据与资源整理实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将仍在使用的版本数据和图片统一迁入 `幻兽帕鲁1.0`，删除已替代内容，并保证网站全部引用继续有效。

**Architecture:** 用 1.0 JSON 的资源字段作为正式分类依据，用一次性整理脚本执行可重复的移动、去重和待确认归档。程序继续位于无版本目录，通过更新后的路径读取 1.0 数据与资源；自动检查负责阻止旧路径、错放图片和缺失资源重新出现。

**Tech Stack:** PowerShell、原生 JavaScript、Node.js、HTML、JSON

---

### Task 1: 建立数据与资源结构检查

**Files:**
- Create: `迁移验证/1.0数据资源结构.test.ps1`

- [x] **Step 1: 写出失败检查**

检查脚本读取 `帕鲁.json`、`物品.json`、`建筑.json`，验证各自的 `头像文件` 或 `图标文件` 位于正确正式目录；检查 `PalToolbox` 运行文件不再包含 `幻兽帕鲁/数据包`、`资源包/图标资源包`、`资源包/地图瓦片`；检查旧资源包不存在、新地图两套瓦片各为 340 张、物品正式目录没有帕鲁或建筑错放文件、明确 NPC 不在帕鲁正式目录。

- [x] **Step 2: 运行并确认旧结构使检查失败**

Run: `powershell -ExecutionPolicy Bypass -File 迁移验证/1.0数据资源结构.test.ps1`

Expected: FAIL，首先报告旧数据目录或旧资源目录仍存在。

### Task 2: 迁移数据并清除废弃入口

**Files:**
- Move: `PalToolbox/游戏内容/幻兽帕鲁/数据包/工作速度计算器数据.js` → `PalToolbox/游戏内容/幻兽帕鲁1.0/数据包/工作速度计算器数据.js`
- Delete: `PalToolbox/游戏内容/幻兽帕鲁/数据包/物品数据.js`
- Delete: `PalToolbox/游戏内容/幻兽帕鲁/数据包/装备数据.js`
- Delete: `PalToolbox/游戏内容/幻兽帕鲁/数据包/建筑数据.js`
- Modify: `PalToolbox/入口页面/index.html`
- Modify: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/工作速度计算器/核心/工作速度计算核心.js`
- Modify: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/工作速度计算器/通用逻辑/工作速度通用逻辑.js`

- [x] **Step 1: 移动仍使用的数据并删除三份废弃数据**

使用 PowerShell 的 `Move-Item -LiteralPath` 和 `Remove-Item -LiteralPath` 操作已核对的四个明确文件；移动后删除空的旧数据目录。

- [x] **Step 2: 替换加载路径**

入口只保留：

```html
<script src="../游戏内容/幻兽帕鲁1.0/数据包/工作速度计算器数据.js"></script>
```

两个 Node 兼容入口改为：

```js
require('../../../../幻兽帕鲁1.0/数据包/工作速度计算器数据.js').PT_WORK_SPEED_DATA
```

- [x] **Step 3: 运行工作速度相关检查**

Run: `node PalToolbox/游戏内容/幻兽帕鲁/工具功能/工作速度计算器/核心/工作速度计算核心.js`

Expected: 模块成功读取新位置的数据并以退出码 0 结束。

### Task 3: 机械整理图片资源

**Files:**
- Create: `迁移验证/整理1.0数据资源.ps1`
- Move/Delete: `PalToolbox/游戏内容/幻兽帕鲁/资源包/**`
- Move/Delete: `PalToolbox/游戏内容/幻兽帕鲁1.0/资源包/**`

- [x] **Step 1: 编写可重复执行的整理脚本**

脚本必须先解析三个正式 JSON，再按以下顺序处理：

1. 壁纸移动到 `幻兽帕鲁/界面资源/壁纸`。
2. `新帕鲁` 与根目录同名同内容时删除副本；内容不同时将子目录版本改名移入 `帕鲁头像待确认`。
3. 物品目录内被帕鲁或建筑数据认领的图片移动到正确分类；正确分类已有同内容文件时只删除错放副本，不同内容时保留到目标分类待确认目录。
4. 帕鲁正式目录中没有被帕鲁数据认领、且文件名带明确人类或职业标识的图片移动到 `人物头像`；其余额外文件进入 `帕鲁头像待确认`。
5. 建筑和物品正式目录的其他额外文件进入各自待确认目录。
6. 旧属性、工作和技能图标迁入 1.0 对应正式分类。
7. 旧帕鲁、物品、建筑图片按文件主名与新版对照；已覆盖的删除，未覆盖的进入原分类待确认目录。
8. 删除 340 张旧背景瓦片；当前代码引用的标记迁入 `地图图标`，其他图片进入 `地图图标待确认`。
9. 删除确认无人引用的 `_make_white.mjs`，清理空目录。

所有删除目标必须先确认位于项目的旧数据或旧资源目录；不同内容的同名文件不得静默覆盖。

- [x] **Step 2: 执行整理脚本并记录摘要**

Run: `powershell -ExecutionPolicy Bypass -File 迁移验证/整理1.0数据资源.ps1`

Expected: 输出移动、重复删除、过时删除、人物头像和各分类待确认文件数量，退出码为 0。

### Task 4: 更新运行引用和迁移验证

**Files:**
- Modify: `PalToolbox/共享/视觉系统/壁纸管理.js`
- Modify: `PalToolbox/共享/视觉系统/模式切换动画.js`
- Modify: `PalToolbox/入口页面/开屏门面/门面入口.js`
- Modify: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/地图指南/核心/地图指南核心.js`
- Modify: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/地图指南/网页模式适配/地图指南网页.js`
- Modify: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/帕鲁图鉴/核心/帕鲁图鉴核心.js`
- Modify: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/帕鲁图鉴/网页模式适配/帕鲁图鉴网页.js`
- Modify: `迁移验证/迁移完整性.test.ps1`
- Modify: `迁移验证/复制有效项目.ps1`
- Modify: `AGENTS.md`

- [x] **Step 1: 将壁纸、门面、地图和图鉴路径指向新位置**

壁纸统一指向 `幻兽帕鲁/界面资源/壁纸`；版本图片统一指向 `幻兽帕鲁1.0/资源包` 下的正式分类。删除旧路径兼容替换，不在新代码中保留失效目录名。

- [x] **Step 2: 更新迁移检查和复制清单**

完整性检查要求 1.0 工作速度数据、新资源分类和界面壁纸存在，禁止旧数据包与旧资源包重新出现。复制程序不再复制三份废弃数据和整个旧资源包，只按新职责复制界面资源与 1.0 数据资源。

- [x] **Step 3: 同步结构地图**

在 `AGENTS.md` 中把 `幻兽帕鲁` 标明为程序、外部库和界面资源，把 `幻兽帕鲁1.0` 标明为 1.0 数据包和资源包。

### Task 5: 全量验证

**Files:**
- Verify: `PalToolbox/**`
- Verify: `迁移验证/*.test.ps1`

- [x] **Step 1: 运行新结构检查**

Run: `powershell -ExecutionPolicy Bypass -File 迁移验证/1.0数据资源结构.test.ps1`

Expected: PASS，并打印正式头像、物品、建筑、人物和待确认数量。

- [x] **Step 2: 运行迁移完整性检查**

Run: `powershell -ExecutionPolicy Bypass -File 迁移验证/迁移完整性.test.ps1`

Expected: PASS，入口引用完整、17 个工具齐全、排除项为零。

- [x] **Step 3: 运行全部 JavaScript 检查**

Run: `Get-ChildItem PalToolbox -Recurse -File -Filter '*.test.js' | ForEach-Object { node $_.FullName; if ($LASTEXITCODE -ne 0) { throw "检查失败: $($_.FullName)" } }`

Expected: 全部检查退出码为 0。

- [x] **Step 4: 启动本地预览并检查关键资源**

启动隐藏的本地预览服务，请求入口、工作速度数据、帕鲁头像、物品图标、建筑图标、地图瓦片、地图图标和界面壁纸，要求全部返回 200。

- [x] **Step 5: 检查版本状态并提交**

Run: `git diff --check`、`git status --short`

Expected: 仅出现本次设计范围内的移动、删除、检查和引用修改。
