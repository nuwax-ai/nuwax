import type { FileNode } from '@/types/interfaces/appDev';
import { findFileNode } from '@/utils/appDevUtils';

/**
 * 按 id、path 或 relativePath 查找文件夹。
 * 工作区文件夹 id 为 workspace:相对路径，父路径本身不带前缀。
 */
export const findFolderNode = (
  idOrPath: string,
  nodes: FileNode[],
): FileNode | null => {
  const byId = findFileNode(idOrPath, nodes);
  if (byId?.type === 'folder') {
    return byId;
  }

  const walk = (list: FileNode[]): FileNode | null => {
    for (const node of list) {
      if (
        node.type === 'folder' &&
        (node.path === idOrPath || node.relativePath === idOrPath)
      ) {
        return node;
      }
      if (node.children?.length) {
        const found = walk(node.children);
        if (found) {
          return found;
        }
      }
    }
    return null;
  };

  return walk(nodes);
};

/**
 * 计算工具栏新建文件/文件夹的目标父级节点。
 * - 选中文件夹：在该文件夹下创建
 * - 选中文件：在该文件所在目录（其父文件夹）下创建
 * - 未选中或找不到节点：在根目录创建
 */
export const resolveToolbarCreateParent = (
  files: FileNode[],
  selectedFolderId: string,
  selectedFileId: string,
): FileNode | null => {
  if (selectedFolderId) {
    const folderNode = findFolderNode(selectedFolderId, files);
    if (folderNode) {
      return folderNode;
    }
  }
  if (!selectedFileId) {
    return null;
  }
  const selectedNode = findFileNode(selectedFileId, files);
  if (!selectedNode) {
    return null;
  }
  if (selectedNode.type === 'folder') {
    return selectedNode;
  }
  return selectedNode.parentPath
    ? findFolderNode(selectedNode.parentPath, files)
    : null;
};
