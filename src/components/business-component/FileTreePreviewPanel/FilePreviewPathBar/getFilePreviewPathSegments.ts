import type { FileNode } from '@/types/interfaces/appDev';

/**
 * 从文件节点取出相对路径分段。
 * 优先 relativePath（会话工作区），否则用 path / fullPath。
 */
export function getFilePreviewPathSegments(
  fileNode?: FileNode | null,
): string[] {
  if (!fileNode || fileNode.type === 'folder') {
    return [];
  }
  const raw = (
    fileNode.relativePath ||
    fileNode.path ||
    fileNode.fullPath ||
    fileNode.name ||
    ''
  )
    .replace(/^\/+/, '')
    .replace(/^workspace:/, '');
  const segments = raw.split('/').filter(Boolean);
  if (segments.length > 0) {
    return segments;
  }
  return fileNode.name ? [fileNode.name] : [];
}
