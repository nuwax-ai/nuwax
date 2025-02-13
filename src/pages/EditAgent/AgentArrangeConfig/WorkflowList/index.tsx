import { AgentComponentInfo } from '@/types/interfaces/agent';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface WorkflowListProps {
  list: AgentComponentInfo[];
}

const WorkflowList: React.FC<WorkflowListProps> = ({ list }) => {
  return !list?.length ? (
    <p>
      工作流支持通过可视化的方式，对插件、大语言模型、代码块等功能进行组合，从而实现复杂、稳定的业务流程编排，例如旅行规划、报告分析等。
    </p>
  ) : (
    list.map((item) => (
      <div
        key={item.id}
        className={cx('flex', 'overflow-hide', styles.container)}
      >
        <img src={item.icon} alt="" />
        <div className={cx('flex-1', 'flex', 'flex-col')}>
          <h3>{item.name}</h3>
          <p>{item.description}</p>
        </div>
      </div>
    ))
  );
};

export default WorkflowList;
