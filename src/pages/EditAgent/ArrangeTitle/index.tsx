import { SvgIcon } from '@/components/base';
import ConditionRender from '@/components/ConditionRender';

import {
  ModelApiProtocolEnum,
  ModelFunctionCallEnum,
} from '@/types/enums/modelConfig';
import { AgentTypeEnum } from '@/types/enums/space';
import type { ArrangeTitleProps } from '@/types/interfaces/agentConfig';
import type { MenuProps } from 'antd';
import { Dropdown } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 编排顶部title组件
 */
const ArrangeTitle: React.FC<ArrangeTitleProps> = ({
  originalModelConfigList,
  agentConfigInfo,
  icon,
  modelName,
  onClick,
  onModelChange,
}) => {
  // 是否显示模型名称
  const [showModelName, setShowModelName] = useState<boolean>(false);

  const isTaskAgent = agentConfigInfo?.type === AgentTypeEnum.TaskAgent;

  useEffect(() => {
    if (agentConfigInfo && originalModelConfigList) {
      if (isTaskAgent) {
        const targetId = agentConfigInfo?.modelComponentConfig?.targetId;

        const modelInfo = originalModelConfigList.find((item) => {
          if (item.id !== targetId) return false;

          const isBaseSupported =
            (item.apiProtocol === ModelApiProtocolEnum.Anthropic ||
              item.apiProtocol === ModelApiProtocolEnum.OpenAI) &&
            item.functionCall !== ModelFunctionCallEnum.Unsupported;

          if (!isBaseSupported) return false;

          return true;
        });
        setShowModelName(!!modelInfo);
      } else {
        setShowModelName(true);
      }
    }
  }, [agentConfigInfo, originalModelConfigList]);

  // 通用智能体的 Dropdown 菜单项
  const dropdownMenuItems: MenuProps['items'] = useMemo(() => {
    if (!isTaskAgent || !originalModelConfigList?.length) return [];
    return originalModelConfigList
      .filter(
        (item) =>
          (item.apiProtocol === ModelApiProtocolEnum.Anthropic ||
            item.apiProtocol === ModelApiProtocolEnum.OpenAI) &&
          item.functionCall !== ModelFunctionCallEnum.Unsupported,
      )
      .map((item) => ({
        key: item.id,
        label: item.name,
      }));
  }, [isTaskAgent, originalModelConfigList]);

  // 通用智能体：下拉切换模型
  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    const _id = Number(key);
    const modelInfo = originalModelConfigList?.find((item) => item.id === _id);
    if (modelInfo && onModelChange) {
      onModelChange(_id, modelInfo.name);
    }
  };

  const triggerContent = (
    <div
      className={cx(
        'flex',
        'items-center',
        'cursor-pointer',
        styles['drop-box'],
      )}
      onClick={isTaskAgent ? undefined : onClick}
    >
      <ConditionRender condition={!!icon}>
        <img src={icon} alt="" />
      </ConditionRender>
      <span>{showModelName ? modelName : '请选择会话模型'}</span>
      <SvgIcon name="icons-common-caret_down" style={{ fontSize: 16 }} />
    </div>
  );

  return (
    <div
      className={cx(
        'flex',
        'content-between',
        'items-center',
        styles['edit-header'],
      )}
    >
      <h3>编排</h3>
      {isTaskAgent ? (
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
          {triggerContent}
        </Dropdown>
      ) : (
        triggerContent
      )}
    </div>
  );
};

export default ArrangeTitle;
