export interface RequestResponse<T> {
  code: string;
  displayCode: string;
  message: string;
  data: T;
  debugInfo: object;
  success: boolean;
  tid: string;
}

// 排序字段信息,可空,一般没有默认为创建时间排序
export interface Sort {
  column: string;
  asc: boolean;
}

export interface Page<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
  orders: Sort[];
  optimizeCountSql: boolean;
  searchCount: boolean;
  optimizeJoinOfCountSql: boolean;
  maxLimit: number;
  countId: string;
}
