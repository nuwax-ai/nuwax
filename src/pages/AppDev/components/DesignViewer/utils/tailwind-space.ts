/**
 * Tailwind CSS spacing 值映射表（用于 padding 和 margin）
 * 基于 Tailwind 默认配置：1 = 0.25rem = 4px
 * 包含所有标准的 Tailwind spacing 值
 */
const tailwindSpacingPixelMap: Record<string, number> = {
  '0': 0,
  px: 1,
  '0.5': 2, // 0.125rem
  '1': 4, // 0.25rem
  '1.5': 6, // 0.375rem
  '2': 8, // 0.5rem
  '2.5': 10, // 0.625rem
  '3': 12, // 0.75rem
  '3.5': 14, // 0.875rem
  '4': 16, // 1rem
  '5': 20, // 1.25rem
  '6': 24, // 1.5rem
  '7': 28, // 1.75rem
  '8': 32, // 2rem
  '9': 36, // 2.25rem
  '10': 40, // 2.5rem
  '11': 44, // 2.75rem
  '12': 48, // 3rem
  '14': 56, // 3.5rem
  '16': 64, // 4rem
  '20': 80, // 5rem
  '24': 96, // 6rem
  '28': 112, // 7rem
  '32': 128, // 8rem
  '36': 144, // 9rem
  '40': 160, // 10rem
  '44': 176, // 11rem
  '48': 192, // 12rem
  '52': 208, // 13rem
  '56': 224, // 14rem
  '60': 240, // 15rem
  '64': 256, // 16rem
  '72': 288, // 18rem
  '80': 320, // 20rem
  '96': 384, // 24rem
};

/**
 * 从 Tailwind CSS spacing 配置生成像素值选项列表
 * 返回格式：{ label: '160px', value: '40' }
 * label 显示像素值（用户友好），value 使用 Tailwind spacing 值（直接用于类名）
 * 基于 Tailwind CSS 默认 spacing 配置（用于 padding 和 margin）
 * @param includeAuto 是否包含 'auto' 选项，默认为 true
 */
export const generateTailwindSpacingPixelOptions = (
  includeAuto: boolean = true,
): Array<{
  label: string;
  value: string;
}> => {
  const options: Array<{ label: string; value: string }> = [];

  // 按照 Tailwind spacing 顺序生成选项
  // 顺序：0, px, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 72, 80, 96
  const spacingOrder = [
    '0',
    'px',
    '0.5',
    '1',
    '1.5',
    '2',
    '2.5',
    '3',
    '3.5',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    '11',
    '12',
    '14',
    '16',
    '20',
    '24',
    '28',
    '32',
    '36',
    '40',
    '44',
    '48',
    '52',
    '56',
    '60',
    '64',
    '72',
    '80',
    '96',
  ];

  spacingOrder.forEach((spacingKey) => {
    const pixelValue = tailwindSpacingPixelMap[spacingKey];
    if (pixelValue !== undefined) {
      const pixelString = `${pixelValue}px`;
      // label 显示像素值（用户友好），value 使用 Tailwind spacing 值（直接用于类名）
      options.push({ label: pixelString, value: spacingKey });
    }
  });

  // 如果需要，添加 'auto' 选项
  if (includeAuto) {
    options.push({ label: 'auto', value: 'auto' });
  }

  return options;
};
