import type { SquareAgentInfo } from '@/types/interfaces/square';
import { useState } from 'react';

const useSquareModel = () => {
  const [agentInfoList, setAgentInfoList] = useState<SquareAgentInfo[]>([]);
  const [pluginInfoList, setPluginInfoList] = useState<SquareAgentInfo[]>([]);
  const [workflowInfoList, setWorkflowInfoList] = useState<SquareAgentInfo[]>(
    [],
  );
  const [templateList, setTemplateList] = useState<SquareAgentInfo[]>([]);

  return {
    agentInfoList,
    setAgentInfoList,
    pluginInfoList,
    setPluginInfoList,
    workflowInfoList,
    setWorkflowInfoList,
    templateList,
    setTemplateList,
  };
};

export default useSquareModel;
