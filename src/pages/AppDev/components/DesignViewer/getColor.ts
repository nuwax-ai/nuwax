/**
 * Tailwind CSS 完整颜色映射表
 * 包含所有颜色和所有色阶（50-950）
 */
const tailwindColorMap: Record<string, Record<string, string>> = {
  slate: {
    '50': '#f8fafc',
    '100': '#f1f5f9',
    '200': '#e2e8f0',
    '300': '#cbd5e1',
    '400': '#94a3b8',
    '500': '#64748b',
    '600': '#475569',
    '700': '#334155',
    '800': '#1e293b',
    '900': '#0f172a',
    '950': '#020617',
  },
  gray: {
    '50': '#f9fafb',
    '100': '#f3f4f6',
    '200': '#e5e7eb',
    '300': '#d1d5db',
    '400': '#9ca3af',
    '500': '#6b7280',
    '600': '#4b5563',
    '700': '#374151',
    '800': '#1f2937',
    '900': '#111827',
    '950': '#030712',
  },
  zinc: {
    '50': '#fafafa',
    '100': '#f4f4f5',
    '200': '#e4e4e7',
    '300': '#d4d4d8',
    '400': '#a1a1aa',
    '500': '#71717a',
    '600': '#52525b',
    '700': '#3f3f46',
    '800': '#27272a',
    '900': '#18181b',
    '950': '#09090b',
  },
  neutral: {
    '50': '#fafafa',
    '100': '#f5f5f5',
    '200': '#e5e5e5',
    '300': '#d4d4d4',
    '400': '#a3a3a3',
    '500': '#737373',
    '600': '#525252',
    '700': '#404040',
    '800': '#262626',
    '900': '#171717',
    '950': '#0a0a0a',
  },
  stone: {
    '50': '#fafaf9',
    '100': '#f5f5f4',
    '200': '#e7e5e4',
    '300': '#d6d3d1',
    '400': '#a8a29e',
    '500': '#78716c',
    '600': '#57534e',
    '700': '#44403c',
    '800': '#292524',
    '900': '#1c1917',
    '950': '#0c0a09',
  },
  red: {
    '50': '#fef2f2',
    '100': '#fee2e2',
    '200': '#fecaca',
    '300': '#fca5a5',
    '400': '#f87171',
    '500': '#ef4444',
    '600': '#dc2626',
    '700': '#b91c1c',
    '800': '#991b1b',
    '900': '#7f1d1d',
    '950': '#450a0a',
  },
  orange: {
    '50': '#fff7ed',
    '100': '#ffedd5',
    '200': '#fed7aa',
    '300': '#fdba74',
    '400': '#fb923c',
    '500': '#f97316',
    '600': '#ea580c',
    '700': '#c2410c',
    '800': '#9a3412',
    '900': '#7c2d12',
    '950': '#431407',
  },
  amber: {
    '50': '#fffbeb',
    '100': '#fef3c7',
    '200': '#fde68a',
    '300': '#fcd34d',
    '400': '#fbbf24',
    '500': '#f59e0b',
    '600': '#d97706',
    '700': '#b45309',
    '800': '#92400e',
    '900': '#78350f',
    '950': '#451a03',
  },
  yellow: {
    '50': '#fefce8',
    '100': '#fef9c3',
    '200': '#fef08a',
    '300': '#fde047',
    '400': '#facc15',
    '500': '#eab308',
    '600': '#ca8a04',
    '700': '#a16207',
    '800': '#854d0e',
    '900': '#713f12',
    '950': '#422006',
  },
  lime: {
    '50': '#f7fee7',
    '100': '#ecfccb',
    '200': '#d9f99d',
    '300': '#bef264',
    '400': '#a3e635',
    '500': '#84cc16',
    '600': '#65a30d',
    '700': '#4d7c0f',
    '800': '#365314',
    '900': '#365314',
    '950': '#1a2e05',
  },
  green: {
    '50': '#f0fdf4',
    '100': '#dcfce7',
    '200': '#bbf7d0',
    '300': '#86efac',
    '400': '#4ade80',
    '500': '#22c55e',
    '600': '#16a34a',
    '700': '#15803d',
    '800': '#166534',
    '900': '#14532d',
    '950': '#052e16',
  },
  emerald: {
    '50': '#ecfdf5',
    '100': '#d1fae5',
    '200': '#a7f3d0',
    '300': '#6ee7b7',
    '400': '#34d399',
    '500': '#10b981',
    '600': '#059669',
    '700': '#047857',
    '800': '#065f46',
    '900': '#064e3b',
    '950': '#022c22',
  },
  teal: {
    '50': '#f0fdfa',
    '100': '#ccfbf1',
    '200': '#99f6e4',
    '300': '#5eead4',
    '400': '#2dd4bf',
    '500': '#14b8a6',
    '600': '#0d9488',
    '700': '#0f766e',
    '800': '#115e59',
    '900': '#134e4a',
    '950': '#042f2e',
  },
  cyan: {
    '50': '#ecfeff',
    '100': '#cffafe',
    '200': '#a5f3fc',
    '300': '#67e8f9',
    '400': '#22d3ee',
    '500': '#06b6d4',
    '600': '#0891b2',
    '700': '#0e7490',
    '800': '#155e75',
    '900': '#164e63',
    '950': '#083344',
  },
  sky: {
    '50': '#f0f9ff',
    '100': '#e0f2fe',
    '200': '#bae6fd',
    '300': '#7dd3fc',
    '400': '#38bdf8',
    '500': '#0ea5e9',
    '600': '#0284c7',
    '700': '#0369a1',
    '800': '#075985',
    '900': '#0c4a6e',
    '950': '#082f49',
  },
  blue: {
    '50': '#eff6ff',
    '100': '#dbeafe',
    '200': '#bfdbfe',
    '300': '#93c5fd',
    '400': '#60a5fa',
    '500': '#3b82f6',
    '600': '#2563eb',
    '700': '#1d4ed8',
    '800': '#1e40af',
    '900': '#1e3a8a',
    '950': '#172554',
  },
  indigo: {
    '50': '#eef2ff',
    '100': '#e0e7ff',
    '200': '#c7d2fe',
    '300': '#a5b4fc',
    '400': '#818cf8',
    '500': '#6366f1',
    '600': '#4f46e5',
    '700': '#4338ca',
    '800': '#3730a3',
    '900': '#312e81',
    '950': '#1e1b4b',
  },
  violet: {
    '50': '#f5f3ff',
    '100': '#ede9fe',
    '200': '#ddd6fe',
    '300': '#c4b5fd',
    '400': '#a78bfa',
    '500': '#8b5cf6',
    '600': '#7c3aed',
    '700': '#6d28d9',
    '800': '#5b21b6',
    '900': '#4c1d95',
    '950': '#2e1065',
  },
  purple: {
    '50': '#faf5ff',
    '100': '#f3e8ff',
    '200': '#e9d5ff',
    '300': '#d8b4fe',
    '400': '#c084fc',
    '500': '#a855f7',
    '600': '#9333ea',
    '700': '#7e22ce',
    '800': '#6b21a8',
    '900': '#581c87',
    '950': '#3b0764',
  },
  fuchsia: {
    '50': '#fdf4ff',
    '100': '#fae8ff',
    '200': '#f5d0fe',
    '300': '#f0abfc',
    '400': '#e879f9',
    '500': '#d946ef',
    '600': '#c026d3',
    '700': '#a21caf',
    '800': '#86198f',
    '900': '#701a75',
    '950': '#4a044e',
  },
  pink: {
    '50': '#fdf2f8',
    '100': '#fce7f3',
    '200': '#fbcfe8',
    '300': '#f9a8d4',
    '400': '#f472b6',
    '500': '#ec4899',
    '600': '#db2777',
    '700': '#be185d',
    '800': '#9f1239',
    '900': '#831843',
    '950': '#500724',
  },
  rose: {
    '50': '#fff1f2',
    '100': '#ffe4e6',
    '200': '#fecdd3',
    '300': '#fda4af',
    '400': '#fb7185',
    '500': '#f43f5e',
    '600': '#e11d48',
    '700': '#be123c',
    '800': '#9f1239',
    '900': '#881337',
    '950': '#4c0519',
  },
};

/**
 * 生成完整的 Tailwind CSS 颜色选项列表
 * 包含所有颜色和所有色阶
 * 默认和透明选项会排在最前面
 */
export const generateFullTailwindColorOptions = (): Array<{
  label: string;
  value: string;
}> => {
  const options: Array<{ label: string; value: string }> = [];

  // 首先添加默认和透明选项（排在最前面）
  const specialOptions = [
    { label: 'Default', value: 'Default' },
    { label: 'transparent', value: 'transparent' },
    { label: 'black', value: '#000000' },
    { label: 'white', value: '#ffffff' },
  ];

  // 将特殊选项添加到数组开头
  options.push(...specialOptions);

  // 然后遍历所有颜色和色阶
  Object.entries(tailwindColorMap).forEach(([colorName, shades]) => {
    Object.entries(shades).forEach(([shade, hexValue]) => {
      const label = `${colorName}-${shade}`;
      options.push({ label, value: hexValue });
    });
  });

  return options;
};

/**
 * Tailwind CSS 阴影类名映射
 * 包含所有 Tailwind CSS 阴影选项，映射到用户友好的标签
 */
const tailwindShadowMap: Record<string, string> = {
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

/**
 * Tailwind CSS 圆角类名映射
 * 包含所有 Tailwind CSS 圆角选项，映射到用户友好的标签
 */
const tailwindRadiusMap: Record<string, string> = {
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

/**
 * Tailwind CSS 透明度类名映射
 * 包含所有 Tailwind CSS 透明度选项（0-100）
 */
const tailwindOpacityMap: Record<string, number> = {
  'opacity-0': 0,
  'opacity-5': 5,
  'opacity-10': 10,
  'opacity-20': 20,
  'opacity-25': 25,
  'opacity-30': 30,
  'opacity-40': 40,
  'opacity-50': 50,
  'opacity-60': 60,
  'opacity-70': 70,
  'opacity-75': 75,
  'opacity-80': 80,
  'opacity-90': 90,
  'opacity-95': 95,
  'opacity-100': 100,
};

/**
 * 生成 Tailwind CSS 透明度选项列表
 * 从 Tailwind CSS 中获取透明度选项
 * 返回格式：{ label: '50%', value: 50 }
 */
export const generateTailwindOpacityOptions = (): Array<{
  label: string;
  value: number;
}> => {
  const options: Array<{ label: string; value: number }> = [];

  // 按照透明度值从小到大排序
  const opacityOrder = Object.keys(tailwindOpacityMap);

  opacityOrder.forEach((opacityClass) => {
    const value = tailwindOpacityMap[opacityClass];
    if (value !== undefined) {
      options.push({ label: `${value}%`, value });
    }
  });

  return options;
};

/**
 * Tailwind CSS 字体大小类名映射
 * 包含所有 Tailwind CSS 字体大小选项
 */
const tailwindFontSizeMap: Record<string, string> = {
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

/**
 * 从 Tailwind 颜色类名中获取实际颜色值
 * 优先从 generateFullTailwindColorOptions() 生成的颜色列表中查找，找不到时再使用 DOM 计算样式
 * @param className Tailwind 颜色类名，如 "text-red-500", "bg-blue-600", "border-green-500"
 * @param callback 回调函数，返回实际颜色值
 */
export const getColorFromTailwindClass = (
  className: string,
  callback: (color: string | null) => void,
) => {
  if (!className || typeof className !== 'string') {
    callback(null);
    return;
  }

  // 处理特殊值
  if (className === 'Default' || className === 'transparent') {
    callback(className);
    return;
  }

  if (className === 'black') {
    callback('#000000');
    return;
  }

  if (className === 'white') {
    callback('#ffffff');
    return;
  }

  const fontSizeOrder = Object.keys(tailwindFontSizeMap);

  // 特殊处理：text-center 或字体大小类名, 返回 null
  if (className === 'text-center' || fontSizeOrder.includes(className)) {
    callback(null);
    return;
  }

  // 从 Tailwind 颜色列表中查找
  // 首先从 generateFullTailwindColorOptions() 生成的颜色列表中查找
  const colorOptions = generateFullTailwindColorOptions();

  // 提取颜色类名（如 "text-red-500" -> "red-500", "bg-blue-600" -> "blue-600"）
  let colorClass = className;
  if (className.startsWith('text-')) {
    colorClass = className.replace('text-', '');
  } else if (className.startsWith('bg-')) {
    colorClass = className.replace('bg-', '');
  } else if (className.startsWith('border-')) {
    colorClass = className.replace('border-', '');
  }

  // 在颜色列表中查找匹配的项
  const matchedOption = colorOptions.find((option) => {
    // 匹配格式：red-500, blue-600 等
    return option.label === colorClass;
  });

  if (matchedOption && matchedOption.value) {
    // 如果找到了匹配的颜色，直接返回
    callback(matchedOption.value);
    return;
  }

  // 如果找不到匹配的颜色，返回 Default
  return callback('Default');
};
