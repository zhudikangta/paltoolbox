# Partner Skill Paldex Appearance Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the partner-skill page use the Paldex continuous-frame and inner-cube appearance while preserving its current sidebar, complete descriptions, fixed parameters, rank tables, and filter behavior.

**Architecture:** The partner-skill adapter reads the existing Paldex appearance selection and passes it to the shared `PT_buildCardVisualVars` visual resolver. The result grid gains one frame wrapper; individual skill entries keep only cube styling. The Paldex page returns to owning its own adapter code so the partner-skill change does not alter Paldex behavior.

**Tech Stack:** Plain HTML strings, CSS, browser JavaScript, Node `assert` tests.

---

### Task 1: Keep Paldex behavior isolated

**Files:**
- Modify: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/网页模式适配/伙伴技能外观.test.js`
- Modify: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/网页模式适配/技能网页.js`
- Modify: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/帕鲁图鉴/通用逻辑/帕鲁图鉴通用.js`
- Modify: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/帕鲁图鉴/网页模式适配/帕鲁图鉴网页.js`
- Modify: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/帕鲁图鉴/通用逻辑/帕鲁图鉴外观设置.test.js`

- [ ] **Step 1: Write the failing boundary test**

Assert that partner skills use `getAppearanceSettings` plus the shared `PT_buildCardVisualVars`, and that `帕鲁图鉴通用.js` no longer exports the partner-specific CSS-variable bridge:

```js
assert.ok(source.includes('getAppearanceSettings'));
assert.ok(source.includes('PT_buildCardVisualVars'));
assert.ok(!paldexCommonSource.includes('getAppearanceCssVars'));
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```powershell
node 'PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/网页模式适配/伙伴技能外观.test.js'
```

Expected: FAIL because partner skills currently call `getAppearanceCssVars`.

- [ ] **Step 3: Implement the adapter boundary**

In `技能网页.js`, read `getAppearanceSettings()`, call `PT_buildCardVisualVars` for frame and cube, and assign the existing `--pd-frame-*` and `--pd-cube-*` variables to the partner page.

Remove `getAppearanceCssVars` from `帕鲁图鉴通用.js`. Restore `帕鲁图鉴网页.js` to call `PT_buildCardVisualVars` itself, preserving the Paldex output and appearance refresh behavior.

- [ ] **Step 4: Run both appearance tests**

Run:

```powershell
node 'PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/网页模式适配/伙伴技能外观.test.js'
node 'PalToolbox/游戏内容/幻兽帕鲁/工具功能/帕鲁图鉴/通用逻辑/帕鲁图鉴外观设置.test.js'
```

Expected: both PASS.

### Task 2: Replace per-card frames with one continuous wall

**Files:**
- Modify: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/网页模式适配/伙伴技能外观.test.js`
- Modify: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/网页模式适配/技能网页.js`
- Modify: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/样式/技能网页样式.css`

- [ ] **Step 1: Write the failing structure test**

Require one `.sk-partner-card-wall` wrapper around the grid, require the wall to consume frame variables, and reject frame variables on `.sk-partner-card-cell`:

```js
assert.ok(source.includes('sk-partner-card-wall'));
assert.ok(/\.sk-partner-card-wall\{[^}]*--pd-frame-bg/.test(css));
assert.ok(!/\.sk-partner-card-cell\{[^}]*--pd-frame-bg/.test(css));
assert.ok(/\.sk-partner-card\{[^}]*--pd-cube-bg/.test(css));
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```powershell
node 'PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/网页模式适配/伙伴技能外观.test.js'
```

Expected: FAIL because every card currently owns a frame.

- [ ] **Step 3: Change the result markup**

Render:

```html
<div class="sk-partner-card-wall">
  <div class="sk-partner-card-grid">
    <div class="sk-partner-card-cell">
      <article class="sk-partner-card">...</article>
    </div>
  </div>
</div>
```

Wrap the no-results state in the same wall. Do not add click handlers, detail routes, or animation classes.

- [ ] **Step 4: Move frame styling to the wall**

Give `.sk-partner-card-wall` the frame background, border, texture, blur, and material shadow. Make `.sk-partner-card-cell` a transparent structural slot. Keep `.sk-partner-card` on cube variables and preserve natural content height. Use a narrow wall-colored gap between entries so they read as cubes embedded in one frame.

- [ ] **Step 5: Run the test to verify it passes**

Run:

```powershell
node 'PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/网页模式适配/伙伴技能外观.test.js'
```

Expected: PASS.

### Task 3: Align the filter sidebar without changing filtering

**Files:**
- Modify: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/网页模式适配/伙伴技能外观.test.js`
- Modify: `PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/样式/技能网页样式.css`

- [ ] **Step 1: Add failing sidebar appearance assertions**

Require the sidebar shell to consume frame material variables and its internal blocks/groups to consume cube variables. Reject fixed purple partner-card styling and `!important`.

- [ ] **Step 2: Run the appearance test to verify the assertion fails if any layer is missing**

Run:

```powershell
node 'PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/网页模式适配/伙伴技能外观.test.js'
```

Expected: FAIL for any missing frame/cube layer.

- [ ] **Step 3: Apply the Paldex material layers**

Use frame filters on `.sk-partner-filter-sidebar`, cube filters and subtle sheen on `.sk-partner-sidebar-block` and `.sk-partner-filter-group`, and keep the current accent-based selected state. Do not alter class names used by event handlers.

- [ ] **Step 4: Run appearance and filtering tests**

Run:

```powershell
node 'PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/网页模式适配/伙伴技能外观.test.js'
node '迁移验证/伙伴技能/伙伴技能分类.test.js'
node 'PalToolbox/游戏内容/幻兽帕鲁/工具功能/技能/核心/技能核心.test.js'
```

Expected: all PASS.

### Task 4: Full verification and visual inspection

**Files:**
- Verify only.

- [ ] **Step 1: Run the partner-skill and Paldex regression suite**

Run all partner data, partner UI, Paldex appearance, Paldex detail, and `git diff --check` commands from the previous verification run.

Expected: all PASS; partner data remains 753 Pals, 300 ordinary entries, 335 catalog entries, and 0 conflicts.

- [ ] **Step 2: Inspect multiple results**

Open `http://127.0.0.1:59637/入口页面/index.html`, enter partner skills, clear filters, and verify that one continuous frame surrounds the result wall while every full description and table remains visible.

- [ ] **Step 3: Inspect a single result**

Search `石掌猿`. Verify there is one wall around one cube, no giant empty panel, both description paragraphs, and both rank tables.

- [ ] **Step 4: Inspect appearance synchronization**

Change frame theme/material and cube theme/material in Settings, return to partner skills, and verify the result wall, skill cubes, sidebar frame, and sidebar inner blocks update independently. Restore the original settings afterward.
