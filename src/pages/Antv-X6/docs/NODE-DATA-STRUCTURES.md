# 节点数据结构详情文档

> 本文档详细描述了各节点类型的数据结构字段定义，作为 V2 重构的参照标准。

**导航**: [📚 文档索引](./README.md) | [⬆️ 主文档](../V1-FEATURES.md)

**相关文档**:

- [X6 自定义节点](./X6-CUSTOM-NODES.md) - 节点的视觉渲染实现
- [API 数据交互](./API-DATA-INTERACTION.md) - 节点数据的增删改查

---

## 目录

- [通用数据结构](#通用数据结构)
- [基础节点](#基础节点)
- [AI 节点](#ai-节点)
- [逻辑控制节点](#逻辑控制节点)
- [数据操作节点](#数据操作节点)
- [集成节点](#集成节点)

---

## 通用数据结构

### ChildNode (节点基础结构)

所有节点都继承此基础结构：

```typescript
interface ChildNode {
  id: number; // 节点唯一标识
  name: string; // 节点名称
  description: string; // 节点描述
  workflowId: number; // 所属工作流 ID
  type: NodeTypeEnum; // 节点类型枚举
  preNodes?: number[] | null; // 前置节点 ID 列表
  nextNodes?: number[] | null; // 后继节点 ID 列表
  nextNodeIds?: number[] | null; // 下一节点 ID 列表
  nodeConfig: NodeConfig; // 节点配置（核心）
  innerNodes?: ChildNode[] | null; // 内部节点（循环节点使用）
  innerStartNodeId?: number | null; // 内部开始节点 ID
  innerEndNodeId?: number | null; // 内部结束节点 ID
  shape: NodeShapeEnum; // 节点形状
  icon: string | React.ReactNode; // 节点图标
  loopNodeId?: number; // 所属循环节点 ID
  isEditingName?: boolean; // 是否正在编辑名称
  isFocus?: boolean; // 是否聚焦
  runResults?: RunResultItem[]; // 运行结果
  typeId?: number; // 类型 ID（插件/工作流等）
}
```

### NodeConfig (节点配置基础结构)

```typescript
interface NodeConfig {
  // 扩展信息（前端配置）
  extension?: {
    x?: number; // X 坐标
    y?: number; // Y 坐标
    width?: number; // 宽度
    height?: number; // 高度
  } | null;

  // 通用参数配置
  inputArgs?: InputAndOutConfig[]; // 输入参数列表
  outputArgs?: InputAndOutConfig[]; // 输出参数列表
  variableArgs?: InputAndOutConfig[]; // 变量参数列表

  // 异常处理配置
  exceptionHandleConfig?: ExceptionHandleConfig;
}
```

### InputAndOutConfig (参数配置)

```typescript
interface InputAndOutConfig {
  name: string; // 参数名称
  description: string | null; // 参数描述
  dataType: DataTypeEnum | null; // 数据类型
  require: boolean; // 是否必填
  systemVariable: boolean; // 是否为系统内置变量
  bindValueType?: 'Input' | 'Reference'; // 值引用类型
  bindValue: string; // 参数值
  subArgs?: InputAndOutConfig[]; // 子参数列表
  children?: InputAndOutConfig[]; // 子节点（树形结构）
  key: string; // 参数唯一标识
  enable?: boolean; // 是否启用
  inputType?: string; // 输入类型
}
```

### ExceptionHandleConfig (异常处理配置)

```typescript
interface ExceptionHandleConfig {
  exceptionHandleType: ExceptionHandleTypeEnum; // 异常处理类型
  timeout: number; // 超时时间（秒）
  retryCount: number; // 重试次数
  specificContent?: string; // 特定内容（返回特定内容时使用）
  exceptionHandleNodeIds?: number[]; // 异常分支节点 ID 列表
}

enum ExceptionHandleTypeEnum {
  INTERRUPT = 'INTERRUPT', // 中断执行
  SPECIFIC_CONTENT = 'SPECIFIC_CONTENT', // 返回特定内容
  EXECUTE_EXCEPTION_FLOW = 'EXECUTE_EXCEPTION_FLOW', // 执行异常分支
}
```

### DataTypeEnum (数据类型枚举)

```typescript
enum DataTypeEnum {
  String = 'String', // 文本
  Integer = 'Integer', // 整型数字
  Number = 'Number', // 数字
  Boolean = 'Boolean', // 布尔
  Object = 'Object', // 对象

  // 文件类型
  File = 'File', // 默认文件
  File_Image = 'File_Image', // 图像文件
  File_PPT = 'File_PPT', // PPT 文件
  File_Doc = 'File_Doc', // DOC 文件
  File_PDF = 'File_PDF', // PDF 文件
  File_Txt = 'File_Txt', // TXT 文件
  File_Excel = 'File_Excel', // Excel 文件
  File_Video = 'File_Video', // 视频文件
  File_Audio = 'File_Audio', // 音频文件

  // 数组类型
  Array_String = 'Array_String', // String 数组
  Array_Integer = 'Array_Integer', // Integer 数组
  Array_Number = 'Array_Number', // Number 数组
  Array_Boolean = 'Array_Boolean', // Boolean 数组
  Array_Object = 'Array_Object', // 对象数组
  Array_File = 'Array_File', // 文件数组
  // ... 其他数组类型
}
```

---

## 基础节点

### StartNode (开始节点)

**类型枚举**: `NodeTypeEnum.Start`

**属性面板配置项**:

| 表单字段 | 类型 | 说明 | 对应 NodeConfig 字段 |
| --- | --- | --- | --- |
| inputArgs | InputAndOutConfig[] | 输入参数（全局变量） | nodeConfig.inputArgs |

**NodeConfig 结构**:

```typescript
interface StartNodeConfig extends NodeConfig {
  inputArgs: InputAndOutConfig[]; // 输入参数列表，作为工作流入口变量
}
```

**组件实现**: `nodeItem.tsx` - `StartNode`

---

### EndNode (结束节点)

**类型枚举**: `NodeTypeEnum.End`

**属性面板配置项**:

| 表单字段 | 类型 | 说明 | 对应 NodeConfig 字段 |
| --- | --- | --- | --- |
| returnType | 'VARIABLE' \| 'TEXT' | 返回类型 | nodeConfig.returnType |
| outputArgs | InputAndOutConfig[] | 输出变量 | nodeConfig.outputArgs |
| content | string | 输出内容（returnType='TEXT' 时） | nodeConfig.content |

**NodeConfig 结构**:

```typescript
interface EndNodeConfig extends NodeConfig {
  returnType: 'VARIABLE' | 'TEXT'; // 返回类型
  outputArgs: InputAndOutConfig[]; // 输出变量列表
  content?: string; // 输出内容（文本模式）
}
```

**组件实现**: `nodeItem.tsx` - `EndNode`

---

### OutputNode (过程输出节点)

**类型枚举**: `NodeTypeEnum.Output`

与 EndNode 共用组件，配置结构相同。

---

## AI 节点

### ModelNode / LLM (大模型节点)

**类型枚举**: `NodeTypeEnum.LLM`

**属性面板配置项**:

| 表单字段 | 类型 | 说明 | 对应 NodeConfig 字段 |
| --- | --- | --- | --- |
| modelId | number | 模型 ID | nodeConfig.modelId |
| modelConfig | object | 模型配置 | nodeConfig.modelConfig |
| systemPrompt | string | 系统提示词 | nodeConfig.systemPrompt |
| userPrompt | string | 用户提示词 | nodeConfig.userPrompt |
| inputArgs | InputAndOutConfig[] | 输入参数 | nodeConfig.inputArgs |
| outputArgs | InputAndOutConfig[] | 输出参数 | nodeConfig.outputArgs |
| skillComponentConfigs | CreatedNodeItem[] | 技能列表 | nodeConfig.skillComponentConfigs |
| exceptionHandleConfig | ExceptionHandleConfig | 异常处理 | nodeConfig.exceptionHandleConfig |

**NodeConfig 结构**:

```typescript
interface ModelNodeConfig extends NodeConfig {
  // 模型配置
  modelId?: number; // 模型 ID
  modelConfig?: {
    id?: number; // 配置 ID
    maxTokens?: number; // 最大 token 数
  };

  // 提示词
  systemPrompt?: string; // 系统提示词
  userPrompt?: string; // 用户提示词

  // 模型参数
  temperature?: number; // 温度参数
  topP?: number; // Top P 参数
  maxTokens?: number; // 最大回复长度

  // 技能配置
  skillComponentConfigs?: CreatedNodeItem[]; // 技能列表

  // 参数配置
  inputArgs: InputAndOutConfig[]; // 输入参数
  outputArgs: InputAndOutConfig[]; // 输出参数

  // 异常处理
  exceptionHandleConfig?: ExceptionHandleConfig;
}
```

**技能项结构 (CreatedNodeItem)**:

```typescript
interface CreatedNodeItem {
  id: number; // 技能 ID
  name: string; // 技能名称
  description: string; // 技能描述
  icon: string; // 图标
  type: NodeTypeEnum; // 类型（Plugin/Workflow/MCP）
  typeId: number; // 类型 ID
  targetType: AgentComponentTypeEnum; // 目标类型
  targetId: number; // 目标 ID
  inputArgBindConfigs?: InputAndOutConfig[]; // 输入参数绑定
  outputArgBindConfigs?: InputAndOutConfig[]; // 输出参数绑定
  toolName?: string; // 工具名称（MCP 使用）
}
```

**组件实现**: `complexNode.tsx` - `ModelNode`

---

### KnowledgeNode (知识库节点)

**类型枚举**: `NodeTypeEnum.Knowledge`

**属性面板配置项**:

| 表单字段 | 类型 | 说明 | 对应 NodeConfig 字段 |
| --- | --- | --- | --- |
| inputArgs | InputAndOutConfig[] | 输入参数（检索关键词） | nodeConfig.inputArgs |
| knowledgeBaseConfigs | CreatedNodeItem[] | 知识库列表 | nodeConfig.knowledgeBaseConfigs |
| searchStrategy | string | 搜索策略 | nodeConfig.searchStrategy |
| maxRecallCount | number | 最大召回数量 | nodeConfig.maxRecallCount |
| matchingDegree | number | 最小匹配度 | nodeConfig.matchingDegree |
| outputArgs | InputAndOutConfig[] | 输出参数（只读） | nodeConfig.outputArgs |
| exceptionHandleConfig | ExceptionHandleConfig | 异常处理 | nodeConfig.exceptionHandleConfig |

**NodeConfig 结构**:

```typescript
interface KnowledgeNodeConfig extends NodeConfig {
  // 输入
  inputArgs: InputAndOutConfig[]; // 输入参数（检索词）

  // 知识库配置
  knowledgeBaseConfigs?: CreatedNodeItem[]; // 知识库列表

  // 搜索配置
  searchStrategy?: 'SEMANTIC' | 'MIXED' | 'FULL_TEXT'; // 搜索策略
  maxRecallCount?: number; // 最大召回数量 (1-20)
  matchingDegree?: number; // 最小匹配度 (0.01-0.99)

  // 输出
  outputArgs: InputAndOutConfig[]; // 输出参数

  // 异常处理
  exceptionHandleConfig?: ExceptionHandleConfig;
}
```

**搜索策略说明**:

- `SEMANTIC`: 语义搜索
- `MIXED`: 混合搜索
- `FULL_TEXT`: 全文搜索

**组件实现**: `library.tsx` - `KnowledgeNode`

---

### IntentRecognition (意图识别节点)

**类型枚举**: `NodeTypeEnum.IntentRecognition`

**属性面板配置项**:

| 表单字段 | 类型 | 说明 | 对应 NodeConfig 字段 |
| --- | --- | --- | --- |
| modelId | number | 模型 ID | nodeConfig.modelId |
| inputArgs | InputAndOutConfig[] | 输入参数 | nodeConfig.inputArgs |
| intentConfigs | IntentConfigs[] | 意图配置列表 | nodeConfig.intentConfigs |
| extraPrompt | string | 补充提示词 | nodeConfig.extraPrompt |
| outputArgs | InputAndOutConfig[] | 输出参数（只读） | nodeConfig.outputArgs |

**NodeConfig 结构**:

```typescript
interface IntentNodeConfig extends NodeConfig {
  // 模型配置
  modelId?: number;
  modelConfig?: object;

  // 输入
  inputArgs: InputAndOutConfig[];

  // 意图配置
  intentConfigs?: IntentConfigs[];

  // 补充提示词
  extraPrompt?: string;

  // 输出
  outputArgs: InputAndOutConfig[];
}

interface IntentConfigs {
  uuid: string; // 唯一标识
  intent: string; // 意图名称
  intentType?: string; // 意图类型
  nextNodeIds: number[]; // 下一节点 ID 列表
}
```

**组件实现**: `complexNode.tsx` - `IntentionNode`

---

### QA (问答节点)

**类型枚举**: `NodeTypeEnum.QA`

**属性面板配置项**:

| 表单字段 | 类型 | 说明 | 对应 NodeConfig 字段 |
| --- | --- | --- | --- |
| modelId | number | 模型 ID | nodeConfig.modelId |
| inputArgs | InputAndOutConfig[] | 输入参数 | nodeConfig.inputArgs |
| question | string | 提问问题 | nodeConfig.question |
| answerType | 'TEXT' \| 'SELECT' | 回答类型 | nodeConfig.answerType |
| options | QANodeOption[] | 选项（选项回答时） | nodeConfig.options |
| outputArgs | InputAndOutConfig[] | 输出参数 | nodeConfig.outputArgs |

**NodeConfig 结构**:

```typescript
interface QANodeConfig extends NodeConfig {
  // 模型配置
  modelId?: number;
  modelConfig?: object;

  // 输入
  inputArgs: InputAndOutConfig[];

  // 问答配置
  question?: string; // 提问问题
  answerType?: 'TEXT' | 'SELECT'; // 回答类型
  extractField?: boolean; // 是否提取字段
  maxReplyCount?: number; // 最大回复次数

  // 选项配置
  options?: QANodeOption[];

  // 输出
  outputArgs: InputAndOutConfig[];
}

interface QANodeOption {
  uuid: string; // 唯一标识
  index: number; // 选项索引
  content: string; // 选项内容
  nextNodeIds?: number[]; // 下一节点 ID
  disabled?: boolean; // 是否禁用
}
```

**组件实现**: `complexNode.tsx` - `QuestionsNode`

---

## 逻辑控制节点

### ConditionNode (条件分支节点)

**类型枚举**: `NodeTypeEnum.Condition`

**属性面板配置项**:

| 表单字段 | 类型 | 说明 | 对应 NodeConfig 字段 |
| --- | --- | --- | --- |
| conditionBranchConfigs | ConditionBranchConfigs[] | 条件分支列表 | nodeConfig.conditionBranchConfigs |

**NodeConfig 结构**:

```typescript
interface ConditionNodeConfig extends NodeConfig {
  conditionBranchConfigs: ConditionBranchConfigs[];
}

interface ConditionBranchConfigs {
  uuid: string; // 唯一标识
  branchType: ConditionBranchTypeEnum; // 分支类型
  conditionType: 'AND' | 'OR' | null; // 条件逻辑类型
  conditionArgs: ConditionArgs[]; // 条件参数列表
  nextNodeIds?: number[]; // 下一节点 ID
}

enum ConditionBranchTypeEnum {
  IF = 'IF',
  ELSE_IF = 'ELSE_IF',
  ELSE = 'ELSE',
}

interface ConditionArgs {
  compareType: string | null; // 比较类型
  firstArg: BindConfigWithSub | null; // 第一个参数
  secondArg: BindConfigWithSub | null; // 第二个参数
}
```

**比较类型 (CompareTypeEnum)**:

```typescript
enum CompareTypeEnum {
  EQUAL = 'EQUAL', // 等于
  NOT_EQUAL = 'NOT_EQUAL', // 不等于
  GREATER_THAN = 'GREATER_THAN', // 大于
  GREATER_THAN_OR_EQUAL = 'GREATER_THAN_OR_EQUAL', // 大于等于
  LESS_THAN = 'LESS_THAN', // 小于
  LESS_THAN_OR_EQUAL = 'LESS_THAN_OR_EQUAL', // 小于等于
  CONTAINS = 'CONTAINS', // 包含
  NOT_CONTAINS = 'NOT_CONTAINS', // 不包含
  MATCH_REGEX = 'MATCH_REGEX', // 正则匹配
  IS_NULL = 'IS_NULL', // 为空
  NOT_NULL = 'NOT_NULL', // 不为空
}
```

**组件实现**: `condition.tsx` - `ConditionNode`

**特性**: 支持拖拽排序 (react-beautiful-dnd)

---

### LoopNode (循环节点)

**类型枚举**: `NodeTypeEnum.Loop`

**属性面板配置项**:

| 表单字段 | 类型 | 说明 | 对应 NodeConfig 字段 |
| --- | --- | --- | --- |
| loopType | string | 循环类型 | nodeConfig.loopType |
| loopTimes | number | 循环次数（指定次数时） | nodeConfig.loopTimes |
| inputArgs | InputAndOutConfig[] | 循环数组（数组循环时） | nodeConfig.inputArgs |
| variableArgs | InputAndOutConfig[] | 中间变量 | nodeConfig.variableArgs |
| outputArgs | InputAndOutConfig[] | 输出参数 | nodeConfig.outputArgs |

**NodeConfig 结构**:

```typescript
interface LoopNodeConfig extends NodeConfig {
  // 循环配置
  loopType?: 'ARRAY_LOOP' | 'SPECIFY_TIMES_LOOP' | 'INFINITE_LOOP';
  loopTimes?: number; // 指定循环次数

  // 参数配置
  inputArgs?: InputAndOutConfig[]; // 输入参数（数组循环使用）
  variableArgs?: InputAndOutConfig[]; // 中间变量
  outputArgs?: InputAndOutConfig[]; // 输出参数

  // 内部节点
  innerNodes?: ChildNode[];
  innerStartNodeId?: number;
  innerEndNodeId?: number;
}
```

**循环类型说明**:

- `ARRAY_LOOP`: 数组循环，循环次数为数组长度
- `SPECIFY_TIMES_LOOP`: 指定次数循环
- `INFINITE_LOOP`: 无限循环，需配合终止循环节点

**组件实现**: `nodeItem.tsx` - `CycleNode`

---

### LoopBreak / LoopContinue (循环控制节点)

**类型枚举**: `NodeTypeEnum.LoopBreak` / `NodeTypeEnum.LoopContinue`

无配置项，仅用于控制循环流程。

---

### CodeNode (代码节点)

**类型枚举**: `NodeTypeEnum.Code`

**属性面板配置项**:

| 表单字段 | 类型 | 说明 | 对应 NodeConfig 字段 |
| --- | --- | --- | --- |
| inputArgs | InputAndOutConfig[] | 输入参数 | nodeConfig.inputArgs |
| codeLanguage | 'JavaScript' \| 'Python' | 代码语言 | nodeConfig.codeLanguage |
| codeJavaScript | string | JavaScript 代码 | nodeConfig.codeJavaScript |
| codePython | string | Python 代码 | nodeConfig.codePython |
| outputArgs | InputAndOutConfig[] | 输出参数 | nodeConfig.outputArgs |

**NodeConfig 结构**:

```typescript
interface CodeNodeConfig extends NodeConfig {
  inputArgs: InputAndOutConfig[];
  codeLanguage?: 'JavaScript' | 'Python';
  codeJavaScript?: string;
  codePython?: string;
  outputArgs: InputAndOutConfig[];
}
```

**组件实现**: `nodeItem.tsx` - `CodeNode`

---

## 数据操作节点

### VariableNode (变量赋值节点)

**类型枚举**: `NodeTypeEnum.Variable`

**属性面板配置项**:

| 表单字段 | 类型 | 说明 | 对应 NodeConfig 字段 |
| --- | --- | --- | --- |
| configType | 'SET_VARIABLE' \| 'GET_VARIABLE' | 配置类型 | nodeConfig.configType |
| inputArgs | InputAndOutConfig[] | 设置变量（SET 模式） | nodeConfig.inputArgs |
| outputArgs | InputAndOutConfig[] | 输出变量（GET 模式） | nodeConfig.outputArgs |

**NodeConfig 结构**:

```typescript
interface VariableNodeConfig extends NodeConfig {
  configType: 'SET_VARIABLE' | 'GET_VARIABLE';
  inputArgs?: InputAndOutConfig[]; // 设置模式使用
  outputArgs?: InputAndOutConfig[]; // 获取模式使用
}
```

**组件实现**: `nodeItem.tsx` - `VariableNode`

---

### TextProcessingNode (文本处理节点)

**类型枚举**: `NodeTypeEnum.TextProcessing`

**属性面板配置项**:

| 表单字段 | 类型 | 说明 | 对应 NodeConfig 字段 |
| --- | --- | --- | --- |
| textHandleType | 'CONCAT' \| 'SPLIT' | 处理类型 | nodeConfig.textHandleType |
| inputArgs | InputAndOutConfig[] | 输入参数 | nodeConfig.inputArgs |
| text | string | 拼接文本（拼接模式） | nodeConfig.text |
| join | string | 连接符（拼接模式） | nodeConfig.join |
| splits | string[] | 分隔符列表（分割模式） | nodeConfig.splits |
| outputArgs | InputAndOutConfig[] | 输出参数（只读） | nodeConfig.outputArgs |

**NodeConfig 结构**:

```typescript
interface TextProcessingNodeConfig extends NodeConfig {
  textHandleType: 'CONCAT' | 'SPLIT';
  inputArgs: InputAndOutConfig[];
  text?: string; // 拼接文本模板
  join?: string; // 数组连接符
  splits?: string[]; // 分隔符列表
  outputArgs: InputAndOutConfig[];
}
```

**组件实现**: `nodeItem.tsx` - `TextProcessingNode`

---

### Database 节点 (数据库操作)

#### TableDataAdd (数据库新增)

**类型枚举**: `NodeTypeEnum.TableDataAdd`

**属性面板配置项**:

| 表单字段 | 类型 | 说明 | 对应 NodeConfig 字段 |
| --- | --- | --- | --- |
| tableId | number | 数据表 ID | nodeConfig.tableId |
| name | string | 数据表名称 | nodeConfig.name |
| description | string | 数据表描述 | nodeConfig.description |
| icon | string | 数据表图标 | nodeConfig.icon |
| tableFields | CreatedNodeItem[] | 表字段列表 | nodeConfig.tableFields |
| inputArgs | InputAndOutConfig[] | 输入参数（字段值） | nodeConfig.inputArgs |
| outputArgs | InputAndOutConfig[] | 输出参数（只读） | nodeConfig.outputArgs |
| exceptionHandleConfig | ExceptionHandleConfig | 异常处理 | nodeConfig.exceptionHandleConfig |

---

#### TableDataDelete (数据库删除)

**类型枚举**: `NodeTypeEnum.TableDataDelete`

**属性面板配置项**:

| 表单字段 | 类型 | 说明 | 对应 NodeConfig 字段 |
| --- | --- | --- | --- |
| tableId | number | 数据表 ID | nodeConfig.tableId |
| tableFields | CreatedNodeItem[] | 表字段列表 | nodeConfig.tableFields |
| conditionType | 'AND' \| 'OR' | 条件逻辑类型 | nodeConfig.conditionType |
| conditionArgs | InputAndOutConfig[] | 删除条件 | nodeConfig.conditionArgs |
| outputArgs | InputAndOutConfig[] | 输出参数（只读） | nodeConfig.outputArgs |
| exceptionHandleConfig | ExceptionHandleConfig | 异常处理 | nodeConfig.exceptionHandleConfig |

---

#### TableDataUpdate (数据库更新)

**类型枚举**: `NodeTypeEnum.TableDataUpdate`

**属性面板配置项**:

| 表单字段 | 类型 | 说明 | 对应 NodeConfig 字段 |
| --- | --- | --- | --- |
| tableId | number | 数据表 ID | nodeConfig.tableId |
| tableFields | CreatedNodeItem[] | 表字段列表 | nodeConfig.tableFields |
| conditionType | 'AND' \| 'OR' | 条件逻辑类型 | nodeConfig.conditionType |
| conditionArgs | InputAndOutConfig[] | 更新条件 | nodeConfig.conditionArgs |
| inputArgs | InputAndOutConfig[] | 更新字段 | nodeConfig.inputArgs |
| outputArgs | InputAndOutConfig[] | 输出参数（只读） | nodeConfig.outputArgs |
| exceptionHandleConfig | ExceptionHandleConfig | 异常处理 | nodeConfig.exceptionHandleConfig |

---

#### TableDataQuery (数据库查询)

**类型枚举**: `NodeTypeEnum.TableDataQuery`

**属性面板配置项**:

| 表单字段 | 类型 | 说明 | 对应 NodeConfig 字段 |
| --- | --- | --- | --- |
| tableId | number | 数据表 ID | nodeConfig.tableId |
| tableFields | CreatedNodeItem[] | 表字段列表 | nodeConfig.tableFields |
| conditionType | 'AND' \| 'OR' | 条件逻辑类型 | nodeConfig.conditionType |
| conditionArgs | InputAndOutConfig[] | 查询条件 | nodeConfig.conditionArgs |
| limit | number | 查询上限 | nodeConfig.limit |
| outputArgs | InputAndOutConfig[] | 输出参数 | nodeConfig.outputArgs |
| exceptionHandleConfig | ExceptionHandleConfig | 异常处理 | nodeConfig.exceptionHandleConfig |

---

#### TableSQL (SQL 执行)

**类型枚举**: `NodeTypeEnum.TableSQL`

**属性面板配置项**:

| 表单字段 | 类型 | 说明 | 对应 NodeConfig 字段 |
| --- | --- | --- | --- |
| tableId | number | 数据表 ID | nodeConfig.tableId |
| tableFields | CreatedNodeItem[] | 表字段列表 | nodeConfig.tableFields |
| inputArgs | InputAndOutConfig[] | 输入参数 | nodeConfig.inputArgs |
| sql | string | SQL 语句 | nodeConfig.sql |
| outputArgs | InputAndOutConfig[] | 输出参数 | nodeConfig.outputArgs |
| exceptionHandleConfig | ExceptionHandleConfig | 异常处理 | nodeConfig.exceptionHandleConfig |

**Database NodeConfig 通用结构**:

```typescript
interface DatabaseNodeConfig extends NodeConfig {
  // 数据表配置
  tableId?: number; // 数据表 ID
  name?: string; // 数据表名称
  description?: string; // 数据表描述
  icon?: string; // 图标
  tableFields?: CreatedNodeItem[]; // 表字段列表

  // 条件配置
  conditionType?: 'AND' | 'OR'; // 条件逻辑类型
  conditionArgs?: InputAndOutConfig[]; // 条件参数列表

  // SQL 配置（仅 TableSQL）
  sql?: string;

  // 查询配置（仅 TableDataQuery）
  limit?: number;

  // 参数配置
  inputArgs?: InputAndOutConfig[];
  outputArgs?: InputAndOutConfig[];

  // 异常处理
  exceptionHandleConfig?: ExceptionHandleConfig;
}
```

**组件实现**: `database.tsx` - `Database`

---

## 集成节点

### PluginInNode (插件节点)

**类型枚举**: `NodeTypeEnum.Plugin`

**属性面板配置项**:

| 表单字段 | 类型 | 说明 | 对应 NodeConfig 字段 |
| --- | --- | --- | --- |
| pluginId | number | 插件 ID | nodeConfig.pluginId |
| inputArgs | InputAndOutConfig[] | 输入参数 | nodeConfig.inputArgs |
| outputArgs | InputAndOutConfig[] | 输出参数（只读） | nodeConfig.outputArgs |
| exceptionHandleConfig | ExceptionHandleConfig | 异常处理 | nodeConfig.exceptionHandleConfig |

**NodeConfig 结构**:

```typescript
interface PluginNodeConfig extends NodeConfig {
  pluginId?: number;
  inputArgs: InputAndOutConfig[];
  outputArgs: InputAndOutConfig[];
  exceptionHandleConfig?: ExceptionHandleConfig;
}
```

**组件实现**: `pluginNode.tsx` - `PluginInNode`

---

### WorkflowNode (工作流节点)

**类型枚举**: `NodeTypeEnum.Workflow`

与 PluginInNode 共用组件，配置结构相似。

**NodeConfig 结构**:

```typescript
interface WorkflowNodeConfig extends NodeConfig {
  typeId?: number; // 工作流 ID
  inputArgs: InputAndOutConfig[];
  outputArgs: InputAndOutConfig[];
  exceptionHandleConfig?: ExceptionHandleConfig;
}
```

---

### MCPNode (MCP 节点)

**类型枚举**: `NodeTypeEnum.MCP`

与 PluginInNode 共用组件。

**NodeConfig 结构**:

```typescript
interface MCPNodeConfig extends NodeConfig {
  mcpId?: number; // MCP ID
  toolName?: string; // 工具名称
  inputArgs: InputAndOutConfig[];
  outputArgs: InputAndOutConfig[];
  exceptionHandleConfig?: ExceptionHandleConfig;
}
```

---

### LongTermMemoryNode (长期记忆节点)

**类型枚举**: `NodeTypeEnum.LongTermMemory`

与 PluginInNode 共用组件。

---

### HTTPRequest (HTTP 请求节点)

**类型枚举**: `NodeTypeEnum.HTTPRequest`

**属性面板配置项**:

| 表单字段    | 类型                | 说明           | 对应 NodeConfig 字段   |
| ----------- | ------------------- | -------------- | ---------------------- |
| method      | string              | 请求方法       | nodeConfig.method      |
| url         | string              | 请求 URL       | nodeConfig.url         |
| contentType | HttpContentTypeEnum | 请求内容格式   | nodeConfig.contentType |
| timeout     | string              | 超时时间（秒） | nodeConfig.timeout     |
| headers     | InputAndOutConfig[] | 请求头         | nodeConfig.headers     |
| queries     | InputAndOutConfig[] | Query 参数     | nodeConfig.queries     |
| body        | InputAndOutConfig[] | Body 参数      | nodeConfig.body        |
| outputArgs  | InputAndOutConfig[] | 输出参数       | nodeConfig.outputArgs  |

**NodeConfig 结构**:

```typescript
interface HttpNodeConfig extends NodeConfig {
  method: string; // GET, POST, PUT, DELETE, PATCH
  url: string; // 请求 URL
  contentType: HttpContentTypeEnum; // 内容类型
  timeout: string; // 超时时间
  headers?: InputAndOutConfig[]; // 请求头
  queries?: InputAndOutConfig[]; // Query 参数
  body?: InputAndOutConfig[]; // Body 参数
  outputArgs: InputAndOutConfig[]; // 输出参数
}

enum HttpContentTypeEnum {
  JSON = 'JSON',
  FORM_DATA = 'FORM_DATA',
  X_WWW_FORM_URLENCODED = 'X_WWW_FORM_URLENCODED',
  OTHER = 'OTHER',
}
```

**组件实现**: `complexNode.tsx` - `HttpToolNode`

---

### DocumentExtraction (文档提取节点)

**类型枚举**: `NodeTypeEnum.DocumentExtraction`

**属性面板配置项**:

| 表单字段   | 类型                | 说明             | 对应 NodeConfig 字段  |
| ---------- | ------------------- | ---------------- | --------------------- |
| inputArgs  | InputAndOutConfig[] | 输入参数（文件） | nodeConfig.inputArgs  |
| outputArgs | InputAndOutConfig[] | 输出参数（只读） | nodeConfig.outputArgs |

**组件实现**: `nodeItem.tsx` - `DocumentExtractionNode`

---

## 相关文件索引

| 文件路径                                                 | 说明           |
| -------------------------------------------------------- | -------------- |
| `src/types/interfaces/node.ts`                           | 节点类型定义   |
| `src/types/interfaces/graph.ts`                          | 图相关类型定义 |
| `src/types/enums/common.ts`                              | 通用枚举定义   |
| `src/types/enums/node.ts`                                | 节点枚举定义   |
| `src/pages/Antv-X6/component/nodeItem.tsx`               | 基础节点组件   |
| `src/pages/Antv-X6/component/complexNode.tsx`            | 复杂节点组件   |
| `src/pages/Antv-X6/component/condition.tsx`              | 条件节点组件   |
| `src/pages/Antv-X6/component/library.tsx`                | 知识库节点组件 |
| `src/pages/Antv-X6/component/pluginNode.tsx`             | 插件节点组件   |
| `src/pages/Antv-X6/component/database.tsx`               | 数据库节点组件 |
| `src/pages/Antv-X6/component/ExceptionItem.tsx`          | 异常处理组件   |
| `src/pages/Antv-X6/components/NodePanelDrawer/index.tsx` | 节点面板路由   |

---

**导航**: [📚 文档索引](./README.md) | [⬆️ 主文档](../V1-FEATURES.md)

_文档生成时间: 2025-12_ _用于 V2 重构参照_
