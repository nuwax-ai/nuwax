# AgentIntervention

AI Agent 运行时干预模块，支持两种暂停-恢复流程：**ACP 权限审批** 和 **MCP Ask 结构化提问**。

## 模块结构

```
AgentIntervention/
  index.ts                          # barrel export
  types/
    acpIntervention.ts              # ACP 权限类型定义
    mcpAskIntervention.ts           # MCP Ask 类型定义
  components/
    AgentInterventionChatLayer/     # 顶层集成组件（挂载到 Chat 页面）
    InterventionDockPanel/          # 干预卡片停靠面板
    AcpPermissionCard/              # ACP 权限审批卡片
    McpAskQuestionCard/             # MCP Ask 表单卡片
  hooks/
    useActiveInterventionQueue.ts   # 扫描 messageList 中活跃的干预队列
    useAgentInterventionHandlers.ts # 响应/mock 注入处理器
    useAgentInterventionDevMock.ts  # 开发 mock（URL 参数触发）
    useInterventionEscapeKey.ts     # Esc 快捷键
  utils/
    processInterventionSsePatch.ts  # SSE 事件拦截入口
    applyAcpPermissionSseEvent.ts   # ACP SSE 事件解析
    applyMcpAskToolCallSseEvent.ts  # MCP Ask SSE 事件解析
    mcpAskHydrateMessage.ts         # 历史消息 MCP Ask 状态重建
    mcpAskResumeMessage.ts          # MCP Ask 回复消息构建
    parseMcpAskSchema.ts            # JSON Schema → 表单字段解析
    acpPermissionMock.ts            # ACP mock 数据
    mcpAskQuestionMock.ts           # MCP Ask mock 数据
    interventionDemoStack.ts        # 组合 mock 注入
    interventionMockIds.ts          # mock ID 常量
    interventionTrigger.ts          # triggeredAt 单调递增生成器
```

## 接入步骤

### 1. conversationInfo model（数据层）

在 `src/models/conversationInfo.ts` 中完成三处接入：

**a) 初始化 handlers**

```typescript
import {
  useAgentInterventionHandlers,
  processInterventionSsePatch,
  hydrateMcpAskInteractionsInMessageList,
} from '@/components/business-component/AgentIntervention';

// 在 model 函数体内调用
const {
  respondAcpPermission,
  respondMcpAsk,
  injectMockAcpPermission,
  injectMockMcpAsk,
  injectAllInterventionMocks,
} = useAgentInterventionHandlers({
  setMessageList,
  conversationId: currentConversationId,
});
```

**b) SSE 事件拦截**

在 SSE 消息处理循环中，`processInterventionSsePatch` 必须在普通消息处理之前调用：

```typescript
// 在 SSE 回调中，对每条消息：
const interventionPatch = processInterventionSsePatch(res, currentMessage);
if (interventionPatch) {
  list.splice(index, 1, interventionPatch);
  return; // 跳过普通消息处理
}
```

**c) 历史消息 hydration**

加载历史消息列表时，调用 `hydrateMcpAskInteractionsInMessageList` 重建 MCP Ask 交互状态：

```typescript
const _messageList = hydrateMcpAskInteractionsInMessageList(
  data?.messageList || [],
);
```

### 2. Chat 页面（视图层）

在 `src/pages/Chat/index.tsx` 中渲染 `AgentInterventionChatLayer`：

```tsx
import {
  AgentInterventionChatLayer,
  type AgentMode,
  type McpAskInteraction,
  type McpAskRespondPayload,
} from '@/components/business-component/AgentIntervention';

// 在 Chat 组件 JSX 中，位于输入框上方：
<AgentInterventionChatLayer
  conversationId={id}
  messageList={messageList}
  onRespondAcpPermission={respondAcpPermission}
  onRespondMcpAsk={handleRespondMcpAsk}
  injectMockAcpPermission={injectMockAcpPermission}
  injectMockMcpAsk={injectMockMcpAsk}
  injectAllInterventionMocks={injectAllInterventionMocks}
/>;
```

`handleRespondMcpAsk` 需要将 `respondMcpAsk` 返回的 resume message 发送给 Agent：

```typescript
const handleRespondMcpAsk = async (
  interaction: McpAskInteraction,
  payload: McpAskRespondPayload,
) => {
  const resumeMessage = await respondMcpAsk(interaction, payload);
  if (resumeMessage) {
    // 将 resume message 作为用户消息发送给 Agent
    sendMessage(resumeMessage);
  }
};
```

### 3. 类型引用

所有对外暴露的类型统一从 barrel 导入：

```typescript
import type {
  AgentMode, // 'ask' | 'yolo'
  AcpPermissionInteraction, // ACP 权限交互状态
  AcpRequestPermissionResponse, // ACP 响应结构
  McpAskInteraction, // MCP Ask 交互状态
  McpAskRespondPayload, // MCP Ask 响应结构
  AgentInterventionRespondRequest, // 后端 API 请求体
} from '@/components/business-component/AgentIntervention';
```

### 4. 后端 API

ACP 权限审批通过 `src/services/agentConfig.ts` 中的 `apiAgentInterventionRespond` 发送：

```
POST /api/agent-interventions/{interventionId}/respond
Body: AgentInterventionRespondRequest
```

MCP Ask 不走单独 API，resume message 作为普通聊天消息发回 Agent。

## 数据流

```
SSE Event
  → processInterventionSsePatch (拦截)
    → applyAcpPermissionSseEvent / applyMcpAskToolCallSseEvent
      → 挂载 interaction 到 message.acpPermissionInteractions / mcpAskInteractions
        → useActiveInterventionQueue 扫描 pending/submitting/failed
          → AgentInterventionChatLayer → InterventionDockPanel
            → AcpPermissionCard / McpAskQuestionCard
              → 用户操作 → respondAcpPermission / respondMcpAsk
```

## 开发调试

URL 参数触发 mock 干预：

- `?mockAcp=1` — 注入 ACP 权限审批 mock
- `?mockAsk=1` — 注入 MCP Ask 表单 mock
- `?mockAll=1` — 同时注入两种 mock

也可通过 `injectMockAcpPermission` / `injectMockMcpAsk` 手动注入。
