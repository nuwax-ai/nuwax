import { AgentConfigInfo } from '@/types/interfaces/agent';
import cloneDeep from 'lodash/cloneDeep';
import { useCallback, useRef, useState } from 'react';

export default () => {
  // 智能体列表
  const [agentList, setAgentList] = useState<AgentConfigInfo[]>([]);
  // 所有智能体列表
  const agentAllRef = useRef<AgentConfigInfo[]>([]);

  // 收藏与取消收藏
  const handlerCollect = useCallback(
    (index: number, isCollect: boolean) => {
      const _agentList = cloneDeep(agentList);
      _agentList[index].devCollected = isCollect;
      setAgentList(_agentList);
      agentAllRef.current[index].devCollected = isCollect;
    },
    [agentList],
  );

  return {
    agentList,
    setAgentList,
    agentAllRef,
    handlerCollect,
  };
};
