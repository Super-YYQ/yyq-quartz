---
title: GitHub 提交邮箱隐私与 Git 多身份配置
type: tutorial
status: stable
created: 2026-07-27
updated: 2026-09-11
publish: true
tags:
  - Git
  - GitHub
  - 隐私
  - 开发环境
---

# GitHub 提交邮箱隐私与 Git 多身份配置

## 目标

实现以下效果：

- GitHub 提交记录不公开真实邮箱。
- 默认使用 GitHub 身份提交。
- 公司项目目录自动切换为公司身份。
- 避免每次进入仓库后手动修改 `user.name` 和 `user.email`。
- 阻止命令行推送意外暴露真实邮箱。

> 本文全部使用占位符，不包含真实姓名、邮箱、用户名或本机目录。

---

## 一、GitHub 需要开启的两个邮箱隐私设置

进入：

```text
GitHub 头像 → Settings → Emails
```

开启以下两个选项。

### 1. Keep my email addresses private

作用：

- 隐藏 GitHub 网页端提交使用的真实邮箱。
- 使用 GitHub 提供的 `noreply` 邮箱。
- 降低真实邮箱出现在公开提交记录中的风险。

GitHub 提供的匿名邮箱通常类似：

```text
<ACCOUNT_ID>+<GITHUB_USERNAME>@users.noreply.github.com
```

请从 GitHub 的 **Settings → Emails** 页面复制自己的实际地址，不要手动猜测。

### 2. Block command line pushes that expose my email

作用：

- 当命令行提交使用了受保护的真实邮箱时阻止推送。
- 防止新电脑、旧仓库或错误配置意外暴露邮箱。
- 作为 Git 本地配置之外的第二层保护。

> 这两个设置属于 GitHub 账户的邮箱隐私设置，不是仓库的 Secret scanning 或 Push protection。

---

## 二、与仓库安全扫描功能的区别

### 邮箱隐私设置

位置：

```text
GitHub Settings → Emails
```

主要保护：

- Commit 作者邮箱
- GitHub 账户真实邮箱
- 命令行推送时的邮箱隐私

### Secret scanning

主要扫描：

- API Key
- Access Token
- 云服务密钥
- 数据库凭证
- 私钥及其他敏感凭证

### Push protection

主要作用：

- 在敏感凭证进入仓库前阻止推送。
- 保护的是代码中的密钥，不是 Commit 作者邮箱。

---

## 三、设置默认 GitHub 提交身份

默认身份用于：

- 个人项目
- 开源项目
- 知识库
- 非公司目录下的其他 Git 仓库

执行：

```powershell
git config --global user.name "<GITHUB_USERNAME>"
git config --global user.email "<GITHUB_NOREPLY_EMAIL>"
```

示例占位形式：

```powershell
git config --global user.name "<GITHUB_USERNAME>"
git config --global user.email "<ACCOUNT_ID>+<GITHUB_USERNAME>@users.noreply.github.com"
```

检查：

```powershell
git config --global user.name
git config --global user.email
```

---

## 四、创建公司专用 Git 配置

在用户主目录创建：

```text
~/.gitconfig-company
```

Windows PowerShell 可使用：

```powershell
notepad $HOME\.gitconfig-company
```

内容：

```gitconfig
[user]
    name = <COMPANY_GIT_NAME>
    email = <COMPANY_GIT_EMAIL>
```

该文件只保存公司提交身份。

---

## 五、按目录自动切换身份

打开全局 Git 配置：

```powershell
git config --global --edit
```

添加：

```gitconfig
[user]
    name = <GITHUB_USERNAME>
    email = <GITHUB_NOREPLY_EMAIL>

[includeIf "gitdir/i:<COMPANY_GIT_ROOT>/"]
    path = ~/.gitconfig-company
```

Windows 路径示例使用占位符：

```gitconfig
[includeIf "gitdir/i:D:/<COMPANY_PROJECTS>/"]
    path = ~/.gitconfig-company
```

配置逻辑：

- 默认使用 GitHub 身份。
- 仓库位于公司项目根目录下时，自动加载公司身份。
- `gitdir/i` 表示路径匹配时忽略大小写。
- 路径结尾建议保留 `/`。
- Git 配置中建议使用 `/`，不要使用 Windows 反斜杠 `\`。

---

## 六、推荐目录结构

```text
D:/Git/Company/
D:/Git/Personal/
D:/Git/OpenSource/
```

对应配置：

```gitconfig
[user]
    name = <GITHUB_USERNAME>
    email = <GITHUB_NOREPLY_EMAIL>

[includeIf "gitdir/i:D:/Git/Company/"]
    path = ~/.gitconfig-company
```

最终效果：

| 仓库位置 | 自动使用的身份 |
|---|---|
| `D:/Git/Company/` | 公司姓名与公司邮箱 |
| `D:/Git/Personal/` | GitHub 用户名与 noreply 邮箱 |
| `D:/Git/OpenSource/` | GitHub 用户名与 noreply 邮箱 |

---

## 七、检查当前仓库使用的身份

进入任意 Git 仓库后执行：

```powershell
git config --get user.name
git config --get user.email
```

查看配置来源：

```powershell
git config --show-origin --get user.name
git config --show-origin --get user.email
```

一次查看身份配置及来源：

```powershell
git config --show-origin --get-regexp "^user\.(name|email)$"
```

查看 Git 实际准备使用的作者与提交者身份：

```powershell
git var GIT_AUTHOR_IDENT
git var GIT_COMMITTER_IDENT
```

---

## 八、仓库级配置可能覆盖自动配置

Git 配置通常按照以下优先级生效：

```text
系统级配置
< 全局配置
< includeIf 加载的配置
< 当前仓库本地配置
```

检查当前仓库是否存在本地身份配置：

```powershell
git config --local --get user.name
git config --local --get user.email
```

如需删除本地覆盖：

```powershell
git config --local --unset user.name
git config --local --unset user.email
```

删除后重新检查：

```powershell
git config --get user.name
git config --get user.email
```

---

## 九、检查最近提交使用的邮箱

查看最近一次提交：

```powershell
git log -1 --format="作者：%an <%ae>%n提交者：%cn <%ce>"
```

查看最近 10 次提交：

```powershell
git log -10 --format="%h | %an <%ae> | %s"
```

PowerShell 中查看历史中出现过的全部邮箱：

```powershell
git log --format="%ae" | Sort-Object -Unique
```

---

## 十、错误邮箱尚未推送时的处理

如果已经 Commit，但尚未 Push：

1. 先确认当前身份配置正确：

```powershell
git config user.name
git config user.email
```

2. 重写最后一次提交的作者信息：

```powershell
git commit --amend --reset-author --no-edit
```

3. 再次检查：

```powershell
git log -1 --format="作者：%an <%ae>%n提交者：%cn <%ce>"
```

---

## 十一、错误邮箱已经推送时的说明

修改 Git 配置只影响之后创建的 Commit。

已经推送的提交：

- 不会自动改成新邮箱。
- 旧邮箱仍可能保留在 Git 历史中。
- 修改历史通常需要重写 Commit 并强制推送。
- 多人协作仓库不建议随意重写历史。

个人仓库确实需要清理时，可使用：

```text
git filter-repo
```

在操作前应先备份仓库。

---

## 十二、GitHub 如何关联提交到账号

GitHub 通常根据 Commit 邮箱判断提交属于哪个账号。

要让提交正确关联到 GitHub 账号，邮箱应满足以下任一条件：

1. 使用 GitHub 账户中已验证的邮箱。
2. 使用 GitHub 提供的 `noreply` 邮箱。

隐私优先时推荐：

```text
<ACCOUNT_ID>+<GITHUB_USERNAME>@users.noreply.github.com
```

---

## 十三、可选：PowerShell 身份检查函数

将下面内容加入 PowerShell 配置文件：

```powershell
function git-whoami {
    Write-Host "仓库目录：" (Get-Location)
    Write-Host "Git 用户名：" (git config user.name)
    Write-Host "Git 邮箱：" (git config user.email)
    Write-Host ""
    Write-Host "配置来源："
    git config --show-origin --get-regexp "^user\.(name|email)$"
}
```

进入仓库后执行：

```powershell
git-whoami
```

即可查看当前提交身份。

---

## 十四、配置检查清单

- [ ] 已开启 `Keep my email addresses private`
- [ ] 已开启 `Block command line pushes that expose my email`
- [ ] 已从 GitHub 页面复制正确的 `noreply` 邮箱
- [ ] 已设置默认 GitHub 用户名
- [ ] 已设置默认 GitHub `noreply` 邮箱
- [ ] 已创建 `~/.gitconfig-company`
- [ ] 已添加按目录匹配的 `includeIf`
- [ ] 公司目录路径末尾保留 `/`
- [ ] 已在个人仓库检查身份
- [ ] 已在公司仓库检查身份
- [ ] 已检查仓库级配置是否覆盖全局配置
- [ ] 已检查最近一次 Commit 的作者邮箱

---

## 核心配置模板

全局配置：

```gitconfig
[user]
    name = <GITHUB_USERNAME>
    email = <GITHUB_NOREPLY_EMAIL>

[includeIf "gitdir/i:<COMPANY_GIT_ROOT>/"]
    path = ~/.gitconfig-company
```

公司身份配置：

```gitconfig
[user]
    name = <COMPANY_GIT_NAME>
    email = <COMPANY_GIT_EMAIL>
```

最终策略：

```text
默认目录：GitHub 用户名 + GitHub noreply 邮箱
公司目录：公司提交姓名 + 公司邮箱
```
