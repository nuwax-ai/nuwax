/**
 * @deprecated 请使用 @/components/business-component/FileTreePreviewPanel
 */
export {
  default,
  type FileTreePreviewPanelProps as ChatFileTreeSidebarProps,
  type FileTreePreviewGitVersionControlProps as ChatGitVersionControlProps,
} from '@/components/business-component/FileTreePreviewPanel';

export { useFileTreePreviewPanel as useChatFilePreviewPanel } from '@/components/business-component/FileTreePreviewPanel/hooks/useFileTreePreviewPanel';
export type { UseFileTreePreviewPanelParams as UseChatFilePreviewPanelParams } from '@/components/business-component/FileTreePreviewPanel/types';
