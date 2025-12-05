import { smartReplaceInSource } from '@/utils/appDevUtils';

/**
 * 应用设计更改到文件内容
 * @param fileContent 原始文件内容
 * @param changes 更改列表
 * @returns 更新后的文件内容
 */
export const applyDesignChanges = async (
  fileContent: string,
  changes: Array<{
    type: 'style' | 'content';
    sourceInfo: any;
    newValue: string;
    originalValue?: string;
  }>,
): Promise<string> => {
  let updatedContent = fileContent;

  // 1. 按位置从后往前排序，防止索引偏移
  // 注意：smartReplaceInSource 是基于行号操作的，如果多行修改可能会有冲突
  // 但目前 smartReplaceInSource 每次都重新 split lines，所以只要顺序对，应该没问题
  // 为了安全起见，还是倒序处理
  const sortedChanges = [...changes].sort((a, b) => {
    if (a.sourceInfo.lineNumber !== b.sourceInfo.lineNumber) {
      return b.sourceInfo.lineNumber - a.sourceInfo.lineNumber;
    }
    return b.sourceInfo.columnNumber - a.sourceInfo.columnNumber;
  });

  // 2. 应用每个修改
  for (const change of sortedChanges) {
    try {
      updatedContent = await smartReplaceInSource(updatedContent, {
        lineNumber: change.sourceInfo.lineNumber,
        columnNumber: change.sourceInfo.columnNumber,
        newValue: change.newValue,
        originalValue: change.originalValue,
        type: change.type as any, // smartReplaceInSource 支持 'style' | 'content' | 'attribute'
        tagName: change.sourceInfo.elementType, // Pass tagName for fuzzy matching fallback
      });
    } catch (error) {
      console.error('[DesignViewer] Apply change failed:', error, change);
      // 继续处理其他修改，或者抛出错误？
      // 目前选择忽略错误，避免整个保存失败
    }
  }

  return updatedContent;
};
