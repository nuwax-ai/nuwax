# AgentIntervention

AI Agent 运行时干预模块，支持两种暂停-恢复流程：**ACP 权限审批** 和 **MCP Ask 结构化提问**。

## 示例页面

本地开发时可通过以下地址预览干预卡片 UI（Mock 数据，免登录，仅用于开发预览）：

| 说明 | 路由 | 本地地址（默认端口 8000） |
| --- | --- | --- |
| 干预卡片 UI Demo（ACP + MCP Ask） | `/examples/agent-intervention-demo` | http://localhost:8000/examples/agent-intervention-demo |
| 全部示例索引 | `/examples` | http://localhost:8000/examples |

示例源码：`src/examples/AgentInterventionDemo/`（`index.tsx` + `mockData.ts`）。Mock 使用模块内 **camelCase** 字段；真实 SSE 入参多为 **snake_case**，由 `applyAcpPermissionSseEvent` / `parseMcpAskToolInput` 归一化。

## 模块结构

```
AgentIntervention/
  index.ts
  AgentInterventionChatLayer/   # 对外入口（DockPanel.tsx 堆叠渲染卡片）
  AcpPermissionCard/            # 业务卡片；示例页直连
  McpAskQuestionCard/
  hooks/
  types/
  utils/
```

## 对外导出（`index.ts`）

| 导出 | 说明 |
| --- | --- |
| `AgentInterventionChatLayer` | 聊天页干预层（队列 + 停靠卡片） |
| `useAgentInterventionLayer` | 页面接入（含 `agentMode`、Chat 层 props） |
| `useAgentInterventionHandlers` | model 内 ACP/MCP 响应（写 `messageList`） |
| `processInterventionSsePatch` | SSE 拦截，挂载 interaction 到当前消息 |
| `hydrateMcpAskInteractionsInMessageList` | 历史消息 MCP Ask 状态重建 |
| 类型 | `AcpPermissionInteraction`、`McpAskInteraction`、`AgentMode` 等 |

卡片组件（`AcpPermissionCard`、`McpAskQuestionCard`）**未**从 barrel 导出；示例页或调试可 deep import。

## 已接入位置

| 文件 | 职责 |
| --- | --- |
| `src/models/conversationInfo.ts` | `processInterventionSsePatch`、`hydrateMcpAskInteractionsInMessageList`、`useAgentInterventionHandlers` |
| `src/pages/Chat/index.tsx` | `useAgentInterventionLayer` + `AgentInterventionChatLayer` |
| `src/pages/EditAgent/PreviewAndDebug/index.tsx` | 同上（预览调试） |
| `src/services/agentConfig.ts` | `apiAgentInterventionRespond`（ACP 回执 HTTP） |
| `src/types/interfaces/conversationInfo.ts` | `MessageInfo.acpPermissionInteractions` / `mcpAskInteractions` |

## 快速接入

```tsx
import {
  AgentInterventionChatLayer,
  useAgentInterventionLayer,
} from '@/components/business-component/AgentIntervention';

const { agentMode, chatLayerProps, agentModeInputProps } = useAgentInterventionLayer({
  conversationId: id,
  messageList,
  onSendMessage: handleMessageSend,
});

<AgentInterventionChatLayer {...chatLayerProps} />
<ChatInputHome {...agentModeInputProps} agentMode={agentMode} ... />
```

发送消息时在参数中带上 `agentMode: 'ask' | 'yolo'`（见 `AgentMode`）。

**model 侧（`conversationInfo`）必须同时完成：**

1. SSE 循环中优先调用 `processInterventionSsePatch`，命中则替换当前消息并 `return`。
2. 拉取历史消息后调用 `hydrateMcpAskInteractionsInMessageList`。

## `MessageInfo` 挂载字段

归一化后挂在**当前流式消息**上（与 `processingList` 同级）：

```typescript
interface MessageInfo {
  acpPermissionInteractions?: AcpPermissionInteraction[];
  mcpAskInteractions?: McpAskInteraction[];
}
```

### `AcpPermissionInteraction`（内存模型，camelCase）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `intervention` | `AcpPermissionInterventionRequest` | 审批元数据 + `acp.request` |
| `responseStatus` | `'pending' \| 'submitting' \| 'submitted' \| 'failed'` | 前端响应状态 |
| `selectedOptionId` | `string?` | 用户选中的 `optionId` |
| `errorMessage` | `string?` | 回执失败文案 |
| `triggeredAt` | `number?` | 入队时间戳（`createInterventionTriggeredAt`） |

`intervention` 主要字段：

| 字段 | 说明 |
| --- | --- |
| `id` | 干预 ID；无后端 `_intervention` 时为 `itv_{sessionId}_{toolCallId}` |
| `revision` | 修订号；可从 `_meta.nuwaclaw_revision` 补齐 |
| `kind` | 固定 `'approval'` |
| `status` | 固定 `'pending'` |
| `sessionId` | 会话 ID |
| `source` | 固定 `'acp_permission'` |
| `engine` | `'claude-code' \| 'nuwaxcode' \| 'codex'`（SSE 若带 `codex-cli` 等别名会规范为 `codex`） |
| `protocol` | 固定 `'acp'` |
| `callbackTarget` | `{ kind: 'electron' \| 'rcoder', targetId: string }` |
| `schemaRef` | 模式引用字符串 |
| `acp.method` | 固定 `'session/request_permission'` |
| `acp.request.sessionId` | 同 `sessionId` |
| `acp.request.toolCall` | `toolCallId`, `title`, `kind`, `rawInput`, `status` 等 |
| `acp.request.options[]` | `{ optionId, kind, name }`，`kind` 见 `AcpPermissionOptionKind` |
| `createdAt` | 时间戳；PROCESSING 事件可取 `result.startTime` |

`AcpPermissionOptionKind`：`allow_once` | `allow_always` | `reject_once` | `reject_always`。卡片 UI **隐藏** `reject_always`。

### `McpAskInteraction`（内存模型，camelCase）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `input` | `McpAskUserToolInput` | 工具 rawInput 归一化结果 |
| `toolCallId` | `string` | 与 SSE `tool_call_id` / `executeId` 对齐 |
| `responseStatus` | `'pending' \| 'submitting' \| 'submitted' \| 'cancelled' \| 'skipped' \| 'failed'` |  |
| `formData` | `Record<string, unknown>?` | 用户提交值 |
| `errorMessage` | `string?` |  |
| `triggeredAt` | `number?` |  |

`McpAskUserToolInput` 必填（`parseMcpAskToolInput`）：

| 字段 | 约束 |
| --- | --- |
| `schemaVersion` | `nuwaclaw.mcp_ask.v1` 或别名 `nuwax.mcp_ask.v1` |
| `toolName` | `nuwax_ask_question`（缺省同值；其它工具名拒绝） |
| `requestId` | 去重键；**同时作为** `McpAskRespondPayload.interventionId` |
| `revision` | 数字 |
| `sessionId` | 字符串 |
| `title` | 字符串 |
| `description` | 可选 |
| `ui.version` | `nuwaclaw.interaction.v1` 或 `nuwax.interaction.v1` |
| `ui.presentation` | 类型含 `modal \| inline \| wizard \| table`；**实际 UI** 仅区分 wizard / 非 wizard |
| `ui.schema` | JSON Schema 对象 |
| `ui.uiSchema` | 可选，含 `ui:widget`、`ui:options` |
| `ui.steps` | wizard 步骤 |
| `timeoutMs` | 可选 |

## SSE 识别与归一化

`parseSseEventEnvelope` 兼容多层包裹：`res.data.{messageType,subType,data}` 或扁平字段（含 `message_type` / `sub_type`）。

### ACP：何时命中 `applyAcpPermissionSseEvent`

满足其一即可：

- `res.eventType === 'ACP_REQUEST_PERMISSION'`
- `message_type` / `messageType === 'acpRequestPermission'` 且 `sub_type` / `subType` 为 `request_permission` 或 `AcpRequestPermission`
- `res.eventType === 'PROCESSING'` 且（`subEventType === 'REQUEST_PERMISSION'` 或 `result.input.request_permission_request` 存在）

从 `eventData` 读取（snake_case 优先）：

- `request_permission_request`（或 PROCESSING `result.input.request_permission_request`）
- `tool_call_id`、`session_id`
- 可选 `_intervention` / `interventionRequest`（完整 camelCase 干预体）
- 可选 `_meta.nuwaclaw_intervention_id`、`nuwaclaw_revision`

**入参示例（snake_case，与单测一致）：**

```json
{
  "message_type": "acpRequestPermission",
  "sub_type": "request_permission",
  "data": {
    "request_permission_request": {
      "session_id": "session-snake",
      "tool_call": {
        "tool_call_id": "tool-call-snake",
        "title": "Write file",
        "kind": "edit",
        "status": "pending",
        "raw_input": { "command": "touch approval-test.txt" }
      },
      "options": [
        {
          "option_id": "allow-once",
          "kind": "allow_once",
          "name": "Allow once"
        },
        { "option_id": "reject-once", "kind": "reject_once", "name": "Reject" }
      ]
    },
    "tool_call_id": "tool-call-snake"
  }
}
```

同一 `intervention.id` 不会重复挂载。

### MCP Ask：何时命中 `applyMcpAskToolCallSseEvent`

- `message_type` / `messageType` 为 `tool_call` 或 `sub_type` / `subType` 为 `tool_call` / `tool_call_update`，且存在 `tool_call_id` / `toolCallId` / `raw_input` / `rawInput`（或 `ext` 内 rawInput）
- `messageType === 'agentSessionUpdate'` + `tool_call` 子类型（同上）
- `res.eventType === 'PROCESSING'` 且存在 `executeId` 或 `result.executeId` / `result.input`

`raw_input` / `rawInput` / `result.input` 经 `parseMcpAskToolInput` 校验通过后写入 `mcpAskInteractions`。同一 `input.requestId` 不重复挂载。

**入参示例（PROCESSING + executeId）：**

```json
{
  "eventType": "PROCESSING",
  "data": {
    "executeId": "tool-call-1",
    "result": {
      "executeId": "tool-call-1",
      "input": {
        "toolName": "nuwax_ask_question",
        "schemaVersion": "nuwaclaw.mcp_ask.v1",
        "requestId": "ask-1",
        "revision": 1,
        "sessionId": "session-1",
        "title": "Need input",
        "ui": {
          "version": "nuwaclaw.interaction.v1",
          "presentation": "inline",
          "title": "Need input",
          "schema": { "type": "object", "properties": {} }
        }
      }
    }
  }
}
```

**入参示例（agentSessionUpdate / snake_case）：**

```json
{
  "messageType": "agentSessionUpdate",
  "subType": "tool_call",
  "data": {
    "tool_call_id": "tool-call-3",
    "raw_input": {
      "schemaVersion": "nuwaclaw.mcp_ask.v1",
      "requestId": "ask-3",
      "revision": 1,
      "sessionId": "session-1",
      "title": "请选择继续方式",
      "ui": {
        "version": "nuwaclaw.interaction.v1",
        "presentation": "inline",
        "title": "请选择继续方式",
        "schema": {
          "type": "object",
          "properties": {
            "choice": {
              "type": "string",
              "enum": ["deploy", "test"],
              "title": "选项"
            }
          },
          "required": ["choice"]
        },
        "uiSchema": {
          "choice": {
            "ui:widget": "radio",
            "ui:options": { "enumNames": ["部署", "测试"] }
          }
        }
      }
    }
  }
}
```

## 用户操作与回执

### ACP 卡片 → `AcpRequestPermissionResponse` → HTTP

卡片 `onRespond` 传出（camelCase）：

```typescript
// 选中某项
{ outcome: { outcome: 'selected', optionId: 'allow-once' } }
// 取消（卡片取消按钮，非 Esc 伪造 Cancelled）
{ outcome: { outcome: 'cancelled' } }
```

`useAgentInterventionHandlers.respondAcpPermission` 组装 `AgentInterventionRespondRequest` 后调用 **`apiAgentInterventionRespond`**。

**实际请求（`src/services/agentConfig.ts`）：**

```
POST /api/agent/conversation/chat/permission-request/response
```

```json
{
  "conversationId": 43,
  "toolId": "tool-call-snake",
  "option": {
    "optionId": "allow-once",
    "outcome": "selected"
  }
}
```

取消时 `outcome` 为 `"cancelled"`，`optionId` 回退为 `"reject"`（见 service 内 fallback）。

类型层 `permission_resolve_request` 仍保留 NuwaClaw 形状（`Selected.option_id` / `Cancelled`），由 service 映射为上述 body。

### MCP Ask → 普通聊天消息（无单独干预 API）

`McpAskQuestionCard` 构建的 `McpAskRespondPayload`：

| 字段             | 来源                                               |
| ---------------- | -------------------------------------------------- |
| `interventionId` | **`input.requestId`**（非后端 intervention 表 ID） |
| `toolCallId`     | interaction.`toolCallId`                           |
| `revision`       | `input.revision`                                   |
| `source`         | `'mcp_ask'`                                        |
| `protocol`       | `'mcp'`                                            |
| `action`         | `'submit' \| 'cancel' \| 'skip' \| 'timeout'`      |
| `formData`       | 提交时表单值                                       |
| `answeredBy`     | `{ kind: 'web' }`                                  |
| `answeredAt`     | `Date.now()`                                       |

`respondMcpAsk` 更新 `mcpAskInteractions` 状态后，返回 `buildMcpAskResumeMessage` 字符串，由 `useAgentInterventionLayer` 调用 `onSendMessage` 发回会话。

**resume 文案规则（`mcpAskResumeMessage.ts`）：**

```text
我已填写「{title}」，表单内容如下：

{字段 title}：{展示值}
```

- `cancel` → `我取消了「{title}」。`
- `skip` → `我跳过了「{title}」。`
- `timeout` → `「{title}」已超时，没有收到表单答案。`
- 枚举展示优先 `uiSchema[field].ui:options.enumNames`；布尔为 `是/否`；空为 `未填写`。

### `uiSchema` 已落地 widget

| `ui:widget`         | 渲染                                                |
| ------------------- | --------------------------------------------------- |
| `radio`             | Radio.Group                                         |
| `checkboxes`        | Checkbox.Group（含 items.enum）                     |
| `select`            | Select                                              |
| `text`              | Input                                               |
| `textarea`          | Input.TextArea                                      |
| `number`            | InputNumber（`minimum` / `maximum` / `multipleOf`） |
| `radio-with-custom` | Radio + 自定义输入（`otherValue` / `otherField`）   |
| `list`              | 纵向单选列表                                        |
| `file`              | 上传（`ui:options.accept`、`multiple`）             |

未写 `ui:widget` 时按 schema 推断（如 `enum` → `radio`，`items.enum` → `checkboxes`，`number`/`integer` → `number`）。

### `presentation` 实际行为

| 条件 | UI |
| --- | --- |
| `presentation === 'wizard'` 或 `steps.length > 1` | 分步 Steps + 上一步/下一步 |
| 其他（含 `inline`、`modal`、`table`） | 单页表单 |

根级 `uiSchema['ui:options'].allowSkip === true` 时显示跳过；文案来自 `ui.skipLabel` 或字段 `skipLabel`。

## 数据流

```
SSE (ConversationChatResponse)
  → processInterventionSsePatch
    → applyAcpPermissionSseEvent → message.acpPermissionInteractions[]
    → applyMcpAskToolCallSseEvent  → message.mcpAskInteractions[]
      → useActiveInterventionQueue（仅 pending / submitting 视为活动；submitted / failed 均为终态，卡片关闭）
        → AgentInterventionChatLayer → DockPanel
            → AcpPermissionCard / McpAskQuestionCard
            → respondAcpPermission → POST .../permission-request/response
            → respondMcpAsk → buildMcpAskResumeMessage → onSendMessage
```

历史加载：`hydrateMcpAskInteractionsInMessageList` 根据已有用户消息推断 MCP 是否已回复。

## 测试

关键单测与上述字段对齐：

- `utils/applyAcpPermissionSseEvent.test.ts` — ACP snake_case / PROCESSING / `_meta`
- `utils/applyMcpAskToolCallSseEvent.test.ts` — MCP tool_call / PROCESSING
- `utils/parseMcpAskSchema.test.ts` — widget 解析
- `hooks/useAgentInterventionHandlers.test.ts` — ACP 回执与 MCP resume
