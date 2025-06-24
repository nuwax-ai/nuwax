import ParamsSetting from '@/components/ParamsSetting';
import { PLUGIN_SETTING_ACTIONS } from '@/constants/space.constants';
import {
  apiAgentCardList,
  apiAgentComponentMcpUpdate,
  apiAgentComponentPluginUpdate,
  apiAgentComponentTableUpdate,
  apiAgentComponentWorkflowUpdate,
} from '@/services/agentConfig';
import {
  AgentComponentTypeEnum,
  DefaultSelectedEnum,
  InvokeTypeEnum,
  OutputDirectlyEnum,
} from '@/types/enums/agent';
import { PluginSettingEnum } from '@/types/enums/space';
import {
  AgentCardInfo,
  AgentComponentInfo,
  AgentComponentMcpUpdateParams,
  AgentComponentPluginUpdateParams,
  AgentComponentTableUpdateParams,
  AgentComponentWorkflowUpdateParams,
} from '@/types/interfaces/agent';
import type {
  AsyncRunSaveParams,
  ComponentSettingModalProps,
  InvokeTypeSaveParams,
  OutputDirectlyParams,
} from '@/types/interfaces/agentConfig';
import {
  CardArgsBindConfigInfo,
  CardBindConfig,
} from '@/types/interfaces/cardInfo';
import { BindConfigWithSub } from '@/types/interfaces/common';
import { RequestResponse } from '@/types/interfaces/request';
import { CloseOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { message, Modal } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useModel } from 'umi';
import AsyncRun from './AsyncRun';
import CardBind from './CardBind';
import styles from './index.less';
import InvokeType from './InvokeType';
import OutputWay from './OutputWay';

const cx = classNames.bind(styles);

/**
 * 组件设置弹窗
 */
const ComponentSettingModal: React.FC<ComponentSettingModalProps> = ({
  open,
  currentComponentInfo,
  variables,
  onCancel,
  settingActionList = PLUGIN_SETTING_ACTIONS,
}) => {
  const [action, setAction] = useState<PluginSettingEnum>(
    PluginSettingEnum.Params,
  );
  const [componentInfo, setComponentInfo] = useState<AgentComponentInfo>();
  const [loading, setLoading] = useState<boolean>(false);
  // 卡片列表
  const [agentCardList, setAgentCardList] = useState<AgentCardInfo[]>([]);
  const { setAgentComponentList } = useModel('spaceAgent');

  useEffect(() => {
    setAction(PluginSettingEnum.Params);
    setComponentInfo(currentComponentInfo);
  }, [currentComponentInfo]);

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

  // 更新数据表组件配置
  const { runAsync: runTableUpdate } = useRequest(
    apiAgentComponentTableUpdate,
    {
      manual: true,
      debounceWait: 300,
    },
  );

  // 更新MCP组件配置
  const { runAsync: runMcpUpdate } = useRequest(apiAgentComponentMcpUpdate, {
    manual: true,
    debounceWait: 300,
  });

  // 查询卡片列表
  const { run: runCard } = useRequest(apiAgentCardList, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result: RequestResponse<AgentCardInfo[]>) => {
      const { data } = result;
      if (data?.length) {
        setAgentCardList(data);
      }
      setLoading(false);
    },
    onError: () => {
      setLoading(false);
    },
  });

  useEffect(() => {
    setLoading(true);
    runCard();
  }, []);

  const onSetSuccess = (
    id: number,
    attr: string,
    value: BindConfigWithSub[] | InvokeTypeEnum | CardBindConfig,
  ) => {
    // 更新当前组件信息
    setComponentInfo((info) => {
      if (info && 'bindConfig' in info) {
        info.bindConfig[attr] = value;
      }
      return info;
    });
    // 更新智能体模型组件列表
    setAgentComponentList((list: AgentComponentInfo[]) => {
      return list.map((item) => {
        if (item.id === id) {
          item.bindConfig[attr] = value;
        }
        return item;
      });
    });
  };

  // 保存动作
  const handleSaveAction = async (params: {
    id: number;
    bindConfig: {
      [key: string]:
        | BindConfigWithSub[]
        | CardArgsBindConfigInfo[]
        | InvokeTypeEnum
        | DefaultSelectedEnum
        | OutputDirectlyEnum;
    };
  }) => {
    // 插件
    if (componentInfo?.type === AgentComponentTypeEnum.Plugin) {
      await runPluginUpdate(params as AgentComponentPluginUpdateParams);
    }
    // 工作流
    if (componentInfo?.type === AgentComponentTypeEnum.Workflow) {
      await runWorkflowUpdate(params as AgentComponentWorkflowUpdateParams);
    }
    // 数据表
    if (componentInfo?.type === AgentComponentTypeEnum.Table) {
      await runTableUpdate(params as AgentComponentTableUpdateParams);
    }
    // MCP
    if (componentInfo?.type === AgentComponentTypeEnum.MCP) {
      await runMcpUpdate(params as AgentComponentMcpUpdateParams);
    }
  };

  // 保存设置
  const onSaveSet = async (
    attr: string,
    value: BindConfigWithSub[] | CardBindConfig,
  ) => {
    const id = componentInfo?.id || 0;

    const params = {
      id,
      bindConfig: {
        ...componentInfo?.bindConfig,
        [attr]: value,
      },
    };
    await handleSaveAction(params);
    onSetSuccess(id, attr, value);
    message.success('保存成功');
  };

  // 保存方法调用方式、输出方式或异步运行配置
  const onSaveInvokeType = async (
    data: InvokeTypeSaveParams | AsyncRunSaveParams | OutputDirectlyParams,
  ) => {
    const id = componentInfo?.id || 0;
    const params = {
      id,
      bindConfig: {
        ...componentInfo?.bindConfig,
        ...data,
      },
    };
    await handleSaveAction(params);
    // 更新当前组件信息
    setComponentInfo((info) => {
      if (info && 'bindConfig' in info) {
        info.bindConfig = {
          ...info.bindConfig,
          ...data,
        };
      }
      return info;
    });
    // 更新智能体模型组件列表
    setAgentComponentList((list: AgentComponentInfo[]) => {
      return list.map((item) => {
        if (item.id === id) {
          item.bindConfig = {
            ...item.bindConfig,
            ...data,
          };
        }
        return item;
      });
    });
    message.success('保存成功');
  };

  const getContent = () => {
    switch (action) {
      case PluginSettingEnum.Params:
        return (
          <ParamsSetting
            variables={variables || []}
            inputArgBindConfigs={componentInfo?.bindConfig?.inputArgBindConfigs}
            onSaveSet={onSaveSet}
          />
        );
      case PluginSettingEnum.Method_Call:
        return (
          <InvokeType
            invokeType={componentInfo?.bindConfig?.invokeType}
            defaultSelected={componentInfo?.bindConfig?.defaultSelected}
            onSaveSet={onSaveInvokeType}
          />
        );
      // 输出方式
      case PluginSettingEnum.Output_Way:
        return (
          <OutputWay
            directOutput={componentInfo?.bindConfig?.directOutput}
            onSaveSet={onSaveInvokeType}
          />
        );
      case PluginSettingEnum.Async_Run:
        return (
          <AsyncRun
            async={componentInfo?.bindConfig?.async}
            asyncReplyContent={componentInfo?.bindConfig?.asyncReplyContent}
            onSaveSet={onSaveInvokeType}
          />
        );
      case PluginSettingEnum.Card_Bind:
        return (
          <CardBind
            loading={loading}
            agentCardList={agentCardList}
            componentInfo={componentInfo}
            onSaveSet={onSaveSet}
          />
        );
    }
  };

  return (
    <Modal
      centered
      open={open}
      onCancel={onCancel}
      className={cx(styles['modal-container'])}
      modalRender={() => (
        <div className={cx(styles.container, 'flex', 'overflow-hide')}>
          <div className={cx(styles.left)}>
            <h3>设置</h3>
            <ul>
              {settingActionList.map((item) => {
                // 数据表组件不展示方法调用
                if (
                  currentComponentInfo?.type === AgentComponentTypeEnum.Table &&
                  [
                    PluginSettingEnum.Method_Call,
                    PluginSettingEnum.Async_Run,
                  ].includes(item.type)
                ) {
                  return null;
                }
                if (
                  currentComponentInfo?.type !==
                    AgentComponentTypeEnum.Workflow &&
                  item.type === PluginSettingEnum.Output_Way
                ) {
                  return null;
                }
                return (
                  <li
                    key={item.type}
                    className={cx(styles.item, 'cursor-pointer', {
                      [styles.checked]: action === item.type,
                    })}
                    onClick={() => setAction(item.type)}
                  >
                    {item.label}
                  </li>
                );
              })}
            </ul>
          </div>
          <div className={cx('flex-1', styles.right)}>{getContent()}</div>
          <CloseOutlined
            className={cx(styles.close, 'cursor-pointer')}
            onClick={onCancel}
          />
        </div>
      )}
    />
  );
};

export default ComponentSettingModal;
