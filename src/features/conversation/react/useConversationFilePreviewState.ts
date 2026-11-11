import type {
  ConversationFilePreviewState,
  FilePreviewReadingPosition,
} from '@/types/interfaces/fileTree';
import { useCallback, useMemo, useState } from 'react';
import { conversationPageCacheManager } from '../runtime/conversationPageCacheManager';

/** 会话级元数据与预览实例分开，缓存淘汰不丢失用户阅读意图。 */
export function useConversationFilePreviewState(key: string) {
  const initial = useMemo(
    () => conversationPageCacheManager.getFilePreviewState(key),
    [key],
  );
  const [treePreference, setTreePreference] = useState({
    key,
    visible: initial.treeVisible ?? false,
  });
  const remember = useCallback(
    (patch: Partial<ConversationFilePreviewState>) => {
      conversationPageCacheManager.updateFilePreviewState(key, patch);
    },
    [key],
  );
  const onTreeVisibleChange = useCallback(
    (visible: boolean) => {
      setTreePreference({ key, visible });
      remember({ treeVisible: visible });
    },
    [key, remember],
  );
  const onSelectedFileChange = useCallback(
    (fileId: string) => {
      // 目录重载/授权换代时的短暂空态不能擦掉待恢复的目标。
      if (fileId) remember({ selectedFileId: fileId });
    },
    [remember],
  );
  const getReadingPosition = useCallback(
    (fileId: string, mode: string) =>
      conversationPageCacheManager.getFilePreviewState(key).readingPositions?.[
        `${fileId}:${mode}`
      ],
    [key],
  );
  const onReadingPositionChange = useCallback(
    (fileId: string, mode: string, position: FilePreviewReadingPosition) => {
      const previous =
        conversationPageCacheManager.getFilePreviewState(key)
          .readingPositions ?? {};
      const readingKey = `${fileId}:${mode}`;
      // 限制单会话的历史文件位置数量，避免长会话无限增长。
      const entries = Object.entries(previous)
        .filter(([entryKey]) => entryKey !== readingKey)
        .slice(-19);
      remember({
        readingPositions: Object.fromEntries([
          ...entries,
          [readingKey, position],
        ]),
      });
    },
    [key, remember],
  );
  return {
    initial,
    remember,
    treeVisible:
      treePreference.key === key
        ? treePreference.visible
        : initial.treeVisible ?? false,
    onTreeVisibleChange,
    onSelectedFileChange,
    getReadingPosition,
    onReadingPositionChange,
  };
}
