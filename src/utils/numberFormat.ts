/**
 * 数字格式化工具（内部使用 bignumber.js，避免大整数/小数运算精度丢失）
 */

import {
  formatBigDecimal,
  formatBigInteger,
  subtractBigNumbers,
  sumBigNumbers,
  sumBigNumbersToNumber,
  toBigNumber,
  type NumericInput,
} from './bigNumber';

export { subtractBigNumbers, sumBigNumbers, sumBigNumbersToNumber };
export type { NumericInput };

export interface FormatDecimalOptions {
  /** 最小小数位数，默认 2 */
  minimumFractionDigits?: number;
  /** 最大小数位数，默认 2 */
  maximumFractionDigits?: number;
  /** 前缀，如 ¥ */
  prefix?: string;
}

/**
 * 多值求和后格式化为整数字符串
 */
export const sumNumbers = (...values: NumericInput[]): string =>
  formatBigInteger(sumBigNumbers(...values));

/**
 * 两值相减后格式化为整数字符串（a - b）
 */
export const subtractNumbers = (a: NumericInput, b: NumericInput): string =>
  formatBigInteger(subtractBigNumbers(a, b));

/**
 * 将数字格式化为带千分符的完整整数展示
 */
export const formatInteger = (num: NumericInput): string =>
  formatBigInteger(num);

/**
 * 将数字格式化为带千分符的小数展示
 */
export const formatDecimal = (
  num: NumericInput,
  options?: FormatDecimalOptions,
): string => {
  const {
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    prefix = '',
  } = options ?? {};

  const decimalPlaces = Math.max(minimumFractionDigits, maximumFractionDigits);
  const zeroDecimals =
    minimumFractionDigits > 0 ? `.${'0'.repeat(minimumFractionDigits)}` : '';

  const bn = toBigNumber(num);
  if (bn.isNaN()) {
    return `${prefix}0${zeroDecimals}`;
  }

  return `${prefix}${formatBigDecimal(num, decimalPlaces)}`;
};

/**
 * 金额格式：¥ 前缀 + 2 位小数 + 千分符
 */
export const formatCurrency = (num: NumericInput): string =>
  formatDecimal(num, { prefix: '¥' });
