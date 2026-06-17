import type { AgentComponentInfo } from '@/types/interfaces/agent';
import { useState } from 'react';

export default () => {
  // 智能体模型组件列表
  const [agentComponentList, setAgentComponentList] = useState<
    AgentComponentInfo[]
  >([]);

  // // 保存设置
  // const onSaveSet = async (
  //   attr: string,
  //   value: BindConfigWithSub[] | InvokeTypeEnum,
  // ) => {
  //   const id = currentComponentInfo?.id || 0;
  //   const params = {
  //     id,
  //     bindConfig: {
  //       ...currentComponentInfo?.bindConfig,
  //       [attr]: value,
  //     },
  //   };
  //   if (currentComponentInfo?.type === AgentComponentTypeEnum.Plugin) {
  //     await runPluginUpdate(params as AgentComponentPluginUpdateParams);
  //   } else {
  //     await runWorkflowUpdate(params as AgentComponentWorkflowUpdateParams);
  //   }
  //   onSetSuccess(id, attr, value);
  //   message.success('保存成功');
  // };

  return {
    // currentComponentInfo,
    // setCurrentComponentInfo,
    agentComponentList,
    setAgentComponentList,
    // onSetSuccess,
    // onSaveSet,
  };
};
