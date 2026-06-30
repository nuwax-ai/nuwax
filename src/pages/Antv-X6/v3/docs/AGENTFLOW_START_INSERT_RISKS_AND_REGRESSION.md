# AgentFlow Start 中间插入：风险记录与最小回归清单

> 关联提交：`61fca4c8`（Start 第二条拖线 / 端口转发 / edgeSync）  
> 状态：**仅记录，暂不改动代码**  
> 更新：2026-06-30

---

## 1. 架构前提（减轻回归焦虑）

V3 保存走 **画布单源 + 整体提交**：

```
saveFullWorkflow → WorkflowSaveService.buildPayload(graph)
  → extractNodes（节点属性）
  → extractEdges（画布边）
  → computeConnections（从边重算 nextNodeIds / 分支配置）
  → saveWorkflow API
```

**含义**：

- 持久化的连接关系以 **保存时刻画布上的边** 为准，不依赖 proxy 某次 `addEdge` 是否事务完整。
- 编辑期 `workflowProxy` 主要服务即时 UI / 引用 / 防抖保存触发。
- **真正要守住的是画布拓扑**；proxy 与画布不同步时，自动保存可能按错误画布落库。

因此回归不必覆盖「所有 Workflow 全节点类型 × 全连线场景」，可 **AgentFlow 冒烟 + Workflow 零改动路径抽检**。

---

## 2. 影响范围速查

| 能力 | 仅 AgentFlow | 说明 |
| --- | :-: | --- |
| Start 第二条拖线 → 中间插入 | ✅ | `flowKind === AgentFlow` 守卫 |
| Start 端口点击 → 连线「+」转发 | ✅ | `resolveStartPortQuickAddRedirect` |
| `insertNodeBetween` / `purge*` | ✅ | 仅拖线插入路径调用 |
| `Edge already exists` 补画布 | ❌ | `useGraphInteraction`，Workflow 共用 |
| `handleTargetNodeConnection` 重构 | ⚠️ | 连线「+」Workflow/AgentFlow 共用，逻辑等价抽取 |
| KnowledgeInsert 描述同步 | ❌ | 按节点类型，与 flowKind 无关 |

**Workflow 回归建议**：不做全量；仅抽 1 条「连线 + 中间插入」冒烟即可。

---

## 3. 风险登记表

### P0 — 画布错误会被保存固化

| ID | 描述 | 触发场景 | 保存能否兜底 |
| --- | --- | --- | --- | --- |
| R-01 | proxy 有边、画布无边，`Edge already exists` | Start 拖线来回插入 | ❌ 按画布断链落库 |
| R-02 | 补画失败仍当成功（未校验 `graphCreateNewEdge`） | 同上 | ❌ | **工作区已有未提交修复** |
| R-03 | `insertNodeBetween` 失败但拖线临时边已 `remove` | AgentFlow Start 拖向已有节点 | ❌ |

### P1 — 拓扑/数据不符合产品预期

| ID | 描述 | 触发场景 | 保存能否兜底 |
| --- | --- | --- | --- |
| R-04 | 中间节点 **全部 incident 边被清掉** | Start→A，拖向已有 `X→B→Y` 的 B | ❌ 会按新画布落库 |
| R-05 | `findStartOutgoingEdge` 只取第一条 Start 出边 | 异常双出边残留 | ❌ 非确定性 |
| R-06 | 拖向 End / 原后继静默拒绝 | validateConnection 返回 false 无提示 | — UX |

### P2 — 编辑期体验 / 原有问题，非本次引入

| ID | 描述 | 说明 |
| --- | --- | --- |
| R-07 | 连线「+」先连后删，无事务 | 画布最终正确即可；保存可重算 proxy 连接 |
| R-08 | 异常端口被 `isSpecialPort` 误判 | 异常边「+」插入可能删不干净 |
| R-09 | `handleTargetNodeConnection` 无返回值 | 失败无法回滚已加节点 |
| R-10 | `removeSourceToTargetEdge` 失败日志变简略 | 排查成本略增 |

### P3 — 工程/流程

| ID   | 描述                                                            |
| ---- | --------------------------------------------------------------- |
| R-11 | 单测未覆盖 `insertNodeBetween` / `useGraphInteraction` 补画分支 |
| R-12 | commit 混入 KnowledgeInsert 改动，revert 需人工拆分             |

---

## 4. 已有自动化覆盖（可少测部分）

以下 **不必手工重复验证逻辑分支**（vitest 已通过）：

| 模块 | 文件 | 覆盖点 |
| --- | --- | --- |
| flowKindRules | `flowKind/__tests__/flowKindRules.test.ts` | `shouldBlockStartOutgoing`、`findStartOutgoingEdge`、Workflow 不介入 |
| startInsertHandlers | `agentFlow/__tests__/startInsertHandlers.test.ts` | 端口 redirect、拖线拒绝/放行、拖线插入调用链 |
| edgeSync | `agentFlow/__tests__/edgeSync.test.ts` | `purgeEdgeBetween`、`purgeNodeIncidentEdges` |
| middleNodeEdgeCleanup | `agentFlow/__tests__/middleNodeEdgeCleanup.test.ts` | incident 边清理 |

**仍缺自动化、只能手工或后续补测**：

- `insertNodeBetween` 端到端拓扑
- 画布 + 保存后刷新一致性
- Workflow 连线「+」回归（1 条冒烟即可）

---

## 5. 最小回归清单（建议 ≤15 分钟）

### 5.1 AgentFlow 必测（7 项）

| # | 操作 | 期望 |
| --- | --- | --- |
| A1 | `Start→A`，从 Start **再拖线**到孤立节点 B | `Start→B→A`，无 `Edge already exists` |
| A2 | A1 后 **反向再拖**一次（来回 2 ～ 3 次） | 画布边可见，保存后刷新仍正确 |
| A3 | `Start→A`，点击 Start **out 端口** | 弹出 Stencil，插入后拓扑等价连线「+」 |
| A4 | `Start→A`，拖向 **A（原后继）** | 拒绝连接 |
| A5 | `Start→A`，拖向 **End** | 拒绝连接 |
| A6 | 连线上点 **「+」** 插入新节点 C | `Start→C→A`（或等价），Workflow 行为与改前一致 |
| A7 | 任一项操作后 **手动保存 → 刷新页面** | 拓扑与节点属性一致 |

### 5.2 Workflow 抽检（2 项，非 AgentFlow 画布）

| #   | 操作                                   | 期望                          |
| --- | -------------------------------------- | ----------------------------- |
| W1  | 普通节点连线上 **「+」** 插入          | 中间多一节，旧边拆掉          |
| W2  | Start **多条出边**仍可建（若产品允许） | 不受 AgentFlow 单出口逻辑影响 |

### 5.3 明确可不测（本轮）

- 全节点类型 × 全端口组合
- Loop / 异常端口 / RouteDecision 与 Start 插入交叉（除非日常就用）
- KnowledgeInsert 描述（除非本轮也发版该需求）
- 撤销/重做全路径
- 多端/并发编辑

---

## 6. 产品决策待确认（影响 R-04 / R-06）

| 问题 | 选项 |
| --- | --- |
| Start 第二条拖线目标 **已有其他入/出边** | A. 允许，但清掉 B 的其他边；B. 拒绝并提示 |
| 拖向 End / 原后继 | 是否补充 `message.warning` |

未确认前，**A1/A2 只用孤立节点 B** 做冒烟，避开 R-04。

---

## 7. 后续加固优先级（记录，不实施）

1. **P0**：`graphCreateNewEdge` 返回值校验（工作区已有草稿）
2. **P1**：`insertNodeBetween` 单测或集成测 1 条
3. **P1**：拖线插入失败时用户提示 / 画布恢复
4. **P2**：保存前 AgentFlow Start 单出口校验（可选）
5. **P3**：`Edge already exists` 补画仅 AgentFlow（若要求 Workflow 零行为变化）

---

## 8. 相关文件索引

| 文件 | 职责 |
| --- | --- |
| `agentFlow/startInsertHandlers.ts` | 拖线/端口 AgentFlow 入口 |
| `hooks/useNodeOperations.ts` | `insertNodeBetween`、`handleTargetNodeConnection` |
| `agentFlow/edgeSync.ts` | proxy/画布边对齐 |
| `hooks/useGraphInteraction.ts` | `Edge already exists` 补画 |
| `services/WorkflowSaveService.ts` | 保存时 `computeConnections` |
| `flowKind/flowKindRules.ts` | AgentFlow Start 单出口 |
