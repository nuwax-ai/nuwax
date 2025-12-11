import type { FileNode } from '@/types/interfaces/appDev';

/**
 * 页面应用开发文件树组件属性接口
 */
export interface FileTreeProps {
  /** 文件树数据 */
  files: FileNode[];

  /** 当前选中的文件ID */
  selectedFileId: string;

  /** 正在重命名的节点 */
  renamingNode?: FileNode | null;

  /** 取消重命名回调 */
  onCancelRename: () => void;

  /** 右键菜单回调 */
  onContextMenu: (e: React.MouseEvent, node: FileNode) => void;

  /** 文件选择回调 */
  onFileSelect: (fileId: string) => void;

  /** 重命名文件回调 */
  onRenameFile: (node: FileNode, newName: string) => Promise<boolean>;

  /** 文件管理方法 */
  // fileManagement: {
  //   switchToFile: (fileId: string) => void;
  // };
}
