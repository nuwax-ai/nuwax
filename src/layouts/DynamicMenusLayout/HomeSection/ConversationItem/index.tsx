import { TaskStatus } from '@/types/enums/agent';
import { Typography } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 二级菜单项组件
export interface ConversationItemProps {
  isFirst?: boolean;
  name: string;
  taskStatus?: TaskStatus;
  isActive?: boolean;
  onClick: () => void;
  className?: string;
}

// 二级菜单项组件
const ConversationItem: React.FC<ConversationItemProps> = ({
  name,
  isActive = false,
  isFirst = false,
  taskStatus,
  onClick,
  className,
}) => {
  return (
    <div
      className={cx(
        'flex',
        'items-center',
        'gap-10',
        styles.row,
        styles.menuItem,
        {
          [styles.active]: isActive,
          [styles.first]: isFirst,
        },
        className,
      )}
      onClick={onClick}
    >
      <Typography.Text className={cx('flex-1', styles.name)} ellipsis={true}>
        {name}
      </Typography.Text>
      {taskStatus === TaskStatus.EXECUTING && (
        <span className={cx(styles['status-text'])}>执行中</span>
      )}
    </div>
  );
};

export default ConversationItem;
