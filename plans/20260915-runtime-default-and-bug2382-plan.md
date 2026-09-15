<!--
nuwa-sdlc-kit v1.0.0 · content — 播种一次，本地所有（升级不覆盖）
-->

# 实施计划：禅道 bug2382 修复（会话名自动更新不调接口）

- 对应 spec：无（bug 修复；用户 2026-09-15 定调「只修 bug2382」，不动任何默认值）
- 状态：已接受

## 背景（定性证据）

- bug2382（赵立坤 2026-09-15）：PC 全栈/常规项目，项目名称和会话名称要分别更新。
  - 批注 ① 项目名称需要根据标记判断是否更新名称；批注 ② 会话名称没有调用接口更新。
- 实测（testagent，账号 ld）：侧栏/管理页**手动**改名两链路均正常发接口（项目按 projectType 标记路由：NormalProject→normal-project/update、 UserApp→userapp/update；子会话 →agent/conversation/update）。
- 批注 ② 根因（会话新线 runtime，代码实证）：`createConversationRuntimeSession.ts` 把 topic.update 分发放在 FINAL_RESULT 分支且要求 `firstEventOfConnection`—— 即 FINAL 必须是本连接**第一个**事件；正常流式回答前面必有 MESSAGE/THINK 事件，到 FINAL 时恒为 false → `/api/agent/conversation/update` 永不发出，会话名停留「新建会话」。旧线在**首个事件**到达即更名（updateTopicOnce），无此问题。

## 改动文件清单

| # | 文件 | 动作 | 说明 |
| --- | --- | --- | --- |
| 1 | src/features/conversation/runtime/createConversationRuntimeSession.ts | 改 | ①topic.update 分发移到 send() onMessage 首事件时点（每连接一次 armed 标志）② 闸门扩为「未更名过**或还没有名字**」 |
| 2 | src/features/conversation/react/runtimeLineHttp.ts | 改 | topic.update 去重改为按会话 ID 维护，避免同页命名首个会话后永久拦截其他会话；失败时释放当前 ID |
| 3 | src/models/conversationInfo.ts | 改 | updateTopicOnce 闸门同款扩展（`topicUpdated !== 1 \|\| !topic`） |
| 4 | src/pages/Chat/index.tsx | 改 | icon 补齐 effect 跳过无名会话（空 topic 的 update 会经共享 runUpdateTopic onSuccess 毒化 needUpdateTopicRef，抢跑杀死自动命名） |
| 5 | tests/conversationRuntimeSession.test.ts / tests/runtimeLineEffects.test.ts | 改 | 覆盖首事件触发、单会话去重、已命名/隔离入口闸门、预置无名会话及跨会话独立命名 |

## 明确不做（用户定调）

- mock-chat / 全局默认值切换（`CONVERSATION_RUNTIME_DEFAULT` 不动）。
- L6 三 effect 分发点（desktop.open / preview.file.refresh / taskResult.settle）保留为清单已知差异，本次不接线。
- 批注 ①（项目名称按标记判断）：手动改名已按 projectType 正确路由（实测），无前端缺陷点；待 testagent 干净复现定性，若为后端行为回禅道备注。

## 证明成立的测试

- 新增单测见上表 #5。
- 回归：`npx vitest run tests/conversationRuntimeSession.test.ts` → `npm run test:conversation` 全绿。
- testagent 复现验证：runtime 线经 `?conversationRuntime=1` 发首条消息，确认 `/api/agent/conversation/update` 发出且侧栏会话名更新。

## 风险与回退

| 风险 | 缓解 | 回退方式 |
| --- | --- | --- |
| topic.update 重复分发 | runtimeLineHttp 执行体自带会话级 needUpdateTopic 单次锁 + 后端 topicUpdated=1 | 还原本文件单点改动 |

## 偏离记录

- 2026-09-15：初版曾按「全局翻 runtime 默认」扩到 L6 接线 10 文件，用户纠正范围（「只修 bug2382」）后全部回退，仅保留本计划所列最小改动。
- 2026-09-15（实现中定性深化）：批注 ② 根因实为两层——
  1. `/api/project/create` 预建会话预置 `topicUpdated=1`+空 topic（「标记」的来源），前端两线的 `topicUpdated !== 1` 闸门被堵死；
  2. runtime 线另有 firstEventOfConnection 反置 bug（FINAL 分支要求 FINAL 为首事件）。另实证：自动发送（路由态首条消息）在两条线上都走 legacy model（Chat/index.tsx:710 直调 model onMessageSend，不经 runtime props 覆盖）；icon 补齐 effect 的空 topic update 会毒化共享 needUpdateTopicRef。故修复扩为上表 3 个文件，均最小行数。
- 验证证据（localhost dev，账号 ld）：
  - legacy 线：常规项目分类发送 → `{"id":1693174,"firstMessage":"帮我做一份周报模板"}` → 回包 topic「周报模板制作」+icon；随后 icon 补齐带新名字正常跟进；
  - runtime 线：无名预置会话输入框发送 → `{"id":1693172,"firstMessage":"总结要点三行"}` → 回包 topic「总结要点三行」；
  - mock-chat runtime 轨：chat 连接后 85ms 发出 update，整轮仅一次；
  - test:conversation 753 全绿（含新增 6 条 session 用例和 1 条跨会话 effect 用例）。
