---
title: ChatGPT Windows 升级后 Proxifier 网络异常排查
publish: true
date: 2026-07-10
tags:
  - windows
  - ChatGPT
  - Codex
  - Proxifier
  - 网络代理
  - 故障排查
aliases:
  - ChatGPT Proxifier 排障
  - Codex 升级 ChatGPT 网络问题
---

# ChatGPT Windows 升级后 Proxifier 网络异常排查

相关笔记：[[Codex Claude 软件级代理设置教程]]、[[Codex Windows 微软商店安装包提取与手动更新]]、[[Windows索引]]

> [!success] 最终结论
> Windows 客户端从 Codex 界面升级为 ChatGPT 桌面体验后，原有“按进程代理 + 选择性代理 DNS”配置没有完整覆盖新版访问方式。补充裸域名 `chatgpt.com`，并开启 Proxifier 的“DNS 和 IP 泄漏防护模式”后，启动速度、中文界面、用量页面和审批模式全部恢复。

## 一、故障现象

升级后同时出现以下问题：

- ChatGPT 启动明显变慢。
- 已在设置中选择中文，重启后界面仍显示英文。
- 左下角的用量摘要和重置信息消失。
- “设置 → 用量与计费”显示无法加载用量设置。
- 审批模式的选项数量变少。

这些现象看似属于启动、语言、计费和权限四个模块，实际来自同一条后端配置链路失败。

## 二、先区分界面变化和真实故障

新版确实调整了部分界面，但不能一开始就把所有缺失内容都归因于 UI 改版。

判断顺序如下：

| 现象 | 判断方法 | 本次结论 |
| --- | --- | --- |
| “用量”页面直接报加载失败 | 检查应用日志和网络连接 | 网络故障 |
| 中文设置不生效 | 检查账户配置接口是否成功 | 网络故障导致回退 |
| 审批模式选项减少 | 先恢复功能配置接口，再观察 | 网络恢复后选项重新出现 |
| 左下角不再常驻显示 5 小时、7 天用量 | “设置 → 用量”已正常时再判断 | 新版界面调整 |

> [!note]
> 当前官方说明将 Codex 用量入口描述为“用量页面或达到限制时的提示横幅”，不再保证侧边栏始终显示用量卡片。普通额度仍会自动重置；储备重置次数只在符合资格且账户实际拥有重置次数时显示。

## 三、证据链

### 1. 应用日志指向同一个网络入口

日志中连续出现以下类型的错误：

```text
Timed out while fetching post-login Statsig bootstrap
net::ERR_CONNECTION_CLOSED
net::ERR_TIMED_OUT
```

失败请求集中在：

```text
/wham/accounts/check
/wham/statsig/bootstrap
/wham/profiles/me
/wham/usage
```

它们分别影响账户状态、功能开关、用户配置和用量信息，因此可以解释为什么语言、审批模式和用量同时异常。

### 2. 规则命中不等于 DNS 正确

Proxifier 连接窗口已经能看到类似记录：

```text
chatgpt.exe - chatgpt.com:443 open through proxy <本地 SOCKS5 地址>:<端口> SOCKS5
```

这只能证明 `chatgpt.exe` 的 TCP 连接命中了代理规则。如果连接很快关闭、只发送数据却收不到响应，仍需继续检查域名解析。

### 3. 本地 DNS 和代理 DNS 的 A/B 对照

使用同一个 SOCKS5 代理测试 `chatgpt.com:443`：

| 方式 | 结果 |
| --- | --- |
| 本机先解析域名，再把 IP 交给 SOCKS5 | TLS 建立前断开或超时 |
| 由 SOCKS5 代理端解析域名 | TLS 证书验证成功并收到 HTTP 响应 |

这说明代理线路本身可用，问题位于本地 DNS 结果或 DNS 到代理的传递过程。

## 四、根因分析

### 1. 裸域名没有被原列表覆盖

旧列表只有：

```text
*.chatgpt.com
```

新版请求会直接访问裸域名：

```text
chatgpt.com
```

在 Proxifier 的掩码匹配中，`*.chatgpt.com` 用于子域名，不能代替单独的 `chatgpt.com` 条目。因此必须同时配置两行。

### 2. 新版 DNS 查询可能绕过选择性代理解析

配置文件显示“阻止非 A/AAAA DNS 查询”处于关闭状态。结合升级前后和修复前后的对照结果，推断新版 Chromium 网络栈发出的部分 DNS 查询没有被原有选择性代理 DNS 完整处理。

开启“DNS 和 IP 泄漏防护模式”后，Proxifier 会统一控制以下行为：

- 通过代理解析主机名。
- 使用代理 DNS 时阻止非 A/AAAA 查询。
- 阻止命中代理规则的 UDP 流量，避免 DNS、UDP 或 WebRTC 泄漏。

## 五、最终配置（Proxifier 中文界面）

### 1. 代理服务器

进入：

```text
配置文件 → 代理服务器
```

添加本地代理工具提供的 SOCKS5 入口：

```text
地址：<本地 SOCKS5 地址>
端口：<端口>
协议：SOCKS5
```

不要在公开笔记中填写真实端口、节点地址、订阅地址或认证信息。

### 2. 代理规则

进入：

```text
配置文件 → 代理规则
```

推荐顺序：

| 顺序 | 规则 | 应用程序 | 目标 | 动作 |
| --- | --- | --- | --- | --- |
| 1 | Localhost | Any | `localhost; 127.0.0.1; ::1` | Direct |
| 2 | Proxy Core | 本地代理核心进程 | Any | Direct |
| 3 | AI Tools | `ChatGPT.exe; Codex.exe; codex.exe` | Any | SOCKS5 |
| 4 | Default | Any | Any | Direct |

> [!warning]
> 不要把代理核心进程放进 AI 工具代理规则，否则可能形成代理循环。也不要为了修复 ChatGPT 而把 Default 改成全局代理。

### 3. 名称解析

进入：

```text
配置文件 → 名称解析
```

设置：

```text
关闭：自动检测 DNS 设置
开启：通过代理解析主机名称
选择：仅仅解析以下主机名
```

至少加入：

```text
chatgpt.com
*.chatgpt.com
*.openai.com
*.oaistatic.com
*.oaistatsig.com
*.oaiusercontent.com
*.auth.openai.com
```

其中 `chatgpt.com` 和 `*.chatgpt.com` 必须同时保留。

### 4. DNS 和 IP 泄漏防护模式

进入：

```text
配置文件 → 高级 → DNS 和 IP 泄漏防护模式
```

启用后，Proxifier 会弹出确认窗口，提示它将控制代理 DNS、非 A/AAAA 查询和命中规则的 UDP 流量。选择“是”继续。

> [!warning] 语音功能注意事项
> 该模式会阻止命中规则的 UDP 流量，可能影响 ChatGPT 语音、WebRTC 或其他依赖 UDP 的功能。本文验证的是 Codex 编程、设置、用量和普通 TCP 443 连接；如果需要语音，应单独测试并按需调整 UDP 规则。

### 5. 正确的重启顺序

修改完成后：

1. 从系统托盘彻底退出 Proxifier。
2. 重新启动 Proxifier，确认当前配置文件已加载。
3. 完全退出 ChatGPT，避免单实例应用复用旧进程。
4. 重新启动 ChatGPT。
5. 打开“设置 → 用量”，点击“重试”。

只重启 ChatGPT、不重启 Proxifier，可能继续使用旧的 DNS 防护状态。

## 六、修复后的验证结果

最终观察结果：

- [x] 启动速度恢复正常
- [x] 中文界面正常生效
- [x] “设置 → 用量”可以加载
- [x] 审批模式选项恢复完整
- [x] 对话与 Codex 工作流可以正常联网
- [x] Proxifier 中的 ChatGPT/Codex 连接命中指定 SOCKS5 规则

左下角原有的 5 小时、7 天用量和重置摘要没有恢复，但“设置 → 用量”已经正常。这属于本次新版界面布局变化，不是网络故障仍未解决。

## 七、可复用的排查顺序

以后遇到类似问题，按以下顺序排查：

1. 先确认“设置 → 用量”是正常数据显示，还是直接报加载失败。
2. 查看 Proxifier 是否出现 `chatgpt.exe` 或 `codex.exe` 到 `chatgpt.com:443` 的记录。
3. 规则命中但收不到响应时，不要停在“进程已经走代理”的结论上，继续检查 DNS。
4. 同时配置裸域名和通配子域名。
5. 对比本地 DNS 后走 SOCKS5 与 SOCKS5 远程解析的结果。
6. 检查“DNS 和 IP 泄漏防护模式”及非 A/AAAA 查询设置。
7. 网络恢复后，再判断剩余差异是否属于新版 UI 调整。

## 八、公开发布与隐私

本文使用 `publish: true`，仅保留可公开复用的配置和诊断方法。以下内容已经省略或替换为占位符：

- Windows 用户名、计算机名和本机绝对路径。
- 真实代理端口、代理节点、订阅地址和认证信息。
- 公司域名、内网地址、VPN 路由和安全策略。
- ChatGPT/Codex 会话 ID、线程 ID、日志文件名和进程实例 ID。
- 本机 DNS 返回的具体异常 IP。
- Proxifier 完整导出配置。

## 九、参考链接

- [OpenAI：ChatGPT 网页和应用网络错误建议](https://help.openai.com/en/articles/9247338-network-recommendations-for-chatgpt-errors-on-web-and-apps)
- [OpenAI：通过 ChatGPT 套餐使用 Codex](https://help.openai.com/en/articles/11369540-using-codex-with-chatgpt)
- [OpenAI：Agent approvals & security](https://learn.chatgpt.com/docs/agent-approvals-security)
- [Proxifier：Name Resolution](https://www.proxifier.com/docs/win-v4/dns.html)
- [Proxifier v4 更新日志](https://www.proxifier.com/changelog/)
