import {
  apiAgentComponentPluginUpdate,
  apiAgentComponentWorkflowUpdate,
} from '@/services/agentConfig';
import type { InvokeTypeEnum } from '@/types/enums/agent';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type {
  AgentComponentInfo,
  AgentComponentPluginUpdateParams,
  AgentComponentWorkflowUpdateParams,
  BindConfigWithSub,
} from '@/types/interfaces/agent';
import { useRequest } from 'ahooks';
import { message } from 'antd';
import { useState } from 'react';

export default () => {
  // 当前组件信息
  const [currentComponentInfo, setCurrentComponentInfo] =
    useState<AgentComponentInfo>();
  // 智能体模型组件列表
  const [agentComponentList, setAgentComponentList] = useState<
    AgentComponentInfo[]
  >([]);

  // 更新插件组件配置
  const { runAsync: runPluginUpdate } = useRequest(
    apiAgentComponentPluginUpdate,
    {
      manual: true,
      debounceWait: 300,
    },
  );

  // 更新工作流组件配置
  const { runAsync: runWorkflowUpdate } = useRequest(
    apiAgentComponentWorkflowUpdate,
    {
      manual: true,
      debounceWait: 300,
    },
  );

  const onSetSuccess = (
    id: number,
    attr: string,
    value: BindConfigWithSub[] | InvokeTypeEnum,
  ) => {
    // 更新当前组件信息
    setCurrentComponentInfo((info) => {
      if (info && 'bindConfig' in info) {
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

  // 保存设置
  const onSaveSet = async (
    attr: string,
    value: BindConfigWithSub[] | InvokeTypeEnum,
  ) => {
    const id = currentComponentInfo?.id || 0;
    const params = {
      id,
      bindConfig: {
        ...currentComponentInfo?.bindConfig,
        [attr]: value,
      },
    };
    if (currentComponentInfo?.type === AgentComponentTypeEnum.Plugin) {
      await runPluginUpdate(params as AgentComponentPluginUpdateParams);
    } else {
      await runWorkflowUpdate(params as AgentComponentWorkflowUpdateParams);
    }
    onSetSuccess(id, attr, value);
    message.success('保存成功');
  };

  return {
    currentComponentInfo,
    setCurrentComponentInfo,
    agentComponentList,
    setAgentComponentList,
    onSetSuccess,
    onSaveSet,
  };
};
