import { ProcessingEnum } from '@/types/enums/common';
import type {
  MessageInfo,
  ProcessingInfo,
} from '@/types/interfaces/conversationInfo';
import type { AcpPermissionInteraction } from '../types/acpIntervention';
import type { McpAskInteraction } from '../types/mcpAskIntervention';
import { hasMcpAskResumeMessage } from './mcpAskResumeMessage';

function readMcpAskRequestId(rawInput: unknown): string | undefined {
  if (!rawInput || typeof rawInput !== 'object') {
    return undefined;
  }
  const input = rawInput as Record<string, unknown>;
  return typeof input.requestId === 'string' && input.requestId
    ? input.requestId
    : undefined;
}

function getToolCallId(
  interaction: AcpPermissionInteraction,
): string | undefined {
  return interaction.intervention.acp?.request?.toolCall?.toolCallId;
}

function isProcessingFinishedForTool(
  processingList: ProcessingInfo[] | undefined,
  toolCallId: string,
  permissionExecuteId?: string,
): boolean {
  if (!processingList?.length) {
    return false;
  }

  for (const item of processingList) {
    if (item.status !== ProcessingEnum.FINISHED) {
      continue;
    }

    if (permissionExecuteId && item.executeId === permissionExecuteId) {
      return true;
    }
    if (item.executeId === toolCallId) {
      return true;
    }

    const result = item.result as Record<string, unknown> | null | undefined;
    const input = (result?.input ?? undefined) as
      | Record<string, unknown>
      | undefined;
    if (input) {
      const matchedId = input.toolCallId ?? input.tool_call_id;
      if (matchedId === toolCallId) {
        return true;
      }
    }
  }

  return false;
}

function buildMcpAskInteractionFromRawInput(
  rawInput: unknown,
  toolCallId: string,
): McpAskInteraction | null {
  if (!rawInput || typeof rawInput !== 'object') {
    return null;
  }
  const input = rawInput as Record<string, unknown>;
  const requestId = readMcpAskRequestId(rawInput);
  const title = typeof input.title === 'string' ? input.title : undefined;
  const ui = input.ui;
  if (!requestId || !title || !ui || typeof ui !== 'object') {
    return null;
  }

  return {
    input: {
      toolName: 'nuwax_ask_question',
      schemaVersion: 'nuwax.mcp_ask.v2',
      requestId,
      revision: 1,
      sessionId: '',
      title,
      ui: ui as McpAskInteraction['input']['ui'],
    },
    toolCallId,
    responseStatus: 'pending',
  };
}

function shouldMarkAcpPermissionSubmitted(
  interaction: AcpPermissionInteraction,
  message: MessageInfo,
  contextMessageList: MessageInfo[],
): boolean {
  const status = interaction.responseStatus ?? 'pending';
  if (status === 'submitted' || status === 'failed') {
    return false;
  }

  const toolCallId = getToolCallId(interaction);
  if (
    toolCallId &&
    isProcessingFinishedForTool(
      message.processingList,
      toolCallId,
      interaction.executeId,
    )
  ) {
    return true;
  }

  const rawInput = interaction.intervention.acp?.request?.toolCall?.rawInput;
  if (toolCallId && readMcpAskRequestId(rawInput)) {
    const syntheticAsk = buildMcpAskInteractionFromRawInput(
      rawInput,
      toolCallId,
    );
    if (
      syntheticAsk &&
      hasMcpAskResumeMessage(contextMessageList, syntheticAsk)
    ) {
      return true;
    }
  }

  return false;
}

/**
 * 根据 processingList 完成态与 MCP Ask resume 消息，将已解决的 ACP 审批标为 submitted。
 * 用于 sub 流重放、跨页签审批后自动关闭对应卡片。
 */
export function reconcileMessageAcpPermissionStatuses(
  message: MessageInfo,
  contextMessageList?: MessageInfo[],
): MessageInfo {
  const interactions = message.acpPermissionInteractions;
  if (!interactions?.length) {
    return message;
  }

  const context = contextMessageList ?? [message];
  let changed = false;
  const nextInteractions = interactions.map((interaction) => {
    if (
      !shouldMarkAcpPermissionSubmitted(
        interaction as AcpPermissionInteraction,
        message,
        context,
      )
    ) {
      return interaction;
    }
    changed = true;
    return {
      ...interaction,
      responseStatus: 'submitted' as const,
    };
  });

  if (!changed) {
    return message;
  }

  return {
    ...message,
    acpPermissionInteractions: nextInteractions,
  };
}

export function reconcileAcpPermissionStatusesInMessageList(
  messageList: MessageInfo[],
): MessageInfo[] {
  return messageList.map((message) =>
    reconcileMessageAcpPermissionStatuses(message, messageList),
  );
}

/** notify-resolved 幂等：Host 侧 pending 已不存在时视为已审批成功 */
export function isIdempotentAcpPermissionResolveError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const normalized = message.toLowerCase();
  return (
    normalized.includes('not_found') ||
    normalized.includes('not found') ||
    normalized.includes('already_resolved') ||
    normalized.includes('already resolved') ||
    normalized.includes('permission not found') ||
    normalized.includes('err_permission_not_found') ||
    normalized.includes('gone')
  );
}
