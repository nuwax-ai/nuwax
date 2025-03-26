import type { AgentComponentInfo } from '@/types/interfaces/agent';
import { useState } from 'react';

export default () => {
  // 当前组件信息
  const [currentComponentInfo, setCurrentComponentInfo] =
    useState<AgentComponentInfo>();
  // 智能体模型组件列表
  const [agentComponentList, setAgentComponentList] = useState<
    AgentComponentInfo[]
  >([]);

  return {
    currentComponentInfo,
    setCurrentComponentInfo,
    agentComponentList,
    setAgentComponentList,
  };
};
