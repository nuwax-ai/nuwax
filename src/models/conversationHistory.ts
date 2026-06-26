import {
  apiAgentConversationDelete,
  apiAgentConversationList,
} from '@/services/agentConfig';
import { apiUserUsedAgentList } from '@/services/agentDev';
import { dict } from '@/services/i18nRuntime';
import { TaskStatus } from '@/types/enums/agent';
import type { AgentInfo } from '@/types/interfaces/agent';
import type { ConversationInfo } from '@/types/interfaces/conversationInfo';
import {
  fetchConversationTaskStatus,
  type ChatFinishedPayload,
} from '@/utils/conversationTaskStatusSync';
import { message } from 'antd';
import { useCallback, useState } from 'react';
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

      // 派发自定义删除事件通知列表
      window.dispatchEvent(
        new CustomEvent('conversation-deleted', {
          detail: { id: conversationId },
        }),
      );
    },
  });

  /** 合并 taskStatus 到列表中匹配会话（函数式更新，避免闭包陈旧） */
  const mergeTaskStatusInList = useCallback(
    (
      list: ConversationInfo[] | undefined,
      conversationId: string,
      taskStatus: TaskStatus,
    ) =>
      list?.map((item) =>
        item.id?.toString() === conversationId ? { ...item, taskStatus } : item,
      ),
    [],
  );

  /**
   * ChatFinished 后同步侧栏会话 taskStatus（拉取真实状态，非乐观 COMPLETE）
   */
  const handleConversationUpdate = useCallback(
    async ({ conversationId }: ChatFinishedPayload) => {
      const taskStatus = await fetchConversationTaskStatus(conversationId);
      if (taskStatus === undefined) {
        return;
      }
      setConversationList((list) =>
        mergeTaskStatusInList(list, conversationId, taskStatus),
      );
      setConversationListItem((list) =>
        mergeTaskStatusInList(list, conversationId, taskStatus),
      );
    },
    [mergeTaskStatusInList],
  );

  return {
    usedAgentList,
    runUsed,
    conversationList,
    conversationListItem,
    setConversationList,
    handleConversationUpdate,
    setConversationListItem,
    runHistory,
    runHistoryItem,
    loadingHistory,
    loadingHistoryEnd,
    loadingHistoryItem,
    runDel,
  };
};
