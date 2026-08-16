import {
  CONVERSATION_CHAT_SUB_URL,
  CONVERSATION_CONNECTION_URL,
} from '@/constants/common.constants';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import type {
  ConversationChatParams,
  ConversationChatResponse,
} from '@/types/interfaces/conversationInfo';
import { createSSEConnection } from '@/utils/fetchEventSourceConversationInfo';

/**
 * 新线（runtime session）的 SSE 传输建立层（双线方案 §3.2-2）。
 *
 * 只负责连接的建立与组装（URL/headers/body/token），事件语义（runId 归属、投影、
 * 收尾）由 session 编排消费。回调形状与 createSSEConnection 一致。
 */
export interface LiveStreamCallbacks {
  onOpen?: () => void;
  onMessage: (res: ConversationChatResponse) => void;
  onClose: () => void;
  onError: () => void;
}

export interface ResumeStreamCallbacks {
  onMessage: (res: ConversationChatResponse) => void;
  onClose: () => void;
}

/** 建立 live 会话流（POST /api/agent/conversation/chat），返回 abort 句柄 */
export function openLiveConversationStream(
  params: ConversationChatParams,
  callbacks: LiveStreamCallbacks,
): () => void {
  const token = localStorage.getItem(ACCESS_TOKEN) ?? '';
  return createSSEConnection({
    url: CONVERSATION_CONNECTION_URL,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json, text/plain, */* ',
    },
    body: params,
    onOpen: callbacks.onOpen,
    onMessage: callbacks.onMessage,
    onClose: callbacks.onClose,
    onError: callbacks.onError,
  });
}

/** 建立 sub 恢复流（GET /api/agent/conversation/chat/sub/:id），返回 abort 句柄 */
export function openResumeConversationStream(
  conversationId: number | string,
  callbacks: ResumeStreamCallbacks,
): () => void {
  const token = localStorage.getItem(ACCESS_TOKEN) ?? '';
  return createSSEConnection({
    url: `${CONVERSATION_CHAT_SUB_URL}/${conversationId}`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json, text/plain, */*',
    },
    onMessage: callbacks.onMessage,
    onClose: callbacks.onClose,
  });
}
