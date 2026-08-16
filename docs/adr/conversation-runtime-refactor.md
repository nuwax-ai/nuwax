# ADR：会话运行时重构（conversation runtime refactor）

> 日期：2026-08-16 状态：已实施（Phase 0-6 落地，Phase 7 清理进行中）关联：[conversation-refactor-plan.md](../conversation-refactor-plan.md)、[conversation-business-logic-baseline.md](../conversation-business-logic-baseline.md)

## 背景与动机

`conversationInfo.ts`（主会话 model）宽而浅：数据查询、SSE 连接所有权、事件归并、消息身份、taskStatus 补偿、页面/文件/桌面/卡片副作用集中一处；`conversationAgent.ts` 为隔离复制了大量实现，语义持续漂移。同一业务事实（能否发送/停止/轮询）在 model、UnifiedChatSession、Queue、Resume Hook 多处重新推导。

## 决策

1. **深 Module 分层**（domain / runtime / adapters / react / testing），依赖方向不可反转：页面 → react 层（Provider/构建器）→ runtime（Runtime Factory + Controllers）→ domain（纯函数）。入口只允许 import `features/conversation/react/**` 与类型，禁止直接依赖 domain/runtime 内部文件。
2. **Runtime 实例制**：`createConversationRuntime` 每 model 一个实例，拥有跨 chunk 输出身份、live/sub 连接所有权（runId 隔离）、effects 分发器；`resumeController` 迁入 runtime 并去 React 化。
3. **Effects Seam + 分片 shadow→live**：副作用以 `ConversationEffect` 描述、入口注入 Adapter（mainChat 全量 / preview 隔离子集）。迁移期 dispatcher 的 `shadowEffectTypes` 允许已切 live 的 runtime 中新类型只记录不执行（防双发），对照一致后切 live 删旧路径。**所有新副作用一律走 effect 通道，不再往旧直调路径上实现。**
4. **入口零组合**：五个渲染入口经 `createConversationSessionModel` 构建会话 Props、`ConversationSessionProvider` 创建队列/干预派生态/Session View；`UnifiedChatSession` 拆 outer（外层 Provider 优先，无则自包兜底）+ inner（纯消费 Context）。干预回执、队列上下文全部由入口显式声明，组件与 Intervention 层不再默认读全局 model。
5. **不迁移决策**：perf 埋点与流式滚动属连接编排层时序遥测（双入口无子集差异，deletion test 不通过），不进 Effects Seam，归宿为 `runtime/trace.ts`（随 Runtime 接管连接编排收编）。

## 后果

- 正面：SSE 修复单点收口；隔离入口零复制；状态组合规则单点（selectors + Session View 合同测试）；副作用可按入口裁剪；迁移全程可按片回退对照（shadow journal + 逐片提交）。
- 代价：model 与 Runtime/Adapter 双轨并存（Phase 7 清理）；自包兜底路径保留期间存在两条 Provider 创建路径（行为等价，入口外提后兜底仅为兼容保险）。
- 待办：Runtime 接管 message state（snapshot 写回兼容回调届时删除）、双 model 外壳合并评估、shadow 诊断通道在最后一处迁移完成后下线。

## 验证基线

- 会话核心测试全绿（Phase 6 完成时 28 文件 / 246+ 条）；
- 全库 TypeScript 错误数与重构前基线一致（415，均为预存，改动路径为 0 新增）；
- 已知预存失败：`tests/messageQueueDisabled.test.ts` 2 例（重构开始前即失败，见 plan 文档 0.1 记录）。
