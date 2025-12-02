/**
 * Tailwind CSS 圆角类名映射
 * 包含所有 Tailwind CSS 圆角选项，映射到用户友好的标签
 */
export const tailwindRadiusMap: Record<string, string> = {
  'rounded-none': 'None',
  'rounded-sm': 'Small',
  rounded: 'Small', // rounded 默认是 small
  'rounded-md': 'Medium',
  'rounded-lg': 'Large',
  'rounded-xl': 'Extra Large',
  'rounded-2xl': 'Double Extra Large',
  'rounded-3xl': 'Triple Extra Large',
  'rounded-full': 'Full',
};

/**
 * 生成 Tailwind CSS 圆角选项列表
 * 从 Tailwind CSS 中获取圆角选项
 * 顺序：Default, None, Extra Small, Small, Medium, Large, Extra Large, Double Extra Large, Triple Extra Large, Quadruple Extra Large, Full
 */
export const generateTailwindRadiusOptions = (): Array<{
  label: string;
  value: string;
}> => {
  const options: Array<{ label: string; value: string }> = [];

  // 首先添加默认选项（排在最前面）
  options.push({ label: 'Default', value: 'Default' });

  // 然后添加 None 选项
  options.push({ label: 'None', value: 'None' });

  // 添加 Tailwind CSS 圆角选项
  // 按照从小到大的顺序排列，匹配图片中的显示顺序
  const radiusOrder = [
    'rounded-sm', // Small (对应图片中的 Small)
    'rounded', // Small (默认，对应图片中的 Small)
    'rounded-md', // Medium (对应图片中的 Medium)
    'rounded-lg', // Large (对应图片中的 Large)
    'rounded-xl', // Extra Large (对应图片中的 Extra Large)
    'rounded-2xl', // Double Extra Large (对应图片中的 Double Extra Large)
    'rounded-3xl', // Triple Extra Large (对应图片中的 Triple Extra Large)
    'rounded-full', // Full (对应图片中的 Full)
  ];

  // 用于跟踪已添加的标签，避免重复
  const addedLabels = new Set<string>();

  radiusOrder.forEach((radiusClass) => {
    const label = tailwindRadiusMap[radiusClass];
    if (label && !addedLabels.has(label)) {
      options.push({ label, value: label });
      addedLabels.add(label);
    }
  });

  // 添加 Full 选项（如果还没有添加）
  if (!addedLabels.has('Full')) {
    options.push({ label: 'Full', value: 'Full' });
  }

  return options;
};
