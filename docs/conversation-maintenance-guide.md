# 会话模块维护指南（面向前端团队）

> 读者：维护会话模块的前端工程师。架构决策见 [adr/conversation-runtime-refactor.md](./adr/conversation-runtime-refactor.md)；双线方案与进度见 [conversation-dual-track-plan.md](./conversation-dual-track-plan.md)。本文只讲"怎么维护"。

## 1. 改动前必须知道的验证约定

任何会话相关路径（`src/models/conversation*`、`src/features/conversation/**`、`UnifiedChatSession/**`、`MessageQueue/**`、`src/pages/Chat/**` 等）的调整：

```bash
npm run test:conversation       # 合同网 292 条（秒级，每次改动必跑）
npm run dev                     # E2E 前置
npm run e2e:conversation        # 真实页面 7 场景（发版前/合入前）
npm run verify:conversation     # 两网组合
```

该约定已写入 `CLAUDE.md`（AI 协作同样受约束）。两网全绿 = 会话功能未受影响。

## 2. 架构速查（改哪里）

```
src/features/conversation/
├── domain/      纯函数（事件 reducer、消息生命周期、快照归并、taskStatus、selectors、SessionView）
├── runtime/     非视图编排（连接 runId 所有权、resumeController、一致性 controllers、
│                effectDispatcher、新线：messageStore / transport / runtimeSession）
├── adapters/    旧线 effects adapter（mainChat / preview，由 conversationInfo model 消费）
└── react/       React 层（ConversationSessionProvider、createConversationSessionModel、
                 新线绑定 useConversationRuntimeSession + runtimeLineHttp、轮询编排）
```

- **旧线**（默认）：`src/models/conversationInfo.ts` / `conversationAgent.ts` —— 基线原版，**禁止随意改动**（这是可回滚的根基；修 bug 时同步评估新线是否需要同样修复）。
- **新线**（flag 开启）：`runtime/createConversationRuntimeSession.ts` 为核心。
- 页面层**禁止**直接 import `domain/runtime/adapters`（eslint `no-restricted-imports` 强制）；只消费 `react/*`。

## 3. 常见维护任务

### 3.1 新增一个副作用（如新的列表同步/页面行为）

1. `runtime/effectDispatcher.ts` 的 `ConversationEffect` 联合类型加成员（附注释说明语义）；
2. `utils/conversationEffectsDiagnostics.ts` 的 `summarizeEffect` 加分支（**不保存用户正文**，只记定位字段）；
3. 执行体：
   - 旧线：`adapters/mainChatEffectsAdapter.ts`（全量）与/或 `previewEffectsAdapter.ts`（隔离子集）；
   - 新线：`react/runtimeLineHttp.ts` 的 `createRuntimeLineEffectsAdapter`（自足或经 `resources` 注入页面资源）；
4. dispatch 点：旧线在 model 的事件分支；新线在 `runtimeSession` 的 `applyStreamEvent`；
5. 测试：`tests/conversationEffects.test.ts`（旧线）+ `tests/runtimeLineEffects.test.ts`（新线）各加合同。

### 3.2 新增一个会话渲染入口（新页面）

参考五个既有入口（Chat / ConversationAgent 预览 / AgentConversationChatPanel / EditAgent PreviewAndDebug / Plugin）的接线模式：

1. 入口文件调用 `useConversationRuntimeSession({ conversationId, effectsResources, isSync })`；
2. **把 `...(runtimeLine?.conversationProps ?? {})` 放在传给 UnifiedChatSession 的 props 末尾**（顺序是接管语义的关键，放前面会被旧线字段覆盖——这是踩过的坑）；
3. 页面资源（卡片/桌面/文件树函数）经 `effectsResources` 注入；
4. 在 `scripts/e2e/conversation-acceptance.mjs` 加一个 E2E 场景，并考虑 `package.json` 的 `test:conversation` 清单是否需要补测试文件。

### 3.3 修复两线共有的 bug

优先修**共享纯件**（domain/、resumeController、messageStore 等）——一处修复两线受益。只有编排层差异时才分别改 model 与 runtimeSession；改完跑双轨 parity（`tests/conversationDualTrackParity.test.ts`）确认两线 digest 仍一致。

### 3.4 新增 E2E 验收场景

在 `scripts/e2e/conversation-acceptance.mjs` 里复制一个 `scenario(...)` 块：用 `probeLine()` 判定线归属、`countMessages()` 断言行数、`waitForStreamSettled()` 等流式收尾。测试消息带 `[E2E验收]` 前缀，发到测试智能体。

## 4. 双线 flag 运维

| 操作 | 方法 |
| --- | --- |
| 临时试用新线 | URL 加 `?conversationRuntime=1` |
| 用户级粘性 | `localStorage.conversation_runtime_enabled = '1'` / 删除回落 |
| 强制回旧线 | `?conversationRuntime=0`（压过 localStorage） |
| **整体切默认** | `src/utils/conversationRuntimeFlag.ts` 的 `CONVERSATION_RUNTIME_DEFAULT = true`（单行，可随时回滚） |

**切默认前检查单**：预览 Tab 人工验证过 → 两网全绿 → 团队确认。切默认后观察期发现异常：改回 `false` 即整体回退，无需发版回滚代码。

**删除旧线**（终态，另立决策）：需先拆分 `conversationInfo.ts` 里的非会话职责（文件树 / VNC 桌面 / 变量 / 定时任务弹窗）到独立 model/hook，再删会话实现。删除前 `test:conversation` 里的旧线测试同步退役。

## 5. 已知边界与注意点

- **tsc 预存错误**：全库 ~415 个预存类型错误（与会话无关，集中在 Intervention 测试/Antv-X6 等），验收标准是"改动路径零新增"而非清零；清理建议另立专项。
- **umi 传递依赖坑**：`utils/common`、`constants/*`（基线版）经 i18nRuntime 拖入 umi，非 umi 测试环境（vitest）顶层 import 即崩——新加的纯模块避免依赖它们，测试里按既有文件同法 mock。
- **vitest 是门**：不要用 `tsc --noEmit` 做会话改动验收（预存错误噪音），用 `npm run test:conversation`。
- 诊断日志（`conversationPollingDiagnostics` / `conversationEffectsDiagnostics`）保留用于线上排障；effects 诊断只记摘要不记正文。
