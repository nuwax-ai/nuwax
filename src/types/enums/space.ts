// 组件类型枚举
export enum ComponentTypeEnum {
  All_Type = 'All_Type',
  Variable = 'Variable',
  Workflow = 'Workflow',
  Plugin = 'Plugin',
  Knowledge = 'Knowledge',
  Table = 'Table',
  Model = 'Model',
}

// 过滤状态枚举
export enum FilterStatusEnum {
  All,
  // 已发布
  Published,
  // 最近打开
  Recently_Open,
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
  // 下架
  Off_Shelf,
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

// 智能体配置 - 编排类型枚举
export enum AgentArrangeConfigEnum {
  // 插件
  Plugin = 'Plugin',
  // 工作流
  Workflow = 'Workflow',
  // 触发器
  Trigger = 'Trigger',
  // 文本
  Text = 'Text',
  // 变量
  Variable = 'Variable',
  // 数据表
  Table = 'Table',
  // 长期记忆
  Long_Memory = 'Long_Memory',
  // 文件盒子
  File_Box = 'File_Box',
  // 开场白
  Opening_Remarks = 'Opening_Remarks',
  // 用户问题建议
  User_Problem_Suggestion = 'User_Problem_Suggestion',
  // 快捷指令
  Shortcut_Instruction = 'Shortcut_Instruction',
  // 定时任务
  Open_Scheduled_Task = 'Open_Scheduled_Task',
}

// 是否开启问题建议,可用值:Open,Close
export enum OpenCloseEnum {
  Open = 'Open',
  Close = 'Close',
}

// 编辑智能体时,右侧切换显示内容枚举
export enum EditAgentShowType {
  // 隐藏
  Hide = 'Hide',
  Debug_Details = 'Debug_Details',
  Version_History = 'Version_History',
  // 展示台
  Show_Stand = 'Show_Stand',
}

// 插件设置类型
export enum PluginSettingEnum {
  Params,
  // 调用方式
  Method_Call,
  // 卡片绑定
  Card_Bind,
}

// 空间类型枚举
export enum SpaceTypeEnum {
  Personal = 'Personal',
  Team = 'Team',
  Class = 'Class',
}

// 可用值:Agent,Plugin,Workflow
export enum HistoryTargetTypeEnum {
  Agent = 'Agent',
  Plugin = 'Plugin',
  Workflow = 'Workflow',
}

// 操作类型,Add 新增, Edit 编辑, Publish 发布,可用值:Add,Edit,Publish,PublishApply,PublishApplyReject,OffShelf,AddComponent,EditComponent,DeleteComponent,AddNode,EditNode,DeleteNode
export enum HistoryActionTypeEnum {
  Add = 'Add',
  Edit = 'Edit',
  Publish = 'Publish',
  PublishApply = 'PublishApply',
  PublishApplyReject = 'PublishApplyReject',
  OffShelf = 'OffShelf',
  AddComponent = 'AddComponent',
  EditComponent = 'EditComponent',
  DeleteComponent = 'DeleteComponent',
  AddNode = 'AddNode',
  EditNode = 'EditNode',
  DeleteNode = 'DeleteNode',
}
