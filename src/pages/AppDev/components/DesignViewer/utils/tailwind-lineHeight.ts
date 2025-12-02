/**
 * Tailwind CSS 行高类名映射表
 * 参考 Tailwind 默认行高配置（leading- 系列）
 * 这里只选择与当前 UI 中 rem 值对应的几个常用选项
 */
export const tailwindLineHeightMap: Record<string, string> = {
  'leading-3': '0.75rem', // 0.75rem
  'leading-4': '1rem', // 1rem
  'leading-5': '1.25rem', // 1.25rem
  'leading-6': '1.5rem', // 1.5rem
  'leading-7': '1.75rem', // 1.75rem
  'leading-8': '2rem', // 2rem
  'leading-9': '2.25rem', // 2.25rem
  'leading-10': '2.5rem', // 2.5rem
};

/**
 * 行高类名正则表达式
 */
export const LINE_HEIGHT_REGEXP =
  /^leading-(3|4|5|6|7|8|9|10|none|tight|snug|normal|relaxed|loose)$/;

/**
 * 将 rem 值转换为 Tailwind 行高类名
 * @param remValue rem 值，如 '1.5rem'
 * @returns Tailwind 类名，如 'leading-6'，如果找不到则返回 null
 */
export const convertRemToLineHeightClass = (
  remValue: string,
): string | null => {
  // 创建反向映射：从 rem 值到类名
  const remToClass: Record<string, string> = {};
  Object.entries(tailwindLineHeightMap).forEach(([className, rem]) => {
    remToClass[rem] = className;
  });

  return remToClass[remValue] || null;
};

/**
 * 生成 Tailwind CSS 行高选项列表
 * 返回格式：{ label: '1.5rem', value: '1.5rem' } 或 { label: 'None', value: 'None' }
 * label 用于下拉展示，value 直接作为行高值使用
 */
export const generateTailwindLineHeightOptions = (): Array<{
  label: string;
  value: string;
}> => {
  const options: Array<{ label: string; value: string }> = [];

  // 首先添加 None 选项（排在最前面）
  // options.push({ label: 'None', value: 'None' });

  // 按照 Tailwind 行高类名顺序生成选项
  const order = Object.keys(tailwindLineHeightMap);

  order.forEach((className) => {
    const lh = tailwindLineHeightMap[className];
    if (lh) {
      options.push({ label: lh, value: lh });
    }
  });

  return options;
};
