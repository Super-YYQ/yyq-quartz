---
title: Obsidian 私人知识库自动发布 Quartz 与 Cloudflare Pages
publish: true
date: 2026-06-02
tags:
  - obsidian
  - quartz
  - cloudflare-pages
  - github-actions
  - 自动化
aliases:
  - Obsidian 自动发布 Quartz
  - Quartz Cloudflare Pages 自动部署
---

# Obsidian 私人知识库自动发布 Quartz 与 Cloudflare Pages

这套方案将私人 Obsidian 知识库作为唯一写作入口，只公开明确标记的笔记。公开内容会自动同步到 Quartz 仓库，再由 Cloudflare Pages 构建为静态网站。

> [!important] 核心原则
> 私人知识库与公开网站必须使用两个独立仓库。只有 frontmatter 中显式声明 `publish: true` 的 Markdown 笔记可以进入公开仓库。

## 一、当前架构

| 项目 | 当前配置 |
| --- | --- |
| 私人知识库本地目录 | `<PRIVATE_VAULT_DIR>` |
| 私人 GitHub 仓库 | `<GITHUB_USER>/<PRIVATE_VAULT_REPO>` |
| 私人仓库分支 | `main` |
| Quartz 本地目录 | `<QUARTZ_SITE_DIR>` |
| Quartz GitHub 仓库 | `<GITHUB_USER>/<QUARTZ_REPO>` |
| Quartz 生产分支 | `v5` |
| Cloudflare Pages 域名 | `https://<PROJECT_NAME>.pages.dev` |
| Quartz 版本 | `5.0.0` |
| Node.js 版本 | `>=22` |

```mermaid
flowchart LR
    A["Obsidian 私人知识库"] -->|"Obsidian Git 自动提交与推送"| B["私人仓库 / main"]
    B -->|"GitHub Actions"| C["筛选 publish: true"]
    C -->|"同步 content/ 并推送"| D["Quartz 公开仓库 / v5"]
    D -->|"Cloudflare Pages Git 集成"| E["安装插件并构建"]
    E --> F["<PROJECT_NAME>.pages.dev"]
```

## 二、日常发布

### 2.1 发布一篇笔记

在需要公开的笔记顶部加入：

```yaml
---
title: 示例笔记
publish: true
---
```

保存后不需要手动复制文件。当前 Obsidian Git 插件会自动提交并推送私人知识库，后续流水线会继续完成公开同步和网站部署。

### 2.2 保持笔记私密

以下情况不会被公开：

- 没有 frontmatter 的笔记
- frontmatter 中没有 `publish: true` 的笔记
- `publish: false` 的笔记
- 隐藏目录中的笔记，例如 `.obsidian`
- 临时规划文件：`task_plan.md`、`findings.md`、`progress.md`

> [!warning] 发布前检查
> 不要在公开笔记中写入密码、Token、内网域名、私人附件路径或其他敏感信息。`publish: true` 是公开开关，不是草稿标记。

## 三、本地自动推送私人库

私人知识库使用 Obsidian Git 插件自动备份。当前关键设置位于：

```text
<PRIVATE_VAULT_DIR>\.obsidian\plugins\obsidian-git\data.json
```

当前行为：

| 设置 | 值 | 作用 |
| --- | --- | --- |
| `autoBackupAfterFileChange` | `true` | 笔记发生变化后自动备份 |
| `autoSaveInterval` | `5` | 约每 5 分钟自动提交 |
| `autoPushInterval` | `5` | 约每 5 分钟自动推送 |
| `autoPullInterval` | `10` | 约每 10 分钟自动拉取 |
| `autoPullOnBoot` | `true` | 打开 Obsidian 时先拉取 |
| `pullBeforePush` | `true` | 推送前先拉取，减少冲突 |
| `commitMessage` | `vault backup: {{date}}` | 自动提交信息 |

需要立即发布时，也可以在私人知识库目录手动执行：

```powershell
git add .
git commit -m "docs: publish note"
git push origin main
```

## 四、GitHub Actions 自动同步

私人仓库中的工作流文件：

```text
.github/workflows/publish-quartz.yml
```

触发条件：

- 向 `<PRIVATE_VAULT_REPO>/main` 推送提交
- 在 GitHub Actions 页面手动运行 `workflow_dispatch`

工作流会执行以下步骤：

1. 检出私人知识库到 `vault/`
2. 检出 `<GITHUB_USER>/<QUARTZ_REPO>` 的 `v5` 分支到 `site/`
3. 运行 `site/scripts/sync-public-content.ps1 -VaultPath .\vault`
4. 仅提交公开仓库中的 `content/`
5. 如果公开内容没有变化，则正常退出，不创建空提交
6. 如果有变化，则推送到 `<QUARTZ_REPO>/v5`

### 4.1 配置 GitHub Token

私人仓库工作流需要向公开仓库写入内容，因此私人仓库中必须存在 Actions Secret：

```text
<QUARTZ_PUBLISH_SECRET>
```

推荐创建 GitHub Fine-grained personal access token：

1. 在 GitHub 个人设置中进入 `Developer settings` → `Personal access tokens` → `Fine-grained tokens`
2. 将仓库访问范围限制为 `<GITHUB_USER>/<QUARTZ_REPO>`
3. 为 `Contents` 授予 `Read and write`
4. 将 Token 保存到私人仓库 `<GITHUB_USER>/<PRIVATE_VAULT_REPO>`
5. 进入 `Settings` → `Secrets and variables` → `Actions`
6. 新建 Repository secret，例如命名为 `<QUARTZ_PUBLISH_SECRET>`

> [!danger] 不要提交 Token
> Token 只能保存在 GitHub Actions Secret 中。不要将真实值写入 Markdown、脚本、Git 提交或聊天记录。

## 五、公开内容同步脚本

同步脚本位于公开仓库：

```text
scripts/sync-public-content.ps1
```

脚本的主要逻辑：

1. 定位 Quartz 仓库中的 `content/`
2. 校验目标目录必须位于 Quartz 仓库内部
3. 清空旧的 `content/`
4. 递归扫描私人知识库中的 Markdown 文件
5. 仅解析文件开头的 frontmatter，并复制其中包含 `publish: true` 的文件
6. 保持原始目录结构
7. 自动生成公开首页 `content/index.md`

> [!warning] 不要直接维护 `content/`
> `content/` 是同步脚本生成的目录。每次同步都会清空并重建。需要修改公开内容时，应修改私人知识库中的源笔记。

### 5.1 本地同步

在 Quartz 仓库中执行：

```powershell
cd <QUARTZ_SITE_DIR>
.\scripts\sync-public-content.ps1
```

脚本默认从相邻目录 `..\obsidian-yyq` 读取私人知识库。需要指定其他目录时：

```powershell
.\scripts\sync-public-content.ps1 -VaultPath "D:\notes\my-vault"
```

## 六、Quartz 配置

公开仓库中的核心配置文件：

```text
quartz.config.yaml
```

当前关键配置：

```yaml
configuration:
  pageTitle: "<SITE_TITLE>"
  locale: "zh-CN"
  baseUrl: "<PROJECT_NAME>.pages.dev"
  ignorePatterns:
    - private
    - templates
    - .obsidian
plugins:
  - source: github:quartz-community/explicit-publish
    enabled: true
```

同步脚本与 `explicit-publish` 插件形成两层保护：

1. 同步脚本只解析文件开头的 frontmatter，并复制带有 `publish: true` 的 Markdown
2. Quartz 构建时再次过滤未显式发布的页面

### 6.1 本地预览

首次运行前安装依赖：

```powershell
cd <QUARTZ_SITE_DIR>
npm install
```

同步内容并启动本地预览：

```powershell
.\scripts\sync-public-content.ps1
node .\quartz\bootstrap-cli.mjs plugin install --from-config --clean
node .\quartz\bootstrap-cli.mjs build --serve
```

浏览器打开：

```text
http://localhost:8080/
```

## 七、Cloudflare Pages 自动部署

Cloudflare Pages 使用 Git 集成监听公开仓库。每次 `<QUARTZ_REPO>/v5` 收到新提交后，Cloudflare Pages 都会重新构建并发布网站。

### 7.1 Cloudflare Pages 配置

在 Cloudflare Dashboard 中进入 `Workers & Pages`，创建 Pages 项目并导入已有 GitHub 仓库：

```text
<GITHUB_USER>/<QUARTZ_REPO>
```

构建配置：

| 配置项 | 值 |
| --- | --- |
| Production branch | `v5` |
| Framework preset | `None` |
| Build command | `node quartz/bootstrap-cli.mjs plugin install --from-config --clean && node quartz/bootstrap-cli.mjs build` |
| Build output directory | `public` |
| Root directory | 留空，使用仓库根目录 |

部署成功后，Cloudflare Pages 会提供：

```text
https://<PROJECT_NAME>.pages.dev
```

如果后续绑定自定义域名，需要同步修改 `quartz.config.yaml` 中的 `baseUrl`。

### 7.2 为什么不需要 Cloudflare Token

当前使用 Cloudflare Pages 的 Git 集成。Cloudflare 直接监听公开 GitHub 仓库并自动部署，因此 GitHub Actions 不需要保存 Cloudflare API Token。

## 八、完整发布链路

一次正常发布会出现两次 Git 推送：

1. Obsidian Git 将私人笔记推送到 `<PRIVATE_VAULT_REPO>/main`
2. 私人仓库的 GitHub Actions 将筛选后的内容推送到 `<QUARTZ_REPO>/v5`
3. Cloudflare Pages 检测到公开库变化，安装 Quartz 5 插件并运行构建
4. Cloudflare Pages 将 `public/` 目录发布到网站

查看进度的位置：

| 阶段 | 检查位置 |
| --- | --- |
| 私人库是否推送成功 | `<GITHUB_USER>/<PRIVATE_VAULT_REPO>` 提交记录 |
| 自动筛选是否成功 | 私人库 GitHub Actions：`Publish Quartz notes` |
| 公开内容是否更新 | `<GITHUB_USER>/<QUARTZ_REPO>` 的 `v5` 分支 |
| 网站是否部署成功 | Cloudflare Pages 项目的 Deployments 页面 |

## 九、附件处理

当前同步脚本只复制 Markdown，不复制本地图片、PDF 或其他附件。

现有公开笔记中的图片使用远程 URL，因此可以正常显示。后续如果需要公开 Obsidian 本地附件，应增加附件白名单，只复制被公开笔记引用的资源，避免把私人附件整体上传。

## 十、常见问题

### 10.1 保存笔记后网站没有更新

按顺序检查：

1. 笔记 frontmatter 是否包含 `publish: true`
2. Obsidian Git 是否已经推送到 `<PRIVATE_VAULT_REPO>/main`
3. 私人仓库的 `Publish Quartz notes` 工作流是否成功
4. `<QUARTZ_REPO>/v5` 是否出现新的 `content: sync published notes` 提交
5. Cloudflare Pages 的最新 Deployment 是否成功

### 10.2 GitHub Actions 无法推送公开库

重点检查：

- 私人仓库是否存在 `<QUARTZ_PUBLISH_SECRET>`
- Token 是否过期
- Token 是否仅授权给 `<GITHUB_USER>/<QUARTZ_REPO>`
- Token 的 `Contents` 权限是否为 `Read and write`
- 工作流检出的公开分支是否仍为 `v5`

### 10.3 Cloudflare Pages 构建失败

本地先复现：

```powershell
cd <QUARTZ_SITE_DIR>
npm install
.\scripts\sync-public-content.ps1
node .\quartz\bootstrap-cli.mjs plugin install --from-config --clean
node .\quartz\bootstrap-cli.mjs build
```

如果本地构建成功，再检查 Cloudflare Pages：

- Production branch 是否为 `v5`
- Build command 是否为 `node quartz/bootstrap-cli.mjs plugin install --from-config --clean && node quartz/bootstrap-cli.mjs build`
- Build output directory 是否为 `public`
- Node.js 版本是否满足 Quartz 要求

### 10.4 公开页面出现不应发布的内容

立即处理：

1. 在私人源笔记中删除 `publish: true` 或改为 `publish: false`
2. 推送私人库，等待自动同步删除公开副本
3. 检查 GitHub 公开仓库的历史提交中是否仍包含敏感信息
4. 如果敏感信息已经进入 Git 历史，轮换相关密码或 Token，并清理 Git 历史

## 十一、关键文件清单

| 文件 | 用途 |
| --- | --- |
| `<PRIVATE_VAULT_DIR>\.obsidian\plugins\obsidian-git\data.json` | Obsidian Git 自动备份设置 |
| `<PRIVATE_VAULT_DIR>\.github\workflows\publish-quartz.yml` | 私人库推送后自动发布 |
| `<QUARTZ_SITE_DIR>\scripts\sync-public-content.ps1` | 筛选并复制公开笔记 |
| `<QUARTZ_SITE_DIR>\quartz.config.yaml` | Quartz 网站配置与二次过滤 |
| `<QUARTZ_SITE_DIR>\content\` | 自动生成的公开笔记目录 |

## 十二、参考文档

- [Quartz 官方文档](https://quartz.jzhao.xyz/)
- [Cloudflare Pages Git integration](https://developers.cloudflare.com/pages/configuration/git-integration/)
- [Cloudflare Pages GitHub integration](https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/)
- [Cloudflare Pages build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/)
