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
Copy-Tree (Join-Path $SourceRoot '游戏内容\幻兽帕鲁\界面资源') (Join-Path $TargetRoot '游戏内容\幻兽帕鲁\界面资源')
Copy-Tree (Join-Path $SourceRoot '游戏内容\幻兽帕鲁1.0\资源包') (Join-Path $TargetRoot '游戏内容\幻兽帕鲁1.0\资源包')

$EntryText = Get-Content -Raw -Encoding UTF8 $EntryPath
$ActiveTools = [regex]::Matches($EntryText, '游戏内容/幻兽帕鲁/工具功能/([^/]+)/') |
    ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
foreach ($ToolName in $ActiveTools) {
    Copy-Tree (Join-Path $SourceRoot "游戏内容\幻兽帕鲁\工具功能\$ToolName") (Join-Path $TargetRoot "游戏内容\幻兽帕鲁\工具功能\$ToolName")
}

$CurrentDataFiles = @(
    '工作速度计算器数据.js',
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
