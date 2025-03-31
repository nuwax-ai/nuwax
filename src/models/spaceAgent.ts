import type { InvokeTypeEnum } from '@/types/enums/agent';
import type {
  AgentComponentInfo,
  BindConfigWithSub,
} from '@/types/interfaces/agent';
import { useState } from 'react';

export default () => {
  // 当前组件信息
  const [currentComponentInfo, setCurrentComponentInfo] =
    useState<AgentComponentInfo>();
  // 智能体模型组件列表
  const [agentComponentList, setAgentComponentList] = useState<
    AgentComponentInfo[]
  >([]);

  const onSetSuccess = (
    id: number,
    attr: string,
    value: BindConfigWithSub[] | InvokeTypeEnum,
  ) => {
    // 更新当前组件信息
    setCurrentComponentInfo((info) => {
      if ('bindConfig' in info) {
        info.bindConfig[attr] = value;
      }
      return info;
    });
    // 更新智能体模型组件列表
    setAgentComponentList((list) => {
      return list.map((item) => {
        if (item.id === id) {
          item.bindConfig[attr] = value;
        }
        return item;
      });
    });
  };

  return {
    currentComponentInfo,
    setCurrentComponentInfo,
    agentComponentList,
    setAgentComponentList,
    onSetSuccess,
  };
};
