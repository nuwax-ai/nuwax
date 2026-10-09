import type { FileNode } from '@/types/interfaces/appDev';

/**
 * 新建文件名确认时去掉中文输入法留下的空格和 ' 音节分隔。
 * 例如 `f'sa'fg`、`1.m d` 会变成 `fsafg`、`1.md`。
 */
export function stripImeFilenameSeparators(name: string): string {
  return name.replace(/[\s'\u2018\u2019\uFF07]+/g, '');
}

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
