# 会话模块维护指南（面向前端团队）

> 📚 文档总入口：[README.md](../README.md) 读者：维护会话模块的前端工程师。架构决策：[adr/conversation-runtime-refactor.md](../adr/conversation-runtime-refactor.md) 方案概要：[conversation-dual-track-plan.md](./conversation-dual-track-plan.md) 业务逻辑验收底稿（逐条 ID，含自动/人工验收映射）：[conversation-business-logic-checklist.md](./conversation-business-logic-checklist.md) 测试回归方案（提测/QA 用，含影响范围与改动点）：[conversation-regression-test-plan.md](./conversation-regression-test-plan.md) 本文只讲"怎么维护"。

## 1. 验证约定（必须遵守）

会话逻辑或会话测试路径（`src/models/conversation*`、`src/features/conversation/**`、`UnifiedChatSession/**`、`MessageQueue/**`、`src/pages/Chat/**` 等）的调整：

```bash
npm run test:conversation       # 合同网（每次改动必跑，当前规模见下文）
npm run e2e:conversation        # dev 已运行时验证受影响行为（合入前）
npm run verify:conversation     # 两网一键组合
```

用例规模与耗时以本次输出为准，不在维护指南复制历史计数。

纯文案、样式、注释和文档按影响范围验证；测试资产调整跑剩余全量，会话行为或保护网改变再跑相应 E2E。新增测试优先补独有的核心风险，不重复复制展示断言。

`test:conversation` 的参数按 Vitest **文件路径子串**匹配，并非目录列表。例如 `tests/resume` 同时覆盖 `tests/resumeController.test.ts` 和 `tests/resumeConsistencyController.test.ts`，不能因同名目录不存在就删除参数。调整过滤器前后应对比 Vitest JSON 报告中的 `testResults[].name`，确认收集文件集合一致。

**CI**：`.github/workflows/conversation-tests.yml` 在 PR/push 触及会话路径时自动跑合同网（pnpm 10.27 + Node 20 + frozen-lockfile，失败阻断合入）。E2E 需登录态不进 CI。

该约定已写入根目录 `AGENTS.md`。测试结果是回归证据；真实后端与客户端的未覆盖边界需单独说明。

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

- **旧线**（显式回退）：`src/models/conversationInfo.ts` / `conversationAgent.ts` —— 基线原版，禁止随意改动。
- **新线**（默认开启）：`runtime/createConversationRuntimeSession.ts` 为核心。
- 页面层禁止直接 import `domain/runtime/adapters`（eslint `no-restricted-imports`）；只消费 `react/*`。

## 3. 常见维护任务

电脑选择器的展示、锁定、项目继承与请求 `sandboxId` 传参，按 [Agent 容器选择与 sandboxId 传参逻辑](../agent-sandbox-selection-rules.md) 的类型和页面状态清单排查。首页创建、Agent 首页跳转与会话 chat 发送是不同阶段，不能用某一入口的默认值推断全部请求。

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
| 显式使用新线（当前默认） | `?conversationRuntime=1` |
| 用户级粘性 | `localStorage.conversation_runtime_enabled = '1'` / 删除回落 |
| 强制回旧线 | `?conversationRuntime=0` |
| **整体切默认** | `src/utils/conversationRuntimeFlag.ts` → `CONVERSATION_RUNTIME_DEFAULT = true` |

**切默认检查单**：两网全绿 → 五入口验证 → 团队确认。异常时改回 `false` 即整体回退。

**删除旧线**（终态）：先拆 model 非会话职责（文件树/VNC/变量/定时任务）→ 删会话实现 → 旧线测试退役。

## 5. 已知边界

- **类型检查**：使用分域 typecheck；全库历史诊断不作门，改动路径零新增。
- **umi 传递依赖**：`utils/common`、基线版 `constants/*` 经 i18nRuntime 拖入 umi——vitest 需 mock，纯模块避免直接依赖。
- **E2E 可靠会话**：女娲 3994、TaskAgent 1596、预览 Tab `/space/57/agent/3994`（TaskAgent 4042 的 Slate 编辑器在 E2E 中输入不生效，人工验证正常）。
- 诊断日志（`conversationPollingDiagnostics` / `conversationEffectsDiagnostics`）保留用于排障；effects 诊断只记摘要不记正文。

## 并发与终态维护约束

- 停轮询或取消定时器不能撤销已发出的 Promise。本地发送、切会话或轮次更新后，旧代际回包必须整段丢弃，不能写快照、终态或重新订阅。
- 后端任务状态、本地流式连接和工具展示状态分别维护；历史工具的 `EXECUTING` 不应单独锁住发送按钮。
- `FINAL_RESULT` / 明确终态 `ERROR` 经统一收尾路径清理占位消息、等待态与队列门。新轮发送恢复正常处理，旧轮终态与迟到分片不能覆盖新轮。
- 终态快照合并保留已确认的终态；消息 DOM 身份使用稳定 ID，避免收尾重挂载造成闪烁。
- 停止请求保留 live/sub 接收尾部，失败允许重试；不要恢复历史“点击停止立即 abort 并写 CANCEL”的做法。

排障优先查 `tests/conversation/sessionSnapshotTerminalGuard.test.ts`、`tests/useConversationStreamResume.test.ts`、`tests/useConversationTerminalFinalizer.test.ts` 和 `[Conv:` 日志。修复过程与当时的验收数字通过 Git 历史查询。
