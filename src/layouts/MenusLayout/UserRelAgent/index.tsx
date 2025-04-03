import agentImage from '@/assets/images/agent_image.png';
import CustomPopover from '@/components/CustomPopover';
import type { UserRelAgentProps } from '@/types/interfaces/layouts';
import { EllipsisOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 用户相关智能体（我的收藏、最近使用、最近编辑）
const UserRelAgent: React.FC<UserRelAgentProps> = ({
  onClick,
  icon,
  name,
  onCancelCollect,
}) => {
  return (
    <div
      onClick={onClick}
      className={cx(
        styles.row,
        'flex',
        'items-center',
        'cursor-pointer',
        'hover-box',
      )}
    >
      <img src={icon || (agentImage as string)} alt="" />
      <span className={cx(styles.name, 'flex-1', 'text-ellipsis')}>{name}</span>
      {!!onCancelCollect && (
        <CustomPopover list={[{ label: '取消收藏' }]} onClick={onCancelCollect}>
          <EllipsisOutlined className={cx(styles.icon)} />
        </CustomPopover>
      )}
    </div>
  );
};

export default UserRelAgent;
