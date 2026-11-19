import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { createContext } from 'react';

export type FileTreePanelTab = 'files' | 'sourceControl';
export type UpdateExpandedFolders = (current: Set<string>) => Set<string>;

/** 普通任务会话在详情归属确认后提供文件树偏好与草稿作用域。 */
export const TaskUiStateContext = createContext<{
  fileTree?: {
    tab: FileTreePanelTab;
    setTab: (tab: FileTreePanelTab) => void;
    expandedFolders: Set<string>;
    updateExpandedFolders: (update: UpdateExpandedFolders) => void;
  };
  askDraft?: {
    key: string;
    expired: boolean;
    history?: MessageInfo[];
  };
} | null>(null);
