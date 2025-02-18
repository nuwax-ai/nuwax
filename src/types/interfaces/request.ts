export interface RequestResponse<T> {
  code: string;
  displayCode: string;
  message: string;
  data: T;
  debugInfo: object;
  success: boolean;
}

interface Sort {
  column: string;
  asc: boolean;
}

export interface Page<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  orders: Sort[];
  optimizeCountSql: boolean;
  searchCount: boolean;
  optimizeJoinOfCountSql: boolean;
  maxLimit: number;
  countId: string;
  pages: number;
}
