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
    // 如果已经存在，检查状态是否发生了变化
    // 这里简单判断：如果当前生成的 blockContent 完整存在于 beforeText 中，则说明没有变化
    // 但因为 getBlockWrapper 会添加额外的换行符，所以我们只匹配核心标签部分
    const statusPattern = `status="${status}"`;
    const isStatusSame =
      beforeText.includes(executeIdPattern) &&
      beforeText.includes(statusPattern);

    if (isStatusSame) {
      return beforeText;
    }

    // 状态发生了变化，需要更新。
    // 使用正则找到旧的 <div><markdown-custom-process ... executeId="..." ...></markdown-custom-process></div> 部分并替换
    // 注意：这里的正则需要匹配 getBlockWrapper 生成的结构
    const escapeRegex = (str: string) =>
      str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const oldBlockRegex = new RegExp(
      `\\n*\\s*<div><${blockName}\\s+[^>]*?${escapeRegex(
        executeIdPattern,
      )}[^>]*?>(?:<\\/${blockName}>)?<\\/div>\\n*\\s*`,
      'g',
    );

    const newText = beforeText.replace(oldBlockRegex, blockContent);
    // 如果正则没匹配到（结构变了），则退化为直接返回
    return newText === beforeText ? beforeText : newText;
  }

  // 不存在则追加
  return `${beforeText}${blockContent}`;
};

export { getBlockName, getBlockWrapper, getCustomBlock };
