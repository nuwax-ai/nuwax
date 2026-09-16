# 实施计划：会话 UX 四问题修复

- 对应来源：ZCode 会话 `sess_7068779d-affa-4d54-8056-0dadb21199a2`
- 状态：已接受（原会话已确认“删除后回首页、发送后只清缓存并保留输入文本”）

## 改动文件清单

| # | 文件 | 动作 | 说明 |
| --- | --- | --- | --- |
| 1 | `src/components/business-component/ChatInputUnified/index.tsx` | 改 | 发送时取消挂起的草稿落盘，并在回调中拦截已消费草稿 |
| 2 | `src/layouts/DynamicMenusLayout/NewHomeSection/useHomeSectionData.ts` | 改 | 删除当前会话后从详情路由跳回对应上级页面 |
| 3 | `src/pages/Chat/index.tsx` | 改 | 首条自动发送按当前双轨分派，runtime 轨直接写入 runtime store |
| 4 | `src/pages/AppDevPro/AgentConversationChatPanel/index.tsx` | 改 | 已有当前会话乐观消息时不再被详情 loading 遮挡 |
| 5 | `src/pages/ConversationAgent/AgentConversationChatPanel/index.tsx` | 改 | 同步收窄详情 loading 门控 |
| 6 | 相关会话测试 | 改 | 覆盖草稿竞态、删除导航、runtime 首发和面板 loading 门控 |

## 实施顺序

1. 先补关键行为测试，确认旧实现能复现草稿重写、删除不跳转和 loading 遮挡。
2. 修复草稿消费竞态与删除导航。
3. 修复 Chat 页首条消息双轨分派，并保持详情查询与防重发判断不变。
4. 收窄两个开发会话面板的 loading 门控。
5. 运行定向 Vitest、`npm run test:conversation`，再检查改动路径无新增类型错误。

## 证明成立的测试

- 新增或扩展：`tests/chatConversation/chatInputUnified.home.test.tsx`
- 新增或扩展：`src/layouts/DynamicMenusLayout/NewHomeSection/useHomeSectionData.test.ts`
- 新增或扩展：`src/pages/Chat/index.test.tsx`
- 新增或扩展：两个 `AgentConversationChatPanel/index.test.tsx`
- 回归范围：`npm run test:conversation`

## 风险与回退

| 风险 | 缓解 | 回退方式 |
| --- | --- | --- |
| runtime 自动发送参数与 legacy 不一致 | 复用现有 `SendMessageParams` 全量字段并做参数断言 | 恢复 legacy 调用分支 |
| 删除事件误判 `/app/:agentId` 为会话 | 只使用 `extractConversationIdFromPath` 严格解析 | 移除导航分支，保留列表过滤 |
| 切换会话时旧消息短暂露出 | 仅在消息所属 `conversationInfo.id` 与 URL id 一致时关闭 loading | 恢复原 loading 条件 |

## 偏离记录

（实现中如有偏离，在此补记原因。）
