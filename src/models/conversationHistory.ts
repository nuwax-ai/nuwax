import {
  apiAgentConversationDelete,
  apiAgentConversationList,
} from '@/services/agentConfig';
import { apiUserUsedAgentList } from '@/services/agentDev';
import type { AgentInfo } from '@/types/interfaces/agent';
import type { ConversationInfo } from '@/types/interfaces/conversationInfo';
import { message } from 'antd';
import { useState } from 'react';
import { useRequest } from 'umi';

export default () => {
  const [usedAgentList, setUsedAgentList] = useState<AgentInfo[]>();
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  // 历史会话列表-所有
  const [conversationList, setConversationList] =
    useState<ConversationInfo[]>();
  // 历史会话列表-当前智能体
  const [conversationListItem, setConversationListItem] =
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

  // 查询历史会话记录
  const { run: runHistoryItem, loading: loadingHistoryItem } = useRequest(
    apiAgentConversationList,
    {
      manual: true,
      debounceInterval: 500,
      onSuccess: (result: ConversationInfo[]) => {
        setConversationListItem(result);
      },
    },
  );

  // 删除会话
  const { run: runDel } = useRequest(apiAgentConversationDelete, {
    manual: true,
    debounceInterval: 500,
    onSuccess: (_: null, params: number[]) => {
      const conversationId = params[0];
      setConversationList?.((list) =>
        list?.filter((item) => item.id !== conversationId),
      );
      setConversationListItem?.((list) =>
        list?.filter((item) => item.id !== conversationId),
      );
      message.success('删除成功');
    },
  });

  return {
    usedAgentList,
    runUsed,
    conversationList,
    conversationListItem,
    setConversationList,
    setConversationListItem,
    runHistory,
    runHistoryItem,
    loadingHistory,
    loadingHistoryItem,
    setLoadingHistory,
    runDel,
  };
};
