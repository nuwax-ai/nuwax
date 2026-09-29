import type { FileMentionItem } from '@/components/ChatInputHome/MentionPopup/types';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { apiGetStaticFileList, apiSearchFiles } from '@/services/vncDesktop';
import { useCallback } from 'react';

/**
 * @ 提及的会话文件数据源：初始列表用 file-list，搜索用 search-files。
 * 与 Chat 会话页（pages/Chat/index.tsx）的 fetchMentionFiles 同源逻辑，
 * 供各会话宿主（智能体开发 / 全栈应用开发面板等）接线 onFetchMentionFiles。
 */
const useConversationMentionFiles = (conversationId?: number | null) => {
  const fetchMentionFiles = useCallback(
    async (keyword = ''): Promise<FileMentionItem[]> => {
      if (!conversationId) return [];
      const kw = keyword.trim();
      const response = kw
        ? await apiSearchFiles({
            cId: conversationId,
            kw,
            type: 'file',
            limit: 100,
          })
        : await apiGetStaticFileList(conversationId, {
            relativePath: '',
            recursive: true,
            type: 'file',
            limit: 100,
          });
      if (response.code !== SUCCESS_CODE) {
        throw new Error('会话文件列表加载失败');
      }
      return (response.data?.files ?? [])
        .filter((file) => !file.isDir)
        .map((file) => ({
          kind: 'file',
          relativePath: file.name,
          name: file.name.split('/').pop() || file.name,
        }));
    },
    [conversationId],
  );

  return fetchMentionFiles;
};

export default useConversationMentionFiles;
