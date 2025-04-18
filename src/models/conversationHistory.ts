import { apiAgentConversationList } from '@/services/agentConfig';
import { apiUserUsedAgentList } from '@/services/agentDev';
import type { AgentInfo } from '@/types/interfaces/agent';
import type { ConversationInfo } from '@/types/interfaces/conversationInfo';
import { useState } from 'react';
import { useRequest } from 'umi';

export default () => {
  const [usedAgentList, setUsedAgentList] = useState<AgentInfo[]>();
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  // 历史会话列表
  const [conversationList, setConversationList] =
    useState<ConversationInfo[]>();

  // 查询用户最近使用过的智能体列表
  const { run: runUsed } = useRequest(apiUserUsedAgentList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: AgentInfo[]) => {
      setUsedAgentList(result);
    },
  });

  // 查询历史会话记录
  const { run: runHistory } = useRequest(apiAgentConversationList, {
    manual: true,
    debounceInterval: 500,
    onSuccess: (result: ConversationInfo[]) => {
      setConversationList(result);
      setLoadingHistory(false);
    },
  });

  return {
    usedAgentList,
    runUsed,
    conversationList,
    setConversationList,
    runHistory,
    loadingHistory,
    setLoadingHistory,
  };
};
