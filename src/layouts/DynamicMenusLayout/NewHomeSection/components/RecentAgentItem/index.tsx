import agentImage from '@/assets/images/agent_image.png';
import ConversationContextMenu from '@/components/business-component/ConversationContextMenu';
import { dict } from '@/services/i18nRuntime';
import { TaskStatus } from '@/types/enums/agent';
import { AgentInfo } from '@/types/interfaces/agent';
import {
  ExclamationCircleFilled,
  PushpinFilled,
  StarFilled,
} from '@ant-design/icons';
import classNames from 'classnames';
import React, { useState } from 'react';
import { formatModifiedTime, getExecutingConversationCount } from '../../utils';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 分组展开时默认展示的最近会话条数,超出经「查看更多」展开 */
const PREVIEW_SESSION_COUNT = 3;

/** 会话本地标记(置顶/归档/收藏过渡方案),驱动子条目图标与归档过滤 */
export interface RecentConversationFlags {
  pinned: number[];
  archived: number[];
  collected: number[];
}

interface RecentAgentItemProps {
  item: AgentInfo;
  isActive: boolean;
  onClick: () => void;
  onConversationClick: (conversationId: number | string) => void;
  conversationFlags?: RecentConversationFlags;
}

/**
 * 「最近」Tab 智能体分组项。
 *
 * 组头 = 头像 + 名称 + 最新会话副标题 + 「执行中(N)」徽标 + 时间;
 * 组体 = 该智能体的最近会话列表,默认收起。
 *
 * 展开条件(满足任一):1) 有执行中的会话;2) 智能体被选中(当前路由);
 * 3) 用户点击组头。用户手动收起优先于自动展开。
 *
 * 会话子条目:执行中绿点 / 失败红叹号状态徽标,置顶/收藏图标,
 * 悬停「⋯」与右键菜单(复用 ConversationContextMenu),超过 3 条经「查看更多」展开。
 */
const RecentAgentItem: React.FC<RecentAgentItemProps> = ({
  item,
  isActive,
  onClick,
  onConversationClick,
  conversationFlags,
}) => {
  // undefined = 未手动干预,跟随自动展开规则
  const [manualState, setManualState] = useState<'open' | 'collapsed'>();
  // 「查看更多」:默认截断 3 条,点击后展示全部
  const [showAllSessions, setShowAllSessions] = useState(false);

  const conversationList = item.conversationList ?? [];
  const archivedSet = new Set((conversationFlags?.archived ?? []).map(Number));
  const pinnedSet = new Set((conversationFlags?.pinned ?? []).map(Number));
  const collectedSet = new Set(
    (conversationFlags?.collected ?? []).map(Number),
  );
  // 已归档会话不在「最近」分组展示(与会话记录 Tab 一致)
  const visibleConversations = conversationList.filter(
    (conversation) => !archivedSet.has(Number(conversation.id)),
  );
  const executingCount = getExecutingConversationCount(conversationList);
  const expanded =
    manualState === 'collapsed'
      ? false
      : manualState === 'open' || executingCount > 0 || isActive;

  const latestConversation = conversationList[0];
  const subtitle = latestConversation?.topic || item.description;
  const time = formatModifiedTime(item.modified);

  const handleHeadClick = () => {
    // 无可展示会话的智能体没有可展开内容,保持原行为:点击进入智能体
    if (visibleConversations.length === 0) {
      onClick();
      return;
    }
    setManualState(expanded ? 'collapsed' : 'open');
  };

  const sessionSlice = showAllSessions
    ? visibleConversations
    : visibleConversations.slice(0, PREVIEW_SESSION_COUNT);

  return (
    <div
      className={cx(styles.group, {
        [styles.active]: isActive,
      })}
    >
      <div
        className={cx(styles.head)}
        onClick={handleHeadClick}
        role="button"
        tabIndex={-1}
      >
        <div className={cx(styles.avatar)}>
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
        <div className={cx(styles.info)}>
          <span className={cx(styles.title)} title={item.name}>
            {item.name}
          </span>
          {subtitle && (
            <span className={cx(styles.subtitle)} title={subtitle}>
              {subtitle}
            </span>
          )}
        </div>
        <div className={cx(styles.side)}>
          {executingCount > 0 && (
            <span className={cx(styles.badge)}>
              {dict('PC.Layouts.DynamicMenusLayout.ConversationItem.executing')}
              ({executingCount})
            </span>
          )}
          <span className={cx(styles.time)}>{time}</span>
        </div>
      </div>
      {expanded && visibleConversations.length > 0 && (
        <div className={cx(styles.sessions)}>
          {sessionSlice.map((conversation) => {
            const conversationId = Number(conversation.id);
            return (
              <ConversationContextMenu
                key={conversation.id}
                conversationId={conversationId}
                currentTopic={conversation.topic ?? ''}
                pinned={pinnedSet.has(conversationId)}
                collected={collectedSet.has(conversationId)}
                showMoreButton
              >
                {(moreButton) => (
                  <div
                    className={cx(styles.session)}
                    onClick={() => onConversationClick(conversation.id)}
                  >
                    {conversation.taskStatus === TaskStatus.EXECUTING && (
                      <span
                        className={cx(styles['status-dot'])}
                        aria-label={dict(
                          'PC.Layouts.DynamicMenusLayout.ConversationItem.executing',
                        )}
                      />
                    )}
                    {conversation.taskStatus === TaskStatus.FAILED && (
                      <ExclamationCircleFilled
                        className={cx(styles['status-failed'])}
                        aria-label={dict(
                          'PC.Layouts.DynamicMenusLayout.NewHomeSection.failedTask',
                        )}
                      />
                    )}
                    {pinnedSet.has(conversationId) && (
                      <PushpinFilled className={cx(styles['pin-icon'])} />
                    )}
                    <span
                      className={cx(styles['session-topic'])}
                      title={conversation.topic || undefined}
                    >
                      {conversation.topic ||
                        dict('PC.Utils.ChatUtils.newConversation')}
                    </span>
                    {collectedSet.has(conversationId) && (
                      <StarFilled className={cx(styles['star-icon'])} />
                    )}
                    {moreButton}
                    {conversation.modified && (
                      <span className={cx(styles['session-time'])}>
                        {formatModifiedTime(conversation.modified)}
                      </span>
                    )}
                  </div>
                )}
              </ConversationContextMenu>
            );
          })}
          {visibleConversations.length > PREVIEW_SESSION_COUNT && (
            <div
              className={cx(styles['view-more'])}
              onClick={() => setShowAllSessions(!showAllSessions)}
            >
              {showAllSessions
                ? dict(
                    'PC.Layouts.DynamicMenusLayout.NewHomeSection.collapseSessions',
                  )
                : `${dict('PC.Components.AgentConversation.viewMore')} (${
                    visibleConversations.length
                  })`}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecentAgentItem;
