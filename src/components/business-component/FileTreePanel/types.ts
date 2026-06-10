import type { GitWorkspaceConfig } from '@/components/business-component/FileTreePanel/hooks/buildGitWorkspaceParams';
import type {
  ChangeListSection,
  SelectedChangeFile,
} from '@/components/business-component/FileTreePanel/SourceControl/changeFileStatus';
import type { TaskAgentFileViewTree } from '@/components/business-component/FileTreePanel/types/taskAgentFileTree';
import type { ChangeFileInfo } from '@/components/FileTreeView/type';
import type { ReactNode } from 'react';

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
  /** sidebar：AppDev 侧栏（可折叠）；embedded：ConversationAgent 嵌入面板 */
  layout?: 'sidebar' | 'embedded';
  /** 是否显示源代码管理 Tab（默认：存在 onCommit 时显示） */
  showSourceControl?: boolean;
  /** 侧栏模式是否支持折叠 */
  collapsible?: boolean;
  /** 文件树状态与交互处理器（内部渲染 TaskAgentFileTree） */
  tree: TaskAgentFileViewTree;
  /** 文件树容器类名 */
  treeClassName?: string;
  /** 文件树头部（搜索区）类名 */
  treeHeaderClassName?: string;
  /** 文件列表为空（且非加载中）时的自定义空态内容 */
  treeEmptyState?: ReactNode;
  /** 源代码管理配置 */
  sourceControl: SourceControlProps;
}
