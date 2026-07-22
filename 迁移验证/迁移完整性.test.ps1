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
Assert-True (($ActiveTools -join '|') -eq ($CopiedTools -join '|')) '目标工具集合与入口不一致'

$RequiredData = @(
    '游戏内容\幻兽帕鲁1.0\数据包\工作速度计算器数据.js',
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
    '游戏内容\幻兽帕鲁\界面资源\壁纸',
    '游戏内容\幻兽帕鲁1.0\资源包\地图',
    '游戏内容\幻兽帕鲁1.0\资源包\地图图标',
    '游戏内容\幻兽帕鲁1.0\资源包\地图图标待确认',
    '游戏内容\幻兽帕鲁1.0\资源包\帕鲁头像',
    '游戏内容\幻兽帕鲁1.0\资源包\帕鲁头像待确认',
    '游戏内容\幻兽帕鲁1.0\资源包\人物头像',
    '游戏内容\幻兽帕鲁1.0\资源包\建筑图标',
    '游戏内容\幻兽帕鲁1.0\资源包\建筑图标待确认',
    '游戏内容\幻兽帕鲁1.0\资源包\物品图标',
    '游戏内容\幻兽帕鲁1.0\资源包\物品图标待确认',
    '游戏内容\幻兽帕鲁1.0\资源包\技能图标',
    '游戏内容\幻兽帕鲁1.0\资源包\属性图标',
    '游戏内容\幻兽帕鲁1.0\资源包\工作图标'
)
foreach ($RelativePath in $RequiredResourceRoots) {
    Assert-True (Test-Path -LiteralPath (Join-Path $SiteRoot $RelativePath) -PathType Container) "缺少资源目录: $RelativePath"
}

$ForbiddenPaths = @(
    '本地工具',
    '游戏内容\幻兽帕鲁\工具功能\帕鲁AI助手',
    '游戏内容\幻兽帕鲁\数据包',
    '游戏内容\幻兽帕鲁\资源包',
    '游戏内容\幻兽帕鲁1.0\资源包\待确认',
    '游戏内容\幻兽帕鲁1.0\资源包\帕鲁头像\新帕鲁',
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
