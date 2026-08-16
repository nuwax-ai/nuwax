# Nuwax Frontend

Nuwax 前端承载 Agent 的创建、执行与会话交互。本上下文先固定持久化 Agent 会话的领域语言，供会话运行时重构、测试和评审共同使用。

## Language

**会话（Conversation）**：由 `conversationId` 标识的持久化 Agent 交互记录。一个会话包含零个或多个轮次，并具有独立任务状态。 _Avoid_: 聊天实例、Session（除非专指前端 Session Facade）

**轮次（Turn）**：一条 USER 消息及其后续一个或多个 ASSISTANT 输出。轮次在前端可以先乐观存在，再逐步被持久化消息确认。 _Avoid_: 请求（Request 只表示一次传输或 requestId）

**live 流（Live Stream）**：当前页面因用户发送消息而主动建立的 Chat SSE。一个会话同一时刻至多有一个当前 live 流。 _Avoid_: 本地流、主流

**sub 流（Resume Stream）**：页面刷新、多页签或外部任务执行时，为重建 EXECUTING 会话输出而建立的恢复 SSE。sub 流与 live 流消费同类事件，但连接所有权不同。 _Avoid_: 重连（重连容易与同一连接的网络重试混淆）

**协议终态（Protocol Terminal）**：本轮 live 流收到 `FINAL_RESULT` 或协议 `ERROR` 的事实。普通 `MESSAGE finished=true` 和 UI 不再活跃都不是协议终态。 _Avoid_: 消息结束、UI 完成

**任务状态（Task Status）**：后端会话任务的 CREATE、EXECUTING、COMPLETE、CANCEL 或 FAILED 状态。任务状态与协议终态、消息状态是三个不同维度。 _Avoid_: 会话状态（含义过宽）

**消息状态（Message Status）**：单条消息的 Loading、Incomplete、Complete、Error 或 Stopped 展示状态。它不能单独决定会话任务是否结束。 _Avoid_: 任务状态

**乐观轮次（Optimistic Turn）**：发送瞬间由前端 UUID 创建、尚未被持久化消息确认的 USER 与 ASSISTANT 消息集合。 _Avoid_: 临时消息（容易与临时会话混淆）

**历史快照（Conversation Snapshot）**：会话详情读取返回的 taskStatus 与最近消息窗口。历史快照可能落后于 live 流，必须经过一致性策略后才能写入当前会话。 _Avoid_: 历史列表（历史列表专指分页消息）

**Intervention**： Agent 执行过程中需要用户响应的 ACP Permission 或 MCP Ask。Intervention 可以阻塞普通输入和队列消费，但不等同于任务终态。 _Avoid_: 弹窗、审批（审批只覆盖 ACP）

**最近使用（Recent Conversations）**：侧栏或会话记录中展示的会话摘要集合。它保存 taskStatus 的投影，不拥有当前会话运行时状态。 _Avoid_: 当前会话

## Flagged ambiguities

**Error 后队列行为**：当前 Implementation 允许 Error 后继续消费，部分测试仍要求暂停。重构 Phase 0 以已落地修复语义“Error 不永久阻断；用户主动停止才暂停”为合同，并保留显式回归测试。

**会话结束**：代码历史上可能表示消息 finished、UI active 下降、SSE close、协议终态或 taskStatus 终态。新代码必须使用上述精确术语，不再使用无修饰的“结束”作为状态判断。

## Example dialogue

> 开发：这一轮的 MESSAGE 已经 finished，可以读取历史快照了吗？  
> 领域同学：不可以。MESSAGE finished 只是消息状态变化；live 流仍未到协议终态。  
> 开发：收到 FINAL_RESULT 后，历史快照最后仍是 USER 怎么办？  
> 领域同学：拒绝该消息快照，保留乐观轮次；下一次一致性检查再确认持久化 ASSISTANT。  
> 开发：另一个页签发现 taskStatus=EXECUTING 呢？  
> 领域同学：先确认历史中已有对应 USER，再建立 sub 流恢复该轮次。
