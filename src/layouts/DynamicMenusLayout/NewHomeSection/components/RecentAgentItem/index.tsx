import agentImage from '@/assets/images/agent_image.png';
import { AgentInfo } from '@/types/interfaces/agent';
import { Typography } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { formatModifiedTime } from '../../utils';
import styles from '../ConversationItem/index.less';

const cx = classNames.bind(styles);

interface RecentAgentItemProps {
  item: AgentInfo;
  isActive: boolean;
  onClick: () => void;
}

const RecentAgentItem: React.FC<RecentAgentItemProps> = ({
  item,
  isActive,
  onClick,
}) => (
  <div
    className={cx(styles['conversation-item'], {
      [styles.active]: isActive,
    })}
    onClick={onClick}
  >
    <div className={cx(styles['avatar-container'])}>
      <img
        src={item.icon || agentImage}
        alt={item.name}
        className={cx(styles['avatar-img'])}
        onError={(event) => {
          event.currentTarget.onerror = null;
          event.currentTarget.src = agentImage;
        }}
      />
    </div>
    <div className={cx(styles['conversation-item-content'])}>
      <div className={cx(styles['conversation-topic-row'])}>
        <Typography.Text className={cx(styles['conversation-topic'])} ellipsis>
          {item.name}
        </Typography.Text>
        <span className={cx(styles['conversation-date'])}>
          {formatModifiedTime(item.modified)}
        </span>
      </div>
      <div className={cx(styles['conversation-meta'])}>
        <Typography.Text
          className={cx(styles['conversation-agent-name'])}
          ellipsis
        >
          {item.description}
        </Typography.Text>
      </div>
    </div>
  </div>
);

export default RecentAgentItem;
