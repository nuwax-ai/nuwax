import ChatView from '@/components/ChatView';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { apiLocateConversationMessage } from '@/services/conversationSearch';
import { dict } from '@/services/i18nRuntime';
import type { RoleInfo } from '@/types/interfaces/conversationInfo';
import type { ConversationMessageWindow } from '@/types/interfaces/conversationSearch';
import { readConversationMessageLocation } from '@/utils/conversationMessageLocation';
import { Alert, Button, Modal, Spin } from 'antd';
import { useEffect, useRef, useState } from 'react';
import styles from './ConversationMessageSearchLocation.less';

const prefix = 'PC.Layouts.DynamicMenusLayout.SidebarSearchModal';
/** 搜索的旧消息只读回看，不向运行中的会话 store 注入不连续的历史片段。 */
export function ConversationMessageSearchLocation({
  conversationId,
  roleInfo,
  search,
  onClose,
}: {
  conversationId?: string | number;
  roleInfo: RoleInfo;
  search: string;
  onClose: () => void;
}) {
  const target = readConversationMessageLocation(search, conversationId);
  const key = target
    ? `${target.conversationId}:${target.messageIndex}:${target.messageId}`
    : '';
  const [retry, setRetry] = useState(0);
  const [view, setView] = useState<{
    key: string;
    data?: ConversationMessageWindow;
    error?: boolean;
  }>({ key: '' });
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!target) return;
    let cancelled = false;
    setView({ key });
    void apiLocateConversationMessage(target)
      .then((response) => {
        const data = response.data;
        if (
          response.code !== SUCCESS_CODE ||
          !data ||
          String(data.conversationId) !== String(target.conversationId) ||
          String(data.messageId) !== target.messageId ||
          String(data.messageIndex) !== String(target.messageIndex) ||
          !data.messages.some(
            (message) => String(message.id) === target.messageId,
          )
        )
          throw new Error('Message unavailable');
        if (!cancelled) setView({ key, data });
      })
      .catch(() => {
        if (!cancelled) setView({ key, error: true });
      });
    return () => {
      cancelled = true;
    };
  }, [key, retry]);
  const ready: typeof view = view.key === key ? view : { key };
  const scrollToTarget = () =>
    container.current
      ?.querySelector<HTMLElement>('[data-search-target="true"]')
      ?.scrollIntoView({ block: 'center' });
  useEffect(() => {
    if (ready.data) scrollToTarget();
  }, [ready.data]);

  return (
    <Modal
      open={!!target}
      title={dict(`${prefix}.messageLocationTitle`)}
      onCancel={onClose}
      footer={null}
      width={900}
      afterOpenChange={(open) => {
        if (open) scrollToTarget();
      }}
    >
      <div className={styles.window} ref={container}>
        {target && !ready.data && !ready.error && <Spin />}
        {ready.error && (
          <Alert
            type="warning"
            message={dict(`${prefix}.messageUnavailable`)}
            action={
              <Button onClick={() => setRetry((value) => value + 1)}>
                {dict(`${prefix}.messageRetry`)}
              </Button>
            }
          />
        )}
        {ready.data?.messages.map((message) => (
          <article
            key={message.id}
            data-search-message-id={message.id}
            data-search-target={String(message.id) === target?.messageId}
            className={
              String(message.id) === target?.messageId
                ? styles.target
                : undefined
            }
          >
            <ChatView
              conversationId={conversationId}
              messageInfo={message}
              roleInfo={roleInfo}
              mode="none"
              showStatusDesc={false}
            />
          </article>
        ))}
      </div>
    </Modal>
  );
}
