# ADR：会话运行时重构（绞合式 Phase 0-7 + 双线切换）

> 📚 文档总入口：[conversation-docs-index.md](../conversation-docs-index.md) 日期：2026-08-16 ~ 2026-08-17 状态：**已全部完成**（Phase 0-7 + 双线 R1-R6 + 回归网 + CI）关联：[conversation-dual-track-plan.md](../conversation-dual-track-plan.md)、[conversation-maintenance-guide.md](../conversation-maintenance-guide.md)

## 背景与动机

`conversationInfo.ts`（主会话 model）宽而浅：数据查询、SSE 连接所有权、事件归并、消息身份、taskStatus 补偿、页面/文件/桌面/卡片副作用集中一处；`conversationAgent.ts` 为隔离复制了大量实现，语义持续漂移。同一业务事实（能否发送/停止/轮询）在 model、UnifiedChatSession、Queue、Resume Hook 多处重新推导。

## 决策（两阶段）

### 阶段一：绞合式迁移（Phase 0-7，分支 refactor/conversation-runtime）

1. **深 Module 分层**（domain / runtime / adapters / react），依赖方向不可反转：页面 → react 层 → runtime → domain。
2. **Runtime 实例制**：`createConversationRuntime` 每 model 一个实例，拥有跨 chunk 输出身份、live/sub 连接所有权（runId 隔离）、effects 分发器。
3. **Effects Seam + 分片 shadow→live**：副作用以 `ConversationEffect` 描述、入口注入 Adapter。所有副作用走 effect 通道。
4. **入口零组合**：五入口经 `createConversationSessionModel` / `ConversationSessionProvider`，组件不自行组合状态。
5. **不迁移决策**：perf 埋点与流式滚动属连接编排层时序遥测，不进 Effects Seam。

### 阶段二：双线切换（R1-R6，分支 refactor/conversation-dual-track，基于基线 c710ab296）

阶段一的问题：旧直调已删、无法运行时切回。双线方案补齐为两条完整独立的线：

- **旧线**（legacy，默认）：基线原版 model，零改动；
- **新线**（runtime）：`createConversationRuntimeSession` 拥有 message state（store）、连接编排（transport）、恢复/轮询编排、副作用分发，经 `useConversationRuntimeSession` 绑定层产出与旧线同形状的 conversationProps；
- **flag**：URL `?conversationRuntime=1` > localStorage > 默认 legacy（`CONVERSATION_RUNTIME_DEFAULT`）——运行时整体切换/回退，无需发版。

## 后果

- 正面：两线可整体切换（flag）、可代码回滚（新线全为新文件）；292 条合同网 + 8 场景 E2E 回归保障；CI 自动守门。
- 代价：双线并存（默认切 runtime 后删除旧线）；双线维护（共享纯件，编排壳双份）。
- 终态待办：切默认 → 观察期 → 拆分 model 非会话职责（文件树/VNC/变量）→ 删旧线。

## 验证基线（截至 2026-08-17）

- `npm run test:conversation`：33 文件 292 条，全绿
- `npm run e2e:conversation`：8 场景，全绿（需 dev server + ego-browser 登录态）
- 全库 TypeScript 错误 415（预存基线，改动路径零新增）
- CI：`.github/workflows/conversation-tests.yml` 自动跑合同网
