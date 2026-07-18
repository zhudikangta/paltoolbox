# 游戏工具箱迁移 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将旧项目中由入口页面实际使用的界面、工具、数据和资源复制到桌面的独立“游戏工具箱”项目，同时排除历史垃圾并建立新的项目规则。

**Architecture:** 以 `PalToolbox/入口页面/index.html` 为依赖起点，整目录保留入口、共享能力和运行模式；根据入口引用确定有效工具；根据程序中的读取路径保留正式数据与运行资源。迁移通过独立脚本完成，完整性检查负责证明入口引用存在且排除项没有混入。

**Tech Stack:** PowerShell 迁移与检查脚本，纯前端 HTML/CSS/JavaScript 网站，Git 本地版本管理。

---

### Task 1: 建立迁移失败检查

**Files:**
- Create: `迁移验证/迁移完整性.test.ps1`

- [x] **Step 1: 写出目标目录尚未生成时会失败的检查**

```powershell
$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$SiteRoot = Join-Path $ProjectRoot 'PalToolbox'
$EntryPath = Join-Path $SiteRoot '入口页面\index.html'

function Assert-True {
    param([bool]$Condition, [string]$Message)
    if (-not $Condition) { throw $Message }
}

Assert-True (Test-Path -LiteralPath $EntryPath -PathType Leaf) "缺少入口文件: $EntryPath"
$EntryText = Get-Content -Raw -Encoding UTF8 $EntryPath
$EntryDirectory = Split-Path -Parent $EntryPath
$References = [regex]::Matches($EntryText, '(?:src|href)="([^"]+)"') | ForEach-Object { $_.Groups[1].Value }
$MissingReferences = @()
foreach ($Reference in $References) {
    if ($Reference -match '^(?:https?:|data:|#)') { continue }
    $LocalPath = [IO.Path]::GetFullPath((Join-Path $EntryDirectory ($Reference -replace '/', '\')))
    if (-not (Test-Path -LiteralPath $LocalPath -PathType Leaf)) { $MissingReferences += $Reference }
}
Assert-True ($MissingReferences.Count -eq 0) ('入口引用缺失: ' + ($MissingReferences -join '; '))

$ActiveTools = [regex]::Matches($EntryText, '游戏内容/幻兽帕鲁/工具功能/([^/]+)/') |
    ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
$ToolRoot = Join-Path $SiteRoot '游戏内容\幻兽帕鲁\工具功能'
$CopiedTools = Get-ChildItem -LiteralPath $ToolRoot -Directory | Select-Object -ExpandProperty Name | Sort-Object -Unique
Assert-True (($ActiveTools -join '|') -eq ($CopiedTools -join '|')) "目标工具集合与入口不一致"

$RequiredData = @(
    '游戏内容\幻兽帕鲁\数据包\工作速度计算器数据.js',
    '游戏内容\幻兽帕鲁\数据包\物品数据.js',
    '游戏内容\幻兽帕鲁\数据包\装备数据.js',
    '游戏内容\幻兽帕鲁\数据包\建筑数据.js',
    '游戏内容\幻兽帕鲁1.0\数据包\习得技能.json',
    '游戏内容\幻兽帕鲁1.0\数据包\事件.json',
    '游戏内容\幻兽帕鲁1.0\数据包\任务.json',
    '游戏内容\幻兽帕鲁1.0\数据包\任务与人物.json',
    '游戏内容\幻兽帕鲁1.0\数据包\伙伴技能.json',
    '游戏内容\幻兽帕鲁1.0\数据包\商店.json',
    '游戏内容\幻兽帕鲁1.0\数据包\地图数据.js',
    '游戏内容\幻兽帕鲁1.0\数据包\帕鲁.json',
    '游戏内容\幻兽帕鲁1.0\数据包\建筑.json',
    '游戏内容\幻兽帕鲁1.0\数据包\战斗与生产.json',
    '游戏内容\幻兽帕鲁1.0\数据包\技能.json',
    '游戏内容\幻兽帕鲁1.0\数据包\掉落.json',
    '游戏内容\幻兽帕鲁1.0\数据包\物品.json',
    '游戏内容\幻兽帕鲁1.0\数据包\科技.json',
    '游戏内容\幻兽帕鲁1.0\数据包\经验表.json',
    '游戏内容\幻兽帕鲁1.0\数据包\配方.json',
    '游戏内容\幻兽帕鲁1.0\数据包\配种.json'
)
foreach ($RelativePath in $RequiredData) {
    Assert-True (Test-Path -LiteralPath (Join-Path $SiteRoot $RelativePath) -PathType Leaf) "缺少运行数据: $RelativePath"
}

$RequiredResourceRoots = @(
    '游戏内容\幻兽帕鲁\资源包',
    '游戏内容\幻兽帕鲁1.0\资源包\地图',
    '游戏内容\幻兽帕鲁1.0\资源包\帕鲁头像',
    '游戏内容\幻兽帕鲁1.0\资源包\建筑图标',
    '游戏内容\幻兽帕鲁1.0\资源包\物品图标'
)
foreach ($RelativePath in $RequiredResourceRoots) {
    Assert-True (Test-Path -LiteralPath (Join-Path $SiteRoot $RelativePath) -PathType Container) "缺少资源目录: $RelativePath"
}

$ForbiddenPaths = @(
    '本地工具',
    '游戏内容\幻兽帕鲁\工具功能\帕鲁AI助手',
    '游戏内容\幻兽帕鲁\资源包\图标资源包\_copy.js',
    '游戏内容\幻兽帕鲁1.0\数据包\地图.json',
    '游戏内容\幻兽帕鲁1.0\数据包\工作模拟.json',
    '游戏内容\幻兽帕鲁1.0\数据包\注入传送点.py',
    'generate-web-release.ps1',
    '发布包资源限制.test.ps1'
)
foreach ($RelativePath in $ForbiddenPaths) {
    Assert-True (-not (Test-Path -LiteralPath (Join-Path $SiteRoot $RelativePath))) "混入排除项: $RelativePath"
}
$CacheDirectories = @(Get-ChildItem -LiteralPath $SiteRoot -Recurse -Directory -Filter '__pycache__')
Assert-True ($CacheDirectories.Count -eq 0) '混入程序缓存目录'

$FileCount = @(Get-ChildItem -LiteralPath $SiteRoot -Recurse -File).Count
Write-Host "PASS: 入口引用完整，工具 $($ActiveTools.Count) 个，文件 $FileCount 个，排除项为零。"
```

- [x] **Step 2: 运行检查并确认失败原因正确**

Run: `powershell -ExecutionPolicy Bypass -File 迁移验证/迁移完整性.test.ps1`

Expected: FAIL，明确提示 `PalToolbox/入口页面/index.html` 尚不存在。

### Task 2: 编写最小迁移程序

**Files:**
- Create: `迁移验证/复制有效项目.ps1`

- [x] **Step 1: 写出按入口筛选的复制程序**

```powershell
param(
    [Parameter(Mandatory = $true)]
    [string]$SourceRoot
)

$ErrorActionPreference = 'Stop'
$SourceRoot = (Resolve-Path -LiteralPath $SourceRoot).Path.TrimEnd('\')
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$TargetRoot = Join-Path $ProjectRoot 'PalToolbox'
$EntryPath = Join-Path $SourceRoot '入口页面\index.html'

if (-not (Test-Path -LiteralPath $EntryPath -PathType Leaf)) { throw "源入口不存在: $EntryPath" }
if (Test-Path -LiteralPath $TargetRoot) { throw "目标目录已经存在，拒绝覆盖: $TargetRoot" }

$script:CopiedCount = 0
function Copy-OneFile {
    param([string]$SourcePath, [string]$TargetPath)
    $TargetDirectory = Split-Path -Parent $TargetPath
    New-Item -ItemType Directory -Force -Path $TargetDirectory | Out-Null
    Copy-Item -LiteralPath $SourcePath -Destination $TargetPath
    $script:CopiedCount++
}

function Copy-Tree {
    param([string]$SourcePath, [string]$TargetPath, [string[]]$ExcludedFileNames = @())
    $ResolvedSource = (Resolve-Path -LiteralPath $SourcePath).Path.TrimEnd('\')
    Get-ChildItem -LiteralPath $ResolvedSource -Recurse -File -Force | ForEach-Object {
        if ($_.Name -in $ExcludedFileNames) { return }
        $RelativePath = $_.FullName.Substring($ResolvedSource.Length).TrimStart('\')
        Copy-OneFile $_.FullName (Join-Path $TargetPath $RelativePath)
    }
}

Copy-Tree (Join-Path $SourceRoot '入口页面') (Join-Path $TargetRoot '入口页面')
Copy-Tree (Join-Path $SourceRoot '共享') (Join-Path $TargetRoot '共享')
Copy-Tree (Join-Path $SourceRoot '运行模式') (Join-Path $TargetRoot '运行模式')
Copy-Tree (Join-Path $SourceRoot '游戏内容\幻兽帕鲁\外部库') (Join-Path $TargetRoot '游戏内容\幻兽帕鲁\外部库')
Copy-Tree (Join-Path $SourceRoot '游戏内容\幻兽帕鲁\资源包') (Join-Path $TargetRoot '游戏内容\幻兽帕鲁\资源包') @('_copy.js')
Copy-Tree (Join-Path $SourceRoot '游戏内容\幻兽帕鲁1.0\资源包') (Join-Path $TargetRoot '游戏内容\幻兽帕鲁1.0\资源包')

$EntryText = Get-Content -Raw -Encoding UTF8 $EntryPath
$ActiveTools = [regex]::Matches($EntryText, '游戏内容/幻兽帕鲁/工具功能/([^/]+)/') |
    ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
foreach ($ToolName in $ActiveTools) {
    Copy-Tree (Join-Path $SourceRoot "游戏内容\幻兽帕鲁\工具功能\$ToolName") (Join-Path $TargetRoot "游戏内容\幻兽帕鲁\工具功能\$ToolName")
}

$LegacyDataFiles = @('工作速度计算器数据.js', '物品数据.js', '装备数据.js', '建筑数据.js')
foreach ($FileName in $LegacyDataFiles) {
    Copy-OneFile (Join-Path $SourceRoot "游戏内容\幻兽帕鲁\数据包\$FileName") (Join-Path $TargetRoot "游戏内容\幻兽帕鲁\数据包\$FileName")
}

$CurrentDataFiles = @(
    '习得技能.json', '事件.json', '任务.json', '任务与人物.json', '伙伴技能.json', '商店.json',
    '地图数据.js', '帕鲁.json', '建筑.json', '战斗与生产.json', '技能.json', '掉落.json',
    '物品.json', '科技.json', '经验表.json', '配方.json', '配种.json'
)
foreach ($FileName in $CurrentDataFiles) {
    Copy-OneFile (Join-Path $SourceRoot "游戏内容\幻兽帕鲁1.0\数据包\$FileName") (Join-Path $TargetRoot "游戏内容\幻兽帕鲁1.0\数据包\$FileName")
}

Copy-OneFile (Join-Path $SourceRoot 'local-preview-server.js') (Join-Path $TargetRoot 'local-preview-server.js')
Copy-OneFile (Join-Path $SourceRoot '启动本机预览.bat') (Join-Path $TargetRoot '启动本机预览.bat')

Write-Host "复制完成: $TargetRoot"
Write-Host "有效工具: $($ActiveTools.Count) 个"
Write-Host "复制文件: $script:CopiedCount 个"
```

- [x] **Step 2: 运行迁移程序**

Run: `powershell -ExecutionPolicy Bypass -File 迁移验证/复制有效项目.ps1 -SourceRoot "C:/Users/ZhudiKangta/Desktop/PalToolbox二度迁移/PalToolbox"`

Expected: 输出目标目录、有效工具数量和复制文件数量。

迁移结果：已识别 17 个有效工具并复制 4660 个文件。

### Task 3: 验证迁移闭包

**Files:**
- Test: `迁移验证/迁移完整性.test.ps1`

- [x] **Step 1: 再次运行完整性检查**

Run: `powershell -ExecutionPolicy Bypass -File 迁移验证/迁移完整性.test.ps1`

Expected: PASS，入口引用零缺失、运行数据零缺失、排除项零混入。

- [x] **Step 2: 运行迁移后的现有自动检查**

Run: `Get-ChildItem PalToolbox -Recurse -File -Filter '*.test.js' | ForEach-Object { node $_.FullName; if ($LASTEXITCODE -ne 0) { throw "检查失败: $($_.FullName)" } }`

Expected: 所有随有效模块复制的检查均正常结束。

迁移后发现旧“整图滚轮适配”检查与当前瓦片地图相互矛盾；源项目同样失败。新项目将其替换为“瓦片滚轮适配”检查，不恢复已废弃的整图双图层。

### Task 4: 建立独立版本历史

**Files:**
- Create: `.git/`

- [x] **Step 1: 初始化独立仓库和迁移分支**

Run: `git init -b codex/initial-migration`

Expected: 新项目拥有独立仓库，旧项目状态不发生变化。

- [x] **Step 2: 保存迁移基线**

Run: `git add AGENTS.md docs 迁移验证 PalToolbox && git commit -m "chore: 建立游戏工具箱迁移基线"`

Expected: 初始提交成功，工作目录无未保存变化。

### Task 5: 启动与页面验证

**Files:**
- Verify: `PalToolbox/local-preview-server.js`
- Verify: `PalToolbox/入口页面/index.html`

- [x] **Step 1: 读取预览程序确定端口和根目录**

Run: `Get-Content -Raw PalToolbox/local-preview-server.js`

Expected: 明确服务监听地址以及入口地址。

- [x] **Step 2: 启动本机预览并请求关键资源**

Run:

```powershell
$ProjectRoot = (Resolve-Path '.').Path
$env:PT_PREVIEW_NO_OPEN = '1'
$Preview = Start-Process -FilePath 'node' -ArgumentList 'PalToolbox/local-preview-server.js', '52777' -WorkingDirectory $ProjectRoot -WindowStyle Hidden -PassThru
try {
    Start-Sleep -Seconds 1
    $Urls = @(
        'http://127.0.0.1:52777/入口页面/index.html',
        'http://127.0.0.1:52777/共享/视觉系统/基础样式.css',
        'http://127.0.0.1:52777/共享/核心框架/跨工具索引.js',
        'http://127.0.0.1:52777/游戏内容/幻兽帕鲁1.0/数据包/物品.json'
    )
    foreach ($Url in $Urls) {
        $Response = Invoke-WebRequest -UseBasicParsing -Uri $Url
        if ($Response.StatusCode -ne 200) { throw "请求失败: $Url" }
    }
} finally {
    Stop-Process -Id $Preview.Id -Force -ErrorAction SilentlyContinue
}
```

Expected: 四项请求均返回成功状态。

- [x] **Step 3: 给出肉眼检查步骤**

告诉用户打开入口页面，进入网页模式，分别打开帕鲁图鉴、物品图鉴和地图指南，确认卡片、图片、筛选和地图瓦片能够显示。
