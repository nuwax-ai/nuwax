// 组件库所有类型枚举
export enum LibraryAllTypeEnum {
  All_Type,
  Workflow,
  Plugin,
  Knowledge,
  Database,
  Model,
}

// 过滤状态枚举
export enum FilterStatusEnum {
  All,
  Published,
  // 最近打开
  // Recently_Open,
}

// 过滤创建者
export enum CreateListEnum {
  // 所有人
  All_Person,
  // 由我创建
  Me,
}

// 应用开发更多操作枚举
export enum ApplicationMoreActionEnum {
  // 分析
  Analyze,
  // 创建副本
  Create_Copy,
  // 迁移
  Move,
  // 删除
  Del,
}

// 工作空间应用列表枚举
export enum SpaceApplicationListEnum {
  // 应用开发
  Application_Develop,
  // 组件库
  Component_Library,
  // 团队设置
  Team_Setting,
}

// 智能体配置技能枚举
export enum AgentConfigSkillEnum {
  Plugin,
  Workflow,
  // 触发器
  Trigger,
}

// 智能体配置知识枚举
export enum AgentConfigKnowledgeEnum {
  Text,
  Table,
}

// 智能体配置记忆枚举
export enum AgentConfigMemoryEnum {
  Variable,
  Data_Base,
  // 长期记忆
  Long_Memory,
  // 文件盒子
  File_Box,
}

// 智能体配置对话体验枚举
export enum ConversationalExperienceEnum {
  // 开场白
  Opening_Remarks,
  // 用户问题建议
  User_Problem_Suggestion,
  // 快捷指令
  Shortcut_Instruction,
}

// 长期记忆枚举
export enum LongMemberEnum {
  // 启用
  Start_Use,
  // 关闭
  Close,
}

// 文件盒子枚举
export enum FileBoxEnum {
  // 启用
  Start_Use,
  // 关闭
  Close,
}

// 用户问题建议枚举
export enum UserProblemSuggestEnum {
  // 启用
  Start_Use,
  // 关闭
  Close,
}

// 编辑智能体时,右侧切换显示内容枚举
export enum EditAgentShowType {
  // 隐藏
  Hide,
  Debug_Details,
  Version_History,
  // 展示台
  Show_Stand,
}

// 插件设置类型
export enum PluginSettingEnum {
  Params,
  // 卡片绑定
  Card_Bind,
}

// 空间类型枚举
export enum SpaceTypeEnum {
  Personal = 'Personal',
  Team = 'Team',
  Class = 'Class',
}
