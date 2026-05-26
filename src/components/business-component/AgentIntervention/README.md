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
    useAgentInterventionLayer.ts    # 页面接入 hook（推荐）
    useActiveInterventionQueue.ts   # 扫描 messageList 中活跃的干预队列
    useAgentInterventionHandlers.ts # 响应处理器（底层）
    useInterventionEscapeKey.ts     # Esc 快捷键
  utils/
    processInterventionSsePatch.ts  # SSE 事件拦截入口
    applyAcpPermissionSseEvent.ts   # ACP SSE 事件解析
    applyMcpAskToolCallSseEvent.ts  # MCP Ask SSE 事件解析
    parseMcpAskToolInput.ts         # MCP Ask 工具输入解析
    mcpAskHydrateMessage.ts         # 历史消息 MCP Ask 状态重建
    mcpAskResumeMessage.ts          # MCP Ask 回复消息构建
    parseMcpAskSchema.ts            # JSON Schema → 表单字段解析
    interventionTrigger.ts          # triggeredAt 单调递增生成器
```

## 快速接入

使用 `useAgentInterventionLayer` hook，4 行完成接入：

```tsx
import {
  AgentInterventionChatLayer,
  useAgentInterventionLayer,
} from '@/components/business-component/AgentIntervention';

// 在组件内：
const { agentMode, chatLayerProps, agentModeInputProps } = useAgentInterventionLayer({
  conversationId: id,
  messageList,
  onSendMessage: handleMessageSend,
});

// sendParams 中加 agentMode
<AgentInterventionChatLayer {...chatLayerProps} />
<ChatInputHome {...agentModeInputProps} ... />
```

hook 返回：

- `agentMode` — 当前模式（`'ask'` | `'yolo'`），用于发送消息参数
- `chatLayerProps` — `AgentInterventionChatLayer` 所需的全部 props
- `agentModeInputProps` — `ChatInputHome` 模式切换所需 props（含 `agentMode`, `onAgentModeChange`, `showAgentModeSelector`）

## 数据层接入（conversationInfo model）

`useAgentInterventionLayer` 内部依赖 model 中的 `respondAcpPermission` 和 `respondMcpAsk`。model 中需要完成两处接入：

**SSE 事件拦截** — 在 SSE 消息处理循环中，`processInterventionSsePatch` 必须在普通消息处理之前调用：

```typescript
const interventionPatch = processInterventionSsePatch(res, currentMessage);
if (interventionPatch) {
  list.splice(index, 1, interventionPatch);
  return; // 跳过普通消息处理
}
```

**历史消息 hydration** — 加载历史消息列表时：

```typescript
const _messageList = hydrateMcpAskInteractionsInMessageList(
  data?.messageList || [],
);
```

## SSE 事件数据格式

### ACP 权限审批

SSE 事件类型：`ACP_REQUEST_PERMISSION` 或 messageType `acpRequestPermission`

```json
{
  "eventType": "ACP_REQUEST_PERMISSION",
  "data": {
    "messageType": "acpRequestPermission",
    "subType": "AcpRequestPermission",
    "data": {
      "session_id": "sess_xxx",
      "tool_call": {
        "tool_call_id": "tc_xxx",
        "kind": "edit",
        "title": "Edit file.ts",
        "raw_input": { ... },
        "status": "pending"
      },
      "options": [
        { "option_id": "opt_1", "kind": "allow_once", "name": "Allow" },
        { "option_id": "opt_2", "kind": "allow_always", "name": "Always Allow" },
        { "option_id": "opt_3", "kind": "reject_once", "name": "Reject" }
      ],
      "_intervention": {
        "id": "itv_xxx",
        "kind": "approval",
        "source": "acp_permission",
        "protocol": "acp",
        "acp": {
          "method": "session/request_permission",
          "request": { ... }
        }
      }
    }
  }
}
```

### MCP Ask 结构化提问

SSE 事件类型：messageType `tool_call`，工具名匹配 `nuwax_ask_question` / `nuwax_ask_user` / `nuwaclaw_ask_user`

```json
{
  "data": {
    "messageType": "tool_call",
    "subType": "tool_call",
    "data": {
      "tool_call_id": "tc_xxx",
      "raw_input": {
        "toolName": "nuwax_ask_question",
        "schemaVersion": "mcp_ask.v1",
        "requestId": "req_xxx",
        "revision": 1,
        "sessionId": "sess_xxx",
        "title": "请选择继续方式",
        "description": "单选",
        "ui": {
          "version": "interaction_ui.v1",
          "presentation": "inline",
          "schema": {
            "type": "object",
            "properties": {
              "choice": {
                "type": "string",
                "enum": ["deploy", "test", "cancel"],
                "title": "选项"
              }
            },
            "required": ["choice"]
          },
          "uiSchema": {
            "choice": {
              "ui:widget": "radio",
              "ui:options": {
                "enumNames": ["直接部署", "先跑测试", "取消任务"]
              }
            },
            "ui:options": { "allowSkip": true, "skipLabel": "跳过" }
          },
          "submitLabel": "提交",
          "cancelLabel": "取消"
        },
        "timeoutMs": 1800000
      }
    }
  }
}
```

### uiSchema 支持的 widget 类型

| widget              | 说明              | 渲染组件       |
| ------------------- | ----------------- | -------------- |
| `radio`             | 单选              | Radio.Group    |
| `checkboxes`        | 多选              | Checkbox.Group |
| `select`            | 下拉选择          | Select         |
| `text`              | 单行文本          | Input          |
| `textarea`          | 多行文本          | Input.TextArea |
| `radio-with-custom` | 单选 + 自定义输入 | Radio + Input  |

### presentation 模式

| 模式     | 说明                       |
| -------- | -------------------------- |
| `inline` | 内联表单（默认）           |
| `wizard` | 多步向导（需配置 `steps`） |

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

## 后端 API

ACP 权限审批通过 `src/services/agentConfig.ts` 中的 `apiAgentInterventionRespond` 发送：

```
POST /api/agent-interventions/{interventionId}/respond
Body: AgentInterventionRespondRequest
```

MCP Ask 不走单独 API，resume message 作为普通聊天消息发回 Agent。
