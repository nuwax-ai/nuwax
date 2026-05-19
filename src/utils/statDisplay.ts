/**
 * 统计卡片数值展示相关工具
 * 用于根据已格式化展示文本长度，计算建议字号（与容器宽度 clamp 取 min 后生效）
 */

/** 统计数值默认最小字号（px） */
export const STAT_VALUE_FONT_MIN = 15;
/** 统计数值默认最大字号（px），与 Dashboard StatCard 数值区接近 */
export const STAT_VALUE_FONT_MAX = 28;

/** getStatValueFontSize 可选配置 */
export interface StatValueFontSizeOptions {
  /** 最小字号（px），默认 {@link STAT_VALUE_FONT_MIN} */
  min?: number;
  /** 最大字号（px），默认 {@link STAT_VALUE_FONT_MAX} */
  max?: number;
}

/**
 * 字符长度 → 建议字号分档（px）
 * 依据：formatInteger / formatDecimal / formatCurrency 后的典型宽度（含千分符、小数、¥）
 */
const FONT_SIZE_TIERS: ReadonlyArray<{ maxLen: number; size: number }> = [
  { maxLen: 6, size: 28 },
  { maxLen: 9, size: 24 },
  { maxLen: 12, size: 21 },
  { maxLen: 16, size: 18 },
];

const DEFAULT_MIN_FONT_SIZE = STAT_VALUE_FONT_MIN;
const DEFAULT_MAX_FONT_SIZE = STAT_VALUE_FONT_MAX;
const OVERFLOW_TIER_SIZE = STAT_VALUE_FONT_MIN;

/**
 * 根据展示文本长度返回建议字号（px）
 * @param displayText 已格式化的展示值（与 UI 一致，千分符/前缀/小数均计入长度）
 * @param options 字号上下限，默认 min=15、max=28
 * @returns 建议字号，供 CSS 变量 --stat-value-font-size 使用
 */
export function getStatValueFontSize(
  displayText: string,
  options?: StatValueFontSizeOptions,
): number {
  const min = options?.min ?? DEFAULT_MIN_FONT_SIZE;
  const max = options?.max ?? DEFAULT_MAX_FONT_SIZE;
  const len = displayText?.length ?? 0;

  let size = OVERFLOW_TIER_SIZE;
  for (const tier of FONT_SIZE_TIERS) {
    if (len <= tier.maxLen) {
      size = tier.size;
      break;
    }
  }

  return Math.min(max, Math.max(min, size));
}
