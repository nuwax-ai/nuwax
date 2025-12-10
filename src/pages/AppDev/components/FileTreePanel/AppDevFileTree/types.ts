import type { FileNode } from '@/types/interfaces/appDev';

/**
 * 页面应用开发文件树组件属性接口
 */
export interface AppDevFileTreeProps {
  /** 文件树数据 */
  files: FileNode[];

  /** 是否处于版本对比模式 */
  isComparing: boolean;

  /** 当前选中的文件ID */
  selectedFileId: string;

  /** 已展开的文件夹ID集合 */
  expandedFolders: Set<string>;

  /** 正在重命名的节点 */
  renamingNode?: FileNode | null;

  /** 取消重命名回调 */
  onCancelRename: () => void;

  /** 右键菜单回调 */
  onContextMenu: (e: React.MouseEvent, node: FileNode) => void;

  /** 文件选择回调 */
  onFileSelect: (fileId: string) => void;

  /** 文件夹展开/折叠回调 */
  onToggleFolder: (folderId: string) => void;

  /** 重命名文件回调 */
  onRenameFile?: (node: FileNode, newName: string) => Promise<boolean>;

  /** 工作空间信息（用于版本模式判断） */
  workspace?: { activeFile: string };

  /** 文件管理方法 */
  fileManagement: {
    switchToFile: (fileId: string) => void;
  };
  /** 是否正在AI聊天加载中 */
  isChatLoading?: boolean;
}
