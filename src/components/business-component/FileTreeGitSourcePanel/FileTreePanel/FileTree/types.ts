import type { FileNode } from '@/types/interfaces/appDev';

/**
 * 页面应用开发文件树组件属性接口
 */
export interface FileTreeProps {
  /** 文件树数据 */
  files: FileNode[];

  /** 文件树数据加载状态 */
  fileTreeDataLoading?: boolean;

  /** 通用型智能体会话中点击选中的文件ID */
  taskAgentSelectedFileId?: string;

  /** 当前选中的文件ID */
  selectedFileId: string;

  /** 当前选中的文件夹 ID（仅用于树高亮） */
  selectedFolderId?: string;

  /** 正在重命名的节点 */
  renamingNode?: FileNode | null;

  /** 取消重命名回调
   *  当 removeIfNew 为 true 且 node.status === 'create' 时，父组件应删除该临时节点
   */
  onCancelRename: (options?: {
    removeIfNew?: boolean;
    node?: FileNode | null;
  }) => void;

  /** 右键菜单回调 */
  onContextMenu: (e: React.MouseEvent, node: FileNode | null) => void;

  /** 文件选择回调；selectFolder 为 true 时仅选中文件夹（不切换预览） */
  onFileSelect: (fileId: string, options?: { selectFolder?: boolean }) => void;

  /** 重命名文件回调 */
  onConfirmRenameFile: (node: FileNode, newName: string) => void;
}

/** FileTree 组件对外暴露的方法 */
export interface FileTreeRef {
  /** 折叠全部文件夹 */
  collapseAll: () => void;
}
