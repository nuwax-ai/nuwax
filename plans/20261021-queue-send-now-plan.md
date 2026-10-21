# 实施计划：队列「立即发送」直连 chat 接口 + 队列遗漏问题盘点

- 状态：**已完成（P0，2026-10-21）**。默认决议：只改立即发送；方案 B（保留 abort，不动 runtime/model）；Part B 完成 P0 一批（持久化接线、编辑回填完整快照、删除/清空 5s 撤销提示），`test:conversation`（115 文件 / 1186 用例）与 `lint:arch` 全绿。
- 需求级别：中等（只出 plan 一件；涉及会话域，`pnpm run test:conversation` 必跑）

---

## 1. 现状（已核对代码）

队列链路：`UnifiedChatSession.handleMessageSend` → `useChatMessageQueue.trySend`（入队判定 `streamActive || taskExecuting`）→ 自动消费 effect（仅 `consumeBlocked` true→false 边沿）。

「立即发送」当前行为（[useChatMessageQueue.ts](file:///Users/apple/workspace/nuwax/src/components/business-component/MessageQueue/useChatMessageQueue.ts) `sendNow`）：

1. `userPausedRef=false` → `markSending(id)`（该条显示 loading）
2. `scheduleAutoConsume()`：`canAttemptConsume` 要求 **不 paused、流式/任务空闲、无 intervention、无 awaitingStreamEnd**，否则只是「标记优先」，等本轮结束后由边沿触发
3. 实际发送在 `consumeTimer` 里经 `dequeueFirst`（优先取 `sending` 项）发出

即：**前端用会话状态决定「这条现在能不能发」**——这正是要拿掉的部分。

### 与「直接调 chat」冲突的两个现有行为（方案关键）

| 位置 | 现状 | 对「忙碌时直调 chat」的影响 |
| --- | --- | --- |
| [`createConversationRuntimeSession.send`](file:///Users/apple/workspace/nuwax/src/features/conversation/runtime/createConversationRuntimeSession.ts#L466-L473)（V2 新线）与 [`conversationInfo.onMessageSend → handleClearSideEffect`](file:///Users/apple/workspace/nuwax/src/models/conversationInfo.ts#L1972-L2002)（旧线） | 每次发送都**先 abort 上一条 SSE、重置流式投影** | 忙碌时直调会把正在流式的那一轮在前端切断；旧轮末条被 `onClose` 的「被取代」分支置为 `Stopped`，实际后端仍在跑 |
| 同上 | `send` / `onMessageSend` 在 `isStopping` / `isStopPending()` 时**静默 return** | 若 `sendNow` 已把队列项移除再调用，会**丢消息** |

---

## 2. 待你确认的后端契约（决定方案 A/B）

这些前端无法自证，建议先确认再实现：

1. **chat 接口在会话忙碌时的语义**：新请求是 (a) 挂起，等轮到它才开始推 SSE；还是 (b) 立刻返回「已入队」并结束？
2. **客户端断开旧 SSE 是否取消后端任务？** 现有设计（独立 stop 接口 + sub 恢复）暗示不取消，请确认。
3. 后端队列的**可见性**：前端能否从会话详情/消息里看到「排队中」的用户消息？（影响刷新后的展示与去重）
4. 「停止」是否同时清空后端排队？（影响 `pauseAutoConsume` 与前端剩余队列的口径）
5. **范围**：是否只改「点击立即发送」；其余队列项的自动消费（FIFO 逐条、排序、编辑、删除）仍由前端驱动？本计划**按「只改立即发送」写**——后端队列里的消息前端无法再编辑/删除/排序，所以不建议把自动消费也交给后端。

---

## 3. Part A：立即发送直连 chat（按「契约 = 挂起排队 + 断开不取消」假设）

### 行为目标

`sendNow(qMsg)`：不再看 streamActive / taskExecuting / awaitingStreamEnd / userPaused，直接用入队快照参数调 `dispatchMessage`，由后端排队。

### 改动文件清单

| # | 文件 | 动作 | 说明 |
| --- | --- | --- | --- |
| 1 | `MessageQueue/useChatMessageQueue.ts` | 改 | `sendNow` 直发：`resumeAutoConsume` → `markSending` → `dispatchMessage(快照…)` → 出队；删除 `dequeueFirst` 对 `sending` 项的优先逻辑依赖 |
| 2 | `MessageQueue/useMessageQueue.ts` | 改 | `dequeueFirst` 去掉 `sending` 优先分支（无调用方后成死代码）；`markSending` 视最终交互决定是否保留 |
| 3 | `MessageQueue/useChatMessageQueue.ts` | 改 | 直发后调用 `markAwaitingStreamEnd`，防止同轮自动消费与直发叠加双发 |
| 4 | `features/conversation/runtime/createConversationRuntimeSession.ts` | 改（**需契约确认**） | 忙碌态 send 不 abort 上一条连接；上一轮的 `onClose` 不再置 `Stopped` |
| 5 | `models/conversationInfo.ts`（旧线） | 改（同上） | `onMessageSend` 在已有活跃流时不走 `handleClearSideEffect` 的 abort |
| 6 | `MessageQueue/QueuedMessageItem.tsx` | 改 | `isStopping` 时「立即发送」按钮禁用，避免静默丢弃 |
| 7 | `docs/conversation/message-queue-design.md` | 改 | 该文档与现状严重脱节（仍写「立即发送=先停止再发」「纯内存」），按新契约重写 |

> 4/5 是风险最高的两处：它们改变「同会话同时只有一条活跃 SSE」的前提。若后端只对「最新请求」推流，可以走**更小方案 B**：保留 abort，旧轮内容靠现有 `useConversationStreamResume`（sub 恢复）+ 详情轮询补齐，不动 4/5，只把旧轮 `Stopped` 误标修掉。**待第 2 节问题 1/2 答复后二选一。**

### 关键细节

- **不先出队再发**：`dispatchMessage` 返回 void、无受理回执。受理失败的兜底：`isStopping` 时禁用按钮（#6）；其余失败走现有 `console.error` + 该条保留 `sending` 态由用户重试——避免「出队即丢」。（自动消费路径存在同样的静默丢弃，列入第 4 节遗漏项）
- **`hasPendingIntervention`**：队列面板在该态隐藏，`sendNow` 天然不可达，不额外处理。
- 直发后 `awaitingStreamEnd` 保持到流 active→idle 一个完整周期，剩余队列项仍由现有边沿触发消费。

### 证明成立的测试

- 新增（仅此一项，守「并发取消/竞态」类路径）：`useChatMessageQueue` 的 `sendNow` —— 忙碌态不经 gate 直发一次且不重复；`isStopping` 不丢项。当前仓库**没有**队列单测。
- 回归：`pnpm run test:conversation`；改变会话行为，合入前过 `e2e:mock-chat`（mock 场景：流式中点「立即发送」）。

---

## 4. Part B：前端消息队列遗漏问题盘点

### 4.1 队列本身的持久化是「死接线」（P0，实为 bug）

- `queueStorage.ts` / `useMessageQueue(conversationId)` 已实现按会话 `localStorage` 持久化（commit d61c5585e9）。
- 但 `useChatMessageQueue` 里调用的是 **`useMessageQueue()`（不传 conversationId）**，且 `useEffect([conversationId])` 会在 **挂载与切换会话时 `clearQueue()`**。
- 结果：**切换会话 / 刷新，队列必丢**；持久化代码从未生效。
- 建议：传入 `conversationId`、去掉切换时的 `clearQueue`（改为只清理运行态定时器与 ref）；恢复出来的项**默认不自动发送**（TTL 内的旧消息被边沿触发误消费风险），展示为「已暂停」，需用户点「立即发送」或「全部继续」。
- 持久化的附件只保留服务端元数据（复用草稿的 `normalizeDraftFiles`），不存本地 `File`。

### 4.2 输入框草稿（你提的第 1 点）

**已有**：[ChatInputUnified](file:///Users/apple/workspace/nuwax/src/components/business-component/ChatInputUnified/index.tsx#L1064-L1172) 按 `surface:conversationId` 存 `chat_draft:*`，1s 节流 + 卸载兜底，24h TTL，已上传附件（含图片的 `url/key/宽高`）恢复为 `done`。

**缺口**：

| # | 缺口 | 现状证据 | 建议 |
| --- | --- | --- | --- |
| 1 | `@技能 / @文件 / @资料库 / 专家` chip 不随草稿恢复，且纯文本落盘时 chip 文字被剥离 | `draftTextRef` 用 `getPlainText`；切换会话时 `setSkillIds([])` | 草稿增加 `mentions` 结构化字段，`MentionEditor` 提供「按结构重建 chip」入口（P1） |
| 2 | **上传中的附件**切走即丢 | 草稿只含 `status=done`；卸载 effect `setUploadFiles([])`，上传完成回调写已卸载组件 | 上传 Promise 提升到按 scope 的草稿 store，完成后直接写入该会话草稿（P1）；最小版：切走时 toast 提示未完成附件被丢弃 |
| 3 | 上传失败/重试状态不保留 | 非 done 一律不入草稿 | 不做（恢复后用户重新上传更直观） |
| 4 | 草稿与登录用户无关 | key 为 `chat_draft:{surface}:{id}`，无 userId | 退出登录/切账号时按前缀清空（P1，隐私） |
| 5 | 模型 / 智能体模式不随草稿 | 仅队列快照带 `modelId/agentMode` | 可选，随草稿存（P2） |
| 6 | 无过期主动清理 | TTL 仅在 `loadDraft` 时惰性判断，不读取的 key 永久残留 | 应用启动时一次性扫描前缀清理（P2） |
| 7 | 队列「编辑」回填丢失快照 | `useUnifiedChatQueue.handleEditQueued` 只 emit `text/files/conversationId`；而输入框监听器读取 `skillIds/modelId/agentMode`；`selectedDocs/expertComponents` 两端都没有 | 统一事件 payload（含全部快照字段）；技能需同 #1 以 chip 形式回填，否则会被 mention 派生 effect 覆盖（P0，与 4.1 同批） |

另：旧输入框 `ChatInputHome` 无草稿；是否纳入取决于它是否仍有会话入口，**默认不改**。

### 4.3 清除与撤回策略（你提的第 2 点）

**现状**

- 编辑器内 Ctrl/Cmd+Z/Y：`MentionEditor` 自带 innerHTML 快照栈（100 步），**`clear()` 会 `resetUndoStack('')`**——即发送后 Ctrl+Z 恢复不了已发内容（建议保持，这是合理语义）。
- 队列的破坏性操作**全部不可撤回**：单条删除 `×`、「全部清空」（无二次确认）、切换会话（上述 4.1 的清空）、「编辑」把内容挪进输入框后用户再清空即丢。
- 清理时机不成体系：草稿在「发送 / 会话删除（`invalidateConversation`）」时清；队列 key `msg_queue:*` **不在 `invalidateConversation` 的清理范围内**，删会话后会残留。

**建议策略（请拍板范围）**

| 层 | 策略 | 优先级 |
| --- | --- | --- |
| 队列单条删除 / 全部清空 | 操作后 5s「撤销」toast（内存保留被删项及原位置），超时才真删持久化 | P0 |
| Ctrl/Cmd+Z 对队列 | 编辑器自身撤销栈走到栈底（`undoIndex=0`）后，再按 Ctrl+Z 兜底撤销**最近一次队列删除/清空**；编辑器内仍优先文本撤销，避免抢键 | P1（需你确认是否接受这种「链式」撤销） |
| 全部清空 | 数量 ≥2 时二次确认，或仅依赖撤销 toast（二选一） | P0 |
| 「编辑」回填 | 回填成功才出队；回填前输入框已有内容时，不覆盖（现为换行追加，保持） | P0（随 4.2-#7） |
| 清理时机 | 删会话时同时清 `msg_queue:{id}`；退出登录清 `msg_queue:* / chat_draft:*`；启动时清过期 key | P1 |
| 队列 TTL | 现 24h 与草稿一致，保持 | — |

---

## 5. 实施顺序（建议分期）

1. **P0 一批**（同一批合入，可独立验证）：Part A（方案 B 最小版或 A，视第 2 节答复）+ 4.1 队列持久化接线 + 4.2-#7 编辑回填快照 + 删除/清空撤销 toast
2. **P1**：chip 结构化草稿、上传中附件、Ctrl+Z 链式撤销、退出登录/删会话清理
3. **P2**：模型/模式随草稿、过期 key 扫描

> Part A 与 4.1 都改 `useChatMessageQueue`，同一 PR 内顺序：先 4.1（接线+去 clear）、再 Part A，避免互相冲突。

## 6. 风险与回退

| 风险 | 缓解 | 回退方式 |
| --- | --- | --- |
| 方案 A 取消 abort，导致同会话多路 SSE 事件交叉写同一消息列表 | 依赖 run 所有权（`connectionRunController`）按 runId 门禁；先走方案 B | revert #4/#5，保留 abort |
| 恢复出的持久化队列被误自动发送 | 恢复项默认「已暂停」，不参与边沿消费 | 关闭 `useMessageQueue` 的 conversationId 传参 |
| 撤销 toast 期间会话切走 | 切走视为确认删除（落盘） | — |
| 后端挂起语义与假设不符 | 先答复第 2 节，再动 #4/#5 | — |

## 7. 需要你回复的点

1. 第 2 节 1–4（后端契约），尤其是「新 chat 在忙碌时的响应」与「断开旧 SSE 是否取消任务」→ 决定方案 A / B。
2. 范围：是否按「只改立即发送」；Part B 哪些进本次（建议 P0 一批）。
3. Ctrl+Z 链式撤销队列删除，是否接受。
