import { dict } from '@/services/i18nRuntime';
import { TaskStatus } from '@/types/enums/agent';
import { Typography } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 会话记录item组件
export interface ConversationItemProps {
  isFirst?: boolean;
  name: string;
  taskStatus?: TaskStatus;
  isActive?: boolean;
  onClick: () => void;
}

// 会话记录item组件
const ConversationItem: React.FC<ConversationItemProps> = ({
  name,
  isActive = false,
  isFirst = false,
  taskStatus,
  onClick,
}) => {
  return (
    <div
      className={cx('flex', 'items-center', 'gap-10', styles.row, {
        [styles.active]: isActive,
        [styles.first]: isFirst,
      })}
      onClick={onClick}
    >
      <Typography.Text className={cx('flex-1', styles.name)} ellipsis={true}>
        {name}
      </Typography.Text>
      {taskStatus === TaskStatus.EXECUTING && (
        <span className={cx(styles['status-text'])}>
          {dict('PC.Layouts.DynamicMenusLayout.ConversationItem.executing')}
        </span>
      )}
    </div>
  );
};

export default ConversationItem;
