// 智能体组件模型类型枚举
export enum AgentComponentTypeEnum {
  Plugin = 'Plugin',
  Workflow = 'Workflow',
  Knowledge = 'Knowledge',
  Variable = 'Variable',
  Table = 'Table',
  Model = 'Model',
  Agent = 'Agent',
  MCP = 'Mcp',
  Page = 'Page',
}

// 用户APIKEY目标类型,可用值:Agent,Mcp,TempChat
export enum AgentApiKeyTargetEnum {
  Agent = 'Agent',
  MCP = 'Mcp',
  TempChat = 'TempChat',
}

// 值引用类型，Input 输入；Reference 变量引用,可用值:Input,Reference
export enum BindValueType {
  // 输入
  Input = 'Input',
  // 引用
  Reference = 'Reference',
}

// 输入类型 可用值:Query,Body,Header,Path,Text,Paragraph,Select,MultipleSelect,Number,AutoRecognition
export enum InputTypeEnum {
  // Http插件有用
  Query = 'Query',
  Body = 'Body',
  Header = 'Header',
  Path = 'Path',
  // 行文本
  Text = 'Text',
  // 多行段落
  Paragraph = 'Paragraph',
  // 下拉单选
  Select = 'Select',
  // 下拉多选
  MultipleSelect = 'MultipleSelect',
  // 数字
  Number = 'Number',
  // 智能识别
  AutoRecognition = 'AutoRecognition',
}

// 调用方式,可用值:AUTO,ON_DEMAND,MANUAL,MANUAL_ON_DEMAND
export enum InvokeTypeEnum {
  AUTO = 'AUTO',
  ON_DEMAND = 'ON_DEMAND',
  MANUAL = 'MANUAL',
  MANUAL_ON_DEMAND = 'MANUAL_ON_DEMAND',
}

// 是否默认选中，0-否，1-是
export enum DefaultSelectedEnum {
  No = 0,
  Yes = 1,
}

// 搜索策略,可用值:SEMANTIC,MIXED,FULL_TEXT
export enum SearchStrategyEnum {
  // 语义
  SEMANTIC = 'SEMANTIC',
  // 混合
  MIXED = 'MIXED',
  // 全文
  FULL_TEXT = 'FULL_TEXT',
}

// 无召回回复类型，默认、自定义,可用值:DEFAULT,CUSTOM
export enum NoneRecallReplyTypeEnum {
  // 默认
  DEFAULT = 'DEFAULT',
  // 自定义
  CUSTOM = 'CUSTOM',
}

// 会话事件类型 可用值:PROCESSING,MESSAGE,FINAL_RESULT,ERROR
export enum ConversationEventTypeEnum {
  PROCESSING = 'PROCESSING',
  MESSAGE = 'MESSAGE',
  FINAL_RESULT = 'FINAL_RESULT',
  ERROR = 'ERROR',
}

// assistant 模型回复；user 用户消息,可用值:USER,ASSISTANT,SYSTEM,FUNCTION
export enum AssistantRoleEnum {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
  SYSTEM = 'SYSTEM',
  FUNCTION = 'FUNCTION',
}

// 可用值:CHAT,THINK, GUID,QUESTION,ANSWER
export enum MessageModeEnum {
  CHAT = 'CHAT',
  THINK = 'THINK',
  GUID = 'GUID',
  QUESTION = 'QUESTION',
  ANSWER = 'ANSWER',
}

// 可用值:USER,ASSISTANT,SYSTEM,TOOL
export enum MessageTypeEnum {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
  SYSTEM = 'SYSTEM',
  TOOL = 'TOOL',
}

// 智能体添加组件状态
export enum AgentAddComponentStatusEnum {
  Loading = 'Loading',
  Added = 'Added',
}

// 任务状态 可用值:EXECUTING,CANCEL
export enum TaskStatus {
  CANCEL = 'CANCEL',
  EXECUTING = 'EXECUTING',
}

// 可用值:Chat,TASK
export enum TaskTypeEnum {
  Chat = 'Chat',
  TASK = 'TASK',
}

// 是否允许复制,0不允许，1允许
export enum AllowCopyEnum {
  No = 0,
  Yes = 1,
}

// 仅展示模板, 0 否，1 是
export enum OnlyTemplateEnum {
  No = 0,
  Yes = 1,
}

// 是否直接输出, 0 否，1 是
export enum OutputDirectlyEnum {
  No = 0,
  Yes = 1,
}

// 是否开发模式, 1 是；0 否
export enum DevModeEnum {
  No = 0,
  Yes = 1,
}

// 选项来源类型,可用值:MANUAL,BINDING
export enum OptionDataSourceEnum {
  MANUAL = 'MANUAL',
  BINDING = 'BINDING',
}

// 更新变量类型
export enum UpdateVariablesTypeEnum {
  Delete = 'Delete',
  Drag = 'Drag',
}

// 开场白预置问题设置类型
export enum GuidQuestionSetTypeEnum {
  // 问题引导
  Question = 'Question',
  // 扩展页面路径
  Page_Path = 'Page_Path',
  // 外链地址
  Link = 'Link',
}

// 响应动作（扩展页面打开、外部链接跳转）
export enum EventBindResponseActionEnum {
  // 扩展页面打开
  Page_Open = 'Page_Open',
  // 外部链接跳转
  Link_Jump = 'Link_Jump',
}

// 是否默认展开扩展页面区域, 1 展开；0 不展开
export enum ExpandPageAreaEnum {
  No = 0,
  Yes = 1,
}

// 是否隐藏聊天区域, 1 隐藏；0 不隐藏
export enum HideChatAreaEnum {
  No = 0,
  Yes = 1,
}

// 页面是否模型可见，1 可见，0 不可见
export enum VisibleToLLMEnum {
  No = 0,
  Yes = 1,
}

// 是否为智能体页面首页，1 为默认首页，0 不为首页
export enum HomeIndexEnum {
  No = 0,
  Yes = 1,
}
