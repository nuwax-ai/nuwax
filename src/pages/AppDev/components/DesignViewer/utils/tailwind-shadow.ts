/**
 * Tailwind CSS 阴影类名映射表
 * 基于 Tailwind CSS 默认配置（shadow 系列）
 * 包含所有标准的 Tailwind CSS 阴影选项，映射到用户友好的标签
 * 参考：https://tailwindcss.com/docs/box-shadow
 */
export const tailwindShadowMap: Record<string, string> = {
  'shadow-none': 'None', // 无阴影
  'shadow-sm': 'Small', // 小阴影
  shadow: 'Normal', // shadow 默认是 normal（中等阴影）
  'shadow-md': 'Medium', // 中等阴影
  'shadow-lg': 'Large', // 大阴影
  'shadow-xl': 'Extra Large', // 超大阴影
  'shadow-2xl': 'Extra Large', // 2倍超大阴影
  'shadow-inner': 'Inner', // 内阴影
};

/**
 * 阴影类名正则表达式
 */
export const SHADOW_REGEXP = /^shadow(-none|-sm|-md|-lg|-xl|-2xl|-inner)?$/;

/**
 * 将用户友好的标签转换为 Tailwind 阴影类名
 * @param label 用户友好的标签，如 'Small', 'None', 'Normal' 等
 * @returns Tailwind 类名，如 'shadow-sm'，如果找不到则返回 null
 */
export const convertLabelToShadowClass = (label: string): string | null => {
  // 创建反向映射：从标签到类名
  // 注意：'Extra Large' 可能对应 'shadow-xl' 或 'shadow-2xl'，优先返回 'shadow-xl'
  const labelToClass: Record<string, string> = {};
  Object.entries(tailwindShadowMap).forEach(([className, labelValue]) => {
    // 如果标签已存在，且当前类名更具体（如 'shadow-xl' 比 'shadow-2xl' 更短，优先选择），则更新
    if (
      !labelToClass[labelValue] ||
      (className.length < labelToClass[labelValue].length &&
        !className.includes('2xl'))
    ) {
      labelToClass[labelValue] = className;
    }
  });

  return labelToClass[label] || null;
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
