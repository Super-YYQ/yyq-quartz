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
type: tutorial
status: stable
---

# ChatGPT Windows 升级后 Proxifier 网络异常排查

相关笔记：[[Codex Claude 软件级代理设置教程]]、[[Codex Windows 微软商店安装包提取与手动更新]]、[[Windows索引]]

> [!success] 最终结论
> 本次包含两个先后发生的问题。第一阶段是原有“按进程代理 + 选择性代理 DNS”没有完整覆盖新版访问方式；补充裸域名 `chatgpt.com` 并开启 Proxifier 的“DNS 和 IP 泄漏防护模式”后，启动速度、中文界面和审批模式恢复。第二阶段是重启后用量页再次失败；网络、账号和接口均验证正常，最终通过备份并移出升级后遗留的 Chromium 临时缓存恢复。具体损坏文件没有逐个隔离，但问题范围已定位在客户端临时缓存层。

## 一、故障现象

升级后同时出现以下问题：

- ChatGPT 启动明显变慢。
- 已在设置中选择中文，重启后界面仍显示英文。
- 左下角的用量摘要和重置信息消失。
- “设置 → 用量与计费”显示无法加载用量设置。
- 审批模式的选项数量变少。

这些现象看似属于启动、语言、计费和权限四个模块。首轮故障来自同一条后端配置链路失败；用量页后来单独复发，则属于客户端缓存问题，不能继续归因于代理配置。

## 二、先区分界面变化和真实故障

新版确实调整了部分界面，但不能一开始就把所有缺失内容都归因于 UI 改版。

判断顺序如下：

| 现象                                | 判断方法                             | 本次结论                         |
| ----------------------------------- | ------------------------------------ | -------------------------------- |
| “用量”页面直接报加载失败            | 检查应用日志、网络、登录态接口和缓存 | 首轮为网络故障，复发为客户端缓存 |
| 中文设置不生效                      | 检查账户配置接口是否成功             | 网络故障导致回退                 |
| 审批模式选项减少                    | 先恢复功能配置接口，再观察           | 网络恢复后选项重新出现           |
| 左下角不再常驻显示 5 小时、7 天用量 | “设置 → 用量”已正常时再判断          | 新版界面调整                     |

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

| 方式                                | 结果                             |
| ----------------------------------- | -------------------------------- |
| 本机先解析域名，再把 IP 交给 SOCKS5 | TLS 建立前断开或超时             |
| 由 SOCKS5 代理端解析域名            | TLS 证书验证成功并收到 HTTP 响应 |

这说明代理线路本身可用，问题位于本地 DNS 结果或 DNS 到代理的传递过程。

## 四、首轮根因分析

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

| 顺序 | 规则       | 应用程序                            | 目标                        | 动作   |
| ---- | ---------- | ----------------------------------- | --------------------------- | ------ |
| 1    | Localhost  | Any                                 | `localhost; 127.0.0.1; ::1` | Direct |
| 2    | Proxy Core | 本地代理核心进程                    | Any                         | Direct |
| 3    | AI Tools   | `ChatGPT.exe; Codex.exe; codex.exe` | Any                         | SOCKS5 |
| 4    | Default    | Any                                 | Any                         | Direct |

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

## 六、用量页复发：二次排查与最终修复

### 1. 复发现象

首轮修复后，启动、中文界面、设置用量和三个审批模式都曾恢复。随后只重启 ChatGPT，用量页再次显示“无法加载使用设置”，但中文界面、审批模式和普通对话仍然正常。

这说明不能把第二次失败直接套用到第一次的 DNS 结论上。

### 2. 逐层排除

| 检查项                                     | 结果                                    | 结论                              |
| ------------------------------------------ | --------------------------------------- | --------------------------------- |
| Proxifier 配置文件                         | 远程 DNS、域名列表、进程规则仍在        | 配置没有丢失                      |
| 不带登录信息访问 `/backend-api/wham/usage` | 经 SOCKS5 到达服务端并返回 `401`        | DNS、SOCKS5、TLS 和服务端入口可达 |
| 带现有登录态访问同一接口                   | 返回 `HTTP 200`                         | 账号权限、令牌和用量服务正常      |
| ChatGPT 点击“重试”后的连接                 | `chatgpt.exe → Proxifier → 本地 SOCKS5` | 客户端请求确实命中代理            |
| Windows DNS 缓存                           | 清空后仍失败                            | 单纯刷新 DNS 不能解决复发         |
| 关闭泄漏防护并重启两端                     | 仍然失败                                | UDP/IP 泄漏防护不是复发根因       |
| Windows“修复”                              | 完成后仍失败                            | 安装包级修复不足                  |
| Chromium 临时缓存                          | 备份移出后恢复                          | 问题范围定位到客户端临时缓存      |

> [!note] `401` 为什么反而说明网络正常
> 未携带登录信息时返回 `401` 是预期结果，表示请求已完成 DNS、代理、TLS 和 HTTP 往返。若连接层失败，通常只能看到超时、连接关闭或状态码 `000`。

### 3. IPv6 UDP `connection blocked` 不是根因

Proxifier 日志中出现：

```text
chatgpt.exe - [2001:4860:4860::8888]:443 (UDP) (IPv6): connection blocked
```

该地址属于 Google Public DNS。UDP 443 通常来自 Chromium 的 QUIC、HTTP/3 或安全 DNS 探测；开启“DNS 和 IP 泄漏防护模式”后，Proxifier 阻止命中代理规则的 UDP 流量是预期行为。

本次关闭泄漏防护、让 UDP 绕过后，用量页仍然失败；与此同时 `chatgpt.com:443` 已经收到服务端数据。因此不要关闭系统 IPv6，也不要为该地址长期添加直连规则。最终配置应重新开启泄漏防护。

### 4. 不退出登录的缓存修复

新版客户端实际使用的 Chromium 用户数据目录为：

```text
%APPDATA%\Codex\web\Codex
```

为了避免触发重新登录、手机号验证或丢失本地状态，本次没有直接使用 Windows“重置”，而是先完全退出 ChatGPT，再将以下临时缓存移动到时间戳备份目录：

```text
GraphiteDawnCache
GrShaderCache
ShaderCache
GPUPersistentCache
Default\Cache
Default\Code Cache
Default\GPUCache
Default\DawnGraphiteCache
Default\DawnWebGPUCache
Default\Shared Dictionary\cache
Default\Partitions\codex-browser-app\Cache
Default\Partitions\codex-browser-app\Code Cache
Default\Partitions\codex-browser-app\GPUCache
Default\Partitions\codex-browser-app\DawnGraphiteCache
Default\Partitions\codex-browser-app\DawnWebGPUCache
Default\Partitions\codex-browser-app\Shared Dictionary\cache
```

备份目录使用类似名称：

```text
%APPDATA%\Codex\web\Codex-cache-backup-YYYYMMDD-HHMMSS
```

以下内容必须保留：

```text
Default\Network
Default\Local Storage
Default\Session Storage
%USERPROFILE%\.codex\auth.json
```

> [!warning]
> 不要直接删除整个 `%APPDATA%\Codex\web\Codex`，否则可能清掉 Cookie、登录状态和本地浏览器数据。应先移动到备份，并且只处理明确列出的临时缓存目录。

本次共成功移动 16 个缓存目录，零跳过、零错误。ChatGPT 自动重建缓存后，用量页立即恢复，且没有重新登录。

如需回滚，应先退出 ChatGPT，将新生成的同名缓存目录另行改名，再从时间戳备份目录恢复；不要直接覆盖正在使用的新缓存。

## 七、最终验证结果

最终观察结果：

- [x] 启动速度恢复正常
- [x] 中文界面正常生效
- [x] “设置 → 用量”可以加载
- [x] 审批模式选项恢复完整
- [x] 对话与 Codex 工作流可以正常联网
- [x] Proxifier 中的 ChatGPT/Codex 连接命中指定 SOCKS5 规则
- [x] 登录态用量接口经同一 SOCKS5 返回 `HTTP 200`
- [x] 临时关闭泄漏防护后故障仍可复现，排除 UDP 阻止因素
- [x] 选择性备份并移出 Chromium 缓存后，用量页恢复且登录态保留

左下角原有的 5 小时、7 天用量和重置摘要没有恢复，但“设置 → 用量”已经正常。这属于本次新版界面布局变化，不是网络故障仍未解决。

## 八、可复用的排查顺序

以后遇到类似问题，按以下顺序排查：

1. 先确认“设置 → 用量”是正常数据显示，还是直接报加载失败。
2. 查看 Proxifier 是否出现 `chatgpt.exe` 或 `codex.exe` 到 `chatgpt.com:443` 的记录。
3. 规则命中但收不到响应时，不要停在“进程已经走代理”的结论上，继续检查 DNS。
4. 同时配置裸域名和通配子域名。
5. 对比本地 DNS 后走 SOCKS5 与 SOCKS5 远程解析的结果。
6. 检查“DNS 和 IP 泄漏防护模式”及非 A/AAAA 查询设置。
7. 如果服务端已经返回数据，再做一次不输出令牌和响应正文的登录态接口校验，区分账号问题与客户端问题。
8. 临时关闭泄漏防护只能用于 A/B 对照；若关闭后仍失败，应立即重新开启，不要继续扩大代理改动。
9. 优先使用 Windows“修复”；无效时，备份并选择性移出 Chromium 临时缓存。
10. 最后才考虑退出登录或 Windows“重置”，因为它们可能触发重新认证并删除应用数据。
11. 网络和用量页都恢复后，再判断侧边栏差异是否属于新版 UI 调整。

## 九、公开发布与隐私

本文使用 `publish: true`，仅保留可公开复用的配置和诊断方法。以下内容已经省略或替换为占位符：

- Windows 用户名、计算机名和本机绝对路径。
- 真实代理端口、代理节点、订阅地址和认证信息。
- 公司域名、内网地址、VPN 路由和安全策略。
- ChatGPT/Codex 会话 ID、线程 ID、日志文件名和进程实例 ID。
- 本机 DNS 返回的具体异常 IP。
- Proxifier 完整导出配置。
- 实际 Chromium 缓存备份时间戳和本机用户名。
- 登录令牌、账号 ID 和用量接口响应正文。

## 十、参考链接

- [OpenAI：ChatGPT 网页和应用网络错误建议](https://help.openai.com/en/articles/9247338-network-recommendations-for-chatgpt-errors-on-web-and-apps)
- [OpenAI：通过 ChatGPT 套餐使用 Codex](https://help.openai.com/en/articles/11369540-using-codex-with-chatgpt)
- [OpenAI：Agent approvals & security](https://learn.chatgpt.com/docs/agent-approvals-security)
- [OpenAI：Windows 应用使用说明](https://help.openai.com/en/articles/9982051-using-the-chatgpt-windows-app)
- [Microsoft：修复 Windows 应用](https://support.microsoft.com/en-us/windows/apps/repair-apps-and-programs-in-windows)
- [Google：Public DNS 地址](https://developers.google.com/speed/public-dns/docs/using)
- [Proxifier：Name Resolution](https://www.proxifier.com/docs/win-v4/dns.html)
- [Proxifier v4 更新日志](https://www.proxifier.com/changelog/)
