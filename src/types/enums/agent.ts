// 调用方式类型
export enum CallMethodEnum {
  // 自动调用
  Auto_Call,
  // 按需调用
  On_Demand_Call,
}

// 无召回回复
export enum NoRecallResponseEnum {
  // 默认
  Default,
  // 自定义
  Custom,
}

// 智能体组件模型类型枚举
export enum AgentComponentTypeEnum {
  Plugin = 'Plugin',
  Workflow = 'Workflow',
  Trigger = 'Trigger',
  Knowledge = 'Knowledge',
  Variable = 'Variable',
  Database = 'Database',
  Model = 'Model',
}

// 值引用类型，Input 输入；Reference 变量引用,可用值:Input,Reference
export enum BindValueType {
  Input = 'Input',
  Reference = 'Reference',
}

// 输入类型, Http插件有用,可用值:Query,Body,Header,Path
export enum InputTypeType {
  Query = 'Query',
  Body = 'Body',
  Header = 'Header',
  Path = 'Path',
}

// 触发类型,TIME 定时触发, EVENT 事件触发,可用值:TIME,EVENT
export enum TriggerTypeEnum {
  TIME = 'TIME',
  EVENT = 'EVENT',
}

// 触发器执行的组件类型,可用值:PLUGIN,WORKFLOW
export enum TriggerComponentType {
  PLUGIN = 'PLUGIN',
  WORKFLOW = 'WORKFLOW',
}

// 调用方式,可用值:AUTO,ON_DEMAND
export enum InvokeTypeEnum {
  AUTO = 'AUTO',
  ON_DEMAND = 'ON_DEMAND',
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
  DEFAULT = 'DEFAULT',
  CUSTOM = 'CUSTOM',
}

// assistant 模型回复；user 用户消息,可用值:USER,ASSISTANT,SYSTEM,FUNCTION
export enum AssistantRoleEnum {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
  SYSTEM = 'SYSTEM',
  FUNCTION = 'FUNCTION',
}
