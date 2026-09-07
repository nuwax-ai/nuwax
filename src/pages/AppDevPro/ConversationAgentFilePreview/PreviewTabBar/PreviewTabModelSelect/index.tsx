import { SvgIcon } from '@/components/base';
import { dict } from '@/services/i18nRuntime';
import {
  ModelApiProtocolEnum,
  ModelFunctionCallEnum,
} from '@/types/enums/modelConfig';
import { AgentTypeEnum } from '@/types/enums/space';
import type { AgentConfigInfo } from '@/types/interfaces/agent';
import type { ModelConfigInfo } from '@/types/interfaces/model';
import type { MenuProps } from 'antd';
import { Dropdown } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const renderModelMenuLabel = (item: {
  name: string;
  description?: string;
  icon?: string;
}) => (
  <div className={cx(styles['model-option'])}>
    {!!item.icon && (
      <img className={cx(styles['model-option-icon'])} src={item.icon} alt="" />
    )}
    <div className={cx(styles['model-option-content'])}>
      <span className={cx(styles['model-option-name'])}>{item.name}</span>
      {!!item.description && (
        <span className={cx(styles['model-option-desc'])}>
          {item.description}
        </span>
      )}
    </div>
  </div>
);

export interface PreviewTabModelSelectProps {
  originalModelConfigList?: ModelConfigInfo[];
  agentConfigInfo?: AgentConfigInfo;
  /** 切换模型后回调（由父组件调用 API 并更新 agentConfigInfo） */
  onModelChange?: (modelId: number, modelName: string) => void | Promise<void>;
}

/**
 * 预览 Tab 栏模型下拉（逻辑与 EditAgent ArrangeTitle 一致，仅 TaskAgent 展示）
 */
const PreviewTabModelSelect: React.FC<PreviewTabModelSelectProps> = ({
  originalModelConfigList,
  agentConfigInfo,
  onModelChange,
}) => {
  const [showModelName, setShowModelName] = useState<boolean>(false);

  const isTaskAgent = agentConfigInfo?.type === AgentTypeEnum.TaskAgent;

  useEffect(() => {
    if (agentConfigInfo && originalModelConfigList) {
      if (isTaskAgent) {
        const targetId = agentConfigInfo?.modelComponentConfig?.targetId;
        const modelInfo = originalModelConfigList.find((item) => {
          if (item.id !== targetId) return false;
          return (
            (item.apiProtocol === ModelApiProtocolEnum.Anthropic ||
              item.apiProtocol === ModelApiProtocolEnum.OpenAI) &&
            item.functionCall !== ModelFunctionCallEnum.Unsupported
          );
        });
        setShowModelName(!!modelInfo);
      } else {
        setShowModelName(true);
      }
    }
  }, [agentConfigInfo, isTaskAgent, originalModelConfigList]);

  const dropdownMenuItems: MenuProps['items'] = useMemo(() => {
    if (!isTaskAgent || !originalModelConfigList?.length) return [];
    return originalModelConfigList
      .filter(
        (item) =>
          (item.apiProtocol === ModelApiProtocolEnum.Anthropic ||
            item.apiProtocol === ModelApiProtocolEnum.OpenAI) &&
          item.functionCall !== ModelFunctionCallEnum.Unsupported,
      )
      .filter((item) => {
        if (!agentConfigInfo?.type) return true;
        return item.usageScenarios?.includes(agentConfigInfo.type as any);
      })
      .map((item) => ({
        key: String(item.id),
        label: renderModelMenuLabel(item),
      }));
  }, [agentConfigInfo?.type, isTaskAgent, originalModelConfigList]);

  const hasMatchedModel = useMemo(() => {
    if (!originalModelConfigList?.length) return false;
    const targetId = agentConfigInfo?.modelComponentConfig?.targetId;
    if (targetId === undefined || targetId === null) return false;
    return originalModelConfigList.some((item) => item.id === targetId);
  }, [
    originalModelConfigList,
    agentConfigInfo?.modelComponentConfig?.targetId,
  ]);

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    const modelId = Number(key);
    const modelInfo = originalModelConfigList?.find(
      (item) => item.id === modelId,
    );
    if (modelInfo && onModelChange) {
      void onModelChange(modelId, modelInfo.name);
    }
  };

  if (!isTaskAgent || !dropdownMenuItems?.length) {
    return null;
  }

  const modelName = agentConfigInfo?.modelComponentConfig?.name;
  const modelIcon = agentConfigInfo?.modelComponentConfig?.icon;

  return (
    <Dropdown
      menu={{
        items: dropdownMenuItems,
        onClick: handleMenuClick,
        selectedKeys: agentConfigInfo?.modelComponentConfig?.targetId
          ? [String(agentConfigInfo.modelComponentConfig.targetId)]
          : [],
      }}
      trigger={['click']}
      placement="bottomRight"
      rootClassName={cx(styles['model-dropdown'])}
    >
      <div className={cx(styles['model-select-trigger'])}>
        {!!modelIcon && (
          <img
            className={cx(styles['model-select-icon'])}
            src={modelIcon}
            alt=""
          />
        )}
        <span className={cx(styles['model-select-label'], 'text-ellipsis')}>
          {showModelName && hasMatchedModel
            ? modelName
            : dict('PC.Pages.EditAgent.ArrangeTitle.selectChatModel')}
        </span>
        <SvgIcon name="icons-common-caret_down" style={{ fontSize: 14 }} />
      </div>
    </Dropdown>
  );
};

export default PreviewTabModelSelect;
