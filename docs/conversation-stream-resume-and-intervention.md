# 会话流式恢复(sub)与权限审批交互 —— 需求与逻辑梳理

> 本文档梳理 nuwax(PC) 的「EXECUTING 会话流式恢复 + 权限审批 DockPanel 显示/关闭 + agentMode 同步」完整逻辑，供 nuwax-mobile 同步开发参考。

---

## 1. 背景与目标

会话进行中刷新页面 / 新开标签页时,前端丢失正在进行的流式输出(原本的 SSE 只在「发送消息」时建立一次,刷新/新开标签后无人接收后端仍在产出的内容)。

后端为此新增 **`/api/agent/conversation/chat/sub/:conversationId`** SSE 接口:**从头重放**当前 `EXECUTING` 会话的输出流,载荷结构与 `/api/agent/conversation/chat` 完全一致。

前端职责:

1. 进入会话时先拉历史 + 状态;若 `taskStatus===EXECUTING` 且非本地流式,订阅 sub 把「执行中的那条助手消息」重建出来。
2. 在会话页持续轮询状态,一旦发现会话变为 EXECUTING(定时任务/其它入口触发同一会话)就自动恢复。
3. 权限审批(acp permission / mcp ask) DockPanel 的正确显示/关闭。

---

## 2. sub 流式恢复

### 2.1 接口约定

- 方法:`GET`(订阅类;若后端要求 POST 则改 method + body,不影响流式语义)。
- URL:`${BASE_URL}/api/agent/conversation/chat/sub/:conversationId`。
- 鉴权:`Authorization: Bearer <token>`。
- 行为:**从头重放**执行中助手消息的完整事件序列,与 live chat 同载荷。
- 自动结束:`subType==='end_turn'` 或 `completed===true` 后端关闭;前端 60s 无消息兜底断开。

### 2.2 恢复流程(subscribe)

1. 触发:进入会话 `taskStatus===EXECUTING` / 轮询发现 EXECUTING,且 `!isLocallyStreaming`。
2. **先 reload 历史**(runAsync):拿到含最新用户消息的 `messageList`(多页签下别的页签刚发送的用户消息也要补上)。
3. **追加空白 assistant 占位**(`currentMessageId = uuid`),由 sub 流用与 live chat 完全相同的 chunk 处理逻辑重建。
4. 订阅 sub,每个 chunk 喂给 `handleChangeMessageList({conversationId}, res, currentMessageId)`。
5. sub 收到 `end_turn`/`completed`/ERROR → 断开 → `onClose`。

### 2.3 占位策略(关键避坑)

- **只复用「本次恢复已追加的占位」**,不复用历史里的任何消息 —— 否则会把别的(崩溃/旧)任务残留的 Incomplete 气泡当成占位,把本任务输出合并进去。
- 占位对象缺 `index` 字段,任何按 `index ?? 0` 排序的消费者会把它排到队首(渲染时用数组顺序、判定「最新」时用未排序末尾,见 §4.1)。

### 2.4 连接隔离

- sub 用**独立 abort 句柄**(`resumeAbortRef`),**不复用** live 的 `abortConnectionRef` —— 后者是单一可变 ref,被每次 live 发送覆写,共用会互相冲掉句柄。
- 本地发送时(`onMessageSend → handleClearSideEffect → abortResumeStream`)立即中断 sub,避免 live 与 sub 双流。

---

## 3. 状态轮询(useConversationStreamResume)

### 3.1 轮询暂停条件(只有这两种)

- **会话执行中**(sub 已订阅,`isResumeSubscribed=true`)。
- **`document.hidden`**(标签隐藏,`pollingWhenHidden:false`)。

其余状态(CREATE/COMPLETE/FAILED/CANCEL/空闲)**持续轮询**,检测会话再次变为 EXECUTING。

### 3.2 ready 表达式

```
ready = !!conversationId && !isLocallyStreaming && !isResumeSubscribed && !!resumeStream
```

- `isLocallyStreaming`:**纯本地 SSE 活跃**(model 原始 `isConversationActive`)。注意:停止按钮用的混合值是 `isConversationActive || taskStatus===EXECUTING`,**不能**直接给 hook 当 `isLocallyStreaming`,否则 EXECUTING 时恒为 true 导致既不轮询也不订阅。
- `isResumeSubscribed`:sub 订阅中。
- `resumeStream`:未注入(如 ConversationAgent 预览 Tab)则整体不启用。

### 3.3 续上立即停轮询

subscribe 内同步 `stopPolling()`(不等 ready 异步生效,通过 ref 解耦前向引用);sub `onClose` 时 `startPolling()` 恢复。

### 3.4 FAILED 主动断

sub 收到 `eventType===ERROR` → `abortResumeStream()` 主动断开 → 触发 `onClose` → 恢复轮询。FAILED 不属于「执行中」,也要继续轮询检测重试。

### 3.5 切会话

立即重置 `isResumeSubscribed`(重置 effect 排在 entry effect **之前**,避免 entry subscribe 后被重置覆盖)。

### 3.6 离开页面

cleanup:`stopPolling` + `abortSub`。

---

## 4. 权限审批 DockPanel(useActiveInterventionQueue)

### 4.1 显示条件(三重 AND)

1. **最新消息过滤**:只渲染 `messageList` 末尾(`rawList[length-1]`,**未排序**,因占位无 index)这条消息上的审批 —— 历史消息的审批不渲染(否则历史 hydrate 的审批与 sub 重放的审批 intervention id 相同,双卡片 key 冲突/反复挂载闪烁)。
2. **responseStatus active**:`pending` | `submitting`。
3. **executeId 匹配焦点**:审批自身 `executeId` 匹配最新消息 `processingList` 末尾的 `executeId`(focusExecuteId);过期(被后续 processing 取代)关闭;自身 `executeId` 缺失时保守显示(避免误关)。

### 4.2 关闭条件(任一触发)

- `responseStatus` 离开 `pending/submitting`(submitted/cancelled/failed)。
- `executeId` 过期(agent 推进到下一个工具调用)。
- 下一条消息进入 messageList(最新消息过滤,旧审批自动移除)。

### 4.3 会话结束态(Complete/Error/Stopped) —— 区分对待

- **acp_permission**:`isMessageTerminal=true` → 不显示。会话结束即审批已 resolve/失效。**跨页签**:别的页签审批后本页签 sub 收到 `end_turn` 使消息变 Complete,审批随之关闭。
- **mcp_ask(ask-question)**:**不受会话结束态影响**。用户填表单期间消息可能已是 Complete,仍需保持显示,由 `responseStatus`/下一条消息/executeId 控制关闭。

### 4.4 acp permission vs ask-question(务必区分)

| 维度 | acp permission | ask-question (mcp_ask) |
| --- | --- | --- |
| 等待期间 | 一直 pending | 用户填表单,消息可能 Complete |
| 提交时 | 后端 resolve | **自己停止会话 + 单独发送表单消息**(作为新消息) |
| 会话结束态 | 不显示 | 显示(不受影响) |
| 关闭信号 | responseStatus / 会话结束 / executeId | responseStatus / 下一条消息 / executeId |

### 4.5 heartbeat

heartbeat 事件不写 `messageList`(`handleChangeMessageList` 只处理 PROCESSING/MESSAGE/FINAL_RESULT/ERROR),天然不影响 DockPanel —— 既不误开也不卡住关闭。

---

## 5. agentMode 模式切换同步(useAgentInterventionLayer)

### 5.1 存储

- `agentMode`('yolo' | 'ask') 缓存在 `localStorage` key = **`nuwax_agent_mode_cache`**。
- UI 切换 → `setAgentMode(mode)`:更新 state + 写 localStorage(预览模式仅内存态,不读写)。

### 5.2 跨页签/轮询同步(开启模式切换后必需)

- **storage 事件**:跨标签即时同步(A 标签切换 → B 标签收到事件更新 state)。
- **定时轮询**(`GLOBAL_POLLING_INTERVAL`,5s):同标签兜底(同标签 setItem 不触发自己的 storage 事件)。
- **只更新 state、不回写 localStorage**,避免与写入方形成循环(`cached !== agentModeRef.current` 才同步)。
- 预览模式(`interventionHandlers`)跳过。

---

## 6. 多页签场景

### 6.1 补用户消息

- A 页签发送用户消息 → 会话 EXECUTING。
- B/C 页签轮询发现 → subscribe **前先 reload 历史(runAsync)**,拿到含 A 用户消息的 messageList,再追加 assistant 占位。
- 否则 B/C 的 messageList 是 A 发送前加载的,sub 流只重建 assistant,会**少显示 A 那条用户消息**。
- 注意:`runQueryConversation` 是 ahooks 的 `run`(返回 void),不能 await;要用 `runAsync`(返回 promise + data)才能 await 拿到 messageList。

### 6.2 跨页签审批关闭

- A 页签审批(acp)→ 会话结束。
- B/C 页签 sub 流收到 `end_turn` → 消息变 Complete → acp 审批因「会话结束态」关闭。
- 前提:B/C 的 sub 流要能收到 end_turn;若 sub 卡住,审批不关 —— 可能需要 storage event 硬同步兜底。

---

## 7. PC(nuwax)关键文件

| 文件 | 职责 |
| --- | --- |
| `src/hooks/useResumeStreamHandlers.ts` | sub 订阅 handlers(两 model 共享):resumeConversationStream / abortResumeStream / ensureResumeAssistantPlaceholder |
| `src/components/business-component/UnifiedChatSession/hooks/useConversationStreamResume.ts` | 轮询/订阅编排状态机(ready、subscribe、stopPolling/startPolling) |
| `src/components/business-component/AgentIntervention/hooks/useActiveInterventionQueue.ts` | 审批队列:latestMessage 过滤 / executeId 过期 / 会话结束态(acp only) |
| `src/components/business-component/AgentIntervention/hooks/useAgentInterventionLayer.ts` | agentMode 同步(storage + 轮询) |
| `src/models/conversationInfo.ts` / `conversationAgent.ts` | 暴露 resumeConversationStream / abortResumeStream / runAsync |
| `src/utils/fetchEventSourceConversationInfo.ts` | 通用 SSE 连接器(createSSEConnection) |

---

## 8. nuwax-mobile 同步注意(uni-app x / uvue + uts)

| 概念 | PC | nuwax-mobile 对应 |
| --- | --- | --- |
| 轮询 | `useConversationStreamResume` + `useEventPolling` | `hooks/useEventPolling.uts`(已对齐,pollingWhenHidden 仅 H5) |
| 流式 SSE | `createSSEConnection`(fetch-event-source) | `utils/streamRequest.uts` + `sseDataProcessor.uts` |
| storage | `localStorage` + window `storage` 事件 | `uni.setStorageSync/getStorageSync`;跨页同步用 `uni.$emit`/eventBus 或 storage 轮询 |
| agentMode key | `nuwax_agent_mode_cache` | `AGENT_MODE`(`constants/common.constants.uts`) |
| 审批渲染 | DockPanel + 活跃队列(最新消息过滤/executeId) | `components/agent-intervention/`(消息流内联,**需补** latestMessage 过滤 / executeId 过期 / 会话结束态只关 acp 等判定) |
| 模式切换 | `useAgentInterventionLayer` | `subpackages/components/chat-input-phone`(已有 yolo/ask toggle + AGENT_MODE 缓存,**需补**跨页同步) |
| handleChangeMessageList 等价 | model 内 | `AgentDetailService.uts` SSE 回调 |

**同步要点**:

1. sub 接口订阅 + 占位重建逻辑要移植到 mobile 的 streamRequest/AgentDetailService。
2. 审批卡片显示判定(latestMessage 过滤、executeId、会话结束态区分 acp/ask)目前 mobile 内联渲染,需要补这些判定逻辑,避免历史审批闪烁、跨页签不关闭、ask-question 误关。
3. agentMode 跨页同步:mobile 无 window storage 事件,用 eventBus + storage 轮询模拟。
4. 轮询暂停条件(执行中 / hidden)对齐;mobile 的 hidden 处理(H5 用 document.hidden,小程序用 App.uvue onHide/onShow)。
