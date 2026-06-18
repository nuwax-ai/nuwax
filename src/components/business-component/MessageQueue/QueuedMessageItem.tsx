import {
  CloseOutlined,
  EditOutlined,
  HolderOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Tooltip } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';
import type { QueuedMessage } from './types';

const cx = classNames.bind(styles);

export interface QueuedMessageItemProps {
  message: QueuedMessage;
  onSendNow: (message: QueuedMessage) => void;
  onDelete: (id: string) => void;
  onEdit: (message: QueuedMessage) => void;
}

/** 单条待发送消息项（可拖拽排序，手柄触发） */
const QueuedMessageItem: React.FC<QueuedMessageItemProps> = ({
  message,
  onSendNow,
  onDelete,
  onEdit,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: message.id });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cx(styles.container, { [styles['is-dragging']]: isDragging })}
      {...attributes}
    >
      <div className={cx(styles.card)}>
        {/* 拖拽手柄：仅手柄触发拖拽，避免误触操作按钮 */}
        <span
          ref={setActivatorNodeRef}
          {...listeners}
          className={cx(styles['drag-handle'])}
          aria-label="拖动排序"
        >
          <HolderOutlined />
        </span>
        <div className={cx(styles.body)}>
          <div className={cx(styles.text)} title={message.text}>
            {message.text}
          </div>
          {message.files && message.files.length > 0 && (
            <div className={cx(styles['file-badge'])}>
              +{message.files.length}
            </div>
          )}
        </div>
        <div className={cx(styles.actions)}>
          <Tooltip title="立即发送（将停止当前会话）">
            <span
              className={cx(styles['action-btn'], styles['send-btn'])}
              onClick={() => onSendNow(message)}
            >
              <SendOutlined />
            </span>
          </Tooltip>
          <Tooltip title="编辑消息">
            <span
              className={cx(styles['action-btn'], styles['icon-btn'])}
              onClick={() => onEdit(message)}
            >
              <EditOutlined />
            </span>
          </Tooltip>
          <Tooltip title="删除">
            <span
              className={cx(
                styles['action-btn'],
                styles['icon-btn'],
                styles['delete-btn'],
              )}
              onClick={() => onDelete(message.id)}
            >
              <CloseOutlined />
            </span>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default QueuedMessageItem;
