# #2461 共享面板实施与验收

日期：2026-09-26。基线 `7a9aa3081`；隔离分支 `codex/bugs-sandbox-layout-20260926`。

## 实现

- `ConversationPanelActions` 为 Chat 与 AppDevPro 提供同源的胶囊、详情、文件、终端、电脑按钮。
- `AgentDetailModal` 提升到业务组件，原 Chat 路径兼容转发。AppDevPro 胶囊直接消费 `ConversationProgressCapsule`，消息和执行态使用实际生效 runtime。
- `ResizableSplit` 复用 home/chat 分隔条。新增左侧保活隐藏、窄容器边界收敛、可配置上下排列。AppDevPro 聊天/工具区与文件树/预览区都可拖动。
- `FileTreeGitSourcePanel` 继续共用。关闭文件工作区保留搜索和挂载状态。
- `AppDevBottomConsole` 缩为数据适配，所有终端/日志 UI 来自 `ConversationBottomConsole`。普通会话仍不携带 appStage；开发/线上保留独立终端缓冲、按当前环境连接，父级容器状态接管时不重复 ensure。
- `AppDevRemoteDesktopPanel` 复用 `VncPreview`。应用 ID 只用于 app proxy URL，云端容器身份使用真实 conversationId 和 dev。选本机后关闭云面板。请求、重试、iframe 回调与终端启动均有配置/卸载失效保护。

## 自动与构建证据

- 完整会话门：102 文件、923 测试通过（随后补一项卸载后 ensure 迟到行为测试，定向 5/5 通过；合流后重新跑完整门）。
- 终端/VNC 定向：5 文件、10 测试通过，覆盖单终端契约、双环境保活、容器接管、迟到结果和代理会话身份。
- `lint:arch`：2898 模块、12699 依赖，零新违规；97 个既有违规按仓库基线忽略。
- TypeScript：基线与修改后均 544 条错误，标准化比较没有新增错误签名，修改路径无新增错误。
- development 构建通过。最终合流版本另跑构建与完整会话门。
- `git diff --check` 通过。

## 登录态浏览器证据

同一 Ego TaskSpace 22，运行真实当前 worktree 的 localhost:3000，使用测试环境已登录账号。截图位于 `/Users/apple/workspace/bug-batch-20260926/evidence/layout/`。

- 600/800px：页面 scrollWidth 等于 viewport；聊天与工具区上下排列，按钮可达。
- 1200px：实际鼠标拖拽使聊天宽度约 260→324px，页面无横向溢出。
- 应用 147：详情正确显示“全栈应用开发”；文件树显示真实目录；关闭/重开后搜索 `countdown` 保留；终端打开，复用控制台与实例。
- 应用 195：真实历史胶囊显示更改 +508/-80 与终端记录；打开详情不关闭胶囊。
- 普通 Chat 的共享详情另作真实页面复验。

## 质量三问

1. 内聚：面板入口、详情、终端及 VNC 逻辑各由一个业务组件维护；AppDevPro 只组合页面状态与应用数据适配。
2. 分层：公共业务组件不导入 pages；跨页适配行为测试放在 tests，架构门通过。
3. 维护：旧 Chat 详情入口与普通单终端契约保持兼容；双环境、迟到响应、隐藏保活有行为测试。独立 agent review 另记录具体结论。

## 当前限制

应用 147 原后端报 pending runtime operation；应用 195 的启动流返回非 SSE。已验证布局、共享组件、真实历史与失败反馈，未把终端 WebSocket/VNC 成功连接记为通过。需健康容器和真实客户端安装包补验。未部署、未推送、未修改禅道状态。
