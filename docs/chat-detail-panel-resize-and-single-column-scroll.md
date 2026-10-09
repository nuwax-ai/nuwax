# 会话详情拖拽调宽 + 智能体详情弹窗 + 单栏滚动收敛（2026-09-14）

> 分支 `feat-dong.0930`，本轮提交：`faab43375` → `18aa4f06a` → `1dbaf19e0` → `9532a4ee2` → `f89ec305c` → `6d92a9442`。本文为需求落地总结与覆盖范围备忘。

## 一、会话详情：右侧面板拖拽调宽（`faab43375`）

- **范围**：仅 `/home/chat/:id/:agentId`（Chat 页）。聊天区 vs 右侧面板（文件树/终端/云电脑同属一栏）接入 `ResizableSplit`。
- **实现**：
  - `src/components/ResizableSplit/index.tsx` 新增可选 `onResizeEnd?(leftPercent)` 回调（向后兼容，既有 4 个使用方不受影响）；
  - 新增 `src/utils/chatPanelWidthPreference.ts`：localStorage 键 `chat_panel_width_percent`，clamp 20~80，默认 40（与历史 CSS 固定比例一致）；
  - `src/pages/Chat/components/LeftContent/index.tsx` 的 `main-content-box` 改为 ResizableSplit：`minLeftWidth=430` / `minRightWidth=420` / `defaultLeftWidth=持久化值`；不传 `resetTrigger` → 关面板重开保持宽度；
  - 样式要点：`main-content-box` 的 `gap: 20px` 必须去掉（百分比宽 + gap 会溢出）。
- **微调**（`1dbaf19e0`）：拖拽分隔条居中间隔——聊天区 `padding-right:8px`(border-box) + 面板 `padding-left:8px`。注意 ResizableSplit 分隔条命中区仅 1px 宽（`::before` 只是视觉手柄），为共用样式，本轮未动。

## 二、智能体详情入口改悬浮弹窗（`faab43375` + `18aa4f06a`）

- 新增 `src/pages/Chat/components/AgentDetailModal`：antd Modal 居中（footer=null、限高滚动），内容与原 AgentSidebar 全量一致——复用 `AgentSidebar/AgentContent`（详情卡）+ `AgentConversation`（相关会话）+ 条件 `TimedTask`。
- 入口按钮（`icons-common-book` 图标）改为常显（弹窗打开时高亮），点击只开弹窗，**不再关闭文件树/终端/云电脑面板**。
- Chat 页 sidebar 链路全拆：AgentSidebar 挂载、`sidebarRef`、`isSidebarVisible`、全局 minWidth 1540 档位、`useExclusivePanels` sidebar 入参、5 处 no-op `close()`。
- **AgentSidebar 组件本体保留**：`ConversationDetails`（AgentDetails / OpenApp AppDetails 页）仍用侧栏形态，零影响；ChatTemp 无文件树，不涉及。

## 三、单栏风格（style3）滚动收敛（`9532a4ee2` + `f89ec305c` + `6d92a9442`）

需求：单栏下侧边面板（一级+二级菜单）固定（整栏收起仍含二级菜单，现状行为不变），滚动区域收敛到 page-container，消除窗口级全局滚动条。

三处根因三个修法：

| 根因 | 修法 | 提交 |
| --- | --- | --- |
| `page-container` 为 `overflow:hidden`，滚动散落各页内部容器 | `.page-container.xagi-nav-style3` 改 `overflow-y:auto / overflow-x:hidden`（覆盖 `overflow-hide` 工具类）；100% 高内部自滚的页面无感，溢出页面兜底在容器内滚 | `9532a4ee2` |
| Chat/EditAgent 往 `<html>` 写 `minWidth: 1660/1750px`（文件树/预览可见时），窄窗口出全局横向滚动条 | 两页 effect 检测 `body.xagi-nav-style3` 则置 unset 跳过 | `f89ec305c` |
| `global.less` 对 `html` 无条件 `min-width:1200px`（TODO 存量），窗口有效宽 <1200 时**任何页面**常驻全局横向滚动条 | `html[data-nav-style='sidebar']` 时 `min-width: 0` | `6d92a9442` |

## 四、覆盖范围页面清单

**单栏风格生效人群**：桌面端（Nuwax 客户端 webview）经 `isDesktopHost()` 锁定 style3；浏览器端默认值即 style3（`DEFAULT_THEME_CONFIG.NAVIGATION_STYLE`）且存量偏好已由 `navStyleMigration` 一次性迁移。生效标记 = `<html data-nav-style="sidebar">`（启动时全局写入，页面无关）。

| 改动 | 覆盖页面 |
| --- | --- |
| html 全局 min-width 豁免 | **所有路由**（含 /login、/verify-code、全屏工作台组） |
| page-container 滚动收敛 | 走根布局壳的全部主站页（/、/home、/home/chat、历史会话、空间/资料库/广场/系统管理）；**单栏桌面端**的全屏工作台六类页（workflow / agent(EditAgent) / app-dev / app-pro / app-dev-design / agent-dev）也走 page-container，同样覆盖 |
| Chat/EditAgent minWidth 跳过 | `/home/chat/:id/:agentId`、`/space/:spaceId/agent/:agentId` |
| 拖拽调宽 + 详情弹窗 | 仅 `/home/chat/:id/:agentId` |

**边界**：

1. 浏览器端进全屏工作台六类页走 `bare` 裸全屏形态（`fullscreen-page-container`，自管滚动），不在 page-container 滚动收敛内，但 html min-width 豁免依然覆盖；
2. 经典风格（style1/2，浏览器端手动切回才有）保留原 minWidth 行为；
3. 拖拽/弹窗未同步到 ChatTemp、ConversationDetails 的内联 LeftContent 拷贝（需求确认范围仅 Chat 页）。

## 五、验证

- `src/pages/Chat/index.test.tsx` 9/9 通过（新增「弹窗默认关闭、入口回调可打开」用例；AgentSidebar 深路径导入需整体 mock 新组件，否则绕过门面 mock 导致 CSS modules 崩）；ChatTemp 测试 2 失败为存量。
- 浏览器实测（dev :3000）：1252px / 1100px 窄窗口 + 文件树打开，窗口横/纵均无全局滚动；拖拽 min/max 钳制、localStorage 持久化、刷新恢复均过；详情弹窗与面板共存目检过。

## 六、遗留

- 打包客户端生效需**重建 dist + bump 外层 nuwax-client 仓 nuwax 子模块 pin**（CI 只消费 dist），本轮未做。
