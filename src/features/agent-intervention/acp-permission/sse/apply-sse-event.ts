import { ConversationEventTypeEnum } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type {
  ConversationChatResponse,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';
import type { AcpPermissionInterventionRequest } from '../../types';
import { createInterventionTriggeredAt } from '../../utils/intervention-trigger';

/**
 * 解析 ACP 权限 SSE 事件，返回补丁后的消息；无匹配则返回 null
 */
export function applyAcpPermissionSseEvent(
  res: ConversationChatResponse,
  currentMessage: MessageInfo,
): MessageInfo | null {
  const { eventType } = res;
  const nestedEvent = (res as any).data;
  const eventEnvelope =
    nestedEvent?.messageType ||
    nestedEvent?.message_type ||
    nestedEvent?.subType ||
    nestedEvent?.sub_type
      ? nestedEvent
      : res;
  const envelopeSubType =
    (eventEnvelope as any).subType ?? (eventEnvelope as any).sub_type;
  const isAcpPermissionEvent =
    eventType === ConversationEventTypeEnum.ACP_REQUEST_PERMISSION ||
    (((eventEnvelope as any).message_type === 'acpRequestPermission' ||
      (eventEnvelope as any).messageType === 'acpRequestPermission') &&
      (envelopeSubType === 'AcpRequestPermission' ||
        envelopeSubType === 'request_permission'));

  if (!isAcpPermissionEvent) {
    return null;
  }

  const eventData =
    ((eventEnvelope as any).data &&
    typeof (eventEnvelope as any).data === 'object'
      ? (eventEnvelope as any).data
      : undefined) ??
    (res as any).data ??
    res;
  const reqPerm = eventData?.request_permission_request;
  const intervention = (eventData?._intervention ??
    eventData?.interventionRequest) as
    | AcpPermissionInterventionRequest
    | undefined;

  const sessionId =
    reqPerm?.session_id || intervention?.sessionId || eventData?.session_id;
  const toolCall = reqPerm?.tool_call || intervention?.acp?.request?.toolCall;
  const options = reqPerm?.options || intervention?.acp?.request?.options;
  const toolCallId =
    eventData?.tool_call_id || toolCall?.tool_call_id || toolCall?.toolCallId;

  if ((!intervention?.id && !sessionId) || !toolCall) {
    return null;
  }

  const interventionId = intervention?.id || `itv_${sessionId}_${toolCallId}`;
  const interactions = currentMessage.acpPermissionInteractions || [];
  if (interactions.some((item) => item.intervention.id === interventionId)) {
    return null;
  }

  const normalizedIntervention: AcpPermissionInterventionRequest =
    intervention || {
      id: interventionId,
      revision: 1,
      kind: 'approval',
      status: 'pending',
      sessionId: sessionId,
      source: 'acp_permission',
      engine: (eventData?._engine as any) || 'codex-cli',
      protocol: 'acp',
      callbackTarget: { kind: 'electron', targetId: '' },
      schemaRef: '',
      acp: {
        method: 'session/request_permission',
        request: {
          sessionId: sessionId,
          toolCall: {
            toolCallId: toolCallId,
            kind: toolCall?.kind,
            title: toolCall?.title,
            rawInput: toolCall?.raw_input ?? toolCall?.rawInput,
            status: toolCall?.status,
          },
          options: (options || []).map((o: any) => ({
            optionId: o.option_id ?? o.optionId,
            kind: o.kind,
            name: o.name,
          })),
        },
      },
      createdAt: Date.now(),
    };

  return {
    ...currentMessage,
    acpPermissionInteractions: [
      ...interactions,
      {
        intervention: normalizedIntervention,
        responseStatus: 'pending',
        triggeredAt: createInterventionTriggeredAt(),
      },
    ],
    status: currentMessage.status || MessageStatusEnum.Loading,
  };
}
