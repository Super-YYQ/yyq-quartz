---
title: 为 Linux.do 指定固定 DNS 与直连规则
aliases:
  - Linux.do 固定 DNS
  - Clash Verge Rev Linux.do DNS
  - FlClash Linux.do DNS
tags:
  - Clash-Verge-Rev
  - FlClash
  - Mihomo
  - DNS
  - DoH
  - LinuxDo
  - Chrome
created: 2026-07-22
updated: 2026-09-11
type: tutorial
status: stable
publish: true
---

# 为 Linux.do 指定固定 DNS 与直连规则

## 目标

让访问 `linux.do` 时：

1. 固定使用指定的 DoH DNS 解析；
2. 网站流量使用 `DIRECT` 直连；
3. 机场节点失效时，只要 Clash/Mihomo 内核仍在运行，Linux.do 仍可尝试正常访问；
4. 分别适配 Clash Verge Rev 和 FlClash；
5. 能够通过“请求/连接”页面验证规则是否真正命中。

> [!important]
> DNS 只负责把域名解析为 IP，并不能保证网站一定能够直连。
>
> 这套方案只能处理：
>
> ```text
> 机场节点失效
> +
> Clash/Mihomo 内核仍在运行
> ```
>
> 如果代理客户端完全退出、内核停止，客户端内部的 DNS 和规则都会失效。

---

## 一、整体原理

访问链路：

```text
浏览器或应用
  ↓
Clash Verge Rev / FlClash
  ↓
Mihomo 匹配 linux.do
  ├─ DNS：指定 DoH
  └─ 出站：DIRECT
```

需要同时配置两部分：

```text
nameserver-policy
```

负责指定 DNS。

```text
DOMAIN-SUFFIX,linux.do,DIRECT
```

负责指定网站流量直连。

只配置 DNS、不配置 `DIRECT`，可能出现：

```text
域名使用了指定 DNS
但网站流量仍然走代理节点
```

只配置 `DIRECT`、不配置 DNS，可能出现：

```text
网站已直连
但仍使用默认 DNS，解析结果可能不理想
```

---

## 二、核心配置含义

### 1. 域名匹配

```yaml
"+.linux.do"
```

匹配：

```text
linux.do
www.linux.do
api.linux.do
其他多级子域名
```

### 2. 直连规则

```yaml
DOMAIN-SUFFIX,linux.do,DIRECT
```

表示：

```text
linux.do 及其所有子域名
→ 使用 DIRECT
→ 不经过机场代理节点
```

### 3. DNS 地址后的 `#DIRECT`

```text
https://你的DNS地址/dns-query#DIRECT
```

表示连接这个 DoH 服务器本身时也使用直连，不依赖代理节点。

> [!warning]
> 前提是该 DoH 地址从当前网络可以直接访问。
>
> 如果该 DNS 本身必须通过代理才能访问，就不要添加 `#DIRECT`，或者更换为可直连的 DNS。

---

## 三、Clash Verge Rev 配置

### 1. 找到 Merge 配置

新版 Clash Verge Rev 中，Merge 配置显示为：

```text
全局扩展覆写配置
```

路径：

```text
Clash Verge Rev
→ 订阅
→ 全局扩展覆写配置
```

右上角通常会显示：

```text
Merge
```

不要直接编辑机场订阅原文件，否则订阅更新后可能覆盖修改。

---

### 2. Linux.do 固定 DNS + 直连

编辑“全局扩展覆写配置”：

```yaml
# Clash Verge Rev：Linux.do 固定 DNS + 直连

profile:
  store-selected: true

prepend-rules:
  - DOMAIN-SUFFIX,linux.do,DIRECT

dns:
  enable: true
  nameserver-policy:
    "+.linux.do":
      - "https://你的DNS地址/dns-query#DIRECT"
```

将：

```text
https://你的DNS地址/dns-query
```

替换为真实的 DoH 地址。

示例：

```yaml
profile:
  store-selected: true

prepend-rules:
  - DOMAIN-SUFFIX,linux.do,DIRECT

dns:
  enable: true
  nameserver-policy:
    "+.linux.do":
      - "https://cloudflare-dns.com/dns-query#DIRECT"
```

---

### 3. 配置多个 DNS

```yaml
profile:
  store-selected: true

prepend-rules:
  - DOMAIN-SUFFIX,linux.do,DIRECT

dns:
  enable: true
  nameserver-policy:
    "+.linux.do":
      - "https://你的专用DNS1/dns-query#DIRECT"
      - "https://你的专用DNS2/dns-query#DIRECT"
      - "https://cloudflare-dns.com/dns-query#DIRECT"
```

建议配置 2～3 个即可。

> [!note]
> 多个 DNS 不应理解为严格的主备顺序。
>
> 更适合把它理解为给 Mihomo 提供多个可用解析器，提高整体可用性。

---

### 4. 已有 `dns:` 时的处理

YAML 中不能重复两个同级 `dns:`。

错误：

```yaml
dns:
  ipv6: false

dns:
  enable: true
```

正确：

```yaml
dns:
  ipv6: false
  enable: true
  nameserver-policy:
    "+.linux.do":
      - "https://你的DNS地址/dns-query#DIRECT"
```

---

### 5. 保存和生效

保存后：

1. 刷新机场订阅；
2. 必要时重启 Mihomo 内核；
3. 重启浏览器；
4. 打开 Linux.do 测试。

Windows 可以清理 DNS 缓存：

```powershell
ipconfig /flushdns
```

---

## 四、FlClash 图形界面配置

FlClash 可以不写 YAML，分别配置：

```text
DNS 覆写
+
附加规则
```

---

### 1. 打开 DNS 覆写

路径通常为：

```text
FlClash
→ 工具
→ 覆写
→ 进阶配置
→ DNS
```

推荐设置：

```text
覆写 DNS：开启
状态：开启
IPv6：关闭
遵守规则：关闭
PreferH3：关闭
DNS 模式：fakeip
```

说明：

- **覆写 DNS**：用 FlClash 的 DNS 设置覆盖订阅中的 DNS；
- **状态**：关闭后会退回系统 DNS；
- **遵守规则**：当前场景建议关闭，避免 DNS 查询跟随代理规则；
- **PreferH3**：不是必须，可以保持关闭；
- **fakeip**：可以继续使用，不影响本教程。

---

### 2. 配置域名服务器策略

进入：

```text
DNS
→ 域名服务器策略
→ 添加
```

填写：

```text
键：
+.linux.do

值：
https://你的DNS地址/dns-query#DIRECT
```

最终应显示类似：

```text
+.linux.do
https://你的DNS地址/dns-query#DIRECT
```

这部分等价于：

```yaml
dns:
  enable: true
  nameserver-policy:
    "+.linux.do": "https://你的DNS地址/dns-query#DIRECT"
```

---

### 3. 删除默认示例策略

FlClash 的域名服务器策略中可能默认出现：

```text
www.baidu.com
114.114.114.114

+.internal.crop.com
10.0.0.1

geosite:cn
https://doh.pub/dns-query
```

如果只想让 Linux.do 使用指定 DNS，建议删除这些示例，只保留：

```text
+.linux.do
https://你的DNS地址/dns-query#DIRECT
```

其中：

```text
geosite:cn
```

会影响大量中国大陆域名，而不只是 Linux.do。

---

### 4. 添加 Linux.do 直连规则

路径：

```text
FlClash
→ 工具
→ 覆写
→ 进阶配置
→ 附加规则
→ 添加
```

填写：

```text
规则类型：DOMAIN-SUFFIX
内容：linux.do
规则目标：DIRECT
```

保存后的卡片应类似：

```text
DOMAIN_SUFFIX                 DIRECT
linux.do
```

最终等价于：

```yaml
DOMAIN-SUFFIX,linux.do,DIRECT
```

---

### 5. 常见填写错误

错误填写：

```text
规则类型：DOMAIN-SUFFIX
内容：DOMAIN-SUFFIX
规则目标：DIRECT
```

这相当于：

```yaml
DOMAIN-SUFFIX,DOMAIN-SUFFIX,DIRECT
```

不会匹配 Linux.do。

正确填写：

```text
规则类型：DOMAIN-SUFFIX
内容：linux.do
规则目标：DIRECT
```

---

### 6. 为什么没有“不解析 IP”和“匹配来源 IP”

这是正常现象。

`DOMAIN-SUFFIX` 是域名规则，不需要这些参数。

FlClash 只会在部分 IP 类规则中显示附加参数，例如：

```text
GEOIP
IP-CIDR
IP-CIDR6
IP-ASN
RULE-SET
```

所以对 Linux.do 的域名后缀规则，只需填写：

```text
DOMAIN-SUFFIX
linux.do
DIRECT
```

没有以下选项并不代表配置不完整：

```text
不解析 IP
匹配来源 IP
```

---

### 7. FlClash 图形界面的多个 DNS 限制

FlClash 的“域名服务器策略”图形界面通常是一组：

```text
键 → 单个值
```

因此一个域名在图形界面里通常只能直接对应一个 DNS 字符串。

推荐先这样配置：

```text
+.linux.do
→ https://你的主要DNS/dns-query#DIRECT
```

如果必须给 Linux.do 配置多个 DNS，可以改用 FlClash 的覆写脚本。

---

## 五、FlClash 多 DNS 覆写脚本

路径：

```text
FlClash
→ 工具
→ 覆写
→ 进阶配置
→ 脚本
→ 添加
```

脚本：

```javascript
const main = (config) => {
  if (!config.dns) {
    config.dns = {};
  }

  config.dns.enable = true;
  config.dns["respect-rules"] = false;

  if (!config.dns["nameserver-policy"]) {
    config.dns["nameserver-policy"] = {};
  }

  config.dns["nameserver-policy"]["+.linux.do"] = [
    "https://你的专用DNS1/dns-query#DIRECT",
    "https://你的专用DNS2/dns-query#DIRECT"
  ];

  if (!Array.isArray(config.rules)) {
    config.rules = [];
  }

  config.rules = config.rules.filter(
    (rule) => rule !== "DOMAIN-SUFFIX,linux.do,DIRECT"
  );

  config.rules.unshift("DOMAIN-SUFFIX,linux.do,DIRECT");

  return config;
};
```

保存后，把当前订阅的覆写模式切换为：

```text
脚本
```

并选择刚创建的脚本。

> [!warning]
> 使用脚本方案时，建议关闭 FlClash 图形界面的“覆写 DNS”，避免图形 DNS 配置再次覆盖脚本结果。

---

## 六、浏览器和 ZeroOmega 注意事项

如果 Chrome 使用 ZeroOmega / Proxy SwitchyOmega：

不要在 ZeroOmega 中直接把 `linux.do` 设置为浏览器级 `DIRECT`，否则请求可能绕过 Clash，Mihomo 的 DNS 策略无法参与。

正确链路：

```text
Chrome
→ ZeroOmega
→ Clash Verge Rev 本地代理端口
→ Clash 内部匹配 linux.do
→ DNS 使用指定 DoH
→ 网站连接使用 DIRECT
```

也就是说：

```text
浏览器把流量交给 Clash
Clash 再决定 DIRECT
```

---

## 七、验证配置是否真正生效

### 1. 检查请求或连接

访问：

```text
https://linux.do
```

在 Clash Verge Rev 或 FlClash 中打开：

```text
请求
或
连接
```

正确结果应包含：

```text
目标域名：linux.do
规则：DOMAIN-SUFFIX
代理链：DIRECT
```

如果显示：

```text
节点选择
→ 某个代理节点
```

说明 DNS 可能已经生效，但 `DIRECT` 规则没有真正命中。

---

### 2. FlClash 显示代理节点时的完整排查

#### 第一步：检查出站模式

进入：

```text
FlClash
→ 仪表盘
→ 出站模式
```

必须选择：

```text
规则
```

不能是：

```text
全局
```

如果处于“全局”模式，所有请求都会走当前选择的代理节点，附加的域名规则不会按预期生效。

---

#### 第二步：检查当前订阅的覆写模式

进入：

```text
FlClash
→ 配置
→ 点击当前正在使用的订阅
→ 覆写
```

确认覆写模式是：

```text
标准
```

因为通过图形界面添加的“附加规则”属于标准覆写模式。

如果当前使用的是：

```text
脚本
或
自定义
```

标准模式中的附加规则可能不会进入最终配置。

---

#### 第三步：确认当前订阅启用了全局附加规则

在当前订阅的标准覆写页面中找到：

```text
控制全局附加规则
```

确认：

```text
DOMAIN-SUFFIX,linux.do,DIRECT
```

处于启用状态。

需要注意：

```text
工具 → 附加规则
```

中能够看到规则，只代表规则已经创建。

当前订阅仍有可能单独禁用了这条全局附加规则。

---

#### 第四步：使用“预览”检查最终配置

进入当前订阅的覆写页面，点击：

```text
预览
```

搜索：

```text
linux.do
```

最终配置中必须存在：

```yaml
rules:
  - DOMAIN-SUFFIX,linux.do,DIRECT
```

并且它必须位于最终兜底规则之前，例如：

```yaml
- MATCH,节点选择
```

正确顺序：

```yaml
rules:
  - DOMAIN-SUFFIX,linux.do,DIRECT

  # 机场其他规则……

  - MATCH,节点选择
```

如果 `linux.do` 规则位于 `MATCH` 之后，它永远不会命中。

如果预览中完全找不到该规则，说明当前订阅没有应用这条附加规则。

---

#### 第五步：关闭旧连接

规则修改不会自动改变已经建立的 TCP 连接。

建议执行：

```text
关闭 Chrome
→ 在 FlClash 的连接页面关闭现有连接
→ 停止 FlClash
→ 重新启动 FlClash
→ 确认出站模式为“规则”
→ 重新打开 Chrome
→ 再访问 Linux.do
```

如果不关闭旧连接，界面中可能仍显示之前使用的代理节点。

---

### 3. 模拟节点失效

可以切换到不可用节点，然后重新访问 Linux.do。

预期：

```text
代理节点不可用
+
Mihomo 内核仍运行
+
linux.do 命中 DIRECT
+
指定 DoH 可直连
=
Linux.do 仍可尝试打开
```

---

### 4. 客户端完全退出时

如果 Clash Verge Rev 或 FlClash 整体退出：

```text
nameserver-policy 不再工作
DIRECT 规则不再工作
本地代理端口也可能停止监听
```

因此网站可能仍打不开。

要实现客户端退出后仍可访问，需要换成系统级方案，例如：

```text
Windows 全局 DNS
hosts 文件
AdGuard Home
MosDNS
dnscrypt-proxy
```

---

## 八、最终配置速查

### Clash Verge Rev

```yaml
profile:
  store-selected: true

prepend-rules:
  - DOMAIN-SUFFIX,linux.do,DIRECT

dns:
  enable: true
  nameserver-policy:
    "+.linux.do":
      - "https://你的DNS地址/dns-query#DIRECT"
```

### FlClash

DNS：

```text
覆写 DNS：开启
状态：开启
遵守规则：关闭

域名服务器策略：
+.linux.do
→ https://你的DNS地址/dns-query#DIRECT
```

附加规则：

```text
规则类型：DOMAIN-SUFFIX
内容：linux.do
规则目标：DIRECT
```

运行条件：

```text
出站模式：规则
当前订阅覆写模式：标准
当前订阅已启用该全局附加规则
```

---

## 九、故障排查速查表

### Linux.do 仍然走代理

依次检查：

```text
1. 出站模式是否为“规则”
2. 当前订阅覆写模式是否为“标准”
3. 当前订阅是否启用了这条全局附加规则
4. 预览中是否存在 DOMAIN-SUFFIX,linux.do,DIRECT
5. 该规则是否位于 MATCH 之前
6. 是否关闭了修改前建立的旧连接
```

---

### DNS 已配置但网站仍打不开

检查：

- DoH 地址是否真实有效；
- DoH 地址是否能直连；
- 是否误加了无法直连的 `#DIRECT`；
- Linux.do 本身是否可以从当前网络直连；
- 是否存在 TLS、SNI、路由或网络层限制。

---

### FlClash 中没有“不解析 IP”

正常。

`DOMAIN-SUFFIX` 不需要该选项。

---

### 配置保存后没有生效

尝试：

1. 保存覆写配置；
2. 确认当前订阅应用了覆写；
3. 停止并重新启动客户端；
4. 重启 Mihomo 核心；
5. 清理 DNS 缓存；
6. 关闭旧连接；
7. 重新访问 Linux.do；
8. 在“请求/连接”中查看实际命中的规则。

---

### DNS 策略里有很多默认条目

如果只想处理 Linux.do，删除其他示例，只保留：

```text
+.linux.do
→ 你的 DoH
```
