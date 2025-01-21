// 调用方式类型
export enum CallMethodEnum {
  // 自动调用
  Auto_Call,
  // 按需调用
  On_Demand_Call,
}

// 搜索策略
export enum SearchStrategyEnum {
  // 混合
  Mixed,
  // 语义
  Semantic,
  // 全文
  Full_Text,
}

// 无召回回复
export enum NoRecallResponseEnum {
  // 默认
  Default,
  // 自定义
  Custom,
}
