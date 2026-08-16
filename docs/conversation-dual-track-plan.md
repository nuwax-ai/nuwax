# 会话双线切换实施方案（Runtime 接管 message state + feature flag）

> 日期：2026-08-16 实施完成：2026-08-17（R1-R5 已落地于分支 refactor/conversation-dual-track，基于基线 c710ab296）前置：[conversation-refactor-plan.md](./conversation-refactor-plan.md)（Phase 0-7 已实施完成）、[adr/conversation-runtime-refactor.md](./adr/conversation-runtime-refactor.md) 最高约束：**这是已上线项目。重构全程不得影响线上业务；任何时刻必须可整体切换回旧线、可代码级回滚。**

## 1. 目标

建立**两条完整独立的会话实现线**，支持渐进式整体切换与对照：

```text
feature flag（入口级，默认 legacy）
  ├─ 旧线（legacy）：现有双 model 外壳（conversationInfo / conversationAgent）
  │   —— R1-R5 期间【零改动】，线上行为与当前完全一致
  └─ 新线（runtime）：Runtime 完全体
      —— 拥有 message state、连接编排、恢复/轮询编排、副作用分发
      —— 由既有纯件组合 + 少量新增件构成
```

切换粒度：入口级（五个渲染入口逐一选择），最终整体切换默认值。

## 2. 为什么当前还不是两条线（现状边界）

Phase 0-7 完成后，新体系（domain/runtime/adapters/react）已拥有：事件归并、连接 runId 所有权、全部副作用分发、Session View/Provider、入口状态组合。但：

- `messageList`/`conversationInfo` 状态仍是两个 model 的 useState；
- live SSE 的建立（`handleConversation`）与 `handleChangeMessageList` 的 UI 分支仍在 model；
- snapshot 写回仍是 `syncConversationSnapshotMessages` 兼容回调（原方案明确「等 Runtime 接管 message state 后删除」）。

即当前是「旧壳内嵌新核」的绞合单线：旧直调已删，无法运行时切回；回退粒度是 git 提交级，不是运行时开关级。本方案补齐最后一步，使其成为真正的双线。

## 3. 新线架构

### 3.1 复用件（已存在，零改动组合）

| 件 | 路径 | 在新线中的角色 |
| --- | --- | --- |
| 事件归并 reducers | `domain/reduce*.ts` | SSE 事件 → 消息投影 |
| 消息生命周期纯函数 | `domain/messageLifecycle.ts` | stop/error/finalize 清理 |
| 快照归并纯函数 | `models/conversationInfoMessageList.ts`（纯函数部分） | optimistic tail / snapshot merge |
| taskStatus 域 | `domain/taskStatus.ts` | 终态解析与合并 |
| Runtime Factory | `runtime/createConversationRuntime.ts` | 连接所有权 + effects + 流投影 |
| sub 恢复 Controller | `runtime/resumeController.ts` | sub 订阅编排 |
| 三个一致性 Controller | `runtime/*ConsistencyController.ts` | 快照代际/恢复门禁/终态确认 |
| 双 Effects Adapter | `adapters/*.ts` | 副作用执行 |
| Provider/构建器 | `react/*.tsx` | React 编排层（两线共用消费面） |

### 3.2 新增件（全部为新文件，不触碰旧线）

1. **`runtime/conversationMessageStore.ts`** —— 消息状态仓

   - 持有 `messages: MessageInfo[]`（非 React state）+ 版本号；
   - 订阅 API：`subscribe(listener)` / `getSnapshot()`（`useSyncExternalStore` 兼容）；
   - 写入 API（唯一写入口，全部返回新快照）：
     - `applyOptimisticRound(user, assistant)` —— 发送时乐观追加；
     - `applyStreamReduction(reduction)` —— SSE 投影写入；
     - `mergeSnapshot(incoming)` —— 轮询/恢复快照归并（USER 尾/乐观尾规则已在纯函数）；
     - `finalizeOnClose()` / `markStreamError(ownerId)` / `finalizeOwnedOnStaleClose(ownerId)`；
     - `patchIntervention(messageId, patch)`。
   - 合同：**新线内一切 messageList 变更必须经 store**——snapshot 兼容回调在新线天生不存在。

2. **`runtime/conversationTransport.ts`** —— SSE 传输建立

   - 从 model 的 `handleConversation` 平移 `createSSEConnection` 包装：URL/headers/body 组装、token 读取、perf 生命周期挂点（perf 按既定决策随编排收编至此，埋点调用逐字平移）；
   - 事件回调只向上抛 `{ runId, event }`，由 session 编排消费。

3. **`runtime/createConversationRuntimeSession.ts`** —— 新线核心（完整会话运行时）

   - 组合上述全部件 + store；
   - 对外 action（对齐旧线 model 暴露面）：
     - `send(input)`：乐观追加 → transport 建立 live → 事件投影循环 → effects 分发；
     - `stop()`、`load(conversationId)`、`loadMore()`、`clear()`、`respond(intervention)`；
     - `resume()`/`abortResume()`：sub 恢复（复用 resumeController）；
   - 轮询编排：复用 `react/useConversationStreamResume`（其输入 action 全部由本 session 提供）——首个版本不重写编排，只换数据源；去 React 化收编留到默认切换后；
   - 状态视图：`getSession()` 返回 Session View 所需输入（复用 `selectConversationSessionView`）。

4. **`react/useConversationRuntimeSession.ts`** —— React 绑定与线选择
   - `useSyncExternalStore(store.subscribe, store.getSnapshot)` 得到 messageList；
   - 产出与旧线 `chatSessionProps` **同形状**的 props（含 actions）——UnifiedChatSession/Provider 消费面已稳定，两线只做数据源替换；
   - 内部读 flag：不满足时返回 null，入口回落旧线。

### 3.3 flag 设计（可切换回滚的核心机制）

```ts
// utils/conversationRuntimeFlag.ts（新）
// 优先级：URL param > localStorage > 构建常量默认
//   ?conversationRuntime=1     —— 会话级临时试用
//   localStorage['conversation_runtime_enabled'] —— 用户级粘性
//   CONVERSATION_RUNTIME_DEFAULT = false          —— 发布默认（legacy）
```

- **默认 legacy**：不设 flag 时线上行为与今天完全一致（新线代码存在但不被入口消费）；
- 运行时切换：改 URL/localStorage 即在旧线/新线间整体切换，无需发版——这就是「整体切换对照」的操作面；
- 代码级回滚：新线全部为新文件，revert 新线提交不影响旧线任何一行。

## 4. 双轨对照机制（切换前的证据）

1. **测试双轨**：现有会话核心测试（model 线）+ 新增 `tests/conversationRuntimeSession.test.ts` 用 **同一 Trace fixtures** 断言：最终 message digest、taskStatus、effects 序列、请求次数与时机两线一致（复用 `tests/helpers/conversationTraceHarness.ts`，即原方案 §9.3 双轨对照的落地）。
2. **运行时 shadow**（R4 起，可选开启）：Chat 入口两线并行——旧线渲染，新线静默跑同一事件流，仅记录 digest 差异日志（只读对照，不写 UI）。差异为零是切默认的前置条件。
3. **验收门**（每片统一）：会话核心测试全绿、tsc 基线不变（413±）、**旧线文件 git diff 为零**、新片独立提交可 revert。

## 5. 分片计划（R1-R6，每片独立可发布可回退）

| 片 | 内容 | 旧线改动 | 切换能力 |
| --- | --- | --- | --- |
| R1 | messageStore + transport + 合同测试 | 零 | — |
| R2 | runtimeSession：send/stop 流程 + 事件投影 + effects（平移 `handleConversation`/`onMessageSend`/`handleChangeMessageList` 消息面） | 零 | — |
| R3 | snapshot/load/loadMore/intervention 写入收编 + sub 恢复/轮询接入 | 零 | — |
| R4 | `useConversationRuntimeSession` + flag 工具 + Chat 入口接线（`?conversationRuntime=1` 可试）+ 运行时 shadow 对照 | 零 | 首个入口可切换 |
| R5 | 其余四入口接线 + 测试双轨固化 + 浏览器验证清单（连续发送/长回答/工具/多输出/多页签/stop/Ask/ACP） | 零 | 五入口均可切换 |
| R6 | 默认值决策（切 runtime）→ 观察期 → **另立决策**删除旧 model 会话职责 | 届时评审 | 终态 |

## 9. 实施进度（2026-08-17，分支 refactor/conversation-dual-track）

- **R1 ✅** messageStore（update/replaceFromHistory 含 setState 形状兼容）+ transport（live/sub）+ 9 条合同测试。
- **R2 ✅** runtimeSession send 核心环（乐观 →transport→ 投影 →recent effects→stop/close/error 收尾，3s 保活与 superseded 保护对齐旧线）。
- **R3 ✅** load（loadRequest 注入 + 乐观尾保留 + 过期丢弃）/ applySnapshot（会话门禁）/ stopRequest 注入 / resumeController 挂载（live 与 sub 共用 applyStreamEvent）/ 事件分支 effects dispatch（page/link/card/suggest/topic gate）。
- **R4 ✅** `conversationRuntimeFlag`（URL>localStorage>默认 legacy，5 条优先级合同）+ `useConversationRuntimeSession` 绑定层（useSyncExternalStore 订阅、conversationProps 与旧线会话面同形状）+ `runtimeLineHttp`（services 单点 + effects adapter 组装：recent/list 自足、suggest/topic 直调、页面资源经 effectsResources 注入缺省忽略）+ Chat 入口接线。
- **R5 ✅** 其余四入口接线（PreviewAndDebug / PluginChatSession / AgentConversationChatPanel / ConversationAgentChatSession hook）+ `tests/conversationDualTrackParity.test.ts` 双轨 digest 对照（T01 核心 Trace）。
- **旧线零改动持续验证**：`src/models/` 与基线 diff 为 0；入口仅增量 flag 分派（展开空对象=原值原行为）。
- **已知差异**（新线 flag 开启时，R6 前需收口）：suggest 无防抖且列表未写回 UI；ERROR 时 conversationInfo.taskStatus 写回未接（taskExecuting 提示缺失）；「正在执行任务」冲突 modal 未迁；隔离入口 isSync=false 语义未透传（会发乐观列表标记）；load 的变量/预置问题/滚动 UI 面未接。
- **R6 浏览器验证（2026-08-17，ego-browser）已通过**：登录态会话「女娲 Nuwax」实测—— ① legacy 线发送：乐观追加（10→12）与流式收尾正常； ② runtime 线（?conversationRuntime=1）三轮发送：乐观追加、流式投影、回复内容与 legacy 逐字一致（「女娲 Nuwax 收到。」×3），无「正在执行」残留； ③ flag 行为：URL param 切换生效、去 param 回落 legacy 正常、localStorage 粘性生效后清除正常； ④ 侧栏会话项 active 态正常（执行中 spinner 形态的 DOM 类名探测不精确，标记生命周期由列表组件消费，非阻断）。
- **R6 剩余待办**：收口已知差异（§9 清单）→ TaskAgent/预览 Tab 等其余入口场景实测 → 默认值决策。

R6 明确不在本方案内一次完成：删旧线是独立发布动作，且 model 内非会话职责（文件树/VNC/变量/定时任务）需先行拆分，另案处理。

## 6. 风险与控制

| 风险 | 控制 |
| --- | --- |
| 新线行为与旧线存在微妙差异 | Trace 双轨 + 运行时 shadow digest 比对；差异必须归因并修复后才允许切默认 |
| flag 读取时机导致 hydration/首帧不一致 | flag 只在入口 hook 读取一次（useState 初始化），切换即整树重建会话区 |
| 双线并存期维护成本（同一修复改两处） | 并存期收敛在 R4-R6 短窗口；纯件（reducer/lifecycle/effects）两线共享，真正的双份仅「编排壳」 |
| 新线 useSyncExternalStore 与 React 18 并发特性 | 每次写入返回不可变新数组（现有纯函数已保证）；store 无中间态 |
| 误改旧线 | R1-R5 每片验收门含「旧线文件 git diff 为零」检查（scripts 校验） |

## 7. 与既有方案/ADR 的关系

- 本方案 = 原 plan「Runtime 接管 message state」待办的实施化 + ADR 待办第 1、3 条的落地路径；
- shadow→live 机制在 Effects 层的纪律延续到线级：**新线整体走「shadow 对照 → flag 灰度 → 默认切换 → 删旧」**；
- 完成后 ADR 增补「双线切换」决策记录。

## 8. 评审点（需要确认的决策）

1. flag 默认值与灰度策略（建议：构建常量默认 legacy，入口逐个验证后 R6 统一决策）；
2. 运行时 shadow 对照是否纳入 R4 必做（建议：纳入，成本低、证据价值高）；
3. 轮询编排首版复用 `react/useConversationStreamResume`（换数据源不重写）是否可接受（建议：接受，去 React 化收编移到默认切换后）；
4. R6 删旧线与 model 非会话职责拆分的立项时点。
