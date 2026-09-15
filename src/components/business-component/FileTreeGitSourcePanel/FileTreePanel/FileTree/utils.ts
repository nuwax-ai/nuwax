import type { FileNode } from '@/types/interfaces/appDev';

/** 找出缓存恢复后仍展开、但当前会话尚未重新加载的目录。 */
export function collectUnloadedExpandedFolders(
  files: FileNode[],
  expandedFolderIds: Set<string>,
  loadedFolderIds: Set<string>,
): Array<{ id: string; path: string }> {
  const folders: Array<{ id: string; path: string }> = [];

  const visit = (nodes: FileNode[]) => {
    nodes.forEach((node) => {
      if (node.type !== 'folder' || !expandedFolderIds.has(node.id)) {
        return;
      }
      if (!loadedFolderIds.has(node.id)) {
        folders.push({
          id: node.id,
          path: node.relativePath || node.path || node.id,
        });
      }
      if (node.children?.length) {
        visit(node.children);
      }
    });
  };

  visit(files);
  return folders;
}
