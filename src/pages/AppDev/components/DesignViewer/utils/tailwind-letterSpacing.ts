/**
 * Tailwind CSS 字母间距类名映射表
 * 参考 Tailwind 默认字母间距配置（tracking- 系列）
 */
export const tailwindLetterSpacingMap: Record<string, string> = {
  'tracking-tighter': '-0.05em', // -0.05em
  'tracking-tight': '-0.025em', // -0.025em
  'tracking-normal': '0em', // 0em
  'tracking-wide': '0.025em', // 0.025em
  'tracking-wider': '0.05em', // 0.05em
  'tracking-widest': '0.1em', // 0.1em
};

/**
 * 字母间距类名正则表达式
 */
export const LETTER_SPACING_REGEXP =
  /^tracking-(tighter|tight|normal|wide|wider|widest)$/;

/**
 * 将 em 值转换为 Tailwind 字母间距类名
 * @param emValue em 值，如 '0.05em'
 * @returns Tailwind 类名，如 'tracking-wider'，如果找不到则返回 null
 */
export const convertEmToLetterSpacingClass = (
  emValue: string,
): string | null => {
  // 创建反向映射：从 em 值到类名
  const emToClass: Record<string, string> = {};
  Object.entries(tailwindLetterSpacingMap).forEach(([className, em]) => {
    emToClass[em] = className;
  });

  return emToClass[emValue] || null;
};

/**
 * 生成 Tailwind CSS 字母间距选项列表
 * 返回格式：{ label: '0.05em', value: '0.05em' } 或 { label: 'None', value: 'None' }
 * label 用于下拉展示，value 直接作为字母间距值使用
 */
export const generateTailwindLetterSpacingOptions = (): Array<{
  label: string;
  value: string;
}> => {
  const options: Array<{ label: string; value: string }> = [];

  // 首先添加 None 选项（排在最前面）
  options.push({ label: 'None', value: 'None' });

  // 按照 Tailwind 字母间距类名顺序生成选项
  const order = Object.keys(tailwindLetterSpacingMap);

  order.forEach((className) => {
    const em = tailwindLetterSpacingMap[className];
    if (em) {
      options.push({ label: em, value: em });
    }
  });

  return options;
};
