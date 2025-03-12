import agentImage from '@/assets/images/agent_image.png';
import type { UserRelAgentListProps } from '@/types/interfaces/layouts';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 用户相关智能体
 */
const UserRelAgentList: React.FC<UserRelAgentListProps> = ({
  list,
  onClick,
}) => {
  return (
    <ul>
      {list?.map((item) => (
        <li
          key={item.id}
          className={cx(
            styles.row,
            'flex',
            'items-center',
            'cursor-pointer',
            'hover-box',
          )}
          onClick={() => onClick(item)}
        >
          <img src={item.icon || (agentImage as string)} alt="" />
          <span className={cx(styles.name, 'flex-1', 'text-ellipsis')}>
            {item.name}
          </span>
        </li>
      ))}
    </ul>
  );
};

export default UserRelAgentList;
