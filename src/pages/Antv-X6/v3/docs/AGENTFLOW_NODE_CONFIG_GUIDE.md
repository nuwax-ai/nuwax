# AgentFlow 节点配置字段与操作步骤（后端调试用）

> 适用范围：当前需求确定的 AgentFlow 节点集合 —— **开始 / 结束 / 路由决策 / 智能体 / 工作流 / 询问用户**。用途：给后端联调时按节点配置字段、构造请求。
>
> ⚠️ 与同目录 `AGENTFLOW_NODE_BACKEND_FIELDS.md` 的区别：那份是早期设计（节点集为 EvalGate/HumanInteraction/ExternalConnector，Agent 用 `agentMode/subFlowId/agentInputs`），与本需求**不一致**。以本文为准；两者冲突处需要和实现 agent 对齐后清理旧文档。
>
> 字段来源：当前前端实现（`agentFlow/*Form.tsx`、`complexNode.tsx`、`nodeDefaultConfigFactory.ts`、`types/interfaces/node.ts`）+ 后端枚举（来自 add 接口报错信息）。原型分享链接已过期，labels 待原型恢复后再核对。

---

## 1. 核心：节点类型映射

AgentFlow 是 Workflow 子类型，节点仍走 `/api/workflow/*`。**关键：路由决策、询问用户复用既有节点类型，`type` 必须用后端枚举值**，否则报 `Cannot deserialize ... NodeType from String "RouteDecision"`。

| AgentFlow 显示名 | 后端 `type` | 复用的既有节点 | 备注 |
| --- | --- | --- | --- |
| 开始 | `Start` | — | 自动存在 |
| 结束 | `End` | — | 自动存在 |
| 路由决策 | `IntentRecognition` | 意图识别 | `intentConfigs` 每项**新增 `condition`** |
| 智能体 | `Agent` | （新增类型） | 4 字段契约 |
| 工作流 | `Workflow` | 工作流 |  |
| 询问用户 | `QA` | 问答 | 仅展示名不同 |

后端枚举可接受值（来自报错）：`Start, End, IntentRecognition, Agent, Workflow, QA, LLM, Code, Condition, Loop, LoopStart, LoopEnd, LoopBreak, LoopContinue, Knowledge, KnowledgeInsert, Variable, VariableAggregation, LongTermMemory, HTTPRequest, TextProcessing, DocumentExtraction, Plugin, Mcp, Output, TableDataAdd/Delete/Update/Query, TableSQL`。 **不接受**：`RouteDecision`、`EvalGate`、`HumanInteraction`、`ExternalConnector`。

所有节点 `shape` 统一为 `"general-Node"`（仅 Loop 为 `"loop-node"`）。

---

## 2. 配置操作步骤

### 2.1 界面操作（前端配置）

1. 进入 AgentFlow 画布（EditAgent「编排」Tab，或 Workflow V3 编辑器）。
2. 左下角 **「添加节点」** → 在弹层选择节点类型（开始/结束默认已存在）。
3. **单击**画布上的节点 → 右侧弹出属性面板（拖动节点只移动，不弹面板）。
4. 按下文「字段表」逐项填写。
5. 连线：从节点输出端口拖到目标节点。分支节点的每个分支各有一个端口：
   - 路由决策：每条分支（`intentConfigs[i]`）一个端口 + 一个默认兜底端口。
   - 询问用户（SELECT）：每个选项（`options[i]`）一个端口。
6. 失焦 / 切换节点时前端**全量保存**整图。

### 2.2 接口调试（直接调后端）

| 步骤 | 接口 | 方法 | 说明 |
| --- | --- | --- | --- |
| 新增节点 | `/api/workflow/node/add` | POST | 创建节点骨架，返回新节点 `id` |
| 整图保存 | `/api/workflow/update` | POST | 传完整 `nodes[]`+连线，节点完整 `nodeConfig` 在此落库 |
| 查询整图 | `/api/workflow/{id}` | GET |  |
| 查询单节点 | `/api/workflow/node/{id}` | GET |  |
| 删除节点 | `/api/workflow/node/delete/{id}` | POST |  |
| 节点试运行 | `/api/workflow/test/node/execute` | POST |  |
| 整图校验 | `/api/workflow/valid/{id}` | GET |  |

**新增节点请求体**：

```json
{
  "workflowId": 1502,
  "type": "IntentRecognition",
  "name": "路由决策",
  "shape": "general-Node",
  "description": "AI 决策走哪条分支",
  "extension": { "x": 625, "y": 17.5 },
  "nodeConfigDto": {}
}
```

> `nodeConfigDto` 是**创建期**的轻量配置（如 Agent 的 `agentId`、Workflow 的 `typeId`）；完整 `nodeConfig`（含 `intentConfigs`、`options`、模型参数等）通过整图保存 `/api/workflow/update` 落库。分支连线 `nextNodeIds` 写在各自字段里（见下）。

调试建议顺序：① add 拿到 id → ② 组装完整 `nodeConfig` → ③ `/api/workflow/update` 保存 → ④ `/api/workflow/{id}` 回查确认字段未被裁剪。

---

## 3. 通用字段

### 3.1 节点外层（`nodes[]` 每项）

| 字段          | 类型     | 说明                           |
| ------------- | -------- | ------------------------------ |
| `id`          | number   | 节点 ID                        |
| `type`        | string   | 见 §1                          |
| `name`        | string   | 节点名称                       |
| `description` | string   | 描述                           |
| `shape`       | string   | `"general-Node"`               |
| `workflowId`  | number   | 所属工作流                     |
| `nextNodeIds` | number[] | 普通后继（分支节点见各自字段） |
| `nodeConfig`  | object   | 节点配置，见下                 |

### 3.2 `nodeConfig` 通用字段（各节点均可有）

| 配置项 | name | 值/类型 |
| --- | --- | --- |
| 画布位置/尺寸 | `extension` | `{ x:number, y:number, width?:number, height?:number }` |
| 异常处理 | `exceptionHandleConfig` | `{ retryCount:int, timeout:int(秒, 默认180), exceptionHandleType:'INTERRUPT'\|..., specificContent:{}, exceptionHandleNodeIds:number[] }` |
| 输入参数 | `inputArgs` | `ArgItem[]`（见 §10） |
| 输出参数 | `outputArgs` | `ArgItem[]`（见 §10） |

---

## 4. 开始 Start（`type=Start`）

| 配置项(label) | name        | 值/类型     |
| ------------- | ----------- | ----------- |
| 流程输入变量  | `inputArgs` | `ArgItem[]` |

**步骤**：开始节点默认存在 → 单击 → 在「输入」区添加流程入参（name + dataType + 是否必填）。

```json
{
  "type": "Start",
  "name": "开始",
  "nodeConfig": {
    "inputArgs": [
      {
        "key": "userQuery",
        "name": "userQuery",
        "dataType": "String",
        "require": true
      }
    ]
  }
}
```

---

## 5. 结束 End（`type=End`）

| 配置项   | name         | 值/类型                        |
| -------- | ------------ | ------------------------------ |
| 输出变量 | `outputArgs` | `ArgItem[]`                    |
| 返回类型 | `returnType` | `'VARIABLE'`（默认）/ `'TEXT'` |

```json
{
  "type": "End",
  "name": "结束",
  "nodeConfig": {
    "returnType": "VARIABLE",
    "outputArgs": [
      {
        "key": "result",
        "name": "result",
        "dataType": "String",
        "bindValue": "{{node_x.output}}"
      }
    ]
  }
}
```

---

## 6. 路由决策（`type=IntentRecognition`）= 原意图识别 + condition

| 配置项 | name | 值/类型 |
| --- | --- | --- |
| 识别模型 | `modelId` | number |
| 模型参数 | `temperature` / `topP` / `maxTokens` / `mode` | number / number / int / string |
| 输入参数 | `inputArgs` | `ArgItem[]` |
| 分支配置 | `intentConfigs` | 数组，每项见下 |
| · 分支名称(意图) | `intentConfigs[].intent` | string |
| · 唯一标识 | `intentConfigs[].uuid` | string |
| · 下游节点 | `intentConfigs[].nextNodeIds` | number[] |
| · **条件比对（扩展）** | `intentConfigs[].condition` | string，表达式，支持 `{{变量}}` |
| · 分支描述（前端附加） | `intentConfigs[].description` | string（可选） |
| 系统/补充提示词 | `extraPrompt` | string |
| 输出(命中意图) | `outputArgs` | `ArgItem[]`，默认 key `matchedIntent` |

**步骤**：添加节点（`type=IntentRecognition`）→ 选识别模型 → 在「分支」区逐条添加（填分支名称 `intent`、条件比对 `condition`、可选描述）→ 每条分支端口连到下游 → 默认兜底端口连「无匹配」分支。

```json
{
  "type": "IntentRecognition",
  "name": "路由决策",
  "nodeConfig": {
    "modelId": 1,
    "extraPrompt": "根据用户问题选择最合适的分支",
    "intentConfigs": [
      {
        "uuid": "r1",
        "intent": "售后",
        "description": "售后/退换货",
        "condition": "{{userQuery}} contains 退货",
        "nextNodeIds": [201]
      },
      {
        "uuid": "r2",
        "intent": "咨询",
        "description": "产品咨询",
        "condition": "",
        "nextNodeIds": [202]
      }
    ],
    "defaultNextNodeIds": [203],
    "outputArgs": [
      {
        "key": "matchedIntent",
        "name": "matchedIntent",
        "dataType": "String",
        "systemVariable": true
      }
    ]
  }
}
```

> `condition` 是本需求在原 `intentConfigs` 上新增的字段；`defaultNextNodeIds` 为无匹配兜底分支（前端有则生成默认端口）。

---

## 7. 智能体 Agent（`type=Agent`）

后端契约 4 字段：

| 配置项         | name             | 值/类型                             |
| -------------- | ---------------- | ----------------------------------- |
| 智能体         | `agentId`        | Long/number（**仅当前空间内**可选） |
| 补充提示词     | `extraPrompt`    | string                              |
| 自身循环次数   | `selfLoopTimes`  | int，默认 0                         |
| 循环提醒提示词 | `reminderPrompt` | string                              |
| 输出(回复)     | `outputArgs`     | `ArgItem[]`，默认 key `output`      |

**步骤**：添加节点（`type=Agent`）→ 弹窗/下拉选当前空间内已发布智能体（写入 `agentId`）→ 填补充提示词 / 自身循环次数 / 循环提醒提示词。

```json
{
  "type": "Agent",
  "name": "智能体",
  "nodeConfig": {
    "agentId": 3217,
    "extraPrompt": "用简洁中文回答",
    "selfLoopTimes": 0,
    "reminderPrompt": "",
    "outputArgs": [
      {
        "key": "output",
        "name": "output",
        "dataType": "String",
        "systemVariable": true
      }
    ]
  }
}
```

> 前端目前还会带 `contextPassMode`（auto/manual）、`contextParams`，**不在后端 4 字段契约内**，后端可忽略（该字段去留由实现 agent 对齐）。

---

## 8. 工作流 Workflow（`type=Workflow`）

| 配置项          | name                                         | 值/类型     |
| --------------- | -------------------------------------------- | ----------- |
| 引用的工作流 ID | add 请求 `nodeConfigDto.targetId` / `typeId` | number      |
| 入参            | `inputArgs`                                  | `ArgItem[]` |
| 出参            | `outputArgs`                                 | `ArgItem[]` |

**步骤**：添加节点（`type=Workflow`）→ 选择要引用的工作流（写入 `typeId`）→ 配置入参映射。

```json
{
  "type": "Workflow",
  "name": "子工作流",
  "typeId": 1490,
  "nodeConfig": { "inputArgs": [], "outputArgs": [] }
}
```

---

## 9. 询问用户（`type=QA`）= 原问答

| 配置项 | name | 值/类型 |
| --- | --- | --- |
| 应答模型 | `modelId`(+`temperature`/`topP`/`maxTokens`/`mode`) | number / 参数 |
| 输入参数 | `inputArgs` | `ArgItem[]` |
| 问题文案 | `question` | string，支持 `{{变量}}` |
| 应答类型 | `answerType` | `'TEXT'` / `'SELECT'` |
| 选项（仅 SELECT） | `options` | 数组，每项见下 |
| · 选项内容 | `options[].content` | string |
| · 唯一标识 | `options[].uuid` | string |
| · 序号 | `options[].index` | number |
| · 下游节点 | `options[].nextNodeIds` | number[] |
| 输出(应答) | `outputArgs` | `ArgItem[]`，默认 key `answer`（TEXT 模式可编辑） |

**步骤**：添加节点（`type=QA`）→ 选模型 → 填问题文案 → 选应答类型；SELECT 模式下逐条加选项并把每个选项端口连到下游，TEXT 模式配置输出变量。

```json
{
  "type": "QA",
  "name": "询问用户",
  "nodeConfig": {
    "modelId": 1,
    "question": "请问需要哪种服务？",
    "answerType": "SELECT",
    "options": [
      { "uuid": "o1", "index": 0, "content": "售后", "nextNodeIds": [301] },
      { "uuid": "o2", "index": 1, "content": "咨询", "nextNodeIds": [302] }
    ],
    "outputArgs": [
      {
        "key": "answer",
        "name": "answer",
        "dataType": "String",
        "systemVariable": true
      }
    ]
  }
}
```

---

## 10. 共用子结构

### ArgItem（`inputArgs` / `outputArgs` 每项）

```json
{
  "key": "string",
  "name": "string",
  "displayName": null,
  "description": "",
  "dataType": "String | Integer | Number | Boolean | Object | Array_String | ...",
  "require": false,
  "enable": true,
  "systemVariable": false,
  "bindValueType": null,
  "bindValue": null,
  "subArgs": null,
  "children": null
}
```

### 分支节点连线落点

| 节点 | 分支 | 字段 |
| --- | --- | --- |
| 路由决策(IntentRecognition) | 每条分支 | `intentConfigs[].nextNodeIds` |
| 路由决策(IntentRecognition) | 无匹配兜底 | `defaultNextNodeIds` |
| 询问用户(QA, SELECT) | 每个选项 | `options[].nextNodeIds` |
| 询问用户(QA, TEXT) / Agent / Workflow | 普通后继 | `nextNodeIds` |

---

## 11. 待确认 / 注意

1. **`type` 用后端枚举值**：路由决策 →`IntentRecognition`，询问用户 →`QA`。前端内部曾用 `RouteDecision`/`HumanInteraction`，发后端前需映射（实现 agent 处理中）。
2. **模型字段嵌套**：`modelId`/`temperature`/`topP`/`maxTokens`/`mode` 前端为平铺；另有 `modelConfig:{id,maxTokens}`。落库平铺还是嵌套，需与后端确认。
3. **路由决策 condition**：在原 `intentConfigs` 每项新增，后端需在意图识别配置上扩展该字段。
4. **Agent 仅 4 字段契约**；`contextPassMode`/`contextParams` 是前端扩展，后端可忽略或透传。
5. **保存需透传完整 `nodeConfig`**，版本历史/发布/复制不要按旧 Workflow 白名单裁剪扩展字段。
6. 原型分享链接已过期，本文 label 以前端实现为准，原型恢复后再核对文案与是否有遗漏字段。
