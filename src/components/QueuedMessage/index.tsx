import type { QueuedMessage } from '@/types/interfaces/messageQueue';
import { CloseOutlined, EditOutlined, SendOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface QueuedMessageProps {
  message: QueuedMessage;
  onSendNow: (message: QueuedMessage) => void;
  onDelete: (id: string) => void;
  onEdit: (message: QueuedMessage) => void;
}

const QueuedMessageComponent: React.FC<QueuedMessageProps> = ({
  message,
  onSendNow,
  onDelete,
  onEdit,
}) => {
  return (
    <div className={cx(styles.container)}>
      <div className={cx(styles.card)}>
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

export default QueuedMessageComponent;
