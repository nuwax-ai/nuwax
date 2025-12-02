/**
 * Tailwind CSS 边框宽度值映射表
 * 基于 Tailwind CSS 默认配置
 */
const tailwindBorderWidthMap: Record<string, number> = {
  '0': 0, // border-0
  '1': 1, // border (默认，无数字后缀)
  '2': 2, // border-2
  '4': 4, // border-4
  '8': 8, // border-8
};

/**
 * 从 Tailwind CSS 边框宽度配置生成选项列表
 * 返回格式：{ label: '1px', value: '1' }
 * label 显示像素值（用户友好），value 使用 Tailwind 边框宽度值（直接用于类名）
 * 基于 Tailwind CSS 默认边框宽度配置
 */
export const generateTailwindBorderWidthOptions = (): Array<{
  label: string;
  value: string;
}> => {
  const options: Array<{ label: string; value: string }> = [];

  // 按照 Tailwind 边框宽度顺序生成选项
  // 顺序：0, 1 (border), 2, 4, 8
  const borderWidthOrder: string[] = ['0', '1', '2', '4', '8'];

  borderWidthOrder.forEach((borderWidthKey) => {
    const pixelValue = tailwindBorderWidthMap[borderWidthKey];
    if (pixelValue !== undefined) {
      const pixelString = `${pixelValue}px`;
      // label 显示像素值（用户友好），value 使用 Tailwind 边框宽度值（直接用于类名）
      options.push({ label: pixelString, value: borderWidthKey });
    }
  });

  return options;
};

/**
 * Tailwind CSS 边框样式类名映射表
 * 包含所有 Tailwind CSS 边框样式选项
 */
const tailwindBorderStyleMap: Record<string, string> = {
  'border-none': 'None',
  'border-solid': 'Solid',
  'border-dashed': 'Dashed',
  'border-dotted': 'Dotted',
  'border-double': 'Double',
};

/**
 * 从 Tailwind CSS 边框样式配置生成选项列表
 * 返回格式：{ label: 'Solid', value: 'border-solid' }
 * label 显示用户友好的名称，value 使用 Tailwind 边框样式类名（直接用于类名）
 * 基于 Tailwind CSS 默认边框样式配置
 */
export const generateTailwindBorderStyleOptions = (): Array<{
  label: string;
  value: string;
}> => {
  const options: Array<{ label: string; value: string }> = [];

  // 首先添加默认选项
  options.push({ label: 'Default', value: 'Default' });

  // 按照 Tailwind 边框样式顺序生成选项
  // 顺序：None, Solid, Dashed, Dotted, Double
  const borderStyleOrder = Object.keys(tailwindBorderStyleMap);

  borderStyleOrder.forEach((borderStyleClass) => {
    const label = tailwindBorderStyleMap[borderStyleClass];
    if (label) {
      // label 显示用户友好的名称，value 使用 Tailwind 类名
      options.push({ label, value: borderStyleClass });
    }
  });

  return options;
};

/**
 * 从 Tailwind 边框样式类名映射到本地边框样式值
 * @param className Tailwind 边框样式类名，如 "border-solid", "border-dashed" 等
 * @returns 对应的边框样式值（Tailwind 类名）
 */
export const mapTailwindBorderStyleToLocal = (
  className: string,
): string | null => {
  const styleMap: Record<string, string> = {
    'border-none': 'border-none',
    'border-solid': 'border-solid',
    'border-dashed': 'border-dashed',
    'border-dotted': 'border-dotted',
    'border-double': 'border-double',
  };
  return styleMap[className] || null;
};

/**
 * 从 Tailwind 边框宽度类名解析边框宽度
 * @param className Tailwind 边框宽度类名，如 "border-2", "border-4" 等
 * @returns 边框宽度值
 */
export const parseTailwindBorderWidth = (className: string): string | null => {
  if (className === 'border-0' || className === 'border-none') {
    return '0'; // 返回 Tailwind 边框宽度值
  }
  if (className === 'border') {
    return '1'; // border 默认是 1px，返回 Tailwind 边框宽度值 '1'
  }
  const match = className.match(/^border-(\d+)$/);
  if (match) {
    return match[1]; // 返回 Tailwind 边框宽度值（如 '2', '4', '8'）
  }
  return null;
};
