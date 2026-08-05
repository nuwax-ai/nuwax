import { dict } from '@/services/i18nRuntime';
import { TaskStatus } from '@/types/enums/agent';
import { ConversationInfo } from '@/types/interfaces/conversationInfo';
import { Typography } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { formatModifiedTime } from '../../utils';
import styles from './index.less';

const cx = classNames.bind(styles);

interface ConversationItemProps {
  item: ConversationInfo;
  isActive: boolean;
  onClick: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  item,
  isActive,
  onClick,
}) => {
  const executingText = dict(
    'PC.Layouts.DynamicMenusLayout.ConversationItem.executing',
  );

  return (
    <div
      className={cx(styles['conversation-item'], {
        [styles.active]: isActive,
      })}
      onClick={onClick}
    >
      <div className={cx(styles['conversation-item-content'])}>
        <div className={cx(styles['conversation-topic-row'])}>
          <Typography.Text
            className={cx(styles['conversation-topic'])}
            ellipsis={true}
          >
            {item.topic}
          </Typography.Text>
          {item.taskStatus === TaskStatus.EXECUTING && (
            <span className={cx(styles['status-tag'])}>{executingText}</span>
          )}
        </div>
        <div className={cx(styles['conversation-meta'])}>
          <Typography.Text
            className={cx(styles['conversation-agent-name'])}
            ellipsis={true}
          >
            {item.agent?.name}
          </Typography.Text>
          <span className={cx(styles['conversation-date'])}>
            {formatModifiedTime(item.modified)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ConversationItem;
