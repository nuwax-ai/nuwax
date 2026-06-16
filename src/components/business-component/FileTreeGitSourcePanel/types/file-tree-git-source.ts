import type { ChangeFileInfo } from '@/components/business-component/FileTreePreviewPanel/types/file-tree';
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
  /** 文件树状态与交互处理器（内部渲染 FileTreeContainerProps */
  tree: FileTreeContainerProps;
  /** 文件树容器类名 */
  treeClassName?: string;
  /** 文件树头部（搜索区）类名 */
  treeHeaderClassName?: string;
  /** 文件列表为空（且非加载中）时的自定义空态内容 */
  treeEmptyState?: ReactNode;
  /** 源代码管理配置 */
  sourceControl: SourceControlProps;
}

/** 通用智能体文件树 UI 所需的状态与处理器 */
export interface FileTreeContainerProps {
  /** 文件树节点列表（树形结构） */
  files: FileNode[];
  /** 当前选中的文件 ID */
  selectedFileId: string;
  /** 当前选中的文件夹 ID（仅用于树高亮与工具栏新建父级） */
  selectedFolderId?: string;
  /** 正在内联重命名的节点（null 表示无重命名进行中） */
  renamingNode: FileNode | null;
  /** 右键菜单当前目标节点 */
  contextMenuTarget: FileNode | null;
  /** 右键菜单显示坐标（相对视口） */
  contextMenuPosition: { x: number; y: number };
  /** 右键菜单是否可见 */
  contextMenuVisible: boolean;
  /** 文件树面板是否可见 */
  isFileTreeVisible: boolean;
  /** 文件树容器 DOM 引用（滚动、定位等） */
  fileTreeContainerRef: React.RefObject<HTMLDivElement>;
  /** 文件树数据是否加载中 */
  fileTreeDataLoading?: boolean;
  /** TaskAgent 自动选中的文件 ID（外部驱动选中） */
  taskAgentSelectedFileId?: string;
  /** 是否允许删除技能文件（如 SKILL.md） */
  isCanDeleteSkillFile: boolean;
  /** 是否正在刷新文件树列表 */
  isRefreshingFileTree: boolean;
  /** 是否正在上传文件 */
  isUploadingFiles: boolean;
  /** 是否正在下载文件 */
  isDownloadingFile: boolean;
  /** 是否隐藏文件树（仅保留源代码管理等场景） */
  hideFileTree: boolean;
  /** 是否显示文件树刷新按钮 */
  showRefreshButton: boolean;
  /** 选中文件并在右侧预览区打开；selectFolder 为 true 时仅选中文件夹 */
  handleFileSelect: (
    fileId: string,
    options?: { selectFolder?: boolean },
  ) => Promise<void>;
  /** 打开右键菜单 */
  handleContextMenu: (e: React.MouseEvent, node: FileNode | null) => void;
  /** 关闭右键菜单 */
  closeContextMenu: () => void;
  /** 确认重命名文件或文件夹 */
  handleRenameFile: (fileNode: FileNode, newName: string) => Promise<void>;
  /** 取消重命名；新建节点时可选择移除临时节点 */
  handleCancelRename: (options?: {
    removeIfNew?: boolean;
    node?: FileNode | null;
  }) => void;
  /** 从服务端重新拉取并刷新文件树 */
  handleRefreshFileList: () => Promise<void>;
  /** 删除文件或文件夹 */
  handleDelete: (node: FileNode) => Promise<void>;
  /** 从右键菜单进入重命名状态 */
  handleRenameFromMenu: (node: FileNode) => void;
  /** 从右键菜单上传文件到指定目录 */
  handleUploadMultipleFiles: (node: FileNode | null) => Promise<void>;
  /** 在指定父节点下新建文件 */
  handleCreateFile: (parentNode: FileNode | null) => void;
  /** 在指定父节点下新建文件夹 */
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
  /** 是否正在导入项目 */
  isImportingProject?: boolean;
  /** 工具栏是否禁用（如对比模式、聊天加载中） */
  toolbarDisabled?: boolean;
}
