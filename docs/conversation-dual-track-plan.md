# 会话双线切换方案（Runtime 接管 message state + feature flag）

> 日期：2026-08-16 ~ 2026-08-17（已全部实施）分支：`refactor/conversation-dual-track`（基于基线 `c710ab296`）架构决策：[adr/conversation-runtime-refactor.md](./adr/conversation-runtime-refactor.md) 维护操作：[conversation-maintenance-guide.md](./conversation-maintenance-guide.md) 最高约束：**已上线项目，重构全程不得影响线上业务，任何时刻可整体切换/回退。**

## 1. 架构

```text
feature flag（入口级，默认 legacy = false）
  ├─ 旧线（legacy）：基线原版双 model（conversationInfo / conversationAgent）
  │   —— 零改动，线上行为与基线完全一致
  └─ 新线（runtime）：Runtime Session 完全体
      └── react/useConversationRuntimeSession.ts（绑定层）
          └── runtime/createConversationRuntimeSession.ts（核心）
              ├── runtime/conversationMessageStore.ts   消息状态仓（useSyncExternalStore）
              ├── runtime/conversationTransport.ts       SSE 建立（live/sub）
              ├── runtime/resumeController.ts            sub 恢复编排
              ├── runtime/createConversationRuntime.ts   连接 runId + effects 分发
              └── react/runtimeLineHttp.ts               HTTP + effects adapter
```

五入口接线：Chat（`src/pages/Chat/index.tsx`）、ConversationAgent 预览 Tab（`useConversationAgentChatSession.ts`）、AgentConversationChatPanel、EditAgent PreviewAndDebug、Plugin（`PluginChatSession`）——均为 `...(runtimeLine?.conversationProps ?? {})` 置于 props **末尾**（flag off 时空对象不影响旧线）。

## 2. flag

| 级别 | 方法 |
| --- | --- |
| URL | `?conversationRuntime=1` / `?conversationRuntime=0` |
| localStorage | `conversation_runtime_enabled = '1' / '0'` |
| 默认 | `CONVERSATION_RUNTIME_DEFAULT = false`（`src/utils/conversationRuntimeFlag.ts`） |

优先级：URL > localStorage > 默认。切默认：改 `CONVERSATION_RUNTIME_DEFAULT = true`（单行可回滚）。

## 3. 已完成（R1-R6）

| 片 | 内容 | 状态 |
| --- | --- | --- |
| R1 | messageStore + transport + 合同测试 | ✅ |
| R2 | session send 核心环（乐观 →SSE→ 投影 →effects→ 收尾） | ✅ |
| R3 | load / applySnapshot / stop / resume / 事件分支 effects | ✅ |
| R4 | flag + 绑定层 + Chat 入口接线 | ✅ |
| R5 | 其余四入口 + 双轨 parity 测试 | ✅ |
| R6 | 已知差异收口（suggest/topic/taskStatus/冲突/isSync/loadMore/干预/置底/参数面）+ 覆盖顺序修正 + 浏览器验证 | ✅ |

**R6 剩余**：默认值决策（团队确认后切 `CONVERSATION_RUNTIME_DEFAULT = true`）。

## 4. 回归保障体系

| 层 | 命令 | 规模 | 前置 |
| --- | --- | --- | --- |
| 合同网 | `npm run test:conversation` | 33 文件 292 条 | 无（秒级） |
| 页面 E2E | `npm run e2e:conversation` | 8 场景 | dev server + ego-browser |
| 组合 | `npm run verify:conversation` | 两网 | 同上 |
| CI | `.github/workflows/conversation-tests.yml` | 合同网 | pnpm + Node 20 |

E2E 场景：登录态、legacy 发送、runtime 发送（fiber 探针判定线归属）、runtime 加载更多、flag 回落、flag 粘性、TaskAgent 思考流、预览 Tab（隔离入口）。

## 5. 旧线零改动验证

```bash
git diff c710ab296 --name-only -- src/models/ | wc -l   # 结果 = 0
```

## 6. 关键实现细节（团队维护需知）

- **覆盖顺序**：`conversationProps` 展开必须在 props 对象**末尾**（放前面会被旧线字段覆盖，这是踩过的坑）。
- **isSync 语义**：隔离入口（ConversationAgent 预览）传 `isSync: false`，统一经 `topicGate.isSync` gate 乐观列表标记 / topic 更新 / onClose 列表刷新。
- **taskStatus 写回**：session 的 `applyTaskStatus` 通道统一处理 ERROR / onError / onClose 兜底 / FINAL 四处。
- **suggest 防抖**：runtimeLineHttp adapter 内 300ms trailing（对齐旧线 `debounceWait: 300`）。
- **干预回执**：绑定层 `useAgentInterventionHandlers` 写入经 `storeAsDispatch` 走新线 store。
- **冲突确认**：`conflict.confirmStop` effect，绑定层 modalConfirm 实现。

## 7. 已知边界

- TaskAgent 4042 会话在 E2E 中 Slate 编辑器输入不生效（非 runtime 线 bug，手动调用正常）——E2E 可靠测试会话：女娲 3994、TaskAgent 1596、预览 Tab `/space/57/agent/3994`。
- tsc 全库 415 预存错误（改动路径零新增即合格），验收用 `npm run test:conversation` 而非 `tsc --noEmit`。
- umi 传递依赖：`utils/common`、基线版 `constants/*` 经 i18nRuntime 拖入 umi——vitest 测试需 mock，纯模块避免直接依赖。
