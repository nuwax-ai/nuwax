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
 * 透明度类名正则表达式
 */
export const OPACITY_REGEXP =
  /^opacity-(0|5|10|20|25|30|40|50|60|70|75|80|90|95|100)$/;

/**
 * 将数字值转换为 Tailwind 透明度类名
 * @param value 透明度值，如 50
 * @returns Tailwind 类名，如 'opacity-50'，如果找不到则返回 null
 */
export const convertNumberToOpacityClass = (value: number): string | null => {
  // 创建反向映射：从数字值到类名
  const valueToClass: Record<number, string> = {};
  Object.entries(tailwindOpacityMap).forEach(([className, numValue]) => {
    valueToClass[numValue] = className;
  });

  return valueToClass[value] || null;
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
