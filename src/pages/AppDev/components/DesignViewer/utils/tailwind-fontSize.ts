// 字体大小类名正则表达式
export const FONT_SIZE_REGEXP =
  /^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$/;

/**
 * Tailwind CSS 字体大小类名映射
 * 包含所有 Tailwind CSS 字体大小选项
 */
export const tailwindFontSizeMap: Record<string, string> = {
  'text-xs': 'xs',
  'text-sm': 'sm',
  'text-base': 'base',
  'text-lg': 'lg',
  'text-xl': 'xl',
  'text-2xl': '2xl',
  'text-3xl': '3xl',
  'text-4xl': '4xl',
  'text-5xl': '5xl',
  'text-6xl': '6xl',
  'text-7xl': '7xl',
  'text-8xl': '8xl',
  'text-9xl': '9xl',
};

/**
 * 生成 Tailwind CSS 字体大小选项列表
 * 从 Tailwind CSS 中获取字体大小选项
 * 顺序：Default, xs, sm, base, lg, xl, 2xl, 3xl, 4xl, 5xl, 6xl, 7xl, 8xl, 9xl
 */
export const generateTailwindFontSizeOptions = (): Array<{
  label: string;
  value: string;
}> => {
  const options: Array<{ label: string; value: string }> = [];

  // 首先添加默认选项（排在最前面）
  options.push({ label: 'Default', value: 'Default' });

  // 添加 Tailwind CSS 字体大小选项
  // 按照从小到大的顺序排列，匹配图片中的显示顺序
  const fontSizeOrder = Object.keys(tailwindFontSizeMap);

  fontSizeOrder.forEach((fontSizeClass) => {
    const value = tailwindFontSizeMap[fontSizeClass];
    if (value) {
      options.push({ label: value, value });
    }
  });

  return options;
};
