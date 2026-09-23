import type { ChangeFileInfo } from '@/components/business-component/FileTreePreviewPanel/types/file-tree';
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
  /** 每一层用 Map 定位子节点，避免在同级上千个节点上线性查找 */
  const levelIndexes = new Map<string, Map<string, ChangeTreeNode>>();
  levelIndexes.set('', new Map());

  items.forEach((item) => {
    const segments = item.fileId.split('/').filter(Boolean);
    let currentLevel = root;
    let parentPath = '';

    segments.forEach((segment, index) => {
      const isFile = index === segments.length - 1;
      const pathSoFar = parentPath ? `${parentPath}/${segment}` : segment;
      const levelIndex = levelIndexes.get(parentPath) ?? new Map();
      if (!levelIndexes.has(parentPath)) {
        levelIndexes.set(parentPath, levelIndex);
      }
      const nodeKey = `${isFile ? 'file' : 'folder'}:${segment}`;
      let node = levelIndex.get(nodeKey);

      if (!node) {
        node = {
          id: pathSoFar,
          name: segment,
          type: isFile ? 'file' : 'folder',
          depth: index,
          children: isFile ? undefined : [],
          fileItem: isFile ? item : undefined,
        };
        levelIndex.set(nodeKey, node);
        currentLevel.push(node);
        if (!isFile) {
          levelIndexes.set(pathSoFar, new Map());
        }
      }

      if (!isFile && node.children) {
        currentLevel = node.children;
        parentPath = pathSoFar;
      }
    });
  });

  sortTreeNodes(root);
  return root;
};

/** 树形视图摊平后的一行（仅包含当前展开状态下可见的节点） */
export interface FlatChangeTreeRow {
  key: string;
  type: 'folder' | 'file';
  level: number;
  folderId?: string;
  folderName?: string;
  fileItem?: ChangeListItem;
}

/**
 * 按展开状态把变更树摊成行列表，供虚拟滚动只挂载可见行
 * @param nodes 变更树根节点
 * @param expandedFolderIds 已展开的文件夹 id
 */
export const flattenVisibleChangeTree = (
  nodes: ChangeTreeNode[],
  expandedFolderIds: Set<string>,
): FlatChangeTreeRow[] => {
  const rows: FlatChangeTreeRow[] = [];

  const walk = (list: ChangeTreeNode[], level: number) => {
    list.forEach((node) => {
      if (node.type === 'file' && node.fileItem) {
        rows.push({
          key: `file:${node.fileItem.fileId}`,
          type: 'file',
          level,
          fileItem: node.fileItem,
        });
        return;
      }

      rows.push({
        key: `folder:${node.id}`,
        type: 'folder',
        level,
        folderId: node.id,
        folderName: node.name,
      });

      if (node.children?.length && expandedFolderIds.has(node.id)) {
        walk(node.children, level + 1);
      }
    });
  };

  walk(nodes, 0);
  return rows;
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
