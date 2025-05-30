// 菜单栏~tabs切换事件枚举
export enum TabsEnum {
  Home = 'home',
  // 工作空间
  Space = 'space',
  // 广场
  Square = 'square',
  // 系统管理
  System_Manage = 'system_manage',
  //课程体系
  Course_System = 'course_system',
  //生态市场
  Ecosystem_Market = 'ecosystem_market',
}

// 菜单栏，用户操作区域点击事件枚举
export enum UserOperatorAreaEnum {
  Document = 'document',
  Message = 'message',
}

// 菜单栏~用户头像操作列表枚举
export enum UserAvatarEnum {
  User_Name = 'username',
  Setting = 'setting',
  Log_Out = 'log_out',
}

// 消息状态,可用值:All, Unread, Read
export enum MessageReadStatusEnum {
  All = 'All',
  Unread = 'Unread',
  Read = 'Read',
}

// 设置选项
export enum SettingActionEnum {
  Account,
  Email_Bind,
  Reset_Password,
}
