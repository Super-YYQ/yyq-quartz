param(
    [string]$VaultPath = (Join-Path $PSScriptRoot "..\..\obsidian-yyq")
)

$ErrorActionPreference = "Stop"

$siteRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$contentRoot = [System.IO.Path]::GetFullPath((Join-Path $siteRoot "content"))
$vaultRoot = [System.IO.Path]::GetFullPath($VaultPath)

if (-not (Test-Path -LiteralPath $vaultRoot -PathType Container)) {
    throw "Knowledge base directory does not exist: $vaultRoot"
}

if (-not $contentRoot.StartsWith($siteRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to sync outside the Quartz directory: $contentRoot"
}

if (Test-Path -LiteralPath $contentRoot) {
    Get-ChildItem -LiteralPath $contentRoot -Force | Remove-Item -Recurse -Force
}
else {
    New-Item -ItemType Directory -Path $contentRoot | Out-Null
}

$publishedNotes = Get-ChildItem -LiteralPath $vaultRoot -Recurse -File -Filter "*.md" |
    Where-Object {
        $relativePath = [System.IO.Path]::GetRelativePath($vaultRoot, $_.FullName)
        $relativePath -notmatch '(^|[\\/])\.' -and
        $relativePath -notin @("task_plan.md", "findings.md", "progress.md") -and
        (Get-Content -LiteralPath $_.FullName -Raw) -match '(?ms)\A---\s*\r?\n.*?^publish:\s*true\s*$.*?^---\s*$'
    }

foreach ($note in $publishedNotes) {
    $relativePath = [System.IO.Path]::GetRelativePath($vaultRoot, $note.FullName)
    $targetPath = Join-Path $contentRoot $relativePath
    $targetDirectory = Split-Path -Parent $targetPath

    New-Item -ItemType Directory -Path $targetDirectory -Force | Out-Null
    Copy-Item -LiteralPath $note.FullName -Destination $targetPath
}

$indexPath = Join-Path $contentRoot "index.md"
$noteCount = @($publishedNotes).Count
$indexContent = @"
---
title: YYQ 的知识库
publish: true
---

# YYQ 的知识库

这里收录了公开发布的个人笔记。

当前已发布笔记数：$noteCount
"@

Set-Content -LiteralPath $indexPath -Value $indexContent -Encoding utf8

Write-Host "Synced $noteCount published note(s) from $vaultRoot"
Write-Host "Generated homepage: $indexPath"
