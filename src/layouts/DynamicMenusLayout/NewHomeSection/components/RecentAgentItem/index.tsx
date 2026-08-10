import agentImage from '@/assets/images/agent_image.png';
import { dict } from '@/services/i18nRuntime';
import { TaskStatus } from '@/types/enums/agent';
import { AgentInfo } from '@/types/interfaces/agent';
import type { MenuProps } from 'antd';
import { Dropdown, Typography } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { formatModifiedTime, getExecutingConversationCount } from '../../utils';
import styles from '../ConversationItem/index.less';

const cx = classNames.bind(styles);

interface RecentAgentItemProps {
  item: AgentInfo;
  isActive: boolean;
  onClick: () => void;
  onConversationClick: (conversationId: number | string) => void;
}

const RecentAgentItem: React.FC<RecentAgentItemProps> = ({
  item,
  isActive,
  onClick,
  onConversationClick,
}) => {
  const executingCount = getExecutingConversationCount(item.conversationList);
  const executingConversations = (item.conversationList ?? []).filter(
    (conversation) => conversation.taskStatus === TaskStatus.EXECUTING,
  );
  const menuItems: MenuProps['items'] = executingConversations.map(
    (conversation) => ({
      key: conversation.id.toString(),
      label: (
        <Typography.Text
          className={cx(styles['executing-conversation-name'])}
          ellipsis
        >
          {conversation.topic || dict('PC.Utils.ChatUtils.newConversation')}
        </Typography.Text>
      ),
    }),
  );
  const handleMenuClick: MenuProps['onClick'] = ({ key, domEvent }) => {
    domEvent.stopPropagation();
    onConversationClick(key);
  };

  const hasDescription = Boolean(item.description && item.description.trim());

  const content = (
    <div
      className={cx(styles['conversation-item'], {
        [styles['active']]: isActive,
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
          <Typography.Text
            className={cx(styles['conversation-topic'])}
            ellipsis
          >
            {item.name}
          </Typography.Text>
          {executingCount > 0 && (
            <span className={cx(styles['status-tag'])}>
              {dict('PC.Layouts.DynamicMenusLayout.ConversationItem.executing')}
              ({executingCount})
            </span>
          )}
          {!hasDescription && (
            <span className={cx(styles['conversation-date'])}>
              {formatModifiedTime(item.modified)}
            </span>
          )}
        </div>
        {hasDescription && (
          <div className={cx(styles['conversation-meta'])}>
            <Typography.Text
              className={cx(styles['conversation-agent-name'])}
              ellipsis
            >
              {item.description}
            </Typography.Text>
            <span className={cx(styles['conversation-date'])}>
              {formatModifiedTime(item.modified)}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  if (executingConversations.length === 0) return content;

  return (
    <Dropdown
      menu={{ items: menuItems, onClick: handleMenuClick }}
      placement="rightTop"
      overlayClassName={cx(styles['executing-conversation-dropdown'])}
    >
      {content}
    </Dropdown>
  );
};

export default RecentAgentItem;
