import { dict } from '@/services/i18nRuntime';
import { TaskStatus } from '@/types/enums/agent';
import { ExclamationCircleFilled, LoadingOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface ConversationStatusMarkProps {
  /** 会话任务状态：执行中、失败优先于结束未读 */
  taskStatus?: TaskStatus;
  /** 会话结束未读（前端内存态蓝点，见 NewHomeSection/finishedConversationUnread） */
  unread?: boolean;
  /** 无运行态状态时占用同一槽位的业务图标（例如置顶） */
  fallback?: React.ReactNode;
}

/**
 * 会话行首状态标记（单栏左栏会话行统一槽位，2026-09-17 定调）：
 * 执行中 → loading 转圈（替换原「执行中」文字胶囊标签）；
 * 失败 → 红色叹号；
 * 结束未读 → 品牌色静态蓝点（不做动画，兼容「减弱动态效果」）；
 * 其余 → 调用方 fallback。优先级固定为：执行中 > 失败 > 未读 > fallback。
 */
const ConversationStatusMark: React.FC<ConversationStatusMarkProps> = ({
  taskStatus,
  unread,
  fallback,
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
  if (taskStatus === TaskStatus.FAILED) {
    return (
      <ExclamationCircleFilled
        className={cx(styles['mark-failed'])}
        aria-label={dict(
          'PC.Layouts.DynamicMenusLayout.NewHomeSection.failedTask',
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
  return <>{fallback}</>;
};

export default ConversationStatusMark;
