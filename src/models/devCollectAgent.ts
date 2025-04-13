import {
  apiDevUnCollectAgent,
  apiUserDevCollectAgentList,
  apiUserEditAgentList,
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
  // 智能体 - 最近编辑
  const [editAgentList, setEditAgentList] = useState<AgentInfo[]>([]);

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

  // 查询用户最近编辑的智能体列表
  const { run: runEdit } = useRequest(apiUserEditAgentList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: AgentInfo[]) => {
      setEditAgentList(result);
    },
  });

  return {
    runDevCollect,
    runCancelCollect,
    devCollectAgentList,
    editAgentList,
    runEdit,
  };
};
