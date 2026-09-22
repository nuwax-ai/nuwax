# bug2477 残留修复：进页自动发送切 runtime 线（app-pro / ConversationAgent / 插件三入口）

- 日期：2026-09-21
- 禅道：bug2477（PC 全栈应用发送会话后跳详情页，等一会儿才显示收发消息）
- 关联：614151a88（调用次数收敛，本单不重复其工作）、Chat 页 9-16 修法 3033be9a6

## 根因

进页自动发送调用 V1 model 的 `onMessageSend`，乐观消息与 SSE 流式回复写入 V1 messageList；但 V2 默认下面板 `conversationProps` 末位覆盖，渲染的是 runtime store——两边不通，只能等 5s 快照轮询从后端捞回，表现为「发送后等一会儿才显示收发消息」。

## 全仓排查结论

| 入口 | 结论 |
| --- | --- |
| AppDevPro 左面板 | 同款 bug（自动发送 :550 走 V1，面板 :253 渲染 V2） |
| ConversationAgent 左面板 | 同款 bug（:457 / 面板 :236） |
| 插件 PluginChatSession | 同款 bug（自动发送 :115 走 V1，渲染 :270 读 V2；projectCreateStrategy 插件分支可达） |
| EditAgent 预览调试 / ConversationAgent 右轨 / 技能会话页(经 ChatCore) / OpenApp(跳 Chat 页) / MockChat 示例 / 优化三弹窗 | 安全（发送与渲染同线） |
| chat-temp | 用户明确排除，不动 |

## 改动清单

1. `src/hooks/useInitialConversationAutoSend.ts`：新增可选参数 `runtimeSession`；发送处二分（session 存在 → `session.send(...)`，映射对齐 Chat/index.tsx:770-783；否则原 V1 不动）。
2. `src/pages/AppDevPro/index.tsx`：页面级 `useConversationRuntimeSession({ conversationId: queryConversationId, getSandboxId, effectsResources: {} })`；hook 传 `runtimeSession`；面板下传 `runtimeLine`。
3. `src/pages/AppDevPro/AgentConversationChatPanel/index.tsx`：新增 prop `runtimeLine`，删除内部自建 session。
4. `src/pages/ConversationAgent/index.tsx` + 其 `AgentConversationChatPanel`：同构改造。
5. `src/pages/SpacePluginTool/components/PluginChatSession/index.tsx`：自动发送切 `session.send`； runtime options 补 `getSandboxId`（否则切线后请求体丢 sandboxId，连带修复 V2 手动发送丢参）。
6. `src/features/conversation/react/useConversationRuntimeSession.ts`：会话切换 effect 的 load 链补 `.catch(console.error)`（外提后 URL id 无效时防 unhandled rejection）。

## 竞态安全（已核实）

- `replaceFromHistory` 经 `preserveOptimisticMessageTail` 保留乐观尾，load 晚于 send 不吞消息；
- 页面级 load 与预查询同瞬间的详情请求被服务层单飞合并为一发；
- flag 关（`?conversationRuntime=0`）时 session 为 null，全部回落 V1 原路径。

## 不做的事（登记备查）

- EditAgent 预览调试 V2 覆盖后丢 `infos/variableParams/debug:true`、ConversationAgent 右轨 queueContext/getSandboxId 仍 V1 口径——参数损耗非渲染错位，不在本次范围；
- G1 整页 Loading 门（亚秒级）不动；chat-temp 不动；614151a88 的收敛机制不动。

## 验证

- 单测：`useInitialConversationAutoSend` runtime/V1 二分+参数映射；PluginChatSession 既有自动发送测试更新。
- 质量门：`npm run test:conversation` 全绿；tsc 触达路径零新增；`npm run lint:arch`。
- dev 走查：首页全栈上框发送 → app-pro 首条消息与回复立即可见；插件分支同样； app-pro 内切换会话正常；`?conversationRuntime=0` 回退 V1 自动发送仍正常。

## 2026-09-22 接管补修：迟到首发的会话归属

- 独立复现：A 的首发前详情查询挂起，切到 B 并完成首发，再返回 A 的空快照；原 hook 仍向共用 runtime 发送 A，覆盖当前会话并中断 B 的流。卸载后也会继续自动发送（V1/V2 均受影响）。
- 最小修复：共享自动首发 hook 在会话离开/卸载时使请求代际失效，await 后同时核对请求代际与最新会话 ID；普通 render 的回调引用变化不取消有效首发，重新进入同一 ID 可重新查询。
- 验证：延迟 A→B、A→B→A、V1/V2 卸载、同会话 pending render 与 StrictMode 复放；既有参数映射/失败兜底仍保留。跑共享 hook 定向与会话合同网，由集成方补部署后的真实全栈首发/切换验收。
