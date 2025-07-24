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
  // 全部
  All,
  // 已发布
  Published,
}

// 过滤创建者
export enum CreateListEnum {
  // 所有人
  All_Person,
  // 由我创建
  Me,
}

// 应用开发、组件库等更多操作枚举(自定义枚举)
export enum ApplicationMoreActionEnum {
  // 分析
  Analyze = 'Analyze',
  // 复制
  Copy = 'Copy',
  // 统计数据
  Statistics = 'Statistics',
  // 复制到空间
  Copy_To_Space = 'Copy_To_Space',
  // 迁移
  Move = 'Move',
  // 临时会话
  Temporary_Session = 'Temporary_Session',
  // API Key
  API_Key = 'API_Key',
  // 导出配置
  Export_Config = 'Export_Config',
  // 日志
  Log = 'Log',
  // 下架
  Off_Shelf = 'Off_Shelf',
  // 删除
  Del = 'Del',
}

// 工作空间应用列表枚举
export enum SpaceApplicationListEnum {
  // 应用开发
  Application_Develop,
  // 组件库
  Component_Library,
  // MCP管理
  MCP_Manage,
  // 空间广场
  Space_Square,
  // 成员与设置
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
  // 知识库
  Knowledge = 'Knowledge',
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
  // MCP
  MCP = 'Mcp',
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
  // 调试详情
  Debug_Details = 'Debug_Details',
  // 版本历史
  Version_History = 'Version_History',
  // 展示台
  Show_Stand = 'Show_Stand',
}

// 组件设置类型
export enum ComponentSettingEnum {
  // 参数
  Params,
  // 调用方式
  Method_Call,
  // 输出方式
  Output_Way,
  // 异步运行
  Async_Run,
  // 异常处理
  Exception_Handling,
  // 卡片绑定
  Card_Bind,
}

// 空间类型枚举
export enum SpaceTypeEnum {
  Personal = 'Personal',
  Team = 'Team',
  Class = 'Class',
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

// 空间是否接收来自外部的发布
export enum ReceivePublishEnum {
  // 不接收
  Not_Receive = 0,
  // 接收
  Receive = 1,
}

// 空间是否开启开发功能
export enum AllowDevelopEnum {
  // 不开启
  Not_Allow = 0,
  // 开启
  Allow = 1,
}
