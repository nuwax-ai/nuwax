import type { FileNode } from '@/types/interfaces/appDev';
import { isMarkdownFile } from '@/utils/common';

/**
 * 是否展示「预览 / 代码」切换（与 FileTreeView/FilePathHeader 一致）
 */
export const canShowPreviewCodeToggle = (
  targetNode: FileNode | null,
  fileName?: string,
): boolean => {
  if (!fileName) {
    return false;
  }
  const hasSource =
    !!targetNode?.fileProxyUrl ||
    (targetNode?.content !== undefined && targetNode?.content !== null);
  if (!hasSource) {
    return false;
  }
  return fileName.includes('.htm') || isMarkdownFile(fileName);
};
