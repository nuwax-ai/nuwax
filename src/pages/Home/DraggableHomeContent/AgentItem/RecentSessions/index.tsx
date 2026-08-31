import { dict } from '@/services/i18nRuntime';
import { TaskStatus } from '@/types/enums/agent';
import type { AgentRecentConversationInfo } from '@/types/interfaces/agent';
import { RightOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 展开后最多展示的最近会话条数 */
const MAX_VISIBLE_COUNT = 3;

interface RecentSessionsProps {
  /** 最近会话列表 */
  conversations: AgentRecentConversationInfo[];
  /** 是否展开 */
  expanded: boolean;
  /** 展开/收起回调 */
  onToggle: (expanded: boolean) => void;
  /** 会话条目点击 */
  onConversationClick: (conversationId: number | string) => void;
  /** 查看全部 */
  onViewAll: () => void;
}

/**
 * 智能体卡片「最近会话」折叠区
 * 默认收起；点击折叠头手动展开/收起；条目点击进入对应会话
 */
const RecentSessions: React.FC<RecentSessionsProps> = ({
  conversations,
  expanded,
  onToggle,
  onConversationClick,
  onViewAll,
}) => {
  const executingCount = conversations.filter(
    (conversation) => conversation.taskStatus === TaskStatus.EXECUTING,
  ).length;
  const visibleConversations = conversations.slice(0, MAX_VISIBLE_COUNT);

  const handleHeaderClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onToggle(!expanded);
  };

  return (
    // 会话区不触发卡片选中与拖拽
    <div
      className={cx(styles.recentSessions)}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div
        className={cx(styles.header)}
        onClick={handleHeaderClick}
        role="button"
        tabIndex={-1}
      >
        <span className={cx(styles.headerTitle)}>
          {dict('PC.Pages.HomeDrag.recentSessions')}
        </span>
        <span className={cx(styles.headerCount)}>({conversations.length})</span>
        {executingCount > 0 && (
          <span className={cx(styles.executingTag)}>
            {dict('PC.Pages.HomeDrag.executing')}
            {executingCount > 1 ? `(${executingCount})` : ''}
          </span>
        )}
        <RightOutlined
          className={cx(styles.arrow, { [styles.arrowExpanded]: expanded })}
        />
      </div>
      {expanded && (
        <div className={cx(styles.list)}>
          {visibleConversations.map((conversation) => {
            const executing = conversation.taskStatus === TaskStatus.EXECUTING;
            return (
              <div
                key={conversation.id}
                className={cx(styles.item, {
                  [styles.itemExecuting]: executing,
                })}
                onClick={(event) => {
                  event.stopPropagation();
                  onConversationClick(conversation.id);
                }}
              >
                <span
                  className={cx(styles.itemTopic)}
                  title={conversation.topic || undefined}
                >
                  {conversation.topic ||
                    dict('PC.Pages.HomeDrag.newConversation')}
                </span>
                {executing && (
                  <span className={cx(styles.itemExecutingTag)}>
                    {dict('PC.Pages.HomeDrag.executing')}
                  </span>
                )}
              </div>
            );
          })}
          <div
            className={cx(styles.viewAll)}
            onClick={(event) => {
              event.stopPropagation();
              onViewAll();
            }}
          >
            {dict('PC.Pages.HomeDrag.viewAllConversations')}
            <RightOutlined className={cx(styles.viewAllArrow)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentSessions;
