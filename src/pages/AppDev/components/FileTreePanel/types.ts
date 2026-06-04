import type { ChangeFileInfo } from '@/components/FileTreeView/type';
import type { FileNode } from '@/types/interfaces/appDev';

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

  /** 上传项目回调 */
  onUploadProject: () => void;

  /** 上传单个文件回调 */
  onUploadSingleFile: (node: FileNode | null) => void;

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

  /** 已修改文件列表（源代码管理） */
  changeFiles?: ChangeFileInfo[];
  /** 已暂存的文件 ID 集合 */
  stagedFileIds?: Set<string>;
  /** 当前选中查看 diff 的文件 ID */
  selectedDiffFileId?: string | null;
  /** 是否正在提交 */
  isCommitting?: boolean;
  /** 选中修改文件，在右侧预览区展示 diff */
  onDiffFileSelect?: (fileId: string) => void;
  /** 打开文件（选中并预览，非 diff） */
  onOpenChangeFile?: (fileId: string) => void;
  /** 放弃单个文件的更改 */
  onDiscardChange?: (fileId: string) => void;
  /** 暂存更改 */
  onStageChange?: (fileId: string) => void;
  /** 取消暂存 */
  onUnstageChange?: (fileId: string) => void;
  /** 添加到 .gitignore */
  onAddToGitignore?: (fileId: string) => void;
  /** 提交修改（保存并推送） */
  onCommit?: (message: string) => Promise<void>;
}
