---
title: Codex Claude 软件级代理设置教程
publish: true
date: 2026-06-24
tags:
  - windows
  - 网络代理
  - Codex
  - Claude
  - Proxifier
aliases:
  - Codex Claude 代理配置
  - AI 工具软件级代理
  - 进程级代理配置
---

# Codex Claude 软件级代理设置教程

相关笔记：[[Windows 公司网络下 FlyingBird TUN 与 Codex 共存配置]]、[[Codex Windows 微软商店安装包提取与手动更新]]、[[电脑必备软件]]

## 结论

优先使用“按软件代理”，只让 Codex、Claude 这类 AI 工具走本地代理端口，不要一上来就开启全局 TUN 或系统代理。

在当前这类 Windows + 公司网络 + 本地代理工具环境里，推荐优先使用 Proxifier：

1. 首选 Proxifier：按进程接管 Codex、Claude，并让 DNS 通过代理解析。
2. 可选启动脚本：适合命令行工具，或 Electron 应用明确吃环境变量和 `--proxy-server` 的情况。
3. 最后再用 TUN：只作为 Proxifier 和启动脚本都无法处理 DNS 或路由问题时的兜底方案。

## 场景选择

| 场景 | 推荐方案 |
| --- | --- |
| Codex 加入 Proxifier 后仍响应慢、反复 reconnect | Proxifier + 关闭自动 DNS 检测 + 开启通过代理解析主机名 |
| Codex 可用，但 Claude Desktop 显示 `Couldn't connect to Claude` | Proxifier 路径规则命中后，再检查 Name Resolution 是否仍使用本地 DNS |
| 公司内网、VPN、Jira、Git 不能被全局代理影响 | Proxifier 按进程代理 |
| Claude Code 从终端启动，想临时测试 | 当前终端设置 `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` |
| Electron 桌面应用支持启动参数 | 环境变量 + `--proxy-server` |
| Proxifier 和启动脚本都不稳定 | 临时开启 TUN，再单独处理公司域名直连规则 |

## 适用场景

- Windows 系统代理已经开启，但 Codex、Claude 仍然连接失败。
- 开启 TUN 后 AI 工具可用，但公司内网、Jira、Git、VPN 页面异常。
- 只希望 Codex、Claude、Node 子进程走代理，不影响浏览器、IDEA、企业安全软件和公司网络。
- 本地代理工具已经提供 HTTP 或 SOCKS5 端口，例如 Clash、FlyingBird、V2RayN、Shadowsocks。

## 先确认本地代理端口

常见本地端口：

```text
HTTP 代理：127.0.0.1:7890
SOCKS5 代理：127.0.0.1:7890 或 127.0.0.1:1080
```

以实际代理工具为准。先确认代理软件已经连接节点，并且本机端口正在监听：

```powershell
Test-NetConnection 127.0.0.1 -Port 7890
```

如果你的工具区分 HTTP 与 SOCKS5，后面脚本里的协议也要对应修改。

## 方案一：Proxifier 按进程代理（当前优先）

当系统代理对 Codex 不生效，或者 Codex 响应很慢、需要反复 reconnect、甚至无法登录时，优先使用 Proxifier。

### 中文界面版本

如果英文界面不顺手，可以参考 `1564307973/Proxifier-CN`。这个仓库整理了 Proxifier 中文本地化包和便携版，适合对照中文菜单配置代理服务器、代理规则和 DNS 解析。

注意：

- 汉化包通常有版本适配限制，安装前先确认支持的 Proxifier 版本。
- 汉化不等于破解。Proxifier 仍是商业软件，长期使用需要正版授权。
- 如果已经安装官方新版 Proxifier，不要直接覆盖不匹配版本的汉化文件，避免程序异常。

### 添加代理服务器

进入：

```text
Profile -> Proxy Servers -> Add
```

填写本地代理：

```text
Address: 127.0.0.1
Port: 7890
Protocol: SOCKS Version 5
```

如果你的本地 SOCKS5 端口是 `1080`，就改为 `1080`。

弹出是否设为默认代理时，建议选择“否”。不要让 Proxifier 一开始接管所有程序。

### 添加代理规则

进入：

```text
Profile -> Proxification Rules -> Add
```

为 Codex 添加规则：

```text
Name: Codex
Applications: Codex.exe; codex.exe
Action: Proxy SOCKS5 127.0.0.1:7890
```

Claude Code 常见还需要把 Node 运行时纳入规则：

```text
Name: Claude Code
Applications: claude.exe; node.exe
Action: Proxy SOCKS5 127.0.0.1:7890
```

如果担心 `node.exe` 范围太大，可以先只加 `claude.exe`，观察 Proxifier 日志里实际发起连接的进程，再补充更精确的路径规则。

### DNS 也要走代理

截图里的 Linux.do 经验重点是：问题不一定出在 Codex 进程没有代理，而是 DNS 解析没有按预期通过代理。

典型现象：

- 已经在 Proxifier 中加入 `codex.exe`，但响应非常慢。
- 需要多次 reconnect 才有响应。
- 甚至无法登录。
- 使用系统代理时也要尝试多次 reconnect。

处理方式：

```text
Profile -> Name Resolution
```

在 Name Resolution 中：

```text
关闭：Detect DNS setting automatically
开启：Resolve hostnames through proxy
```

这样让目标进程的主机名解析也通过代理完成。开启后再完全退出 Codex，并重新启动测试。

如果使用 SOCKS5，尽量选择支持远端 DNS 的方式。某些命令行工具支持 `socks5h://127.0.0.1:7890`，其中 `h` 表示 hostname 交给代理端解析；不支持时再退回 `socks5://`。

### 实测案例：Codex 可以，Claude 仍打不开

本机配置中已经把 Codex 和 Claude 的程序路径都加入 Proxifier。现象是：

- Codex 可以正常打开。
- Claude Desktop 仍显示 `Couldn't connect to Claude`。
- 错误提示中出现 `Your network redirected this request to www.anthropic.com`。

这说明 Proxifier 的路径规则不一定有问题，真正的问题可能是名称解析仍然走了本地网络，被公司网络、DNS 策略、网关或安全软件重定向。

处理方式：

1. 打开 Proxifier 日志，确认 Claude 对 `www.anthropic.com:443`、`claude.ai:443` 或相关域名的连接是否命中代理规则。
2. 如果规则已命中，但 Claude 仍提示网络被重定向，进入 `Profile -> Name Resolution`。
3. 关闭 `Detect DNS setting automatically`。
4. 开启 `Resolve hostnames through proxy`。
5. 完全退出 Claude Desktop 后重新打开。

同理，Proxifier 日志里如果已经能看到类似：

```text
codex.exe - chatgpt.com:443 open through proxy 127.0.0.1:7890 SOCKS5
```

只能说明连接动作命中了代理规则，不代表 DNS 解析一定正确。遇到发送字节但收不到响应、反复 close、应用层报网络重定向时，应继续检查名称解析。

### Name Resolution 选项理解

`Name Resolution` 决定“域名变成 IP”这一步在哪里发生。

常见理解：

| 选项 | 含义 | 适合场景 |
| --- | --- | --- |
| `Detect DNS setting automatically` | 让 Proxifier 自动判断使用本地 DNS 还是代理侧解析 | 普通网络环境，问题少时可以保留 |
| `Resolve hostnames locally` / 本地解析 | 使用 Windows 当前 DNS 解析域名，再把 IP 交给代理连接 | 公司内网域名、需要 split DNS 的服务 |
| `Resolve hostnames through proxy` / 通过代理解析 | 把域名交给代理服务器或代理链解析 | 公网服务被本地 DNS 污染、劫持、重定向或解析失败 |

对 Codex、Claude 这类公网 AI 工具，如果已经按进程代理但仍打不开，优先尝试 `Resolve hostnames through proxy`。

可能的副作用：

- 公司内网域名可能无法解析，因为代理节点不知道公司内部 DNS。
- 某些依赖本地 DNS 分流的服务可能走到错误地区或错误出口。
- 代理服务端会看到访问的域名，隐私边界从本机 DNS 转移到代理侧。
- 如果代理节点的 DNS 质量不好，可能出现解析慢、解析到不可用 IP、地区不匹配等问题。
- Windows `hosts` 和公司 VPN 的 split DNS 结果可能不再按预期生效。

所以不要把 Proxifier 的默认规则改成全局代理。推荐只代理 Codex、Claude 等公网 AI 工具，代理软件自身、公司内网工具、VPN 客户端和企业安全软件保持 Direct。

### 规则顺序

Proxifier 规则从上往下匹配，建议：

1. 本地地址和局域网地址直连。
2. 代理软件自身直连，例如 Clash、FlyingBird、v2rayN、Shadowsocks。
3. Codex、Claude 等目标程序走代理。
4. Default 保持 Direct，避免误伤公司软件。

不要把代理软件自身也放进代理规则，否则可能出现代理套代理、循环连接或节点频繁断开。

## 方案二：启动脚本注入代理

这是最干净的方式。环境变量只传给当前脚本启动的软件及其子进程，不会修改 Windows 全局系统代理。

### Codex Desktop

完全退出 Codex 后，用 BAT 启动：

```bat
@echo off
chcp 65001 >nul
set HTTP_PROXY=http://127.0.0.1:7890
set HTTPS_PROXY=http://127.0.0.1:7890
set ALL_PROXY=socks5://127.0.0.1:7890
start "" "D:\软件\codex\Codex.exe" --proxy-server=http://127.0.0.1:7890
```

注意：

- 把 `D:\软件\codex\Codex.exe` 替换成你的真实 Codex 路径。
- Codex Desktop 是单实例应用。已经运行时再执行 BAT，只会唤醒旧进程，新的代理变量不会注入。
- 测试时先退出所有 Codex 窗口，再从脚本启动。
- `--proxy-server` 是 Chromium/Electron 常见启动参数，Codex 当前本地实践可用；如果后续版本行为变化，以实际验证为准。

### Claude Code

Claude Code 是命令行工具，优先在启动它的终端里设置环境变量：

```powershell
$env:HTTP_PROXY = "http://127.0.0.1:7890"
$env:HTTPS_PROXY = "http://127.0.0.1:7890"
$env:ALL_PROXY = "socks5://127.0.0.1:7890"
claude
```

如果希望每次 Claude Code 都带这些变量，可以写入 `%USERPROFILE%\.claude\settings.json` 的 `env`：

```json
{
  "env": {
    "HTTP_PROXY": "http://127.0.0.1:7890",
    "HTTPS_PROXY": "http://127.0.0.1:7890",
    "ALL_PROXY": "socks5://127.0.0.1:7890"
  }
}
```

这个方式适合 Claude Code 本体和它启动的子进程。若只想临时测试，不要写入 `settings.json`，直接在当前终端设置环境变量即可。

### Claude Desktop 或其他 Electron 应用

如果是桌面版 Electron 应用，可以尝试用启动参数：

```bat
@echo off
chcp 65001 >nul
set HTTP_PROXY=http://127.0.0.1:7890
set HTTPS_PROXY=http://127.0.0.1:7890
set ALL_PROXY=socks5://127.0.0.1:7890
start "" "C:\Path\To\App.exe" --proxy-server=http://127.0.0.1:7890
```

这类参数并不是每个软件都会公开承诺支持。判断标准很简单：启动后能登录、能对话、公司网络不受影响，就保留；无效就切换到 Proxifier。

## 方案三：TUN 兜底

如果启动脚本和 Proxifier 都无法稳定处理 DNS，可以临时开启代理工具的 TUN 或虚拟网卡作为兜底。

公司网络下要注意：

- TUN 可能接管默认路由和 DNS。
- Fake-IP 可能把公司域名解析到 `198.18.0.0/16`。
- 系统代理排除列表只能影响应用层代理，不能完全约束 TUN。

这类问题按 [[Windows 公司网络下 FlyingBird TUN 与 Codex 共存配置]] 处理：公司域名加入 Fake-IP 过滤，并增加 `DOMAIN-SUFFIX,<公司域名>,DIRECT` 规则。长期方案仍建议回到“只让 AI 工具显式走代理”。

## 排查清单

- [ ] 本地代理工具已连接节点
- [ ] `Test-NetConnection 127.0.0.1 -Port 7890` 成功
- [ ] Codex、Claude 已完全退出后重新启动
- [ ] 单实例桌面应用没有复用旧进程
- [ ] `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 协议和端口正确
- [ ] Proxifier 规则命中了正确的 `.exe`
- [ ] DNS 解析已经通过代理或远端解析
- [ ] Claude 提示网络被重定向时，已关闭自动 DNS 检测并开启通过代理解析主机名
- [ ] 代理软件自身没有被 Proxifier 代理
- [ ] Default 规则没有误改成全局代理
- [ ] 公司内网域名没有被 TUN Fake-IP 污染

## 常见问题

### 系统代理开了，为什么 Codex 还是不通？

很多桌面软件、命令行工具或其子进程不一定读取 Windows 系统代理。Codex 这类 Electron 应用还可能有自己的网络栈。用启动脚本或 Proxifier 直接约束目标进程更可靠。

### 为什么不推荐长期全局 TUN？

TUN 是更底层的接管方式，适合兜底，但会影响默认路由、DNS、公司 VPN、内网域名和安全软件。AI 工具只需要访问少量公网服务时，进程级代理的副作用更小。

### `HTTP_PROXY` 和 `HTTPS_PROXY` 要填 HTTP 还是 SOCKS？

如果代理工具提供 HTTP 入站端口，优先写：

```text
http://127.0.0.1:7890
```

`ALL_PROXY` 可以写 SOCKS5：

```text
socks5://127.0.0.1:7890
```

如果工具明确支持 `socks5h://`，可用它解决 DNS 走代理问题；不支持时可能会报协议错误。

### Claude Code 的 `settings.json` 在哪里？

Windows 下 `~/.claude` 等价于：

```text
%USERPROFILE%\.claude
```

用户级配置文件通常是：

```text
%USERPROFILE%\.claude\settings.json
```

## 参考链接

- [Linux.do：Codex / 代理相关讨论 1](https://linux.do/t/topic/2311522/20)
- [Linux.do：Codex / 代理相关讨论 2](https://linux.do/t/topic/2184754)
- [推荐一个全局代理工具 Proxifier](http://www.lzhpo.com/article/139)
- [Shadowsocks 配合 Proxifier 实现客户端代理](https://github.com/selierlin/Share-SSR-V2ray/wiki/Proxifier%E8%AE%BE%E7%BD%AE%E6%95%99%E7%A8%8B)
- [Proxifier-CN 中文本地化包](https://github.com/1564307973/Proxifier-CN)
- [Claude Code settings](https://code.claude.com/docs/en/settings)
- [Codex Windows 官方文档](https://developers.openai.com/codex/windows)

> [!note]
> 整理时当前网络无法直接打开 Linux.do 两个页面；其中 Proxifier 代理 Codex 的 DNS 设置已根据截图补充。其余可访问资料主要来自 LZHPO、GitHub Wiki、Proxifier-CN、Claude Code 官方设置页和本知识库既有 Codex/TUN 排障记录。
