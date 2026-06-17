import type { SquareAgentInfo } from '@/types/interfaces/square';
import { useState } from 'react';

const useSquareModel = () => {
  const [agentInfoList, setAgentInfoList] = useState<SquareAgentInfo[]>([]);
  // 网页应用
  const [pageAppInfoList, setPageAppInfoList] = useState<SquareAgentInfo[]>([]);
  const [pluginInfoList, setPluginInfoList] = useState<SquareAgentInfo[]>([]);
  const [workflowInfoList, setWorkflowInfoList] = useState<SquareAgentInfo[]>(
    [],
  );
  const [templateList, setTemplateList] = useState<SquareAgentInfo[]>([]);
  const [skillInfoList, setSkillInfoList] = useState<SquareAgentInfo[]>([]);

  return {
    agentInfoList,
    setAgentInfoList,
    pageAppInfoList,
    setPageAppInfoList,
    pluginInfoList,
    setPluginInfoList,
    workflowInfoList,
    setWorkflowInfoList,
    templateList,
    setTemplateList,
    skillInfoList,
    setSkillInfoList,
  };
};

export default useSquareModel;
