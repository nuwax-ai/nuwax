import type { FileNode } from '@/types/interfaces/appDev';
import type { DataResource } from '@/types/interfaces/dataResource';

/**
 * FileTreePanel 组件属性接口
 */
export interface FileTreePanelProps {
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
  onDeleteFile: (node: any, event: React.MouseEvent) => void;

  /** 重命名文件回调 */
  onRenameFile?: (node: any, newName: string) => Promise<boolean>;

  /** 上传文件到指定路径回调 */
  onUploadToFolder?: (targetPath: string, file: File) => Promise<boolean>;

  /** 上传项目回调 */
  onUploadProject: () => void;

  /** 上传单个文件回调 */
  onUploadSingleFile: (node: FileNode | null) => void;

  /** 选中的数据源列表 */
  selectedDataResources?: DataResource[];

  /** 数据源选择变化回调 */
  onDataResourceSelectionChange?: (
    selectedDataResources: DataResource[],
  ) => void;

  /** 工作空间信息（用于版本模式判断） */
  workspace?: { activeFile: string };

  /** 文件管理方法 */
  fileManagement: {
    switchToFile: (fileId: string) => void;
  };
  /** 是否正在AI聊天加载中 */
  isChatLoading?: boolean;

  /** 文件树初始化 loading 状态 */
  isFileTreeInitializing?: boolean;
}
