# 桌面壳浏览器预览器规格

## 入口

- 仅开发构建注册 `/desktop-shell-preview`。
- 预览页本身不进入桌面模拟；它用同源 iframe 承载目标业务路由。
- iframe URL 使用内部参数 `__desktop_shell_preview=macos|windows|linux`。

## 环境覆盖

- `isDesktopHost()`：预览参数有效时返回 `true`。
- `isImmersiveShell()`：预览参数有效时返回 `true`，不受 `_shell` 粘滞状态影响。
- `isMac()`：macOS 预览返回 `true`；Windows/Linux 返回 `false`。
- `hasHostBridge()` 与具体 native/auth API 保持原值；预览不会伪造宿主能力。
- 覆盖只在非 production 运行时生效。

## 视口

iframe 必须使用显式宽高，使 CSS 媒体查询按目标客户端可用视口执行，不能只给业务根节点设置宽度。预设：

| 名称         | 尺寸     | 用途                             |
| ------------ | -------- | -------------------------------- |
| 客户端最小   | 1200×720 | 商业客户端 `setMinimumSize` 下限 |
| Windows 验收 | 1240×752 | 当前 Windows 真机对照尺寸        |
| 常用桌面     | 1440×900 | 常规开发检查                     |

## 原生标题栏示意

- macOS：左侧红黄绿灯，36px 占用带。
- Windows/Linux：32px 顶部占用带和右侧窗口按钮示意。
- 示意层 `pointer-events:none`，不承担真实交互，也不改变业务布局。

## 安全边界

- 生产构建不注册预览路由，production 下忽略模拟参数。
- 目标路径禁止递归指向预览页。
- 仅模拟环境判定，不注入假的 token、文件系统或 IPC 方法。
