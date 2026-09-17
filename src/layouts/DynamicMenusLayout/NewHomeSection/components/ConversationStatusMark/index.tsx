import { dict } from '@/services/i18nRuntime';
import { TaskStatus } from '@/types/enums/agent';
import { LoadingOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface ConversationStatusMarkProps {
  /** 会话任务状态：EXECUTING 时行首转圈（未读蓝点被抑制） */
  taskStatus?: TaskStatus;
  /** 会话结束未读（前端内存态蓝点，见 NewHomeSection/finishedConversationUnread） */
  unread?: boolean;
}

/**
 * 会话行首状态标记（单栏左栏会话行统一槽位，2026-09-17 定调）：
 * 执行中 → loading 转圈（替换原「执行中」文字胶囊标签）；
 * 结束未读 → 品牌色静态蓝点（不做动画，兼容「减弱动态效果」）；
 * 其余不渲染。互斥——执行中抑制蓝点，再次结束后时间戳刷新、蓝点重新生效。
 */
const ConversationStatusMark: React.FC<ConversationStatusMarkProps> = ({
  taskStatus,
  unread,
}) => {
  if (taskStatus === TaskStatus.EXECUTING) {
    return (
      <LoadingOutlined
        spin
        className={cx(styles['mark-spin'])}
        aria-label={dict(
          'PC.Layouts.DynamicMenusLayout.ConversationItem.executing',
        )}
      />
    );
  }
  if (unread) {
    return (
      <span
        className={cx(styles['mark-dot'])}
        aria-label={dict(
          'PC.Layouts.DynamicMenusLayout.ConversationItem.unreadFinished',
        )}
      />
    );
  }
  return null;
};

export default ConversationStatusMark;
