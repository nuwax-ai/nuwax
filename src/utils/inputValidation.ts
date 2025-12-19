import React from 'react';

/**
 * 输入验证工具函数
 * 提供各种输入框验证和限制功能
 */

/**
 * 只允许输入数字的配置选项
 */
interface NumberOnlyFieldPropsOptions {
  /** 输入框占位符文本 */
  placeholder?: string;
  /** 是否允许负数，默认 false */
  allowNegative?: boolean;
  /** 是否允许小数，默认 false */
  allowDecimal?: boolean;
  /** 最大长度限制 */
  maxLength?: number;
  /** 额外的 onChange 回调 */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * 生成只允许输入数字的 fieldProps 配置
 * 可用于 Ant Design 的 Input 或 ProTable 的 fieldProps
 *
 * @param options 配置选项
 * @returns fieldProps 对象，可直接用于 Input 组件
 *
 * @example
 * // 基础用法
 * <Input {...getNumberOnlyFieldProps({ placeholder: '请输入数字' })} />
 *
 * @example
 * // ProTable 中使用
 * {
 *   title: '用户ID',
 *   dataIndex: 'userId',
 *   fieldProps: getNumberOnlyFieldProps({ placeholder: '请输入用户ID' }),
 * }
 *
 * @example
 * // 允许小数
 * getNumberOnlyFieldProps({ placeholder: '请输入金额', allowDecimal: true })
 */
export const getNumberOnlyFieldProps = (
  options: NumberOnlyFieldPropsOptions = {},
) => {
  const {
    placeholder = '请输入数字',
    allowNegative = false,
    allowDecimal = false,
    maxLength,
    onChange: customOnChange,
  } = options;

  // 构建正则表达式
  let pattern = '[0-9]';
  if (allowNegative) {
    pattern = `[-${pattern}]`;
  }
  if (allowDecimal) {
    pattern = `[${pattern}.]`;
  }
  const regex = new RegExp(pattern);

  // 构建过滤正则（用于过滤非法字符）
  let filterPattern = '\\D'; // 默认过滤所有非数字
  if (allowNegative && allowDecimal) {
    filterPattern = '[^0-9.-]'; // 保留数字、负号、小数点
  } else if (allowNegative) {
    filterPattern = '[^0-9-]'; // 保留数字、负号
  } else if (allowDecimal) {
    filterPattern = '[^0-9.]'; // 保留数字、小数点
  }
  const filterRegex = new RegExp(filterPattern, 'g');

  /**
   * 标准化数字输入值
   * 处理特殊情况：多个负号、多个小数点等
   */
  const normalizeValue = (value: string): string => {
    let normalized = value;

    // 处理负号：只允许第一个位置有负号，且只能有一个
    if (allowNegative) {
      const firstChar = normalized.charAt(0);
      const restChars = normalized.slice(1).replace(/-/g, '');
      normalized = firstChar === '-' ? '-' + restChars : restChars;
    }

    // 处理小数点：只允许一个小数点
    if (allowDecimal) {
      const parts = normalized.split('.');
      if (parts.length > 2) {
        normalized = parts[0] + '.' + parts.slice(1).join('');
      }
    }

    return normalized;
  };

  return {
    placeholder,
    maxLength,
    // 阻止直接键盘输入非法字符
    onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => {
      // 允许的特殊按键（如退格、删除等）
      if (
        e.key === 'Backspace' ||
        e.key === 'Delete' ||
        e.key === 'Tab' ||
        e.key === 'Enter' ||
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight'
      ) {
        return;
      }

      // 负号只能在第一个位置输入
      if (e.key === '-' && allowNegative) {
        const input = e.target as HTMLInputElement;
        const selectionStart = input.selectionStart || 0;
        if (selectionStart !== 0 || input.value.includes('-')) {
          e.preventDefault();
        }
        return;
      }

      // 小数点只能有一个
      if (e.key === '.' && allowDecimal) {
        const input = e.target as HTMLInputElement;
        if (input.value.includes('.')) {
          e.preventDefault();
        }
        return;
      }

      // 检查是否为允许的字符
      if (!regex.test(e.key)) {
        e.preventDefault();
      }
    },

    // 实时过滤非法字符（包括输入法输入）
    onInput: (e: React.FormEvent<HTMLInputElement>) => {
      const input = e.target as HTMLInputElement;
      // 先过滤非法字符
      let value = input.value.replace(filterRegex, '');
      // 标准化处理
      value = normalizeValue(value);

      if (input.value !== value) {
        input.value = value;
        // 触发 input 事件，确保表单值同步
        const event = new Event('input', { bubbles: true });
        input.dispatchEvent(event);
      }
    },

    // 输入法结束时过滤非法字符
    onCompositionEnd: (e: React.CompositionEvent<HTMLInputElement>) => {
      const input = e.target as HTMLInputElement;
      let value = input.value.replace(filterRegex, '');
      value = normalizeValue(value);
      input.value = value;
    },

    // 支持自定义 onChange
    onChange: customOnChange,
  };
};

/**
 * 生成只允许输入整数的 fieldProps 配置（不支持小数和负数）
 * 这是 getNumberOnlyFieldProps 的简化版本
 *
 * @param placeholder 占位符文本
 * @param maxLength 最大长度
 * @returns fieldProps 对象
 *
 * @example
 * <Input {...getIntegerOnlyFieldProps('请输入ID')} />
 */
export const getIntegerOnlyFieldProps = (
  placeholder?: string,
  maxLength?: number,
) => {
  return getNumberOnlyFieldProps({
    placeholder,
    maxLength,
    allowNegative: false,
    allowDecimal: false,
  });
};

/**
 * 生成只允许输入正数（支持小数）的 fieldProps 配置
 *
 * @param placeholder 占位符文本
 * @param maxLength 最大长度
 * @returns fieldProps 对象
 *
 * @example
 * <Input {...getPositiveNumberFieldProps('请输入金额')} />
 */
export const getPositiveNumberFieldProps = (
  placeholder?: string,
  maxLength?: number,
) => {
  return getNumberOnlyFieldProps({
    placeholder,
    maxLength,
    allowNegative: false,
    allowDecimal: true,
  });
};
