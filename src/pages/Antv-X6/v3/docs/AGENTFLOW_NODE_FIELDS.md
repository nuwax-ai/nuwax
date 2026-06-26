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

| 前端 type | 后端 type | 关系 |
| --- | --- | --- |
| `RouteDecision` | `IntentRecognition` | 意图识别 + 路由扩展 |
| `HumanInteraction` | `QA` | 问答扩展（文本 / 选项 / 表单回复） |
| `Agent` | `Agent`（新增，不映射） | 全新节点 |

> 报错 `Cannot deserialize ... from String "HumanInteraction"/"RouteDecision"` 即未做这层映射所致。

**后续节点（连线）的存放位置**——后端解析分支时按节点类型区分：

| 出口 | 存放位置 |
| --- | --- |
| 普通单出口（智能体、询问用户 text/form 模式） | 节点级 `ChildNode.nextNodeIds`（**不在 nodeConfig**） |
| 路由决策各分支 | `nodeConfig.intentConfigs[].nextNodeIds` |
| 路由决策兜底 | `nodeConfig.defaultNextNodeIds` |
| 询问用户 options 模式各选项 | `nodeConfig.options[].nextNodeIds` |

**AgentFlow 连线规则**（与 Workflow 不同；前端在 `validateConnection` 与「端口加节点」处强制）：

- **开始节点（`Start`）输出端口有且仅一条连线**——已连出后，再次从 Start 端口拖线 / 加节点会被拦截（提示「开始节点只能连接一个后续节点」）；改接目标（重连该条边）允许。
- 其余节点沿用既有连线规则（普通节点单出口、分支节点多出口等）。

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

每条 `intentConfigs` 分支用结构化 `conditionArgs`（多条件，按 `conditionType` 用 AND/OR 连接）做条件匹配，对齐条件节点。**不再使用 `condition` 字符串字段**（已废弃 conditionArgs↔condition 互转）。

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
| `name` | `string` | 是 | 分支名称（≤32 字符，端口/连线 label 取此） |
| `intent` | `string` | 否 | 分支描述（“什么情况下走这条分支”） |
| `intentType` | `'NORMAL' \| 'OTHER'` | 是 | `NORMAL`=用户分支；`OTHER`=末尾兜底分支（见下） |
| `conditionArgs` | `ConditionArgs[]` | 否 | 结构化条件（支持多条），见 1.3；`OTHER` 分支不用 |
| `conditionType` | `'AND' \| 'OR'` | 否 | 多条件连接符（默认 `AND`） |
| `nextNodeIds` | `number[]` | 否 | 命中该分支后走的节点 |

> 字段对齐：旧 `intent`(分支名)→`name`，旧 `description`(描述)→`intent`；加载时由适配层迁移。废弃字段 `condition` / `expression` 会被剥离；`intentType` 规范化为 `NORMAL`/`OTHER`。

**「其他意图」兜底分支（`intentType: OTHER`）**：`intentConfigs` 末尾固定一条，名称固定「其他意图」，**不可删除、始终在最后、不展示条件匹配**（无 `conditionArgs`），命中即走其 `nextNodeIds`。加载时由适配层保证存在且仅一条（缺失则补、多余则仅保留最后一条）。

### 1.3 `ConditionArgs`（结构化条件，对齐条件节点）

### 1.3 `ConditionArgs`（结构化条件，对齐条件节点）

```ts
interface ConditionArgs {
  compareType: string; // 运算符，见下表
  firstArg: BindConfig | null; // 左值（变量引用）：bindValueType:'Reference'
  secondArg: BindConfig | null; // 右值（字面值）：bindValueType:'Input'
}
```

同分支多条 `conditionArgs` 按 `conditionType`（`AND`/`OR`）连接。右操作数固定为**字面值**（前端不再提供「值/变量」切换）。运算符 `compareType` 取值：

| compareType | 含义 | compareType | 含义 |
| --- | --- | --- | --- |
| `EQUAL` | 等于 | `CONTAINS` | 包含 |
| `NOT_EQUAL` | 不等于 | `NOT_CONTAINS` | 不包含 |
| `GREATER_THAN` | 大于 | `MATCH_REGEX` | 正则匹配 |
| `GREATER_THAN_OR_EQUAL` | 大于等于 | `IS_NULL` | 为空 |
| `LESS_THAN` | 小于 | `NOT_NULL` | 非空 |
| `LESS_THAN_OR_EQUAL` | 小于等于 | `LENGTH_GREATER_THAN` | 长度大于 |
| `LENGTH_GREATER_THAN_OR_EQUAL` | 长度大于等于 | `LENGTH_LESS_THAN` | 长度小于 |
| `LENGTH_LESS_THAN_OR_EQUAL` | 长度小于等于 |  |  |

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
        "name": "退货咨询",
        "intent": "用户提问包含退货关键词",
        "conditionType": "AND",
        "conditionArgs": [
          {
            "compareType": "CONTAINS",
            "firstArg": {
              "bindValue": "1.userQuery",
              "bindValueType": "Reference",
              "name": "userQuery"
            },
            "secondArg": {
              "bindValue": "退货",
              "bindValueType": "Input",
              "name": ""
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

在 QA 基础上扩展 `answerType`（新增 `FORM` 取值）、`formArgs`、`contextWriteKey`。

### 2.1 `nodeConfig` 字段

| 字段 | 类型 | 必填 | 默认 | 说明 |
| --- | --- | --- | --- | --- |
| `modelId` | `string` | 否 | 无 | 模型（保留，复用 QA） |
| `mode` / `temperature` / `topP` / `maxTokens` | — | 否 | 无 | 模型参数（可选） |
| `inputArgs` | `Arg[]` | 否 | `[]` | 引用变量 |
| `question` | `string` | 否 | `''` | 提问模版 |
| `answerType` | `'TEXT' \| 'SELECT' \| 'FORM'` | 是 | `TEXT` | 权威字段（沿用 QA，扩展 `FORM`）：TEXT=文本 / SELECT=选项(分支) / FORM=表单 |
| `options` | `QAOption[]` | `answerType=SELECT` 时 | `[]` | 选项列表 |
| `formArgs` | `Arg[]` | `answerType=FORM` 时 | `[]` | **【新增】** 表单字段（直接复用 `Arg`，控件类型走 `inputType`，见 2.3） |
| `contextWriteKey` | `string` | 否 | `user_reply` | **【新增】** 用户回答写入上下文的键名 |
| `outputArgs` | `Arg[]` | 是 | `[answer:String]` | 固定输出 `answer` |

> `answerType` 为唯一权威字段，不再使用 `replyMode`；加载时旧 `replyMode`/嵌套 `askConfig` 会被迁移并清除。

### 2.2 `QAOption`（`options` 元素，复用 QA）

```ts
interface QAOption {
  uuid: string;
  index: number;
  content: string;
  nextNodeIds: number[]; // 该选项对应的后续节点
}
```

### 2.3 `formArgs` 元素（直接复用 `Arg`）

> **作用域**：本节（`formArgs`、`inputType` 取表单控件值、`selectConfig` 选项解析）**仅适用于 AgentFlow 下的「询问用户」(HumanInteraction) 节点**。其他节点（常规 Workflow QA、HTTP 等）的 `inputType` 语义不受影响——HTTP 节点仍用 `Query`/`Body`/`Header`/`Path`。

`formArgs` 元素**直接复用 `inputArgs` 的 `Arg` 结构**（「新增变量」同款），不新增字段：表单控件类型写入 `Arg` 既有的 `inputType`，单选/多选再用 `Arg.selectConfig`。

| `Arg` 字段 | 表单语义 |
| --- | --- |
| `key` | 前端生成，唯一标识 |
| `name` | 字段名称（展示给用户的 label） |
| `description` | 填写说明（提示用户输入什么内容） |
| `dataType` | 数据类型（`String` / `Integer` / ...） |
| `require` | 是否必填 |
| `inputType` | **【复用】** 表单控件类型，取值见下表 |
| `selectConfig` | 仅单选（`select`/`radio`）与多选（`checkboxes`）填：`{ dataSourceType: 'MANUAL', options: CascaderOption[] }`；其余类型为 `null` |

**`inputType` 取值**（对齐后端枚举）：

| 后端枚举 | `inputType` 值 | 含义 | 需要 `selectConfig` |
| --- | --- | --- | --- |
| Text | `text` | 文本输入（单行/多行均为 `text`） | 否 |
| Select | `select` | 下拉单选 | 是 |
| MultipleSelect | `checkboxes` | 多选 | 是 |
| Number | `number` | 数字 | 否 |
| File | `file` | 文件上传 | 否 |
| Radio | `radio` | 单选 | 是 |

**选项解析**：`selectConfig.options` 由「每行一个选项」的文本框按换行符 `\n` 解析得到，每行 → `{ label, value }`（`label` 与 `value` 取相同值）。

> `inputType` 在 HTTP 节点另有 `Query`/`Body`/`Header`/`Path` 取值；表单场景仅用上表取值。旧版自定义 `FormFieldConfig`（`label`/`required`/`type` + `options: string[]`）已废弃；加载时由适配层迁移为 `Arg`（`name`/`require`/`inputType` + `selectConfig`）。

### 2.4 示例（三种回复模式）

```json
// text 模式（用户输入文本，写入 contextWriteKey；inputArgs 引用变量可在 question 中用 {{name}} 引用）
{
  "id": 211,
  "type": "HumanInteraction",
  "name": "询问用户",
  "nextNodeIds": [212],
  "nodeConfig": {
    "answerType": "TEXT",
    "modelId": "qwen-plus",
    "inputArgs": [
      {
        "key": "orderId",
        "name": "orderId",
        "displayName": null,
        "description": "上游传入的订单号",
        "dataType": "String",
        "require": false,
        "enable": true,
        "systemVariable": false,
        "bindValueType": "Reference",
        "bindValue": "1.orderId",
        "inputType": null,
        "selectConfig": null
      }
    ],
    "question": "请补充订单 {{orderId}} 的退款金额",
    "options": [],
    "formArgs": [],
    "contextWriteKey": "refundAmount",
    "outputArgs": [
      {
        "key": "answer",
        "name": "answer",
        "displayName": null,
        "description": "User answer",
        "dataType": "String",
        "require": true,
        "enable": true,
        "systemVariable": true,
        "bindValueType": null,
        "bindValue": null,
        "inputType": null,
        "selectConfig": null
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
    "answerType": "SELECT",
    "question": "请选择问题类型",
    "options": [
      { "uuid": "o-1", "index": 0, "content": "退货", "nextNodeIds": [212] },
      { "uuid": "o-2", "index": 1, "content": "其他", "nextNodeIds": [213] }
    ],
    "formArgs": [],
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
// form 模式（answerType=FORM；formArgs 元素即「新增变量」Arg，inputType 指定控件，单选/多选补 selectConfig）
{
  "id": 211,
  "type": "HumanInteraction",
  "name": "收集退货信息",
  "nextNodeIds": [212],
  "nodeConfig": {
    "answerType": "FORM",
    "modelId": "qwen-plus",
    "inputArgs": [],
    "question": "请填写退货信息，我们会尽快为您处理",
    "options": [],
    "formArgs": [
      {
        "key": "orderNo",
        "name": "订单号",
        "displayName": null,
        "description": "请输入需要退货的订单编号",
        "dataType": "String",
        "require": true,
        "enable": true,
        "systemVariable": false,
        "bindValueType": null,
        "bindValue": null,
        "inputType": "text",
        "selectConfig": null
      },
      {
        "key": "returnCount",
        "name": "退货数量",
        "displayName": null,
        "description": "退货件数",
        "dataType": "Integer",
        "require": true,
        "enable": true,
        "systemVariable": false,
        "bindValueType": null,
        "bindValue": null,
        "inputType": "number",
        "selectConfig": null
      },
      {
        "key": "returnType",
        "name": "退货类型",
        "displayName": null,
        "description": "请选择退货或换货",
        "dataType": "String",
        "require": true,
        "enable": true,
        "systemVariable": false,
        "bindValueType": null,
        "bindValue": null,
        "inputType": "select",
        "selectConfig": {
          "dataSourceType": "MANUAL",
          "options": [
            { "label": "退货退款", "value": "退货退款" },
            { "label": "换货", "value": "换货" }
          ]
        }
      },
      {
        "key": "refundMethod",
        "name": "退款方式",
        "displayName": null,
        "description": "可多选",
        "dataType": "String",
        "require": false,
        "enable": true,
        "systemVariable": false,
        "bindValueType": null,
        "bindValue": null,
        "inputType": "checkboxes",
        "selectConfig": {
          "dataSourceType": "MANUAL",
          "options": [
            { "label": "原路退回", "value": "原路退回" },
            { "label": "退至余额", "value": "退至余额" }
          ]
        }
      }
    ],
    "contextWriteKey": "returnForm",
    "outputArgs": [
      {
        "key": "answer",
        "name": "answer",
        "displayName": null,
        "description": "User answer",
        "dataType": "String",
        "require": true,
        "enable": true,
        "systemVariable": true,
        "bindValueType": null,
        "bindValue": null,
        "inputType": null,
        "selectConfig": null
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

1. ~~表单字段 `formArgs[].options` 数组 vs 字符串~~ → **已定：选择类字段走 `selectConfig`**（`{ dataSourceType: 'MANUAL', options: [{label, value}] }`，`label`/`value` 传相同值）。前端「每行一个选项」录入，保存时转换为 `{label, value}` 数组；加载时自动迁移历史「换行字符串 / string[]」。
2. ~~路由决策 · `condition` vs `conditionArgs`~~ → **已定：用结构化 `conditionArgs`（多条件，按 `conditionType` AND/OR 连接，对齐条件节点），废弃 `condition` 字符串字段及 conditionArgs↔condition 互转逻辑**。字段同步对齐：`intent`→`name`（分支名）、`description`→`intent`（描述）。
