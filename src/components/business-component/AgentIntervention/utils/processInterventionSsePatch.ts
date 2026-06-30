import type {
  ConversationChatResponse,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';
import { applyAcpPermissionSseEvent } from './applyAcpPermissionSseEvent';
import { applyMcpAskToolCallSseEvent } from './applyMcpAskToolCallSseEvent';
import { reconcileMessageAcpPermissionStatuses } from './reconcileAcpPermissionStatus';

export function processInterventionSsePatch(
  res: ConversationChatResponse,
  currentMessage: MessageInfo,
  contextMessageList?: MessageInfo[],
): MessageInfo | null {
  const patched =
    applyAcpPermissionSseEvent(res, currentMessage) ??
    applyMcpAskToolCallSseEvent(res, currentMessage);

  if (!patched) {
    return null;
  }

  return reconcileMessageAcpPermissionStatuses(
    patched,
    contextMessageList ?? [patched],
  );
}
