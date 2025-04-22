import ConditionRender from '@/components/ConditionRender';
import type { AgentModelComponentProps } from '@/types/interfaces/agentConfig';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 智能体模型组件，插件、工作流、触发器等组件通用显示组件
const AgentModelComponent: React.FC<AgentModelComponentProps> = ({
  agentComponentInfo,
  defaultImage,
  extra,
}) => {
  return (
    <div className={cx('flex', 'items-center', styles.container)}>
      <span className={cx('radius-6', styles['img-box'])}>
        <img src={agentComponentInfo.icon || defaultImage} alt="" />
      </span>
      <div
        className={cx(
          'flex-1',
          'flex',
          'flex-col',
          'content-center',
          'overflow-hide',
        )}
      >
        <h3 className={cx('text-ellipsis', styles.name)}>
          {agentComponentInfo.name}
        </h3>
        <ConditionRender condition={agentComponentInfo.description}>
          <p className={cx('text-ellipsis', styles.desc)}>
            {agentComponentInfo.description}
          </p>
        </ConditionRender>
      </div>
      <div className={cx(styles['extra-box'], 'flex', 'items-center')}>
        {extra}
      </div>
    </div>
  );
};

export default AgentModelComponent;
