import type { InputNumberProps } from 'antd';

/** 定价输入框默认最多小数位数。 */
export const DEFAULT_PRICE_INPUT_DECIMALS = 4;

type PriceInputFormatInfo = Parameters<
  NonNullable<InputNumberProps['formatter']>
>[1];

/**
 * 定价输入框展示：按指定小数位截断，并去掉末尾无意义的 0（如 0.99 而非 0.9900）。
 */
export const formatPriceInput = (
  value: number | string | undefined | null,
  info?: PriceInputFormatInfo,
  decimals: number = DEFAULT_PRICE_INPUT_DECIMALS,
): string => {
  if (info?.userTyping) {
    return info.input;
  }
  if (value === undefined || value === null || value === '') {
    return '';
  }
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return '';
  }
  return num.toFixed(decimals).replace(/\.?0+$/, '');
};

/** 定价输入框解析：限制最多指定位数的小数。 */
export const parsePriceInput = (
  value: string | undefined,
  decimals: number = DEFAULT_PRICE_INPUT_DECIMALS,
): number => {
  if (!value) {
    return 0;
  }
  const num = Number(value.replace(/[^\d.-]/g, ''));
  if (!Number.isFinite(num)) {
    return 0;
  }
  const factor = 10 ** decimals;
  return Math.round(num * factor) / factor;
};

export interface PriceInputNumberOptions {
  /** 最多小数位数，默认 4 */
  decimals?: number;
  min?: number;
  max?: number;
}

/**
 * 生成定价 InputNumber 共用配置（formatter / parser / step 等）。
 */
export const createPriceInputNumberProps = (
  options: PriceInputNumberOptions = {},
): Pick<InputNumberProps, 'min' | 'max' | 'step' | 'formatter' | 'parser'> => {
  const {
    decimals = DEFAULT_PRICE_INPUT_DECIMALS,
    min = 0,
    max = 100000000,
  } = options;

  return {
    min,
    max,
    step: 10 ** -decimals,
    formatter: (value, info) => formatPriceInput(value, info, decimals),
    parser: (value) => parsePriceInput(value, decimals),
  };
};
