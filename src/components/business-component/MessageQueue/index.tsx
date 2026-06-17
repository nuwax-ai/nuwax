import classNames from 'classnames';
import React from 'react';
import QueuedMessageItem from './QueuedMessageItem';
import styles from './index.less';
import type { QueuedMessage } from './types';

export type { QueuedMessage } from './types';
export { useChatMessageQueue } from './useChatMessageQueue';
export { useUnifiedChatQueue } from './useUnifiedChatQueue';

const cx = classNames.bind(styles);

export interface MessageQueuePanelProps {
  /** 待发送消息列表 */
  queue: QueuedMessage[];
  /** 立即发送（停止当前会话后发送该消息） */
  onSendNow: (message: QueuedMessage) => void;
  /** 删除某条 */
  onDelete: (id: string) => void;
  /** 编辑某条（回填到输入框） */
  onEdit: (message: QueuedMessage) => void;
  /** 清空全部 */
  onClear: () => void;
}

/**
 * 待发送消息队列面板
 * 渲染于聊天输入框上方，展示会话活跃期间排队等待发送的消息
 */
const MessageQueuePanel: React.FC<MessageQueuePanelProps> = ({
  queue,
  onSendNow,
  onDelete,
  onEdit,
  onClear,
}) => {
  if (!queue.length) return null;

  return (
    <div className={cx(styles['queue-panel'])}>
      <div className={cx(styles['queue-header'])}>
        <div className={cx(styles['queue-header-left'])}>
          <div className={cx(styles['queue-title'])}>待发送</div>
          <div className={cx(styles['queue-count'])}>{queue.length}</div>
        </div>
        <button
          type="button"
          className={cx(styles['queue-clear'])}
          onClick={onClear}
        >
          清空全部
        </button>
      </div>
      <div className={cx(styles['queue-list'])}>
        {queue.map((qMsg) => (
          <QueuedMessageItem
            key={qMsg.id}
            message={qMsg}
            onSendNow={onSendNow}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}
      </div>
    </div>
  );
};

export default MessageQueuePanel;
