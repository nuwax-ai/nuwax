# 会话终态收敛修复——代码实现总结

> 对象：按钮卡「会话中」的完整修复链。按代码文件组织，每个改动标注"改了什么/为什么/怎么验证"。分支：feat-2026.7.31（1.1.21）／已同步 dual-track。

---

## 1. 核心新增文件

### 1.1 `src/hooks/useConversationTerminalFinalizer.ts`（新增）

统一终态清算 hook，两个 model 共用。

**返回三个入口：**

```ts
const {
  finalizeConversationTerminal,
  finalizeChatTerminalEvent,
  finalizeStreamingPlaceholder,
} = useConversationTerminalFinalizer({
  source: 'conversationInfo', // 或 'conversationAgent'（预览 Tab）
  conversationInfoRef, // 防跨会话守卫
  lastSendAtRef, // 3s 发送保活
  setConversationInfo, // 写 taskStatus
  setMessageList, // 清末条消息 + processing
  messageListRef, // rAF 读取路径同步
  setIsAwaitingChatTerminal, // 清 awaiting（恢复轮询资格）
  setIsConversationActive, // 清活跃态（按钮主信号）
});
```

**finalizeConversationTerminal(cid, status, origin?)**

- 终态枚举入口（轮询快照路径）
- 防跨会话守卫：旧会话的迟到终态不误清当前会话
- 调用 sweepConversationTerminal 执行四步收敛

**finalizeChatTerminalEvent(cid, res)**

- SSE 终态事件入口（chat onMessage + sub onTerminalEvent）
- **事件类型白名单**：只处理 `FINAL_RESULT` 和 `ERROR`，其他（PROCESSING/MESSAGE/HEART_BEAT）直接 return
- `ERROR → TaskStatus.FAILED`，`FINAL_RESULT → resolveTerminalTaskStatus(...)` 解析结构化终态
- 「任务冲突」型 FINAL_RESULT 解析不出终态 → 自动跳过

**finalizeStreamingPlaceholder(messageId, outcome)**

- sub 流死亡后的占位收尾
- `stopped`：占位落 Stopped，taskStatus 不动
- `error`：占位落 Error + taskStatus 落 FAILED + 侧栏同步
- rAF 重算活跃态：busy = isSessionStreamBusy(messageListRef.current)

**sweepConversationTerminal 内部（四步收敛）：**

```ts
// 1. taskStatus 终态写回（幂等，含防跨会话守卫）
applyTerminalTaskStatus(setConversationInfo, cid, taskStatus);

// 2. 清 awaiting（恢复轮询资格 isPollingReady）
setIsAwaitingChatTerminal(false);

// 3. 破 3s 发送保活 + 清活跃态（按钮主信号）
lastSendAtRef.current = 0;
setIsConversationActive(false);

// 4. 末条消息 + 当前轮次 EXECUTING processing 收敛
//    范围：findCurrentRoundStart(prev) 到末尾
//    末条：status Loading/Incomplete → Complete/Error
//    当前轮所有消息：processingList EXECUTING → FINISHED/FAILED
setMessageList((prev) => { ... });
```

**观测：** `createAlwaysLogger('[Conv:Terminal]')`，`finalize terminal` 日志含 origin 字段。

---

### 1.2 `src/models/conversationInfoMessageList.ts` → 新增两个共享函数

**`findCurrentRoundStart(messageList)`**

```ts
// 最后一条 USER 消息的下一条索引 = 当前轮次起始
// 无 USER 时返回 0（全列表视为当前轮）
export function findCurrentRoundStart(messageList): number {
  for (let i = messageList.length - 1; i >= 0; i -= 1) {
    if (messageList[i].role === AssistantRoleEnum.USER) return i + 1;
  }
  return 0;
}
```

- 检查侧（isSessionStreamBusy）与清理侧（sweep）共用——检查到什么范围就清理到什么范围

**`shouldDropLateMessageChunk(currentMessage, currentMessageId, messageIdRefCurrent, chunk)`**

```ts
// 终态守卫：已终态消息不接受 MESSAGE 分片回退
// 条件：!messageIdRef.current && status ∈ {Complete, Error, Stopped}
// messageIdRef 非空 = 多步输出中间步边界 → 放行
export function shouldDropLateMessageChunk(...): boolean
```

- 命中时打 always-on 日志 `drop late MESSAGE chunk`
- **实现约束**：调用方在 setMessageList updater 内，命中必须 `return list`

---

## 2. 修改文件

### 2.1 `src/hooks/useExecutingTaskStatusPoll.ts`

**isSessionStreamBusy 架构解耦：**

```ts
// Before
return (
  hasActiveStreamingInMessages(messageList) ||
  hasExecutingProcessingInMessages(messageList)
); // ← 移除

// After
return hasActiveStreamingInMessages(messageList);
```

- 工具调用状态（processingList EXECUTING）不再驱动会话按钮
- 效果：单个工具的 FINISHED 事件丢失不再导致按钮卡死

**hasExecutingProcessingInMessages 重命名（原 hasExecutingProcessingInRecentMessages）：**

- 检查范围从固定 `slice(-5)` 改为 `findCurrentRoundStart` 轮次边界
- 覆盖任意深度多步轮次

### 2.2 `src/models/conversationInfo.ts` + `src/models/conversationAgent.ts`（镜像）

**chat onMessage 接线：**

```ts
handleChangeMessageList(params, res, currentMessageId);
finalizeChatTerminalEvent(params.conversationId, res); // ← 新增
```

**MESSAGE 分支终态守卫调用：**

```ts
if (
  shouldDropLateMessageChunk(
    currentMessage,
    currentMessageId,
    messageIdRef.current,
    { type, text },
  )
) {
  return list; // ← 必须返回未变更列表（updater 内）
}
```

**checkConversationActive 移除 slice(-5) 预截断：**

```ts
// Before
const recentMessages = messages?.slice(-5) || [];
setIsConversationActive(isSessionStreamBusy(recentMessages));

// After
setIsConversationActive(isSessionStreamBusy(messages));
```

**onClose 补 always-on 日志：**

```ts
conversationErrorTerminalLogger.warn('sse-on-close', {
  conversationId,
  hasResolvedTerminalStatus,
  isStale,
});
```

### 2.3 `src/hooks/useResumeStreamHandlers.ts`

新增两个可选 dep：

```ts
// sub onMessage → 终态事件回调
onTerminalEvent?: (conversationId, res) => void;

// sub onClose → 占位收尾回调
onStreamClosed?: (placeholderId: string | null) => void;

// sub onError → 网络错误回调（与 chat onError 对齐）
onStreamError?: (placeholderId: string | null) => void;
```

接线（model 侧）：

```ts
useResumeStreamHandlers({
  ...,
  onTerminalEvent: finalizeChatTerminalEvent,
  onStreamClosed: (id) => finalizeStreamingPlaceholder(id, 'stopped'),
  onStreamError: (id) => finalizeStreamingPlaceholder(id, 'error'),
});
```

### 2.4 `src/utils/logger.ts`

- `createAlwaysLogger` 所有方法自动带 `[ISO时间戳]` 前缀
- 会话相关 logger 统一前缀：
  - `conversationResumeLogger` = `conversationPollLogger` = `'[Conv:Resume]'`
  - `conversationErrorTerminalLogger` = `'[Conv:Status]'`
  - `conversationTerminalSweepLogger` = `'[Conv:Terminal]'`（定义在 finalizer hook 内）

### 2.4a `src/hooks/useConversationActiveState.ts`（PR 合入 `381374062`）

状态机日志增强（纯观测，不动行为）：

- 四条日志（active-change / active-blocked / active-rising-blocked-by-ack / awaiting-change）补 `model` 字段——区分主会话与预览 Tab 两个 model
- `active-rising-blocked-by-ack` 节流：每秒至多 1 条（原以流式节奏 ~150-250ms 刷屏）
- 拦截日志补末条现场：`tailId` / `tailStatus` / `listLength`（自证什么状态在被反复写回 busy）

### 2.5 `src/pages/Chat/index.tsx` + `useConversationAgentChatSession.ts`

轮询终态回调改走完整清算：

```ts
onTerminalTaskStatus: (status) => {
  finalizeConversationTerminal(id, status, 'poll-snapshot');
},
```

### 2.6 `src/components/ChatView/index.tsx`

复制按钮条件补齐：

```ts
// Before
condition: status === Complete || !status;

// After
condition: status === Complete || Stopped || Error || !status;
```

### 2.7 `src/components/MarkdownRenderer/TaskResult/index.tsx`

单元素 children 不再抛 filter 异常：

```ts
// Before（children 为字符串时 .filter 不存在 → TypeError）
const fileName = (children as React.ReactNode[])?.filter(...)

// After
if (!Array.isArray(children)) return null;  // ← 类型检查守卫
```

---

## 3. 按钮状态架构（修复后）

```
isSessionActive = isConversationActive           ← ① 连接生命周期
               || isSessionStreamBusy(messageList) ← ② 末条 Loading/Incomplete
               || taskStatus === EXECUTING        ← ③ 后端权威

工具状态 → 仅 RunOver UI 展示，与按钮无关
```

三要素冗余覆盖：

| 场景     | ①          | ②             | ③         | 按钮              |
| -------- | ---------- | ------------- | --------- | ----------------- |
| 流式中   | true       | Incomplete    | EXECUTING | 停止 ✓            |
| 多步间隙 | true       | 上步 Complete | EXECUTING | 停止 ✓（①③ 兜住） |
| 终态后   | false      | Complete      | COMPLETE  | 发送 ✓            |
| 连接断死 | onClose 清 | false         | 轮询兜底  | 恢复 ✓            |

---

## 4. 验收日志（console 过滤 `[Conv:`）

| 前缀 | 日志 | 验证什么 |
| --- | --- | --- |
| `[Conv:Terminal]` | `finalize terminal {origin, taskStatus}` | 终态收敛（origin: FINAL_RESULT/ERROR/poll-snapshot） |
| `[Conv:Terminal]` | `finalize streaming placeholder {outcome, busy}` | sub 占位收尾 |
| `[Conv:Status]` | `drop late MESSAGE chunk {chunkText}` | 守卫 B 触发 |
| `[Conv:Status]` | `applyTerminalTaskStatus {prev, next}` | 状态迁移 |
| `[Conv:Status]` | `sse-on-close {hasResolvedTerminalStatus}` | onClose 时机 |
| `[Conv:Status]` | `sse-on-error apply FAILED` | 连接级 onError |
| `[Conv:Status]` | `active-change` / `active-blocked` / `active-rising-blocked-by-ack` / `awaiting-change` | 状态机翻转（含 model 标识、末条现场 tailId/tailStatus、节流 1 条/s） |
| `[Conv:Resume]` | `cancel polling` / `resume` / `discard stale` | 轮询/恢复生命周期 |

---

## 5. 测试

- `conversationInfoMessageList.test.ts`：41 条全过（含终态守卫 3 场景：终态后丢弃/多步边界放行/流式中放行）
- `useExecutingTaskStatusPoll.test.ts`：更新函数名引用
- `TaskResult/index.test.tsx`：新增 58 行（单元素 children 场景）
