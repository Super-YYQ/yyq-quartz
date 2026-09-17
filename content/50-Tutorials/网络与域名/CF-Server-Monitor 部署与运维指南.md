---
title: CF-Server-Monitor 部署与运维指南
type: tutorial
status: stable
created: 2026-09-17
updated: 2026-09-17
publish: true
tags:
  - Cloudflare
  - Workers
  - D1
  - VPS
  - 服务器监控
aliases:
  - CF-Server-Monitor 部署教程
  - CF Server Monitor
---

# CF-Server-Monitor 部署与运维指南

CF-Server-Monitor 把监控面板部署在 Cloudflare Workers 上，使用 D1 保存数据、Durable Objects 与 WebSocket 提供实时更新；每台被监控主机运行 `cf-probe` Agent，主动向 Worker 上报状态。

> [!important]
> 项目仍在快速迭代。界面名称、Agent 参数和升级方式应以上游 README 与部署后的管理后台为准，不要照搬旧版本命令。

## 架构与适用场景

```text
VPS-A ─┐
VPS-B ─┼─ cf-probe ─ HTTPS / WSS ─> Cloudflare Worker
VPS-C ─┘                              ├─ D1：配置与历史数据
                                     ├─ Durable Objects：实时连接
                                     └─ 管理面板与状态页
```

它适合少量到中等规模的个人服务器监控：不需要额外维护主控 VPS，Agent 也无需开放 Web 管理端口。若需要完整的主机可观测性、日志分析或复杂告警，应再评估 Netdata、Prometheus、Beszel 或 Uptime Kuma 等方案。

## 部署前准备

- Cloudflare 账号。
- GitHub 账号。
- 至少一台可通过 SSH 管理的 Linux 主机。
- 一段随机生成的 `API_SECRET`。

为减少 Shell 粘贴和转义问题，`API_SECRET` 可使用足够长的字母数字组合。不要在笔记、截图、终端历史或聊天记录中保存真实 Secret。

## 一、连接 GitHub 部署 Worker

1. 打开 [CF-Server-Monitor 官方仓库](https://github.com/huilang-me/CF-Server-Monitor)，Fork 到自己的 GitHub 账号。
2. 进入 Cloudflare Dashboard 的 **Workers & Pages**。
3. 创建应用并连接 GitHub，选择刚 Fork 的仓库。
4. 按上游 README 填写构建配置。当前常用值为：

   ```text
   Build command: npm run build:frontend
   Deploy command: npx wrangler deploy
   ```

5. 完成首次部署，确认构建日志成功。

使用 Fork 的好处是可以通过 GitHub 的 **Sync fork** 获取上游更新，并触发 Cloudflare 重新部署。

## 二、配置 Secret 与首次登录

进入 Worker 的 **Settings → Variables and Secrets**，设置：

```text
API_SECRET=<随机长字符串>
```

保存后确认新版本已部署到 Production。默认管理账号通常为 `admin`，初始密码使用 `API_SECRET`；首次登录后应立即设置独立的管理员密码。

```text
API_SECRET     → 仅供 Agent 上报认证
管理员密码     → 仅供人登录后台
```

> [!warning]
> Agent 安装命令通常包含 `API_SECRET`、服务器 ID 和 Worker 地址。不要公开命令全文，也不要在截图中暴露浏览器请求头里的 Bearer Token。

管理后台通常位于：

```text
https://<worker-name>.<account-subdomain>.workers.dev/admin
```

实际路径以上游当前版本为准。

## 三、添加服务器并安装 Agent

在管理后台新增服务器，例如：

```text
vps-us-01
vps-sg-01
```

新记录在 Agent 上线前显示离线是正常现象。点击服务器旁的复制按钮，使用后台生成的安装命令；它会携带正确的服务器 ID、Worker URL、Secret 和当前版本支持的参数。

> [!tip]
> 不要从旧教程手工拼接完整安装命令。项目的 Agent、参数和安装脚本会随版本变化，后台生成的命令更可靠。

安装后检查服务：

```bash
systemctl status cf-probe --no-pager
journalctl -u cf-probe -n 100 --no-pager
```

若使用用户级 systemd：

```bash
systemctl --user status cf-probe --no-pager
journalctl --user -u cf-probe -n 100 --no-pager
```

后台出现 CPU、内存、磁盘、网络、延迟和最近上报时间，即说明链路已打通。

## 四、基础配置建议

### 上报与采集间隔

先使用项目默认值。个人少量主机通常不需要追求数秒级刷新；服务器增加后，可适当延长上报间隔以减少 Worker 请求、D1 写入和历史数据量。

### 流量重置日

按服务商实际账单周期设置 `reset_day`。若套餐每月 15 日重置流量，就不要保留默认的 1 日，否则月流量统计会失真。

### 服务器命名

使用不暴露内部信息的统一格式：

```text
用途-地区-序号
web-us-01
relay-sg-01
```

公开状态页时隐藏 IP、内部备注、价格、到期时间以及不需要展示的主机。

### 域名

`workers.dev` 可用于初期验证。需要自定义域名时，在 Worker 的 **Domains & Routes** 中添加 Custom Domain，再让 Agent 改用新地址。D1 数据、服务器 ID 和 Secret 无需因此重建。

## 五、安全加固

- 管理员密码与 `API_SECRET` 分离。
- Agent 优先以低权限用户运行；使用用户级 systemd 时按需启用 linger。
- 状态页默认保持私有，只公开必要字段。
- 第三方背景图、脚本、字体和 Webhook 只允许可信来源。
- 定期轮换已泄露或疑似泄露的 Secret，并重新生成 Agent 安装命令。
- 升级前导出服务器配置，并记录当前部署版本。

项目使用 CSP 限制外部资源。背景图、CSS、JS、字体或外部 API 加载失败时，应添加最小可信域名白名单，不要关闭或全面放开 CSP。

## 六、常见故障

### Shell 持续显示 `>`

这通常表示引号未闭合或复制的命令被截断，并非安装程序卡死。

1. 按 `Ctrl + C` 退出续行状态。
2. 重新从后台复制完整命令。
3. 检查 Secret 是否因特殊字符破坏 Shell 引号。

### Agent 在线但后台仍显示离线

依次检查：

1. `cf-probe` 服务和日志。
2. 主机能否访问 Worker URL。
3. Worker URL、服务器 ID、`API_SECRET` 是否来自同一次后台生成。
4. Worker 最新部署是否已进入 Production。
5. 修改 Secret 后是否重新安装或更新 Agent 配置。

### 修改 Secret 后仍出现旧值

先确认 Cloudflare 中的 Secret 已保存并随新部署生效，再强制刷新管理页面并重新复制安装命令。若使用 GitHub Actions 部署，还要同步更新仓库 Actions Secret，避免下一次部署覆盖设置。

### 页面能打开，保存时出现 `Failed to fetch`

打开浏览器开发者工具检查失败请求：

- 有 HTTP 状态码：根据 `401`、`403`、`5xx` 排查鉴权或 Worker 错误。
- 没有状态码并出现 `ERR_NETWORK_CHANGED`：通常是浏览器代理路径在请求期间发生切换。

同时使用浏览器代理扩展、系统代理、分流工具和 TUN 时，应让同一站点的 HTML、Fetch/XHR 与 WebSocket 走同一条稳定路径。可暂时关闭自动切换，逐层排除代理。

### 外部资源被浏览器拦截

先在 Console 查看是否为 CSP 错误。仅将实际需要、可以信任的资源域名加入对应的 CSP Static 或 CSP API 白名单。

## 七、升级、备份与容量

### 同步上游

在 Fork 仓库选择 **Sync fork → Update branch**。部署完成后再观察 Worker 日志和 Agent 在线情况，不要把“同步成功”等同于“生产可用”。

### 升级 Agent

优先使用管理后台当前版本给出的升级或重新安装命令。涉及 Agent 上报地址、Secret 或自动更新设置时，通常需要重新执行完整安装命令。

### 备份

以下时机应导出服务器配置：

- 大版本升级前。
- 批量修改主机、分组或标签后。
- 迁移 Worker 或域名前。

导出文件也可能包含内部资产信息，应按敏感配置保管。

### 免费额度

Cloudflare 配额会随套餐与官方政策变化，不应在教程中写死固定数值。以 Cloudflare Dashboard 和官方文档为准；机器增加时优先降低上报频率、减少 Ping 目标并控制历史数据量。

## 八、验收清单

- [ ] Worker 构建与生产部署成功。
- [ ] `API_SECRET` 已设置且未出现在仓库或截图中。
- [ ] 管理员密码与 Agent Secret 不同。
- [ ] 每台主机的 `cf-probe` 服务正常。
- [ ] 管理后台持续收到 CPU、内存、磁盘和网络数据。
- [ ] 告警时区、通知目标和流量重置日正确。
- [ ] 外部资源仅使用最小 CSP 白名单。
- [ ] 已导出一份服务器配置并安全保存。

## 参考资料

- [CF-Server-Monitor 官方仓库](https://github.com/huilang-me/CF-Server-Monitor)
- [CF-Server-Monitor API 文档](https://github.com/huilang-me/CF-Server-Monitor/blob/main/API.md)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)
- [Cloudflare Workers 自定义域名](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)
