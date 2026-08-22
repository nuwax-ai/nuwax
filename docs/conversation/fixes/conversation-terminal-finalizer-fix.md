# 终态经任一路径到达统一收敛会话状态机修复说明

> 背景：会话 1654471（线上事故）与 1677549（复现）两次「任务已结束、页面仍卡会话中」。修复：前端新增统一终态清算 hook，终态无论从哪条路径到达，一次性收敛全部会话状态。

---

## 1. 现象

1. 任务在后端已正常完成（`taskStatus` 已落 `COMPLETE`），页面输入区仍显示**停止按钮**，无法回到发送态
2. 会话状态轮询停摆，sub 恢复流不再重试——前端失去全部自愈能力
3. 用户只能手动点停止才能恢复；伴随网络切换（`ERR_NETWORK_CHANGED`）的会话高发

---

## 2. 根因

### 2.1 终态到达路径与状态置位路径分离

终态可能从多条路径到达，但此前**只有 `taskStatus` 会被写回**：

| 终态到达路径 | taskStatus | isAwaitingChatTerminal | isConversationActive | 末条 Loading 消息 |
| --- | --- | --- | --- | --- |
| 本地 chat SSE 的 FINAL_RESULT / ERROR | ✅ | ✅（本连接回调） | ✅（onClose 兜底） | ✅ |
| sub 恢复流重放（pub/sub） | ✅ | ❌ | ❌ | ❌ |
| 轮询快照 onTerminalTaskStatus | ✅ | ❌ | ❌ | ❌ |

`isAwaitingChatTerminal` / `isConversationActive` / 末条消息状态**绑定在「原发送连接」的回调上**——连接静默死亡（`ERR_NETWORK_CHANGED` 的安静变体，浏览器收不到任何事件与关闭信号）后这些回调永不触发。

### 2.2 卡死链（1677549 复现实证）

```text
本地 chat 连接静默死亡
→ FINAL_RESULT 只能经 sub 重放到达 → taskStatus 落 COMPLETE
→ 但 isAwaitingChatTerminal 卡 true
→ isPollingReady 含 !isAwaitingChatTerminal → 轮询永久停摆
→ isSessionActive = isConversationActive || isSessionStreamBusy || taskStatus===EXECUTING 三要素有残留
→ 停止按钮常驻
```

复现 console 特征：`⏰ [SSE Utils] 未收到消息: 4秒/9秒` 循环（10s 心跳不断重置 60s 看门狗）→ `ERR_NETWORK_CHANGED` → `[ConversationErrorTerminal] applyTerminalTaskStatus prev EXECUTING next COMPLETE` 但页面仍卡。

### 2.3 事故链路定位结论（三方日志交叉验证）

```text
浏览器(nuwax) ──SSE──► Java平台(agent-platform) ──HTTP/SSE──► agent_runner(Rust, 云端电脑容器)
```

- 1654471：agent_runner 于 10:31:59 干净投递 end_turn（Rust 日志）、Java 零异常完成（Java 日志）、cancel 单发证明 flux 早已完成——断点在**浏览器 ↔Java 最后一公里的静默连接死亡**
- 5 次 cancel = 4 次用户停止点击；22ms 双发是后端 `chatStop` 端点 + 前端 abort→`doOnCancel` 级联拆出的同一次点击，非前端双发

---

## 3. 修复方案

新增共享 hook `src/hooks/useConversationTerminalFinalizer.ts`，`conversationInfo` / `conversationAgent` 两个 model 复用。终态一旦确认（无论哪条路径），一次性收敛：

1. `taskStatus` 终态写回（沿用 `applyTerminalTaskStatus`，幂等/防跨会话守卫不变）
2. `isAwaitingChatTerminal = false`（恢复轮询资格）
3. `lastSendAtRef.current = 0` 后清 `isConversationActive`（**强制打破发送后 3s 保活**——1654471 二次卡死成因）
4. 末条消息兜底落终态：Loading/Incomplete → Complete/Error；残留 EXECUTING 的 processing 块 → FINISHED/FAILED

两个入口：

- `finalizeConversationTerminal(cid, status)`：终态枚举入口（轮询/快照路径），带防跨会话守卫
- `finalizeChatTerminalEvent(cid, res)`：SSE 终态事件入口；ERROR 一律 FAILED，FINAL_RESULT 仅在解析出结构化终态时清算（**「任务冲突」型 FINAL_RESULT 解析不出终态枚举，自动跳过**，不误清仍在执行的旧任务）

model 内用法（12 行）：

```ts
const { finalizeConversationTerminal, finalizeChatTerminalEvent } =
  useConversationTerminalFinalizer({
    source: 'conversationInfo', // 预览 Tab 传 'conversationAgent'
    conversationInfoRef,
    lastSendAtRef,
    setConversationInfo,
    setMessageList,
    messageListRef,
    setIsAwaitingChatTerminal,
    setIsConversationActive,
  });
```

> 注意：hook 内部含 setState，禁止在 `setMessageList` updater 等渲染期回调中调用。model 内 `handleChangeMessageList` 的 in-updater `applyTerminalTaskStatus` 保留不动（幂等第一层），本 hook 只在事件回调层触发（第二层）。

### 3.1 流式占位收尾（finalizeStreamingPlaceholder，1560798 复现后追加）

终态清算只覆盖「终态会到达」的场景；若**会话全程只有 sub 一条连接**（无本地发送）且 sub 中途死亡（网络切换），任务后端仍在执行、终态永远不达，卡死链变为：

```text
sub 死亡 → 无人收尾其占位消息（停留 Loading/Incomplete）
→ isSessionStreamBusy 永真 → isConversationActive 每次重算被顶回 true
→ blockedBy: ["local-stream-active"] → 详情轮询永堵
```

修复：sub 关闭时（`useResumeStreamHandlers` onClose → `onStreamClosed` 回调）把本次恢复的占位落为 Stopped（EXECUTING processing → FAILED）并重算活跃态——列表不再 busy → active 回落 → 详情轮询恢复，由快照决定重挂 sub 续流或落终态。验证方式：console 出现 `[ConversationTerminalSweep] finalize streaming placeholder` 后轮询恢复、断网重连自动收敛（已实测通过；定位期使用的 `conversationPollingDiagnostics` 临时诊断模块已随修复完成整体删除）。

sub 的处置再按死亡形态细分，与本地 chat 连接对齐：**网络错误**（onError → `onStreamError`）按 chat onError 同款收敛——占位落 Error、taskStatus 落 FAILED 并同步侧栏，页面直接回可发送态（否则会停留在「智能体正在执行，请稍等」横幅 + 会话中按钮的混合态）；**正常关闭/看门狗超时**（onClose）维持 Stopped 语义等轮询定夺。FAILED 为本地乐观值，网络恢复后轮询看到 EXECUTING 会重挂 sub 续流，真实终态到达时 sweep 纠正。

---

## 4. 改动清单

| 文件 | 改动 | 职责 |
| --- | --- | --- |
| `src/hooks/useConversationTerminalFinalizer.ts` | 新增 | 终态清算 + 流式占位收尾（3.1）+ 防跨会话守卫 |
| `src/hooks/useResumeStreamHandlers.ts` | +33 | sub onMessage 新增可选 `onTerminalEvent`（重放终态触发清算）；onClose 新增 `onStreamClosed`（占位收尾） |
| `src/models/conversationInfo.ts` | +35 | hook 调用 + chat onMessage 终态即清算 + 导出 + 传两个回调 |
| `src/models/conversationAgent.ts` | +34 | 同上镜像（预览 Tab 链路同款缺陷） |
| `src/pages/Chat/index.tsx` | +4/-4 | `onTerminalTaskStatus` 改走 `finalizeConversationTerminal` |
| `src/pages/ConversationAgent/hooks/useConversationAgentChatSession.ts` | +4/-4 | 同上 |

`src/utils/conversationTaskStatusSync.ts` **零改动**（继续只做终态枚举解析 / taskStatus 写回 / 快照拉取）。

---

## 5. 验证

- ESLint：全部改动文件零告警
- tsc --noEmit：改动文件零错误（`conversationInfoMessageList.test.ts` 的 13 个报错经 stash 对比确认为预存）
- 相邻既有测试通过（`useUnifiedChatScroll` 1 个失败经 stash 确认为预存，与本次无关）
- 1677549 复现场景修复后预期行为：网络切换 → chat/sub 双 onError → 全套收尾（onError/onClose 路径审计确认本就完整）→ 轮询恢复 → 重挂 sub → FINAL_RESULT 重放 → sweep 一次收敛，页面回到可输入态，不再依赖用户手点停止

---

## 6. 已知边界

**同会话跨轮迟到终态**：sub 的 pub/sub 重放可能把上一轮终态在下一轮流式中送达——守卫只校验会话 ID，不校验轮次（requestId）。后果是下一轮乐观态被瞬时清掉、末条短暂标错，**下一个内容分片到达即自愈**。发生窗口极窄（sub 在两轮之间重放旧终态且本地流已开），收益/改动比不支持堵死。

---

## 7. 遗留（未随本次修复）

| 项 | 说明 | 状态 |
| --- | --- | --- |
| P1 内容看门狗 | HEART_BEAT 掩蔽 60s 断线看门狗（console 特征「4 秒/9 秒」循环）；P0 后无独修场景 | 暂缓；再现同类卡死工单或后端修看门狗 bug 时重评 |
| P2 本地发送中断 sub | `useConversationStreamResume` 的 isLocallyStreaming effect 未 abortSub，存在双订阅窗口 | 待办 |
| P3 停止路径 3s 保活竞态 | `runStopConversation` 未重置 `lastSendAtRef`（终态路径已被本次兜住，停止路径仍有） | 待办 |
| 后端 Java 看门狗 | `SandboxAgentClient.subscribe` 60s 心跳看门狗杀连接不调 onError → flux 静默悬死（08:32 有真实触发） | 需后端修复 |
| 后端 cancel 去重 | 一次停止点击拆出两个 cancel（端点 + abort 级联），agent_runner 日志有迷惑性 | 需后端评估 |
