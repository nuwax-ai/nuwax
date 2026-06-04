# AgentIntervention

AI Agent 运行时干预模块，支持两种暂停-恢复流程：**ACP 权限审批** 和 **MCP Ask 结构化提问**。

## 示例页面

本地开发时可通过以下地址预览干预卡片 UI（Mock 数据，免登录，仅用于开发预览）：

| 说明 | 路由 | 本地地址（默认端口 8000） |
| --- | --- | --- |
| 干预卡片 UI Demo（ACP + MCP Ask） | `/examples/agent-intervention-demo` | http://localhost:8000/examples/agent-intervention-demo |
| 全部示例索引 | `/examples` | http://localhost:8000/examples |

示例源码：`src/examples/AgentInterventionDemo/`（`index.tsx` + `mockData.ts`）

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

字段格式以 NuwaClaw `docs/permission-request-handler-design.md` 为唯一来源。前端兼容后端包裹后的事件，但业务字段必须保持下面的 RCoder snake_case 格式。

```json
{
  "session_id": "sess_xxx",
  "message_type": "acpRequestPermission",
  "sub_type": "request_permission",
  "data": {
    "request_permission_request": {
      "session_id": "sess_xxx",
      "tool_call": {
        "tool_call_id": "tc_xxx",
        "kind": "execute",
        "status": "pending",
        "title": "bash",
        "content": [],
        "raw_input": {
          "command": "touch approval-test.txt"
        },
        "_meta": {}
      },
      "options": [
        {
          "option_id": "once",
          "kind": "allow_once",
          "name": "Allow once",
          "_meta": {}
        },
        {
          "option_id": "always",
          "kind": "allow_always",
          "name": "Always allow",
          "_meta": {}
        },
        {
          "option_id": "reject",
          "kind": "reject_once",
          "name": "Reject",
          "_meta": {}
        }
      ],
      "_meta": {}
    },
    "tool_call_id": "tc_xxx"
  },
  "timestamp": "2026-05-26T07:47:46.175Z"
}
```

用户点击 `Reject` 时也回传对应 reject option 的 `option_id`。权限卡片不提供单独的 `Cancelled` 操作，也不使用 Esc 生成 `Cancelled`；只有会话取消或 pending 清理时才回传 `Cancelled`。

审批回执经 `apiAgentInterventionRespond` 发送到 Backend，再转发给 NuwaClaw `/computer/notify-resolved`：

```json
{
  "permission_resolve_request": {
    "request_permission_response": {
      "outcome": {
        "Selected": {
          "option_id": "once"
        }
      }
    },
    "session_id": "sess_xxx",
    "tool_call_id": "tc_xxx",
    "save_rule": false
  },
  "conversation_id": 43
}
```

### MCP Ask 结构化提问

Ask/question 不走 ACP `request_permission`，也不调用 `/computer/notify-resolved`。它由 MCP 工具调用产生普通 `agentSessionUpdate/tool_call` 与 `agentSessionUpdate/tool_call_update` 事件，工具名匹配 `nuwax_ask_question` / `nuwax_ask_user` / `nuwaclaw_ask_user`。

```json
{
  "data": {
    "messageType": "agentSessionUpdate",
    "subType": "tool_call",
    "data": {
      "sessionUpdate": "tool_call",
      "toolCallId": "tc_xxx",
      "rawInput": {
        "toolName": "nuwax_ask_question",
        "schemaVersion": "nuwaclaw.mcp_ask.v1",
        "requestId": "req_xxx",
        "revision": 1,
        "sessionId": "sess_xxx",
        "title": "请选择继续方式",
        "description": "单选",
        "ui": {
          "version": "nuwaclaw.interaction.v1",
          "presentation": "inline",
          "title": "请选择继续方式",
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
Body: AgentInterventionRespondRequest.permission_resolve_request
```

MCP Ask 不走单独 API。用户提交、取消、跳过或超时后，前端用 `buildMcpAskResumeMessage` 生成普通聊天消息发回 Agent，下一轮 Agent 从用户消息中读取答案继续执行。

消息内容按表单 label 输出，避免把面向用户的答案写成 JSON：

```text
我已填写「请选择继续方式」，表单内容如下：

选项：先跑测试
补充说明：先跑关键链路
检查项：代码检查、单元测试
```

格式规则：

- 标题优先使用 MCP input `title`，其次使用 `ui.title`。
- 字段 label 使用 JSON Schema `properties[field].title`，缺失时使用字段 key。
- 枚举值优先显示 `uiSchema[field]["ui:options"].enumNames`。
- 数组值使用 `、` 连接。
- 布尔值显示为 `是` / `否`。
- 空值显示为 `未填写`。
- 未在 schema 中声明的字段仍保留为可读的 `key：value` 行。
- 不发送 JSON 代码块，除非用户自己明确填写了 JSON。

取消、跳过、超时也都是普通聊天消息：

```text
我取消了「请选择继续方式」。
我跳过了「请选择继续方式」。
「请选择继续方式」已超时，没有收到表单答案。
```
