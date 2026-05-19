import BigNumber from 'bignumber.js';

/** 可参与大数运算的入参类型（含 BigNumber 实例，便于承接 sum/subtract 返回值） */
export type NumericInput = BigNumber.Value | null | undefined;

BigNumber.config({
  DECIMAL_PLACES: 20,
  ROUNDING_MODE: BigNumber.ROUND_HALF_UP,
});

/**
 * 转为 BigNumber，非法值按 0 处理
 */
export const toBigNumber = (value: NumericInput): BigNumber => {
  if (value === null || value === undefined || value === '') {
    return new BigNumber(0);
  }
  if (BigNumber.isBigNumber(value)) {
    return value.isNaN() ? new BigNumber(0) : value;
  }
  const bn = new BigNumber(value);
  return bn.isNaN() ? new BigNumber(0) : bn;
};

/**
 * 大数求和
 */
export const sumBigNumbers = (...values: NumericInput[]): BigNumber =>
  values.reduce<BigNumber>(
    (acc, cur) => acc.plus(toBigNumber(cur)),
    new BigNumber(0),
  );

/**
 * 大数相减：a - b
 */
export const subtractBigNumbers = (
  a: NumericInput,
  b: NumericInput,
): BigNumber => toBigNumber(a).minus(toBigNumber(b));

/**
 * 大数求和后转为 number（用于仍需 number 类型的接口/状态；超大整数可能丢失精度）
 */
export const sumBigNumbersToNumber = (...values: NumericInput[]): number =>
  sumBigNumbers(...values).toNumber();

/**
 * 格式化为整数字符串（千分符）
 */
export const formatBigInteger = (value: NumericInput): string =>
  toBigNumber(value).toFormat(0);

/**
 * 格式化为小数字符串（千分符）
 * @param value 数值
 * @param decimalPlaces 小数位数
 */
export const formatBigDecimal = (
  value: NumericInput,
  decimalPlaces = 2,
): string => toBigNumber(value).toFormat(decimalPlaces);
