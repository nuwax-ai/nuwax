import ParamsSetting from '@/components/ParamsSetting';
import { COMPONENT_SETTING_ACTIONS } from '@/constants/space.constants';
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
import { ComponentSettingEnum } from '@/types/enums/space';
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
  CardBindSaveParams,
  ComponentSettingModalProps,
  ExceptionHandingSaveParams,
  InvokeTypeSaveParams,
  OutputDirectlyParams,
  ParamsSaveParams,
} from '@/types/interfaces/agentConfig';
import { CardArgsBindConfigInfo } from '@/types/interfaces/cardInfo';
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
import ExceptionHanding from './ExceptionHanding';
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
  settingActionList = COMPONENT_SETTING_ACTIONS,
}) => {
  const [action, setAction] = useState<ComponentSettingEnum>(
    ComponentSettingEnum.Params,
  );
  const [componentInfo, setComponentInfo] = useState<AgentComponentInfo>();
  const [loading, setLoading] = useState<boolean>(false);
  // 卡片列表
  const [agentCardList, setAgentCardList] = useState<AgentCardInfo[]>([]);
  const { setAgentComponentList } = useModel('spaceAgent');

  useEffect(() => {
    setAction(ComponentSettingEnum.Params);
    setComponentInfo(currentComponentInfo);
  }, [currentComponentInfo]);

  const apiConfig = {
    manual: true,
    debounceWait: 300,
  };

  // 更新插件组件配置
  const { runAsync: runPluginUpdate } = useRequest(
    apiAgentComponentPluginUpdate,
    apiConfig,
  );

  // 更新工作流组件配置
  const { runAsync: runWorkflowUpdate } = useRequest(
    apiAgentComponentWorkflowUpdate,
    apiConfig,
  );

  // 更新数据表组件配置
  const { runAsync: runTableUpdate } = useRequest(
    apiAgentComponentTableUpdate,
    apiConfig,
  );

  // 更新MCP组件配置
  const { runAsync: runMcpUpdate } = useRequest(
    apiAgentComponentMcpUpdate,
    apiConfig,
  );

  // 查询卡片列表
  const { run: runCard } = useRequest(apiAgentCardList, {
    ...apiConfig,
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
    exceptionOut?: DefaultSelectedEnum;
    fallbackMsg?: string;
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

  // 保存方法调用方式、输出方式或异步运行配置
  const handleSaveSetting = async (
    data:
      | InvokeTypeSaveParams
      | AsyncRunSaveParams
      | OutputDirectlyParams
      | ParamsSaveParams
      | CardBindSaveParams
      | null,
    exceptionHandingData?: ExceptionHandingSaveParams,
  ) => {
    const id = componentInfo?.id || 0;
    // 如果data为null，则不更新bindConfig
    const bindConfig = data ?? {};
    const params = {
      id,
      bindConfig: {
        ...componentInfo?.bindConfig,
        ...bindConfig,
      },
      ...(exceptionHandingData || {}),
    };
    await handleSaveAction(params);
    // 更新当前组件信息
    setComponentInfo((info) => {
      if (info) {
        if ('bindConfig' in info) {
          info.bindConfig = {
            ...info.bindConfig,
            ...bindConfig,
          };
        }
        if (exceptionHandingData) {
          info.exceptionOut = exceptionHandingData.exceptionOut;
          info.fallbackMsg = exceptionHandingData.fallbackMsg;
        }
      }
      return info;
    });
    // 更新智能体模型组件列表
    setAgentComponentList((list: AgentComponentInfo[]) => {
      return list.map((item) => {
        if (item.id === id) {
          item.bindConfig = {
            ...item.bindConfig,
            ...bindConfig,
          };
          if (exceptionHandingData) {
            item.exceptionOut = exceptionHandingData.exceptionOut;
            item.fallbackMsg = exceptionHandingData.fallbackMsg;
          }
        }
        return item;
      });
    });
    message.success('保存成功');
  };

  const getContent = () => {
    switch (action) {
      case ComponentSettingEnum.Params:
        return (
          <ParamsSetting
            variables={variables || []}
            inputArgBindConfigs={componentInfo?.bindConfig?.inputArgBindConfigs}
            onSaveSet={handleSaveSetting}
          />
        );
      case ComponentSettingEnum.Method_Call:
        return (
          <InvokeType
            invokeType={componentInfo?.bindConfig?.invokeType}
            defaultSelected={componentInfo?.bindConfig?.defaultSelected}
            onSaveSet={handleSaveSetting}
          />
        );
      // 输出方式
      case ComponentSettingEnum.Output_Way:
        return (
          <OutputWay
            directOutput={componentInfo?.bindConfig?.directOutput}
            onSaveSet={handleSaveSetting}
          />
        );
      // 异步运行
      case ComponentSettingEnum.Async_Run:
        return (
          <AsyncRun
            async={componentInfo?.bindConfig?.async}
            asyncReplyContent={componentInfo?.bindConfig?.asyncReplyContent}
            onSaveSet={handleSaveSetting}
          />
        );
      // 异常处理
      case ComponentSettingEnum.Exception_Handling:
        return (
          <ExceptionHanding
            exceptionOut={componentInfo?.exceptionOut || DefaultSelectedEnum.No}
            fallbackMsg={componentInfo?.fallbackMsg || ''}
            onSaveSet={(data) => handleSaveSetting(null, data)}
          />
        );
      case ComponentSettingEnum.Card_Bind:
        return (
          <CardBind
            loading={loading}
            agentCardList={agentCardList}
            componentInfo={componentInfo}
            onSaveSet={handleSaveSetting}
          />
        );
    }
  };

  return (
    <Modal
      centered
      open={open}
      onCancel={onCancel}
      destroyOnClose
      className={cx(styles['modal-container'])}
      modalRender={() => (
        <div className={cx(styles.container, 'flex', 'overflow-hide')}>
          <div className={cx(styles.left)}>
            <h3>设置</h3>
            <ul>
              {settingActionList.map((item) => {
                // 数据表组件不展示方法调用
                if (
                  // 数据表组件不展示方法调用、异步运行、异常处理
                  currentComponentInfo?.type === AgentComponentTypeEnum.Table &&
                  [
                    ComponentSettingEnum.Method_Call,
                    ComponentSettingEnum.Async_Run,
                    ComponentSettingEnum.Exception_Handling,
                  ].includes(item.type)
                ) {
                  return null;
                }
                // 非工作流组件不展示输出方式
                if (
                  currentComponentInfo?.type !==
                    AgentComponentTypeEnum.Workflow &&
                  item.type === ComponentSettingEnum.Output_Way
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
