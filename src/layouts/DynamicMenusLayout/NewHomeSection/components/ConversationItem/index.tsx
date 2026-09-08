import ConversationContextMenu from '@/components/business-component/ConversationContextMenu';
import { dict } from '@/services/i18nRuntime';
import { TaskStatus } from '@/types/enums/agent';
import { ConversationInfo } from '@/types/interfaces/conversationInfo';
import { PushpinFilled, StarFilled } from '@ant-design/icons';
import { Typography } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { formatRelativeTime } from '../../utils';
import styles from './index.less';

const cx = classNames.bind(styles);

interface ConversationItemProps {
  compact?: boolean;
  item: ConversationInfo;
  isActive: boolean;
  onClick: () => void;
  /** 本地标记（过渡方案）：置顶，影响列表排序与本项图标 */
  pinned?: boolean;
  /** 本地标记：收藏，仅图标展示 */
  collected?: boolean;
  /** 本地标记：归档（已归档视图内展示，供菜单「取消归档」） */
  archived?: boolean;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  item,
  compact = false,
  isActive,
  onClick,
  pinned = false,
  collected = false,
  archived = false,
}) => {
  const executingText = dict(
    'PC.Layouts.DynamicMenusLayout.ConversationItem.executing',
  );
  const hasAgentName =
    !compact && Boolean(item.agent?.name && item.agent.name.trim());

  return (
    <ConversationContextMenu
      conversationId={item.id}
      currentTopic={
        item.topic || item.agent?.name || dict('PC.Constants.Menus.newChat')
      }
      pinned={pinned}
      archived={archived}
      collected={collected}
      showMoreButton
    >
      {(moreButton) => (
        <div
          className={cx(styles['conversation-item'], {
            [styles['active']]: isActive,
            [styles.compact]: compact,
          })}
          onClick={onClick}
          role="button"
          tabIndex={0}
          aria-current={isActive ? 'page' : undefined}
          onKeyDown={(event) => {
            if (event.target !== event.currentTarget) return;
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onClick();
            }
          }}
        >
          <div className={cx(styles['conversation-item-content'])}>
            <div className={cx(styles['conversation-topic-row'])}>
              {pinned && <PushpinFilled className={cx(styles['pin-icon'])} />}
              <Typography.Text
                className={cx(styles['conversation-topic'])}
                ellipsis={true}
              >
                {item.topic ||
                  item.agent?.name ||
                  dict('PC.Constants.Menus.newChat')}
              </Typography.Text>
              {collected && <StarFilled className={cx(styles['star-icon'])} />}
              {item.taskStatus === TaskStatus.EXECUTING && (
                <span className={cx(styles['status-tag'])}>
                  {executingText}
                </span>
              )}
              {moreButton}
              {!hasAgentName && (
                <span className={cx(styles['conversation-date'])}>
                  {formatRelativeTime(item.modified)}
                </span>
              )}
            </div>
            {hasAgentName && (
              <div className={cx(styles['conversation-meta'])}>
                <Typography.Text
                  className={cx(styles['conversation-agent-name'])}
                  ellipsis={true}
                >
                  {item.agent?.name}
                </Typography.Text>
                <span className={cx(styles['conversation-date'])}>
                  {formatRelativeTime(item.modified)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </ConversationContextMenu>
  );
};

export default ConversationItem;
