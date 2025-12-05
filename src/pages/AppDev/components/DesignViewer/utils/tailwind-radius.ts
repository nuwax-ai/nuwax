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
 * 圆角类名正则表达式
 */
export const RADIUS_REGEXP =
  /^rounded(-none|-sm|-md|-lg|-xl|-2xl|-3xl|-full)?$/;

/**
 * 将用户友好的标签转换为 Tailwind 圆角类名
 * @param label 用户友好的标签，如 'Small', 'None', 'Full' 等
 * @returns Tailwind 类名，如 'rounded-sm'，如果找不到则返回 null
 */
export const convertLabelToRadiusClass = (label: string): string | null => {
  // 创建反向映射：从标签到类名
  // 注意：'Small' 可能对应 'rounded-sm' 或 'rounded'，优先返回 'rounded-sm'
  const labelToClass: Record<string, string> = {};
  Object.entries(tailwindRadiusMap).forEach(([className, labelValue]) => {
    // 如果标签已存在，且当前类名更具体（如 'rounded-sm' 比 'rounded' 更具体），则更新
    if (
      !labelToClass[labelValue] ||
      className.length > labelToClass[labelValue].length
    ) {
      labelToClass[labelValue] = className;
    }
  });

  return labelToClass[label] || null;
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

/**
 * 从 Tailwind 圆角类名映射到本地圆角类型
 * @param className Tailwind 圆角类名，如 "rounded-sm", "rounded-lg" 等
 * @returns 对应的圆角类型值
 */
export const mapTailwindRadiusToLocal = (className: string): string | null => {
  return tailwindRadiusMap[className] || null;
};
