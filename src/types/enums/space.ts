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
