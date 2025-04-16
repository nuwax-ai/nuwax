import { apiAgentConversationList } from '@/services/agentConfig';
import type { ConversationInfo } from '@/types/interfaces/conversationInfo';
import { useState } from 'react';
import { useRequest } from 'umi';

export default () => {
  // 历史会话列表
  const [conversationList, setConversationList] =
    useState<ConversationInfo[]>();

  // 查询历史会话记录
  const { run: runHistory } = useRequest(apiAgentConversationList, {
    manual: true,
    debounceInterval: 500,
    onSuccess: (result: ConversationInfo[]) => {
      setConversationList(result);
    },
  });

  return {
    conversationList,
    runHistory,
  };
};
