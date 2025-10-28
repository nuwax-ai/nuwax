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

// 分页响应数据
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

/**
 * 表格分页查询参数
 */

// 表格列扩展配置
export interface TableExtInfo {
  // 列固定位置
  fixed: string;
  // 是否可见
  visible: boolean;
  // 子标签
  subLabel: string;
  // 列宽度
  width: string;
  // 最小宽度
  minWidth: string;
  // 是否可设置
  settable: boolean;
  // 对齐方式
  align: string;
  // 格式化器
  formatter: string;
  // 提示信息
  tips: string;
  // 是否省略
  ellipsis: boolean;
}

// 表格列信息
export interface SuperTableColumn {
  // 序号
  serialNumber: number;
  // 列标签
  label: string;
  // 列名称
  name: string;
  // 是否可排序
  sortable: boolean;
  // 提示信息
  tips: string;
  // 扩展配置
  ext: TableExtInfo;
}

// table分页请求基础信息
export interface TablePageRequest<T> {
  queryFilter: T;
  // 当前页,示例值(1)
  current: number;
  // 分页pageSize,示例值(10)
  pageSize: number;
  // 排序字段信息,可空,一般没有默认为创建时间排序
  orders: Sort[];
  // 列的筛选条件,可空
  filters: {
    column: string;
    operator: string;
    value: object;
  }[];
  // 表格的列信息,可空
  columns: {
    serialNumber: number;
    label: string;
    name: string;
    sortable: boolean;
    tips: string;
    ext: TableExtInfo;
    children: SuperTableColumn[];
  }[];
}
