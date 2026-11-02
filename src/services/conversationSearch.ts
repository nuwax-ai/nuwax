import type {
  ConversationMessageLocation,
  ConversationMessageSearchPage,
  ConversationMessageWindow,
} from '@/types/interfaces/conversationSearch';
import type { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';
export const apiSearchConversationMessages = (data: {
  keyword: string;
  size: number;
  beforeIndex?: number | string;
}): Promise<RequestResponse<ConversationMessageSearchPage>> =>
  request('/api/agent/conversation/message/search', { method: 'POST', data });
export const apiLocateConversationMessage = (
  data: ConversationMessageLocation,
): Promise<RequestResponse<ConversationMessageWindow>> =>
  request('/api/agent/conversation/message/locate', { method: 'POST', data });
