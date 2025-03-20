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
}

// 系统管理-用户管理-角色枚举
export enum UserRoleEnum {
  Admin,
  User,
}

// 系统管理-用户管理-状态枚举
export enum UserStatusEnum {
  Enabled,
  Disabled,
}
