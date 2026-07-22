$ErrorActionPreference = 'Stop'

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$SiteRoot = (Resolve-Path -LiteralPath (Join-Path $ProjectRoot 'PalToolbox')).Path.TrimEnd('\')
$ProgramRoot = Join-Path $SiteRoot '游戏内容\幻兽帕鲁'
$VersionRoot = Join-Path $SiteRoot '游戏内容\幻兽帕鲁1.0'
$OldDataRoot = Join-Path $ProgramRoot '数据包'
$OldResourceRoot = Join-Path $ProgramRoot '资源包'
$OldIconRoot = Join-Path $OldResourceRoot '图标资源包'
$OldMapRoot = Join-Path $OldResourceRoot '地图瓦片'
$NewDataRoot = Join-Path $VersionRoot '数据包'
$NewResourceRoot = Join-Path $VersionRoot '资源包'

$Stats = [ordered]@{
    Moved = 0
    DuplicateRemoved = 0
    ObsoleteRemoved = 0
    Pending = 0
    People = 0
}

function Assert-InSiteRoot {
    param([string]$Path)
    $FullPath = [IO.Path]::GetFullPath($Path)
    $Prefix = $SiteRoot + [IO.Path]::DirectorySeparatorChar
    if (-not $FullPath.StartsWith($Prefix, [StringComparison]::OrdinalIgnoreCase)) {
        throw "拒绝操作站点目录以外的路径: $FullPath"
    }
    return $FullPath
}

function Ensure-Directory {
    param([string]$Path)
    $FullPath = Assert-InSiteRoot $Path
    if (-not (Test-Path -LiteralPath $FullPath -PathType Container)) {
        New-Item -ItemType Directory -Path $FullPath | Out-Null
    }
    return $FullPath
}

function Remove-SafeFile {
    param([string]$Path, [string]$Kind = 'Obsolete')
    $FullPath = Assert-InSiteRoot $Path
    if (-not (Test-Path -LiteralPath $FullPath -PathType Leaf)) { return }
    Remove-Item -LiteralPath $FullPath
    if ($Kind -eq 'Duplicate') { $Stats.DuplicateRemoved++ } else { $Stats.ObsoleteRemoved++ }
}

function Get-FileHashValue {
    param([string]$Path)
    return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash
}

function Get-ConflictPath {
    param([string]$Directory, [string]$Name, [string]$Suffix)
    $BaseName = [IO.Path]::GetFileNameWithoutExtension($Name)
    $Extension = [IO.Path]::GetExtension($Name)
    $Index = 0
    do {
        $Tail = if ($Index -eq 0) { "__$Suffix" } else { "__$Suffix-$Index" }
        $Candidate = Join-Path $Directory ($BaseName + $Tail + $Extension)
        $Index++
    } while (Test-Path -LiteralPath $Candidate)
    return $Candidate
}

function Move-WithConflictProtection {
    param(
        [string]$Source,
        [string]$TargetDirectory,
        [string]$ConflictDirectory,
        [string]$ConflictSuffix,
        [switch]$Pending,
        [switch]$Person
    )
    $SourcePath = Assert-InSiteRoot $Source
    if (-not (Test-Path -LiteralPath $SourcePath -PathType Leaf)) { return }
    $TargetRoot = Ensure-Directory $TargetDirectory
    $TargetPath = Join-Path $TargetRoot ([IO.Path]::GetFileName($SourcePath))
    if (-not (Test-Path -LiteralPath $TargetPath -PathType Leaf)) {
        Move-Item -LiteralPath $SourcePath -Destination $TargetPath
        $Stats.Moved++
        if ($Pending) { $Stats.Pending++ }
        if ($Person) { $Stats.People++ }
        return
    }
    if ((Get-FileHashValue $SourcePath) -eq (Get-FileHashValue $TargetPath)) {
        Remove-SafeFile $SourcePath 'Duplicate'
        return
    }
    $ConflictRoot = Ensure-Directory $ConflictDirectory
    $ConflictPath = Get-ConflictPath $ConflictRoot ([IO.Path]::GetFileName($SourcePath)) $ConflictSuffix
    Move-Item -LiteralPath $SourcePath -Destination $ConflictPath
    $Stats.Moved++
    $Stats.Pending++
}

function Get-NameSet {
    param([object[]]$Values)
    $Set = @{}
    foreach ($Value in $Values) {
        if ($null -eq $Value) { continue }
        $Name = [IO.Path]::GetFileName([string]$Value).ToLowerInvariant()
        if ($Name) { $Set[$Name] = $true }
    }
    return $Set
}

function Get-StemSetFromDirectory {
    param([string]$Directory)
    $Set = @{}
    if (-not (Test-Path -LiteralPath $Directory -PathType Container)) { return $Set }
    foreach ($File in Get-ChildItem -LiteralPath $Directory -File) {
        $Set[$File.BaseName.ToLowerInvariant()] = $true
    }
    return $Set
}

function Remove-EmptyTree {
    param([string]$Root)
    $RootPath = Assert-InSiteRoot $Root
    if (-not (Test-Path -LiteralPath $RootPath -PathType Container)) { return }
    $Directories = @(Get-ChildItem -LiteralPath $RootPath -Recurse -Directory | Sort-Object { $_.FullName.Length } -Descending)
    foreach ($Directory in $Directories) {
        if (@(Get-ChildItem -LiteralPath $Directory.FullName -Force).Count -eq 0) {
            Remove-Item -LiteralPath $Directory.FullName
        }
    }
    if (@(Get-ChildItem -LiteralPath $RootPath -Force).Count -eq 0) {
        Remove-Item -LiteralPath $RootPath
    }
}

$PalData = @(Get-Content -Raw -Encoding UTF8 (Join-Path $NewDataRoot '帕鲁.json') | ConvertFrom-Json)
$ItemData = @(Get-Content -Raw -Encoding UTF8 (Join-Path $NewDataRoot '物品.json') | ConvertFrom-Json)
$BuildingData = @(Get-Content -Raw -Encoding UTF8 (Join-Path $NewDataRoot '建筑.json') | ConvertFrom-Json)
$PalNames = Get-NameSet @($PalData | ForEach-Object { $_.头像文件 })
$ItemNames = Get-NameSet @($ItemData | ForEach-Object { $_.图标文件 })
$BuildingNames = Get-NameSet @($BuildingData | ForEach-Object { $_.图标文件 })

$PalDirectory = Join-Path $NewResourceRoot '帕鲁头像'
$PalPendingDirectory = Join-Path $NewResourceRoot '帕鲁头像待确认'
$PeopleDirectory = Join-Path $NewResourceRoot '人物头像'
$ItemDirectory = Join-Path $NewResourceRoot '物品图标'
$ItemPendingDirectory = Join-Path $NewResourceRoot '物品图标待确认'
$BuildingDirectory = Join-Path $NewResourceRoot '建筑图标'
$BuildingPendingDirectory = Join-Path $NewResourceRoot '建筑图标待确认'
$SkillDirectory = Join-Path $NewResourceRoot '技能图标'
$SkillPendingDirectory = Join-Path $NewResourceRoot '技能图标待确认'
$ElementDirectory = Join-Path $NewResourceRoot '属性图标'
$ElementPendingDirectory = Join-Path $NewResourceRoot '属性图标待确认'
$WorkDirectory = Join-Path $NewResourceRoot '工作图标'
$WorkPendingDirectory = Join-Path $NewResourceRoot '工作图标待确认'
$MapIconDirectory = Join-Path $NewResourceRoot '地图图标'
$MapPendingDirectory = Join-Path $NewResourceRoot '地图图标待确认'

$OldWorkData = Join-Path $OldDataRoot '工作速度计算器数据.js'
if (Test-Path -LiteralPath $OldWorkData -PathType Leaf) {
    Move-WithConflictProtection $OldWorkData $NewDataRoot $NewDataRoot '来自旧数据包'
}
foreach ($Name in @('物品数据.js', '装备数据.js', '建筑数据.js')) {
    Remove-SafeFile (Join-Path $OldDataRoot $Name)
}

$OldWallpaperRoot = Join-Path $OldResourceRoot '壁纸'
$InterfaceWallpaperRoot = Join-Path $ProgramRoot '界面资源\壁纸'
if (Test-Path -LiteralPath $OldWallpaperRoot -PathType Container) {
    foreach ($File in Get-ChildItem -LiteralPath $OldWallpaperRoot -File) {
        Move-WithConflictProtection $File.FullName $InterfaceWallpaperRoot $InterfaceWallpaperRoot '来自旧壁纸目录'
    }
}

$NewPalRoot = Join-Path $PalDirectory '新帕鲁'
if (Test-Path -LiteralPath $NewPalRoot -PathType Container) {
    foreach ($File in Get-ChildItem -LiteralPath $NewPalRoot -File) {
        Move-WithConflictProtection $File.FullName $PalDirectory $PalPendingDirectory '来自新帕鲁'
    }
    if (@(Get-ChildItem -LiteralPath $NewPalRoot -Force).Count -eq 0) {
        Remove-Item -LiteralPath (Assert-InSiteRoot $NewPalRoot)
    }
}

foreach ($File in @(Get-ChildItem -LiteralPath $ItemDirectory -File)) {
    $LowerName = $File.Name.ToLowerInvariant()
    if ($PalNames.ContainsKey($LowerName)) {
        Move-WithConflictProtection $File.FullName $PalDirectory $PalPendingDirectory '来自物品图标'
    } elseif ($BuildingNames.ContainsKey($LowerName)) {
        Move-WithConflictProtection $File.FullName $BuildingDirectory $BuildingPendingDirectory '来自物品图标'
    } elseif ($File.BaseName -match '^T_icon_buildObject_') {
        Move-WithConflictProtection $File.FullName $BuildingPendingDirectory $BuildingPendingDirectory '来自物品图标' -Pending
    } elseif (-not $ItemNames.ContainsKey($LowerName)) {
        Move-WithConflictProtection $File.FullName $ItemPendingDirectory $ItemPendingDirectory '来自物品图标' -Pending
    }
}

foreach ($File in @(Get-ChildItem -LiteralPath $ItemPendingDirectory -File)) {
    if ($File.BaseName -match '^T_icon_buildObject_') {
        Move-WithConflictProtection $File.FullName $BuildingPendingDirectory $BuildingPendingDirectory '来自物品图标待确认' -Pending
    }
}

foreach ($File in @(Get-ChildItem -LiteralPath $BuildingDirectory -File)) {
    if (-not $BuildingNames.ContainsKey($File.Name.ToLowerInvariant())) {
        Move-WithConflictProtection $File.FullName $BuildingPendingDirectory $BuildingPendingDirectory '来自建筑图标' -Pending
    }
}

$NpcPattern = '(?i)(CommonHuman|^T_Male_|^T_Female_|^T_Help\d+|People|Soldier|Farmer|Doctor|Merchant|Ranger|Believer|Presenter|Kunoichi|Police|Hunter|Shopkeeper|Human|FireCult|MobuCitizen|PalDealer|SalesPerson|Viking|Visitor_)'
foreach ($File in @(Get-ChildItem -LiteralPath $PalDirectory -File)) {
    if ($PalNames.ContainsKey($File.Name.ToLowerInvariant())) { continue }
    if ($File.BaseName -match $NpcPattern) {
        Move-WithConflictProtection $File.FullName $PeopleDirectory $PeopleDirectory '来自帕鲁头像' -Person
    } else {
        Move-WithConflictProtection $File.FullName $PalPendingDirectory $PalPendingDirectory '来自帕鲁头像' -Pending
    }
}

$OldCategoryTargets = @(
    @{ Source = '属性图标'; Target = $ElementDirectory; Pending = $ElementPendingDirectory },
    @{ Source = '工作图标'; Target = $WorkDirectory; Pending = $WorkPendingDirectory },
    @{ Source = '技能图标'; Target = $SkillDirectory; Pending = $SkillPendingDirectory }
)
foreach ($Rule in $OldCategoryTargets) {
    $SourceDirectory = Join-Path $OldIconRoot $Rule.Source
    if (-not (Test-Path -LiteralPath $SourceDirectory -PathType Container)) { continue }
    foreach ($File in Get-ChildItem -LiteralPath $SourceDirectory -File) {
        Move-WithConflictProtection $File.FullName $Rule.Target $Rule.Pending ("来自旧" + $Rule.Source)
    }
}

$OldImageRules = @(
    @{ Source = '帕鲁头像'; Target = $PalDirectory; Pending = $PalPendingDirectory },
    @{ Source = '物品图标'; Target = $ItemDirectory; Pending = $ItemPendingDirectory },
    @{ Source = '建筑图标'; Target = $BuildingDirectory; Pending = $BuildingPendingDirectory }
)
foreach ($Rule in $OldImageRules) {
    $SourceDirectory = Join-Path $OldIconRoot $Rule.Source
    if (-not (Test-Path -LiteralPath $SourceDirectory -PathType Container)) { continue }
    $TargetStems = Get-StemSetFromDirectory $Rule.Target
    foreach ($File in Get-ChildItem -LiteralPath $SourceDirectory -Recurse -File) {
        if ($TargetStems.ContainsKey($File.BaseName.ToLowerInvariant())) {
            Remove-SafeFile $File.FullName 'Duplicate'
        } else {
            Move-WithConflictProtection $File.FullName $Rule.Pending $Rule.Pending ("来自旧" + $Rule.Source) -Pending
        }
    }
}

$UsedMapIcons = Get-NameSet @(
    'T_icon_enemy_strong_white.webp',
    'T_Icon_Compass_Quest_1.webp',
    'T_icon_compass_11.webp',
    'T_icon_compass_00.webp',
    'T_icon_compass_Bounty.webp',
    'T_icon_compass_FTtower.webp',
    'T_icon_compass_tower.webp',
    'T_icon_compass_02.webp',
    'T_icon_compass_07.webp',
    'T_icon_compass_dungeon.webp',
    'T_icon_compass_TreasureMap_01.webp'
)
if (Test-Path -LiteralPath $OldMapRoot -PathType Container) {
    foreach ($File in @(Get-ChildItem -LiteralPath $OldMapRoot -File)) {
        if ($File.Name -match '^z\d+x\d+y\d+\.webp$') {
            Remove-SafeFile $File.FullName
            continue
        }
        if ($File.Name -eq '_make_white.mjs') {
            Remove-SafeFile $File.FullName
            continue
        }
        if ($File.BaseName -match '^T_icon_palwork_') {
            Move-WithConflictProtection $File.FullName $WorkDirectory $WorkPendingDirectory '来自旧地图目录'
            continue
        }
        if ($File.BaseName -match '^T_itemicon_') {
            $ItemStems = Get-StemSetFromDirectory $ItemDirectory
            if ($ItemStems.ContainsKey($File.BaseName.ToLowerInvariant())) {
                Remove-SafeFile $File.FullName 'Duplicate'
            } else {
                Move-WithConflictProtection $File.FullName $ItemPendingDirectory $ItemPendingDirectory '来自旧地图目录' -Pending
            }
            continue
        }
        if ($UsedMapIcons.ContainsKey($File.Name.ToLowerInvariant())) {
            Move-WithConflictProtection $File.FullName $MapIconDirectory $MapPendingDirectory '来自旧地图目录'
        } else {
            Move-WithConflictProtection $File.FullName $MapPendingDirectory $MapPendingDirectory '来自旧地图目录' -Pending
        }
    }
}

foreach ($PendingDirectory in @($PalPendingDirectory, $MapPendingDirectory)) {
    foreach ($File in @(Get-ChildItem -LiteralPath $PendingDirectory -File)) {
        if ($File.BaseName -match $NpcPattern) {
            Move-WithConflictProtection $File.FullName $PeopleDirectory $PeopleDirectory '来自待确认目录' -Person
        }
    }
}

Remove-SafeFile (Join-Path $OldResourceRoot '.gitkeep')
Remove-EmptyTree $OldDataRoot
Remove-EmptyTree $OldResourceRoot

Write-Host "整理完成：移动 $($Stats.Moved)，重复删除 $($Stats.DuplicateRemoved)，过时删除 $($Stats.ObsoleteRemoved)，人物头像 $($Stats.People)，待确认 $($Stats.Pending)。"
