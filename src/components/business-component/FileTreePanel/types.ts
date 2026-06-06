import type { ChangeFileInfo } from '@/components/FileTreeView/type';
import type {
  ChangeListSection,
  SelectedChangeFile,
} from '@/components/business-component/FileTreePanel/SourceControl/changeFileStatus';
import type { ReactNode } from 'react';

/** 源代码管理绑定（Git 操作由外部 Hook 注入） */
export interface FileTreePanelSourceControlProps {
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
  /** 放弃单个文件的更改 */
  onDiscardChange?: (fileId: string) => void;
  /** 暂存更改 */
  onStageChange?: (fileId: string) => void;
  /** 取消暂存 */
  onUnstageChange?: (fileId: string) => void;
  /** 添加到 .gitignore */
  onAddToGitignore?: (fileId: string) => void;
}

/**
 * FileTreePanel 公共组件属性
 * 顶部切换文件树 / 源代码管理，统一样式与 Git 面板交互
 */
export interface FileTreePanelProps {
  className?: string;
  /** sidebar：AppDev 侧栏（可折叠）；embedded：ConversationAgent 嵌入面板 */
  layout?: 'sidebar' | 'embedded';
  /** 是否显示源代码管理 Tab（默认：存在 onCommit 时显示） */
  showSourceControl?: boolean;
  /** 侧栏模式是否支持折叠 */
  collapsible?: boolean;
  /** 文件树区域内容（各页面注入自己的文件树实现） */
  children: ReactNode;
  /** 源代码管理配置 */
  sourceControl: FileTreePanelSourceControlProps;
}
