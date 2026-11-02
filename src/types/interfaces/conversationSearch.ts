import type { ConversationInfo, MessageInfo } from './conversationInfo';
export type ConversationSearchRouteInfo = Omit<
  ConversationInfo,
  'id' | 'agentId' | 'devSpaceId'
> & {
  id: string | number;
  agentId: string | number;
  devSpaceId?: string | number;
};
export interface ConversationMessageLocation {
  conversationId: number | string;
  messageId: string;
  messageIndex: number | string;
}
export interface ConversationMessageSearchHit
  extends Omit<ConversationMessageLocation, 'conversationId'> {
  conversation: ConversationSearchRouteInfo;
  snippet: string;
}
export interface ConversationMessageSearchPage {
  items: ConversationMessageSearchHit[];
  nextCursor: number | string | null;
  hasMore: boolean;
}
export interface ConversationMessageWindow extends ConversationMessageLocation {
  messages: MessageInfo[];
}
