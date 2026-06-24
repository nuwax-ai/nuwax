# AgentFlow 新增节点后端字段对接清单

## 1. 文档目的

本文整理 AgentFlow 新增节点在前端保存 payload 中使用的数据字段，方便后端扩展 `/api/workflow/*` 保存、运行、试运行、版本历史和发布逻辑。

字段来源以当前前端代码为准：

- 节点枚举：`src/types/enums/common.ts`
- 节点配置类型：`src/types/interfaces/node.ts`
- 默认配置：`src/pages/Antv-X6/v3/utils/nodeDefaultConfigFactory.ts`
- 属性面板：`src/pages/Antv-X6/v3/component/agentFlowNodes.tsx`

本文只覆盖 AgentFlow 新增节点：`Agent`、`EvalGate`、`HumanInteraction`、`ExternalConnector`。既有 Workflow 节点沿用原协议。

## 2. 通用保存结构

AgentFlow 当前不独立新增资源类型，作为 Workflow 子类型保存。后端仍接收 `workflowConfig.nodes[]`，通过 `workflowType = "AgentFlow"` 与节点 `type` 区分。

```ts
interface WorkflowConfig {
  id: number;
  workflowType?: 'Workflow' | 'AgentFlow';
  nodes: ChildNode[];
}

interface ChildNode {
  id: number;
  name: string;
  description: string;
  workflowId: number;
  type: NodeTypeEnum;
  nextNodeIds?: number[] | null;
  nodeConfig: NodeConfig;
}
```

### 2.1 通用 AgentFlow 字段

这些字段可出现在多个 AgentFlow 节点的 `nodeConfig` 中。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `contextReads` | `string[]` | 否 | 节点运行前声明读取的 RunContext key。当前是建议字段，前端不强制校验。 |
| `contextWrites` | `string[]` | 否 | 节点运行后声明写入的 RunContext key。当前是建议字段，前端不强制校验。 |
| `autoWirePrevOutput` | `boolean` | 否 | 是否默认使用上一节点输出作为输入。前端 UI 开关，默认 `true`，执行端需要按引擎规则解释。 |
| `inputArgs` | `InputAndOutConfig[]` | 否 | 复用既有节点入参协议。 |
| `outputArgs` | `InputAndOutConfig[]` | 否 | 复用既有节点出参协议。 |
| `exceptionHandleConfig` | `ExceptionHandleConfig` | 否 | 复用既有异常处理协议。 |

后端保存时需要透传未知 `nodeConfig` 字段，避免前端扩展字段在版本历史或保存后丢失。

## 3. 枚举值

### 3.1 新增节点类型

| 节点 | `NodeTypeEnum` 值 | 说明 |
| --- | --- | --- |
| 智能体 | `Agent` | 调用平台 Agent 或嵌套子流程。 |
| 评估验证 | `EvalGate` | 对上游输出做 N 项验证，并按验证结果分支。 |
| 人类介入 | `HumanInteraction` | 支持询问与审批两种暂停/恢复模式。 |
| 三方连接器 | `ExternalConnector` | 调用 Dify、n8n、Coze、Ragflow 等外部平台。 |

### 3.2 相关配置枚举

| 枚举                            | 可选值                           |
| ------------------------------- | -------------------------------- |
| `AgentNodeModeEnum`             | `platform`、`subflow`            |
| `EvalValidatorTypeEnum`         | `rule`、`llm-judge`              |
| `HitlModeEnum`                  | `ask`、`approve`                 |
| `HitlApprovalActionEnum`        | `approve`、`edit`、`reject`      |
| `ExternalConnectorProviderEnum` | `dify`、`n8n`、`coze`、`ragflow` |
| `evalOnMaxRetry`                | `fail`、`continue`、`human`      |

## 4. Agent 节点

### 4.1 基础信息

| 项       | 值                                            |
| -------- | --------------------------------------------- |
| `type`   | `Agent`                                       |
| 连线字段 | 使用普通 `nextNodeIds`                        |
| 默认输出 | `outputArgs[0].key = "output"`，类型 `String` |

### 4.2 `nodeConfig` 字段

| 字段 | 类型 | 必填 | 默认值 | 后端语义 |
| --- | --- | --- | --- | --- |
| `agentMode` | `'platform' \| 'subflow'` | 是 | `platform` | 选择调用平台 Agent 还是嵌套子流程。 |
| `agentId` | `number` | `agentMode=platform` 时建议必填 | 无 | 平台 Agent ID。v1 预期只支持已发布 ChatBot。 |
| `subFlowId` | `number` | `agentMode=subflow` 时建议必填 | 无 | 嵌套子流程 ID。v1 可先保留协议，不一定执行。 |
| `agentInputs` | `Record<string,string>` | 否 | 无 | Agent 入参映射，value 通常是 RunContext 引用，如 `context.userQuestion`。 |
| `autoWirePrevOutput` | `boolean` | 否 | UI 默认 `true` | 缺省入参是否取上一节点输出。 |
| `contextReads` | `string[]` | 否 | 无 | 显式声明读取上下文。 |
| `contextWrites` | `string[]` | 否 | 无 | 显式声明写入上下文。 |

### 4.3 示例

```json
{
  "id": 102,
  "type": "Agent",
  "name": "智能体",
  "nextNodeIds": [103],
  "nodeConfig": {
    "agentMode": "platform",
    "agentId": 1,
    "agentInputs": {
      "question": "context.userQuestion"
    },
    "autoWirePrevOutput": true,
    "contextReads": ["context.userQuestion"],
    "contextWrites": ["context.agentAnswer"],
    "outputArgs": [
      {
        "key": "output",
        "name": "output",
        "dataType": "String",
        "description": "Agent reply",
        "require": true,
        "systemVariable": true,
        "bindValue": ""
      }
    ]
  }
}
```

## 5. EvalGate 节点

### 5.1 基础信息

| 项                 | 值                                                |
| ------------------ | ------------------------------------------------- |
| `type`             | `EvalGate`                                        |
| 普通 `nextNodeIds` | 不用于 EvalGate 特殊分支                          |
| 通过分支           | `nodeConfig.passNextNodeIds`                      |
| 失败分支           | `nodeConfig.evalValidators[].onFail.targetNodeId` |

保存服务会从画布边重建 `passNextNodeIds` 和每个 validator 的 `onFail.targetNodeId`。后端不要只读取 `nextNodeIds` 来判断 EvalGate 分支。

### 5.2 `nodeConfig` 字段

| 字段 | 类型 | 必填 | 默认值 | 后端语义 |
| --- | --- | --- | --- | --- |
| `evalValidators` | `EvalValidator[]` | 否 | `[]` | 验证器列表，按数组顺序执行或由后端策略执行。 |
| `evalMaxRetry` | `number` | 否 | `2` | 验证失败允许回跳重试的最大次数。 |
| `evalOnMaxRetry` | `'fail' \| 'continue' \| 'human'` | 否 | `fail` | 达到最大重试后的处理策略。 |
| `passNextNodeIds` | `number[]` | 否 | `[]` | 全部验证通过后跳转的节点 ID 列表。 |

### 5.3 `EvalValidator` 字段

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `uuid` | `string` | 建议必填 | 前端生成，用于失败端口识别，保存和运行都应稳定保留。 |
| `name` | `string` | 是 | 验证器名称，前端限制 32 字符。 |
| `type` | `'rule' \| 'llm-judge'` | 是 | 验证器类型。 |
| `config` | `Record<string, any>` | 否 | 按 `type` 使用不同字段。 |
| `onFail` | `EvalValidatorOnFail` | 是 | 验证失败后的原因、提示词追加和回跳目标。 |

### 5.4 `config` 字段

`type = "rule"`：

| 字段          | 类型     | 必填 | 说明                                       |
| ------------- | -------- | ---- | ------------------------------------------ |
| `rulePattern` | `string` | 否   | 规则表达式或匹配模式。当前 UI 示例是正则。 |

`type = "llm-judge"`：

| 字段          | 类型     | 必填 | 说明                                       |
| ------------- | -------- | ---- | ------------------------------------------ |
| `judgePrompt` | `string` | 是   | 评估提示词。                               |
| `modelId`     | `number` | 否   | 评估使用的模型 ID。                        |
| `threshold`   | `number` | 否   | 通过阈值，UI 范围 `0` 到 `1`，默认 `0.7`。 |

### 5.5 `onFail` 字段

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `reason` | `string` | 是 | 失败原因，前端限制 64 字符。 |
| `targetNodeId` | `number \| string` | 是 | 验证失败回跳目标。保存服务从连线重建，未连线时可能为空或不存在。后端建议归一化为 number。 |
| `appendPrompt` | `string` | 否 | 回跳时追加给目标节点的提示词。 |

### 5.6 示例

```json
{
  "id": 103,
  "type": "EvalGate",
  "name": "评估验证",
  "nextNodeIds": [],
  "nodeConfig": {
    "evalMaxRetry": 2,
    "evalOnMaxRetry": "human",
    "passNextNodeIds": [104],
    "evalValidators": [
      {
        "uuid": "validator_1",
        "name": "答案完整性",
        "type": "rule",
        "config": {
          "rulePattern": "必须包含明确结论"
        },
        "onFail": {
          "reason": "答案不完整",
          "targetNodeId": 102,
          "appendPrompt": "请补充明确结论后重新回答。"
        }
      }
    ]
  }
}
```

## 6. HumanInteraction 节点

### 6.1 基础信息

| 项                          | 值                              |
| --------------------------- | ------------------------------- |
| `type`                      | `HumanInteraction`              |
| `hitlMode=ask` 连线         | 使用普通 `nextNodeIds`          |
| `hitlMode=approve` 通过分支 | `nodeConfig.approveNextNodeIds` |
| `hitlMode=approve` 拒绝分支 | `nodeConfig.rejectNextNodeIds`  |

### 6.2 `nodeConfig` 字段

| 字段 | 类型 | 必填 | 默认值 | 后端语义 |
| --- | --- | --- | --- | --- |
| `hitlMode` | `'ask' \| 'approve'` | 是 | `ask` | 人类介入模式。 |
| `askConfig` | `HitlAskConfig` | `hitlMode=ask` 时使用 | 见下表 | 询问用户并等待回答。 |
| `approveConfig` | `HitlApproveConfig` | `hitlMode=approve` 时使用 | 见下表 | 生成草稿后等待审批。 |
| `approveNextNodeIds` | `number[]` | 否 | `[]` | 审批通过后的目标节点。 |
| `rejectNextNodeIds` | `number[]` | 否 | `[]` | 审批拒绝后的目标节点。 |

### 6.3 `askConfig` 字段

| 字段 | 类型 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `question` | `string` | 否 | `""` | 展示给用户的问题。 |
| `answerType` | `AnswerTypeEnum` | 是 | `TEXT` | 回答类型，当前 UI 支持文本和选择。 |
| `options` | `QANodeOption[]` | `answerType=SELECT` 时使用 | 无 | 选择项列表。当前 UI 骨架用 TextArea 输入 JSON，联调时需确认最终提交为数组还是 JSON 字符串。 |
| `answerKey` | `string` | 是 | `userAnswer` | 用户答案写入 RunContext 的 key。 |
| `required` | `boolean` | 否 | 无 | 是否必答。 |

### 6.4 `approveConfig` 字段

| 字段 | 类型 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `actions` | `('approve' \| 'edit' \| 'reject')[]` | 是 | `['approve','edit','reject']` | 审批人允许执行的动作。 |
| `promptToReviewer` | `string` | 否 | `""` | 展示给审批人的说明。 |
| `draftSource` | `string` | 否 | `""` | 草稿来源，通常是 RunContext 引用或模板表达式。 |
| `onReject` | `{ targetNodeId?: number \| string } \| 'fail'` | 否 | 无 | 拒绝后的处理；当前 UI 暂未完整暴露，分支连线以 `rejectNextNodeIds` 为准。 |

### 6.5 示例：ask 模式

```json
{
  "id": 104,
  "type": "HumanInteraction",
  "name": "补充信息",
  "nextNodeIds": [105],
  "nodeConfig": {
    "hitlMode": "ask",
    "askConfig": {
      "question": "请补充订单号",
      "answerType": "TEXT",
      "answerKey": "orderNo",
      "required": true
    }
  }
}
```

### 6.6 示例：approve 模式

```json
{
  "id": 104,
  "type": "HumanInteraction",
  "name": "人类审批",
  "nextNodeIds": [],
  "nodeConfig": {
    "hitlMode": "approve",
    "approveConfig": {
      "actions": ["approve", "edit", "reject"],
      "promptToReviewer": "请确认智能体输出是否可发送给用户。",
      "draftSource": "context.agentAnswer",
      "onReject": {
        "targetNodeId": 102
      }
    },
    "approveNextNodeIds": [105],
    "rejectNextNodeIds": [102]
  }
}
```

## 7. ExternalConnector 节点

### 7.1 基础信息

| 项            | 值                               |
| ------------- | -------------------------------- |
| `type`        | `ExternalConnector`              |
| 连线字段      | 使用普通 `nextNodeIds`           |
| 支持 provider | `dify`、`n8n`、`coze`、`ragflow` |

### 7.2 `nodeConfig` 字段

| 字段 | 类型 | 必填 | 默认值 | 后端语义 |
| --- | --- | --- | --- | --- |
| `connectorProvider` | `'dify' \| 'n8n' \| 'coze' \| 'ragflow'` | 是 | `dify` | 外部连接器类型。 |
| `connectorConfig` | `ExternalConnectorConfig` | 是 | 见下表 | 外部请求配置。 |
| `autoWirePrevOutput` | `boolean` | 否 | UI 默认 `true` | 缺省入参是否取上一节点输出。 |
| `contextReads` | `string[]` | 否 | 无 | 显式声明读取上下文。 |
| `contextWrites` | `string[]` | 否 | 无 | 显式声明写入上下文。 |

### 7.3 `connectorConfig` 字段

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `endpoint` | `string` | 是 | 外部服务 URL，前端按 URL 校验。 |
| `authRef` | `string` | 是 | 认证引用，不保存明文密钥。后端根据引用读取密钥或 credential。 |
| `payloadTemplate` | `string` | 否 | 请求体模板，允许引用 RunContext，如 `{{context.userQuery}}`。 |
| `responseMapping` | `Record<string,string>` | 否 | 响应映射。key 是写入 RunContext 的路径，value 是响应取值路径。 |

### 7.4 provider 默认响应映射

| provider | 默认 `endpoint` 示例 | 默认 `responseMapping` |
| --- | --- | --- |
| `dify` | `https://api.dify.ai/v1/workflows/run` | `{ "context.connectorOutput": "data.outputs.text" }` |
| `n8n` | `https://n8n.example.com/webhook/<id>` | `{ "context.connectorOutput": "$.result" }` |
| `coze` | `https://api.coze.cn/v1/workflow/run` | `{ "context.connectorOutput": "data.output" }` |
| `ragflow` | `https://ragflow.example.com/v1/chats_openai/<chat_id>/chat/completions` | `{ "context.connectorOutput": "choices[0].message.content" }` |

### 7.5 示例

```json
{
  "id": 106,
  "type": "ExternalConnector",
  "name": "调用 Dify",
  "nextNodeIds": [107],
  "nodeConfig": {
    "connectorProvider": "dify",
    "connectorConfig": {
      "endpoint": "https://api.dify.ai/v1/workflows/run",
      "authRef": "credential:dify:default",
      "payloadTemplate": "{\"inputs\":{\"query\":\"{{context.userQuery}}\"},\"user\":\"{{runId}}\"}",
      "responseMapping": {
        "context.connectorOutput": "data.outputs.text"
      }
    },
    "autoWirePrevOutput": true,
    "contextReads": ["context.userQuery"],
    "contextWrites": ["context.connectorOutput"]
  }
}
```

## 8. 分支字段保存规则

AgentFlow 特殊分支不都写入 `nextNodeIds`，后端解析时需按节点类型读取。

| 节点 | 分支 | 字段 | 说明 |
| --- | --- | --- | --- |
| `Agent` | 默认输出 | `nextNodeIds` | 普通连线。 |
| `EvalGate` | 验证通过 | `nodeConfig.passNextNodeIds` | 全部验证通过后跳转。 |
| `EvalGate` | 单项验证失败 | `nodeConfig.evalValidators[].onFail.targetNodeId` | 每个 validator 一个失败回跳目标。 |
| `HumanInteraction` ask | 回答后继续 | `nextNodeIds` | 普通连线。 |
| `HumanInteraction` approve | 通过 | `nodeConfig.approveNextNodeIds` | 审批通过分支。 |
| `HumanInteraction` approve | 拒绝 | `nodeConfig.rejectNextNodeIds` | 审批拒绝分支。 |
| `ExternalConnector` | 默认输出 | `nextNodeIds` | 普通连线。 |

保存服务当前行为：

1. 保存前会清空特殊分支字段。
2. 再根据画布边重建 `passNextNodeIds`、`onFail.targetNodeId`、`approveNextNodeIds`、`rejectNextNodeIds`。
3. 未匹配到 validator 的 EvalGate fail 端口不会落入普通 `nextNodeIds`。

## 9. 运行时建议事件字段

当前前端 mock 事件使用以下形态，后端 SSE 可以参考但仍属于建议协议。

```ts
interface AgentFlowRunEvent {
  at: string;
  runId: string;
  type:
    | 'run_started'
    | 'node_started'
    | 'node_chunk'
    | 'node_completed'
    | 'node_failed'
    | 'gate_evaluated'
    | 'gate_routed'
    | 'human_required'
    | 'human_signal_applied'
    | 'context_updated'
    | 'run_completed'
    | 'run_failed'
    | 'run_cancelled';
  actor: 'system' | 'human' | NodeTypeEnum;
  payload: Record<string, unknown>;
}
```

关键 payload 建议：

| 事件 | payload 关键字段 |
| --- | --- |
| `node_started` | `nodeId`、`round` |
| `node_completed` | `nodeId`、`output`、`tokens`、`cost` |
| `gate_evaluated` | `nodeId`、`passed`、`failures[]` |
| `gate_routed` | `fromNodeId`、`toNodeId`、`validator`、`appendPrompt`、`round` |
| `human_required` | `nodeId`、`mode`、`question` 或 `draft`、`actions` |
| `human_signal_applied` | `nodeId`、`signal` |
| `context_updated` | `writes` 或变更后的 context 摘要 |
| `run_completed` | `finalOutput` |

## 10. 后端对接注意点

1. `workflowType = "AgentFlow"` 是资源子类型，不建议 v1 新增独立资源表。
2. 保存接口需要原样保留 AgentFlow 扩展字段，尤其是 `contextReads`、`contextWrites`、`autoWirePrevOutput`。
3. EvalGate 和 HITL approve 的分支不能只看 `nextNodeIds`。
4. `EvalValidator.onFail.targetNodeId` 当前类型允许 `number | string`，后端建议入库前归一化。
5. `ExternalConnector.connectorConfig.authRef` 只保存认证引用，不保存 secret 明文。
6. `HumanInteraction.askConfig.options` 当前 UI 仍是骨架输入，联调前需要确认最终传输数组还是 JSON 字符串。
7. Agent 节点 v1 建议仅支持 `agentMode = "platform"` 且 `agentId` 指向已发布 ChatBot；`subflow` 可先保存不执行。
8. 版本历史、发布、复制、导入导出需要包含完整 `nodeConfig`，不能按旧 Workflow 字段白名单裁剪。
