/**
 * Tailwind CSS 阴影类名映射
 * 包含所有 Tailwind CSS 阴影选项，映射到用户友好的标签
 */
export const tailwindShadowMap: Record<string, string> = {
  'shadow-none': 'None',
  'shadow-sm': 'Small',
  shadow: 'Normal', // shadow 默认是 normal
  'shadow-md': 'Medium',
  'shadow-lg': 'Large',
  'shadow-xl': 'Extra Large',
  'shadow-2xl': 'Extra Large',
  'shadow-inner': 'Inner',
};

/**
 * 生成 Tailwind CSS 阴影选项列表
 * 从 Tailwind CSS 中获取阴影选项
 * 顺序：Default, None, Extra Small, Small, Normal, Medium, Large, Extra Large
 */
export const generateTailwindShadowOptions = (): Array<{
  label: string;
  value: string;
}> => {
  const options: Array<{ label: string; value: string }> = [];

  // 首先添加默认选项（排在最前面）
  options.push({ label: 'Default', value: 'Default' });

  // 然后添加 None 选项
  options.push({ label: 'None', value: 'None' });

  // 添加 Tailwind CSS 阴影选项
  // 按照从小到大的顺序排列，匹配图片中的显示顺序
  const shadowOrder = [
    'shadow-sm', // Small (对应图片中的 Small)
    'shadow', // Normal (对应图片中的 Normal)
    'shadow-md', // Medium (对应图片中的 Medium)
    'shadow-lg', // Large (对应图片中的 Large)
    'shadow-xl', // Extra Large (对应图片中的 Extra Large)
    'shadow-2xl', // Extra Large (2倍超大)
    'shadow-inner', // Inner (内阴影)
  ];

  // 用于跟踪已添加的标签，避免重复
  const addedLabels = new Set<string>();

  shadowOrder.forEach((shadowClass) => {
    const label = tailwindShadowMap[shadowClass];
    if (label && !addedLabels.has(label)) {
      options.push({ label, value: label });
      addedLabels.add(label);
    }
  });

  return options;
};
