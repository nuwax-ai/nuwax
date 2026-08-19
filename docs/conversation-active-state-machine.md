# 会话活跃态（「会话中」按钮）状态机参考文档

> 状态：**当前实现基准**（2026-08-20，分支 `feat-2026.7.31`）。本文是 `isConversationActive` 的唯一权威参考：谁在消费它、每次翻转由哪些场景触发、经过哪些闸门、日志怎么读、出问题怎么定位。历史案例与根因分析见 `conversation-complete-button-stuck-analysis.md`（§8 为最近一轮）。

---

## 1. 这个状态是什么、谁在消费

`isConversationActive` = 会话框「会话中/停止 ↔ 发送」按钮的核心信号，由共享 hook `src/hooks/useConversationActiveState.ts` 持有（`conversationInfo` / `conversationAgent` 两个 model 各一份实例，状态完全隔离；实现收敛为一处，避免双份漂移）。

**三个消费方共用这一个信号**——这是为什么它卡 true 会同时表现为三种症状：

| 消费方 | 路径 | 卡 true 的症状 |
| --- | --- | --- |
| 会话框按钮 | `ChatInputHomeIndependent` 的 `isSessionActive`（= model active \|\| 末条流式 \|\| taskStatus===EXECUTING） | 按钮常驻「会话中/停止」 |
| 消息队列 | `useUnifiedChatQueue` 的 `streamActive`（= model active \|\| isSessionStreamBusy） | `enqueueBlocked` 卡 true → 终态后「待发送 N」永不消费 |
| 详情轮询门 | `useConversationStreamResume` 的 `isPollingReady`（含 `!isLocallyStreaming`） | 终态后轮询不恢复（网络层零 `/conversation/{id}` 请求） |

配套状态（同一 hook 内）：

- `isAwaitingChatTerminal`：本地 chat 已发起但协议终态未到。轮询门的另一半（变迁打 `awaiting-change` 日志）。
- `roundTerminalAckRef`：**乐观终态 ack**——本轮 FINAL_RESULT/ERROR 已到达的标记，置位期间 rAF 重算**只封上升沿**（派生信号不得复活已终态轮次的活跃态）。
- `lastSendAtRef`：发送保活时间戳，3s 内拒绝置 false。

## 2. 状态转换全表

### 2.1 置 true（开启「会话中」）

| # | 场景 | source 标签 | 位置 |
| --- | --- | --- | --- |
| T1 | 发送瞬间乐观置活（手动发送 / 队列自动消费 / intervention 回复均经此） | `send-optimistic` | model `onMessageSend` |
| T2 | rAF 重算上升沿：messageList 末条变为 Loading/Incomplete（流式启动） | `raf-recompute` | `checkConversationActive`（ack 未置位时才放行） |

### 2.2 置 false（关闭「会话中」）

**A. 协议终态事件（统一走 sweep——`useConversationTerminalFinalizer` 的 `sweepConversationTerminal`）**

| # | 场景 | source | 前置条件 |
| --- | --- | --- | --- |
| F1 | 本地 chat 流 **FINAL_RESULT**（success 可解析出终态枚举） | `terminal-sweep` | conversationId 匹配；**「任务冲突」型解析不出 → 整个 sweep 跳过**（不关，旧任务还在跑） |
| F2 | 本地 chat 流 **ERROR 事件**（恒映射 FAILED） | `terminal-sweep` | 同上 |
| F3 | **详情轮询快照**返回终态（终态事件丢失时的兜底路径） | `terminal-sweep` | 轮询门开着（`onTerminalTaskStatus` → `finalizeConversationTerminal('poll-snapshot')`） |
| F4 | **sub 恢复流重放** FINAL_RESULT/ERROR（刷新页面/新标签续流） | `terminal-sweep` | 同 F1 |

> **sweep 步骤顺序（兜底设计，2026-08-20）**：终态事件一到，**第一步先落死会话框状态**——清「会话中」（打破 3s 保活）+ 置 ack（封复活通路）+ 清 awaiting（恢复轮询资格）→ 第二步 taskStatus 写回 → 第三步消息收敛。后续任一步异常不拖累按钮恢复。

**B. 连接死亡**

| # | 场景 | source |
| --- | --- | --- |
| F5 | 连接级 **onError**（网络断 / ERR_NETWORK_CHANGED）全量收尾：FAILED 写回 + 消息置 Error + ack 置位 | `sse-on-error` |
| F6 | **onClose** 无终态时的兜底释放（不等终态查询返回） | `sse-on-close` |
| F7 | **sub 恢复流**关闭/网络错误 → 占位收尾后 rAF 重算（`busy && !ack`） | `placeholder-recompute` |

> 过期连接保护：新一轮发送已 abort 旧连接时，旧连接迟到的 onClose/onError **只清理自己的消息，不动活跃态**（不算关闭场景）。

**C. 派生信号回落（rAF 重算下降沿）**

| # | 场景 | source |
| --- | --- | --- |
| F8 | messageList 末条不再是 Loading/Incomplete（如 `MESSAGE finished=true` 落 Complete） | `raf-recompute`（busy=false） |

**D. 用户 / 页面操作**

| # | 场景 | source |
| --- | --- | --- |
| F9 | 用户点**停止**（消息置 Stopped + chatStop API，同时复位 ack） | `user-stop` |
| F10 | **会话切换 / 页面卸载**（resetInit；两 model 对齐） | `reset-init` |
| F11 | 查询会话接口出错 | `query-on-error` |

### 2.3 ack 的置位与复位（决定上升沿是否被封）

| 方向 | 点位 | 覆盖场景 |
| --- | --- | --- |
| **置 true** | sweep 第一步（F1–F4 共用）+ onError 全量收尾（F5） | 终态事件/连接级错误一到即封死复活通路 |
| **置 false** | 两 model `handleClearSideEffect` 函数体首行 | 新一轮发送（onMessageSend）/ 用户停止（runStopConversation）/ 会话切换与卸载（resetInit） |

## 3. 公共闸门（所有 set 都经过 `useConversationActiveState` 的包装器）

1. **发送保活（3s）**：发送后 3s 内的置 false 被拒绝并打 `active-blocked {reason: 'send-keepalive<3s'}`。A/B/D 类路径（sweep/onClose/onError/停止）都会先清 `lastSendAtRef = 0` 绕过保活；真正会被拦的只有 **F8（裸 rAF 下降）和 F11**。
2. **同值 noop**：值未变的 set 静默返回不打日志（流式中 rAF 高频命中同值）。
3. **上升沿 ack 门**（`checkConversationActive` / `finalizeStreamingPlaceholder` 两处重算口径一致）：`busy && ack → return`，下降方向不受限。日志打 `active-rising-blocked-by-ack`。

## 4. 日志体系（生产 console 直接可判）

前缀统一 `[Conv:Status]`（`createAlwaysLogger` 自动带 ISO 时间戳）。**验收/排障：console 过滤 `active-`**。

| 日志 | 触发 | 字段 | 说明 |
| --- | --- | --- | --- |
| `active-change` | 活跃态真实翻转 | `source` + `prev → next` | 每次翻转都带来源，还原「哪个变化导致的」 |
| `active-blocked` | 置 false 被 3s 保活拦截 | `source` + `reason` + `prev` | 历史静默路径留痕 |
| `active-rising-blocked-by-ack` | 乐观终态 ack 封住上升沿 | `source: 'raf-recompute'` | **新机制生效的证据**（终态后派生信号试图复活被拦） |
| `awaiting-change` | awaiting 翻转 | `prev → next` | 轮询门另一半状态位；与 active-change 合起来覆盖 `isPollingReady` 的全部两个状态位，来源归属靠相邻日志 |

source 取值全集：`send-optimistic` / `raf-recompute` / `terminal-sweep` / `placeholder-recompute` / `sse-on-close` / `sse-on-error` / `user-stop` / `reset-init` / `query-on-error` / `disable`（默认兜底）/ `unknown`。

一轮健康会话的日志链形态：

```
active-change {source: 'send-optimistic', prev: false, next: true}     ← 发送
（流式中：同值 noop，无日志）
finalize terminal {origin: 'FINAL_RESULT', taskStatus: 'COMPLETE'}     ← 终态事件
active-change {source: 'terminal-sweep', prev: true, next: false}      ← 同毫秒关按钮
active-rising-blocked-by-ack {source: 'raf-recompute'}                 ← 终态后派生信号被拦（可能出现）
```

## 5. 排障判定表

| 观察到的日志/现象 | 结论 | 下一步 |
| --- | --- | --- |
| 终态后出现 `active-change {source: 'raf-recompute', next: true}` | ack 门没封住（修复未生效或 ack 被提前复位） | 检查该轮 ack 置位/复位时序 |
| 有 `finalize terminal` 但无 `terminal-sweep` 的 false | sweep 没清活跃态（早退或异常） | 对照 §2.2-A 前置条件 |
| `active-blocked` 大量出现且终态后 active 卡 true | 3s 保活拦截异常 | 查调用方是否漏清 `lastSendAtRef` |
| 终态后 `awaiting-change ... next: false` 已打但轮询仍不恢复 | 轮询门另三条件问题（isResumeSubscribed / resumeStream / conversationId） | 查 `[Conv:Resume]` 系列日志；active 正常但无 awaiting-change 落 false → awaiting 卡 true（onClose 兜底分支未走到） |
| 终态全绿 + `terminal-sweep` 正常回落 + 「待发送」badge 仍不动 | **队列内部缺陷**（边沿丢失/锁泄漏/发送被吞，非活跃态问题） | 落队列安全网（见分析文档 §8.2 判别特征） |
| 终态后消息回 Incomplete 且无 `drop late MESSAGE chunk` + 按钮误显可发送 | 陈旧终态击中活跃轮（已知窄缝） | 分析文档 §8.3 窄缝记录 |

## 6. 代码锚点

| 模块 | 文件 | 职责 |
| --- | --- | --- |
| 状态机本体 | `src/hooks/useConversationActiveState.ts` | 状态/ref/带 source 的 setter/check/disable/rAF 调度，唯一实现 |
| 终态清算 | `src/hooks/useConversationTerminalFinalizer.ts` | sweep（置 ack + 清活跃态最优先）、事件白名单、占位收尾 |
| 主会话 model | `src/models/conversationInfo.ts` | 接线 + ack 语义点位（onError 置位 / handleClearSideEffect 复位）+ 各调用点 source 标签 |
| 预览 Tab model | `src/models/conversationAgent.ts` | 同上（镜像） |
| busy 判定 | `src/hooks/useExecutingTaskStatusPoll.ts` 的 `isSessionStreamBusy` | 只看末条 Loading/Incomplete（工具状态不参与，1f8c77bd9 架构解耦） |
