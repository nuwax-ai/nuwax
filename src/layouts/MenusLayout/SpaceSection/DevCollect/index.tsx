import type { AgentInfo } from '@/types/interfaces/agent';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface DevCollectProps {
  list: AgentInfo[];
  onClick: (agentId: string) => void;
}

// 开发收藏
const DevCollect: React.FC<DevCollectProps> = ({ list, onClick }) => {
  return (
    <ul>
      {list?.map((item) => (
        <li
          key={item.id}
          onClick={() => onClick(item.agentId)}
          className={cx(
            styles.row,
            'flex',
            'items-center',
            'cursor-pointer',
            'hover-box',
          )}
        >
          <img src={item.icon} alt="" />
          <span className={cx(styles.name, 'flex-1', 'text-ellipsis')}>
            {item.name}
          </span>
        </li>
      ))}
    </ul>
  );
};

export default DevCollect;
