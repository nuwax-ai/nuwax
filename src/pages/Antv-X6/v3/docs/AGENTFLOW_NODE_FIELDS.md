# AgentFlow 节点字段对接清单（路由决策 / 询问用户 / 智能体）

> 更新日期：2026-06-26 ｜ 以当前前端代码为准
>
> 本文只覆盖三个节点：**路由决策（基于意图识别扩展）**、**询问用户（基于 QA 问答扩展）**、**智能体（全新）**。工作流、开始、结束节点沿用原协议，不在此列。
>
> 字段来源：
>
> - 默认配置：`src/pages/Antv-X6/v3/utils/nodeDefaultConfigFactory.ts`
> - 属性面板：`src/pages/Antv-X6/v3/agentFlow/forms/*Form.tsx`
> - 分支/端口：`src/pages/Antv-X6/v3/agentFlow/handlers/`
> - 条件适配：`src/pages/Antv-X6/v3/agentFlow/adapters/routeConditionAdapter.ts`
> - 类型定义：`src/types/interfaces/node.ts`、`src/types/enums/common.ts`

---

## 0. 传输约定（先看）

三个节点都是 AgentFlow 节点。前端在 API 边界**只翻 `type` 字段，`nodeConfig` 原样透传**：

| 前端 type          | 后端 type               | 关系                      |
| ------------------ | ----------------------- | ------------------------- |
| `RouteDecision`    | `IntentRecognition`     | 意图识别 + 路由扩展       |
| `HumanInteraction` | `QA`                    | 问答 + HITL（仅 ask）扩展 |
| `Agent`            | `Agent`（新增，不映射） | 全新节点                  |

> 报错 `Cannot deserialize ... from String "HumanInteraction"/"RouteDecision"` 即未做这层映射所致。

**后续节点（连线）的存放位置**——后端解析分支时按节点类型区分：

| 出口 | 存放位置 |
| --- | --- |
| 普通单出口（智能体、询问用户 text/form 模式） | 节点级 `ChildNode.nextNodeIds`（**不在 nodeConfig**） |
| 路由决策各分支 | `nodeConfig.intentConfigs[].nextNodeIds` |
| 路由决策兜底 | `nodeConfig.defaultNextNodeIds` |
| 询问用户 options 模式各选项 | `nodeConfig.options[].nextNodeIds` |

**通用入/出参结构 `Arg`**（`inputArgs` / `outputArgs` 元素，复用既有协议）：

```ts
interface Arg {
  key: string;
  name: string; // 参数名（符合命名规则）
  displayName: string;
  description: string;
  dataType: DataTypeEnum; // String | Integer | Boolean | Object | Array_String ...
  require: boolean;
  enable: boolean;
  systemVariable: boolean; // 系统内置变量，前端只读
  bindValueType: 'Input' | 'Reference' | null;
  bindValue: string | null; // Reference 时形如 "1.xxx"（节点1的xxx字段）；Input 时为字面值
  subArgs?: Arg[] | null;
  children?: Arg[] | null; // 与 subArgs 同步
  inputType?: 'Query' | 'Body' | 'Header' | 'Path' | null;
  selectConfig?: object | null;
  loopId?: number | null;
}
```

**三节点都带的通用字段**：`extension`（`{x, y, width?, height?}`，画布坐标）、`exceptionHandleConfig`（异常处理，复用既有协议）、`inputArgs`、`outputArgs`。

> 注：路由决策、询问用户的「异常处理」**面板 UI 已隐藏**，但 `exceptionHandleConfig` 数据仍会随 nodeConfig 下发（默认 `INTERRUPT`）。智能体保留异常处理 UI。

---

## 1. 路由决策 `RouteDecision` → 后端 `IntentRecognition`

在意图识别基础上，**每条 `intentConfigs` 新增 `condition` + `conditionArgs`** 两个字段，其余复用意图识别。

### 1.1 `nodeConfig` 字段

| 字段 | 类型 | 必填 | 默认 | 说明 |
| --- | --- | --- | --- | --- |
| `modelId` | `string` | 是 | 无 | 识别模型（复用意图识别） |
| `mode` | `string` | 否 | 无 | 模型参数：`Precision` / `Balanced` / `Creative` / `Customization` |
| `temperature` / `topP` / `maxTokens` | `number` | 否 | 无 | 模型参数（高级设置，可选） |
| `inputArgs` | `Arg[]` | 否 | `[]` | 输入 |
| `extraPrompt` | `string` | 否 | `''` | 补充提示词（系统提示词） |
| `intentConfigs` | `RouteBranch[]` | 是 | 1 条空分支 | 路由分支列表 |
| `defaultNextNodeIds` | `number[]` | 否 | `[]` | 无任何分支命中时的兜底后续节点 |
| `outputArgs` | `Arg[]` | 是 | `[matchedIntent:String]` | 固定输出 `matchedIntent` |

### 1.2 `RouteBranch`（`intentConfigs` 元素）

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `uuid` | `string` | 是 | 前端生成，端口/连线识别用，保存运行需稳定保留 |
| `intent` | `string` | 是 | 分支名称（复用意图识别 `intent` 字段，≤32 字符） |
| `description` | `string` | 否 | 分支描述（“什么情况下走这条分支”） |
| `condition` | `string` | 否 | **【新增】** 条件表达式字符串，**后端以此为执行依据** |
| `conditionArgs` | `ConditionArgs[]` | 否 | **【新增】** 结构化条件（前端编辑/回显用，当前仅 `conditionArgs[0]` 一条） |
| `nextNodeIds` | `number[]` | 否 | 命中该分支后走的节点 |

### 1.3 `ConditionArgs`

```ts
interface ConditionArgs {
  compareType: string | null; // 见下方运算符表
  firstArg: BindConfig | null; // 左值（变量引用）: { name, bindValue, bindValueType:'Reference' }
  secondArg: BindConfig | null; // 右值（值或变量）: bindValueType:'Input' | 'Reference'
}
```

`condition` 由前端从 `conditionArgs[0]` 序列化得到，**建议后端消费 `condition` 字符串**，`conditionArgs` 仅作结构化回显。运算符 → token 映射：

| compareType | token | compareType | token |
| --- | --- | --- | --- |
| `EQUAL` | `==` | `CONTAINS` | `contains` |
| `NOT_EQUAL` | `!=` | `NOT_CONTAINS` | `not contains` |
| `GREATER_THAN` | `>` | `MATCH_REGEX` | `matches` |
| `GREATER_THAN_OR_EQUAL` | `>=` | `IS_NULL` | `is null` |
| `LESS_THAN` | `<` | `NOT_NULL` | `is not null` |
| `LESS_THAN_OR_EQUAL` | `<=` | `LENGTH_GREATER_THAN` | `length>` |
| `LENGTH_GREATER_THAN_OR_EQUAL` | `length>=` | `LENGTH_LESS_THAN` | `length<` |
| `LENGTH_LESS_THAN_OR_EQUAL` | `length<=` |  |  |

- 变量统一格式化为 `{{name}}`；右值为 Input 时取字面值。
- `IS_NULL` / `NOT_NULL` 无右值，形如 `{{x}} is null`。
- 示例：`{{userQuery}} contains 退货`、`{{score}} >= 60`、`{{reply}} == {{expected}}`。

### 1.4 示例

```json
{
  "id": 201,
  "type": "RouteDecision",
  "name": "路由决策",
  "nextNodeIds": [],
  "nodeConfig": {
    "modelId": "qwen-plus",
    "inputArgs": [],
    "extraPrompt": "根据用户问题判断走哪条分支",
    "intentConfigs": [
      {
        "uuid": "r-1",
        "intent": "退货咨询",
        "description": "用户想退货/退款",
        "condition": "{{userQuery}} contains 退货",
        "conditionArgs": [
          {
            "compareType": "CONTAINS",
            "firstArg": {
              "name": "userQuery",
              "bindValue": "1.userQuery",
              "bindValueType": "Reference"
            },
            "secondArg": {
              "name": "",
              "bindValue": "退货",
              "bindValueType": "Input"
            }
          }
        ],
        "nextNodeIds": [202]
      }
    ],
    "defaultNextNodeIds": [203],
    "outputArgs": [
      {
        "key": "matchedIntent",
        "name": "matchedIntent",
        "dataType": "String",
        "description": "Matched intent",
        "require": true,
        "systemVariable": true
      }
    ]
  }
}
```

---

## 2. 询问用户 `HumanInteraction` → 后端 `QA`

在 QA 基础上扩展 `replyMode`、`formFields`、`contextWriteKey`，并固定 `hitlMode=ask`。

### 2.1 `nodeConfig` 字段

| 字段 | 类型 | 必填 | 默认 | 说明 |
| --- | --- | --- | --- | --- |
| `hitlMode` | `'ask'` | 是 | `ask` | 固定 ask（approve 模式已下线） |
| `modelId` | `string` | 否 | 无 | 模型（保留，复用 QA） |
| `mode` / `temperature` / `topP` / `maxTokens` | — | 否 | 无 | 模型参数（可选） |
| `inputArgs` | `Arg[]` | 否 | `[]` | 引用变量 |
| `question` | `string` | 否 | `''` | 提问模版 |
| `replyMode` | `'text' \| 'options' \| 'form'` | 是 | `text` | **【新增】** 回复模式，前端权威字段 |
| `answerType` | `'TEXT' \| 'SELECT'` | 是 | `TEXT` | 兼容 QA 老字段，由 replyMode 自动同步 |
| `options` | `QAOption[]` | `replyMode=options` 时 | `[]` | 选项列表 |
| `formFields` | `FormFieldConfig[]` | `replyMode=form` 时 | `[]` | **【新增】** 表单字段 |
| `contextWriteKey` | `string` | 否 | `user_reply` | **【新增】** 用户回答写入上下文的键名 |
| `outputArgs` | `Arg[]` | 是 | `[answer:String]` | 固定输出 `answer` |

`replyMode` ↔ `answerType` 同步规则：`text`/`form` → `answerType=TEXT`；`options` → `answerType=SELECT`。

### 2.2 `QAOption`（`options` 元素，复用 QA）

```ts
interface QAOption {
  uuid: string;
  index: number;
  content: string;
  nextNodeIds: number[]; // 该选项对应的后续节点
}
```

### 2.3 `FormFieldConfig`（`formFields` 元素，新增）

```ts
interface FormFieldConfig {
  label: string;
  type: 'input' | 'number' | 'textarea' | 'radio' | 'checkbox' | 'file';
  required: boolean;
  options?: string; // ⚠ radio/checkbox 用，当前为「换行分隔字符串」，尚未拆数组（见待确认项）
}
```

### 2.4 示例（三种回复模式）

```json
// text 模式
{
  "id": 211,
  "type": "HumanInteraction",
  "name": "询问用户",
  "nextNodeIds": [212],
  "nodeConfig": {
    "hitlMode": "ask",
    "replyMode": "text",
    "answerType": "TEXT",
    "inputArgs": [],
    "question": "请补充订单号",
    "options": [],
    "formFields": [],
    "contextWriteKey": "orderNo",
    "outputArgs": [
      {
        "key": "answer",
        "name": "answer",
        "dataType": "String",
        "description": "User answer",
        "require": true,
        "systemVariable": true
      }
    ]
  }
}
```

```json
// options 模式（分支在 options[].nextNodeIds）
{
  "id": 211,
  "type": "HumanInteraction",
  "name": "询问用户",
  "nextNodeIds": [],
  "nodeConfig": {
    "hitlMode": "ask",
    "replyMode": "options",
    "answerType": "SELECT",
    "question": "请选择问题类型",
    "options": [
      { "uuid": "o-1", "index": 0, "content": "退货", "nextNodeIds": [212] },
      { "uuid": "o-2", "index": 1, "content": "其他", "nextNodeIds": [213] }
    ],
    "formFields": [],
    "contextWriteKey": "user_reply",
    "outputArgs": [
      {
        "key": "answer",
        "name": "answer",
        "dataType": "String",
        "require": true,
        "systemVariable": true
      }
    ]
  }
}
```

```json
// form 模式（单出口走节点级 nextNodeIds）
{
  "id": 211,
  "type": "HumanInteraction",
  "name": "询问用户",
  "nextNodeIds": [212],
  "nodeConfig": {
    "hitlMode": "ask",
    "replyMode": "form",
    "answerType": "TEXT",
    "question": "请填写工单",
    "options": [],
    "formFields": [
      { "label": "标题", "type": "input", "required": true },
      {
        "label": "优先级",
        "type": "radio",
        "required": true,
        "options": "高\n中\n低"
      }
    ],
    "contextWriteKey": "ticket",
    "outputArgs": [
      {
        "key": "answer",
        "name": "answer",
        "dataType": "String",
        "require": true,
        "systemVariable": true
      }
    ]
  }
}
```

---

## 3. 智能体 `Agent`（新增，后端 type=`Agent`）

### 3.1 基础信息

| 项       | 值                                       |
| -------- | ---------------------------------------- |
| `type`   | `Agent`                                  |
| 连线     | 普通 `nextNodeIds`（节点级）             |
| 默认输出 | `outputArgs[0].key = "output"`（String） |

### 3.2 `nodeConfig` 字段

| 字段 | 类型 | 必填 | 默认 | 说明 |
| --- | --- | --- | --- | --- |
| `agentId` | `Long` | 是 | 无 | 智能体 ID（当前空间**已发布的 ChatBot**） |
| `inputArgs` | `Arg[]` | 否 | `[]` | 入参（引用上游变量，参考开始节点输入配置） |
| `extraPrompt` | `string` | 否 | `''` | 补充提示词 |
| `selfLoopTimes` | `int` | 否 | `0` | 自身循环次数（0=不循环） |
| `reminderPrompt` | `string` | 否 | `''` | 循环提醒提示词 |
| `outputArgs` | `Arg[]` | 是 | `[output:String]` | 固定输出 `output` |

### 3.3 示例

```json
{
  "id": 221,
  "type": "Agent",
  "name": "智能体",
  "nextNodeIds": [222],
  "nodeConfig": {
    "agentId": 1001,
    "inputArgs": [
      {
        "key": "question",
        "name": "question",
        "dataType": "String",
        "bindValueType": "Reference",
        "bindValue": "1.userQuery"
      }
    ],
    "extraPrompt": "用简洁中文回答",
    "selfLoopTimes": 0,
    "reminderPrompt": "",
    "outputArgs": [
      {
        "key": "output",
        "name": "output",
        "dataType": "String",
        "description": "Agent reply",
        "require": true,
        "systemVariable": true
      }
    ]
  }
}
```

---

## 4. 已废弃字段（前端不再下发，后端可忽略）

`NodeConfig` 类型中仍残留早期迭代字段，**当前前端不会写入**，后端不要依赖：

`subFlowId`、`agentInputs`、`agentMode`（枚举 `AgentNodeModeEnum` 已删）、`contextPassMode`、`contextParams`、`askConfig`（旧嵌套结构，已扁平化）、`inputPassMode`、`triggerMode`、`autoWirePrevOutput`、`contextReads`、`contextWrites`。

> 旧节点 `EvalGate`、`ExternalConnector` 及 HITL `approve` 模式均已下线。

---

## 5. 待确认项

1. **询问用户 · 表单字段 `formFields[].options`**：radio/checkbox 的选项当前是「换行分隔字符串」，尚未拆成数组。需后端确认契约（数组 vs 字符串）后，前端再补序列化。
2. **路由决策 · `condition` vs `conditionArgs`**：建议后端以 `condition` 字符串为执行依据；`conditionArgs` 为前端结构化镜像。
