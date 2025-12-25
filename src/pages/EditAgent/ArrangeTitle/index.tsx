import { SvgIcon } from '@/components/base';
import ConditionRender from '@/components/ConditionRender';
import { ModelApiProtocolEnum } from '@/types/enums/modelConfig';
import { AgentTypeEnum } from '@/types/enums/space';
import type { ArrangeTitleProps } from '@/types/interfaces/agentConfig';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
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
}) => {
  // 是否显示模型名称
  const [showModelName, setShowModelName] = useState<boolean>(false);
  useEffect(() => {
    if (agentConfigInfo && originalModelConfigList) {
      // 是否是任务型智能体
      const isTaskAgent = agentConfigInfo?.type === AgentTypeEnum.TaskAgent;

      if (isTaskAgent) {
        // 默认模型id
        const targetId = agentConfigInfo?.modelComponentConfig?.targetId;
        const modelInfo = originalModelConfigList.find(
          (item) =>
            item.id === targetId &&
            item.apiProtocol === ModelApiProtocolEnum.Anthropic,
        );
        if (modelInfo) {
          setShowModelName(true);
        } else {
          setShowModelName(false);
        }
      } else {
        setShowModelName(true);
      }
    }
  }, [agentConfigInfo, originalModelConfigList]);

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
      <div
        className={cx(
          'flex',
          'items-center',
          'cursor-pointer',
          styles['drop-box'],
        )}
        onClick={onClick}
      >
        <ConditionRender condition={!!icon}>
          <img src={icon} alt="" />
        </ConditionRender>
        <span>{showModelName ? modelName : '请选择会话模型'}</span>
        <SvgIcon name="icons-common-caret_down" style={{ fontSize: 16 }} />
      </div>
    </div>
  );
};

export default ArrangeTitle;
