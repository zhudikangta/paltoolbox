$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$RootIndex = Join-Path $ProjectRoot 'index.html'
$NoJekyll = Join-Path $ProjectRoot '.nojekyll'

function Assert-True {
    param([bool]$Condition, [string]$Message)
    if (-not $Condition) { throw $Message }
}

$EntryDirectory = -join @([char]0x5165, [char]0x53E3, [char]0x9875, [char]0x9762)
$ExpectedTarget = "PalToolbox/$EntryDirectory/index.html"

Assert-True (Test-Path -LiteralPath $RootIndex -PathType Leaf) "GitHub Pages root entry missing: $RootIndex"
Assert-True (Test-Path -LiteralPath $NoJekyll -PathType Leaf) "GitHub Pages .nojekyll missing: $NoJekyll"

$IndexText = Get-Content -Raw -Encoding UTF8 $RootIndex
$ExpectedEntry = Join-Path (Join-Path $ProjectRoot 'PalToolbox') (Join-Path $EntryDirectory 'index.html')
Assert-True ($IndexText.Contains($ExpectedTarget)) "Root entry does not target: $ExpectedTarget"
Assert-True (Test-Path -LiteralPath $ExpectedEntry -PathType Leaf) 'Current website entry does not exist'

Write-Host "PASS: GitHub Pages root entry targets $ExpectedTarget"
