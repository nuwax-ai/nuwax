# 轮询与发消息竞态：过期快照丢弃（PC 修复留存）

> **PC 仓库留存文档**：记录 nuwax 端已落地的最小修复、根因、验收结果。  
> Mobile 追齐请看：`nuwax-mobile/docs/poll-send-race-stale-snapshot-fix.md`  
> 排查全文（含已取消大改项）：`.cursor/plans/轮询发消息竞态排查_ed75f90e.plan.md`

---

## 1. 现象

智能体会话（非 AppDev）在以下临界窗口出问题：

> **5s 状态轮询已发出、回包尚未回来时，用户立刻发下一条消息**

表现：

1. Network 里 `POST .../chat` 变成 `(canceled)`
2. 刚发出的用户消息 / 乐观助手气泡被冲掉或状态错乱
3. 控制台未必有明确「轮询 abort chat」日志，容易误判为发送链路本身的问题

---

## 2. 根因（已核实）

轮询**不会直接**调用 `handleClearSideEffect` / `abortConnectionRef` 掐掉 live `POST /chat`。

真正链路是：

1. `useConversationStreamResume` 每 5s `fetchConversationSnapshot`（`apiAgentConversation`）
2. `ready: !isLocallyStreaming` **只能阻止后续轮询**，挡不住已在途请求的 `onSuccess`
3. 旧实现 `onSuccess` **没有 generation 丢弃**；`latestRef.isLocallyStreaming` 还存在一帧滞后
4. 过期回包仍可能：
   - `onConversationSnapshot(stale)`
   - `onTerminalTaskStatus`
   - `EXECUTING` 时 `subscribe(stale messageList)` → `ensureResumeAssistantPlaceholder` 用陈旧列表整表替换乐观尾巴
5. 乐观尾巴被冲掉后，用户再发 / 重试会走 `handleClearSideEffect` → 表现为 `chat (canceled)`

### 竞态时序

```text
Poll(5s) 发出 fetchConversationSnapshot
    │
User 发消息 → isLocallyStreaming=true → 乐观 append → POST /chat
    │
Poll onSuccess 回来（仍是发送前快照）
    │  旧：无 generation；isLocallyStreaming 可能仍 false
    ├─ 写过期快照 / 终态
    └─ 误 subscribe(sub) → 整表覆盖乐观尾巴
    │
用户再发 → handleClearSideEffect abort 上一轮 chat → canceled
```

| 机制 | 能否挡住 in-flight 回包 |
| --- | --- |
| `ready: !isLocallyStreaming` | ❌ 只停后续轮询 |
| `useRequest.cancel()` | ⚠️ 停定时器；已发出的 Promise 仍可能 `onSuccess` |
| generation + `onSuccess` 整段 return | ✅ 本修复核心 |

---

## 3. 修复方案（最小侵入，已落地）

### 3.1 原则

只改轮询编排 hook，**不**扩大到发送路径同步 bump、placeholder 合并加固（这两项曾规划后因侵入过高取消）。

### 3.2 核心算法

```text
pollGenerationRef      // 当前代际
requestGenerationRef   // 本次请求发出时捕获的代际

当 isLocallyStreaming: false → true：
  pollGenerationRef++

发起轮询时：
  requestGenerationRef = pollGenerationRef

onSuccess / visibility then：
  if requestGeneration !== pollGeneration
     || latestRef.isLocallyStreaming
     → 整段 return（禁止 snapshot / 终态 / subscribe）

isLocallyStreaming === true 时：
  立即 cancel() 停后续轮询（effect）
```

语义：

- **cancel**：发送瞬间停后续轮询（尽量减少在途窗口）
- **generation discard**：cancel 挡不住的已在途回包，整段丢弃（兜底）

### 3.3 改动文件

| 文件 | 改动 |
| --- | --- |
| `src/components/business-component/UnifiedChatSession/hooks/useConversationStreamResume.ts` | poll generation；本地流式时 `cancel()`；`onSuccess` / visibility 整段丢弃；关键日志 |
| `tests/useConversationStreamResume.test.ts` | 竞态单测 + 断言两条关键日志 |
| `src/utils/logger.ts` | 复用已有 `conversationPollLogger`（前缀 `[ConversationStreamResume][Poll]`） |

### 3.4 关键代码锚点

文件：`useConversationStreamResume.ts`

**代际递增（render 体，false→true）：**

```ts
const pollGenerationRef = useRef(0);
const requestGenerationRef = useRef(0);
const prevLocallyStreamingForPollRef = useRef(!!isLocallyStreaming);
if (isLocallyStreaming && !prevLocallyStreamingForPollRef.current) {
  pollGenerationRef.current += 1;
}
prevLocallyStreamingForPollRef.current = !!isLocallyStreaming;
```

**发请求打戳：**

```ts
() => {
  requestGenerationRef.current = pollGenerationRef.current;
  return conversationId
    ? fetchConversationSnapshot(conversationId)
    : Promise.resolve(undefined);
};
```

**onSuccess 整段丢弃：**

```ts
if (
  requestGenerationRef.current !== pollGenerationRef.current ||
  latestRef.current.isLocallyStreaming
) {
  conversationPollLogger.info('discard stale snapshot', { ... });
  return;
}
```

**发送时立即 cancel：**

```ts
useEffect(() => {
  if (isLocallyStreaming) {
    conversationPollLogger.info('cancel polling: local send started', { ... });
    cancel();
  }
}, [isLocallyStreaming, cancel, conversationId]);
```

visibility 回调同样：闭包捕获 `requestGeneration`，then 里比对后可打 `discard stale visibility snapshot`。

### 3.5 刻意未做（非目标）

- 不改 5s 间隔本身
- 不改 `/chat` / `/chat/sub` 协议
- 不把「立即发送」改回先 stop
- 不在 `UnifiedChatSession` 发送路径同步 bump generation（侵入高）
- 不改 `ensureResumeAssistantPlaceholder` 乐观合并（侵入高；靠丢弃过期 poll 从源头切断）

---

## 4. 日志与自证

开发环境（`NODE_ENV=development` 且未设 `localStorage.disableLogger=true`）过滤：

```text
[ConversationStreamResume][Poll]
```

| 日志                                 | 含义                                 |
| ------------------------------------ | ------------------------------------ |
| `cancel polling: local send started` | 本地发送开始，已 `cancel()` 轮询     |
| `discard stale snapshot`             | 在途旧回包被整段丢弃（命中竞态兜底） |
| `discard stale visibility snapshot`  | 可见性恢复拉取的过期结果被丢弃       |

字段关注：`pollGeneration` / `requestGeneration` / `currentGeneration` / `isLocallyStreaming`。

说明：若只有 cancel、没有 discard，通常表示 cancel 已成功阻止 `onSuccess`，竞态窗口被提前关掉，**也算修复有效**。discard 是 cancel 挡不住时的安全网。

---

## 5. 验收

### 5.1 单测

```bash
npx vitest run tests/useConversationStreamResume.test.ts
```

关键用例：`轮询在途时开始发送会取消轮询并丢弃旧回包`

断言：

- `cancelPolling` 被调用
- `onConversationSnapshot` / `onTerminalTaskStatus` **未**调用
- 日志含 `cancel polling: local send started` 与 `discard stale snapshot`

### 5.2 手工 / 浏览器复现

1. 打开智能体会话，Network 盯 `POST /api/agent/conversation/{id}`（5s 一轮）
2. 该请求 **pending** 时立刻发消息
3. 期望：
   - 控制台出现 `cancel polling...`
   - 新 `POST .../chat` **不是** `(canceled)`
   - 若旧回包仍进入 `onSuccess`，应出现 `discard stale snapshot`，且不冲掉乐观消息

### 5.3 实测记录（2026-08-15）

会话 `1560509`，用探针将会话详情 XHR 业务回包延迟 4s 强制竞态：

| 项 | 结果 |
| --- | --- |
| 发送时轮询在途 | 是 |
| `cancel polling: local send started` | 有（`pollGeneration: 1`） |
| `POST .../chat` | **`ok:200`，未 canceled** |
| UI | 助手正常回复并「运行完毕」 |
| `discard stale snapshot` | 本次未出现（cancel 已挡掉 `onSuccess`，符合预期） |

---

## 6. 相关路径速查

```text
src/components/business-component/UnifiedChatSession/hooks/useConversationStreamResume.ts
tests/useConversationStreamResume.test.ts
src/utils/logger.ts                          # conversationPollLogger
src/utils/conversationTaskStatusSync.ts      # fetchConversationSnapshot
src/constants/home.constants.ts              # GLOBAL_POLLING_INTERVAL = 5000
.cursor/plans/轮询发消息竞态排查_ed75f90e.plan.md
```

跨端：

```text
nuwax-mobile/docs/poll-send-race-stale-snapshot-fix.md
nuwax-mobile/subpackages/hooks/useConversationStatusPolling.uts
```

---

## 7. 一句话总结

**轮询回包必须带代际；本地一开始发送就升代际，旧回包整段丢弃。**  
`cancel()` 负责收窄窗口，generation discard 负责兜底；两者一起避免过期快照误 subscribe / 冲掉乐观消息，从而消除「发消息时 chat 被 canceled」的表象。
