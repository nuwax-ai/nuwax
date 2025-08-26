import { ProcessingInfo } from '@/types/interfaces/conversationInfo';

/**
 * 生成 markdown 块
 */
const getBlockWrapper = (
  blockName: string,
  data: Record<string, any>,
): string => {
  const attrs = Object.entries(data)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');

  // 修复DOM嵌套验证错误：使用div代替p标签，因为自定义组件包含块级元素
  return `\n\n<div><${blockName} ${attrs}></${blockName}></div>\n\n`;
};

const getBlockName = (): string => {
  return `markdown-custom-process`;
};

const getCustomBlock = (
  beforeText: string,
  { type, name, executeId, status }: ProcessingInfo,
): string => {
  // 如果 type 或 id 不存在，则返回空字符串
  if (!type || !executeId) {
    return '';
  }
  const blockName = getBlockName();
  const hasBlock = beforeText.includes(`executeId="${executeId}"`);
  if (hasBlock) {
    // 如果已经存在，则不重复添加
    return beforeText;
  }
  const blockContent = getBlockWrapper(blockName, {
    executeId,
    type,
    status,
    name: name || '',
  });
  return `${beforeText}${blockContent}`;
};

export { getBlockName, getBlockWrapper, getCustomBlock };
