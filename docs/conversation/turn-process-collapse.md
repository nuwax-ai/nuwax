# 普通会话轮次工作轨迹折叠（turn process collapse）

> 📚 文档总入口：[README.md](./README.md) · 日期：2026-08-30 · 分支：`feat/conversation-turn-process-collapse`（基于 `feat/conversation-ux-m1` / `cacf6f44d`）
>
> 需求链：`plans/20260830-nuwax-turn-process-collapse-intent.md` → `specs/nuwax-turn-process-collapse.md` → `plans/20260830-nuwax-turn-process-collapse-plan.md`（父仓 nuwaclaw）。

## 1. 背景与目标

一轮 USER 请求后，助手的思考、系统/上下文、中间说明、工具调用逐条平铺导致长页面难读。本功能把一轮的全部工作轨迹收进一个可折叠区（disclosure），最终 summary 始终常显在折叠区下方。

- 仅改普通会话默认渲染路径（`ChatContentArea` → `ChatView`）；`renderMessageItem` 自定义渲染路径、AppDev `ChatArea`、移动端、IPC/后端协议不变。
- 输入任务（USER 消息）保持独立展示，不进入折叠区。

## 2. 行为定义

### 轮次投影（`src/features/conversation/presentation/conversationTurnPresentation.ts`）

- 纯函数 `projectConversationTurns`：优先按 `requestId` 归组；缺失/不一致时以 USER 消息（`role === 'USER'`，运行时通行口径）作为轮次边界。历史回放与实时流式共用同一条路径。
- 最终 summary 首选非空 `finalResult.outputText`；否则取终态最后一条有效 CHAT/ANSWER 正文（`splitTerminalMarkdown` 拆分）。**永不使用**长期记忆字段 `ConversationInfo.summary`。
- 过程区 = 除 summary 外的全部内容（思考标签、工具标签、中间正文），按原顺序拼接。

### header 指标（`ProcessSummaryMetrics`）

| 指标 | 口径 |
| --- | --- |
| `N 次工具调用` | 按稳定 `executeId/toolCallId` 去重；Plan/Event 不计；聚合组开标签（`markdown-custom-process-group`）不计 |
| `M 条消息` | 思考块数 + 非工具可见正文（合并计 1）；不含 USER、summary、工具 |
| `已工作 T` | 优先整轮 `finalResult` 起止时间，其次 processing 最早/最晚；无效/倒序省略；运行中每秒更新，终态冻结 |

- 缺失指标单独省略；无工具时 header 以「执行过程」开头（`执行过程 · M 条消息`）。

### 折叠行为与可访问性（`src/components/ChatView/TurnProcessCollapse.tsx`）

- normal：运行中默认展开，终态默认收起；compact：均默认收起；detailed：均默认展开。三档均可手动切换，**用户手动展开态不被流式增量或终态补齐重置**。
- header 为原生 `<button>`：鼠标 / Enter / Space 可切换，带 `aria-expanded`、`aria-controls`、焦点样式与 `prefers-reduced-motion` 支持。
- 稳定 DOM 标记：容器 `data-testid="turn-process-collapse"`、按钮 `data-testid="turn-process-header"`（E2E 探针依赖）。
- 待回答的审批/ask 卡保持在折叠区外（pending 干预路径不受影响）；完成后的历史条目才进入轨迹。

## 3. 边界场景

- 纯文本终态（无过程）：不渲染折叠区，只有 summary。
- 无最终正文：不制造虚假 summary，展示既有错误/停止状态。
- 分页从半轮开始：只归组已加载消息，`requestId` 变化即切轮，滚动锚点不抖动。
- 重复/更新式工具事件（EXECUTING→FINISHED 同 id）：只计一次。

## 4. 测试与验收

| 层 | 命令 / 文件 | 覆盖 |
| --- | --- | --- |
| 纯函数 | `src/features/conversation/presentation/conversationTurnPresentation.test.ts` | 轮次边界、requestId 切分、summary 选择、工具去重（含聚合组标签不计）、纯文本终态 |
| 组件 | `src/components/ChatView/TurnProcessCollapse.test.tsx` | 三档密度默认态、header 三项指标文案、button 键盘交互 |
| 会话回归 | `npm run test:conversation` | 全量 35 文件 / 328 用例 |
| Mock E2E | `npm run e2e:mock-chat`（`COLLAPSE_SHOWCASE` / `TERMINAL_COLLAPSE` / `LONG_TASK_INTERLEAVED`，双轨） | header 三项指标、终态默认收起仅 summary 常显（收起高度 0）、展开后思考/工具/中间正文按原顺序完整、终端卡收起不漏全文、summary 不重复 |

手动验收走查：打开 `/mock-chat?scenario=COLLAPSE_SHOWCASE&speed=3&autoplay=1`，流式中过程默认展开、终态收起只留 summary；点 header 展开/收起；再用 `TERMINAL_COLLAPSE` 验证 header 计数。通用步骤见 [agent-session-rendering-acceptance.md](./agent-session-rendering-acceptance.md)。

### 既存失败基线（与本功能无关）

- `MarkdownRenderer/__tests__/utils.test.ts` 的 2 个 `replaceMathBracket` LaTeX 换行用例（基线即失败，不扩范围）。
- `useUnifiedChatScroll` 1 个程序滚动断言在部分环境失败（依赖面与本功能零交集）。

## 5. 已实现矩阵

| 行为点 | claude-code | nuwaxcode | Win | macOS | Linux |
| --- | --- | --- | --- | --- | --- |
| 轮次折叠投影 | 相同前端投影 | 相同前端投影 | Chromium 一致 | Chromium 一致 | Chromium 一致 |
| 工具计数去重 | 按归一化稳定调用 ID | 按归一化稳定调用 ID | 无平台差异 | 无平台差异 | 无平台差异 |
| 键盘与动画 | Enter/Space + reduced-motion | 同左 | 同左 | 同左 | 同左 |
| 自定义 renderer / AppDev | 不接投影，保持原状 | 同左 | — | — | — |

## 6. 关联修复

- `MarkdownRenderer/utils.ts` 过程标签 `name` 属性归一化：旧实现把 `name` 后的 `type/status` 等属性一并编码进 name，导致渲染层丢失过程类型与状态；现只替换 name 自身。这修复了既存失败基线中的标签编码用例。
