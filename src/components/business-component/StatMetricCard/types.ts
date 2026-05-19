/** 单条统计指标数据（value 需为已格式化字符串） */
export interface StatMetricItem {
  /** 指标名称 */
  label: string;
  /** 展示值（formatInteger / formatDecimal / formatCurrency 结果） */
  value: string;
  /** 是否高亮（如金额、积分） */
  highlight?: boolean;
  /** 列表项唯一 key，缺省时使用 label */
  key?: string;
}
