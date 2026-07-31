---
title: Codex Claude 软件级代理设置教程
publish: true
date: 2026-06-24
updated: 2026-07-31
tags:
  - windows
  - 网络代理
  - Codex
  - Claude
  - Proxifier
  - Git
  - GitHub CLI
aliases:
  - Codex Claude 代理配置
  - AI 工具软件级代理
  - 进程级代理配置
  - GitHub CLI 代理配置
type: tutorial
status: stable
---

# Codex Claude 软件级代理设置教程

相关笔记：[[ChatGPT Windows 升级后 Proxifier 网络异常排查]]、[[Codex Windows 微软商店安装包提取与手动更新]]、[[电脑必备软件]]

## 结论

优先使用“按软件代理”，只让 Codex、Claude 这类 AI 工具走本地代理端口，不要一上来就开启全局 TUN 或系统代理。

> [!success] 2026-07-07 实测可用配置
> Proxifier 使用 SOCKS5，规则同时包含 `Codex.exe` 和 `codex.exe`；`Localhost` 与代理核心保持 Direct；不使用右键菜单的临时 `Proxify Application`；系统代理和 TUN 均关闭。这样 Codex 启动、用量加载和对话响应都恢复正常速度。

在当前这类 Windows + 公司网络 + 本地代理工具环境里，推荐优先使用 Proxifier：

1. 首选 Proxifier：按进程接管 Codex、Claude，并让 DNS 通过代理解析。
2. 可选启动脚本：适合命令行工具，或 Electron 应用明确吃环境变量和 `--proxy-server` 的情况。
3. Git 与 GitHub CLI 分开处理：Git 使用 URL 级规则，`gh` 用包装函数临时继承同一个代理值。
4. 最后再用 TUN：只作为 Proxifier 和启动脚本都无法处理 DNS 或路由问题时的兜底方案。

## 场景选择

| 场景 | 推荐方案 |
| --- | --- |
| Codex 加入 Proxifier 后仍响应慢、反复 reconnect | Proxifier + 关闭自动 DNS 检测 + 开启通过代理解析主机名 |
| Codex 可用，但 Claude Desktop 显示 `Couldn't connect to Claude` | Proxifier 路径规则命中后，再检查 Name Resolution 是否仍使用本地 DNS |
| 公司内网、VPN、Jira、Git 不能被全局代理影响 | Proxifier 按进程代理 |
| Claude Code 从终端启动，想临时测试 | 当前终端设置 `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` |
| Electron 桌面应用支持启动参数 | 环境变量 + `--proxy-server` |
| GitHub 需要代理，但 GitLab 或公司仓库必须直连 | Git URL 级代理配置 |
| Git 已能访问 GitHub，但 `gh auth login`、`gh api` 仍失败 | PowerShell 包装函数让 `gh` 临时复用 Git 代理 |
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
Target Hosts: Any
Target Ports: Any
Action: Proxy SOCKS5 127.0.0.1:7890
```

两个进程都要包含：`Codex.exe` 是桌面界面，`codex.exe` 是后台 app-server。只代理前者时，窗口可能能打开，但“用量”、设置和对话请求会长时间等待。

不要从 Proxifier 右键菜单临时执行 `Proxify Application`。这种手动接管会跳过普通规则，包括 `Localhost` 直连规则；应当始终通过 `Profile -> Proxification Rules` 配置。

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

公司网络需要保留内网 DNS 时，优先使用 `Resolve ONLY the following`，只让下列公网域名通过代理解析：

```text
*.chatgpt.com
*.openai.com
*.oaistatic.com
*.oaistatsig.com
*.oaiusercontent.com
```

这样不会把所有域名都交给代理端解析，也能减少对公司内网和 split DNS 的影响。

如果使用 SOCKS5，尽量选择支持远端 DNS 的方式。某些命令行工具支持 `socks5h://127.0.0.1:7890`，其中 `h` 表示 hostname 交给代理端解析；不支持时再退回 `socks5://`。

> [!tip] ChatGPT 新版专项排障
> 如果升级后同时出现启动慢、语言回退、用量加载失败或审批模式缺失，请参阅 [[ChatGPT Windows 升级后 Proxifier 网络异常排查]]。除了 `*.chatgpt.com`，还要单独覆盖裸域名 `chatgpt.com`，并检查“DNS 和 IP 泄漏防护模式”。

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

| 顺序 | 规则 | Applications | Targets | Action |
| --- | --- | --- | --- | --- |
| 1 | Localhost | Any | `localhost; 127.0.0.1; ::1` | Direct |
| 2 | Proxy Core | 代理核心进程，例如 `FlyingBirdCore.exe` | Any | Direct |
| 3 | Codex | `Codex.exe; codex.exe` | Any | SOCKS5 `127.0.0.1:7890` |
| 4 | Default | Any | Any | Direct |

不要把代理软件自身也放进代理规则，否则可能出现代理套代理、循环连接或节点频繁断开。

使用 Proxifier 时，让本地代理核心保持监听即可，同时关闭代理软件的“系统代理”和 TUN/虚拟网卡。多层接管会形成重复代理，常见表现就是 Codex 启动慢、用量迟迟不显示。

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

## 方案三：Git 和 GitHub CLI 仅 GitHub 走代理

如果 GitHub 需要代理，但 GitLab、公司仓库和其他网站必须直连，不要设置通用的 `http.proxy` 或 `https.proxy`。Git 支持按 URL 配置代理：

```powershell
git config --global http.https://github.com/.proxy http://127.0.0.1:7890
```

这里的 `7890` 应替换为本地代理工具实际提供的 HTTP 代理端口。该规则只匹配 `https://github.com/`；其他 HTTPS 地址不会继承它。

如果此前配置过全局 Git 代理，先检查配置来源：

```powershell
git config --global --get-regexp '^(http|https)\..*proxy$'
```

确认通用代理不再需要后，将它们移除，再设置 GitHub 专用规则：

```powershell
git config --global --unset-all http.proxy
git config --global --unset-all https.proxy
git config --global http.https://github.com/.proxy http://127.0.0.1:7890
```

最后验证实际生效的代理项：

```powershell
git config --global --get-regexp '^(http|https)\..*proxy$'
git config --get-urlmatch http.proxy https://github.com/
```

预期只看到类似下面的 URL 级规则：

```ini
http.https://github.com/.proxy=http://127.0.0.1:7890
```

> [!warning] HTTPS 与 SSH 是两套配置
> 这项 Git 配置只影响 `https://github.com/...` 形式的远程地址，不影响 `git@github.com:...` 形式的 SSH 地址。SSH 需要在 `~/.ssh/config` 中单独设置代理，不要把两者混为一谈。

### Git 配了代理，为什么 `gh auth login` 仍打不开

Git 和 GitHub CLI 是两个独立的网络客户端：

| 操作 | 读取 Git 的 `http.*.proxy` |
| --- | --- |
| `git clone`、`git pull`、`git push` | 是 |
| `gh auth login`、`gh api`、`gh issue`、`gh pr` | 否 |
| `gh repo clone` | 实际执行 Git 的阶段读取；若还需发起 `gh` API 请求，该部分不读取 |

即使 `.gitconfig` 使用不限定域名的通用 `http.proxy`，也只是 Git 的配置，不会自动变成 GitHub CLI、PowerShell 或 Windows 的全局代理。`gh auth login` 还需要先在命令行中访问 GitHub 获取设备登录信息；这一步失败时，浏览器可能不会正常打开。

GitHub CLI 没有单独的 `proxy` 配置项。它的 HTTP 请求使用进程继承到的 `HTTP_PROXY`、`HTTPS_PROXY` 等环境变量。如果不希望永久修改用户环境变量，可以用 PowerShell 包装函数只在 `gh.exe` 运行期间注入代理。

### 让 `gh` 自动复用 Git 的代理

把下面函数加入 PowerShell 的 `$PROFILE`：

```powershell
function gh {
    # 读取 Git 对 GitHub 最终匹配到的全局代理；
    # 同时支持 http.https://github.com/.proxy 和通用 http.proxy。
    $proxyUrl = & git.exe config --global --get-urlmatch `
        http.proxy `
        https://github.com/ 2>$null

    if ([string]::IsNullOrWhiteSpace($proxyUrl)) {
        Write-Warning 'Git 全局配置中没有找到 GitHub 代理，gh 将直接连接。'
        & gh.exe @args
        return
    }

    $proxyUrl = $proxyUrl.Trim()
    $oldHttpProxy = $env:HTTP_PROXY
    $oldHttpsProxy = $env:HTTPS_PROXY

    try {
        $env:HTTP_PROXY = $proxyUrl
        $env:HTTPS_PROXY = $proxyUrl

        & gh.exe @args
    }
    finally {
        [Environment]::SetEnvironmentVariable(
            'HTTP_PROXY',
            $oldHttpProxy,
            'Process'
        )

        [Environment]::SetEnvironmentVariable(
            'HTTPS_PROXY',
            $oldHttpsProxy,
            'Process'
        )
    }
}
```

这个函数有三个边界：

- 用 `git.exe` 读取 Git 针对 `https://github.com/` 最终匹配到的代理，因此兼容 GitHub 专用规则和通用 `http.proxy`。
- 使用 `--global`，只读取用户级 Git 配置，不让某个仓库的局部设置意外改变全部 `gh` 命令。
- 显式调用 `gh.exe`，避免函数递归；命令结束后恢复原来的进程环境变量，不影响同一终端中的其他程序。

### 安装并验证包装函数

创建并打开 PowerShell 配置文件：

```powershell
if (!(Test-Path -LiteralPath $PROFILE)) {
    New-Item -ItemType File -Path $PROFILE -Force
}

notepad $PROFILE
```

粘贴函数并保存，然后立即重新加载：

```powershell
. $PROFILE
```

确认 `gh` 已被包装函数接管，并检查 Git 能返回代理值：

```powershell
Get-Command gh
git config --global --get-urlmatch http.proxy https://github.com/
```

`Get-Command gh` 的 `CommandType` 应为 `Function`。之后仍按原方式使用：

```powershell
gh auth login -h github.com
gh api user
gh pr list
```

需要临时绕过包装函数并直接运行 GitHub CLI 时，显式调用：

```powershell
gh.exe auth status
```

以后代理端口变化，只需修改 Git 配置：

```powershell
git config --global http.https://github.com/.proxy http://127.0.0.1:新端口
```

PowerShell 函数无需同步修改。

## 方案四：TUN 兜底

如果启动脚本和 Proxifier 都无法稳定处理 DNS，可以临时开启代理工具的 TUN 或虚拟网卡作为兜底。

公司网络下要注意：

- TUN 可能接管默认路由和 DNS。
- Fake-IP 可能把公司域名解析到 `198.18.0.0/16`。
- 系统代理排除列表只能影响应用层代理，不能完全约束 TUN。

公司网络、VPN、内网 DNS 与 TUN 共存属于环境相关场景，需要根据实际企业网络策略单独处理，本文不公开展开。长期方案仍建议回到“只让 AI 工具显式走代理”。

## Windows 沙箱与工作区依赖

### `pwsh.exe` 商店别名导致沙箱启动失败

如果 Codex 顶部持续出现“设置智能体沙盒以继续”，日志中又有类似错误：

```text
CreateProcessAsUserW failed: 1920
```

可能是 Microsoft Store 安装的 PowerShell 7 注册了 `pwsh.exe` 应用执行别名。沙箱用户无法通过这个别名启动真实程序，而系统自带的 Windows PowerShell 可以正常运行。

处理步骤：

1. 打开 Windows“设置 -> 应用 -> 高级应用设置 -> 应用执行别名”。
2. 关闭 Microsoft PowerShell 对应的 `pwsh.exe` 别名。
3. 完全退出并重新启动 Codex。
4. 新会话应使用 `C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe`。

修复后可让 Codex 执行普通命令，并确认进程身份包含 `codexsandboxoffline`，再测试工作区文件的创建、读取和删除。出现这个身份说明智能体沙箱已经生效。

### Windows 10 显示“工作区依赖未安装”

这和沙箱不是同一个功能。当前 Codex 的工作区依赖要求 Windows 11 22H2 或更高版本；Windows 10 即使反复点击“诊断”或“重新安装”，仍可能显示“未安装”或“无法重新安装”。

在 Windows 10 上可以关闭“Codex 依赖项”开关并忽略该提示，代码编辑、命令执行和沙箱仍可正常使用。若确实需要随附的 Node.js、Python 工具链，再升级到受支持的 Windows 11 版本。

## 排查清单

- [ ] 本地代理工具已连接节点
- [ ] `Test-NetConnection 127.0.0.1 -Port 7890` 成功
- [ ] Codex、Claude 已完全退出后重新启动
- [ ] 单实例桌面应用没有复用旧进程
- [ ] `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 协议和端口正确
- [ ] Git 已能访问 GitHub 但 `gh` 失败时，已单独给 `gh.exe` 注入代理环境变量
- [ ] Proxifier 的 Codex 规则同时包含 `Codex.exe` 和 `codex.exe`
- [ ] 使用常规 Proxification Rules，而不是临时 `Proxify Application`
- [ ] `Localhost` 和代理核心规则位于 Codex 规则上方并保持 Direct
- [ ] DNS 解析已经通过代理或远端解析
- [ ] Claude 提示网络被重定向时，已关闭自动 DNS 检测并开启通过代理解析主机名
- [ ] 代理软件自身没有被 Proxifier 代理
- [ ] 使用 Proxifier 时已关闭系统代理和 TUN/虚拟网卡
- [ ] Default 规则没有误改成全局代理
- [ ] 公司内网域名没有被 TUN Fake-IP 污染
- [ ] 沙箱报错 `1920` 时已关闭商店 PowerShell 的 `pwsh.exe` 应用执行别名

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

## 发布与隐私

本文设置了 `publish: true`，只记录可公开复用的配置。发布前不要写入以下内容：

- 公司真实域名、内网 IP、VPN 路由和安全策略。
- Windows 用户名、计算机名、仓库绝对路径和日志中的身份信息。
- 代理订阅、节点地址、认证用户名或密码。
- Proxifier 导出的完整配置文件；其中可能包含代理凭据。

涉及实际公司网络的排障过程应放在没有 `publish: true` 的私有笔记中，公开文档只使用 `<公司域名>` 等占位符。

## 参考链接

- [Linux.do：Codex / 代理相关讨论 1](https://linux.do/t/topic/2311522/20)
- [Linux.do：Codex / 代理相关讨论 2](https://linux.do/t/topic/2184754)
- [推荐一个全局代理工具 Proxifier](http://www.lzhpo.com/article/139)
- [Shadowsocks 配合 Proxifier 实现客户端代理](https://github.com/selierlin/Share-SSR-V2ray/wiki/Proxifier%E8%AE%BE%E7%BD%AE%E6%95%99%E7%A8%8B)
- [Proxifier-CN 中文本地化包](https://github.com/1564307973/Proxifier-CN)
- [Claude Code settings](https://code.claude.com/docs/en/settings)
- [Codex Windows 官方文档](https://developers.openai.com/codex/windows)
- [Git：`http.<url>.*` URL 匹配规则](https://git-scm.com/docs/git-config#Documentation/git-config.txt-httplturlgt)
- [GitHub CLI：代理环境变量处理说明](https://github.com/cli/cli/issues/5244)
- [Proxifier：Proxification Rules](https://www.proxifier.com/docs/win-v4/rules.html)
- [Proxifier：Name Resolution](https://www.proxifier.com/docs/win-v4/dns.html)
- [Proxifier：Proxy Settings](https://www.proxifier.com/docs/win-v4/proxy.html)

> [!note]
> 整理时当前网络无法直接打开 Linux.do 两个页面；其中 Proxifier 代理 Codex 的 DNS 设置已根据截图补充。其余可访问资料主要来自 LZHPO、GitHub Wiki、Proxifier-CN、Claude Code 官方设置页和本知识库既有 Codex/TUN 排障记录。
