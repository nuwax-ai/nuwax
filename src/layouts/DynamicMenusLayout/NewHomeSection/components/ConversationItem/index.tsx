import agentImage from '@/assets/images/agent_image.png';
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

  // 渲染智能体圆形头像，缺失或加载失败时使用默认图片兜底
  const renderAvatar = () => {
    const icon = item.icon || item.agent?.icon;
    const name = item.topic || item.agent?.name || '';

    return (
      <div className={cx(styles['avatar-container'])}>
        <img
          src={icon || agentImage}
          alt={name}
          className={cx(styles['avatar-img'])}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = agentImage;
          }}
        />
      </div>
    );
  };

  return (
    <div
      className={cx(styles['conversation-item'], {
        [styles.active]: isActive,
      })}
      onClick={onClick}
    >
      {renderAvatar()}
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
