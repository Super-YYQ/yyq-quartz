# YYQ Quartz 使用说明

## 发布一篇笔记

在知识库笔记的 frontmatter 中加入：

```yaml
publish: true
```

然后在 Quartz 目录执行：

```powershell
.\scripts\sync-public-content.ps1
npx quartz build --serve
```

浏览器打开 `http://localhost:8080/`。

## 部署前修改

在 `quartz.config.ts` 中将 `baseUrl: "example.com"` 替换为最终域名。

如果使用 Cloudflare Pages：

- Production branch: `v4`
- Framework preset: `None`
- Build command: `npx quartz build`
- Build output directory: `public`

## 安全说明

- `content/` 是同步脚本生成的公开目录，不要在其中保存私人内容。
- 同步脚本默认只复制带有 `publish: true` 的 Markdown。
- 当前脚本不会复制本地附件。需要公开附件时，再增加附件白名单。
