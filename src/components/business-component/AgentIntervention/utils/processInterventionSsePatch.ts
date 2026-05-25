import type {
  ConversationChatResponse,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';
import { applyAcpPermissionSseEvent } from './applyAcpPermissionSseEvent';
import { applyMcpAskToolCallSseEvent } from './applyMcpAskToolCallSseEvent';

export function processInterventionSsePatch(
  res: ConversationChatResponse,
  currentMessage: MessageInfo,
): MessageInfo | null {
  return (
    applyAcpPermissionSseEvent(res, currentMessage) ??
    applyMcpAskToolCallSseEvent(res, currentMessage)
  );
}
