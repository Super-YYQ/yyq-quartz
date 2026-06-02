---
title: Codex Windows 微软商店安装包提取与手动更新
publish: true
date: 2026-06-02
tags:
  - windows
  - Codex
  - Microsoft Store
  - 软件更新
aliases:
  - Codex Windows 手动更新
  - Codex 微软商店安装包提取
---

# Codex Windows 微软商店安装包提取与手动更新

## 适用场景

部分旧版 Windows 或受限办公环境无法直接通过 Microsoft Store 安装 Codex Desktop。此时可以从 Microsoft Store 产品页提取微软 CDN 中的安装包，并手动安装或解压运行。

Codex 的 Microsoft Store 产品 ID：

```text
9PLM9XGG6VKS
```

官方商店页面：

```text
https://apps.microsoft.com/detail/9PLM9XGG6VKS
```

## 提取 Microsoft Store 安装包

使用第三方 Microsoft Store 链接生成器：

```text
https://store.rg-adguard.net/
```

操作步骤：

1. 打开链接生成器。
2. 左侧下拉框选择 `ProductId`。
3. 输入 `9PLM9XGG6VKS`。
4. 右侧渠道选择 `Retail`。
5. 点击勾号生成下载链接。
6. 在结果中选择最新的 `x64` Codex 安装包。

文件名通常类似：

```text
OpenAI.Codex_<版本号>_x64__2p2nqsd0c76g0.msix
```

注意：

- `store.rg-adguard.net` 是第三方链接生成器，不是微软官方网站。
- 实际安装包下载链接应指向微软 CDN。
- 不要从来源不明的网站下载别人重新打包的 `.exe`。
- 下载后可以在文件属性中检查数字签名。

## 两种更新方式

### 方式一：正式安装 MSIX

优先尝试使用 PowerShell 安装或覆盖升级：

```powershell
Add-AppxPackage -Path "C:\下载目录\OpenAI.Codex_x64.msix"
```

这种方式更接近 Microsoft Store 正常安装流程，系统能够管理应用包。应用数据通常会保留。

### 方式二：解压后运行

如果系统版本较低，无法安装 MSIX，可以将安装包解压后直接运行。

推荐更新流程：

1. 完全退出 Codex。
2. 在任务管理器中确认没有残留的 `Codex.exe` 和 `codex.exe`。
3. 将新版安装包解压到新目录，例如：

   ```text
   D:\软件\codex-<新版本号>
   ```

4. 运行新目录中的 `Codex.exe`。
5. 确认登录状态、插件、配置和历史记录正常。
6. 更新快捷方式。
7. 旧目录暂时保留，确认稳定后再手动删除。

不要直接将新版文件逐个覆盖到旧目录。旧版残留文件可能与新版不兼容，也不利于回滚。

如果希望保持原路径不变，可以采用目录替换：

```text
D:\软件\codex      -> D:\软件\codex-old
D:\软件\codex-new  -> D:\软件\codex
```

## 用户数据备份

Codex 的用户数据通常位于用户目录，而不是程序目录：

```text
C:\Users\<用户名>\.codex
```

更新前建议备份：

```powershell
Copy-Item "$env:USERPROFILE\.codex" "$env:USERPROFILE\.codex-backup-$(Get-Date -Format yyyyMMdd-HHmmss)" -Recurse
```

更换程序目录后，登录状态、配置、插件和历史记录通常仍会自动读取。遇到异常时，不要立即删除 `.codex` 目录，先切回旧版程序目录排查。

## 查看本地版本

解压运行时，可以查看 `Codex.exe` 的产品版本：

```powershell
(Get-Item "D:\软件\codex\Codex.exe").VersionInfo |
  Select-Object FileVersion, ProductVersion
```

也可以检查当前进程：

```powershell
Get-Process Codex -ErrorAction SilentlyContinue |
  Select-Object ProcessName, Path,
    @{Name='FileVersion';Expression={$_.MainModule.FileVersionInfo.FileVersion}},
    @{Name='ProductVersion';Expression={$_.MainModule.FileVersionInfo.ProductVersion}}
```

版本号有两种格式：

- `Codex.exe` 产品版本，例如 `26.519.81530`
- Microsoft Store AppX 包版本，例如 `26.527.3686.0`

两者格式不同，不应只比较最后一段数字。提取安装包时，以链接生成器列出的最新 `x64` 包为准。

## 沙箱注意事项

解压运行不等于完全缺少沙箱组件。Codex 安装目录中通常包含：

```text
resources\codex-command-runner.exe
resources\codex-windows-sandbox-setup.exe
```

但是旧版 Windows、初始化异常或解压安装方式可能导致沙箱无法正常启动。例如：

```text
CreateProcessAsUserW failed: 1312
```

遇到沙箱异常时：

1. 先更新 Codex。
2. 优先尝试 MSIX 正式安装。
3. 如果条件允许，升级到较新的 Windows 10 或 Windows 11。
4. 不要因为开启“自动审查”就默认所有命令一定处于隔离环境中。
5. 日常使用优先选择“默认权限”或“自动审查”，谨慎使用“完全访问权限”。

## 更新检查清单

- [ ] 从 Microsoft Store 产品 ID `9PLM9XGG6VKS` 提取最新 `x64` 包
- [ ] 确认下载链接来自微软 CDN
- [ ] 完全退出旧版 Codex
- [ ] 备份 `%USERPROFILE%\.codex`
- [ ] 优先尝试 `Add-AppxPackage`
- [ ] 解压运行时使用新目录，不要直接覆盖旧目录
- [ ] 验证登录状态、插件、配置和历史记录
- [ ] 验证沙箱命令是否正常执行
- [ ] 稳定运行后再删除旧版目录

## 参考链接

- [Codex Microsoft Store 页面](https://apps.microsoft.com/detail/9PLM9XGG6VKS)
- [Microsoft Store 链接生成器](https://store.rg-adguard.net/)
- [Codex Windows 官方文档](https://developers.openai.com/codex/windows)
