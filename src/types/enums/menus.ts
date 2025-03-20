// 菜单栏~tabs切换事件枚举

export enum TabsEnum {
  Home = 'home',
  // 工作空间
  Space = 'space',
  // 广场
  Square = 'square',
  // 系统管理
  System_Manage = 'system_manage',
}

// 菜单栏，用户操作区域点击事件枚举
export enum UserOperatorAreaEnum {
  Document = 'document',
  // 历史会话
  History_Conversation = 'history_conversation',
  Message = 'message',
}

// 菜单栏~用户头像操作列表枚举
export enum UserAvatarEnum {
  User_Name = 'username',
  Setting = 'setting',
  Log_Out = 'log_out',
}

// 消息选项：全部、未读
export enum MessageOptionEnum {
  All,
  Unread,
}

// 消息状态,可用值:Unread,Read
export enum MessageReadStatusEnum {
  Unread = 'Unread',
  Read = 'Read',
}

// 设置选项
export enum SettingActionEnum {
  Account,
  Email_Bind,
  Reset_Password,
}
