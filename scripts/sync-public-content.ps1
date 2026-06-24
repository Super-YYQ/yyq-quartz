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
        $text = Get-Content -LiteralPath $_.FullName -Raw
        $frontmatter = [regex]::Match(
            $text,
            '\A---\s*\r?\n(?<content>.*?)\r?\n---\s*(?:\r?\n|$)',
            [System.Text.RegularExpressions.RegexOptions]::Singleline
        )

        $relativePath -notmatch '(^|[\\/])\.' -and
        $relativePath -notin @("task_plan.md", "findings.md", "progress.md") -and
        $frontmatter.Success -and
        $frontmatter.Groups["content"].Value -match '(?m)^publish:\s*true\s*$'
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

<nav class="home-topbar" aria-label="首页导航">
  <a class="home-topbar-brand" href="/" data-no-popover="true">YYQ 的知识库</a>
  <div class="home-topbar-links" data-nav-config="home-categories">
    <details class="home-nav-group">
      <summary>学习</summary>
      <div class="home-nav-dropdown">
        <a href="/Java/Java索引" data-no-popover="true">Java 索引</a>
        <a href="/windows/Windows索引" data-no-popover="true">Windows 索引</a>
        <a href="/Java/Arthas诊断" data-no-popover="true">Arthas 诊断</a>
      </div>
    </details>
    <details class="home-nav-group">
      <summary>开发</summary>
      <div class="home-nav-dropdown">
        <a href="/windows/Codex Claude 软件级代理设置教程" data-no-popover="true">AI 工具代理</a>
        <a href="/windows/Codex Windows 微软商店安装包提取与手动更新" data-no-popover="true">Codex Windows</a>
        <a href="/windows/Windows 公司网络下 FlyingBird TUN 与 Codex 共存配置" data-no-popover="true">TUN 与 Codex</a>
        <a href="/windows/Quartz 4 升级 Quartz 5 复盘" data-no-popover="true">Quartz 复盘</a>
      </div>
    </details>
    <details class="home-nav-group">
      <summary>工具</summary>
      <div class="home-nav-dropdown">
        <a href="/windows/电脑必备软件" data-no-popover="true">电脑必备软件</a>
        <a href="/windows/keepass密码管理工具/KeePass密码管理" data-no-popover="true">KeePass 密码管理</a>
        <a href="/windows/Obsidian 私人知识库自动发布 Quartz 与 Cloudflare Pages" data-no-popover="true">Obsidian 自动发布</a>
      </div>
    </details>
    <details class="home-nav-group">
      <summary>娱乐</summary>
      <div class="home-nav-dropdown">
        <a href="/blog/博客索引" data-no-popover="true">博客索引</a>
        <a href="/blog/hexo博客/Hexo博客搭建" data-no-popover="true">Hexo 博客搭建</a>
        <a href="/tags" data-no-popover="true">全部标签</a>
      </div>
    </details>
  </div>
  <div class="home-topbar-actions">
    <a class="home-github-link" href="https://github.com/Super-YYQ/yyq-quartz" data-no-popover="true" aria-label="GitHub">GitHub</a>
    <div class="search home-topbar-search">
      <button class="search-button" aria-label="搜索" aria-expanded="false">
        <svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 19.9 19.7">
          <title>Search</title>
          <g class="search-path" fill="none">
            <path stroke-linecap="square" d="M18.5 18.3l-5.4-5.4" />
            <circle cx="8" cy="8" r="7" />
          </g>
        </svg>
        <p>搜索</p>
        <span class="home-search-shortcut" aria-hidden="true">Ctrl K</span>
      </button>
      <div class="search-container">
        <div class="search-space">
          <input autocomplete="off" class="search-bar" name="search" type="text" aria-label="搜索些什么" placeholder="搜索些什么" />
          <div class="search-layout" data-preview="true" data-field-priority='["title","content","tags"]'></div>
        </div>
      </div>
    </div>
  </div>
</nav>

<section class="yyq-home-hero">
  <div class="yyq-hero-copy">
    <h1>技术、工具与知识管理</h1>
    <p>记录、整理、分享，构建属于自己的数字知识花园</p>
    <div class="yyq-hero-meta">
      <span>持续记录</span>
      <span>公开分享</span>
      <span>知识链接</span>
      <span>已发布 $noteCount 篇</span>
    </div>
  </div>
</section>

<section class="yyq-category-grid" aria-label="分类索引">
  <a class="yyq-category-card yyq-java" href="/Java/Java索引" data-no-popover="true">
    <span class="yyq-category-icon">♨</span>
    <strong>Java</strong>
    <small>基础、并发、JVM、源码</small>
    <p>诊断工具、开发实践、框架源码解析与问题复盘。</p>
    <span class="yyq-card-arrow">→</span>
  </a>
  <a class="yyq-category-card yyq-windows" href="/windows/Windows索引" data-no-popover="true">
    <span class="yyq-category-icon">▦</span>
    <strong>Windows</strong>
    <small>系统、终端、效率工具</small>
    <p>软件清单、系统配置、终端美化与故障排查。</p>
    <span class="yyq-card-arrow">→</span>
  </a>
  <a class="yyq-category-card yyq-blog" href="/blog/博客索引" data-no-popover="true">
    <span class="yyq-category-icon">✎</span>
    <strong>博客</strong>
    <small>搭建、维护、记录</small>
    <p>博客搭建维护、学习记录与阶段性思考沉淀。</p>
    <span class="yyq-card-arrow">→</span>
  </a>
  <a class="yyq-category-card yyq-tools" href="/windows/Obsidian 私人知识库自动发布 Quartz 与 Cloudflare Pages" data-no-popover="true">
    <span class="yyq-category-icon">✚</span>
    <strong>工具运维</strong>
    <small>自动化、部署、知识库</small>
    <p>开发工具、自动发布、Cloudflare Pages 与运维脚本。</p>
    <span class="yyq-card-arrow">→</span>
  </a>
</section>

<section class="yyq-recent-panel" aria-label="最近更新">
  <div class="yyq-section-head">
    <h2>最近更新</h2>
    <a href="/tags" data-no-popover="true">查看全部 →</a>
  </div>
  <a class="yyq-update-row" href="/windows/Codex Claude 软件级代理设置教程" data-no-popover="true">
    <span>
      <strong>Codex Claude 软件级代理设置教程</strong>
      <em>整理 Proxifier、名称解析、启动脚本和 TUN 兜底的 AI 工具代理方案。</em>
    </span>
    <small>代理</small>
  </a>
  <a class="yyq-update-row" href="/windows/Quartz 4 升级 Quartz 5 复盘" data-no-popover="true">
    <span>
      <strong>Quartz 4 升级 Quartz 5 复盘</strong>
      <em>记录从 Quartz 4 升级到 Quartz 5 的配置、构建与部署过程。</em>
    </span>
    <small>Quartz 5</small>
  </a>
  <a class="yyq-update-row" href="/windows/Obsidian 私人知识库自动发布 Quartz 与 Cloudflare Pages" data-no-popover="true">
    <span>
      <strong>Obsidian 自动发布 Quartz</strong>
      <em>通过自动化流程将 Obsidian 笔记发布到 Quartz 公开站点。</em>
    </span>
    <small>Obsidian</small>
  </a>
</section>
"@

Set-Content -LiteralPath $indexPath -Value $indexContent -Encoding utf8

Write-Host "Synced $noteCount published note(s) from $vaultRoot"
Write-Host "Generated homepage: $indexPath"
