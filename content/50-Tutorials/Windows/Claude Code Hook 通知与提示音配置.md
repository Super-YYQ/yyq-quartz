---
title: Claude Code Hook 通知与提示音配置
publish: true
date: 2026-08-04
updated: 2026-08-04
tags:
  - windows
  - claude-code
  - powershell
  - hook
  - notification
  - 提示音
aliases:
  - Claude Code 提示音
  - Claude Code 通知脚本
type: tutorial
status: stable
---

# Claude Code Hook 通知与提示音配置

在 Windows 上，Claude Code 可以通过原生 Hook 在需要权限确认、完成一轮回答或执行失败时显示系统托盘通知，并播放提示音。本次实测的最终方案不依赖第三方通知工具，也不需要更换已有 Hook 配置；只需把 `notify.ps1` 的播放实现改为同步加载并播放 Windows 自带的 WAV 文件。

## 最终结论

保留原有的 `%USERPROFILE%\.claude\settings.json` Hook 配置，只替换 `%USERPROFILE%\.claude\hooks\notify.ps1`：

- 使用 `System.Windows.Forms.NotifyIcon` 显示托盘气泡通知。
- 使用 `System.Media.SoundPlayer` 播放 `%WINDIR%\Media` 下的 WAV 文件。
- 播放前显式调用 `Load()`，再调用 `PlaySync()`，避免异步播放时脚本过早退出。
- `Alarm02.wav` 或 `Alarm03.wav` 不存在时，回退到 `Alarm01.wav`。
- 声音播放失败时写入脚本目录下的 `notify-error.log`，不再使用空的 `catch` 隐藏异常。

## 事件与声音映射

| Claude Code 事件 | Hook 参数 | 默认声音 | 用途 |
| --- | --- | --- | --- |
| `Notification`，匹配 `permission_prompt` | `permission` | `Alarm01.wav` | 等待用户批准工具操作 |
| `Stop` | `done` | `Alarm03.wav` | 主 Agent 完成本轮响应 |
| `StopFailure` | `error` | `Alarm02.wav` | 本轮因 API 或其他错误结束 |

`Stop` 表示本轮响应结束，不等同于长期任务的所有工作都已完成；用户主动中断时也不会触发 `Stop`。`StopFailure` 用于 API 错误等异常结束场景。

如果当前操作已经被允许、处于自动批准模式，或本身不需要权限，`permission_prompt` 不会触发；这不是 Hook 失效，完成通知仍可正常触发。

## 可直接使用的 `notify.ps1`

文件位置：

```text
%USERPROFILE%\.claude\hooks\notify.ps1
```

```powershell
param(
    [ValidateSet("permission", "done", "error")]
    [string]$EventType = "done"
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

switch ($EventType) {
    "permission" {
        $title = "Claude Code 需要确认"
        $message = "Claude Code 正在等待你批准操作。"
        $tipIcon = [System.Windows.Forms.ToolTipIcon]::Warning
        $trayIcon = [System.Drawing.SystemIcons]::Warning
        $soundPath = "$env:WINDIR\Media\Alarm01.wav"
    }

    "error" {
        $title = "Claude Code 执行失败"
        $message = "本轮响应因错误而结束。"
        $tipIcon = [System.Windows.Forms.ToolTipIcon]::Error
        $trayIcon = [System.Drawing.SystemIcons]::Error
        $soundPath = "$env:WINDIR\Media\Alarm02.wav"
    }

    default {
        $title = "Claude Code 已完成"
        $message = "本轮回答已经完成，可以回来查看了。"
        $tipIcon = [System.Windows.Forms.ToolTipIcon]::Info
        $trayIcon = [System.Drawing.SystemIcons]::Information
        $soundPath = "$env:WINDIR\Media\Alarm03.wav"
    }
}

# 某些 Windows 安装没有 Alarm02.wav 或 Alarm03.wav，统一回退到 Alarm01.wav。
if (-not (Test-Path -LiteralPath $soundPath)) {
    $soundPath = "$env:WINDIR\Media\Alarm01.wav"
}

$notification = $null

try {
    $notification = New-Object System.Windows.Forms.NotifyIcon
    $notification.Icon = $trayIcon
    $notification.BalloonTipIcon = $tipIcon
    $notification.BalloonTipTitle = $title
    $notification.BalloonTipText = $message
    $notification.Visible = $true

    $notification.ShowBalloonTip(6000)

    $player = New-Object System.Media.SoundPlayer $soundPath
    $player.Load()
    $player.PlaySync()

    # 保持进程短暂存活，确保气泡通知有时间显示。
    Start-Sleep -Seconds 5
}
catch {
    $logPath = Join-Path $PSScriptRoot "notify-error.log"

    "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`r`n$($_ | Out-String)" |
        Add-Content -Path $logPath -Encoding UTF8
}
finally {
    if ($null -ne $notification) {
        $notification.Dispose()
    }
}
```

## Hook 配置

### 已经有可用 Hook 时

不需要修改 `settings.json`。只要现有命令已经调用 `notify.ps1`，并把三种事件分别传入 `permission`、`done`、`error` 即可。保留：

```json
"shell": "powershell",
"async": true
```

其中 `async: true` 可以避免通知脚本等待声音播放时阻塞 Claude Code。

在 Windows 上，`shell: "powershell"` 由 Claude Code 负责选择 PowerShell 运行时，并在 PowerShell 7 不可用时回退到 Windows PowerShell 5.1。除非兼容性测试证明有必要，否则不需要在每个 Hook 命令中硬编码 `powershell.exe` 的完整路径。

### 从零配置时的最小示例

如果尚未配置 Hook，可将下面内容合并进 `%USERPROFILE%\.claude\settings.json` 的顶层 `hooks` 对象。已有 `env`、插件或其他配置时，只添加对应事件，不要覆盖整个文件。

```json
{
  "hooks": {
    "Notification": [
      {
        "matcher": "permission_prompt",
        "hooks": [
          {
            "type": "command",
            "shell": "powershell",
            "command": "& \"$env:USERPROFILE/.claude/hooks/notify.ps1\" -EventType permission",
            "async": true
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "shell": "powershell",
            "command": "& \"$env:USERPROFILE/.claude/hooks/notify.ps1\" -EventType done",
            "async": true
          }
        ]
      }
    ],
    "StopFailure": [
      {
        "hooks": [
          {
            "type": "command",
            "shell": "powershell",
            "command": "& \"$env:USERPROFILE/.claude/hooks/notify.ps1\" -EventType error",
            "async": true
          }
        ]
      }
    ]
  }
}
```

## 安装与验证

先备份当前可用脚本，再覆盖内容：

```powershell
Copy-Item `
  "$env:USERPROFILE\.claude\hooks\notify.ps1" `
  "$env:USERPROFILE\.claude\hooks\notify-working.ps1"
```

依次手动测试三种事件：

```powershell
& "$env:USERPROFILE\.claude\hooks\notify.ps1" -EventType permission
& "$env:USERPROFILE\.claude\hooks\notify.ps1" -EventType done
& "$env:USERPROFILE\.claude\hooks\notify.ps1" -EventType error
```

检查 WAV 文件是否存在：

```powershell
Test-Path "$env:WINDIR\Media\Alarm01.wav"
Get-ChildItem "$env:WINDIR\Media" -Filter "*.wav" |
    Select-Object -ExpandProperty FullName
```

检查 `settings.json` 是否仍是合法 JSON：

```powershell
Get-Content "$env:USERPROFILE\.claude\settings.json" -Raw |
    ConvertFrom-Json |
    Out-Null

Write-Host "settings.json 格式正确"
```

完全退出并重新启动 Claude Code，然后运行 `/hooks` 检查 `Notification`、`Stop` 和 `StopFailure` 是否已注册。

## 无声音时的排查顺序

1. 先用默认播放器确认 Windows 音频输出设备、主音量和 WAV 文件本身正常。
2. 再单独测试同步播放：

   ```powershell
   $player = New-Object System.Media.SoundPlayer "$env:WINDIR\Media\Alarm01.wav"
   $player.Load()
   $player.PlaySync()
   ```

3. 如果当前 PowerShell 版本测试仍无声，可只用 Windows PowerShell 5.1 做兼容性验证，不必先修改 Hook：

   ```powershell
   & "$env:WINDIR\System32\WindowsPowerShell\v1.0\powershell.exe" `
     -NoProfile `
     -Command '$p = New-Object System.Media.SoundPlayer "$env:WINDIR\Media\Alarm01.wav"; $p.Load(); $p.PlaySync()'
   ```

4. 若直接播放成功但 Hook 无声，查看脚本目录下的 `notify-error.log`，并确认 Claude Code 使用的 Hook 命令确实指向当前 `notify.ps1`。
5. 检查 Windows 音量混合器中的系统声音、PowerShell 或终端应用是否被单独静音，或输出到了错误设备。

如果提示禁止运行脚本，只对当前用户启用本地脚本即可：

```powershell
Set-ExecutionPolicy `
  -Scope CurrentUser `
  -ExecutionPolicy RemoteSigned
```

不需要为了运行这个本地脚本而使用 `ExecutionPolicy Bypass`。

## 本次排障中不需要保留的方案

- 不需要安装 Code-Notify 或其他第三方通知模块。
- 不需要把 WAV 文件关联到默认播放器作为 Hook 的播放机制。
- 不需要使用 Windows Media Player COM 组件或 `winmm.dll` 的替代实现。
- 不要为了绕过安全软件而信任远程下载后立即执行的 PowerShell 安装脚本。

本方案依赖 Windows 自带的 Forms、Drawing 和 `SoundPlayer`，不产生网络请求，也不需要提交本机的 `.claude` 配置、日志或声音文件。

## 参考

- [Claude Code Hooks 官方文档](https://code.claude.com/docs/en/hooks)
