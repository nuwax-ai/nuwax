# Agent 会话运行加载逻辑回归对齐文档

> 面向 PC 端智能体会话逻辑回归。本文把一次 agent 会话从页面加载、消息发送、SSE 流式合并、队列、权限审批、MCP ASK_QUESTION、resume 恢复到 suggest 展示的链路串成一份可核对文档。

## 1. 适用范围与关键入口

### 1.1 主要会话容器

当前通用会话 UI 收敛在 `UnifiedChatSession`：

- `src/components/business-component/UnifiedChatSession/index.tsx`
- `src/components/business-component/UnifiedChatSession/types.ts`

常见调用入口：

| 入口 | 数据源 | 说明 |
| --- | --- | --- |
| `src/pages/Chat/index.tsx` | `conversationInfo` model | 主聊天页；注入 sub 恢复、队列、intervention、suggest |
| `src/pages/ConversationAgent/AgentConversationChatPanel/index.tsx` | `conversationInfo` model | ConversationAgent 左侧主聊天；注入 sub 恢复 |
| `src/pages/SpacePluginTool/components/PluginChatSession/index.tsx` | `conversationInfo` model | 插件会话；注入 sub 恢复 |
| `src/pages/EditAgent/PreviewAndDebug/index.tsx` | `conversationInfo` model | 编辑/调试入口；注入 sub 恢复 |
| `src/pages/ConversationAgent/ConversationAgentChatSession/index.tsx` | `conversationAgent` model | ConversationAgent 预览/调试隔离会话；注入队列上下文与 intervention handlers，但当前未透传 sub 恢复 action |

### 1.2 两套 model

| model | 文件 | 用途 | 注意 |
| --- | --- | --- | --- |
| `conversationInfo` | `src/models/conversationInfo.ts` | 主会话全局状态；Chat、插件、编辑调试等复用 | 文件树、远程桌面、卡片、历史刷新逻辑都在这里 |
| `conversationAgent` | `src/models/conversationAgent.ts` | ConversationAgent 预览/调试隔离状态 | 避免和左侧主聊天串扰；核心流式处理与 `conversationInfo` 基本同构 |

## 2. 页面加载与历史恢复

### 2.1 正常加载

1. 页面拿到 `conversationId`。
2. 调用 `apiAgentConversation`，入口通常是 model 暴露的 `runQueryConversation` / `runAsync`。
3. 成功后写入：
   - `conversationInfo`
   - `currentConversationId`
   - `manualComponents`
   - `isSuggest`，由 `agent.openSuggest === Open` 决定
   - `messageList`
   - `chatSuggestList`
4. 对历史消息执行 `hydrateMcpAskInteractionsInMessageList`，把历史中的 MCP Ask 交互状态补齐。
5. 如果首屏有消息，`setIsMoreMessage(true)`，保证第一次上滑会再查历史。

### 2.2 初始 suggest 逻辑

加载历史时：

- 最后一条消息为 `MessageModeEnum.QUESTION` 且 `ext` 非空：用 `ext[].content` 做问题建议。
- 消息列表长度为 1：展示 agent 的 `guidQuestionDtos`。
- 没有消息：展示 agent 的 `guidQuestionDtos`。

会话运行结束后的 suggest 见第 8 节。

## 3. 用户发送消息主链路

### 3.1 UI 发送入口

`UnifiedChatSession` 内部把输入框发送统一代理到 `handleMessageSend`：

1. `handleMessageSend` 先调用 `messageQueue.resumeAutoConsume()`，解除用户主动停止后的队列消费暂停位。
2. 重置自动滚动到底部。
3. 调用 `messageQueue.trySend(...)`。

队列未拦截时，最终进入上层注入的 `onSendMessage`。

主聊天页 `Chat/index.tsx` 的发送参数由 `useChatConversation.handleMessageSend` 组装：

- `id`
- `messageInfo`
- `files`
- `selectedComponentList`
- `variableParams`
- `sandboxId`
- `skillIds`
- `modelId`
- `agentMode`

### 3.2 model 发送前置动作

`conversationInfo.onMessageSend` / `conversationAgent.onMessageSend` 做以下事情：

1. `handleClearSideEffect()`：
   - 中断 sub 恢复流 `abortResumeStream()`
   - 清空上一轮 SSE abort 句柄
   - 清空上一轮 suggest
   - 重置 `messageIdRef`
2. 乐观设置 `isConversationActive=true`，并记录 `lastSendAtRef`，避免发送后 3 秒内被中间态误置 false。
3. 生成用户消息和 assistant 占位消息：
   - 用户消息：`role=user`，带附件
   - assistant 占位：`role=assistant`，`status=Loading`
4. 把旧的 `Incomplete` 消息补成 `Complete` 或通过 `appendOutgoingConversationMessages` 追加，避免残留半截状态。
5. 组装 `ConversationChatParams`。
6. 调用 `handleConversation(...)` 建立 live SSE。

## 4. Live SSE 处理

### 4.1 连接器

会话使用：

- `src/utils/fetchEventSourceConversationInfo.ts`
- URL：`CONVERSATION_CONNECTION_URL`
- method：`POST`

连接器行为：

- `fetchEventSource` 发起请求。
- `onopen` 初始化 60 秒无消息超时检测。
- `onmessage` JSON parse 后回调业务。
- `subType === 'end_turn'` 或 `completed === true` 时延迟 200ms abort。
- `onclose` 和手动 abort 都通过 `safeOnClose` 防重复。

### 4.2 SSE 事件合并核心

核心函数：

- `conversationInfo.handleChangeMessageList`
- `conversationAgent.handleChangeMessageList`

所有 live chunk 和 sub resume chunk 都复用这个函数。

处理顺序：

1. 先尝试 `processInterventionSsePatch(res, currentMessage, list)`。
2. 如果是 intervention patch，直接更新消息上的交互字段，并执行 ACP 状态 reconcile。
3. 普通事件再按 `eventType` 处理：
   - `PROCESSING`
   - `MESSAGE`
   - `FINAL_RESULT`
   - `ERROR`
4. 最后统一：
   - `reconcileAcpPermissionStatusesInMessageList`
   - 更新全局 processing list
   - `checkConversationActive`
   - 写 `messageListRef`

### 4.3 PROCESSING

`PROCESSING` 主要更新工具/页面调用过程：

- 兜底把 `data.result.executeId` 提升到 `data.executeId`。
- 按 `executeId` 对 `processingList` 做更新或追加。
- `getCustomBlock` 把工具过程块写入 assistant 文本。
- 页面类型工具会打开页面预览或外链。
- TaskAgent 相关入口会刷新文件树、Git 列表或远程桌面。

### 4.4 MESSAGE

`MESSAGE` 按 `data.type` 分支：

- `THINK`：追加到 `currentMessage.think`，状态为 `Incomplete`。
- `QUESTION`：追加到 `currentMessage.text`；`finished=true` 时状态置空；`ext` 存在时同步 `chatSuggestList`。
- 其它普通文本：追加到 `text`；`finished=true` 置 `Complete`，否则 `Incomplete`。

工作流多段输出使用 `messageIdRef` 区分不同后端 message id；当新 id 且 `finished=true` 时，会插入新消息而不是替换当前占位。

### 4.5 FINAL_RESULT

`FINAL_RESULT` 是确定结束信号：

- 重置 `messageIdRef`。
- 用 `reconcileFinalMessageState` 合并最终的 `componentExecuteResults`，补齐 processing/intervention 终态。
- `status=Complete`，写入 `finalResult` 和 `requestId`。
- 若开启 suggest，调用 `/api/agent/conversation/chat/suggest`。
- `success=true` 时通过 `applyTerminalTaskStatus(..., COMPLETE)` 直接落终态，避免后端落库延迟导致本地长时间 `EXECUTING`。
- `success=false` 不靠错误文案猜终态，交给 `onClose` 后端轮询兜底。

### 4.6 onClose / onError

`onClose`：

- 打破 3 秒活跃保护。
- 把最后一条仍处于 `Loading/Incomplete` 的消息置为 `Stopped`。
- 把残留 `processingList.EXECUTING` 置为 `FAILED`。
- TaskAgent 场景调用 `syncTerminalConversationTaskStatus` 兜底同步后端终态。
- `disabledConversationActive()`。

`onError`：

- 当前 assistant 消息置为 `Error`。
- 残留 processing 执行态置为 `FAILED`。
- 立即结束活跃态。
- 队列自动消费会因最后一条 `Error` 暂停。

## 5. 消息队列逻辑

### 5.1 核心文件

- `src/components/business-component/MessageQueue/useUnifiedChatQueue.ts`
- `src/components/business-component/MessageQueue/useChatMessageQueue.ts`
- `src/components/business-component/MessageQueue/useMessageQueue.ts`
- `src/components/business-component/MessageQueue/queueStorage.ts`

### 5.2 入队条件

`useUnifiedChatQueue` 计算：

- `streamActive = queueContext.streamActive ?? conversationInfo.isConversationActive || isSessionStreamBusy(messageList)`
- `taskExecuting = queueContext.taskExecuting ?? conversationInfo.taskStatus === EXECUTING`
- `isEnqueueBlocked = streamActive || taskExecuting`

当 `isEnqueueBlocked=true` 时，用户输入不直接发送，而是入队。

入队会快照：

- 文本
- 附件
- `skillIds`
- `modelId`
- `selectedAgentMode`

### 5.3 消费阻塞条件

自动消费阻塞条件：

- 流式活跃
- 后台任务执行中
- 有未处理 intervention
- 用户主动停止后 `userPausedRef=true`
- 最后一条消息为 `Error`

也就是：`consumeBlocked = enqueueBlocked || hasPendingIntervention`，再叠加暂停位和错误暂停。

### 5.4 自动消费

当 `consumeBlocked` 从 true 变 false 且队列非空：

1. 记录阻塞解除时间 `blockReleasedAtRef`。
2. 等待 `minConsumeInterval`，默认 1200ms。
3. 再次确认没有 stream/task/intervention。
4. `dequeueFirst()`。
5. 调用真实 `sendMessage(...)`，并回放入队快照。

### 5.5 立即发送

用户点击队列项“立即发送”：

1. `markSending(qMsg.id)`，该项显示 loading，不立刻出队。
2. 如果有 `conversationId`，调用 `runStopConversation(conversationId)`。
3. 调用 `scheduleAutoConsume()`。
4. 真正消费时，`dequeueFirst()` 优先取 `sending` 项，无论它在队列中的位置。

### 5.6 持久化

队列按 `msg_queue:${conversationId}` 存 localStorage：

- TTL 24 小时。
- 恢复时过滤非法结构和过期项。
- `sending` 运行态不入库，刷新后不保留 loading 态。
- 切换会话用 `useLayoutEffect` 同步加载，避免短暂误用上一会话队列。

## 6. 权限审批与 ASK_QUESTION

### 6.1 intervention 数据如何进入消息

入口：

- `processInterventionSsePatch`
- `applyAcpPermissionSseEvent`
- `applyMcpAskToolCallSseEvent`

这一步发生在 `handleChangeMessageList` 的最前面，优先于普通 PROCESSING/MESSAGE 处理。

### 6.2 ACP 权限审批

ACP 事件识别来源：

- `eventType === ACP_REQUEST_PERMISSION`
- ACP 标准 envelope
- `PROCESSING + subEventType=REQUEST_PERMISSION`
- `Backend.Sandbox.Event.RequestPermission`
- `request_permission_request`

识别后写入当前 assistant 消息：

- `acpPermissionInteractions[]`
- `responseStatus='pending'`
- `triggeredAt`
- assistant `status=Loading`

用户选择后：

1. `useAgentInterventionHandlers.respondAcpPermission` 把状态置为 `submitting`。
2. 调 `/api/agent/conversation/chat/permission-request/response`。
3. 成功置 `submitted`。
4. `not found/already resolved/gone` 等幂等错误也视为 `submitted`。
5. 其它失败置 `failed`，展示统一 toast。

### 6.3 MCP ASK_QUESTION

ASK_QUESTION 不是单独渲染的普通消息，而是作为 intervention 写入当前 assistant 消息。

识别来源包括：

- ToolCall 类事件
- `PROCESSING` 中带 `result.input`
- `PROCESSING + subEventType=ASK_QUESTION`

特别注意：`subEventType=ASK_QUESTION` 的数据在 `result.data` 中，不一定遵循普通 ToolCall 的 `result.input` 结构。

识别后写入：

- `mcpAskInteractions[]`
- `input.requestId`
- `toolCallId`
- `executeId`
- `responseStatus='pending'`
- `triggeredAt`

### 6.4 Dock 队列

`useActiveInterventionQueue(messageList)` 从整个消息列表收集未处理项：

- ACP：`responseStatus` 为 `pending/submitting`
- MCP Ask：`responseStatus` 为 `pending/submitting`，且没有匹配的 resume 用户消息
- ACP 中若 rawInput 本身就是 ask，会抑制同 requestId/toolCallId 的 MCP Ask，避免重复弹卡
- 按 `triggeredAt/createdAt` FIFO 排序

`UnifiedChatSession` 中只要有 active intervention：

- 队列消息面板隐藏
- 消息队列自动消费暂停
- DockPanel 显示最早待处理项

### 6.5 MCP Ask 的 resume 发送

用户提交/取消/跳过/超时后：

1. `respondMcpAsk` 更新 interaction 的 `responseStatus`。
2. `buildMcpAskResumeMessage` 生成一条用户消息文本。
3. 文件上传字段会随 payload files 作为附件发送。
4. `useAgentInterventionLayer.handleRespondMcpAsk` 调 `onSendMessage(resume.text, resume.files)`。
5. `UnifiedChatSession` 传给 intervention 的 `onSendMessage` 是 `messageQueue.rawSend`，绕过队列拦截，避免 resume 被错误排队。

当前生成的 resume 消息没有写入 requestId HTML marker；历史匹配主要依靠多语言签名、同 title 顺序配对和旧 JSON marker 兼容。

## 7. 消息 resume 恢复

### 7.1 恢复目标

刷新页面、新开标签、或别处触发同一会话继续执行时，用 `/api/agent/conversation/chat/sub/:conversationId` 重建正在执行的 assistant 输出。

专题文档见：`docs/conversation-stream-resume-and-intervention.md`。

### 7.2 编排 hook

`src/components/business-component/UnifiedChatSession/hooks/useConversationStreamResume.ts`

触发条件：

```text
ready = !!conversationId && !isLocallyStreaming && !isResumeSubscribed && !!resumeStream
```

其中：

- `isLocallyStreaming` 必须是纯本地 live SSE 活跃，不包含 `taskStatus===EXECUTING`。
- `resumeStream` 未注入时，恢复整体不启用。

### 7.3 恢复流程

1. 轮询 `fetchConversationTaskStatus(conversationId)`。
2. 发现 `EXECUTING` 且没有本地流式。
3. 同一会话本地流式刚结束 5 秒内跳过，避免重复重放刚完成的输出。
4. 标记 `isResumeSubscribed=true`，立即停轮询。
5. 先 `reloadHistoryAsync(conversationId)`，补齐别的页签发送的用户消息。
6. 调 `resumeStream(id, list, onClose)`。
7. sub 关闭后恢复轮询，刷新历史，并发 `RefreshConversationList`。

### 7.4 sub handlers

`src/hooks/useResumeStreamHandlers.ts`

职责：

- 使用独立 `resumeAbortRef`，不和 live SSE 共用 abort 句柄。
- 开流前 `resetResumeMessageState()`，清空 `messageIdRef`。
- 始终追加一个本次恢复专用 assistant 空占位，不复用历史旧 Incomplete。
- 每个 sub chunk 复用 `handleChangeMessageList({ conversationId }, res, currentMessageId)`。
- `ERROR` 时主动 abort，让轮询恢复。
- 关闭时再次 reset，避免恢复流残留影响后续 live 发送。

## 8. suggest 展示与请求

### 8.1 请求时机

`FINAL_RESULT` 时，如果 `isSuggest.current=true`：

- `conversationInfo` 直接调用 `runChatSuggest(params)`。
- `conversationAgent` 额外使用 `suggestGenerationRef/pendingSuggestGenerationRef` 丢弃过期 suggest 响应。

接口：

- `/api/agent/conversation/chat/suggest`

### 8.2 展示条件

`UnifiedChatSession.shouldShowSessionSuggest`：

- `messageList` 非空
- 队列为空
- `isConversationActive=false`

因此：

- 队列未清空时不展示上一轮 suggest。
- 新一轮自动消费开始后不展示旧 suggest。

## 9. 终态同步与活跃态

### 9.1 活跃态来源

UI 层通常传：

```text
isConversationActive = model.isConversationActive || conversationInfo.taskStatus === EXECUTING
isLocallyStreaming = model.isConversationActive
```

队列和停止按钮需要知道后台任务执行中；sub 恢复不能把 `EXECUTING` 混入 `isLocallyStreaming`，否则会阻止恢复。

### 9.2 `isSessionStreamBusy`

`src/hooks/useExecutingTaskStatusPoll.ts`

判断：

- 最后一条消息 `status=Loading/Incomplete`
- 最近 5 条消息中存在 `processingList.status=EXECUTING`

这是 model 活跃态的兜底，避免 chunk 间状态短暂为空导致队列误消费。

### 9.3 taskStatus 写回

`src/utils/conversationTaskStatusSync.ts`

原则：

- 只写终态，不写 `EXECUTING`。
- `FINAL_RESULT success=true` 直接落 `COMPLETE`。
- `onClose` / `ChatFinished` 再查后端兜底。
- 会话 id 不匹配不写，避免切会话覆盖。

## 10. 高风险点与可能问题

### 10.1 ConversationAgent 预览隔离会话未启用 sub 恢复

`useConversationAgentChatSession` 返回给 `UnifiedChatSession` 的 props 当前没有包含：

- `onResumeConversationStream`
- `onAbortResumeStream`
- `onReloadConversationHistoryAsync`
- `onTerminalTaskStatus`

结果：预览/调试隔离会话刷新或新开标签时，即使 `conversationAgent` model 内已有 `resumeConversationStream` 能力，`UnifiedChatSession` 不会启动恢复轮询。

回归时要确认这是产品预期，还是遗漏。

### 10.2 `conversationInfo` 与 `conversationAgent` 逻辑漂移

两套 model 的 `handleChangeMessageList`、`handleConversation`、`onMessageSend` 高度相似但不是同一份实现。

已知差异：

- `conversationAgent` suggest 有 generation 防过期，`conversationInfo` 没有。
- `conversationInfo` 包含更多文件树、远程桌面、卡片和主题更新逻辑。

风险：修一套流式/intervention bug 时另一套漏改。

### 10.3 MCP Ask resume requestId marker 未写入

`mcpAskResumeMessage.ts` 提供了 `buildMcpAskRequestIdMarker` 和 marker 识别，但 `buildMcpAskResumeMessage` 当前返回文本未附加 marker。

现有同 title 多次询问靠顺序配对兜底，已有专门处理；但在乱序历史、跨语言、用户编辑 resume 文本等情况下，仍比 requestId marker 脆弱。

### 10.4 `sendNow` 与 stop 后终态竞态

“立即发送”会先 `runStopConversation`，再等待阻塞解除后消费 sending 项。

风险场景：

- stop 接口成功但 live/sub onClose 晚到。
- 后端 taskStatus 落库仍为 `EXECUTING`。
- 最后一条消息被置为 `Stopped`，但 `processingList` 没完全失败。

这些都会让自动消费继续被 `streamActive/taskExecuting` 卡住。回归时要覆盖 stop 后下一条是否最终发出。

### 10.5 `onClose` 把 Loading 置为 Stopped 可能覆盖正常完成边界

SSE completed 后会延迟 abort，`FINAL_RESULT` 应先把消息置为 `Complete`。

风险：如果后端没有发 `FINAL_RESULT` 但直接断流，前端会把末条置 `Stopped`；这是兜底行为，但用户看到的状态可能不像失败。需要结合后端协议确认是否允许无 final result 正常关闭。

### 10.6 suggest 过期响应

`conversationAgent` 已用 generation 丢弃旧响应；`conversationInfo` 目前没有同样保护。

风险：快速清空、切会话、队列自动发送下一条时，上一轮 suggest 响应可能晚到并覆盖当前建议。UI 展示层会在活跃/队列非空时隐藏，但 state 仍可能被覆盖。

### 10.7 队列持久化恢复后的自动消费

队列 localStorage TTL 为 24 小时；刷新后如果会话空闲且队列仍有消息，等阻塞释放逻辑触发才消费。

需要确认：

- 空闲会话刷新后是否应该自动发出旧队列。
- 用户是否有足够视觉提示知道存在待发送消息。

### 10.8 sub 恢复占位无 `index`

恢复流追加的 assistant 占位没有 `index`。大部分渲染使用数组顺序没问题，但任何按 `index ?? 0` 排序的逻辑可能把它排到前面。

当前 intervention 队列里已有按 `triggeredAt` 排序的兜底，仍建议回归涉及历史 + 恢复 + intervention 的混合场景。

### 10.9 全局 SSE 超时定时器共享

`fetchEventSourceConversationInfo.ts` 有共享超时 timer owner，创建新连接会清理旧共享 timer。

风险：如果同页面存在 live 和 sub 或多个会话源并行，误清 timer 可能影响另一条连接的超时检测。当前设计通过 active owner 降低风险，但并行连接场景要重点回归。

### 10.10 intervention 会阻塞消息队列消费

这是设计行为。风险是干预卡片如果因解析/reconcile 失败一直 pending，会导致队列永远不自动消费。

回归时要验证：

- ACP 成功/取消后关闭。
- ACP 幂等错误后关闭。
- MCP Ask submit/cancel/skip 后关闭。
- 同 title ASK_QUESTION 连续出现时第二次仍能弹出。

## 11. 建议回归清单

### 11.1 基础发送与流式

- 发送普通消息：用户消息 + assistant Loading 占位立即出现。
- THINK chunk 追加到思考区，不污染正文。
- MESSAGE chunk 按顺序拼接，`finished=true` 后状态正确。
- PROCESSING 工具块按 `executeId` 去重更新。
- FINAL_RESULT 后状态为 Complete，processing 执行态不残留。
- SSE error 后末条为 Error，processing 执行态转 Failed。

### 11.2 队列

- 流式中发送第二条：进入队列，不触发真实发送。
- 后台 `taskStatus=EXECUTING` 但没有流式时发送：进入队列。
- 第一轮结束后，等待最小间隔自动消费队首。
- 最后一条 Error 时不自动消费。
- 主动停止后队列不自动消费；用户再次发送后恢复。
- 立即发送：目标项 loading，stop 当前会话，阻塞解除后优先消费该项。
- 编辑队列项：出队并回填输入框，且不串到另一个会话实例。
- 切会话：加载各自 localStorage 队列。

### 11.3 ACP 权限审批

- `REQUEST_PERMISSION` 到达后 Dock 弹出。
- 多个审批 FIFO 展示，只有 front 可交互。
- approve/cancel 成功后卡片关闭。
- permission already resolved/not found 视为 submitted。
- failed 不阻塞后续审批。
- sub 从头重放已审批事件时，不重新卡住 Dock。

### 11.4 MCP ASK_QUESTION

- `PROCESSING + subEventType=ASK_QUESTION` 能解析为 `mcpAskInteractions`。
- submit 生成 resume 用户消息并继续会话。
- cancel/skip/timeout 生成对应 resume 文本。
- resume 发送绕过普通消息队列。
- 同 title 连续两次 ask：第一次回答后第二次仍弹 Dock。
- ACP rawInput 指向 ask 时，不重复弹 MCP Ask。

### 11.5 resume 恢复

- 刷新 EXECUTING 会话：先 reload 历史，用户消息不丢。
- sub 输出写入新 assistant 占位。
- 本地 live 刚结束 5 秒内不重复订阅 sub。
- 切会话过程中旧 sub onClose 不覆盖新会话。
- sub ERROR 后恢复轮询。
- sub 完成后刷新历史与会话列表状态。

### 11.6 suggest

- agent 开启 suggest 时 FINAL_RESULT 后请求建议。
- 队列非空时不展示 suggest。
- 新一轮流式活跃时不展示旧 suggest。
- 快速连续发送/切会话时，不应出现上一会话 suggest 覆盖当前展示。

## 12. 相关专题文档

- `docs/conversation-stream-resume-and-intervention.md`
- `docs/message-queue-design.md`
- `docs/ch/SSE-Implementation-Guide.md`
