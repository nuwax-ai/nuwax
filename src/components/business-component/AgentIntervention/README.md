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
| `src/models/conversationInfo.ts` | 主会话：`processInterventionSsePatch`、`hydrateMcpAskInteractionsInMessageList`、`useAgentInterventionHandlers` |
| `src/models/conversationAgent.ts` | **ConversationAgent 预览 Tab** 隔离会话：同上三项（与 `conversationInfo` 对齐） |
| `src/pages/Chat/index.tsx` | `useAgentInterventionLayer` + `AgentInterventionChatLayer` |
| `src/pages/EditAgent/PreviewAndDebug/index.tsx` | 同上（编排预览调试） |
| `src/pages/ConversationAgent/` | 左侧主聊天气泡区（`conversationInfo`）+ 右侧「预览」Tab（`conversationAgent` + `interventionHandlers` 注入） |
| `src/components/business-component/UnifiedChatSession` | 统一挂载 `AgentInterventionChatLayer`（DockPanel） |
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

**model 侧必须同时完成：**

1. SSE 循环中优先调用 `processInterventionSsePatch`，命中则替换当前消息并 `return`。
2. 拉取历史消息后调用 `hydrateMcpAskInteractionsInMessageList`。

`conversationInfo` 与 `conversationAgent` 均已接入上述逻辑。

**ConversationAgent 预览 Tab（`conversationAgent` model）额外要求：**

向 `UnifiedChatSession` 传入 `interventionHandlers`（由 `useConversationAgentChatSession` 组装），避免 Dock 回执误写入全局 `conversationInfo` 的 `messageList`：

```tsx
<UnifiedChatSession
  {...chatSessionProps}
  interventionHandlers={interventionHandlers}
/>
```

`interventionHandlers` 类型：`AgentInterventionHandlersOverride`（`respondAcpPermission` / `respondMcpAsk` / `runStopConversation` / `isConversationActive`）。

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
- 后端沙箱 **`Backend.Sandbox.Event.AskQuestion`**：`subEventType === 'ASK_QUESTION'`，表单在 `data.result.input`（与 ToolCall 形态等价，由 `isProcessingToolCallEvent` 识别）

`raw_input` / `rawInput` / `result.input` 经 `parseMcpAskToolInput` 校验通过后写入 `mcpAskInteractions`。同一 `input.requestId` 不重复挂载。

**入参示例（ASK_QUESTION Event，与 demo2.json 对齐）：**

```json
{
  "eventType": "PROCESSING",
  "data": {
    "name": "Backend.Sandbox.Event.AskQuestion",
    "type": "Event",
    "status": "FINISHED",
    "subEventType": "ASK_QUESTION",
    "result": {
      "executeId": "call_272edddbb5e140128d146826",
      "input": {
        "requestId": "demo_form_1",
        "ui": {
          "version": "nuwax.interaction.v2",
          "presentation": "inline",
          "fields": [{ "name": "choice", "title": "选项", "widget": "text" }]
        }
      }
    }
  }
}
```

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

## 核心数据结构

干预数据挂载在 `MessageInfo` 上：

```typescript
interface MessageInfo {
  acpPermissionInteractions?: AcpPermissionInteraction[];
  mcpAskInteractions?: McpAskInteraction[];
  processingList?: ProcessingInfo[]; // 累积 PROCESSING 事件（含 Plan/ToolCall，不含 ASK_QUESTION/REQUEST_PERMISSION）
}
```

## 数据写入路径

### 实时流（live SSE）

```
SSE stream → processInterventionSsePatch(chunk, currentMessage)
  ├─ isAcpPermissionEvent? → applyAcpPermissionSseEvent → message.acpPermissionInteractions.push
  ├─ isMcpAskToolCallEvent? → applyMcpAskToolCallSseEvent → message.mcpAskInteractions.push
  └─ else → processingList.push / text 累积 ...
```

ACP 和 MCP Ask 事件被优先拦截，**不会进入** `processingList`。

### 消息恢复（sub stream）

刷新页面 / 重进会话且任务仍 EXECUTING 时，由 `useConversationStreamResume` 轮询 `taskStatus` 检测后调用 `resumeConversationStream`：

```
resumeConversationStream(conversationId, currentList)
  1. 可选 reloadHistoryAsync → 更新 messageList（含 resume 消息）
  2. 追加占位 assistant message（id=currentMessageId, status=Loading）
  3. GET /api/agent/conversation/chat/sub/:id
       → processInterventionSsePatch(chunk, currentMessage)  ← 与 live 复用
```

sub 流重放历史 SSE 时，已有 resume 消息（步骤 1 加载），`hasMcpAskResumeMessage` 可过滤已回答的 MCP Ask，避免重复弹出。

### 历史消息 hydrate

```
拉取历史列表后：hydrateMcpAskInteractionsInMessageList(messageList)
  → 遍历所有 assistant 消息，提取 mcpAskInteractions
  → 在后续消息中搜索 resume 文本，有则置 responseStatus = 'submitted' / 'cancelled' 等
```

ACP 权限审批**不从历史 hydrate**，仅存在于实时流/sub 流消息中。

## DockPanel 显隐规则（`useActiveInterventionQueue` + `DockPanel`）

`useActiveInterventionQueue` 从 **整个 `messageList`** 收集 `responseStatus` 为 `pending` / `submitting` 的干预项，按 `triggeredAt` / `createdAt` **升序（FIFO）** 排序后送入 `DockPanel`。`DockPanel` 堆叠渲染，**仅 front（最早一项）可交互**，其余 `aria-hidden`；用户逐项审批并调用 `permission-request/response`（→ NuwaClaw `notify-resolved`）。

### 队列收集（`useActiveInterventionQueue`）

- **跨消息**：不限于最新一条消息；并行工具可在多条 assistant 消息上各挂审批，统一入队。
- **ACP**：`pending` / `submitting` 进队；`submitted` / `failed` 不进队（`failed` 不阻塞后续审批）。
- **MCP Ask 抑制 ACP**（双路）：pending ACP 的 `toolCallId` 或 `rawInput.requestId` 命中时，对应 MCP Ask 不进队。
- **MCP Ask**：另需 `!hasMcpAskResumeMessage`；**不受**消息 `Complete` 态影响。

### sub 恢复 / 跨页签：ACP 已审批判定（`reconcileAcpPermissionStatus`）

ACP **不从历史 hydrate**；sub 流重放会把 `request_permission` 再次写入为 `pending`。每次 `processInterventionSsePatch` 与 `handleChangeMessageList` 更新后调用 `reconcileAcpPermissionStatusesInMessageList`：

| 条件 | 动作 |
| --- | --- |
| 同 `toolCallId` / `executeId` 在 `processingList` 中已为 `FINISHED` | `responseStatus` → `submitted` |
| 关联 MCP Ask 已有 resume 消息（`hasMcpAskResumeMessage`） | `submitted` |
| 用户本端审批 API 成功 | `submitted`（`useAgentInterventionHandlers`） |
| API 返回 permission not found / already resolved | 幂等视为 `submitted` |

### ACP 权限审批关闭时机

| 原因              | 机制                                                    |
| ----------------- | ------------------------------------------------------- |
| 用户审批          | `responseStatus` → `submitted`                          |
| sub 重放 / 跨页签 | `reconcileAcpPermissionStatuses` 根据 processing 完成态 |
| API 幂等          | Host pending 已不存在 → `submitted`                     |

### MCP Ask 关闭时机

| 原因         | 机制                                                         |
| ------------ | ------------------------------------------------------------ |
| 本端用户提交 | `dismissedMcpAskRequestIds` 或 `responseStatus` 更新         |
| 跨端感知     | `hasMcpAskResumeMessage`                                     |
| Agent 推进   | 由 `responseStatus` 独立控制（非 ACP 的 executeId 过期逻辑） |

### 规则速查

```
队列顺序     =  sortKey 升序（FIFO），DockPanel front = items[0]

ACP 进队     =  pending/submitting（failed 不进队）

MCP 进队     =  pending/submitting
             && !hasMcpAskResumeMessage
             && toolCallId ∉ permissionPendingToolCallIds
             && requestId  ∉ permissionPendingAskRequestIds
```

### Resume 消息签名（`hasMcpAskResumeMessage` 匹配依据）

`collectResumeMessageSignatures` 从 5 个语言包（ZH / ZH-TW / ZH-HK / EN / JA）提取模板格式化签名 + legacy 硬编码片段，用 `text.includes(signature)` 匹配：

| 操作    | 中文签名示例                            |
| ------- | --------------------------------------- |
| submit  | `我已填写「{title}」，表单内容如下：`   |
| cancel  | `我取消了「{title}」。`                 |
| skip    | `我跳过了「{title}」。`                 |
| timeout | `「{title}」已超时，没有收到表单答案。` |

**变更风险**：修改 `buildMcpAskResumeMessage` 格式或 i18n key 时，须确保新格式前缀仍能被 `collectResumeMessageSignatures` 收集，否则历史 resume 消息无法识别，已回答的卡片会重新出现。

### 与 Mobile 的对应关系

| 机制 | PC（此文件） | Mobile（`mcpAskInterventionState.uts`） |
| --- | --- | --- |
| 过期检查 | `isExpired(executeId)` vs `focusExecuteId` | `processingList.length > processingListLengthAtAdd` |
| 本端提交关闭 | `dismissedMcpAskRequestIds` Set，API 失败可回滚 | `removeMcpAskInteractionFromMessageList` 直接移除 |
| 跨端感知关闭 | `hasMcpAskResumeMessage` | 同左 |
| 历史状态恢复 | `hydrateMcpAskInteractionsInMessageList` | `applyMcpAskResumeStatusesInMessageList` |
| ACP 抑制 MCP Ask | `permissionPendingToolCallIds` + `permissionPendingAskRequestIds` | 同左 |
| 卡片渲染 | `DockPanel` FIFO 堆叠，最早在前 | ACP + MCP Ask 分列 `v-for`（待 mobile 同步） |
| ACP sub 恢复 | `reconcileAcpPermissionStatuses` | 待 mobile 同步 |

## 数据流

```
SSE (ConversationChatResponse)
  → processInterventionSsePatch (+ reconcileAcpPermissionStatuses)
    → applyAcpPermissionSseEvent → message.acpPermissionInteractions[]
    → applyMcpAskToolCallSseEvent  → message.mcpAskInteractions[]
      → useActiveInterventionQueue（FIFO；pending/submitting 进队）
        → AgentInterventionChatLayer → DockPanel（front 可点，逐个 notify-resolved）
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
- `utils/reconcileAcpPermissionStatus.test.ts` — ACP sub 恢复 reconcile / API 幂等
- `hooks/useAgentInterventionHandlers.test.ts` — ACP 回执与 MCP resume
