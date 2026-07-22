$ErrorActionPreference = 'Stop'

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$SiteRoot = Join-Path $ProjectRoot 'PalToolbox'
$ProgramRoot = Join-Path $SiteRoot '游戏内容\幻兽帕鲁'
$VersionRoot = Join-Path $SiteRoot '游戏内容\幻兽帕鲁1.0'
$DataRoot = Join-Path $VersionRoot '数据包'
$ResourceRoot = Join-Path $VersionRoot '资源包'
$PartnerSkillSourceRoot = Join-Path $VersionRoot '原始来源\伙伴技能'

function Assert-True {
    param([bool]$Condition, [string]$Message)
    if (-not $Condition) { throw $Message }
}

function Get-LowerNameSet {
    param([object[]]$Values)
    $Set = @{}
    foreach ($Value in $Values) {
        if ($null -eq $Value) { continue }
        $Name = [IO.Path]::GetFileName([string]$Value).ToLowerInvariant()
        if ($Name) { $Set[$Name] = $true }
    }
    return $Set
}

function Assert-ExactResourceSet {
    param(
        [string]$Label,
        [string]$Directory,
        [hashtable]$ExpectedNames
    )
    Assert-True (Test-Path -LiteralPath $Directory -PathType Container) "缺少正式目录: $Directory"
    $ActualFiles = @(Get-ChildItem -LiteralPath $Directory -File)
    $ActualNames = Get-LowerNameSet ($ActualFiles | Select-Object -ExpandProperty Name)
    $Missing = @($ExpectedNames.Keys | Where-Object { -not $ActualNames.ContainsKey($_) })
    $Unexpected = @($ActualNames.Keys | Where-Object { -not $ExpectedNames.ContainsKey($_) })
    Assert-True ($Missing.Count -eq 0) "$Label 缺少正式资源: $($Missing -join ', ')"
    Assert-True ($Unexpected.Count -eq 0) "$Label 正式目录混入未认领资源: $($Unexpected -join ', ')"
    return $ActualFiles.Count
}

Assert-True (-not (Test-Path -LiteralPath (Join-Path $ProgramRoot '数据包'))) '旧程序目录仍包含数据包'
Assert-True (-not (Test-Path -LiteralPath (Join-Path $ProgramRoot '资源包'))) '旧程序目录仍包含版本资源包'

$RequiredDirectories = @(
    (Join-Path $ProgramRoot '界面资源\壁纸'),
    (Join-Path $ResourceRoot '地图\瓦片\WorldMap'),
    (Join-Path $ResourceRoot '地图\瓦片\TreeMap'),
    (Join-Path $ResourceRoot '地图图标'),
    (Join-Path $ResourceRoot '地图图标待确认'),
    (Join-Path $ResourceRoot '帕鲁头像'),
    (Join-Path $ResourceRoot '帕鲁头像待确认'),
    (Join-Path $ResourceRoot '人物头像'),
    (Join-Path $ResourceRoot '物品图标'),
    (Join-Path $ResourceRoot '物品图标待确认'),
    (Join-Path $ResourceRoot '建筑图标'),
    (Join-Path $ResourceRoot '建筑图标待确认'),
    (Join-Path $ResourceRoot '技能图标'),
    (Join-Path $ResourceRoot '属性图标'),
    (Join-Path $ResourceRoot '工作图标')
)
foreach ($Directory in $RequiredDirectories) {
    Assert-True (Test-Path -LiteralPath $Directory -PathType Container) "缺少整理后目录: $Directory"
}
Assert-True (-not (Test-Path -LiteralPath (Join-Path $ResourceRoot '待确认'))) '禁止建立没有分类语境的总待确认目录'

$WorkSpeedData = Join-Path $DataRoot '工作速度计算器数据.js'
Assert-True (Test-Path -LiteralPath $WorkSpeedData -PathType Leaf) '工作速度数据尚未迁入 1.0 数据包'

$RuntimeFiles = @(Get-ChildItem -LiteralPath $SiteRoot -Recurse -File | Where-Object {
    $_.Extension -in @('.html', '.css', '.js') -and
    -not $_.Name.EndsWith('.test.js') -and
    $_.FullName -notmatch '\\外部库\\'
})
$ForbiddenReferences = @(
    '游戏内容/幻兽帕鲁/数据包',
    '幻兽帕鲁/资源包/图标资源包',
    '幻兽帕鲁/资源包/地图瓦片',
    '幻兽帕鲁/资源包/壁纸'
)
foreach ($Pattern in $ForbiddenReferences) {
    $Matches = @($RuntimeFiles | Select-String -SimpleMatch $Pattern)
    Assert-True ($Matches.Count -eq 0) "运行文件仍引用旧路径 $Pattern : $($Matches.Path -join ', ')"
}
$PendingReferences = @($RuntimeFiles | Select-String -Pattern '幻兽帕鲁1\.0/资源包/[^''"\r\n]*待确认')
Assert-True ($PendingReferences.Count -eq 0) "运行文件引用了待确认资源: $($PendingReferences.Path -join ', ')"

$EntryDirectory = Join-Path $SiteRoot '入口页面'
$DirectAssetReferences = @($RuntimeFiles | ForEach-Object {
    $Text = Get-Content -Raw -Encoding UTF8 $_.FullName
    [regex]::Matches($Text, '\.\./游戏内容/[^''"\r\n]+?\.(?:png|webp|jpg|jpeg)') | ForEach-Object { $_.Value }
} | Sort-Object -Unique)
foreach ($Reference in $DirectAssetReferences) {
    if ($Reference -match '[{+]') { continue }
    $LocalPath = [IO.Path]::GetFullPath((Join-Path $EntryDirectory ($Reference -replace '/', '\')))
    Assert-True (Test-Path -LiteralPath $LocalPath -PathType Leaf) "运行资源引用不存在: $Reference"
}

$MapCorePath = Join-Path $ProgramRoot '工具功能\地图指南\核心\地图指南核心.js'
$MapCoreText = Get-Content -Raw -Encoding UTF8 $MapCorePath
$MapResourceFragments = @([regex]::Matches($MapCoreText, "VERSION_RESOURCE_ROOT \+ '([^']+\.(?:png|webp|jpg|jpeg))'") |
    ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique)
foreach ($Fragment in $MapResourceFragments) {
    Assert-True (Test-Path -LiteralPath (Join-Path $ResourceRoot ($Fragment -replace '/', '\')) -PathType Leaf) "地图运行图标不存在: $Fragment"
}

$PalData = @(Get-Content -Raw -Encoding UTF8 (Join-Path $DataRoot '帕鲁.json') | ConvertFrom-Json)
$PalRecords = @($PalData[0])
$PartnerSkillData = Get-Content -Raw -Encoding UTF8 (Join-Path $DataRoot '伙伴技能.json') | ConvertFrom-Json
$ItemData = @(Get-Content -Raw -Encoding UTF8 (Join-Path $DataRoot '物品.json') | ConvertFrom-Json)
$BuildingData = @(Get-Content -Raw -Encoding UTF8 (Join-Path $DataRoot '建筑.json') | ConvertFrom-Json)
$PalNames = Get-LowerNameSet @($PalData | ForEach-Object { $_.头像文件 })
$ItemNames = Get-LowerNameSet @($ItemData | ForEach-Object { $_.图标文件 })
$BuildingNames = Get-LowerNameSet @($BuildingData | ForEach-Object { $_.图标文件 })

Assert-True (Test-Path -LiteralPath (Join-Path $PartnerSkillSourceRoot '来源.json') -PathType Leaf) '伙伴技能缺少原始来源清单'
Assert-True (Test-Path -LiteralPath (Join-Path $PartnerSkillSourceRoot 'paldb-partner-skill.html') -PathType Leaf) '伙伴技能缺少 PalDB 原始列表'
Assert-True ($PartnerSkillData.meta.source.url -eq 'https://paldb.cc/cn/Partner_Skill') '伙伴技能正式数据缺少来源 URL'
Assert-True ($PartnerSkillData.meta.source.retrievedAt -eq '2026-07-22') '伙伴技能正式数据缺少获取日期'
Assert-True ($PartnerSkillData.meta.source.gameVersion -eq 'v1.0.0') '伙伴技能正式数据游戏版本错误'
Assert-True ([bool]$PartnerSkillData.meta.source.transformVersion) '伙伴技能正式数据缺少转换版本'
Assert-True (@($PartnerSkillData.partnerSkills.PSObject.Properties).Count -eq $PalRecords.Count) '图鉴伙伴技能事实未覆盖全部帕鲁'
Assert-True (@($PartnerSkillData.internalParameters.PSObject.Properties).Count -gt 0) '伙伴技能缺少独立解包参数区块'
Assert-True ($PartnerSkillData.catalog.Count -gt 0) '伙伴技能缺少生成目录'
Assert-True ($null -ne $PartnerSkillData.conflicts) '伙伴技能缺少冲突记录区块'
$OrdinaryCatalogCount = @($PartnerSkillData.catalog | Where-Object { $_.category -eq '普通帕鲁' }).Count
$OrdinaryPalCount = @($PalRecords | Where-Object { $_.分类 -in @('基础', '亚种', '泰拉瑞亚') }).Count
Assert-True ($OrdinaryCatalogCount -eq $OrdinaryPalCount) '伙伴技能目录没有写全普通帕鲁'
$DuplicateCatalog = @($PartnerSkillData.catalog | Where-Object { $_.palId -match '_2$' })
Assert-True ($DuplicateCatalog.Count -eq 0) "伙伴技能目录混入重复 `_2 记录: $($DuplicateCatalog.palId -join ', ')"

$PalCount = Assert-ExactResourceSet '帕鲁头像' (Join-Path $ResourceRoot '帕鲁头像') $PalNames
$ItemCount = Assert-ExactResourceSet '物品图标' (Join-Path $ResourceRoot '物品图标') $ItemNames
$BuildingCount = Assert-ExactResourceSet '建筑图标' (Join-Path $ResourceRoot '建筑图标') $BuildingNames

$WorldTiles = @(Get-ChildItem -LiteralPath (Join-Path $ResourceRoot '地图\瓦片\WorldMap') -File -Filter 'z*x*y*.webp')
$TreeTiles = @(Get-ChildItem -LiteralPath (Join-Path $ResourceRoot '地图\瓦片\TreeMap') -File -Filter 'z*x*y*.webp')
Assert-True ($WorldTiles.Count -eq 340) "WorldMap 瓦片数量错误: $($WorldTiles.Count)"
Assert-True ($TreeTiles.Count -eq 340) "TreeMap 瓦片数量错误: $($TreeTiles.Count)"

$WallpaperCount = @(Get-ChildItem -LiteralPath (Join-Path $ProgramRoot '界面资源\壁纸') -File).Count
$MapIconCount = @(Get-ChildItem -LiteralPath (Join-Path $ResourceRoot '地图图标') -File).Count
$PeopleCount = @(Get-ChildItem -LiteralPath (Join-Path $ResourceRoot '人物头像') -File).Count
$PalPendingCount = @(Get-ChildItem -LiteralPath (Join-Path $ResourceRoot '帕鲁头像待确认') -File).Count
$ItemPendingCount = @(Get-ChildItem -LiteralPath (Join-Path $ResourceRoot '物品图标待确认') -File).Count
$BuildingPendingCount = @(Get-ChildItem -LiteralPath (Join-Path $ResourceRoot '建筑图标待确认') -File).Count
$MapPendingCount = @(Get-ChildItem -LiteralPath (Join-Path $ResourceRoot '地图图标待确认') -File).Count
Assert-True ($WallpaperCount -gt 0) '界面壁纸目录为空'
Assert-True ($MapIconCount -gt 0) '地图图标目录为空'
Assert-True ($PeopleCount -gt 0) '人物头像目录为空'
foreach ($PersonFile in @(
    'T_CommonHuman_icon_normal.webp',
    'T_character_common_human_00.webp',
    'T_Help01_icon_normal.png',
    'T_Help02_icon_normal.png',
    'T_Help03_icon_normal.png',
    'T_Help04_icon_normal.png'
)) {
    Assert-True (Test-Path -LiteralPath (Join-Path $ResourceRoot "人物头像\$PersonFile") -PathType Leaf) "明确人物头像未归入人物目录: $PersonFile"
}

$NewPalDirectory = Join-Path $ResourceRoot '帕鲁头像\新帕鲁'
Assert-True (-not (Test-Path -LiteralPath $NewPalDirectory)) '新帕鲁重复子目录仍然存在'

Write-Host "PASS: 1.0 数据资源结构正确；正式资源：帕鲁 $PalCount，物品 $ItemCount，建筑 $BuildingCount，人物 $PeopleCount，地图图标 $MapIconCount；待确认：帕鲁 $PalPendingCount，物品 $ItemPendingCount，建筑 $BuildingPendingCount，地图图标 $MapPendingCount。"
