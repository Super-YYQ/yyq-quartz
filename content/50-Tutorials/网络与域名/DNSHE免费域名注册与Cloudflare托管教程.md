---
title: DNSHE 免费域名注册与 Cloudflare 托管教程
aliases:
  - 免费域名教程
  - DNSHE 域名教程
  - Cloudflare 免费域名托管
tags:
  - 域名
  - DNSHE
  - Cloudflare
  - Cloudflare-Pages
  - VPS
  - Obsidian
  - Quartz
status: stable
created: 2026-07-19
updated: 2026-07-20
type: tutorial
publish: true
---

# DNSHE 免费域名注册与 Cloudflare 托管教程

> [!info] 文档说明
> 本文用于记录如何在 DNSHE 注册免费域名，并将域名托管到 Cloudflare。
>
> 推荐用途：
> - Obsidian + Quartz 知识库
> - Cloudflare Pages
> - Oracle VPS
> - CPA / New API 测试服务
> - API、Webhook、个人 Demo
>
> 不建议用于：
> - 主邮箱域名
> - 银行、支付、密码管理器
> - 重要账号的唯一回调域名
> - 无法迁移的正式商业项目

---

## 一、先理解这种免费域名是什么

DNSHE 提供的并不是你直接向注册局持有的 `.com`、`.net` 独立域名，而是类似下面这样的可独立管理子域名：

```text
yourname.de5.net
yyq.us.ci
yyq.cc.cd
```

虽然它们可以作为独立区域加入 Cloudflare，但上级根域仍由 DNSHE 或根域持有人控制。

> [!warning] 重要风险
> 这种域名适合测试和个人项目，但不属于可以自由转移注册商的长期数字资产。
>
> DNSHE、上级根域持有人或服务规则发生变化时，域名可能受到影响。

---

## 二、后缀选择建议

优先选择已经进入 Public Suffix List、可作为独立区域加入 Cloudflare 的后缀。

| 后缀 | 建议程度 | 说明 |
|---|---:|---|
| `de5.net` | ⭐⭐⭐⭐⭐ | 当前最推荐，适合技术项目 |
| `us.ci` | ⭐⭐⭐⭐ | 较短，适合 API、CI/CD、服务器 |
| `cc.cd` | ⭐⭐⭐ | 容易记，但视觉上略重复 |
| `ccwu.cc` | ⭐⭐⭐ | 后台可注册时可用 |
| `bot.cd` | ⭐⭐ | 不建议默认按本教程接入 Cloudflare |
| `l.cd` | ⭐⭐ | 注册和 Cloudflare 支持情况需单独确认 |

> [!tip] 推荐命名
> 建议注册一个通用名称：
>
> ```text
> yourname.de5.net
> ```
>
> 然后通过子域区分服务：
>
> ```text
> kb.yourname.de5.net
> cpa.yourname.de5.net
> api.yourname.de5.net
> status.yourname.de5.net
> ```

---

# 第一部分：注册 DNSHE 账号

## 1. 打开 DNSHE 用户中心

进入 DNSHE 用户中心并选择注册账户。

注册地址：

```text
https://my.dnshe.com/register.php?language=chinese
```

建议使用长期稳定的公共邮箱注册，例如：

- Gmail
- Outlook / Hotmail
- QQ 邮箱
- 网易邮箱
- Apple 邮箱
- Yahoo 邮箱
- EDU 教育邮箱

> [!warning]
> 不要使用临时邮箱，也不要使用刚搭建的自有域名邮箱注册。
>
> 一旦域名失效，可能无法接收找回密码邮件。

## 2. 填写账号资料

通常需要填写：

- 邮箱
- 姓名
- 国家或地区
- 手机号码
- 密码

完成邮箱验证后登录。

## 3. 开启双重验证

登录后进入账户安全设置，开启 2FA。

建议使用：

- Google Authenticator
- Microsoft Authenticator
- 1Password
- Bitwarden
- KeePassXC TOTP

---

# 第二部分：注册免费域名

## 1. 进入免费域名页面

登录后依次进入：

```text
免费域名
→ 新增域名
```

当前免费额度通常可理解为：

```text
3 个基础免费额度
+ 2 个邀请解锁额度
= 最多 5 个免费域名
```

普通使用注册一个即可，不需要为了额度专门邀请。

## 2. 填写域名前缀

假设选择：

```text
de5.net
```

自定义前缀填写：

```text
yyq
```

最终得到：

```text
yourname.de5.net
```

正确填写：

```text
yyq
```

错误填写：

```text
https://yourname.de5.net
www.yourname.de5.net
yourname.de5.net
```

> [!tip] 命名建议
> 前缀尽量满足：
>
> - 简短
> - 容易记
> - 不绑定单一服务
> - 适合长期使用
>
> 推荐形式：
>
> ```text
> yourname.de5.net
> qyy.de5.net
> yyqkb.de5.net
> myyyq.de5.net
> ```

## 3. 确认域名状态

注册完成后，在域名列表检查：

```text
域名：yourname.de5.net
状态：Active
到期时间：约一年后
```

> [!info] 续期规则
> 新注册免费域名通常默认有效期为一年。
>
> 到期前约 180 天可免费续期，续期次数通常不限。
>
> 最终以 DNSHE 后台显示为准。

---

# 第三部分：将域名添加到 Cloudflare

## 1. 登录 Cloudflare

进入：

```text
Domains
→ Onboard a domain
```

中文界面可能显示：

```text
域
→ 添加域
```

## 2. 填写完整域名

输入：

```text
yourname.de5.net
```

正确：

```text
yourname.de5.net
```

错误：

```text
de5.net
https://yourname.de5.net/
www.yourname.de5.net
kb.yourname.de5.net
```

这里添加的是你在 DNSHE 注册到的那一级域名。

## 3. 选择免费套餐

选择：

```text
Free
$0
```

继续。

## 4. 查看 Cloudflare 分配的名称服务器

Cloudflare 会分配两条 NS，例如：

```text
alice.ns.cloudflare.com
bob.ns.cloudflare.com
```

> [!danger] 不要照抄示例
> 每个账号、每个域名分配到的 NS 不一样。
>
> 必须复制 Cloudflare 页面中实际显示的两条名称服务器。

---

# 第四部分：在 DNSHE 修改 NS

## 1. 返回 DNSHE 域名管理

进入：

```text
免费域名
→ 域名管理
→ yourname.de5.net
→ DNS服务器
```

页面名称也可能显示为：

```text
Nameservers
名称服务器
自定义 NS
```

## 2. 填入 Cloudflare NS

删除原有名称服务器，填写 Cloudflare 分配的两条 NS：

```text
alice.ns.cloudflare.com
bob.ns.cloudflare.com
```

填写规则：

- 每行一条
- 不带 `https://`
- 不填写 IP
- 不要作为普通 NS 解析记录添加
- 必须修改域名本身的权威名称服务器

错误做法：

```text
类型：NS
名称：@
内容：alice.ns.cloudflare.com
```

正确做法：

```text
在“DNS服务器 / Nameservers”页面
直接替换权威 NS
```

## 3. 检查 DNSSEC

如果从未启用 DNSSEC，可以先跳过。

如果之前启用过 DNSSEC：

```text
关闭旧 DNSSEC
→ 修改 NS
→ 等 Cloudflare 激活
→ 再重新配置 DNSSEC
```

初次使用建议先不开 DNSSEC，等解析和 HTTPS 全部正常后再启用。

## 4. 回到 Cloudflare 检查

点击：

```text
Check nameservers now
立即检查名称服务器
```

等待状态从：

```text
Pending Nameserver Update
```

变成：

```text
Active
```

> [!success] 托管完成标志
> Cloudflare 中域名状态显示 `Active` 后，Cloudflare 才正式成为该域名的权威 DNS 服务商。

从此以后，下面这些记录都应在 Cloudflare 中管理：

- A
- AAAA
- CNAME
- TXT
- MX
- SRV
- CAA

不要再在 DNSHE 的普通 DNS 解析页面维护这些记录。

---

# 第五部分：常见使用场景

## 场景一：解析到 Oracle VPS

假设服务器 IPv4：

```text
203.0.113.10
```

进入 Cloudflare：

```text
yourname.de5.net
→ DNS
→ Records
→ Add record
```

### 根域指向服务器

```text
类型：A
名称：@
IPv4：203.0.113.10
代理状态：Proxied
TTL：Auto
```

访问：

```text
https://yourname.de5.net
```

### 为 CPA 单独建立子域

```text
类型：A
名称：cpa
IPv4：203.0.113.10
代理状态：Proxied
TTL：Auto
```

访问：

```text
https://cpa.yourname.de5.net
```

---

## 场景二：服务监听 9527 端口

Cloudflare 普通代理不支持任意端口。

常见可代理端口包括：

```text
HTTP：
80
8080
8880
2052
2082
2086
2095

HTTPS：
443
8443
2053
2083
2087
2096
```

`9527` 不能直接通过普通橙云代理。

### 方法 A：灰云直连

将代理状态设置为：

```text
DNS only
```

访问：

```text
http://cpa.yourname.de5.net:9527
```

缺点：

- 暴露服务器真实 IP
- 不经过 Cloudflare HTTP 代理
- 需要直接开放 9527 端口

### 方法 B：Nginx 反向代理

推荐让 Nginx 对外监听 80 / 443，再转发到：

```text
127.0.0.1:9527
```

示例：

```nginx
server {
    listen 80;
    server_name cpa.yourname.de5.net;

    location / {
        proxy_pass http://127.0.0.1:9527;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

完成 HTTPS 后，在 Cloudflare 中设置：

```text
SSL/TLS
→ Overview
→ Full (strict)
```

> [!warning]
> 不建议长期使用 `Flexible`。
>
> 推荐源站也配置 HTTPS，并使用 `Full (strict)`。

---

## 场景三：绑定 Obsidian + Quartz + Cloudflare Pages

假设 Pages 默认域名：

```text
my-quartz.pages.dev
```

建议绑定：

```text
kb.yourname.de5.net
```

### 第 1 步：进入 Pages 项目

```text
Workers & Pages
→ 你的 Quartz 项目
→ Custom domains
```

### 第 2 步：添加自定义域名

点击：

```text
Set up a domain
```

填写：

```text
kb.yourname.de5.net
```

继续完成验证。

Cloudflare 通常会自动创建所需的 DNS 记录。

> [!warning] 不要只添加 CNAME
> 不要只在 DNS 页面手动添加：
>
> ```text
> kb → my-quartz.pages.dev
> ```
>
> 正确流程是先在 Pages 项目的 `Custom domains` 中完成绑定。
>
> 否则可能出现 522 或域名未关联的问题。

最终访问：

```text
https://kb.yourname.de5.net
```

---

## 场景四：多个服务的域名规划

建议统一规划：

| 域名 | 用途 | Cloudflare 模式 |
|---|---|---|
| `kb.yourname.de5.net` | Obsidian + Quartz | Pages 自动管理 |
| `cpa.yourname.de5.net` | CPA 面板 | 橙云 + Nginx |
| `api.yourname.de5.net` | API 服务 | 橙云 + HTTPS |
| `ssh.yourname.de5.net` | SSH | 灰云或 Tunnel |
| `status.yourname.de5.net` | 状态页 | 橙云 |
| `dev.yourname.de5.net` | 开发测试 | 按实际需求 |

---

# 第六部分：验证配置

## 检查 NS

在 Windows PowerShell 中执行：

```powershell
Resolve-DnsName -Name yourname.de5.net -Type NS -Server 1.1.1.1
```

正常应返回 Cloudflare 分配的两条 NS。

也可以使用：

```powershell
nslookup -type=ns yourname.de5.net 1.1.1.1
```

## 检查根域解析

```powershell
Resolve-DnsName -Name yourname.de5.net -Server 1.1.1.1
```

## 检查子域解析

```powershell
Resolve-DnsName -Name kb.yourname.de5.net -Server 1.1.1.1
```

## 检查 HTTPS

```powershell
curl.exe -I https://kb.yourname.de5.net
```

正常可能看到：

```text
HTTP/2 200
server: cloudflare
```

## 检查公网端口

```powershell
Test-NetConnection 服务器IP -Port 443
```

例如：

```powershell
Test-NetConnection 203.0.113.10 -Port 443
```

---

# 第七部分：免费续期

进入 DNSHE 域名列表，在到期前约 180 天检查是否出现：

```text
Free Renewal
免费续期
```

点击后，到期日期通常会顺延一年。

建议记录：

```text
注册日期
到期日期
开始可续期日期
实际续期日期
```

示例：

```text
注册日期：2026-07-19
预计到期：2027-07-19
开始可续期：约 2027-01-20
```

> [!warning]
> 具体日期必须以 DNSHE 后台显示为准。
>
> 不要只依赖记忆，建议设置日历提醒。

---

# 第八部分：常见问题排查

## 1. Cloudflare 一直显示 Pending

检查：

- DNSHE 中是否真正修改了权威 NS
- 是否误把 NS 添加成普通解析记录
- 两条 NS 是否拼写正确
- 是否带了 `https://`
- 是否遗漏其中一条
- DNSSEC 是否仍启用
- 是否等待足够的 DNS 传播时间

再次执行：

```powershell
Resolve-DnsName -Name yourname.de5.net -Type NS -Server 1.1.1.1
```

如果返回的仍不是 Cloudflare NS，说明委派尚未生效。

## 2. 域名解析正常，但网站打不开

检查：

- 服务器程序是否启动
- Nginx / Caddy 是否运行
- 80 / 443 是否监听
- Oracle 安全列表是否开放端口
- Ubuntu 防火墙是否开放端口
- Cloudflare SSL 模式是否正确
- 源站证书是否有效

Linux 检查监听端口：

```bash
sudo ss -lntp
```

检查 80 和 443：

```bash
sudo ss -lntp | grep -E ':80|:443'
```

## 3. 出现 522

522 通常表示 Cloudflare 无法连接源站。

检查：

- 源站 IP 是否正确
- 服务器是否在线
- 端口是否开放
- 防火墙是否拦截 Cloudflare
- Nginx 是否监听公网
- Cloudflare Pages 是否只手动加了 CNAME，而没有在 Pages 中绑定自定义域名

## 4. 出现 SSL 证书错误

检查：

- Cloudflare SSL 模式
- 源站证书是否过期
- 证书域名是否匹配
- 是否使用了 `Full (strict)`
- Nginx 是否加载了正确证书

## 5. 9527 端口打不开

检查：

```bash
sudo ss -lntp | grep 9527
```

如果没有输出，说明程序没有监听 9527。

如果有监听但公网打不开：

- Oracle 安全列表未放行
- Ubuntu 防火墙未放行
- 程序只监听 `127.0.0.1`
- Cloudflare 橙云不支持 9527

推荐做法：

```text
外部访问 443
→ Nginx
→ 127.0.0.1:9527
```

---

# 第九部分：安全建议

> [!danger] 不要滥用免费域名
> 不要用于：
>
> - 钓鱼
> - 仿冒登录页面
> - 垃圾邮件
> - 未授权反代
> - 绕过第三方服务限制
> - 恶意 API
> - 违法内容

DNSHE 可以直接删除域名并封禁账号。

## 推荐安全配置

- DNSHE 开启 2FA
- Cloudflare 开启 2FA
- VPS 禁止密码登录 SSH
- SSH 使用密钥
- 不直接暴露管理面板
- 面板增加强密码
- 优先使用 HTTPS
- 使用 Cloudflare Access 保护后台
- 定期备份 Nginx、Docker、CPA 配置
- 保留服务器 IP 和 SSH 直连方式
- 不把免费域名作为唯一入口

---

# 第十部分：最终操作清单

## DNSHE

- [ ] 注册 DNSHE 账号
- [ ] 验证邮箱
- [ ] 开启 2FA
- [ ] 注册 `yourname.de5.net`
- [ ] 记录到期日期

## Cloudflare

- [ ] 添加 `yourname.de5.net`
- [ ] 选择 Free 套餐
- [ ] 复制两条 Cloudflare NS
- [ ] 在 DNSHE 修改权威 NS
- [ ] 等待 Cloudflare 显示 Active
- [ ] 检查 DNSSEC 状态

## 解析与服务

- [ ] 添加 A / CNAME 记录
- [ ] 配置 Nginx 或 Caddy
- [ ] 开放 80 / 443
- [ ] 配置 HTTPS
- [ ] Cloudflare 设置 `Full (strict)`
- [ ] 验证根域和子域
- [ ] 配置 Quartz 自定义域名

## 后续维护

- [ ] 设置续期提醒
- [ ] 定期登录 DNSHE
- [ ] 备份服务配置
- [ ] 保留 IP 直连方式
- [ ] 定期检查域名状态

---

# 十一、推荐的最终结构

```text
DNSHE：
yourname.de5.net

Cloudflare Zone：
yourname.de5.net

子域规划：
kb.yourname.de5.net      → Obsidian + Quartz
cpa.yourname.de5.net     → CPA 面板
api.yourname.de5.net     → API
status.yourname.de5.net  → 状态页
ssh.yourname.de5.net     → SSH / Tunnel
```

完整流程：

```text
DNSHE 注册 yourname.de5.net
        ↓
Cloudflare 添加 yourname.de5.net
        ↓
复制 Cloudflare 两条 NS
        ↓
DNSHE 修改权威 NS
        ↓
Cloudflare 状态变 Active
        ↓
配置 A / CNAME / Pages
        ↓
配置 HTTPS
        ↓
每年免费续期
```

---

# 十二、参考资料

- [DNSHE 用户中心](https://my.dnshe.com/)
- [DNSHE 免费域名项目](https://github.com/dnshe/DNSHE-FreeDomains)
- [Cloudflare Full Setup](https://developers.cloudflare.com/dns/zone-setups/full-setup/)
- [Cloudflare 修改名称服务器](https://developers.cloudflare.com/dns/nameservers/update-nameservers/)
- [Cloudflare DNS 记录](https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/)
- [Cloudflare Pages 自定义域名](https://developers.cloudflare.com/pages/configuration/custom-domains/)
- [Cloudflare 支持的代理端口](https://developers.cloudflare.com/fundamentals/reference/network-ports/)
- [Public Suffix List](https://publicsuffix.org/)

---

## 关联笔记

- [[Obsidian 私人知识库自动发布 Quartz 与 Cloudflare Pages]]
- [[Quartz 4 升级 Quartz 5 复盘]]
