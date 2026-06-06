import type { ChangeFileInfo } from '@/components/FileTreeView/type';
import type { ChangeFileStatusMeta } from './changeFileStatus';

/** 变更列表项（含展示元数据） */
export interface ChangeListItem extends ChangeFileInfo {
  fileName: string;
  parentPath: string;
  statusMeta: ChangeFileStatusMeta;
}

/** 变更文件树节点 */
export interface ChangeTreeNode {
  id: string;
  name: string;
  type: 'folder' | 'file';
  depth: number;
  children?: ChangeTreeNode[];
  fileItem?: ChangeListItem;
}

const sortTreeNodes = (nodes: ChangeTreeNode[]) => {
  nodes.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
  nodes.forEach((node) => {
    if (node.children?.length) {
      sortTreeNodes(node.children);
    }
  });
};

/**
 * 将扁平变更列表构建为目录树（用于源代码管理树形视图）
 * @param items 变更文件列表
 */
export const buildChangeFileTree = (
  items: ChangeListItem[],
): ChangeTreeNode[] => {
  const root: ChangeTreeNode[] = [];

  items.forEach((item) => {
    const segments = item.fileId.split('/').filter(Boolean);
    let currentLevel = root;
    let pathSoFar = '';

    segments.forEach((segment, index) => {
      const isFile = index === segments.length - 1;
      pathSoFar = pathSoFar ? `${pathSoFar}/${segment}` : segment;

      let node = currentLevel.find(
        (existing) =>
          existing.name === segment &&
          existing.type === (isFile ? 'file' : 'folder'),
      );

      if (!node) {
        node = {
          id: pathSoFar,
          name: segment,
          type: isFile ? 'file' : 'folder',
          depth: index,
          children: isFile ? undefined : [],
          fileItem: isFile ? item : undefined,
        };
        currentLevel.push(node);
      }

      if (!isFile && node.children) {
        currentLevel = node.children;
      }
    });
  });

  sortTreeNodes(root);
  return root;
};

/**
 * 收集文件夹下（含子目录）的所有变更文件
 * @param items 当前区块的变更列表
 * @param folderId 文件夹路径 ID
 */
export const collectFilesUnderFolder = (
  items: ChangeListItem[],
  folderId: string,
): ChangeListItem[] => {
  const prefix = `${folderId}/`;
  return items.filter((item) => item.fileId.startsWith(prefix));
};
