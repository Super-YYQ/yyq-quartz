---
title: Debian SSH 密钥登录排障与安全加固
type: tutorial
status: stable
created: 2026-09-17
updated: 2026-09-17
publish: true
tags:
  - SSH
  - OpenSSH
  - Debian
  - Windows
  - VPS
  - 安全
aliases:
  - VPS SSH 密钥登录排障
  - Windows OpenSSH 登录 Debian
---

# Debian SSH 密钥登录排障与安全加固

本文处理一种典型故障：Windows 客户端能读取 ED25519 私钥，服务器也保存了对应公钥，但 SSH 仍只允许密码认证。排查后发现 Debian 服务端的最终配置为 `PubkeyAuthentication no`。

相关笔记：[[Windows 使用 KeePassXC 与 SSH Agent 管理 SSH 密钥]]、[[美国 VPS 搭建 AI 专用出口 Xray REALITY 与 FlClash 分流教程]]。

## 最终目标

```text
Windows OpenSSH / KeePassXC Agent
        │ ED25519 公钥认证
        ▼
Debian VPS
├─ 普通管理用户登录
├─ 需要时通过 sudo 提权
├─ 禁止 root 远程登录
└─ 验证成功后关闭密码与交互式认证
```

> [!danger]
> 修改 SSH 认证方式可能导致远程失联。全程保留一个已登录的管理会话，并确认云厂商控制台、VNC 或其他应急入口可用。

## 一、先确认本地密钥

以下示例使用占位符：

```text
管理用户：adminuser
服务器地址：203.0.113.10
SSH 端口：2222
私钥文件：server_ed25519
```

### 检查文件

在 Windows PowerShell 执行：

```powershell
Get-Item "$env:USERPROFILE\.ssh\server_ed25519*"
```

应至少包含：

```text
server_ed25519       私钥，不可公开
server_ed25519.pub   公钥，可安装到服务器
```

### 比对公钥指纹

Windows：

```powershell
ssh-keygen -lf "$env:USERPROFILE\.ssh\server_ed25519.pub"
```

Debian：

```bash
ssh-keygen -lf /home/adminuser/.ssh/authorized_keys
```

指纹一致可以排除“安装了错误公钥”，但不能证明服务端允许公钥认证。

## 二、用客户端日志定位认证阶段

强制只使用指定私钥：

```powershell
ssh -vvv `
  -o IdentitiesOnly=yes `
  -i "$env:USERPROFILE\.ssh\server_ed25519" `
  -p 2222 `
  adminuser@203.0.113.10
```

关键日志：

```text
Offering public key
Server accepts key
Authenticated ... using "publickey"
```

若客户端已经列出待尝试密钥，但服务端返回的可用认证方式只有 `password`，并且从未出现 `Offering public key`，应优先检查服务端是否关闭了公钥认证。

以下信息通常不是根因：

- 用户级 `.ssh/config` 不存在。
- 显式使用 `-i` 时，客户端无法连接 ssh-agent。
- 登录成功后仍显示 `debug3`：这是 `-vvv` 调试输出。
- Debian 中没有 `ll`：它只是未定义该 alias。

## 三、确认 Debian 的最终生效配置

查看全局最终值：

```bash
sudo /usr/sbin/sshd -T | grep -Ei \
'pubkeyauthentication|passwordauthentication|kbdinteractiveauthentication|authorizedkeysfile|authenticationmethods|permitrootlogin|usepam'
```

再查找配置来源：

```bash
sudo grep -RniE \
'^[[:space:]]*(Include|PubkeyAuthentication|PasswordAuthentication|KbdInteractiveAuthentication|AuthorizedKeysFile|AuthenticationMethods|PermitRootLogin|Match)[[:space:]]' \
/etc/ssh/sshd_config /etc/ssh/sshd_config.d 2>/dev/null
```

若存在 `Match` 条件块，用实际连接条件检查：

```bash
sudo /usr/sbin/sshd -T \
  -C user=adminuser,host=server.example,addr=198.51.100.25 \
  | grep -Ei 'pubkeyauthentication|passwordauthentication|kbdinteractiveauthentication|permitrootlogin'
```

> [!important]
> OpenSSH 对多数配置项采用“首次取得的值生效”。`Include` 文件按字典序加载，因此不要简单地把重复配置追加到主文件末尾；必须以 `sshd -T` 的结果为准。

## 四、先恢复公钥认证

本节只开启公钥认证，暂时保留原有密码和 root 登录作为回退。

### 备份配置

```bash
sudo cp -a /etc/ssh/sshd_config \
  /etc/ssh/sshd_config.before-pubkey

sudo cp -a /etc/ssh/sshd_config.d \
  /etc/ssh/sshd_config.d.before-pubkey
```

确认主配置包含位于认证设置之前的：

```text
Include /etc/ssh/sshd_config.d/*.conf
```

然后创建本地管理文件：

```bash
sudoedit /etc/ssh/sshd_config.d/00-local-auth.conf
```

第一阶段只写：

```text
PubkeyAuthentication yes
```

如果当前系统不加载 `sshd_config.d`，应编辑前一步查到的实际配置来源，而不是继续写一个不会被读取的文件。

### 语法与最终值检查

```bash
sudo /usr/sbin/sshd -t
sudo /usr/sbin/sshd -T | grep -Ei \
'permitrootlogin|passwordauthentication|kbdinteractiveauthentication|pubkeyauthentication'
```

`sshd -t` 无输出代表语法检查通过。只有当最终值显示：

```text
pubkeyauthentication yes
```

才重新加载服务：

```bash
sudo systemctl reload ssh
```

不要先停止 `ssh` 服务，也不要关闭当前会话。

## 五、在第二个窗口验证密钥登录

新开 PowerShell：

```powershell
ssh -vvv `
  -o IdentitiesOnly=yes `
  -i "$env:USERPROFILE\.ssh\server_ed25519" `
  -p 2222 `
  adminuser@203.0.113.10
```

验证身份和提权：

```bash
whoami
sudo -v
sudo whoami
```

输入项不要混淆：

| 提示 | 应输入的内容 |
|---|---|
| `Enter passphrase for key` | 本地 SSH 私钥口令 |
| `[sudo] password for adminuser` | Debian 普通用户密码 |
| SSH 密码认证提示 | Debian 登录用户密码 |

Linux 输入 sudo 密码时不会显示字符或星号，这是正常行为。

## 六、确认密钥稳定后收紧认证

只有以下条件全部满足才能继续：

- 第二个独立窗口已通过密钥登录普通用户。
- `sudo whoami` 返回 `root`。
- 原有管理会话仍保持连接。
- 应急控制台可用。

编辑：

```bash
sudoedit /etc/ssh/sshd_config.d/00-local-auth.conf
```

设置：

```text
PubkeyAuthentication yes
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin no
```

再次检查：

```bash
sudo /usr/sbin/sshd -t
sudo /usr/sbin/sshd -T | grep -Ei \
'permitrootlogin|passwordauthentication|kbdinteractiveauthentication|pubkeyauthentication'
```

目标结果：

```text
permitrootlogin no
pubkeyauthentication yes
passwordauthentication no
kbdinteractiveauthentication no
```

确认后重新加载：

```bash
sudo systemctl reload ssh
```

## 七、用第三个窗口做最终验收

保持以下三个窗口：

```text
窗口 A：修改前已登录的管理会话，用于回滚
窗口 B：第一次密钥登录成功的普通用户会话
窗口 C：重新加载后新开的最终测试会话
```

在窗口 C 登录：

```powershell
ssh `
  -o IdentitiesOnly=yes `
  -i "$env:USERPROFILE\.ssh\server_ed25519" `
  -p 2222 `
  adminuser@203.0.113.10
```

再次执行：

```bash
whoami
sudo whoami
```

窗口 C 验证成功后才能关闭窗口 A。

### 反向验证密码认证已关闭

```powershell
ssh `
  -o PubkeyAuthentication=no `
  -o PreferredAuthentications=password `
  -p 2222 `
  adminuser@203.0.113.10
```

预期失败并返回类似：

```text
Permission denied (publickey).
```

## 八、配置 SSH 别名

在 Windows 当前用户的 `.ssh\config` 中写入：

```sshconfig
Host server-a
    HostName 203.0.113.10
    Port 2222
    User adminuser
    IdentityFile ~/.ssh/server_ed25519
    IdentitiesOnly yes
```

以后使用：

```powershell
ssh server-a
```

若私钥只保存在 KeePassXC、由 Agent 提供，可按 [[Windows 使用 KeePassXC 与 SSH Agent 管理 SSH 密钥#Agent 中密钥很多时]] 的方式让 `IdentityFile` 指向对应公钥。

## 九、排障判断表

| 现象 | 优先检查 |
|---|---|
| 本地私钥不存在 | 路径和文件名 |
| 两端公钥指纹不同 | `authorized_keys` 是否贴错 |
| 服务端只提供 `password` | `sshd -T` 中的 `PubkeyAuthentication` |
| 已出现 `Offering public key` 但失败 | 用户、文件权限、`AuthorizedKeysFile`、`Match` 规则 |
| `Too many authentication failures` | `IdentitiesOnly` 与 Agent 中密钥数量 |
| 登录后持续出现 `debug3` | 客户端仍带 `-vvv` |
| 提示私钥 passphrase | 输入本地私钥口令 |
| 提示 sudo 密码 | 输入 Debian 普通用户密码 |
| Agent pipe 不存在 | Agent 未运行；显式 `-i` 不受影响 |

## 十、公开前隐私检查

发布教程、终端输出或截图前移除：

- 真实 VPS IP、端口、主机名和用户名。
- SSH 私钥、完整公钥及指纹。
- `Last login` 中的客户端出口 IP。
- Windows 本地用户名和绝对路径。
- 代理节点 UUID、REALITY 密钥、short ID、订阅地址。
- API Key、Cookie、Token 和安装命令中的 Secret。

## 验收清单

- [ ] 本地公钥与服务器 `authorized_keys` 指纹一致。
- [ ] `sshd -T` 显示 `pubkeyauthentication yes`。
- [ ] 普通用户可在新窗口通过密钥登录。
- [ ] 普通用户可正常执行 sudo。
- [ ] `sshd -t` 语法检查通过。
- [ ] 重新加载后第三个窗口仍能登录。
- [ ] `PermitRootLogin no` 已生效。
- [ ] 密码和交互式认证反向测试失败。
- [ ] 应急控制台和配置备份可用。

## 参考资料

- [OpenSSH `sshd_config` 手册](https://man.openbsd.org/sshd_config)
- [OpenSSH `sshd` 手册](https://man.openbsd.org/sshd)
- [Debian 12 `sshd_config` 手册](https://manpages.debian.org/bookworm/openssh-server/sshd_config.5.en.html)
- [Debian Wiki：SSH](https://wiki.debian.org/SSH)
