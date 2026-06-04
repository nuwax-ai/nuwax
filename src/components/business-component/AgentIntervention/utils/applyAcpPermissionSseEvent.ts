import { ConversationEventTypeEnum } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type {
  ConversationChatResponse,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';
import type { AcpPermissionInterventionRequest } from '../types/acpIntervention';
import { createInterventionTriggeredAt } from './interventionTrigger';
import {
  extractEventData,
  parseSseEventEnvelope,
} from './parseSseEventEnvelope';

function normalizeAcpEngine(
  raw: unknown,
): AcpPermissionInterventionRequest['engine'] {
  const value = typeof raw === 'string' ? raw : '';
  if (value === 'claude-code' || value === 'nuwaxcode' || value === 'codex') {
    return value;
  }
  return 'codex';
}

export function applyAcpPermissionSseEvent(
  res: ConversationChatResponse,
  currentMessage: MessageInfo,
): MessageInfo | null {
  const envelope = parseSseEventEnvelope(res);
  const subType = envelope.subType ?? envelope.sub_type;
  const eventData = extractEventData(envelope, res);
  const processingResult = eventData.result as
    | Record<string, unknown>
    | undefined;
  const processingInput = processingResult?.input as
    | Record<string, unknown>
    | undefined;

  const isAcpPermissionEvent =
    res.eventType === ConversationEventTypeEnum.ACP_REQUEST_PERMISSION ||
    ((envelope.message_type === 'acpRequestPermission' ||
      envelope.messageType === 'acpRequestPermission') &&
      (subType === 'AcpRequestPermission' ||
        subType === 'request_permission')) ||
    (res.eventType === ConversationEventTypeEnum.PROCESSING &&
      (eventData.subEventType === 'REQUEST_PERMISSION' ||
        !!processingInput?.request_permission_request));

  if (!isAcpPermissionEvent) {
    return null;
  }

  const reqPerm = (eventData.request_permission_request ??
    processingInput?.request_permission_request) as
    | Record<string, unknown>
    | undefined;
  const requestMeta = (processingInput?._meta ?? eventData._meta) as
    | Record<string, unknown>
    | undefined;
  const intervention = (eventData._intervention ??
    eventData.interventionRequest) as
    | AcpPermissionInterventionRequest
    | undefined;

  const sessionId =
    (reqPerm?.session_id as string) ||
    intervention?.sessionId ||
    (eventData.session_id as string);
  const toolCall = (reqPerm?.tool_call ??
    intervention?.acp?.request?.toolCall) as
    | Record<string, unknown>
    | undefined;
  const options = (reqPerm?.options ?? intervention?.acp?.request?.options) as
    | Array<Record<string, unknown>>
    | undefined;
  const toolCallId =
    (eventData.tool_call_id as string) ||
    (processingInput?.tool_call_id as string) ||
    (toolCall?.tool_call_id as string) ||
    (toolCall?.toolCallId as string);

  if ((!intervention?.id && !sessionId) || !toolCall) {
    return null;
  }

  const interventionId =
    intervention?.id ||
    (requestMeta?.nuwaclaw_intervention_id as string) ||
    `itv_${sessionId}_${toolCallId}`;
  const interactions = currentMessage.acpPermissionInteractions || [];
  if (interactions.some((item) => item.intervention.id === interventionId)) {
    return null;
  }

  const normalizedIntervention: AcpPermissionInterventionRequest =
    intervention || {
      id: interventionId,
      revision: (requestMeta?.nuwaclaw_revision as number) || 1,
      kind: 'approval',
      status: 'pending',
      sessionId: sessionId,
      source: 'acp_permission',
      engine: normalizeAcpEngine(eventData._engine),
      protocol: 'acp',
      callbackTarget: { kind: 'electron', targetId: '' },
      schemaRef: '',
      acp: {
        method: 'session/request_permission',
        request: {
          sessionId: sessionId,
          toolCall: {
            toolCallId: toolCallId,
            kind: toolCall?.kind as string,
            title: toolCall?.title as string,
            rawInput: toolCall?.raw_input ?? toolCall?.rawInput,
            status: toolCall?.status as string,
          },
          options: (options || []).map((o) => ({
            optionId: (o.option_id ?? o.optionId) as string,
            kind: o.kind as string,
            name: o.name as string,
          })),
        },
      },
      createdAt: (processingResult?.startTime as number) || Date.now(),
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
