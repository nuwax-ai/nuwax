// 过滤状态枚举
export enum FilterStatusEnum {
  All,
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
