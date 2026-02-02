// 系统管理列表枚举
export enum SystemManageListEnum {
  // 用户管理
  User_Manage,
  // 发布审核
  Publish_Audit,
  // 已发布管理
  Published_Manage,
  // 全局模型管理
  Global_Model_Manage,
  // 系统配置
  System_Config,
  // 主题配置
  Theme_Config,
  // 系统概览
  Dashboard,
  // 日志查询
  Log_Query,
  // 操作日志
  Operation_Log,
  // 运行日志
  Running_Log,
  // 内容管理
  Content,
  // 空间
  Content_Space,
  // 智能体
  Content_Agent,
  // 网页应用
  Content_WebApplication,
  // 知识库
  Content_KnowledgeBase,
  // 数据表
  Content_DataTable,
  // 工作流
  Content_Workflow,
  // 插件
  Content_Plugin,
  // MCP
  Content_Mcp,
  // 技能
  Content_Skill,
  // 菜单权限
  MenuPermission,
  // 权限资源
  Permission_Resources,
  // 菜单管理
  Menu_Manage,
  // 角色管理
  Role_Manage,
  // 用户组管理
  User_Group_Manage,
}

// 系统管理-用户管理-角色枚举
export enum UserRoleEnum {
  Admin = 'Admin',
  User = 'User',
}

// 系统管理-用户管理-状态枚举
export enum UserStatusEnum {
  Enabled = 'Enabled',
  Disabled = 'Disabled',
}

// 消息类型, Broadcast时可以不传userIds,可用值:Broadcast,Private,System
export enum MessageScopeEnum {
  Broadcast = 'Broadcast', // 广播
  Private = 'Private', // 私信
  System = 'System', // 系统消息
}
