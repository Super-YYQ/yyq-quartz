---
title: KeePassXC 推荐配置与使用指南
publish: true
date: 2026-09-15
updated: 2026-09-15
tags:
  - KeePassXC
  - KeePass
  - 密码管理
  - TOTP
  - Passkey
  - SSH
  - Windows
aliases:
  - KeePassXC
  - KeePassXC 配置
type: knowledge
status: stable
---

# KeePassXC 推荐配置与使用指南

> 适用环境：Windows 11 + KeePassXC 主力使用 + KeePass 可能共用同一 KDBX + Chrome/Edge + Git/SSH/开发用途。

相关笔记：[[KeePass密码管理]]、[[电脑必备软件]]

官方下载：[KeePassXC](https://keepassxc.org/download/)

## 1. 推荐定位

建议逐步把 **KeePassXC 作为主力**：

- 浏览器网页登录：KeePassXC-Browser
- 桌面程序：Global Auto-Type
- TOTP：KeePassXC 内置
- Passkey：KeePassXC-Browser
- Git / SSH：KeePassXC + Windows OpenSSH Agent
- KeePass：保留兼容、旧习惯或特殊插件用途

如果 KeePass 与 KeePassXC 共用同一个 `.kdbx`，尽量避免两边同时修改并保存数据库。

---

## 2. 基础设置

路径：`工具 → 设置`

建议：

- [x] 只启动一个 KeePassXC 实例
- [x] Windows 启动时自动启动 KeePassXC
- [x] 记住以前使用的数据库
- [x] 最小化到系统托盘
- [x] 解锁数据库后最小化
- [x] 自动检查更新
- [ ] 启动时最小化：按个人习惯

推荐体验：

```text
Windows 登录
→ KeePassXC 自动启动
→ 打开已有 KDBX
→ 首次输入主密码
→ 自动缩到托盘
→ 浏览器/桌面程序按需调用
```

---

## 3. Windows Hello 快速解锁

路径：`工具 → 设置 → 安全`

建议开启：

- [x] 启用数据库快速解锁 / Windows Hello Quick Unlock

工作方式：

```text
首次启动 KeePassXC
→ 输入数据库主密码
→ 建立 Windows Hello 快速解锁
→ 后续数据库锁定
→ PIN / 指纹 / 人脸快速解锁
```

注意：Windows Hello 主要用于**后续快速解锁**，不能取代数据库主密码本身。

---

## 4. 自动锁定

路径：`工具 → 设置 → 安全`

推荐：

- [x] 闲置 5~10 分钟后锁定数据库
- [x] Windows 锁屏 / 会话锁定时锁定
- [x] 系统休眠时锁定
- [ ] 最小化时立即锁定数据库

不建议“最小化即锁定”，否则与“解锁后自动最小化”组合时体验很差。

---

## 5. 剪贴板

路径：`工具 → 设置 → 安全`

推荐：

- [x] 10~20 秒后自动清除剪贴板
- 推荐值：**15 秒**

如果主要使用 KeePassXC-Browser，密码经过剪贴板的次数会明显减少。

---

## 6. 数据库自动保存

路径：`工具 → 设置 → 常规 → 文件管理`

建议：

- [x] 每次修改后自动保存
- [x] 锁定数据库时自动保存
- [x] 外部修改数据库后自动重新加载
- [x] 使用默认 Safe Save

### KeePass + KeePassXC 共用同一数据库

推荐模式：

```text
KeePassXC：主力，长期运行
KeePass：偶尔打开，用完关闭
```

不建议：

```text
KeePassXC 改 A
同时 KeePass 改 B
两边先后保存
```

外部修改自动重新加载 ≠ 自动安全合并。

---

## 7. 数据库安全设置

路径：`数据库 → 数据库设置 → 安全`

推荐：

```text
格式：KDBX 4
加密：AES-256
KDF：Argon2id
解密耗时：约 1 秒
```

直接使用 Benchmark / 基准测试调到约 1 秒即可，不必手工折腾 Iterations、Memory、Parallelism。

如果需要兼容很老的 KeePass、手机端或插件，修改数据库格式/KDF 前先确认兼容性。

---

## 8. 历史记录、回收站、压缩

路径：`数据库 → 数据库设置 → 常规`

推荐：

```text
Max history items：10
Max history size：约 6 MiB
```

同时开启：

- [x] Use recycle bin
- [x] Enable compression

用途：

- 误删条目可以恢复
- 改错密码可以查看历史版本
- 防止数据库历史无限膨胀

---

# 浏览器集成

## 9. 安装 KeePassXC-Browser

安装官方扩展：[KeePassXC-Browser](https://keepassxc.org/docs/KeePassXC_GettingStarted.html#_setup_browser_integration)。

支持：

- Chrome
- Edge
- Chromium
- Brave
- Firefox

KeePassXC：

`工具 → 设置 → 浏览器集成`

开启：

- [x] Enable browser integration
- [x] Chrome / Edge 等实际使用的浏览器

浏览器扩展中点击 Connect，连接名建议明确：

```text
Chrome-Home-PC
Edge-Home-PC
Chrome-Work-PC
```

避免多个浏览器使用相同连接名。

---

## 10. 网站匹配优先用真实 URL

普通条目：

```text
Title: GitHub
URL: https://github.com
```

一个账号对应多个地址时：

`编辑条目 → 浏览器集成 → Additional URLs`

示例：

```text
https://*.example.com
https://example.com/*/login
https://account.example.com
```

浏览器网站优先使用真实 URL 匹配，不再把“页面标题包含某段文字”作为主要方案。

### 推荐分工

```text
网页登录 → KeePassXC-Browser / URL 匹配
桌面程序 → Global Auto-Type / 窗口标题匹配
```

---

## 11. 浏览器自动填充策略

推荐：

- [x] Automatically retrieve credentials
- [ ] Automatically fill single-credential entries
- [ ] Automatically submit credentials
- [x] TOTP 自动填充：按个人喜好

更推荐的交互：

```text
打开网站
→ 登录框出现 KeePassXC 图标
→ 点击选择账号
→ 自动填入
```

不建议默认开启“自动提交”，避免误填、误登录或特殊网页识别错误。

---

# TOTP / Passkey

## 12. TOTP

条目右键：

`TOTP → 设置 TOTP`

常见配置：

```text
Secret：网站提供的原始 Secret
Period：30 秒
Digits：6
Algorithm：SHA-1
```

常用快捷键：

```text
Ctrl + T       复制当前 TOTP
Ctrl + Y       复制 Password + TOTP
```

Auto-Type 中可使用：

```text
{TOTP}
```

例如：

```text
{USERNAME}{TAB}{PASSWORD}{ENTER}
{DELAY 1000}
{TOTP}{ENTER}
```

### 与 KeePass 共用 KDBX 时

KeePassXC 和 KeePass 对 TOTP 的字段表示不完全一致。

- KeePassXC 保存的 TOTP 不会导致 KDBX 无法在 KeePass 打开
- 但 KeePass 不一定自动识别 KeePassXC 的 TOTP 字段
- 如果长期双端都要生成 TOTP，可考虑同一条目同时配置两套兼容字段

---

## 13. Passkey

KeePassXC-Browser 中开启：

- [x] Enable Passkeys

支持的网站创建 Passkey 时，可直接保存进 KDBX 条目。

适合 GitHub 等已经支持 Passkey 的网站。

建议：

- 新建 Passkey 可以直接用 KeePassXC
- 重要账号仍保存 Recovery Codes
- 不要把 Recovery Codes 只保存在唯一一个 KDBX 中

---

# Auto-Type

## 14. Global Auto-Type

路径：`工具 → 设置 → Auto-Type`

建议设置全局快捷键，例如：

```text
Ctrl + Alt + A
```

适合：

- RDP
- SSH GUI
- Windows 桌面软件
- 旧式登录窗口
- IDEA / 工具登录弹窗

默认序列：

```text
{USERNAME}{TAB}{PASSWORD}{ENTER}
```

支持窗口标题通配：

```text
*GitHub*
*Oracle*
```

也支持正则表达式：

```text
//^Secure Login - .*//
```

---

# 条目与高级字段

## 15. 高级自定义字段

普通字段：

```text
Title
Username
Password
URL
Notes
```

高级中可以增加：

```text
Email
Customer-ID
Server-IP
SSH-Port
Panel-User
Panel-Password
API-Key
Client-ID
```

例如 VPS：

```text
Title       Example VPS
Username    root
Password    ********
URL         https://panel.example.com

Advanced:
IP          203.0.113.10
SSH-Port    22
Panel-User  admin
Client-ID   example-id
```

引用自定义属性：

```text
{S:API_KEY}
```

---

## 16. 浏览器特殊表单字段

对于不标准的登录页，可以使用 `KPH:` 自定义字段配合 KeePassXC-Browser。

示例：

```text
KPH:AccountNumber
KPH:TenantId
```

再在浏览器扩展中使用 **Choose Custom Login Fields** 绑定网页输入框。

适合企业系统、银行类多字段登录、内部后台等特殊页面。

---

# 密码生成与维护

## 17. 密码生成器

推荐默认：

```text
长度：20~32
大写：✅
小写：✅
数字：✅
特殊字符：✅
```

网站有特殊限制时再调整。

核心原则：

> 每个网站使用独立随机密码，不复用。

浏览器注册/改密码时，可直接调用 KeePassXC-Browser 密码生成器并保存到数据库。

---

## 18. 数据库报告

路径：

`数据库 → 数据库报告`

定期查看：

### Health Check

检查：

- 弱密码
- 重复密码
- 过期密码

建议：**每 2~3 个月看一次**。

### HIBP

用于检查密码是否出现在公开泄漏数据中。

属于在线检查，不必频繁运行。

### Browser Statistics

用于排查：

- 哪些条目有 URL
- 哪些 URL 被允许 / 拒绝
- 浏览器为什么没有识别某个条目
- 清理错误的网站规则

---

# 同步与备份

## 19. KDBX 云同步

KDBX 可以放在：

- OneDrive
- Dropbox
- Google Drive
- Nextcloud
- Syncthing

推荐选择带 **Version History / 文件版本历史** 的同步方案。

示例：

```text
OneDrive
└── KeePass
    └── passwords.kdbx
```

### Key File 注意

如果使用 Key File：

```text
数据库：OneDrive/passwords.kdbx
Key File：不要放同一个云盘同一位置
```

否则 Key File 提供的第二层保护意义会降低。

---

## 20. 备份策略

最低建议：

```text
主 KDBX
→ OneDrive

+ OneDrive Version History

+ 偶尔离线备份
→ U 盘 / NAS / 其他设备
```

现实中更常见的风险不是 AES 被破解，而是：

- 误删
- 同步冲突
- 文件损坏
- 错误覆盖

出现冲突副本时，可使用：

`Database → Merge From Database`

---

# SSH / Git 开发体验

## 21. Windows OpenSSH Agent

管理员 PowerShell：

```powershell
Get-Service ssh-agent | Set-Service -StartupType Automatic
Start-Service ssh-agent
```

KeePassXC：

`工具 → 设置 → SSH Agent`

开启：

- [x] Enable SSH Agent integration
- [x] OpenSSH for Windows

可以：

- 将 SSH 私钥作为 KDBX 附件保存
- 或私钥保留在磁盘，KeePassXC 管理解锁密码
- 数据库解锁时自动加入 Agent
- 数据库锁定时自动移除

之后可减少：

```bash
git pull
git push
ssh user@example.com
```

过程中反复输入私钥密码的次数。

---

# 不建议为了“高级”而开启的功能

## 22. YubiKey / Key File

KeePassXC 支持：

```text
主密码
+ Key File
+ YubiKey Challenge-Response
```

但不是越复杂越安全。

如果硬件密钥或 Key File 丢失，而没有备份，可能永久无法打开数据库。

当前更推荐：

```text
强主密码
+ Windows Hello Quick Unlock
+ KDBX 多份备份
```

除非确实有更高安全需求，再增加第二解锁因素。

---

## 23. 截图保护

保持 KeePassXC 默认截图保护即可。

临时需要截图：

`View → Allow Screen Capture`

使用后及时关闭。

尤其不要长期允许对以下内容截图：

- 密码
- TOTP Secret
- Passkey 信息
- Recovery Codes

---

# 常用快捷键

| 功能 | 快捷键 |
|---|---|
| 搜索 | `Ctrl + F` |
| 编辑条目 | `Enter` / `Ctrl + E` |
| 新建条目 | `Ctrl + N` |
| 复制用户名 | `Ctrl + B` |
| 复制密码 | `Ctrl + C` |
| 复制 URL | `Ctrl + U` |
| 复制 TOTP | `Ctrl + T` |
| Password + TOTP | `Ctrl + Y` |
| Auto-Type | `Ctrl + Shift + V` |
| 锁数据库 | `Ctrl + L` |
| 数据库报告 | `Ctrl + Shift + R` |

---

# 最终推荐配置清单

```text
KeePassXC

启动：
✅ Windows 开机启动
✅ 单实例
✅ 记住数据库
✅ 解锁后最小化到托盘

安全：
✅ Windows Hello Quick Unlock
✅ 闲置 10 分钟锁定
✅ Windows 锁屏时锁定
✅ 系统休眠时锁定
❌ 最小化就锁
✅ 剪贴板 15 秒清除
✅ 保持截图保护

数据库：
KDBX 4
AES-256
Argon2id
Benchmark ≈ 1 秒

文件：
✅ 修改后自动保存
✅ 锁定时保存
✅ 外部修改自动重新加载
✅ Safe Save
✅ 回收站
✅ 压缩
History = 10
History Size ≈ 6 MiB

浏览器：
✅ KeePassXC-Browser
✅ Automatically retrieve credentials
❌ Automatically fill single credential
❌ Automatically submit
✅ URL / Additional URL 匹配
✅ TOTP
✅ Passkey

桌面程序：
✅ Global Auto-Type

开发：
✅ Windows OpenSSH Agent
✅ KeePassXC SSH Agent Integration

维护：
每 2~3 个月 Health Check
偶尔 HIBP
数据库放有 Version History 的同步盘
额外保留离线备份
```

---

# KeePass + KeePassXC 共用数据库注意事项

## 可以正常共用

- 普通用户名 / 密码 / URL
- Notes
- 自定义属性
- 附件
- KDBX 4（现代 KeePass 2.x）

## 需要注意

### TOTP

两者字段实现不同，同一 KDBX 能打开，但 TOTP 不一定自动互认。

### Passkey

主要依赖 KeePassXC 生态，不要假设 KeePass 能直接使用。

### Argon2id

现代 KeePass 2.x 通常支持；老客户端 / 老插件需确认。

### 同时编辑

尽量不要同时用 KeePass 与 KeePassXC 修改同一数据库。

推荐：

```text
KeePassXC = 主力
KeePass = 兼容/备用
```

---

# 官方资料

- [KeePassXC Documentation](https://keepassxc.org/docs/)
- [KeePassXC User Guide](https://keepassxc.org/docs/KeePassXC_UserGuide.html)
- [KeePassXC Getting Started：Browser Integration](https://keepassxc.org/docs/KeePassXC_GettingStarted.html#_setup_browser_integration)
- [KeePassXC User Guide：SSH Agent](https://keepassxc.org/docs/KeePassXC_UserGuide.html#_setup_ssh_agent)
- [KeePassXC GitHub Repository](https://github.com/keepassxreboot/keepassxc)
