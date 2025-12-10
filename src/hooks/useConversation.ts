import { apiAgentConversationCreate } from '@/services/agentConfig';
import {
  AgentDetailDto,
  AgentSelectedComponentInfo,
} from '@/types/interfaces/agent';
import type {
  MessageSourceType,
  UploadFileInfo,
} from '@/types/interfaces/common';
import { useRequest } from 'ahooks';
import { history } from 'umi';

const useConversation = () => {
  // 创建会话
  const { runAsync: runAsyncConversationCreate } = useRequest(
    apiAgentConversationCreate,
    {
      manual: true,
      debounceMaxWait: 300,
    },
  );

  // 创建智能体会话
  const handleCreateConversation = async (
    agentId: number,
    attach?: {
      message: string;
      files?: UploadFileInfo[];
      infos?: AgentSelectedComponentInfo[];
      // 默认智能体详情
      defaultAgentDetail?: AgentDetailDto;
      // 变量参数
      variableParams?: Record<string, string | number> | null;
      // 消息来源
      messageSourceType?: MessageSourceType;
    },
  ) => {
    const variableParams = attach?.variableParams;
    const { success, data } = await runAsyncConversationCreate({
      agentId,
      devMode: false,
      variables: variableParams,
    });

    if (success) {
      const id = data?.id;
      history.push(`/home/chat/${id}/${agentId}`, attach);
    }
  };

  return {
    handleCreateConversation,
    runAsyncConversationCreate,
  };
};

export default useConversation;
