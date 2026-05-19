/** 单条统计指标数据（value 需为已格式化字符串） */
export interface StatMetricItem {
  /** 指标名称 */
  label: string;
  /** 展示值（formatInteger / formatDecimal / formatCurrency 结果） */
  value: string;
  /** 是否高亮（如金额、积分） */
  highlight?: boolean;
  /** 自定义高亮色，需配合 highlight 使用 */
  highlightColor?: string;
  /** 是否展示 hover Tooltip，未设置时使用列表配置 */
  showTooltip?: boolean;
  /** 列表项唯一 key，缺省时使用 label */
  key?: string;
}
