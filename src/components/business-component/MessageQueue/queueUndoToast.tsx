import { t } from '@/services/i18nRuntime';
import { message } from 'antd';

const UNDO_TOAST_KEY = 'message-queue-undo';
/** 撤销窗口（秒）：超时后删除即为最终态 */
export const QUEUE_UNDO_DURATION_SECONDS = 5;

let hasActiveUndoToast = false;

/** 队列删除/清空后的「撤销」提示；同一时刻只保留最近一次，后一次覆盖前一次 */
export const showQueueUndoToast = (text: string, onUndo: () => void) => {
  hasActiveUndoToast = true;
  message.open({
    key: UNDO_TOAST_KEY,
    type: 'info',
    duration: QUEUE_UNDO_DURATION_SECONDS,
    onClose: () => {
      hasActiveUndoToast = false;
    },
    content: (
      <span>
        {text}
        <a
          style={{ marginLeft: 12 }}
          onClick={() => {
            hasActiveUndoToast = false;
            message.destroy(UNDO_TOAST_KEY);
            onUndo();
          }}
        >
          {t('PC.Components.MessageQueue.undo')}
        </a>
      </span>
    ),
  });
};

/** 切换会话等场景：撤销已无意义（视为确认删除），仅在有活跃提示时关闭 */
export const destroyQueueUndoToast = () => {
  if (!hasActiveUndoToast) return;
  hasActiveUndoToast = false;
  message.destroy(UNDO_TOAST_KEY);
};
