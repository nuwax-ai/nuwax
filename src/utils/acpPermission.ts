import type {
  RcoderAcpPermissionInteraction,
  RcoderPermissionProgressData,
  RcoderPermissionToolCall,
} from '@/types/interfaces/acpPermission';

const isRecord = (value: unknown): value is Record<string, any> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const isRcoderPermissionProgressData = (
  value: unknown,
): value is RcoderPermissionProgressData => {
  if (!isRecord(value)) return false;

  const request = value.request_permission_request;
  if (!isRecord(request)) return false;

  const toolCall = request.tool_call;
  return (
    typeof request.session_id === 'string' &&
    !!request.session_id &&
    isRecord(toolCall) &&
    typeof toolCall.tool_call_id === 'string' &&
    !!toolCall.tool_call_id &&
    Array.isArray(request.options)
  );
};

const toSnakeCaseToolCall = (toolCall: Record<string, any>) =>
  ({
    tool_call_id: toolCall.tool_call_id ?? toolCall.toolCallId ?? '',
    kind: toolCall.kind ?? 'tool',
    status: toolCall.status ?? 'pending',
    title: toolCall.title ?? toolCall.kind ?? 'tool',
    content: Array.isArray(toolCall.content) ? toolCall.content : [],
    raw_input: toolCall.raw_input ?? toolCall.rawInput ?? {},
    _meta: toolCall._meta ?? {},
  } as RcoderPermissionToolCall);

const normalizeLegacyAcpData = (
  value: unknown,
): RcoderPermissionProgressData | null => {
  if (!isRecord(value)) return null;

  const request = value.acp?.request;
  if (!isRecord(request)) return null;

  const toolCall = isRecord(request.toolCall) ? request.toolCall : {};
  const sessionId = request.sessionId;
  const toolCallId = toolCall.toolCallId;
  if (typeof sessionId !== 'string' || typeof toolCallId !== 'string') {
    return null;
  }

  return {
    request_permission_request: {
      session_id: sessionId,
      tool_call: toSnakeCaseToolCall(toolCall),
      options: Array.isArray(request.options)
        ? request.options.map((option: Record<string, any>) => ({
            option_id: option.option_id ?? option.optionId ?? '',
            name: option.name ?? option.optionId ?? '',
            kind: option.kind ?? 'allow_once',
            _meta: option._meta ?? {},
          }))
        : [],
      _meta: request._meta ?? {},
    },
    tool_call_id: toolCallId,
    _meta: {
      nuwax_intervention_id: value.id,
      nuwax_revision: value.revision,
    },
  };
};

export const getRcoderPermissionInteractionId = (
  permission: RcoderPermissionProgressData,
): string => {
  const request = permission.request_permission_request;
  return `${request.session_id}:${request.tool_call.tool_call_id}`;
};

export const normalizeAcpPermissionProgressMessage = (
  message: unknown,
): RcoderAcpPermissionInteraction | null => {
  if (!isRecord(message)) return null;

  const messageType = message.messageType ?? message.message_type;
  const subType = message.subType ?? message.sub_type;
  if (
    messageType !== 'acpRequestPermission' ||
    (subType !== 'request_permission' &&
      subType !== 'session/request_permission')
  ) {
    return null;
  }

  const data = message.data;
  const permission = isRcoderPermissionProgressData(data)
    ? data
    : normalizeLegacyAcpData(data);

  if (!permission) return null;

  return {
    id: getRcoderPermissionInteractionId(permission),
    permission,
    responseStatus: 'pending',
  };
};
