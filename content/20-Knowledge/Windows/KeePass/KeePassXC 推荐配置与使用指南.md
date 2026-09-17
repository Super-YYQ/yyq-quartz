---
title: KeePassXC 推荐配置与使用指南
publish: true
date: 2026-09-15
updated: 2026-09-17
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
  - KeePassXC 配置指南
type: knowledge
status: stable
---

# KeePassXC 推荐配置与使用指南

> [!info]
> 本文按 **KeePassXC 2.7.12 简体中文界面**整理。
> 菜单名和选项名尽量使用软件中的实际中文名称，而不是自行翻译。
> 适用场景：Windows 10/11、KeePassXC 作为主力、Chrome/Edge 浏览器、可与 KeePass 2.x 共用同一个 `.kdbx`。

相关笔记：[[KeePass密码管理]]、[[电脑必备软件]]

官方下载：[KeePassXC](https://keepassxc.org/download/)

## 1. 推荐配置速览

```text
KeePassXC
├─ 常规
│  ├─ 启动：自动启动、单实例、记住数据库
│  ├─ 文件管理：修改后自动保存、外部修改自动重新加载
│  ├─ 用户界面：任务栏图标、最小化到任务栏
│  └─ 自动输入：设置全局快捷键
├─ 安全
│  ├─ 剪贴板：10~15 秒清空
│  ├─ 闲置锁定：900~1800 秒
│  ├─ Windows Hello：开启快速解锁
│  ├─ Windows 锁屏时锁数据库
│  └─ 不建议“最小化窗口后锁定数据库”
├─ 浏览器集成
│  ├─ 开启 KeePassXC-Browser
│  ├─ 勾选实际使用的浏览器
│  ├─ 优先按真实 URL 匹配
│  └─ 不建议自动提交登录表单
├─ 数据库
│  ├─ KDBX 4
│  ├─ AES-256
│  ├─ Argon2id
│  ├─ 保留历史记录
│  └─ 开启回收站
└─ 可选增强
   ├─ TOTP
   ├─ Passkey
   ├─ SSH 代理
   ├─ 高级自定义字段
   └─ 数据库报告
```

## 2. 工具 → 设置 → 常规

打开：**工具 → 设置 → 常规**

### 2.1 启动

位置：**工具 → 设置 → 常规 → 启动**

| 中文界面实际名称 | 推荐 | 说明 |
|---|---:|---|
| 只启动一个 KeePassXC 实例 | ✅ | 避免重复打开多个实例 |
| 系统启动时自动启动 KeePassXC | ✅ | 开机即运行 |
| 在应用程序启动时最小化窗口 | 可选 | 喜欢后台运行可开启 |
| 解锁数据库后最小化窗口 | ✅ | 解锁后自动回到后台 |
| 记住以前使用的数据库 | ✅ | 不必每次重新选 KDBX |
| 启动时加载以前打开的数据库 | ✅ | 建议和上一项一起开 |
| 记住数据库密钥文件和安全加密狗 | 按需 | 只有使用 Key File / YubiKey 时才需要 |
| 每周在应用程序启动时检查更新 | ✅ | 保持版本更新 |
| 检查更新时包含 Beta 版本 | ❌ | 日常主力机不建议 |

### 2.2 文件管理

位置：**工具 → 设置 → 常规 → 文件管理**

| 中文界面实际名称 | 推荐 | 说明 |
|---|---:|---|
| 修改后自动保存 | ✅ | 很重要 |
| 锁定数据库时自动保存 | ✅ | 避免未保存修改 |
| 锁定数据库时，自动保存非数据更改 | ✅ | 推荐 |
| 有外部修改时自动重新加载数据库 | ✅ | 与 KeePass/同步盘共用时尤其有用 |
| 保存前备份数据库文件 | ✅ 可开 | 会额外保留旧数据库 |
| 使用替代保存方式 | 默认关闭 | 云盘保存异常时再考虑 |

如必须启用“使用替代保存方式”，优先：

**写入临时文件再覆盖移动**

不要主动使用：

**直接写入数据库文件（危险）**

> [!warning]
> 若 KeePass 与 KeePassXC 共用同一个 `.kdbx`，建议开启“修改后自动保存”和“有外部修改时自动重新加载数据库”，但仍不要让两个程序长期同时编辑同一个数据库。外部修改自动重新加载不等于自动安全合并。

### 2.3 条目管理

位置：**工具 → 设置 → 常规 → 条目管理**

推荐：

- ✅ 新增条目时使用群组图标
- ✅ 删除条目到回收站之前提示确认
- ✅ 在条目视图中，双击字段复制数据
- ✅ 为新条目自动生成密码
- “打开 URL 时最小化”按习惯
- “复制到剪贴板时隐藏窗口”按习惯

### 2.4 用户界面

位置：**工具 → 设置 → 常规 → 用户界面**

推荐：

- ✅ 显示任务栏图标
- ✅ 将窗口最小化至任务栏
- ✅ 最小化而不是退出应用程序
- “备注使用等宽字体”开发用途推荐
- “密码以彩色显示”按喜好

## 3. 工具 → 设置 → 安全

打开：**工具 → 设置 → 安全**

### 3.1 超时

位置：**工具 → 设置 → 安全 → 超时**

#### 在多久后清空剪贴板

推荐：`10~15 秒`，建议 `15 秒`。

如果主要使用 KeePassXC-Browser，密码经过剪贴板的次数会明显减少。

#### 在多久后清空搜索框

推荐：`5 分钟`。

#### 在闲置多久后锁定数据库

单位是**秒**。

推荐：

```text
900 秒  = 15 分钟
1800 秒 = 30 分钟
```

建议从 `900 秒` 开始。

> [!note]
> 这里的“闲置”主要是 KeePassXC 自身的活动判断，不等于 Windows 整台电脑完全没有键盘鼠标操作。

### 3.2 便利性

位置：**工具 → 设置 → 安全 → 便利性**

建议开启：

**启用数据库快速解锁（Touch ID / Windows Hello）**

典型流程：

```text
KeePassXC 启动
→ 首次输入数据库主密码
→ 后续数据库自动锁定
→ Windows Hello 快速解锁
```

Windows Hello 主要用于后续快速解锁，不能取代数据库主密码本身。

### 3.3 锁定选项

位置：**工具 → 设置 → 安全 → 锁定选项**

推荐：

```text
☑ 系统锁定或合上盖子时锁定数据库
☑ 切换用户时锁定数据库
☐ 在最小化窗口后锁定数据库
```

不建议“在最小化窗口后锁定数据库”，尤其如果已经开启“解锁数据库后最小化窗口”。

### 3.4 隐私

位置：**工具 → 设置 → 安全 → 隐私**

推荐：

```text
☑ 编辑密码时隐藏密码
☑ 在条目预览面板中隐藏密码
☑ 在条目预览面板隐藏 TOTP
☑ 在条目预览面板隐藏备注
```

“使用 DuckDuckGo 来下载网站图标”按隐私偏好决定。

## 4. 浏览器自动填充

### 4.1 安装 KeePassXC-Browser

安装官方扩展：[KeePassXC-Browser](https://keepassxc.org/docs/KeePassXC_GettingStarted.html#_setup_browser_integration)

支持 Chrome、Edge、Chromium、Brave、Vivaldi、Firefox。

### 4.2 KeePassXC 中开启浏览器集成

位置：**工具 → 设置 → 浏览器集成**

开启：

```text
☑ 启用浏览器集成
```

然后在“为这些浏览器开启集成”中勾选实际使用的浏览器，例如：

```text
☑ Google Chrome
☑ Edge
```

推荐同时开启：

```text
☑ 如果数据库已锁定，则请求解锁
```

“请求凭据时显示通知”按个人喜好。

### 4.3 第一次连接数据库

保证数据库已经解锁：

```text
浏览器
→ KeePassXC-Browser
→ Connect / 连接
```

连接名称建议：

```text
Chrome-Home-PC
Edge-Home-PC
Chrome-Work-PC
```

避免不同设备重复使用完全相同的连接名。

## 5. 条目的浏览器 URL 匹配

编辑条目：**条目 → 浏览器集成**

主 URL 在条目首页，例如：

```text
https://github.com
```

同一账号用于多个地址时，在“浏览器集成”添加额外 URL，例如：

```text
https://login.example.com
https://account.example.com
```

KeePassXC 2.7.10+ 支持额外 URL 通配符：

```text
https://*.example.com
https://example.com/*/login
https://sub.*.example.com/path/*
```

推荐原则：

```text
网页 → KeePassXC-Browser → 按真实 URL 匹配
桌面程序 → Auto-Type / 窗口标题匹配
```

不要再把网页窗口标题匹配当作浏览器密码匹配主方案。

## 6. 浏览器扩展中的自动填充策略

推荐：

```text
✅ 自动获取可用凭据
❌ 不建议页面打开就无条件自动填单一账号
❌ 不建议自动提交登录表单
TOTP 自动填充：按个人习惯
```

日常流程：

```text
打开登录页
→ 输入框出现 KeePassXC 图标
→ 点击账号
→ 填入用户名和密码
→ 需要 TOTP 时继续填 TOTP
```

不建议默认开启“自动提交”，避免误填、误登录或特殊网页识别错误。

## 7. 自动输入 Auto-Type

Auto-Type 与浏览器集成是两套独立功能。

推荐用途：

```text
网页       → KeePassXC-Browser
桌面程序   → Auto-Type
远程工具   → Auto-Type
旧式登录框 → Auto-Type
```

### 7.1 设置全局 Auto-Type 快捷键

位置：**工具 → 设置 → 自动输入**

找到：**全局自动输入快捷键**

例如：

```text
Ctrl + Alt + A
```

建议：

```text
☑ 全局自动输入时使用条目标题匹配窗口
☑ 总在执行自动输入前询问
```

同页还能设置：

- 全局自动输入时使用条目 URL 匹配窗口
- 自动输入时隐藏已过期条目
- 自动输入起始延迟
- 自动输入延迟

### 7.2 给单个条目配置窗口标题

编辑条目：**条目 → 自动输入**

窗口规则：

```text
*GitHub*
*Oracle*
```

`*` 是通配符。

正则示例：

```text
//^Secure Login - .*//
```

默认输入序列：

```text
{USERNAME}{TAB}{PASSWORD}{ENTER}
```

需要 TOTP：

```text
{USERNAME}{TAB}{PASSWORD}{ENTER}
{DELAY 1000}
{TOTP}{ENTER}
```

KeePassXC 2.7.12 也支持 `{TIMEOTP}`。

## 8. TOTP

### 8.1 添加

对条目右键：**TOTP → 设置 TOTP**

填入网站提供的原始 Secret。

绝大多数网站：

```text
周期：30 秒
位数：6
算法：SHA-1
```

### 8.2 使用

`Ctrl + T`：复制当前 TOTP。

`Ctrl + Y`：复制 Password + TOTP。

也可通过：

- KeePassXC-Browser
- Auto-Type `{TOTP}`
- 条目右键菜单

### 8.3 安全取舍

方便模式：

```text
同一个 KDBX
├─ 密码
└─ TOTP Secret
```

隔离更强：

```text
KeePassXC → 密码
独立 Authenticator → TOTP
```

与 KeePass 共用同一个 KDBX 时：KeePassXC 保存的 TOTP 不会导致数据库无法打开，但 KeePass 不一定自动识别成自己的 TOTP 字段。若 KeePassXC 已成为主力，建议主要由 KeePassXC 管理 TOTP。

## 9. Passkey

KeePassXC 可以通过 KeePassXC-Browser 保存 Passkey。

> [!warning]
> KeePassXC 2.7.12 调整了 Passkey 的 BE/BS 标志。极少数更早版本创建的旧 Passkey 如果升级后异常，需要单独处理；新建 Passkey 无需额外配置。

建议：

- 新建 Passkey 可以直接用 KeePassXC
- 重要账号仍保存 Recovery Codes
- 不要把 Recovery Codes 只保存在唯一一个 KDBX 中

## 10. 条目中的“高级”

编辑条目：**条目 → 高级**

用途：

- 自定义属性
- 额外账号字段
- API 信息
- 附件
- 特殊集成数据

示例：

```text
标题：Example VPS
用户名：root
密码：********
URL：ssh://example.com

高级：
IP             203.0.113.10
SSH-Port       22
Panel-User     admin
Panel-Password ********
Client-ID      example-id
```

引用自定义字段：

```text
{S:字段名}
```

例如：

```text
{S:API_KEY}
```

## 11. 浏览器特殊表单字段

企业系统常见额外字段：

```text
租户号
公司编码
Account ID
PIN
```

可在“高级”中建立字段，再由 KeePassXC-Browser 选择网页对应输入框。不标准的登录页也可以使用 `KPH:` 自定义字段，然后在扩展中绑定网页输入框。

## 12. 密码生成器

推荐：

```text
长度：20~32
大写：开启
小写：开启
数字：开启
特殊字符：开启
```

核心原则：

```text
每个网站独立随机密码
```

浏览器注册或改密码时，可直接调用 KeePassXC-Browser 密码生成器并保存到数据库。

## 13. 数据库设置

打开：**数据库 → 数据库设置**

这是当前 KDBX 的设置，不是 KeePassXC 全局设置。

### 13.1 常规

推荐：

```text
☑ 回收站
☑ 压缩
```

历史记录建议保留，但不要无限增长。经验值：

```text
历史条目数量：约 10
历史大小：约 6 MiB
```

### 13.2 安全 / 加密设置

推荐：

```text
数据库格式：KDBX 4
加密算法：AES-256
KDF：Argon2id
```

利用基准测试把解锁耗时设在大约 `1 秒` 即可，不必手工折腾 Iterations、Memory、Parallelism。

与 KeePass 共库时，如果还使用很旧的 KeePass、老插件或老手机客户端，修改 KDF 前先确认兼容性。

## 14. 数据库 → 浏览器集成

位置：**数据库 → 数据库设置 → 浏览器集成**

这里用于当前数据库级管理，可进行：

- 断开与所有浏览器的关联
- 转换旧 KeePassHTTP 数据
- 刷新数据库根群组 ID
- 管理数据库浏览器相关设置

日常无需频繁操作。

## 15. 群组级浏览器控制

编辑群组：**群组 → 浏览器集成**

可设置：

**在浏览器扩展中隐藏条目**

适合：

```text
SSH Keys
API Tokens
Recovery Codes
内部凭据
```

## 16. 数据库报告

打开：**数据库 → 数据库报告**

建议关注：

- 健康检查：弱密码、重复密码、过期密码
- HIBP：检查公开泄漏
- 浏览器统计：排查某网站为什么不显示凭据

建议每 2~3 个月做一次健康检查。HIBP 属于在线检查，不必频繁运行。

## 17. SSH 代理

适合 GitHub、GitLab、VPS、Linux 服务器。

完整配置与排障步骤见：[[Windows 使用 KeePassXC 与 SSH Agent 管理 SSH 密钥]]。

KeePassXC 不是 SSH Agent 本身，而是现有 SSH Agent 的客户端。

### 17.1 Windows 启用 OpenSSH Authentication Agent

管理员 PowerShell：

```powershell
Get-Service ssh-agent | Set-Service -StartupType Automatic
Start-Service ssh-agent
```

### 17.2 KeePassXC 开启

位置：**工具 → 设置 → SSH 代理**

开启：

```text
☑ 启用 SSH 代理集成
☑ 使用 OpenSSH
```

若显示“SSH 代理连接工作正常！”，说明连接成功。

### 17.3 条目配置 SSH Key

编辑条目：

```text
条目 → 高级 → 添加私钥附件
条目 → SSH 代理 → 选择对应私钥
```

可配置数据库解锁时自动加载、锁定时移除等。之后可减少 `git pull`、`git push`、`ssh user@example.com` 过程中反复输入私钥密码的次数。

## 18. 数据库同步与备份

KDBX 可放在 OneDrive、Dropbox、Google Drive、Nextcloud、Syncthing、NAS。

推荐：

```text
OneDrive
└─ KeePass
   └─ passwords.kdbx
```

最好选带版本历史的同步服务。

同步 ≠ 备份。

至少建议：

```text
主 KDBX
+
云盘版本历史
+
偶尔离线备份
```

如果使用 Key File，不要把它和 `.kdbx` 放在同一个云盘同一位置。出现冲突副本时，可使用：

`数据库 → 从数据库合并`

## 19. KeePass + KeePassXC 共用一个 KDBX

基本兼容：

```text
账号 / 密码 / URL / 备注
→ 两边正常使用
```

### 19.1 TOTP

KeePassXC 与 KeePass 原生 TOTP 的内部字段格式不完全一致。

结果：

```text
KeePassXC 添加 TOTP
→ KeePass 能正常打开数据库
→ 但不一定自动识别成 KeePass 自己的 TOTP
```

不会因此破坏整个 KDBX。

如果 KeePassXC 已成为主力，建议 TOTP 主要由 KeePassXC 管理。

### 19.2 Passkey

Passkey 更偏 KeePassXC 自己的浏览器集成，建议主要让 KeePassXC 管理。不要假设 KeePass 能直接使用。

### 19.3 自定义字段

KeePass 通常可以保留 KeePassXC 创建的普通自定义字段。

但重要数据库升级前仍建议备份。

推荐使用方式：

```text
KeePassXC = 主力，长期运行
KeePass = 兼容 / 备用，用完关闭
```

## 20. 不建议为了“高级”强行开启的功能

### Key File

能增强安全性，但会增加备份、多设备同步和遗失风险。没有明确需求时不用强开。

### YubiKey

支持 Challenge-Response，但必须认真准备备用硬件和恢复方案，否则硬件损坏或丢失可能导致数据库无法解锁。

当前更推荐：

```text
强主密码
+ Windows Hello 快速解锁
+ KDBX 多份备份
```

除非确实有更高安全需求，再增加第二解锁因素。

## 21. 截图保护

KeePassXC 在 Windows 上支持阻止普通截图/录屏捕获敏感窗口。

临时需要截图时：

**查看 → 允许屏幕截图**

涉及主密码、TOTP Secret、Recovery Code、私钥、API Token 时不要随意截图。使用后及时关闭。

## 22. 推荐快捷键

| 操作 | 快捷键 |
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
| 锁定当前数据库 | `Ctrl + L` |
| 数据库报告 | `Ctrl + Shift + R` |
| 设置 | `Ctrl + ,` |

全局 Auto-Type 快捷键建议自行设置，例如：

```text
Ctrl + Alt + A
```

## 23. 最终推荐配置清单

### 工具 → 设置 → 常规

```text
启动
☑ 只启动一个 KeePassXC 实例
☑ 系统启动时自动启动 KeePassXC
☑ 记住以前使用的数据库
☑ 启动时加载以前打开的数据库
☑ 解锁数据库后最小化窗口
☑ 每周在应用程序启动时检查更新
☐ 检查更新时包含 Beta 版本

文件管理
☑ 修改后自动保存
☑ 锁定数据库时自动保存
☑ 锁定数据库时，自动保存非数据更改
☑ 有外部修改时自动重新加载数据库
☑ 保存前备份数据库文件（可选但推荐）

用户界面
☑ 显示任务栏图标
☑ 将窗口最小化至任务栏
☑ 最小化而不是退出应用程序
```

### 工具 → 设置 → 安全

```text
超时
在多久后清空剪贴板：15 秒
在闲置多久后锁定数据库：900 秒

便利性 / 锁定选项
☑ 启用数据库快速解锁（Touch ID / Windows Hello）
☑ 系统锁定或合上盖子时锁定数据库
☑ 切换用户时锁定数据库
☐ 在最小化窗口后锁定数据库

隐私
☑ 编辑密码时隐藏密码
☑ 在条目预览面板中隐藏密码
☑ 在条目预览面板隐藏 TOTP
☑ 在条目预览面板隐藏备注
```

### 工具 → 设置 → 浏览器集成

```text
☑ 启用浏览器集成
☑ Google Chrome（如果使用）
☑ Edge（如果使用）
☑ 如果数据库已锁定，则请求解锁
```

### 数据库

```text
KDBX 4
AES-256
Argon2id
KDF 基准约 1 秒

☑ 回收站
☑ 压缩
保留合理数量的历史记录
```

### 推荐工作方式

```text
网页登录
→ KeePassXC-Browser

桌面登录窗口
→ Auto-Type

动态验证码
→ KeePassXC TOTP

Git / VPS
→ KeePassXC + Windows OpenSSH Agent

同步
→ KDBX 放带版本历史的同步盘

备份
→ 额外离线副本
```

## 24. 当前版本说明

本文基于：

```text
KeePassXC 2.7.12
简体中文
Windows
```

如果以后升级到 2.8.x 或更高版本，菜单结构和中文翻译可能变化，应重新核对实际软件界面。

## 参考依据

- [KeePassXC Documentation](https://keepassxc.org/docs/)
- [KeePassXC User Guide](https://keepassxc.org/docs/KeePassXC_UserGuide.html)
- [KeePassXC Getting Started：Browser Integration](https://keepassxc.org/docs/KeePassXC_GettingStarted.html#_setup_browser_integration)
- [KeePassXC User Guide：SSH Agent](https://keepassxc.org/docs/KeePassXC_UserGuide.html#_setup_ssh_agent)
- [KeePassXC GitHub Repository](https://github.com/keepassxreboot/keepassxc)
- KeePassXC 2.7.12 官方简体中文翻译文件
- KeePassXC 2.7.12 Release Notes
