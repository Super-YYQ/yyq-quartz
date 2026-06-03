# YYQ Quartz v5 使用说明

## 发布一篇笔记

在私人知识库笔记的 frontmatter 中加入：

```yaml
publish: true
```

正常提交并推送私人知识库即可。私人仓库中的 GitHub Actions 会自动同步公开笔记，并触发 Cloudflare Pages 重新部署。

## 本地预览

在 Quartz 目录执行：

```powershell
.\scripts\sync-public-content.ps1
node .\quartz\bootstrap-cli.mjs plugin install --from-config --clean
node .\quartz\bootstrap-cli.mjs build --serve
```

浏览器打开 `http://localhost:8080/`。

## Cloudflare Pages

- Production branch: `v5`
- Framework preset: `None`
- Build command: `node quartz/bootstrap-cli.mjs plugin install --from-config --clean && node quartz/bootstrap-cli.mjs build`
- Build output directory: `public`

## 安全说明

- `content/` 是同步脚本生成的公开目录，不要在其中保存私人内容。
- 同步脚本只解析文件开头的 frontmatter，并默认只复制带有 `publish: true` 的 Markdown。
- 当前脚本不会复制本地附件。需要公开附件时，再增加附件白名单。
