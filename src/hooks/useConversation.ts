import { apiAgentConversationCreate } from '@/services/agentConfig';
import {
  AgentDetailDto,
  AgentSelectedComponentInfo,
} from '@/types/interfaces/agent';
import type { UploadFileInfo } from '@/types/interfaces/common';
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
    },
  ) => {
    const { success, data } = await runAsyncConversationCreate({
      agentId,
      devMode: false,
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
