import type { ChangeFileInfo } from '@/components/FileTreeView/type';
import type { FileNode } from '@/types/interfaces/appDev';
import type { ReactNode } from 'react';
import type { GitWorkspaceConfig } from '../utils/buildGitWorkspaceParams';
import type {
  ChangeListSection,
  SelectedChangeFile,
} from '../utils/changeFileStatus';

/** 源代码管理绑定（Git API 在 SourceControlPanel 内统一调用） */
export interface SourceControlProps {
  /** Git 工作空间（pageApp / taskAgent） */
  gitWorkspace?: GitWorkspaceConfig;
  /** 已修改文件列表（源代码管理） */
  changeFiles: ChangeFileInfo[];
  /** 当前选中的变更文件（含区块） */
  selectedChangeFile?: SelectedChangeFile | null;
  /** 是否正在提交 */
  isCommitting?: boolean;
  /** 是否正在刷新 Git 列表 */
  isRefreshingGitList?: boolean;
  /** 刷新 Git 变更列表 */
  onRefreshGitList?: () => void | Promise<void>;
  /** 提交修改（保存并推送） */
  onCommit?: (message: string) => Promise<void>;
  /** 选中修改文件，在右侧预览区展示 diff */
  onDiffFileSelect?: (fileId: string, section: ChangeListSection) => void;
  /** 打开文件（选中并预览，非 diff） */
  onOpenChangeFile?: (fileId: string) => void;
  /** Git discard 成功后的 UI 同步（还原编辑器、清理本地变更记录等） */
  onAfterDiscardChange?: (fileId: string) => void | Promise<void>;
  /** 添加到 .gitignore */
  onAddToGitignore?: (fileId: string) => void;
}

/**
 * FileTreeGitSourcePanel 公共组件属性
 * 顶部切换文件树 / 源代码管理，统一样式与 Git 面板交互
 */
export interface FileTreeGitSourcePanelProps {
  className?: string;
  /** 是否折叠 */
  isCollapsed?: boolean;
  /** 是否显示源代码管理 Tab（默认：存在 onCommit 时显示） */
  showSourceControl?: boolean;
  /** 文件树状态与交互处理器（内部渲染 FileTreeState */
  tree: FileTreeState;
  /** 文件树容器类名 */
  treeClassName?: string;
  /** 文件树头部（搜索区）类名 */
  treeHeaderClassName?: string;
  /** 文件列表为空（且非加载中）时的自定义空态内容 */
  treeEmptyState?: ReactNode;
  /** 源代码管理配置 */
  sourceControl: SourceControlProps;
}

/** 任务智能体文件树 UI 所需的状态与处理器 */
export interface FileTreeState {
  files: FileNode[];
  selectedFileId: string;
  renamingNode: FileNode | null;
  contextMenuTarget: FileNode | null;
  contextMenuPosition: { x: number; y: number };
  contextMenuVisible: boolean;
  isFileTreeVisible: boolean;
  fileTreeContainerRef: React.RefObject<HTMLDivElement>;
  fileTreeDataLoading?: boolean;
  taskAgentSelectedFileId?: string;
  isCanDeleteSkillFile: boolean;
  isRefreshingFileTree: boolean;
  isUploadingFiles: boolean;
  isDownloadingFile: boolean;
  hideFileTree: boolean;
  showRefreshButton: boolean;
  handleFileSelect: (fileId: string) => Promise<void>;
  handleContextMenu: (e: React.MouseEvent, node: FileNode | null) => void;
  closeContextMenu: () => void;
  handleRenameFile: (fileNode: FileNode, newName: string) => Promise<void>;
  handleCancelRename: (options?: {
    removeIfNew?: boolean;
    node?: FileNode | null;
  }) => void;
  handleRefreshFileList: () => Promise<void>;
  handleDelete: (node: FileNode) => Promise<void>;
  handleRenameFromMenu: (node: FileNode) => void;
  handleUploadFromMenu: (node: FileNode | null) => Promise<void>;
  handleCreateFile: (parentNode: FileNode | null) => void;
  handleCreateFolder: (parentNode: FileNode | null) => void;
  /** 通过 URL 下载文件（可选，AppDev 场景无此能力） */
  handleDownloadFileByUrl?: (
    node: FileNode,
    exportAsPdf?: boolean,
  ) => Promise<void>;
  /** 导入项目（空白区域右键菜单，可选） */
  handleImportProject?: () => void;
  /** 导入项目菜单项文案（不传时使用默认的「导入技能」文案） */
  importProjectLabel?: string;
  /** 导出项目 */
  handleExportProject?: () => Promise<void>;
  /** 是否正在导出项目 */
  isExportingProject?: boolean;
  /** 工具栏是否禁用（如对比模式、聊天加载中） */
  toolbarDisabled?: boolean;
}
