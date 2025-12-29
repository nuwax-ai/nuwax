import { FileNode } from '@/types/interfaces/appDev';

export interface FilePathHeaderProps {
  /** 会话ID */
  conversationId: string;
  className?: string;
  // 是否显示文件树展开/折叠按钮
  showFileTreeToggleButton?: boolean;
  /** 文件节点 */
  targetNode: FileNode | null;
  /** 当前视图模式 */
  viewMode?: 'preview' | 'desktop';
  /** 视图模式切换回调 */
  onViewModeChange?: (mode: 'preview' | 'desktop') => void;
  // 是否显示视图模式切换按钮
  showViewModeButtons?: boolean;
  /** 重启服务器回调 */
  onRestartServer?: () => void;
  /** 重启智能体回调 */
  onRestartAgent?: () => void;
  /** 导入项目回调 */
  onImportProject?: () => void;
  /** 导出项目回调 */
  onExportProject?: () => void;
  /** 全屏回调 */
  onFullscreen?: () => void;
  /** 是否处于全屏状态 */
  isFullscreen?: boolean;
  /** 是否显示全屏图标 */
  showFullscreenIcon?: boolean;
  /** 保存回调 */
  onSaveFiles?: () => void;
  /** 取消保存回调 */
  onCancelSaveFiles?: () => void;
  /** 是否存在修改过的文件 */
  hasModifiedFiles?: boolean;
  /** 是否正在保存文件 */
  isSavingFiles?: boolean;
  /** 是否正在导出项目 */
  isExportingProjecting?: boolean;
  /** 是否正在下载文件 */
  isDownloadingFile?: boolean;
  /** 是否显示更多操作菜单 */
  showMoreActions?: boolean;
  /** 文件类型 */
  viewFileType?: 'preview' | 'code';
  /** 针对html、md文件，切换预览和代码视图 */
  onViewFileTypeChange?: (type: 'preview' | 'code') => void;
  /** 通过URL下载文件回调 */
  onDownloadFileByUrl?: (node: FileNode) => void;
  /** 分享回调 */
  onShare?: () => void;
  // 是否显示分享按钮
  isShowShare?: boolean;
  /** 导出为 PDF 回调（仅 Markdown 文件） */
  onExportPdf?: (node: FileNode) => void;
  /** 是否正在导出 PDF */
  isExportingPdf?: boolean;
  // 关闭整个面板
  onClose?: () => void;
  /** VNC 预览连接状态 */
  vncConnectStatus?: React.ReactNode;
  /** 文件树是否可见 */
  isFileTreeVisible?: boolean;
  /** 文件树是否固定（用户点击后固定） */
  isFileTreePinned?: boolean;
  /** 文件树展开/折叠回调 */
  onFileTreeToggle?: () => void;
  /** 文件树鼠标移入回调 */
  onFileTreeMouseEnter?: () => void;
}
