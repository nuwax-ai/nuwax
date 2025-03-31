import { PLUGIN_SETTING_ACTIONS } from '@/constants/space.constants';
import {
  apiAgentComponentPluginUpdate,
  apiAgentComponentWorkflowUpdate,
} from '@/services/agentConfig';
import { AgentComponentTypeEnum, InvokeTypeEnum } from '@/types/enums/agent';
import { PluginSettingEnum } from '@/types/enums/space';
import type { BindConfigWithSub } from '@/types/interfaces/agent';
import type { PluginModelSettingProps } from '@/types/interfaces/agentConfig';
import { CloseOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { message, Modal } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import { useModel } from 'umi';
import CardBind from './CardBind';
import styles from './index.less';
import InvokeType from './InvokeType';
import ParamsSetting from './ParamsSetting';

const cx = classNames.bind(styles);

/**
 * 插件模型设置
 */
const PluginModelSetting: React.FC<PluginModelSettingProps> = ({
  open,
  variables,
  onCancel,
}) => {
  const { currentComponentInfo, onSetSuccess } = useModel('spaceAgent');
  const [action, setAction] = useState<PluginSettingEnum>(
    PluginSettingEnum.Params,
  );

  const id = currentComponentInfo?.id;

  const inputConfigArgs =
    currentComponentInfo?.type === AgentComponentTypeEnum.Plugin
      ? currentComponentInfo?.bindConfig?.inputArgBindConfigs
      : currentComponentInfo?.bindConfig?.argBindConfigs;

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

  const handleSave = async (
    attr: string,
    value: BindConfigWithSub[] | InvokeTypeEnum,
  ) => {
    const params = {
      id,
      bindConfig: {
        ...currentComponentInfo?.bindConfig,
        [attr]: value,
      },
    };
    if (currentComponentInfo?.type === AgentComponentTypeEnum.Plugin) {
      await runPluginUpdate(params);
    } else {
      await runWorkflowUpdate(params);
    }
    onSetSuccess(id, attr, value);
    message.success('保存成功');
  };

  const Content: React.FC = () => {
    switch (action) {
      case PluginSettingEnum.Params:
        return (
          <ParamsSetting
            onSave={handleSave}
            type={currentComponentInfo?.type}
            inputConfigArgs={inputConfigArgs}
            variables={variables}
          />
        );
      case PluginSettingEnum.Method_Call:
        return (
          <InvokeType
            invokeType={currentComponentInfo?.bindConfig?.invokeType}
            onSave={handleSave}
          />
        );
      case PluginSettingEnum.Card_Bind:
        return <CardBind />;
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
              {PLUGIN_SETTING_ACTIONS.map((item) => (
                <li
                  key={item.type}
                  className={cx(styles.item, 'cursor-pointer', {
                    [styles.checked]: action === item.type,
                  })}
                  onClick={() => setAction(item.type)}
                >
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
          <div className={cx('flex-1', styles.right)}>
            <Content />
          </div>
          <CloseOutlined
            className={cx(styles.close, 'cursor-pointer')}
            onClick={onCancel}
          />
        </div>
      )}
    ></Modal>
  );
};

export default PluginModelSetting;
