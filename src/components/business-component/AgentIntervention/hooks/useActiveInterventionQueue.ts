import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { useMemo } from 'react';
import type { AcpPermissionInteraction } from '../types/acpIntervention';
import type { McpAskInteraction } from '../types/mcpAskIntervention';
import { hasMcpAskResumeMessage } from '../utils/mcpAskResumeMessage';

export type InterventionQueueKind = 'acp_permission' | 'mcp_ask';

export interface AcpInterventionQueueItem {
  kind: 'acp_permission';
  messageId: string;
  messageIndex: number;
  interaction: AcpPermissionInteraction;
  sortKey: number;
}

export interface McpAskInterventionQueueItem {
  kind: 'mcp_ask';
  messageId: string;
  messageIndex: number;
  interaction: McpAskInteraction;
  sortKey: number;
}

export type InterventionQueueItem =
  | AcpInterventionQueueItem
  | McpAskInterventionQueueItem;

function isActiveResponseStatus(status: string | undefined): boolean {
  const value = status ?? 'pending';
  // `failed` is terminal: once the user has responded, the card closes
  // regardless of whether the API call succeeded, so a failed approval no
  // longer pins the front of the dock and blocks later approvals. The error
  // itself is still surfaced via toast in respondAcpPermission.
  return value === 'pending' || value === 'submitting';
}

function readMcpAskRequestId(rawInput: unknown): string | undefined {
  if (!rawInput || typeof rawInput !== 'object') {
    return undefined;
  }
  const input = rawInput as Record<string, unknown>;
  return typeof input.requestId === 'string' && input.requestId
    ? input.requestId
    : undefined;
}

export function useActiveInterventionQueue(
  messageList: MessageInfo[],
): InterventionQueueItem[] {
  return useMemo(() => {
    const pending: InterventionQueueItem[] = [];
    const permissionPendingToolCallIds = new Set<string>();
    const permissionPendingAskRequestIds = new Set<string>();
    let fallbackSeq = 0;

    const messages = [...(messageList ?? [])].sort(
      (a, b) => (a.index ?? 0) - (b.index ?? 0),
    );

    // 仅渲染「最新一条消息」上的待审批项：一旦最新消息不再是审批类（来了新的普通消息），
    // queueItems 即为空，DockPanel 关闭。用「列表末尾元素」判定最新，而非 index——
    // 流式恢复/发送时的 assistant 占位消息没有 index，按 index 排序会被排到队首导致误判。
    const rawList = messageList ?? [];
    const latestMessage = rawList[rawList.length - 1];
    const latestMessageKey = latestMessage
      ? String(latestMessage.id ?? latestMessage.index)
      : null;

    messages.forEach((message) => {
      // 仅处理最新一条消息：旧消息上的残留 pending 审批不再顶住 DockPanel
      if (
        latestMessageKey !== null &&
        String(message.id ?? message.index) !== latestMessageKey
      ) {
        return;
      }
      message.acpPermissionInteractions?.forEach((interaction) => {
        if (!isActiveResponseStatus(interaction.responseStatus)) {
          return;
        }
        const toolCall = interaction.intervention.acp.request.toolCall;
        if (toolCall.toolCallId) {
          permissionPendingToolCallIds.add(toolCall.toolCallId);
        }
        const askRequestId = readMcpAskRequestId(toolCall.rawInput);
        if (askRequestId) {
          permissionPendingAskRequestIds.add(askRequestId);
        }
      });
    });

    messages.forEach((message) => {
      // 仅处理最新一条消息：旧消息上的残留 pending 审批不再顶住 DockPanel
      if (
        latestMessageKey !== null &&
        String(message.id ?? message.index) !== latestMessageKey
      ) {
        return;
      }
      const messageId = String(message.id ?? message.index);
      const messageIndex = message.index ?? 0;

      message.acpPermissionInteractions?.forEach((interaction) => {
        if (!isActiveResponseStatus(interaction.responseStatus)) {
          return;
        }
        const sortKey =
          interaction.triggeredAt ??
          interaction.intervention.createdAt ??
          fallbackSeq++;
        pending.push({
          kind: 'acp_permission',
          messageId,
          messageIndex,
          interaction,
          sortKey,
        });
      });

      message.mcpAskInteractions?.forEach((interaction) => {
        if (!isActiveResponseStatus(interaction.responseStatus)) {
          return;
        }
        if (hasMcpAskResumeMessage(messages, interaction)) {
          return;
        }
        if (
          permissionPendingToolCallIds.has(interaction.toolCallId) ||
          permissionPendingAskRequestIds.has(interaction.input.requestId)
        ) {
          return;
        }
        const sortKey = interaction.triggeredAt ?? fallbackSeq++;
        pending.push({
          kind: 'mcp_ask',
          messageId,
          messageIndex,
          interaction,
          sortKey,
        });
      });
    });

    return pending.sort((a, b) => a.sortKey - b.sortKey);
  }, [messageList]);
}
