# Quartz 5 迁移记录与主题候选

## 当前结论

- 已在隔离工作区 `C:\tmp\yyq-quartz-v5` 创建本地分支 `codex/quartz-v5-migration`。
- 基线来自上游 `jackyzha0/quartz` 的 `v5` 分支，版本显示为 `Quartz v5.0.0`。
- 已移植：
  - `quartz.config.yaml`
  - `scripts/sync-public-content.ps1`
  - `SETUP.md`
  - 公开 `content/`
- 已验证：
  - `.\scripts\sync-public-content.ps1 -VaultPath 'E:\github仓库\obsidian-yyq'`
  - `node .\quartz\bootstrap-cli.mjs plugin install --from-config --clean`
  - `node .\quartz\bootstrap-cli.mjs build`
- 构建结果：
  - 同步 9 篇公开笔记
  - Quartz 处理 10 个输入文件，包括自动生成首页
  - 输出 132 个静态文件到 `public/`

## 迁移注意

Quartz 5 和 Quartz 4 差异较大：

- 配置从 `quartz.config.ts`/`quartz.layout.ts` 转为 `quartz.config.yaml`。
- 功能拆成插件，配置中通过 `source: github:quartz-community/...` 声明。
- `explicit-publish` 在 v5 默认配置中是关闭的，本站必须启用。
- 当前本机 Node 是 `v24.14.0`，运行 `npm run install-plugins` 会触发 `.scss` ESM 解析问题。
- `npx quartz plugin install` 在当前 Windows/Node 24 环境下会卡住；直接调用本地 CLI 可正常工作。
- 已将插件配置收紧为只保留实际启用的插件，并使用 `--from-config --clean` 生成 `.quartz/plugins` 索引。

## 明早切换生产前需要确认

1. 推送当前 v4 的同步脚本安全修复。

说明：私人库已推送到远端，GitHub Actions 已生成 `origin/v4` 上的公开内容提交 `b8d74e6 content: sync published notes`。本地 v4 已 rebase 到该提交之后，目前只领先 1 个脚本修复提交。

```powershell
git -C "E:\github仓库\yyq-quartz" push origin v4
```

2. 推送 v5 迁移分支，建议远端分支名为 `v5`。

3. Cloudflare Pages 将 Production branch 从 `v4` 改为 `v5`。

4. 私人库 workflow `.github/workflows/publish-quartz.yml` 中：

```yaml
ref: v4
git push origin v4
```

改为：

```yaml
ref: v5
git push origin v5
```

5. Cloudflare Pages 构建命令改为：

```text
node quartz/bootstrap-cli.mjs plugin install --from-config --clean && node quartz/bootstrap-cli.mjs build
```

输出目录仍是：

```text
public
```

## 主题候选

Quartz 5 的主题主要通过两层实现：

- `quartz.config.yaml` 中的 `theme.colors` 与 `theme.typography`
- `quartz/styles/custom.scss` 中的局部样式覆盖

### 方案 A：清爽技术文档风

适合当前 Java、Windows、工具类知识库。特点是高可读、低装饰、暗色模式舒服。

- 主色：深蓝灰
- 辅色：低饱和青绿
- 字体：保留 Quartz 默认组合
- 改动范围：只改 `theme.colors`

适合你想要的效果：像技术手册、个人 Wiki。

### 方案 B：Obsidian 风深色优先

更贴近 Obsidian 默认深色体验，暗色背景更深，链接使用紫蓝色。

- 主色：紫蓝
- 背景：接近 Obsidian 深色
- 字体：可考虑 `Inter` + `JetBrains Mono`
- 改动范围：`theme.colors` + `theme.typography`

适合你想要的效果：像公开版 Obsidian。

### 方案 C：温暖数字花园风

更有个人博客感，背景偏暖白，强调色偏棕/橙，适合长期写作。

- 主色：暖棕
- 辅色：鼠尾草绿
- 背景：暖白
- 改动范围：`theme.colors` + 少量 `custom.scss`

适合你想要的效果：像个人花园、随笔和知识沉淀。

### 方案 D：卡片化现代风

保留 Quartz 结构，但通过 `custom.scss` 增加卡片、圆角、阴影、目录间距。

- 主色：可结合 A/B/C 任一配色
- 页面主体：卡片化
- 侧栏：更明显的边界和层次
- 改动范围：`theme.colors` + `quartz/styles/custom.scss`

适合你想要的效果：更精致，但维护成本略高。

### 方案 E：Obsidian 社区主题路线

Quartz 5 新方向支持 Obsidian 社区主题，并带实验性 Style Settings 支持。它的可玩性最高，但也是最需要人工选择和测试的一条路线。

可通过 `quartz-themes` 社区插件配置：

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

可优先试这些风格：

- `tokyo-night`：现代暗色代码编辑器风格，适合技术笔记
- `catppuccin`：柔和、耐看，可选 `latte`、`frappe`、`macchiato`、`mocha`
- `nord`：冷静、克制，适合长期阅读
- `rose-pine`：温暖暗色，个人站点气质更明显
- `dracula-official`：强对比暗色，代码块观感突出
- `aura`：偏紫色调，视觉更鲜明

建议先选 A/B/C/D 中一个作为稳定方案，再把 E 当作后续试验。

## 推荐

我建议明天先选：

1. `A 清爽技术文档风`：最稳，和当前内容匹配。
2. `B Obsidian 风深色优先`：如果你希望网站看起来更像 Obsidian。
3. `D 卡片化现代风`：如果你愿意接受一点维护成本换视觉精致度。

我的个人偏好：先上 A，再轻度加入 D 的圆角和间距。这样公开站点会干净、耐看，也不至于改得太花。

## 参考

- Quartz v5 Reddit 发布说明提到：v5 重写为插件系统、YAML 配置，并增强 Obsidian 兼容性：https://www.reddit.com/r/ObsidianMD/comments/1tnh02x/quartz_v5_rebuilt_from_the_ground_up/
- Quartz v5 主题系统通过 `quartz.config.yaml` 的颜色/字体和 `quartz/styles/custom.scss` 扩展：https://deepwiki.com/quartz-community/v5/2.3-theme-and-styling
- Quartz Themes 插件说明和可选主题：https://saberzero1.github.io/quartz-syncer-docs/Guides/Using-an-Obsidian-theme-in-Quartz
- Quartz Themes 仓库：https://github.com/saberzero1/quartz-themes
- Obsidian Garden Gallery 可用于浏览 Quartz 站点灵感：https://vaults.obsidian-community.com/
