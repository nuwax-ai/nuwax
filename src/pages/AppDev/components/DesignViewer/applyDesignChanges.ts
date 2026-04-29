import { smartReplaceInSource } from '@/utils/appDevUtils';

/**
 * 应用设计更改到文件内容
 * @param fileContent 原始文件内容
 * @param changes 更改列表
 * @param filePath 文件路径（用于判断 React/Vue 框架类型）
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
  filePath?: string,
): Promise<string> => {
  let updatedContent = fileContent;

  // 1. 按位置从后往前排序，防止索引偏移
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
        type: change.type as any,
        tagName: change.sourceInfo.elementType,
        filePath,
      });
    } catch (error) {
      console.error('[DesignViewer] Apply change failed:', error, change);
    }
  }

  return updatedContent;
};
