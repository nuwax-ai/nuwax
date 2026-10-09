import { dict } from '@/services/i18nRuntime';
import { TaskStatus } from '@/types/enums/agent';
import { LoadingOutlined, WarningOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface ConversationStatusMarkProps {
  /** 会话任务状态：执行中、失败优先于业务图标 */
  taskStatus?: TaskStatus;
  /** 无运行态状态时占用同一槽位的业务图标（例如置顶） */
  fallback?: React.ReactNode;
}

/**
 * 会话状态标记（单栏侧栏会话行统一槽位）：
 * 执行中 → loading 转圈（替换原「执行中」文字胶囊标签）；
 * 失败 → 叹号；
 * 其余 → 调用方 fallback。优先级固定为：执行中 > 失败 > fallback。
 */
const ConversationStatusMark: React.FC<ConversationStatusMarkProps> = ({
  taskStatus,
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
      <WarningOutlined
        className={cx(styles['mark-failed'])}
        aria-label={dict(
          'PC.Layouts.DynamicMenusLayout.NewHomeSection.failedTask',
        )}
      />
    );
  }
  return <>{fallback}</>;
};

export default ConversationStatusMark;
