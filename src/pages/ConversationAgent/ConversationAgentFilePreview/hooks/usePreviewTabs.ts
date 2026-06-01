import { dict } from '@/services/i18nRuntime';
import { useCallback, useState } from 'react';

/** 工具类标签 ID */
export type PreviewToolId =
  | 'preview'
  | 'editor'
  | 'terminal'
  | 'version-control'
  | 'integration-mgmt'
  | 'env-vars'
  | 'database'
  | 'auth'
  | 'object-storage';

/** 预览标签类型 */
export type PreviewTabType = 'file' | 'tool';

/** 预览标签数据 */
export interface PreviewTab {
  id: string;
  type: PreviewTabType;
  fileId?: string;
  isDiff?: boolean;
  toolId?: PreviewToolId;
  label: string;
}

export interface OpenFileTabOptions {
  /** 为 true 时仅更新标签状态，不触发 onFileTabActivate（避免与文件选择回调循环） */
  skipActivate?: boolean;
}

export interface UsePreviewTabsOptions {
  /** 激活文件标签时的回调 */
  onFileTabActivate?: (
    fileId: string,
    isDiff?: boolean,
  ) => void | Promise<void>;
  /** 激活工具标签时的回调 */
  onToolTabActivate?: (toolId: PreviewToolId) => void;
  /** 所有标签关闭时的回调 */
  onAllTabsClosed?: () => void;
}

const TOOL_I18N_MAP: Record<PreviewToolId, string> = {
  preview: 'PC.Pages.ConversationAgentTabPicker.preview',
  editor: 'PC.Pages.ConversationAgentTabPicker.editor',
  terminal: 'PC.Pages.ConversationAgentTabPicker.terminal',
  'version-control': 'PC.Pages.ConversationAgentTabPicker.versionControl',
  'integration-mgmt': 'PC.Pages.ConversationAgentTabPicker.integrationMgmt',
  'env-vars': 'PC.Pages.ConversationAgentTabPicker.envVars',
  database: 'PC.Pages.ConversationAgentTabPicker.database',
  auth: 'PC.Pages.ConversationAgentTabPicker.auth',
  'object-storage': 'PC.Pages.ConversationAgentTabPicker.objectStorage',
};

/** 从文件路径提取文件名 */
export const getFileNameFromPath = (fileId: string): string => {
  const segments = fileId.split('/');
  return segments[segments.length - 1] || fileId;
};

/** 生成文件标签 ID */
export const getFileTabId = (fileId: string, isDiff = false): string =>
  isDiff ? `diff:${fileId}` : `file:${fileId}`;

/** 生成工具标签 ID */
export const getToolTabId = (toolId: PreviewToolId): string => `tool:${toolId}`;

/**
 * 预览区标签页状态管理
 * 支持文件标签与工具标签的增删改查
 */
export function usePreviewTabs(options: UsePreviewTabsOptions = {}) {
  const { onFileTabActivate, onToolTabActivate, onAllTabsClosed } = options;
  const [tabs, setTabs] = useState<PreviewTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  /** 打开或激活文件标签 */
  const openFileTab = useCallback(
    (fileId: string, isDiff = false, options?: OpenFileTabOptions) => {
      const tabId = getFileTabId(fileId, isDiff);
      const label = getFileNameFromPath(fileId);

      setTabs((prev) => {
        const existing = prev.find((tab) => tab.id === tabId);
        if (existing) {
          return prev;
        }
        return [
          ...prev,
          {
            id: tabId,
            type: 'file',
            fileId,
            isDiff,
            label,
          },
        ];
      });

      setActiveTabId(tabId);
      if (!options?.skipActivate) {
        onFileTabActivate?.(fileId, isDiff);
      }
    },
    [onFileTabActivate],
  );

  /** 打开或激活工具标签 */
  const openToolTab = useCallback(
    (toolId: PreviewToolId) => {
      const tabId = getToolTabId(toolId);
      const label = dict(TOOL_I18N_MAP[toolId]);

      setTabs((prev) => {
        const existing = prev.find((tab) => tab.id === tabId);
        if (existing) {
          return prev;
        }
        return [
          ...prev,
          {
            id: tabId,
            type: 'tool',
            toolId,
            label,
          },
        ];
      });

      setActiveTabId(tabId);
      onToolTabActivate?.(toolId);
    },
    [onToolTabActivate],
  );

  /** 切换标签 */
  const selectTab = useCallback(
    (tabId: string) => {
      setActiveTabId(tabId);
      setTabs((prev) => {
        const tab = prev.find((item) => item.id === tabId);
        if (tab?.type === 'file' && tab.fileId) {
          onFileTabActivate?.(tab.fileId, tab.isDiff);
        } else if (tab?.type === 'tool' && tab.toolId) {
          onToolTabActivate?.(tab.toolId);
        }
        return prev;
      });
    },
    [onFileTabActivate, onToolTabActivate],
  );

  /** 关闭标签 */
  const closeTab = useCallback(
    (tabId: string) => {
      setTabs((prev) => {
        const index = prev.findIndex((tab) => tab.id === tabId);
        if (index === -1) {
          return prev;
        }

        const nextTabs = prev.filter((tab) => tab.id !== tabId);

        setActiveTabId((currentActiveId) => {
          if (currentActiveId !== tabId) {
            return currentActiveId;
          }
          if (nextTabs.length === 0) {
            onAllTabsClosed?.();
            return null;
          }
          const nextIndex = Math.min(index, nextTabs.length - 1);
          const nextTab = nextTabs[nextIndex];
          if (nextTab.type === 'file' && nextTab.fileId) {
            onFileTabActivate?.(nextTab.fileId, nextTab.isDiff);
          } else if (nextTab.type === 'tool' && nextTab.toolId) {
            onToolTabActivate?.(nextTab.toolId);
          }
          return nextTab.id;
        });

        return nextTabs;
      });
    },
    [onAllTabsClosed, onFileTabActivate, onToolTabActivate],
  );

  /** 清空所有标签 */
  const clearTabs = useCallback(() => {
    setTabs([]);
    setActiveTabId(null);
  }, []);

  const activeTab = tabs.find((tab) => tab.id === activeTabId) || null;

  return {
    tabs,
    activeTabId,
    activeTab,
    openFileTab,
    openToolTab,
    selectTab,
    closeTab,
    clearTabs,
  };
}

export type UsePreviewTabsReturn = ReturnType<typeof usePreviewTabs>;
