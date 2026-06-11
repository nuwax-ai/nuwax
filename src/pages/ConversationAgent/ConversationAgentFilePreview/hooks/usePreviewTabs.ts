import { dict } from '@/services/i18nRuntime';
import { arrayMove } from '@dnd-kit/sortable';
import { useCallback, useEffect, useRef, useState } from 'react';

/** 工具类标签 ID */
export type PreviewToolId =
  | 'preview'
  | 'arrange'
  | 'terminal'
  | 'version-control'
  | 'subscription-setting'
  | 'subscription-stats';

/** 预览标签类型 */
export type PreviewTabType = 'file' | 'tool' | 'picker';

/** 新建页签（工具选择面板）固定 ID */
export const PREVIEW_TAB_PICKER_ID = 'picker:new';

/** 预览标签数据 */
export interface PreviewTab {
  id: string;
  type: PreviewTabType;
  fileId?: string;
  isDiff?: boolean;
  toolId?: PreviewToolId;
  label: string;
  /** 是否固定在标签栏左侧 */
  pinned?: boolean;
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
  /** 打开「新建页签」选择面板时的回调 */
  onPickerTabActivate?: () => void;
}

/** 在右侧工作区展示的工具页签（非文件预览区） */
export const WORKSPACE_PREVIEW_TOOL_IDS: PreviewToolId[] = [
  'preview',
  'arrange',
  'version-control',
  'subscription-setting',
  'subscription-stats',
];

const TOOL_I18N_MAP: Record<PreviewToolId, string> = {
  preview: 'PC.Pages.ConversationAgentTabPicker.preview',
  arrange: 'PC.Pages.ConversationAgentTabPicker.arrange',
  terminal: 'PC.Pages.ConversationAgentTabPicker.terminal',
  'version-control': 'PC.Pages.ConversationAgentTabPicker.versionControl',
  'subscription-setting':
    'PC.Pages.ConversationAgentTabPicker.subscriptionSetting',
  'subscription-stats': 'PC.Pages.ConversationAgentTabPicker.subscriptionStats',
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

/** 构建默认「预览」工具页签 */
const buildPreviewTab = (): PreviewTab => ({
  id: getToolTabId('preview'),
  type: 'tool',
  toolId: 'preview',
  label: dict(TOOL_I18N_MAP.preview),
});

/**
 * 预览区标签页状态管理
 * 支持文件标签与工具标签的增删改查
 */
export function usePreviewTabs(options: UsePreviewTabsOptions = {}) {
  const { onFileTabActivate, onToolTabActivate, onPickerTabActivate } = options;
  const [tabs, setTabs] = useState<PreviewTab[]>(() => [buildPreviewTab()]);
  const [activeTabId, setActiveTabId] = useState<string | null>(() =>
    getToolTabId('preview'),
  );
  const onToolTabActivateRef = useRef(onToolTabActivate);
  onToolTabActivateRef.current = onToolTabActivate;

  /** 首次挂载：同步预览页签对应的编排面板状态 */
  useEffect(() => {
    onToolTabActivateRef.current?.('preview');
  }, []);

  /** 激活指定标签并触发对应回调 */
  const activateTab = useCallback(
    (tab: PreviewTab) => {
      setActiveTabId(tab.id);
      if (tab.type === 'file' && tab.fileId) {
        onFileTabActivate?.(tab.fileId, tab.isDiff);
      } else if (tab.type === 'tool' && tab.toolId) {
        onToolTabActivate?.(tab.toolId);
      } else if (tab.type === 'picker') {
        onPickerTabActivate?.();
      }
    },
    [onFileTabActivate, onToolTabActivate, onPickerTabActivate],
  );

  const sortTabsWithPinnedFirst = (list: PreviewTab[]): PreviewTab[] => {
    const pinned = list.filter((tab) => tab.pinned);
    const unpinned = list.filter((tab) => !tab.pinned);
    return [...pinned, ...unpinned];
  };

  /** 重置为仅保留默认「预览」页签 */
  const openDefaultPreviewTab = useCallback(() => {
    const previewTab = buildPreviewTab();
    setTabs([previewTab]);
    setActiveTabId(previewTab.id);
    onToolTabActivate?.('preview');
  }, [onToolTabActivate]);

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

  /** 打开或激活「新建页签」选择面板标签 */
  const openPickerTab = useCallback(() => {
    const label = dict('PC.Pages.ConversationAgentPreviewTabBar.addTab');

    setTabs((prev) => {
      const existing = prev.find((tab) => tab.id === PREVIEW_TAB_PICKER_ID);
      if (existing) {
        return prev;
      }
      return [
        ...prev,
        {
          id: PREVIEW_TAB_PICKER_ID,
          type: 'picker',
          label,
        },
      ];
    });

    setActiveTabId(PREVIEW_TAB_PICKER_ID);
    onPickerTabActivate?.();
  }, [onPickerTabActivate]);

  /** 打开或激活工具标签（terminal 由底部控制台承载，不创建页签） */
  const openToolTab = useCallback(
    (toolId: PreviewToolId) => {
      if (toolId === 'terminal') {
        return;
      }
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
        } else if (tab?.type === 'picker') {
          onPickerTabActivate?.();
        }
        return prev;
      });
    },
    [onFileTabActivate, onToolTabActivate, onPickerTabActivate],
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

        if (nextTabs.length === 0) {
          const previewTab = buildPreviewTab();
          setActiveTabId(previewTab.id);
          onToolTabActivate?.('preview');
          return [previewTab];
        }

        setActiveTabId((currentActiveId) => {
          if (currentActiveId !== tabId) {
            return currentActiveId;
          }
          const nextIndex = Math.min(index, nextTabs.length - 1);
          const nextTab = nextTabs[nextIndex];
          activateTab(nextTab);
          return nextTab.id;
        });

        return nextTabs;
      });
    },
    [activateTab, onToolTabActivate],
  );

  /** 关闭除指定标签外的所有标签 */
  const closeOtherTabs = useCallback(
    (tabId: string) => {
      setTabs((prev) => {
        const target = prev.find((tab) => tab.id === tabId);
        if (!target) {
          return prev;
        }
        activateTab(target);
        return [target];
      });
    },
    [activateTab],
  );

  /** 关闭所有标签后默认展示「预览」页签（编排面板） */
  const closeAllTabs = useCallback(() => {
    openDefaultPreviewTab();
  }, [openDefaultPreviewTab]);

  /** 切换标签固定状态（固定项排在最前） */
  const togglePinTab = useCallback((tabId: string) => {
    setTabs((prev) => {
      const next = prev.map((tab) =>
        tab.id === tabId ? { ...tab, pinned: !tab.pinned } : tab,
      );
      return sortTabsWithPinnedFirst(next);
    });
  }, []);

  /** 拖拽调整标签顺序（不改变固定状态，仅更新排列） */
  const reorderTabs = useCallback((activeId: string, overId: string) => {
    if (!activeId || !overId || activeId === overId) {
      return;
    }
    setTabs((prev) => {
      const oldIndex = prev.findIndex((tab) => tab.id === activeId);
      const newIndex = prev.findIndex((tab) => tab.id === overId);
      if (oldIndex === -1 || newIndex === -1) {
        return prev;
      }
      return arrayMove(prev, oldIndex, newIndex);
    });
  }, []);

  /** 清空所有标签 */
  const clearTabs = useCallback(() => {
    setTabs([]);
    setActiveTabId(null);
  }, []);

  /**
   * 删除文件/文件夹后关闭相关标签（含 diff 与普通预览）
   * @param deletedPath 被删除的文件或文件夹路径（fileId）
   * @param isFolder 是否为文件夹删除（会关闭该路径下所有文件标签）
   */
  const closeFileTabs = useCallback(
    (deletedPath: string, isFolder = false) => {
      const shouldCloseFileTab = (fileId: string) => {
        if (isFolder) {
          return fileId === deletedPath || fileId.startsWith(`${deletedPath}/`);
        }
        return fileId === deletedPath;
      };

      setTabs((prev) => {
        const removedIndices: number[] = [];
        prev.forEach((tab, index) => {
          if (
            tab.type === 'file' &&
            tab.fileId &&
            shouldCloseFileTab(tab.fileId)
          ) {
            removedIndices.push(index);
          }
        });

        if (removedIndices.length === 0) {
          return prev;
        }

        const removedIds = new Set(removedIndices.map((i) => prev[i].id));
        const nextTabs = prev.filter((tab) => !removedIds.has(tab.id));

        if (nextTabs.length === 0) {
          const previewTab = buildPreviewTab();
          setActiveTabId(previewTab.id);
          onToolTabActivate?.('preview');
          return [previewTab];
        }

        setActiveTabId((currentActiveId) => {
          if (!currentActiveId || !removedIds.has(currentActiveId)) {
            return currentActiveId;
          }
          const firstRemovedIndex = removedIndices[0];
          const nextIndex = Math.min(firstRemovedIndex, nextTabs.length - 1);
          const nextTab = nextTabs[nextIndex];
          activateTab(nextTab);
          return nextTab.id;
        });

        return nextTabs;
      });
    },
    [activateTab, onToolTabActivate],
  );

  /**
   * 文件重命名后同步更新已打开的文件标签（含 diff 标签）
   * @param oldFileId 重命名前的文件 ID
   * @param newFileId 重命名后的文件 ID
   */
  const renameFileTab = useCallback((oldFileId: string, newFileId: string) => {
    if (!oldFileId || !newFileId || oldFileId === newFileId) {
      return;
    }

    const newLabel = getFileNameFromPath(newFileId);
    const oldFileTabId = getFileTabId(oldFileId, false);
    const oldDiffTabId = getFileTabId(oldFileId, true);
    const newFileTabId = getFileTabId(newFileId, false);
    const newDiffTabId = getFileTabId(newFileId, true);

    setTabs((prev) => {
      let hasChange = false;
      const nextTabs = prev.map((tab) => {
        if (tab.type !== 'file' || tab.fileId !== oldFileId) {
          return tab;
        }
        hasChange = true;
        const isDiff = tab.isDiff ?? false;
        return {
          ...tab,
          id: getFileTabId(newFileId, isDiff),
          fileId: newFileId,
          label: newLabel,
        };
      });
      return hasChange ? nextTabs : prev;
    });

    setActiveTabId((currentActiveId) => {
      if (currentActiveId === oldFileTabId) {
        return newFileTabId;
      }
      if (currentActiveId === oldDiffTabId) {
        return newDiffTabId;
      }
      return currentActiveId;
    });
  }, []);

  const activeTab = tabs.find((tab) => tab.id === activeTabId) || null;

  return {
    tabs,
    activeTabId,
    activeTab,
    openFileTab,
    openPickerTab,
    openToolTab,
    selectTab,
    closeTab,
    closeOtherTabs,
    closeAllTabs,
    togglePinTab,
    reorderTabs,
    clearTabs,
    closeFileTabs,
    renameFileTab,
  };
}

export type UsePreviewTabsReturn = ReturnType<typeof usePreviewTabs>;
