---
title: Windows 使用 KeePassXC 与 SSH Agent 管理 SSH 密钥
type: tutorial
status: stable
created: 2026-09-17
updated: 2026-09-17
publish: true
tags:
  - KeePassXC
  - SSH
  - Windows
  - OpenSSH
  - 密钥管理
aliases:
  - KeePassXC SSH Agent 教程
  - Windows SSH 密钥登录
---

# Windows 使用 KeePassXC 与 SSH Agent 管理 SSH 密钥

本文在 Windows 10/11 上使用系统 OpenSSH Agent，并把私钥作为附件保存在 KeePassXC 数据库中。解锁数据库后，KeePassXC 将密钥加载到 Agent；SSH 客户端无需直接读取裸私钥文件。

相关笔记：[[KeePassXC 推荐配置与使用指南]]、[[KeePass密码管理]]、[[GitHub 提交邮箱隐私与 Git 多身份配置]]。

> [!important]
> KeePassXC 不是 SSH Agent。它是 Windows OpenSSH Agent 或 Pageant 的客户端，负责在数据库解锁和锁定时添加、移除密钥。

## 最终结构

```text
KeePassXC 数据库
└─ SSH 条目
   ├─ 密码字段：私钥 passphrase
   └─ 附件：OpenSSH 私钥
          ↓ 数据库解锁时加载
Windows OpenSSH Authentication Agent
          ↓
ssh / Git
          ↓
服务器 ~/.ssh/authorized_keys 中的对应公钥
```

## 一、规划密钥

推荐每台电脑使用独立密钥：

```text
家用电脑  → Key A
工作电脑  → Key B
笔记本    → Key C
```

把各自的公钥添加到需要访问的服务器。某台设备丢失或停用时，只需删除对应公钥，不会影响其他设备。

多台电脑共用同一私钥虽然可行，但服务器无法区分设备，单机失陷后也不能只撤销这一台。KeePassXC 数据库可以同步，密钥身份仍应按设备拆分。

## 二、启用 Windows OpenSSH Agent

普通 PowerShell 检查组件：

```powershell
ssh -V
Get-Service ssh-agent
```

若找不到 `ssh`，在 Windows 的 **设置 → 应用 → 可选功能** 中安装 **OpenSSH 客户端**。

以管理员身份打开 PowerShell：

```powershell
Get-Service ssh-agent | Set-Service -StartupType Automatic
Start-Service ssh-agent
Get-Service ssh-agent
```

随后检查：

```powershell
ssh-add -l
```

出现 `The agent has no identities.` 表示 Agent 正常，只是尚未加载密钥。

## 三、生成 Ed25519 密钥

```powershell
ssh-keygen -t ed25519 -C "device-name"
```

默认会在当前用户的 `.ssh` 目录生成：

```text
id_ed25519       私钥
id_ed25519.pub   公钥
```

为私钥设置强 passphrase。它用于解密私钥，与服务器账号密码完全不同。

> [!warning]
> 服务器只接收公钥。私钥不可上传到服务器、公开仓库、聊天记录或普通云盘目录。

## 四、把私钥保存在 KeePassXC

新建条目，例如：

```text
标题：SSH Key - device-name
用户名：登录用户名或设备名
密码：私钥 passphrase
URL：ssh://server.example.com
```

若私钥没有 passphrase，密码字段保持为空；不要填写服务器密码。

编辑条目，进入 **高级 → 附件 → 添加**，选择没有 `.pub` 后缀的私钥文件。使用附件后，私钥会保存在加密的 KDBX 中；选择“外部文件”则只保存路径引用，换电脑后仍需单独复制文件。

检查文件类型：

```powershell
Get-Content "$env:USERPROFILE\.ssh\id_ed25519" -TotalCount 1
```

OpenSSH 私钥开头应类似：

```text
[OpenSSH 私钥头部标记]
```

若看到 `ssh-ed25519 AAAA...`，说明选中的是公钥。

## 五、配置 KeePassXC SSH Agent 集成

进入 **工具 → 设置 → SSH Agent**：

```text
☑ 启用 SSH Agent 集成
☑ OpenSSH for Windows
```

设置页应显示 Agent 连接正常。不要同时混用 Windows OpenSSH、Git for Windows 自带 Agent 和 Pageant。

再编辑 SSH 条目，进入 **SSH Agent**：

1. 私钥来源选择刚添加的附件。
2. 开启“数据库解锁时添加密钥”。
3. 开启“数据库锁定时移除密钥”。

也可在条目右键菜单中手动把密钥添加到 SSH Agent。验证：

```powershell
ssh-add -l
```

正常时会显示密钥指纹和类型，例如 `ED25519`。

## 六、把公钥安装到服务器

读取公钥：

```powershell
Get-Content "$env:USERPROFILE\.ssh\id_ed25519.pub"
```

首次使用原有密码或云厂商控制台登录服务器，然后执行：

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

把完整公钥粘贴为一行。多台电脑的公钥各占一行：

```text
ssh-ed25519 AAAA... home-pc
ssh-ed25519 BBBB... work-pc
```

> [!warning]
> 保留当前已登录的 SSH 会话，在另一个终端确认密钥登录成功后再退出。不要在首次测试前关闭密码登录。

## 七、测试登录

确认 Agent 已加载密钥：

```powershell
ssh-add -l
ssh user@203.0.113.10 -p 2222
```

如需查看认证过程：

```powershell
ssh -v user@203.0.113.10 -p 2222
```

成功时日志通常会包含：

```text
Offering public key
Server accepts key
Authenticated ... using "publickey"
```

## 八、使用 SSH Config 简化命令

编辑当前用户 `.ssh\config`：

```sshconfig
Host server-a
    HostName 203.0.113.10
    User user
    Port 2222
```

之后只需：

```powershell
ssh server-a
```

密钥较少时，OpenSSH 会从 Agent 中选择服务器接受的身份，无需设置 `IdentityFile`。

### Agent 中密钥很多时

若出现 `Too many authentication failures`，为每台服务器精确指定公钥并限制身份：

```sshconfig
Host server-a
    HostName 203.0.113.10
    User user
    Port 2222
    IdentityFile ~/.ssh/server-a_ed25519.pub
    IdentitiesOnly yes
```

这里可以让 `IdentityFile` 指向对应公钥；私钥仍由 Agent 提供，不必以裸文件长期保存在 `.ssh` 目录。

## 九、常见故障

### `The agent has no identities.`

依次检查：

1. `ssh-agent` 服务是否为 `Running`。
2. KeePassXC 是否启用了 OpenSSH for Windows 集成。
3. 条目是否选择了正确的私钥附件。
4. 数据库解锁时自动添加是否开启。
5. 锁定再解锁数据库，或手动添加条目密钥。

### KeePassXC 提示解密失败

密码字段必须填写私钥 passphrase，而不是服务器密码。可以验证私钥：

```powershell
ssh-keygen -y -f "$env:USERPROFILE\.ssh\id_ed25519"
```

输入正确 passphrase 后应输出对应公钥。

### PowerShell 可用，Git Bash 不可用

检查实际调用的 SSH：

```powershell
where.exe ssh
```

优先统一使用：

```text
C:\Windows\System32\OpenSSH\ssh.exe
```

Git for Windows 的 MSYS2 Agent socket 不受 KeePassXC 支持。安装 Git 时选择 Windows OpenSSH，或配置 Git 使用系统 OpenSSH。

### 同步盘保存 KDBX 失败

若 OneDrive 等同步工具短暂占用文件：

1. 不要立即关闭 KeePassXC。
2. 等待同步完成后再次保存。
3. 把 KDBX 设置为始终保留在本机。
4. 检查窗口标题是否有 `*`，它表示仍有未保存修改。

同步不是备份。至少保留云端版本历史和一份独立离线备份。

## 十、安全收尾

连续验证以下场景后，才考虑关闭服务器密码认证：

- KeePassXC 重启后可以加载密钥。
- 数据库锁定后密钥从 Agent 移除，解锁后重新加入。
- Windows 重启后 `ssh-agent` 自动运行。
- 新终端可以稳定完成公钥登录。
- 云厂商控制台或其他应急入口可用。

本地裸私钥确认已进入 KDBX 且有可靠备份后，可按自己的恢复策略安全删除；公钥和 SSH Config 可以保留。

## 验收清单

- [ ] Windows OpenSSH 客户端可用。
- [ ] `ssh-agent` 自动启动且状态为 Running。
- [ ] KeePassXC 已连接 OpenSSH for Windows。
- [ ] 私钥附件与 passphrase 配置正确。
- [ ] `ssh-add -l` 能看到预期指纹。
- [ ] 服务器 `authorized_keys` 只包含需要保留的公钥。
- [ ] `ssh -v` 确认使用 publickey 认证。
- [ ] KDBX 有版本历史与独立备份。

## 参考资料

- [KeePassXC User Guide：SSH Agent](https://keepassxc.org/docs/KeePassXC_UserGuide.html#_setup_ssh_agent)
- [KeePassXC Documentation and FAQ](https://keepassxc.org/docs/)
- [Microsoft Learn：OpenSSH 密钥认证](https://learn.microsoft.com/en-us/windows-server/administration/openssh/openssh_keymanagement)
