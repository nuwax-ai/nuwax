import agentImage from '@/assets/images/agent_image.png';
import { dict } from '@/services/i18nRuntime';
import { AgentInfo } from '@/types/interfaces/agent';
import classNames from 'classnames';
import React, { useState } from 'react';
import { formatModifiedTime, getExecutingConversationCount } from '../../utils';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 分组展开时最多展示的最近会话条数 */
const PREVIEW_SESSION_COUNT = 3;

interface RecentAgentItemProps {
  item: AgentInfo;
  isActive: boolean;
  onClick: () => void;
  onConversationClick: (conversationId: number | string) => void;
}

/**
 * 「最近」Tab 智能体分组项。
 *
 * 组头 = 头像 + 名称 + 最新会话副标题 + 「执行中(N)」徽标(或「最近会话」标签)+ 时间;
 * 组体 = 该智能体的最近会话列表,默认收起。
 *
 * 展开条件(满足任一):1) 有执行中的会话;2) 智能体被选中(当前路由);
 * 3) 用户点击组头。用户手动收起优先于自动展开。
 */
const RecentAgentItem: React.FC<RecentAgentItemProps> = ({
  item,
  isActive,
  onClick,
  onConversationClick,
}) => {
  // undefined = 未手动干预,跟随自动展开规则
  const [manualState, setManualState] = useState<'open' | 'collapsed'>();

  const conversationList = item.conversationList ?? [];
  const executingCount = getExecutingConversationCount(conversationList);
  const expanded =
    manualState === 'collapsed'
      ? false
      : manualState === 'open' || executingCount > 0 || isActive;

  const latestConversation = conversationList[0];
  const subtitle = latestConversation?.topic || item.description;
  const time = formatModifiedTime(item.modified);

  const handleHeadClick = () => {
    // 无会话的智能体没有可展开内容,保持原行为:点击进入智能体
    if (conversationList.length === 0) {
      onClick();
      return;
    }
    setManualState(expanded ? 'collapsed' : 'open');
  };

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
          {executingCount > 0 ? (
            <span className={cx(styles.badge)}>
              {dict('PC.Layouts.DynamicMenusLayout.ConversationItem.executing')}
              ({executingCount})
            </span>
          ) : (
            conversationList.length > 0 && (
              <span className={cx(styles['recent-tag'])}>
                {dict(
                  'PC.Layouts.DynamicMenusLayout.HomeSection.recentSessionsTag',
                )}
              </span>
            )
          )}
          <span className={cx(styles.time)}>{time}</span>
        </div>
      </div>
      {expanded && conversationList.length > 0 && (
        <div className={cx(styles.sessions)}>
          {conversationList
            .slice(0, PREVIEW_SESSION_COUNT)
            .map((conversation) => (
              <div
                key={conversation.id}
                className={cx(styles.session)}
                onClick={() => onConversationClick(conversation.id)}
              >
                <span
                  className={cx(styles['session-topic'])}
                  title={conversation.topic || undefined}
                >
                  {conversation.topic ||
                    dict('PC.Utils.ChatUtils.newConversation')}
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default RecentAgentItem;
