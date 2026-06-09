import type { FileTreePanelSourceControlProps } from '@/components/business-component/FileTreePanel';
import type { FileNode } from '@/types/interfaces/appDev';

/**
 * AppDevFileTreePanel 组件属性接口
 */
export interface AppDevFileTreePanelProps {
  /** 文件树数据 */
  files: FileNode[];

  /** 是否处于版本对比模式 */
  isComparing: boolean;

  /** 当前选中的文件ID */
  selectedFileId: string;

  /** 已展开的文件夹ID集合 */
  expandedFolders: Set<string>;

  /** 文件选择回调 */
  onFileSelect: (fileId: string) => void;

  /** 文件夹展开/折叠回调 */
  onToggleFolder: (folderId: string) => void;

  /** 删除文件回调 */
  onDeleteFile: (node: FileNode, event: React.MouseEvent) => void;

  /** 重命名文件回调 */
  onRenameFile?: (node: FileNode, newName: string) => Promise<boolean>;

  /** 上传项目回调 */
  onUploadProject: () => void;

  /** 上传单个文件回调 */
  onUploadSingleFile: (node: FileNode | null) => void;

  /** 导出项目回调 */
  onExportProject?: () => void | Promise<void>;

  /** 新建文件回调 */
  onCreateFile?: () => void;

  /** 新建文件夹回调 */
  onCreateFolder?: () => void;

  /** 折叠全部文件夹回调 */
  onCollapseAll?: () => void;

  /** 工作空间信息（用于版本模式判断） */
  workspace?: { activeFile: string };

  /** 文件管理方法 */
  fileManagement: {
    switchToFile: (fileId: string) => void;
    insertTempNodeForCreate?: (
      parentNode: FileNode | null,
      type: 'file' | 'folder',
    ) => FileNode;
    removeTempNode?: (nodeId: string) => void;
  };
  /** 是否正在AI聊天加载中 */
  isChatLoading?: boolean;

  /** 文件树初始化 loading 状态 */
  isFileTreeInitializing?: boolean;

  /** 源代码管理相关（Git 操作由 useSourceControl Hook 注入） */
  sourceControl: FileTreePanelSourceControlProps;
}
