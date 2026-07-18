# 地图空间分区聚集实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在保持固定缩放阶段、聚集成员和动画不变的前提下，用稀疏空间格子加速地图聚集，并让画面范围模式复用全图聚集结果。

**Architecture:** 地图核心保留现有 `buildStageClusters` 入口，只替换内部候选查找方式；每个聚集团按中心所在格子建立索引，候选按创建顺序选择以复原旧结果。网页适配按地图、点位类型和阶段保存聚集结果，画面范围模式只裁剪已经聚集完成的结果，不再先裁剪原始点位。

**Tech Stack:** 原生 JavaScript、Node.js 内置断言、PowerShell 项目检验脚本、Leaflet 地图运行层。

---

### Task 1: 固化空间分区必须保持的核心行为

**Files:**
- Modify: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/地图指南/核心/地图指南核心.test.js`
- Test: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/地图指南/核心/地图指南核心.test.js`

- [ ] **Step 1: 写入会失败的边界和空间分区检验**

加入完整阶段边界断言、一份只供检验使用的旧逐个扫描实现、中心跨格样本和大量稀疏点位样本。空间入口预期为 `buildSpatialStageClusters`，此时它尚未导出，因此检验必须失败。

```js
assert.strictEqual(core.getClusterStage(0.19999, [0, 0.2, 0.4, 0.6]), 0);
assert.strictEqual(core.getClusterStage(0.2, [0, 0.2, 0.4, 0.6]), 1);
assert.strictEqual(core.getClusterStage(0.39999, [0, 0.2, 0.4, 0.6]), 1);
assert.strictEqual(core.getClusterStage(0.4, [0, 0.2, 0.4, 0.6]), 2);
assert.strictEqual(core.getClusterStage(0.59999, [0, 0.2, 0.4, 0.6]), 2);
assert.strictEqual(core.getClusterStage(0.6, [0, 0.2, 0.4, 0.6]), 3);
assert.strictEqual(typeof core.buildSpatialStageClusters, 'function');
```

- [ ] **Step 2: 运行检验并确认因新入口不存在而失败**

Run:

```powershell
node "PalToolbox\游戏内容\幻兽帕鲁\工具功能\地图指南\核心\地图指南核心.test.js"
```

Expected: FAIL，错误指出 `buildSpatialStageClusters` 不存在或不是函数。

### Task 2: 用稀疏空间格子替换全量扫描

**Files:**
- Modify: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/地图指南/核心/地图指南核心.js`
- Test: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/地图指南/核心/地图指南核心.test.js`

- [ ] **Step 1: 实现格子索引和中心换格**

在原 `buildStageClusters` 所在位置加入内部格子函数，并让公开入口调用空间实现。格子保存聚集团编号，不向聚集结果增加内部字段。

```js
function getClusterGridCoord(value, cellSize) {
    return Math.floor(value / cellSize);
}
function getClusterGridKey(x, y) {
    return x + ':' + y;
}
function buildStageClusters(points, options) {
    return buildSpatialStageClusters(points, options);
}
```

`buildSpatialStageClusters` 必须沿用原来的阶段半径和比例换算，只读取周围九格，按聚集团编号从小到大检查，并在中心跨格后移动编号。

- [ ] **Step 2: 接回原公开入口并运行核心检验**

首轮失败确认可以临时检查内部空间入口；完成红绿循环后移除只为检验添加的公开导出，最终仍只保留原有 `buildStageClusters` 公开入口，由它调用内部空间实现。

Run:

```powershell
node "PalToolbox\游戏内容\幻兽帕鲁\工具功能\地图指南\核心\地图指南核心.test.js"
```

Expected: PASS，退出码为 0。

- [ ] **Step 3: 用真实地图数据比较成员**

检验读取当前地图数据，对每张地图、每种可聚集点位和四个阶段运行旧检验实现与新核心实现，比较聚集团内点位键值及顺序。

```js
assert.deepStrictEqual(
    simplify(core.buildStageClusters(models, options)),
    simplify(buildLegacyStageClusters(models, options)),
    mapId + ' / ' + type + ' / stage ' + stage + ' keeps legacy members'
);
```

Expected: 当前真实点位的所有聚集成员和顺序一致。

### Task 3: 保存全图聚集结果并在显示阶段裁剪

**Files:**
- Create: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/地图指南/网页模式适配/地图指南聚集调度.test.js`
- Modify: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/地图指南/网页模式适配/地图指南网页.js`

- [ ] **Step 1: 写入会失败的网页调度检验**

```js
assert.ok(/if \(nextStage !== state\.clusterStage\) scheduleClusterStageUpdate\(nextStage\)/.test(webSource));
assert.ok(/function getCachedStageClusters\(type, models, mapCore\)/.test(webSource));
assert.ok(/var markers = state\.markers;/.test(webSource));
assert.ok(!/var markers = state\.viewportOnly \? getPointsInViewport\(\) : state\.markers;/.test(webSource));
assert.ok(/function isClusterResultInViewport\(cluster, viewportBounds\)/.test(webSource));
```

- [ ] **Step 2: 运行检验并确认保存结果与结果裁剪尚不存在**

Run:

```powershell
node "PalToolbox\游戏内容\幻兽帕鲁\工具功能\地图指南\网页模式适配\地图指南聚集调度.test.js"
```

Expected: FAIL，错误指出保存聚集结果或结果范围裁剪不存在。

- [ ] **Step 3: 加入最小结果保存逻辑**

在 `state` 中加入 `clusterResults`，按当前地图、类型和阶段保存完整类型模型形成的聚集结果；地图切换和销毁时清空。

```js
function getCachedStageClusters(type, models, mapCore) {
    var key = getActiveMapId() + '|' + type + '|' + state.clusterStage;
    if (state.clusterResults[key]) return state.clusterResults[key];
    state.clusterResults[key] = mapCore.buildStageClusters(models, {
        stage: state.clusterStage,
        minZoom: state.map.getMinZoom(),
        maxZoom: state.map.getMaxZoom(),
        nativeZoom: NATIVE_ZOOM,
        stageBreaks: CLUSTER_STAGE_BREAKS,
        stageRadii: getClusterStageRadii(type)
    });
    return state.clusterResults[key];
}
```

- [ ] **Step 4: 将画面范围判断移到聚集完成后**

`updateLayers` 始终从 `state.markers` 建立完整类型模型。画面范围模式开启时，只在向图层添加区域标签、普通标点、单点结果或聚集图标前检查结果中心。

```js
var markers = state.markers;
var viewportBounds = state.viewportOnly ? getPaddedViewportBounds() : null;
var clusters = getCachedStageClusters(type, models, mapCore);
if (viewportBounds && !isClusterResultInViewport(cluster, viewportBounds)) continue;
```

- [ ] **Step 5: 运行全部地图网页检验**

Run:

```powershell
Get-ChildItem "PalToolbox\游戏内容\幻兽帕鲁\工具功能\地图指南\网页模式适配" -Filter "*.test.js" | ForEach-Object { node $_.FullName; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }
```

Expected: PASS，全部退出码为 0。

### Task 4: 性能、全项目和肉眼验证

**Files:**
- Modify only if a verified defect is found: files from Tasks 1-3

- [ ] **Step 1: 测量当前真实地图的四阶段计算时间**

使用当前地图数据按类型测量四阶段平均耗时。性能不写成容易受机器环境影响的硬性断言。

Expected: 第三、第四阶段明显低于修改前约 28 毫秒，且成员一致检验仍通过。

- [ ] **Step 2: 运行全部地图检验**

```powershell
Get-ChildItem "PalToolbox\游戏内容\幻兽帕鲁\工具功能\地图指南" -Filter "*.test.js" -Recurse | ForEach-Object { node $_.FullName; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }
```

Expected: PASS，退出码为 0。

- [ ] **Step 3: 运行项目完整检验**

```powershell
& ".\迁移验证\迁移完整性.test.ps1"
```

Expected: PASS，项目检验失败数为 0。

- [ ] **Step 4: 启动本地页面肉眼验证**

打开地图指南，检查不足 20% 时不聚散，只在跨过 20%、40%、60% 后出现原有动画；开启画面范围模式后拖出再拖回，相同阶段的聚集数量不变化；开启帕鲁刷新点后检查高倍率拖动和缩放；关闭并重新开启聚集后恢复当前阶段结果。

- [ ] **Step 5: 检查计划范围并提交**

```powershell
git diff --check
git status --short
```

Expected: 只有核心、核心检验、网页适配、网页调度检验和本计划发生变化，没有空白错误或无关文件。
