import {
  apiDevUnCollectAgent,
  apiUserDevCollectAgentList,
} from '@/services/agentDev';
import type { AgentInfo } from '@/types/interfaces/agent';
import { message } from 'antd';
import { useState } from 'react';
import { useRequest } from 'umi';

// 开发智能体收藏
export default () => {
  const [devCollectAgentList, setDevCollectAgentList] = useState<AgentInfo[]>(
    [],
  );

  // 查询用户开发智能体收藏列表
  const { run: runDevCollect } = useRequest(apiUserDevCollectAgentList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: AgentInfo[]) => {
      setDevCollectAgentList(result);
    },
  });

  // 取消开发智能体收藏
  const { run: runCancelCollect } = useRequest(apiDevUnCollectAgent, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (_, params) => {
      message.success('取消收藏成功');
      const agentId = params[0];
      const list =
        devCollectAgentList?.filter((item) => item.agentId !== agentId) || [];
      setDevCollectAgentList(list);
    },
  });

  return {
    runDevCollect,
    runCancelCollect,
    devCollectAgentList,
  };
};
