import type { SquareAgentInfo } from '@/types/interfaces/square';
import { useState } from 'react';

const useSquareModel = () => {
  const [agentInfoList, setAgentInfoList] = useState<SquareAgentInfo[]>([]);
  const [pluginInfoList, setPluginInfoList] = useState<SquareAgentInfo[]>([]);

  return {
    agentInfoList,
    setAgentInfoList,
    pluginInfoList,
    setPluginInfoList,
  };
};

export default useSquareModel;
