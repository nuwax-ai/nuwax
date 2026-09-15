# 实施计划：AppDevPro 首条消息与工具选中态修复（禅道 bug2352）

- 状态：已实施，待与 bug2382/调试面板备注分批提交

## 问题与根因

1. AppDevPro 进页查询会话与自动发送共用 `conversationInfo.runAsync`；该 `useRequest` 带 300ms 防抖，并发时被取消调用的 Promise 不 resolve，首条消息会挂起。
2. AppDevPro 对话面板未维护 `selectedComponentList`，导致首页透传选中态丢失、 chip 无法交互，手动发送始终携带全量 `manualComponents`。

## 收敛方案

- `useInitialConversationAutoSend` 直接调会话详情接口，按会话 ID 预占位去重；会话已有用户消息时不重发，详情查询失败时沿用旧行为兜底发送。
- `AgentConversationChatPanel` 按路由 key 一次性恢复首页透传选中态，或在直进时使用 `manualComponents.defaultSelected`；后续轮询不重置用户选择。
- 修正 AppDevPro 同名测试错导入到 ConversationAgent 的问题，覆盖选中态、取消选中、单次自动发送、已有消息拦截和查询失败兜底。

## 验证

- `pnpm exec vitest run src/pages/AppDevPro/hooks/useInitialConversationAutoSend.test.ts src/pages/AppDevPro/AgentConversationChatPanel/index.test.tsx`
- 改动文件 ESLint / Prettier，以及改动路径分层依赖检查。
