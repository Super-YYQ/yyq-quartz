---
title: Quartz 4 升级 Quartz 5 复盘
publish: true
date: 2026-06-03
tags:
  - quartz
  - cloudflare-pages
  - github-actions
  - obsidian
  - upgrade
aliases:
  - Quartz 5 升级复盘
  - Quartz v4 升级 v5
type: tutorial
status: stable
---

# Quartz 4 升级 Quartz 5 复盘

本文记录一次将 Obsidian 私人知识库的 Quartz 公开站点从 Quartz 4 升级到 Quartz 5 的过程。真实仓库名、本机路径、站点域名、Secret 名称均已脱敏。

相关笔记：[[Obsidian 私人知识库自动发布 Quartz 与 Cloudflare Pages]]

## 一、升级目标

- 私人 Obsidian 知识库：`<PRIVATE_VAULT_REPO>`
- Quartz 公开站点仓库：`<QUARTZ_REPO>`
- 公开内容筛选方式：frontmatter 中的 `publish: true`
- 部署平台：Cloudflare Pages
- 原生产分支：`v4`
- 新生产分支：`v5`

目标是升级到 Quartz 5，同时保留“私人库写作、公开库发布、Cloudflare 自动部署”的链路。

## 二、Quartz 5 的关键变化

| 项目 | Quartz 4 | Quartz 5 |
| --- | --- | --- |
| 配置文件 | `quartz.config.ts`、`quartz.layout.ts` | `quartz.config.yaml` |
| 功能组织 | 内置 TypeScript 插件 | GitHub 插件化 |
| 构建前置 | 通常直接 `npx quartz build` | 需要先安装/恢复 `.quartz/plugins` |
| 显式发布 | TS 配置启用 | YAML 中启用 `explicit-publish` |

> [!important]
> Quartz 5 默认配置中 `explicit-publish` 不是开启状态。公开知识库必须显式启用。

## 三、迁移步骤

### 3.1 建立隔离迁移分支

不要直接在生产分支迁移。建议从上游 Quartz 5 创建隔离分支：

```powershell
git worktree add -b <MIGRATION_BRANCH> "<QUARTZ_V5_WORKTREE>" upstream/v5
```

迁移完成后，将该分支推送为公开仓库的 `v5` 分支：

```powershell
git -C "<QUARTZ_V5_WORKTREE>" push origin <MIGRATION_BRANCH>:v5
```

### 3.2 迁移站点配置

Quartz 5 使用 `quartz.config.yaml`。关键配置：

```yaml
configuration:
  pageTitle: <SITE_TITLE>
  locale: zh-CN
  baseUrl: <PROJECT_NAME>.pages.dev

plugins:
  - source: github:quartz-community/explicit-publish
    enabled: true
```

为了降低迁移风险，只保留实际启用的插件；暂时不把禁用插件写进 YAML。

### 3.3 迁移同步脚本

同步脚本继续从私人知识库扫描 Markdown，并只复制文件开头 frontmatter 中含有 `publish: true` 的笔记。

判断公开标记时必须只解析开头 frontmatter，不要用跨全文正则搜索：

```powershell
$frontmatter = [regex]::Match(
    $text,
    '\A---\s*\r?\n(?<content>.*?)\r?\n---\s*(?:\r?\n|$)',
    [System.Text.RegularExpressions.RegexOptions]::Singleline
)

$frontmatter.Success -and
$frontmatter.Groups["content"].Value -match '(?m)^publish:\s*true\s*$'
```

这样正文中的示例代码不会被误判为公开标记。

### 3.4 Cloudflare Pages 构建命令

Quartz 5 的 `.quartz/plugins` 是运行时生成目录，不应提交到 Git。Cloudflare Pages 是干净构建环境，所以构建前必须安装插件。

最终构建命令：

```text
node quartz/bootstrap-cli.mjs plugin install --from-config --clean && node quartz/bootstrap-cli.mjs build
```

输出目录仍然是：

```text
public
```

## 四、遇到的问题与处理

### 问题一：正文中的 `publish: true` 被误判为公开

旧脚本使用跨全文正则，正文示例里的 `publish: true` 也会触发公开。

处理方式：

- 先截取文件开头的 frontmatter
- 只在 frontmatter 内判断 `publish: true`
- 做回归验证：正文示例不触发公开，frontmatter 标记才触发公开

### 问题二：`npx quartz plugin install` 在 Windows / Node 24 下卡住

现象：

```powershell
npx quartz plugin install
```

在本机环境中无输出卡住，进程残留。

处理方式：

```powershell
node .\quartz\bootstrap-cli.mjs plugin install --from-config --clean
node .\quartz\bootstrap-cli.mjs build
```

直接调用仓库内 Quartz CLI 可以正常完成。

### 问题三：`npm run install-plugins` 触发 `.scss` ESM 解析错误

现象：

```text
TypeError [ERR_UNKNOWN_FILE_EXTENSION]: Unknown file extension ".scss"
```

处理方式：

- 不使用 `npm run install-plugins` 作为构建前置
- 改用 `node quartz/bootstrap-cli.mjs plugin install --from-config --clean`
- 再执行 `node quartz/bootstrap-cli.mjs build`

### 问题四：`quartz.lock.json` 残留未启用插件

按 lockfile 恢复时，未启用的主题插件也可能被安装。

处理方式：

- 使用 `--from-config --clean`
- 从 `quartz.config.yaml` 移除当前不用的 `enabled: false` 插件块
- 让 lockfile 只保留当前配置实际需要的插件

### 问题五：Cloudflare 构建环境没有 `.quartz/plugins`

本地构建可能依赖已有缓存，而 Cloudflare 新环境没有。

处理方式是在 Cloudflare 构建命令中显式安装插件：

```text
node quartz/bootstrap-cli.mjs plugin install --from-config --clean && node quartz/bootstrap-cli.mjs build
```

并用全新临时副本验证：不带 `.quartz`、`node_modules`、`public`，从 `npm install` 开始完整构建。

### 问题六：生产分支切换顺序

不能先改私人库 workflow，否则自动同步会推送到尚未准备好的分支。

推荐顺序：

1. 推送旧生产分支上的安全修复。
2. 推送新 `v5` 分支。
3. Cloudflare Pages 生产分支切到 `v5`。
4. 私人库 workflow 从 `v4` 改为 `v5`。

## 五、最终验证

干净环境验证流程：

```powershell
npm install --registry=https://registry.npmjs.org
node .\quartz\bootstrap-cli.mjs plugin install --from-config --clean
node .\quartz\bootstrap-cli.mjs build
```

验证结果：

- 成功安装 33 个 Quartz 5 插件
- 公开内容：9 篇笔记
- Quartz 输入文件：10 个，包括自动生成首页
- 输出静态文件：132 个
- 输出目录：`public`

## 六、自动发布链路切换

私人库 GitHub Actions 原逻辑：

```yaml
ref: v4
git push origin v4
```

迁移后改为：

```yaml
ref: v5
git push origin v5
```

这样私人库推送后会自动同步公开内容到 Quartz 5 分支，并触发 Cloudflare Pages 构建。

## 七、主题美化调研

Quartz 5 的主题主要有两条路线。

### 路线一：稳定配置化美化

通过 `quartz.config.yaml` 修改：

- `theme.colors`
- `theme.typography`

再通过 `quartz/styles/custom.scss` 做少量样式增强。

推荐方案：

| 方案 | 特点 | 适用场景 |
| --- | --- | --- |
| 清爽技术文档风 | 高可读、低装饰 | 技术笔记、工具手册 |
| Obsidian 深色风 | 更接近 Obsidian | 想保持本地写作体验 |
| 温暖数字花园风 | 暖白背景、博客感 | 随笔和知识沉淀 |
| 卡片化现代风 | 圆角、间距、层次更明显 | 想让站点更精致 |

个人建议：先采用“清爽技术文档风 + 少量卡片化圆角”。

### 路线二：社区主题插件

Quartz 5 可以通过社区主题插件尝试 Obsidian 风格主题，例如：

- `tokyo-night`
- `catppuccin`
- `nord`
- `rose-pine`
- `dracula-official`
- `aura`

示例：

```yaml
plugins:
  - source:
      name: quartz-themes
      repo: "https://github.com/saberzero1/quartz-themes.git"
      subdir: plugin
    enabled: true
    options:
      theme: tokyo-night
      mode: both
      calloutStyle: glass
```

这条路线可玩性更高，但引入额外插件和适配成本。建议等基础 v5 站点稳定后再尝试。

## 八、经验总结

1. 迁移 Quartz 大版本时，先用隔离 worktree，不要直接动生产分支。
2. 公开内容筛选必须只看 frontmatter，不要全文搜索 `publish: true`。
3. Quartz 5 的插件目录是构建产物，不应依赖本地缓存。
4. Cloudflare Pages 要使用可在干净环境复现的构建命令。
5. 新生产分支、Cloudflare 分支、私人库 workflow 三者要按顺序切换。
6. 主题美化先求稳，再逐步尝试社区主题。

## 九、参考

- [Quartz 官方文档](https://quartz.jzhao.xyz/)
- [Quartz v5 讨论](https://www.reddit.com/r/ObsidianMD/comments/1tnh02x/quartz_v5_rebuilt_from_the_ground_up/)
- [Quartz v5 Theme and Styling](https://deepwiki.com/quartz-community/v5/2.3-theme-and-styling)
- [Quartz Themes 插件说明](https://saberzero1.github.io/quartz-syncer-docs/Guides/Using-an-Obsidian-theme-in-Quartz)
- [Quartz Themes 仓库](https://github.com/saberzero1/quartz-themes)
