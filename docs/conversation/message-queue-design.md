# 会话待发送消息队列（MessageQueue）

## 当前契约

会话处于活跃态（`streamActive || taskExecuting`）时，用户在 `UnifiedChatSession` 发送的新提示词经 `useUnifiedChatQueue` → `useChatMessageQueue.trySend` 拦截进入待发送队列，在输入框上方由 `MessageQueuePanel` 渲染。

| 动作 | 行为契约 |
| --- | --- |
| 入队（`trySend`） | `enqueueBlocked = streamActive \|\| taskExecuting` 为 true 时入队，一并快照 `text`、`files`、`skillIds`、`selectedDocs`、`expertComponents`、`modelId`、`selectedAgentMode` |
| 自动消费（FIFO） | 仅在 `consumeBlocked`（`enqueueBlocked \|\| hasPendingIntervention`）由 true → false 的边沿触发，经过 `minConsumeInterval`（默认 1200ms，从阻塞解除时刻起算）弹出队首并回放完整快照；发出后置 `awaitingStreamEnd`，需经历完整 `active → idle` 周期才允许消费下一条（5s 看门狗防发送失败卡死） |
| 立即发送（`sendNow`） | **不依赖会话流式/任务/暂停状态**，点击后立即出队并调用 `sendMessage`（chat 接口），由后端承接排队；运行时会话层（`createConversationRuntimeSession`）走**方案 A**：同会话并发直发**不中断（不 abort）**上一轮在途 SSE 连接，按 `ownerMessageId` 隔离流式多段投影、单轮终态收敛与详情轮询乐观尾保留，上一轮工具调用/思考/正文正常流式收尾，新发轮次独立保持 `Loading` 占位直至后端轮转推流。同时置 `awaitingStreamEnd` 并清理待执行的消费定时器，防止与同轮自动消费叠加双发。会话停止中（`loadingStopConversation`）禁用该按钮，避免被会话层 `isStopping` 门禁静默丢弃 |
| 编辑（`handleEditQueued`） | 按 ID 出队并通过 `EVENT_NAMES.QUEUE_EDIT_MESSAGE` 向目标会话输入框回填完整快照（文本、附件、`skillIds`、`selectedDocs`、`expertComponents`、`modelId`、`selectedAgentMode`） |
| 删除 / 清空全部 | `deleteQueued` / `clearAllQueued` 移除后弹出 5s「撤销」提示（`queueUndoToast`），点击撤销按原下标顺序插回；切换会话自动关闭提示 |
| 拖拽排序（`reorder`） | 调整队列内顺序，自动消费按最新队首顺序执行 |
| 用户主动停止会话 | 调用 `pauseAutoConsume` 暂停自动消费；用户再次发送新提示词或点击「立即发送」时恢复 |

## 持久化与会话切换约束

- **按会话持久化**：`useMessageQueue(conversationId)` 以 `msg_queue:{conversationId}` 写入 `localStorage`（24h TTL）；附件入库时剥离 `response` 原始响应体。
- **切回/刷新默认暂停自动消费**：切换会话或刷新恢复出的非空队列默认置 `userPausedRef = true`，避免 TTL 内的陈旧消息在流式结束边沿被自动发出；用户点击「立即发送」或发送新消息后恢复自动消费。
- **干预态避让**：存在待处理 `hasPendingIntervention`（Ask / Permission 卡片）时暂停自动消费并隐藏队列面板，干预回复走 `rawSend` 绕过队列拦截。

## 核心代码入口

- `src/components/business-component/MessageQueue/useMessageQueue.ts` —— 队列状态与 `localStorage` 同步（`queueStorage.ts`）
- `src/components/business-component/MessageQueue/useChatMessageQueue.ts` —— 入队拦截、自动消费状态机、立即发送、删除/清空撤销
- `src/components/business-component/MessageQueue/useUnifiedChatQueue.ts` —— 结合 `selectQueueGate` 与编辑回填事件
- `src/components/business-component/MessageQueue/index.tsx` / `QueuedMessageItem.tsx` —— 队列面板与单条卡片 UI

## 待跟进事项（P1/P2）

- 输入框草稿 `@技能 / @文件 / @资料库` chip 结构化恢复与上传中附件跨会话保活
- 编辑器撤销栈到底后 `Ctrl/Cmd+Z` 链式撤销最近一次队列删除/清空
- 会话删除与退出登录时联动清理 `msg_queue:*` 与 `chat_draft:*`
