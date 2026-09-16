import ConversationContextMenu from '@/components/business-component/ConversationContextMenu';
import { dict } from '@/services/i18nRuntime';
import { TaskStatus } from '@/types/enums/agent';
import { ConversationInfo } from '@/types/interfaces/conversationInfo';
import { PushpinFilled } from '@ant-design/icons';
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
  /** 服务端置顶状态，影响列表排序与本项图标 */
  pinned?: boolean;
  /** 服务端归档状态（已归档视图内展示，供菜单「取消归档」） */
  archived?: boolean;
  /** 服务端收藏状态（菜单「收藏/取消收藏」按此选择接口路径与文案） */
  collected?: boolean;
  onFlagChanged?: (kind: 'pinned' | 'archived', enabled: boolean) => void;
  onCollectedChanged?: (collected: boolean) => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  item,
  compact = false,
  isActive,
  onClick,
  pinned = false,
  archived = false,
  collected = false,
  onFlagChanged,
  onCollectedChanged,
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
      onFlagChanged={onFlagChanged}
      onCollectedChanged={onCollectedChanged}
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
              {/* 原生省略号替代 Typography.Text ellipsis：antd 的省略检测会在
                  每次重渲染插入 <em> 强制同步重排，长列表高频刷新下造成秒级卡顿 */}
              <span className={cx(styles['conversation-topic'])}>
                {item.topic ||
                  item.agent?.name ||
                  dict('PC.Constants.Menus.newChat')}
              </span>
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
                <span className={cx(styles['conversation-agent-name'])}>
                  {item.agent?.name}
                </span>
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
