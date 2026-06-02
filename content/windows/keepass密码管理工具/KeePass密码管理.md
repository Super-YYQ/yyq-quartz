---
title: KeePass 密码管理
publish: true
date: 2026-05-26
tags:
  - keepass
  - 密码管理
  - 效率工具
  - 安全
aliases:
  - KeePass
  - 密码管理器
---

# KeePass 密码管理

开源免费的密码管理器，支持 Windows / Android / Chrome，通过插件扩展实现自动填充、两步验证、跨平台同步。

相关笔记：[[电脑必备软件]]

扩展阅读：[一劳永逸：KeePass全网最详使用指南](https://zhuanlan.zhihu.com/p/39645975)

官方下载：[KeePass 官网](https://keepass.info/download.html)

## 一、安装与中文配置

### 1.1 安装中文语言包

1. 安装 KeePass（默认英文）
2. 点击 `View` → `Change Language` → `Open Folder`
3. 解压中文语言包 zip，将文件复制到该文件夹
4. 重新点击 `View` → `Change Language`，选择 `Chinese_Simplified`，重启生效

### 1.2 插件安装

所有插件均为 `.plgx` 格式，安装方式统一：

1. `工具` → `插件管理器` → `打开文件夹`
2. 将 `.plgx` 文件复制到该文件夹
3. 重启 KeePass

### 1.3 推荐插件清单

| 插件 | 功能 | 来源 |
|---|---|---|
| KPEnhancedEntryView | 增强记录视图，一键查看/隐藏加密字段 | SourceForge |
| KPEntryTemplates | 模板编辑器，快速创建标准化记录 | GitHub |
| KeePassHttp | 与浏览器通信的 HTTP 桥接 | GitHub |
| KeeTrayTOTP | 桌面端生成 TOTP 两步验证码 | GitHub |
| WebAutoType | 根据网页自动填写标题/URL 快速添加记录 | SourceForge |
| AutoTypeSearch | 自动输入无匹配时弹出搜索框 | SourceForge |
| YetAnotherFaviconDownloader | 批量下载网站图标 | GitHub |
| KPSourceForgeUpdateChecker | 检查 SourceForge 来源插件的更新 | SourceForge |
| chromeIPass | Chrome 浏览器端自动填充（crx 安装） | Chrome Web Store |

## 二、数据库安全

### 2.1 加密方式

创建数据库时提供 3 种可组合的加密方式，建议使用 **管理密码 + 密钥文件**：

- **管理密码**：打开数据库的主密码，不要遗忘
- **密钥文件**：任意文件（图片、音频、文档等），原理是对文件做 SHA-256 哈希作为密钥。修改文件内容会导致无法解锁，重命名不影响。建议多方备份（其他盘、U盘、网盘）
- **Windows 用户账户**：绑定当前 Windows 账户

### 2.2 迭代次数

`数据库设置` → `安全` → `迭代次数`，默认 60000，建议设为 500000（安卓端打开约 5~6 秒）。次数越高，暴力破解难度越大。

### 2.3 安全桌面

`工具` → `选项` → `安全` → 勾选 `在安全桌面输入管理密码`。安全桌面环境下，键盘记录软件几乎无法工作。

### 2.4 数据库同步

建议将数据库文件存储在 OneDrive 文件夹中，利用 OneDrive 的版本历史记录和回收站功能防止误操作。安卓端可使用 FolderSync 进行双向同步。

## 三、自动输入

### 3.1 基本原理

KeePass 通过模拟按键实现自动输入。全局热键默认为 `Ctrl + Shift + A`（可能与 QQ 等软件冲突，可在 `工具` → `选项` → `集成` 中修改）。

**使用方式**：
- 点击目标输入框 → 按下全局自动输入热键
- 或在 KeePass 主界面右键记录 → `执行自动输入`

> 如果目标程序以管理员权限运行，KeePass 也必须以管理员权限运行才能自动输入。

### 3.2 匹配规则

按下自动输入热键时，KeePass 根据当前活动窗口标题在数据库中匹配记录——记录的 **标题** 或 **网址** 包含在窗口标题内即匹配成功。

**注意事项**：
- 标题需包含网页关键词（不能随意填写），否则无法匹配
- Chrome 中所有标签页标题都包含 "Google Chrome"，可能误匹配
- **务必勾选** `工具` → `选项` → `高级` → `总是显示全局自动输入记录选取对话框`

### 3.3 推荐键入规则

默认规则：`{USERNAME}{TAB}{PASSWORD}{ENTER}`

**推荐规则（适合中文用户）**：

```
+{DELAY 100}{CLEARFIELD}{USERNAME}{TAB}{PASSWORD}{ENTER}
```

- `+` = Shift 键（切换输入法）
- `{DELAY 100}` = 等待 100ms
- `{CLEARFIELD}` = 清空输入框
- 注意：使用此规则时确保当前输入法为**中文**状态

设置方式：编辑群组 → `自动输入` → `替代默认规则`，子记录会自动继承。

### 3.4 全自动切换英文输入并切回

通过 Windows 键盘快捷键 + KeePass 编码实现自动切换。

**Step 1 — Windows 键盘设置**：

控制面板 → 语言 → 高级键盘设置 → 语言栏选项 → 分别设置英语美式键盘和中文键盘的快捷键（如 `Ctrl+0` 切换英文，`Ctrl+1` 切换中文）。

**Step 2 — KeePass 规则**：

```
^0{CLEARFIELD}{USERNAME}{TAB}{PASSWORD}^1{ENTER}
```

- `^0` = Ctrl+0（切换到英文输入）
- `^1` = Ctrl+1（切换回中文输入）
- `^+1` = Ctrl+Shift+1（部分输入法如搜狗需要加 Shift）

这样自动填写时无需手动切换输入法。

### 3.5 双通道自动输入混淆

将要输入的字符随机分为两部分，分别用**模拟按键**和**复制粘贴**两种方式混合输入，输入完成后还原剪切板内容。单一的键盘记录或剪切板监听均无法窃取完整字段。

> 某些软件输入框不支持粘贴，因此该功能默认不启用。

启用方式：编辑记录 → `自动输入` → 勾选 `双通道自动输入混淆`。配合 KPEntryTemplates 模板插件可实现新建记录时自动启用。

### 3.6 指定窗口自定义规则

部分软件中全局自动输入可能失效，可通过 `编辑记录` → `自动输入` → `为指定窗口使用自定义规则` → `添加` → `选择窗口` 进行适配。

## 四、浏览器集成（KeePassHttp + chromeIPass）

### 4.1 工作原理

KeePassHttp 作为插件运行在 KeePass 中，chromeIPass 作为 Chrome 扩展运行在浏览器中。chromeIPass 不存储数据，每次通过 KeePassHttp 从 KeePass 数据库获取记录（AES 256 加密传输）。

### 4.2 chromeIPass 配置

1. 点击 Chrome 中 chromeIPass 图标 → `Connect`
2. 输入标识名称（如"家里的电脑"）→ `Save`
3. 默认快捷键：`Ctrl + Shift + U`（填充用户名+密码）、`Ctrl + Shift + P`（仅填充密码）

### 4.3 自动新建/更新记录

在未记录的网站登录时，chromeIPass 图标会变红闪烁，点击即可新建或更新记录。**注意**：chromeIPass 无法识别登录是否成功，输错密码也会闪烁。

### 4.4 进阶技巧

**网址前缀处理**：添加记录时网址设为 `baidu.com/` 而非 `www.baidu.com/`，这样子域名（`tieba.baidu.com`、`map.baidu.com`）均可匹配。使用 WebAutoType 插件可自动完成。

**修改网站密码**：
1. 在 chromeIPass 设置中取消勾选 `Automatically fill-in single credentials entry`
2. 打开密码修改页面，按 `Ctrl + Shift + P` 填入原密码
3. 在 KeePass 中修改密码
4. 切换到其他标签页再切回
5. 按 `Ctrl + Shift + P` 填入新密码

> 原理：切换标签页会触发 KeePassHttp 重新检索数据库。

**关闭密码生成器**：chromeIPass 的密码生成功能复制到剪切板后不会自动清除，建议在设置中关闭 `Activate password generator`。

## 五、两步验证（KeeTrayTOTP）

### 5.1 功能说明

在 Windows 端直接生成 TOTP 两步验证码，安卓端 Keepass2Android 无需额外配置即可使用。替代 Google Authenticator、Microsoft Authenticator、Steam 手机客户端等。

### 5.2 配置方法

1. 设置网站两步验证时，在二维码下方点击"无法扫描条形码"，获取密钥（TOTP Seed）
2. 在 KeePass 中选中记录，按 `Ctrl + Shift + I` 打开 TOTP 设置
3. 粘贴密钥到 `TOTP Seed`，`TOTP Format` 选择 `6`（6 位验证码）
4. 点击 `Finish`

使用：选中记录 → `Ctrl + T`（或右键 → Copy TOTP），验证码即复制到剪切板。

### 5.3 特殊网站处理

**小米**：只能扫码不给密钥时，用任意二维码扫描软件获取密钥（URI 中 `secret=` 参数）。

**Steam**（需手机 root）：
1. 安装 Steam 手机客户端并设置好令牌
2. 用 root 文件管理器打开 `/data/data/com.valvesoftware.android.steam.community/files/Steamguard`
3. 复制密钥，`TOTP Format` 选择 `Steam`
4. 验证与手机端令牌代码一致后可卸载手机客户端

## 六、KPEntryTemplates 模板配置

### 6.1 基础配置

1. `文件` → `数据库设置` → `高级`，在 `模板记录组` 中选择一个群组
2. 在该群组中按 `Ctrl+I` 添加记录
3. 配置 `自动输入` 勾选 `双通道自动输入混淆`
4. 点击 `Template` → `Init As Template`
5. 配置所需字段 → `确定`

### 6.2 关键字段类型

- **Protected Inline**：加密文本编辑框，用于存储支付密码等敏感字段
- **Listbox**：下拉列表框，适合邮箱、手机号等重复字段。分隔符为英文逗号

### 6.3 使用模板

添加记录时 → `Template` → `Set Template Parent`，选择对应模板即可。

## 七、高级技巧

### 7.1 固定配置（防篡改）

类似网吧还原机制，每次启动使用固定配置：

1. `工具` → `选项`，配置完成后点确定
2. 打开 `C:\Users\<用户名>\AppData\Roaming\KeePass`
3. 将 `KeePass.config.xml` 重命名为 `KeePass.config.enforced.xml`
4. 剪切到 `C:\Program Files (x86)\KeePass Password Safe 2`

如需取消，删除 `KeePass.config.enforced.xml` 即可。

### 7.2 TAN（一次性验证码）

适用于网站两步验证提供的备用验证码，每条 TAN 用过后自动标记失效日期。

- 建议为每个账户单独创建群组，避免混淆
- 添加方式：选中群组 → `工具` → `TAN 向导` → 勾选 `序号连续，开始于`

### 7.3 WebAutoType 快速添加

设置全局热键后，在网页中一键添加记录（标题和 URL 自动填充）：

`工具` → `WebAutoType Options` → 设置 `Global hot key` → `OK`

### 7.4 AutoTypeSearch 搜索补充

按下自动输入热键无匹配时弹出搜索框，手动搜索后执行自动输入。

可设置独立全局热键：`工具` → `选项` → `AutoTypeSearch` → 勾选并设置。

## 八、安卓端（Keepass2Android）

- 支持 TOTP、指纹解锁、自动清除剪切板、禁止应用内截图
- Android 8.0+ 支持应用内自动填充，8.0 以下使用内置键盘填充
- 离线版同步建议使用 FolderSync（双向同步）
- 官方版本内置中文，完全免费，仅从 Google Play 下载

## 九、常见问题

### 9.1 安全警告

- 仅从官方渠道下载 KeePass 及插件，避免使用精简版、修改版、增强版等
- 密钥文件不要随意修改内容，重命名不影响使用

### 9.2 快捷键冲突

默认 `Ctrl+Alt+A` 可能与 QQ 截图快捷键冲突，在 `工具` → `选项` → `集成` 中修改。

### 9.3 自动输入失效

目标程序以管理员权限运行时，KeePass 也需以管理员权限运行。
