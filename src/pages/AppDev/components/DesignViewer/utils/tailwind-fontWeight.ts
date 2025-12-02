// 字体粗细类名正则表达式
export const FONT_WEIGHT_REGEXP =
  /^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/;

/**
 * Tailwind CSS 字体粗细类名映射表
 * 包含所有 Tailwind CSS 字体粗细选项，映射到用户友好的标签
 */
const tailwindFontWeightMap: Record<string, string> = {
  'font-thin': 'Thin', // 100
  'font-extralight': 'Extra Light', // 200
  'font-light': 'Light', // 300
  'font-normal': 'Regular', // 400
  'font-medium': 'Medium', // 500
  'font-semibold': 'Semi Bold', // 600
  'font-bold': 'Bold', // 700
  'font-extrabold': 'Extra Bold', // 800
  'font-black': 'Black', // 900
};

/**
 * 生成 Tailwind CSS 字体粗细选项列表
 * 从 Tailwind CSS 中获取字体粗细选项
 * 返回格式：{ label: 'Semi Bold', value: 'font-semibold' }
 * label 显示用户友好的名称，value 使用 Tailwind 字体粗细类名（直接用于类名）
 * 基于 Tailwind CSS 默认字体粗细配置
 */
export const generateTailwindFontWeightOptions = (): Array<{
  label: string;
  value: string;
}> => {
  const options: Array<{ label: string; value: string }> = [];

  // 按照 Tailwind 字体粗细顺序生成选项（从细到粗）
  // 顺序：Thin, Extra Light, Light, Regular, Medium, Semi Bold, Bold, Extra Bold, Black
  const fontWeightOrder: string[] = Object.keys(tailwindFontWeightMap);

  fontWeightOrder.forEach((fontWeightClass) => {
    const label = tailwindFontWeightMap[fontWeightClass];
    if (label) {
      // label 显示用户友好的名称，value 使用 Tailwind 类名
      options.push({ label, value: fontWeightClass });
    }
  });

  return options;
};
