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

  return ` \n\n<${blockName} ${attrs}></${blockName}>\n\n `; // fix: 添加空格，防止markdown解析时，出现文字丢失，例如：邮箱丢失了"邮"字
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
  const blockContent = getBlockWrapper(blockName, {
    executeId,
    type,
    status,
    name: name || '',
  });
  if (hasBlock) {
    // 修正：使用更健壮的正则表达式来匹配和替换整个块
    const blockRegex = new RegExp(
      `\\n\\n<${blockName}[^>]*?\\bexecuteId="${executeId}"[^>]*><\\/${blockName}>\\n\\n`,
      'gis',
    );
    return beforeText.replace(blockRegex, blockContent);
  } else {
    return `${beforeText}${blockContent}`;
  }
};

export { getBlockName, getBlockWrapper, getCustomBlock };
