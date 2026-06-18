import SvgIcon from '@/components/base/SvgIcon';
import { closestCenter, DndContext, type DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import classNames from 'classnames';
import React, { useState } from 'react';
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
  /** 拖拽排序：把 fromIndex 处的项移动到 toIndex */
  onReorder: (fromIndex: number, toIndex: number) => void;
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
  onReorder,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  if (!queue.length) return null;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = queue.findIndex((q) => q.id === active.id);
    const toIndex = queue.findIndex((q) => q.id === over.id);
    if (fromIndex < 0 || toIndex < 0) return;
    onReorder(fromIndex, toIndex);
  };

  return (
    <div className={cx(styles['queue-panel'])}>
      <div className={cx(styles['queue-header'])}>
        <div
          className={cx(styles['queue-header-left'], styles['queue-toggle'])}
          onClick={() => setCollapsed((c) => !c)}
        >
          <SvgIcon
            name="icons-common-arrow_down"
            className={cx(styles['toggle-icon'], {
              [styles['toggle-icon-collapsed']]: collapsed,
            })}
          />
          <div className={cx(styles['queue-title'])}>待发送</div>
          <div className={cx(styles['queue-count'])}>{queue.length}</div>
        </div>
        {!collapsed && (
          <button
            type="button"
            className={cx(styles['queue-clear'])}
            onClick={onClear}
          >
            清空全部
          </button>
        )}
      </div>
      {!collapsed && (
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={queue.map((q) => q.id)}
            strategy={verticalListSortingStrategy}
          >
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
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};

export default MessageQueuePanel;
