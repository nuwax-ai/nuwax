import type {
  ConversationChatResponse,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';
import { applyAcpPermissionSseEvent } from './applyAcpPermissionSseEvent';
import { applyMcpAskToolCallSseEvent } from './applyMcpAskToolCallSseEvent';
import { applyOpenUiToolCallSseEvent } from './applyOpenUiToolCallSseEvent';
import { reconcileMessageAcpPermissionStatuses } from './reconcileAcpPermissionStatus';

export function processInterventionSsePatch(
  res: ConversationChatResponse,
  currentMessage: MessageInfo,
  contextMessageList?: MessageInfo[],
): MessageInfo | null {
  // OpenUI 必须在 ask-question 之前：后者对 render_openui 直接 return null，
  // 若排在后面会错过把 ACP rawOutput.openui-ref 写入 processingList 的机会。
  const patched =
    applyAcpPermissionSseEvent(res, currentMessage) ??
    applyOpenUiToolCallSseEvent(res, currentMessage) ??
    applyMcpAskToolCallSseEvent(res, currentMessage);

  if (!patched) {
    return null;
  }

  return reconcileMessageAcpPermissionStatuses(
    patched,
    contextMessageList ?? [patched],
  );
}
