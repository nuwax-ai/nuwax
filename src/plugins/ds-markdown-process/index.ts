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
    return beforeText;
  }
  const blockName = getBlockName();
  const blockContent = getBlockWrapper(blockName, {
    executeId,
    type,
    status,
    name: name ? encodeURIComponent(name) : '',
  });

  // 检查是否已经存在该执行 ID 的块
  const executeIdPattern = `executeId="${executeId}"`;
  const hasBlock = beforeText.includes(executeIdPattern);

  if (hasBlock) {
    // 只更新本工具的标签，不能用其他工具的状态判断本次更新是否重复。
    const escapeRegex = (str: string) =>
      str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const oldBlockRegex = new RegExp(
      `<div><${blockName}\\s+[^>]*?${escapeRegex(
        executeIdPattern,
      )}[^>]*?>(?:<\\/${blockName}>)?<\\/div>`,
      'g',
    );

    const newText = beforeText.replace(oldBlockRegex, () =>
      blockContent.trim(),
    );
    return newText;
  }

  // 不存在则追加
  return `${beforeText}${blockContent}`;
};

export { getBlockName, getBlockWrapper, getCustomBlock };
