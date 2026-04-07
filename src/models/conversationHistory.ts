import {
  apiAgentConversationDelete,
  apiAgentConversationList,
} from '@/services/agentConfig';
import { apiUserUsedAgentList } from '@/services/agentDev';
import { dict } from '@/services/i18nRuntime';
import type { AgentInfo } from '@/types/interfaces/agent';
import type { ConversationInfo } from '@/types/interfaces/conversationInfo';
import { message } from 'antd';
import { useState } from 'react';
import { useRequest } from 'umi';

export default () => {
  const [usedAgentList, setUsedAgentList] = useState<AgentInfo[]>();
  // 历史会话列表是否加载完成
  const [loadingHistoryEnd, setLoadingHistoryEnd] = useState<boolean>(false);
  // 历史会话列表-所有
  const [conversationList, setConversationList] =
    useState<ConversationInfo[]>();
  // 历史会话列表-当前智能体
  const [conversationListItem, setConversationListItem] =
    useState<ConversationInfo[]>();

  // 查询用户最近使用过的智能体列表
  const { run: runUsed } = useRequest(apiUserUsedAgentList, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result: AgentInfo[]) => {
      setUsedAgentList(result);
    },
  });

  // 查询历史会话记录
  const { run: runHistory, loading: loadingHistory } = useRequest(
    apiAgentConversationList,
    {
      manual: true,
      debounceWait: 300,
      loadingDelay: 300, // 300ms内不显示loading
      onSuccess: (result: ConversationInfo[]) => {
        setConversationList(result);
        setLoadingHistoryEnd(true);
      },
    },
  );

  // 查询历史会话记录
  const { run: runHistoryItem, loading: loadingHistoryItem } = useRequest(
    apiAgentConversationList,
    {
      manual: true,
      debounceWait: 500,
      onSuccess: (result: ConversationInfo[]) => {
        setConversationListItem(result);
      },
    },
  );

  // 删除会话
  const { run: runDel } = useRequest(apiAgentConversationDelete, {
    manual: true,
    debounceWait: 500,
    onSuccess: (_: null, params: number[]) => {
      const conversationId = params[0];
      setConversationList?.((list) =>
        list?.filter((item) => item.id !== conversationId),
      );
      setConversationListItem?.((list) =>
        list?.filter((item) => item.id !== conversationId),
      );
      message.success(dict('PC.Toast.Global.deletedSuccessfully'));
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
    loadingHistoryEnd,
    loadingHistoryItem,
    runDel,
  };
};
