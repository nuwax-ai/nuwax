import {
  AlignCenterSvg,
  AlignJustifySvg,
  AlignLeftSvg,
  AlignRightSvg,
  ResetSvg,
} from '../design.images.constants';

/**
 * Tailwind CSS 文本对齐类名映射表
 * 基于 Tailwind CSS 默认配置（text-align 系列）
 * 包含所有标准的 Tailwind CSS 文本对齐选项，映射到用户友好的标签
 * 参考：https://tailwindcss.com/docs/text-align
 */
export const tailwindTextAlignMap: Record<string, string> = {
  'text-left': 'left', // 左对齐
  'text-center': 'center', // 居中对齐
  'text-right': 'right', // 右对齐
  'text-justify': 'justify', // 两端对齐
};

/**
 * 文本对齐选项
 */
export const TEXT_ALIGN_OPTIONS = [
  {
    type: 'reset',
    label: '重置',
    icon: <ResetSvg />,
  },
  {
    type: 'left',
    label: '靠左',
    icon: <AlignLeftSvg />,
  },
  {
    type: 'center',
    label: '居中',
    icon: <AlignCenterSvg />,
  },
  {
    type: 'right',
    label: '靠右',
    icon: <AlignRightSvg />,
  },
  {
    type: 'justify',
    label: '两端对齐',
    icon: <AlignJustifySvg />,
  },
];

/**
 * 文本对齐类名正则表达式
 */
export const TEXT_ALIGN_REGEXP = /^text-(left|center|right|justify)$/;

/**
 * 将用户友好的标签转换为 Tailwind 文本对齐类名
 * @param label 用户友好的标签，如 'left', 'center', 'right', 'justify' 等
 * @returns Tailwind 类名，如 'text-left'，如果找不到则返回 null
 */
export const convertLabelToTextAlignClass = (label: string): string | null => {
  // 创建反向映射：从标签到类名
  const labelToClass: Record<string, string> = {};
  Object.entries(tailwindTextAlignMap).forEach(([className, labelValue]) => {
    labelToClass[labelValue] = className;
  });

  return labelToClass[label] || null;
};

/**
 * 生成 Tailwind CSS 文本对齐选项列表
 * 从 Tailwind CSS 中获取文本对齐选项
 * 返回格式：{ label: 'left', value: 'left' } 或 { label: 'Default', value: 'Default' }
 * label 用于下拉展示，value 直接作为文本对齐值使用
 */
export const generateTailwindTextAlignOptions = (): Array<{
  label: string;
  value: string;
}> => {
  const options: Array<{ label: string; value: string }> = [];

  // 首先添加默认选项（排在最前面）
  options.push({ label: 'Default', value: 'Default' });

  // 按照 Tailwind 文本对齐类名顺序生成选项
  // 顺序：left, center, right, justify
  const textAlignOrder = Object.keys(tailwindTextAlignMap);

  textAlignOrder.forEach((textAlignClass) => {
    const label = tailwindTextAlignMap[textAlignClass];
    if (label) {
      options.push({ label, value: label });
    }
  });

  return options;
};
