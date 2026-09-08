# 会话模块维护指南（面向前端团队）

> 📚 文档总入口：[README.md](./README.md) 读者：维护会话模块的前端工程师。架构决策：[adr/conversation-runtime-refactor.md](./adr/conversation-runtime-refactor.md) 方案概要：[conversation-dual-track-plan.md](./conversation-dual-track-plan.md) 业务逻辑验收底稿（逐条 ID，含自动/人工验收映射）：[conversation-business-logic-checklist.md](./conversation-business-logic-checklist.md) 测试回归方案（提测/QA 用，含影响范围与改动点）：[conversation-regression-test-plan.md](./conversation-regression-test-plan.md) 本文只讲"怎么维护"。

## 1. 验证约定（必须遵守）

任何会话相关路径（`src/models/conversation*`、`src/features/conversation/**`、`UnifiedChatSession/**`、`MessageQueue/**`、`src/pages/Chat/**` 等）的调整：

```bash
npm run test:conversation       # 合同网 33 文件 292 条（秒级，每次改动必跑）
npm run dev && npm run e2e:conversation   # 页面 E2E 8 场景（合入前）
npm run verify:conversation     # 两网一键组合
```

**CI**：`.github/workflows/conversation-tests.yml` 在 PR/push 触及会话路径时自动跑合同网（pnpm 10.27 + Node 20 + frozen-lockfile，失败阻断合入）。E2E 需登录态不进 CI。

该约定已写入 `CLAUDE.md`。两网全绿 = 会话功能未受影响。

## 2. 架构速查

```
src/features/conversation/
├── domain/      纯函数（事件 reducer、消息生命周期、快照归并、taskStatus、selectors、SessionView）
├── runtime/     非视图编排（连接 runId、resumeController、一致性 controllers、
│                effectDispatcher；新线：messageStore / transport / runtimeSession）
├── adapters/    旧线 effects adapter（mainChat / preview）
└── react/       React 层（ConversationSessionProvider、createConversationSessionModel、
                 新线绑定 useConversationRuntimeSession + runtimeLineHttp、轮询编排）
```

- **旧线**（默认）：`src/models/conversationInfo.ts` / `conversationAgent.ts` —— 基线原版，禁止随意改动。
- **新线**（flag 开启）：`runtime/createConversationRuntimeSession.ts` 为核心。
- 页面层禁止直接 import `domain/runtime/adapters`（eslint `no-restricted-imports`）；只消费 `react/*`。

## 3. 常见维护任务

### 3.1 新增副作用

1. `runtime/effectDispatcher.ts` → `ConversationEffect` 加成员；
2. `utils/conversationEffectsDiagnostics.ts` → `summarizeEffect` 加分支（不保存用户正文）；
3. 执行体：旧线 `adapters/mainChatEffectsAdapter.ts`；新线 `react/runtimeLineHttp.ts`；
4. dispatch 点：旧线在 model 事件分支；新线在 `runtimeSession` 的 `applyStreamEvent`；
5. 测试：`tests/conversationEffects.test.ts` + `tests/runtimeLineEffects.test.ts` 各加合同。

### 3.2 新增会话渲染入口

1. 调用 `useConversationRuntimeSession({ conversationId, effectsResources, isSync })`；
2. **`...(runtimeLine?.conversationProps ?? {})` 放 props 末尾**（放前面会被旧线字段覆盖——踩过的坑）；
3. 页面资源经 `effectsResources` 注入；
4. 在 `scripts/e2e/conversation-acceptance.mjs` 加 E2E 场景。

### 3.3 修复两线共有 bug

优先修共享纯件（domain/、resumeController、messageStore）——一处修复两线受益。编排层差异时分别改 model 与 runtimeSession；改完跑 `tests/conversationDualTrackParity.test.ts` 确认 digest 一致。

### 3.4 新增 E2E 场景

在 `scripts/e2e/conversation-acceptance.mjs` 复制 `scenario(...)` 块：`probeLine()` 判定线归属、`countMessages()` 断言行数、`waitForStreamSettled()` 等收尾。消息带 `[E2E验收]` 前缀。

## 4. 双线 flag 运维

| 操作 | 方法 |
| --- | --- |
| 临时试用新线 | `?conversationRuntime=1` |
| 用户级粘性 | `localStorage.conversation_runtime_enabled = '1'` / 删除回落 |
| 强制回旧线 | `?conversationRuntime=0` |
| **整体切默认** | `src/utils/conversationRuntimeFlag.ts` → `CONVERSATION_RUNTIME_DEFAULT = true` |

**切默认检查单**：两网全绿 → 五入口验证 → 团队确认。异常时改回 `false` 即整体回退。

**删除旧线**（终态）：先拆 model 非会话职责（文件树/VNC/变量/定时任务）→ 删会话实现 → 旧线测试退役。

## 5. 已知边界

- **tsc 预存**：全库 ~415 个类型错误（与会话无关），验收标准是"改动路径零新增"；用 `npm run test:conversation` 做门。
- **umi 传递依赖**：`utils/common`、基线版 `constants/*` 经 i18nRuntime 拖入 umi——vitest 需 mock，纯模块避免直接依赖。
- **E2E 可靠会话**：女娲 3994、TaskAgent 1596、预览 Tab `/space/57/agent/3994`（TaskAgent 4042 的 Slate 编辑器在 E2E 中输入不生效，人工验证正常）。
- 诊断日志（`conversationPollingDiagnostics` / `conversationEffectsDiagnostics`）保留用于排障；effects 诊断只记摘要不记正文。
