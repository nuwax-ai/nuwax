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
      <img
        className={cx('radius-6', styles.img)}
        src={agentComponentInfo.icon || defaultImage}
        alt=""
      />
      <div className={cx('flex-1', 'overflow-hide')}>
        <h3 className={cx('text-ellipsis', 'w-full', styles.name)}>
          {agentComponentInfo.name}
        </h3>
        <p className={cx('text-ellipsis', styles.desc)}>
          {agentComponentInfo.description}
        </p>
      </div>
      <div className={cx(styles['extra-box'], 'flex', 'items-center')}>
        {extra}
      </div>
    </div>
  );
};

export default AgentModelComponent;
