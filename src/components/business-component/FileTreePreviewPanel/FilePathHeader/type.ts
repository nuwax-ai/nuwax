import { ConnectionStatus } from '@/components/business-component/VncPreview/type';
import { FileNode } from '@/types/interfaces/appDev';

/** Chat 页文件预览 Header 组件 Props（不含保存/取消） */
export interface FilePathHeaderProps {
  /** 会话ID */
  conversationId: string;
  className?: string;
  /** 文件节点 */
  targetNode: FileNode | null;
  /** 当前视图模式 */
  viewMode?: 'preview' | 'desktop';
  /** 用户选择的智能体电脑名称 */
  agentSandboxName?: string;
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
  /** 是否显示分享按钮 */
  isShowShare?: boolean;
  /** 是否显示下载按钮 */
  isShowDownloadButton?: boolean;
  /** 是否显示导出 PDF 按钮 */
  isShowExportPdfButton?: boolean;
  /** 导出为 PDF 回调（仅 Markdown 文件） */
  onExportPdf?: (node: FileNode) => void;
  /** 是否正在导出 PDF */
  isExportingPdf?: boolean;
  /** 关闭整个面板 */
  onClose?: () => void;
  /** VNC 预览连接状态 */
  vncConnectStatus?: ConnectionStatus | null;
  /** 文件树是否可见 */
  isFileTreeVisible?: boolean;
  /** 文件树是否固定（用户点击后固定） */
  isFileTreePinned?: boolean;
  /** 文件树展开/折叠回调 */
  onFileTreeToggle?: () => void;
  /** 是否是云电脑 */
  isCloudComputer?: boolean;
  /** 是否显示 Git 版本记录按钮 */
  showGitVersionButton?: boolean;
  /** Git 版本记录面板是否已打开 */
  isGitVersionPanelOpen?: boolean;
  /** 切换 Git 版本记录面板 */
  onToggleGitVersionPanel?: () => void;
}
